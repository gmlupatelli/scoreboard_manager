import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { type AppreciationTier, type BillingInterval } from '@/lib/subscription/tiers';
import { pricingService } from '@/services/pricingService';
import { mapVariantToTierAndInterval } from '@/lib/lemonsqueezy/variantMapping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

interface LinkRequestBody {
  lemonSqueezySubscriptionId: string;
  override?: boolean;
}

/**
 * POST /api/admin/subscriptions/[userId]/link
 * Link a LemonSqueezy subscription to a user account (admin only)
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
    const body: LinkRequestBody = await request.json();
    const { lemonSqueezySubscriptionId, override = false } = body;

    if (!lemonSqueezySubscriptionId) {
      return NextResponse.json(
        { error: 'LemonSqueezy subscription ID is required' },
        { status: 400 }
      );
    }

    // 4. Use service role client to bypass RLS
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 5. Get target user info
    const { data: targetUser, error: userError } = await serviceClient
      .from('user_profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 6. Fetch subscription from LemonSqueezy API to verify and get details
    const lemonSqueezyApiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!lemonSqueezyApiKey) {
      return NextResponse.json({ error: 'LemonSqueezy API key not configured' }, { status: 500 });
    }

    const lsResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezySubscriptionId}`,
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
    const lsSubscription = lsData.data;
    const lsAttributes = lsSubscription.attributes;

    // 7. Verify email match unless override is set
    const customerEmail = lsAttributes.user_email;
    if (!override && customerEmail.toLowerCase() !== targetUser.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: 'Email mismatch',
          details: {
            userEmail: targetUser.email,
            subscriptionEmail: customerEmail,
            message:
              'LemonSqueezy subscription email does not match user email. Set override=true to force link.',
          },
        },
        { status: 400 }
      );
    }

    // 8. Check if subscription is already linked to another user
    const { data: existingLink } = await serviceClient
      .from('subscriptions')
      .select('user_id')
      .eq('lemonsqueezy_subscription_id', lemonSqueezySubscriptionId)
      .maybeSingle();

    if (existingLink && existingLink.user_id !== userId) {
      return NextResponse.json(
        {
          error: 'Subscription already linked to another user',
          details: { linkedUserId: existingLink.user_id },
        },
        { status: 400 }
      );
    }

    // 9. Map LemonSqueezy variant to tier using shared variant mapping
    const variantId = lsAttributes.variant_id?.toString();

    const mapVariantToTierInfo = (
      vid: string | undefined
    ): { tier: AppreciationTier; billingInterval: BillingInterval } => {
      if (!vid) return { tier: 'supporter', billingInterval: 'monthly' };
      const result = mapVariantToTierAndInterval(vid);
      if (!result) return { tier: 'supporter', billingInterval: 'monthly' };
      return { tier: result.tier, billingInterval: result.interval };
    };

    const { tier, billingInterval } = mapVariantToTierInfo(variantId);

    // 10. Upsert subscription record
    const now = new Date().toISOString();

    // Calculate amount: prefer LemonSqueezy price, fall back to DB tier_pricing
    const lsLinkPrice = lsAttributes.first_subscription_item?.price as number | undefined;
    let linkAmountCents = lsLinkPrice;
    if (!linkAmountCents) {
      const { data: dbPriceCents } = await pricingService.getPriceCents(tier, billingInterval);
      linkAmountCents = dbPriceCents ?? 0;
    }

    const subscriptionData = {
      user_id: userId,
      lemonsqueezy_subscription_id: lemonSqueezySubscriptionId,
      lemonsqueezy_customer_id: lsAttributes.customer_id?.toString(),
      lemonsqueezy_order_id: lsAttributes.order_id?.toString(),
      lemonsqueezy_product_id: lsAttributes.product_id?.toString(),
      lemonsqueezy_variant_id: variantId,
      status: lsAttributes.status,
      status_formatted: lsAttributes.status_formatted,
      billing_interval: billingInterval,
      // Use price from LemonSqueezy if available, otherwise from DB
      amount_cents: linkAmountCents,
      currency: lsAttributes.first_subscription_item?.currency || 'USD',
      tier,
      card_brand: lsAttributes.card_brand,
      card_last_four: lsAttributes.card_last_four,
      current_period_start: lsAttributes.renews_at
        ? new Date(lsAttributes.created_at).toISOString()
        : null,
      current_period_end: lsAttributes.renews_at,
      cancelled_at: lsAttributes.cancelled ? lsAttributes.ends_at : null,
      customer_portal_url: lsAttributes.urls?.customer_portal,
      update_payment_method_url: lsAttributes.urls?.update_payment_method,
      customer_portal_update_subscription_url:
        lsAttributes.urls?.customer_portal_update_subscription,
      is_gifted: false,
      gifted_expires_at: null,
      test_mode: lsAttributes.test_mode || false,
    };

    // Check if user already has a subscription record
    const { data: existingSub } = await serviceClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await serviceClient
        .from('subscriptions')
        .update({ ...subscriptionData, updated_at: now } as never)
        .eq('id', existingSub.id);

      if (updateError) {
        console.error('Failed to update subscription:', updateError);
        return NextResponse.json(
          { error: `Failed to update subscription: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Insert new subscription - set both timestamps to same value
      const { error: insertError } = await serviceClient
        .from('subscriptions')
        .insert({ ...subscriptionData, created_at: now, updated_at: now } as never);

      if (insertError) {
        console.error('Failed to insert subscription:', insertError);
        return NextResponse.json(
          { error: `Failed to create subscription: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // 11. Log admin action
    await serviceClient.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'link_subscription',
      target_user_id: userId,
      details: {
        lemonsqueezy_subscription_id: lemonSqueezySubscriptionId,
        user_email: targetUser.email,
        subscription_email: customerEmail,
        email_override_used:
          override && customerEmail.toLowerCase() !== targetUser.email.toLowerCase(),
        tier,
        billing_interval: billingInterval,
        status: lsAttributes.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription linked successfully',
      subscription: {
        tier,
        billingInterval,
        status: lsAttributes.status,
        customerEmail,
      },
    });
  } catch (error) {
    console.error('Admin link subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
