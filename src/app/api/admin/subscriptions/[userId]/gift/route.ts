import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

interface GiftRequestBody {
  expiresAt?: string | null;
}

/**
 * POST /api/admin/subscriptions/[userId]/gift
 * Gift appreciation tier to a user (admin only)
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

    // 3. Parse request body
    const body: GiftRequestBody = await request.json().catch(() => ({}));
    const { expiresAt } = body;

    // Validate expiresAt if provided
    if (expiresAt) {
      const expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expiration date format' }, { status: 400 });
      }
      if (expiresDate <= new Date()) {
        return NextResponse.json(
          { error: 'Expiration date must be in the future' },
          { status: 400 }
        );
      }
    }

    // 4. Use service role client to bypass RLS
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 5. Get target user info
    const { data: targetUser, error: userError } = await serviceClient
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot gift to admin users
    if (targetUser.role === 'system_admin') {
      return NextResponse.json(
        { error: 'Cannot gift appreciation tier to admin users' },
        { status: 400 }
      );
    }

    // 6. Check if user already has an active paid subscription
    const { data: existingSub } = await serviceClient
      .from('subscriptions')
      .select('id, status, is_gifted, lemonsqueezy_subscription_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingSub &&
      (existingSub.status === 'active' || existingSub.status === 'trialing') &&
      !existingSub.is_gifted
    ) {
      return NextResponse.json(
        {
          error:
            'User already has an active paid subscription. Cancel it first or wait for it to expire.',
          details: { currentStatus: existingSub.status },
        },
        { status: 400 }
      );
    }

    // 7. Create or update subscription with gifted appreciation tier
    const now = new Date().toISOString();
    const subscriptionData = {
      user_id: userId,
      status: 'active' as const,
      status_formatted: 'Active (Gifted)',
      tier: 'appreciation' as const,
      billing_interval: 'monthly' as const, // Default for gifted
      amount_cents: 0,
      currency: 'USD',
      is_gifted: true,
      gifted_expires_at: expiresAt || null,
      lemonsqueezy_subscription_id: null,
      lemonsqueezy_customer_id: null,
      lemonsqueezy_order_id: null,
      lemonsqueezy_product_id: null,
      lemonsqueezy_variant_id: null,
      customer_portal_url: null,
      update_payment_method_url: null,
      customer_portal_update_subscription_url: null,
      card_brand: null,
      card_last_four: null,
      current_period_start: now,
      current_period_end: expiresAt || null,
      cancelled_at: null,
      test_mode: false,
      created_at: now,
      updated_at: now,
    };

    if (existingSub) {
      // Update existing subscription (exclude created_at to preserve original)
      const { created_at: _created_at, ...updateData } = subscriptionData;
      const { error: updateError } = await serviceClient
        .from('subscriptions')
        .update(updateData as never)
        .eq('id', existingSub.id);

      if (updateError) {
        console.error('Failed to update subscription for gift:', updateError);
        return NextResponse.json(
          { error: `Failed to gift appreciation tier: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Insert new subscription
      const { error: insertError } = await serviceClient
        .from('subscriptions')
        .insert(subscriptionData as never);

      if (insertError) {
        console.error('Failed to insert subscription for gift:', insertError);
        return NextResponse.json(
          { error: `Failed to gift appreciation tier: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // 8. Log admin action
    await serviceClient.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'gift_appreciation_tier',
      target_user_id: userId,
      details: {
        user_email: targetUser.email,
        expires_at: expiresAt || 'never',
        had_existing_subscription: !!existingSub,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appreciation tier gifted successfully',
      expiresAt: expiresAt || null,
    });
  } catch (error) {
    console.error('Admin gift appreciation tier API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/subscriptions/[userId]/gift
 * Remove gifted appreciation tier from a user (admin only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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
      .select('id, is_gifted, tier')
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

    if (!subscription.is_gifted) {
      return NextResponse.json(
        { error: 'User does not have a gifted subscription' },
        { status: 400 }
      );
    }

    // 5. Get user email for audit log
    const { data: targetUser } = await serviceClient
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // 6. Delete the gifted subscription record
    await serviceClient.from('subscriptions').delete().eq('id', subscription.id);

    // 7. Log admin action
    await serviceClient.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'remove_appreciation_tier',
      target_user_id: userId,
      details: {
        user_email: targetUser?.email,
        removed_tier: subscription.tier,
        subscription_id: subscription.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appreciation tier removed successfully',
    });
  } catch (error) {
    console.error('Admin remove appreciation tier API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
