import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/admin/subscriptions/[userId]
 * Get a specific user's subscription details (admin only)
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    // 4. Get user profile
    const { data: targetUser, error: userError } = await serviceClient
      .from('user_profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 5. Get user's subscription
    const { data: subscription } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 6. Get payment history
    const { data: payments } = await serviceClient
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.full_name,
        role: targetUser.role,
        createdAt: targetUser.created_at,
      },
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
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelledAt: subscription.cancelled_at,
            lemonsqueezySubscriptionId: subscription.lemonsqueezy_subscription_id,
            lemonsqueezyCustomerId: subscription.lemonsqueezy_customer_id,
            customerPortalUrl: subscription.customer_portal_url,
            updatePaymentMethodUrl: subscription.update_payment_method_url,
            cardBrand: subscription.card_brand,
            cardLastFour: subscription.card_last_four,
            createdAt: subscription.created_at,
            updatedAt: subscription.updated_at,
          }
        : null,
      payments: (payments || []).map((p) => ({
        id: p.id,
        orderNumber: p.lemonsqueezy_order_number,
        status: p.status,
        statusFormatted: p.status_formatted,
        totalCents: p.total_cents,
        currency: p.currency,
        createdAt: p.created_at,
        receiptUrl: p.receipt_url,
        productName: p.order_item_product_name,
        variantName: p.order_item_variant_name,
      })),
    });
  } catch (error) {
    console.error('Admin subscription detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
