import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { type AppreciationTier, type BillingInterval } from '@/lib/subscription/tiers';
import { pricingService } from '@/services/pricingService';
import { mapVariantToTierAndInterval } from '@/lib/lemonsqueezy/variantMapping';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

interface RouteContext {
  params: Promise<{ userId: string }>;
}

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

// mapVariantToTierInfo uses the shared variant mapping module
const mapVariantToTierInfo = (
  vid: string | undefined
): { tier: AppreciationTier; billingInterval: BillingInterval } | null => {
  if (!vid) return null;
  const result = mapVariantToTierAndInterval(vid);
  if (!result) return null;
  return { tier: result.tier, billingInterval: result.interval };
};

/**
 * POST /api/admin/subscriptions/[userId]/refetch
 * Refetch subscription data from LemonSqueezy API and update local DB (admin only)
 * Useful when webhooks fail to update user subscription/tier correctly
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

    // 4. Get user's existing subscription
    const { data: subscription, error: subError } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return NextResponse.json(
        { error: `Failed to fetch local subscription: ${subError.message}` },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found for this user' }, { status: 404 });
    }

    if (subscription.is_gifted) {
      return NextResponse.json(
        { error: 'Cannot refetch gifted subscriptions from LemonSqueezy' },
        { status: 400 }
      );
    }

    if (!subscription.lemonsqueezy_subscription_id) {
      return NextResponse.json(
        { error: 'No LemonSqueezy subscription ID linked to this user' },
        { status: 400 }
      );
    }

    // 5. Fetch latest data from LemonSqueezy API
    const lemonSqueezyApiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!lemonSqueezyApiKey) {
      return NextResponse.json({ error: 'LemonSqueezy API key not configured' }, { status: 500 });
    }

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
      if (lsResponse.status === 404) {
        return NextResponse.json({ error: 'LemonSqueezy subscription not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch subscription from LemonSqueezy' },
        { status: 500 }
      );
    }

    const lsData = await lsResponse.json();
    const lsAttributes = lsData.data?.attributes;

    if (!lsAttributes) {
      return NextResponse.json(
        { error: 'Invalid response from LemonSqueezy API' },
        { status: 500 }
      );
    }

    // 6. Map variant to tier/interval
    const variantId = lsAttributes.variant_id?.toString();
    const tierInfo = mapVariantToTierInfo(variantId);

    // Fallback to existing values if variant is unrecognized
    const tier = tierInfo?.tier ?? (subscription.tier as AppreciationTier);
    const billingInterval =
      tierInfo?.billingInterval ?? (subscription.billing_interval as BillingInterval);

    // 7. Build update data
    const status = normalizeStatus(lsAttributes.status || subscription.status);
    const now = new Date().toISOString();

    // Calculate amount_cents: prefer LemonSqueezy price, fall back to DB tier_pricing
    const lsItemPrice = lsAttributes.first_subscription_item?.price as number | undefined;
    let amountCentsForUpdate = lsItemPrice;
    if (amountCentsForUpdate == null) {
      const { data: dbPriceCents } = await pricingService.getPriceCents(tier, billingInterval);
      amountCentsForUpdate = dbPriceCents ?? 0;
    }

    const updateData = {
      lemonsqueezy_customer_id:
        lsAttributes.customer_id?.toString() ?? subscription.lemonsqueezy_customer_id,
      lemonsqueezy_order_id:
        lsAttributes.order_id?.toString() ?? subscription.lemonsqueezy_order_id,
      lemonsqueezy_product_id:
        lsAttributes.product_id?.toString() ?? subscription.lemonsqueezy_product_id,
      lemonsqueezy_variant_id: variantId ?? subscription.lemonsqueezy_variant_id,
      status,
      status_formatted: lsAttributes.status_formatted ?? subscription.status_formatted,
      billing_interval: billingInterval,
      amount_cents: amountCentsForUpdate,
      currency: lsAttributes.first_subscription_item?.currency ?? subscription.currency ?? 'USD',
      tier,
      card_brand: lsAttributes.card_brand ?? subscription.card_brand,
      card_last_four: lsAttributes.card_last_four ?? subscription.card_last_four,
      current_period_start: lsAttributes.created_at ?? subscription.current_period_start,
      current_period_end: lsAttributes.renews_at ?? subscription.current_period_end,
      cancelled_at: lsAttributes.cancelled ? lsAttributes.ends_at : null,
      customer_portal_url: lsAttributes.urls?.customer_portal ?? subscription.customer_portal_url,
      update_payment_method_url:
        lsAttributes.urls?.update_payment_method ?? subscription.update_payment_method_url,
      customer_portal_update_subscription_url:
        lsAttributes.urls?.customer_portal_update_subscription ??
        subscription.customer_portal_update_subscription_url,
      payment_processor: lsAttributes.payment_processor ?? subscription.payment_processor,
      test_mode: lsAttributes.test_mode ?? subscription.test_mode,
      updated_at: now,
    };

    // 8. Update subscription in DB
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update(updateData as never)
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return NextResponse.json(
        { error: `Failed to update subscription: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 9. Log admin action
    await serviceClient.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'refetch_subscription',
      target_user_id: userId,
      details: {
        lemonsqueezy_subscription_id: subscription.lemonsqueezy_subscription_id,
        previous_status: subscription.status,
        new_status: status,
        previous_tier: subscription.tier,
        new_tier: tier,
        previous_billing_interval: subscription.billing_interval,
        new_billing_interval: billingInterval,
      },
    });

    // 10. Fetch updated subscription to return
    const { data: updatedSub } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Subscription data refetched and updated successfully',
      subscription: updatedSub
        ? {
            id: updatedSub.id,
            status: updatedSub.status,
            statusFormatted: updatedSub.status_formatted,
            tier: updatedSub.tier,
            billingInterval: updatedSub.billing_interval,
            amountCents: updatedSub.amount_cents,
            currency: updatedSub.currency,
            isGifted: updatedSub.is_gifted,
            giftedExpiresAt: updatedSub.gifted_expires_at,
            currentPeriodEnd: updatedSub.current_period_end,
            lemonsqueezySubscriptionId: updatedSub.lemonsqueezy_subscription_id,
            createdAt: updatedSub.created_at,
            updatedAt: updatedSub.updated_at,
          }
        : null,
    });
  } catch (error) {
    console.error('Admin refetch subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
