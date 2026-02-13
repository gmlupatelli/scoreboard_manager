import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { type AppreciationTier, type BillingInterval } from '@/lib/subscription/tiers';
import { pricingService } from '@/services/pricingService';
import { mapVariantToTierAndInterval } from '@/lib/lemonsqueezy/variantMapping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VerifyLinkRequestBody {
  lemonSqueezySubscriptionId: string;
}

/**
 * POST /api/admin/subscriptions/verify-link
 * Verify a LemonSqueezy subscription before linking (admin only)
 * Returns subscription details including customer email for verification
 */
export async function POST(request: NextRequest) {
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

    // 3. Parse request body
    const body: VerifyLinkRequestBody = await request.json();
    const { lemonSqueezySubscriptionId } = body;

    if (!lemonSqueezySubscriptionId) {
      return NextResponse.json(
        { error: 'LemonSqueezy subscription ID is required' },
        { status: 400 }
      );
    }

    // 4. Fetch subscription from LemonSqueezy API
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

    // 5. Check if already linked to a user
    const serviceClient = getServiceRoleClient();
    let linkedUser = null;

    if (serviceClient) {
      const { data: existingLink } = await serviceClient
        .from('subscriptions')
        .select(
          `
          user_id,
          user_profiles!subscriptions_user_id_fkey (
            email,
            full_name
          )
        `
        )
        .eq('lemonsqueezy_subscription_id', lemonSqueezySubscriptionId)
        .maybeSingle();

      if (existingLink) {
        // Handle Supabase join results - can be object or array depending on query
        const profileData = existingLink.user_profiles;
        const userProfile = Array.isArray(profileData)
          ? (profileData[0] as { email: string; full_name: string | null } | undefined)
          : (profileData as { email: string; full_name: string | null } | null);
        linkedUser = {
          userId: existingLink.user_id,
          email: userProfile?.email,
          fullName: userProfile?.full_name,
        };
      }
    }

    // 6. Map variant to tier info using shared variant mapping
    const variantId = lsAttributes.variant_id?.toString();

    const mapVariantToTierInfo = (
      vid: string | undefined
    ): { tier: AppreciationTier; billingInterval: BillingInterval } => {
      if (!vid) return { tier: 'supporter', billingInterval: 'monthly' };
      const result = mapVariantToTierAndInterval(vid);
      if (!result) return { tier: 'supporter', billingInterval: 'monthly' };
      return { tier: result.tier, billingInterval: result.interval };
    };

    const tierInfo = mapVariantToTierInfo(variantId);

    // Calculate amount - use LemonSqueezy price if available, otherwise from DB
    const lsAmountCents = lsAttributes.first_subscription_item?.price as number | undefined;
    let amountCents = lsAmountCents;
    if (!amountCents) {
      const { data: dbPriceCents } = await pricingService.getPriceCents(
        tierInfo.tier,
        tierInfo.billingInterval
      );
      amountCents = dbPriceCents ?? 0;
    }

    return NextResponse.json({
      subscription: {
        id: lemonSqueezySubscriptionId,
        customerEmail: lsAttributes.user_email,
        customerName: lsAttributes.user_name,
        status: lsAttributes.status,
        statusFormatted: lsAttributes.status_formatted,
        tier: tierInfo.tier,
        billingInterval: tierInfo.billingInterval,
        amountCents,
        currency: lsAttributes.first_subscription_item?.currency || 'USD',
        renewsAt: lsAttributes.renews_at,
        endsAt: lsAttributes.ends_at,
        cancelled: lsAttributes.cancelled,
        testMode: lsAttributes.test_mode,
        createdAt: lsAttributes.created_at,
      },
      alreadyLinked: !!linkedUser,
      linkedUser,
    });
  } catch (error) {
    console.error('Admin verify link API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
