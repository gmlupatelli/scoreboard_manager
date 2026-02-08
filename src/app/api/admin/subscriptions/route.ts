import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    let filteredUsers = (users as UserWithSubscription[]).map((user) => {
      // Get the latest subscription if any
      const subscription = user.subscriptions?.[0] || null;
      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              statusFormatted: subscription.status_formatted,
              tier: subscription.tier,
              billingInterval: subscription.billing_interval,
              amountCents: subscription.amount_cents,
              currency: subscription.currency,
              isGifted: subscription.is_gifted,
              giftedExpiresAt: subscription.gifted_expires_at,
              currentPeriodEnd: subscription.current_period_end,
              lemonsqueezySubscriptionId: subscription.lemonsqueezy_subscription_id,
              createdAt: subscription.created_at,
              updatedAt: subscription.updated_at,
            }
          : null,
      };
    });

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
