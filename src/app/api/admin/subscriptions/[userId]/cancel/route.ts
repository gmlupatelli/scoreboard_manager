import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * POST /api/admin/subscriptions/[userId]/cancel
 * Cancel a user's subscription via LemonSqueezy API (admin only)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;

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

    // 3. Use service role client to bypass RLS
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 4. Get user's subscription
    const { data: subscription, error: subError } = await serviceClient
      .from('subscriptions')
      .select('id, lemonsqueezy_subscription_id, status, is_gifted')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found for this user' }, { status: 404 });
    }

    // 5. Handle gifted subscriptions (no LemonSqueezy to cancel)
    if (subscription.is_gifted) {
      return NextResponse.json(
        {
          error: 'Cannot cancel a gifted subscription. Use the remove gift endpoint instead.',
        },
        { status: 400 }
      );
    }

    // 6. Check if there's a LemonSqueezy subscription to cancel
    if (!subscription.lemonsqueezy_subscription_id) {
      return NextResponse.json(
        {
          error: 'No LemonSqueezy subscription linked to this account',
        },
        { status: 400 }
      );
    }

    // 7. Cancel subscription via LemonSqueezy API
    const lemonSqueezyApiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!lemonSqueezyApiKey) {
      return NextResponse.json({ error: 'LemonSqueezy API key not configured' }, { status: 500 });
    }

    const cancelResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${lemonSqueezyApiKey}`,
        },
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json().catch(() => ({}));
      console.error('LemonSqueezy cancel error:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to cancel subscription in LemonSqueezy',
        },
        { status: 500 }
      );
    }

    // 8. Update local subscription status
    await serviceClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        status_formatted: 'Cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // 9. Get user email for audit log
    const { data: targetUser } = await serviceClient
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // 10. Log admin action
    await serviceClient.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'cancel_subscription',
      target_user_id: userId,
      details: {
        subscription_id: subscription.id,
        lemonsqueezy_subscription_id: subscription.lemonsqueezy_subscription_id,
        user_email: targetUser?.email,
        cancelled_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Admin cancel subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
