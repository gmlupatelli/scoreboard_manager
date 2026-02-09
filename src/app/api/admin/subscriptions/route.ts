import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

type LemonSqueezySubscriptionResponse = {
  data?: {
    attributes?: Record<string, unknown>;
  };
};

const getString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const normalizeStatus = (status: string): SubscriptionStatus => {
  switch (status) {
    case 'on_trial':
      return 'trialing';
    case 'active':
    case 'paused':
    case 'past_due':
    case 'expired':
    case 'cancelled':
    case 'unpaid':
      return status;
    default:
      return 'active';
  }
};

/**
 * GET /api/admin/subscriptions
 * List all subscriptions with user info (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate token
    const token = extractBearerToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get authenticated user and verify admin role
    const authClient = getAuthClient(token);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is system admin
    const { data: profile } = await authClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // 4. Use service role client to bypass RLS for admin operations
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 5. Build query for users with optional subscription data
    let query = serviceClient
      .from('user_profiles')
      .select(
        `
        id,
        email,
        full_name,
        role,
        created_at,
        subscriptions (
          id,
          status,
          status_formatted,
          tier,
          billing_interval,
          amount_cents,
          currency,
          is_gifted,
          gifted_expires_at,
          current_period_end,
          lemonsqueezy_subscription_id,
          created_at,
          updated_at
        )
      `,
        { count: 'exact' }
      )
      .neq('role', 'system_admin'); // Exclude admin users

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 6. Transform and filter results based on subscription status
    type UserWithSubscription = {
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      created_at: string;
      subscriptions: Array<{
        id: string;
        status: string;
        status_formatted: string | null;
        tier: string;
        billing_interval: string;
        amount_cents: number;
        currency: string;
        is_gifted: boolean;
        gifted_expires_at: string | null;
        current_period_end: string | null;
        lemonsqueezy_subscription_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
    };

    const lemonSqueezyApiKey = process.env.LEMONSQUEEZY_API_KEY;

    const getLatestSubscription = (
      subscriptions: UserWithSubscription['subscriptions']
    ): UserWithSubscription['subscriptions'][number] | null => {
      if (!subscriptions || subscriptions.length === 0) return null;
      return [...subscriptions].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
    };

    const syncSubscriptionStatus = async (
      subscription: UserWithSubscription['subscriptions'][number] | null
    ): Promise<UserWithSubscription['subscriptions'][number] | null> => {
      if (!subscription || subscription.is_gifted) return subscription;
      if (!lemonSqueezyApiKey || !subscription.lemonsqueezy_subscription_id) {
        return subscription;
      }

      try {
        const lsResponse = await fetch(
          `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_subscription_id}`,
          {
            headers: {
              Accept: 'application/vnd.api+json',
              Authorization: `Bearer ${lemonSqueezyApiKey}`,
            },
          }
        );

        if (!lsResponse.ok) {
          return subscription;
        }

        const lsData = (await lsResponse.json()) as LemonSqueezySubscriptionResponse;
        const lsAttributes = lsData.data?.attributes ?? {};
        const statusRaw = getString(lsAttributes.status) ?? subscription.status;
        const status = normalizeStatus(statusRaw);
        const statusFormatted =
          getString(lsAttributes.status_formatted) ?? subscription.status_formatted;

        if (status !== subscription.status || statusFormatted !== subscription.status_formatted) {
          await serviceClient
            .from('subscriptions')
            .update({
              status,
              status_formatted: statusFormatted,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);
        }

        return {
          ...subscription,
          status,
          status_formatted: statusFormatted,
        };
      } catch (_error) {
        return subscription;
      }
    };

    const usersWithLatestSubscription = await Promise.all(
      (users as UserWithSubscription[]).map(async (user) => {
        const latestSubscription = getLatestSubscription(user.subscriptions);
        const syncedSubscription = await syncSubscriptionStatus(latestSubscription);

        return {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          createdAt: user.created_at,
          subscription: syncedSubscription
            ? {
                id: syncedSubscription.id,
                status: syncedSubscription.status,
                statusFormatted: syncedSubscription.status_formatted,
                tier: syncedSubscription.tier,
                billingInterval: syncedSubscription.billing_interval,
                amountCents: syncedSubscription.amount_cents,
                currency: syncedSubscription.currency,
                isGifted: syncedSubscription.is_gifted,
                giftedExpiresAt: syncedSubscription.gifted_expires_at,
                currentPeriodEnd: syncedSubscription.current_period_end,
                lemonsqueezySubscriptionId: syncedSubscription.lemonsqueezy_subscription_id,
                createdAt: syncedSubscription.created_at,
                updatedAt: syncedSubscription.updated_at,
              }
            : null,
        };
      })
    );

    let filteredUsers = usersWithLatestSubscription;

    // Apply filter
    if (filter !== 'all') {
      filteredUsers = filteredUsers.filter((user) => {
        const sub = user.subscription;
        switch (filter) {
          case 'active':
            return sub && (sub.status === 'active' || sub.status === 'trialing') && !sub.isGifted;
          case 'cancelled':
            return sub && sub.status === 'cancelled';
          case 'appreciation':
            return sub && sub.isGifted && sub.tier === 'appreciation';
          case 'free':
            return !sub || (sub.status !== 'active' && sub.status !== 'trialing' && !sub.isGifted);
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
