import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { Database } from '@/types/database.types';
import { getTierPrice } from '@/lib/subscription/tiers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

type AppreciationTier = Database['public']['Enums']['appreciation_tier'];
type BillingInterval = Database['public']['Enums']['billing_interval'];

interface UpdateSubscriptionRequestBody {
  subscriptionId: string;
  tier: AppreciationTier;
  billingInterval: BillingInterval;
}

/**
 * Get the appropriate variant ID for a tier and billing interval
 */
function getVariantId(tier: AppreciationTier, interval: BillingInterval): string | undefined {
  if (interval === 'monthly') {
    switch (tier) {
      case 'supporter':
        return process.env.LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID;
      case 'champion':
        return process.env.LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID;
      case 'legend':
        return process.env.LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID;
      case 'hall_of_famer':
        return process.env.LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID;
    }
  } else {
    switch (tier) {
      case 'supporter':
        return process.env.LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID;
      case 'champion':
        return process.env.LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID;
      case 'legend':
        return process.env.LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID;
      case 'hall_of_famer':
        return process.env.LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = getAuthClient(token);

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSubscriptionRequestBody;
    const { subscriptionId, tier, billingInterval } = body;

    if (!subscriptionId || !tier || !billingInterval) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user owns this subscription
    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;

    const { data: subscriptionData, error: subscriptionError } = await dbClient
      .from('subscriptions')
      .select('user_id, lemonsqueezy_subscription_id')
      .eq('lemonsqueezy_subscription_id', subscriptionId)
      .single();

    if (subscriptionError || !subscriptionData) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscriptionData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Lemon Squeezy is not configured' }, { status: 500 });
    }

    const variantId = getVariantId(tier, billingInterval);

    if (!variantId) {
      return NextResponse.json({ error: 'Invalid tier or billing interval' }, { status: 400 });
    }

    // Call LemonSqueezy API to update the subscription
    const updateResponse = await fetch(`${LEMON_SQUEEZY_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            variant_id: parseInt(variantId, 10),
          },
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.json();
      console.error('LemonSqueezy Update Error:', {
        status: updateResponse.status,
        subscriptionId,
        variantId,
        error: errorBody,
      });

      // Check if this is a PayPal subscription that needs portal redirect
      if (errorBody?.errors?.[0]?.detail?.includes('PayPal')) {
        // Get the update subscription URL from the subscription
        const subResponse = await fetch(
          `${LEMON_SQUEEZY_API_URL}/subscriptions/${subscriptionId}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (subResponse.ok) {
          const subData = await subResponse.json();
          const portalUrl = subData?.data?.attributes?.urls?.customer_portal_update_subscription;
          if (portalUrl) {
            return NextResponse.json({
              success: false,
              requiresPortal: true,
              portalUrl,
              message: 'PayPal subscriptions must be updated through the customer portal.',
            });
          }
        }
      }

      return NextResponse.json(
        { error: errorBody?.errors?.[0]?.detail ?? 'Failed to update subscription' },
        { status: 500 }
      );
    }

    const responseBody = await updateResponse.json();
    const attributes = responseBody?.data?.attributes;

    // Update our local database with the new tier information
    const newPriceCents = getTierPrice(tier, billingInterval) * 100;

    console.info('Updating local database:', {
      subscriptionId,
      tier,
      billingInterval,
      newPriceCents,
      variantId,
    });

    const { data: updatedRow, error: updateDbError } = await dbClient
      .from('subscriptions')
      .update({
        tier,
        billing_interval: billingInterval,
        amount_cents: newPriceCents,
        lemonsqueezy_variant_id: variantId,
        updated_at: new Date().toISOString(),
      })
      .eq('lemonsqueezy_subscription_id', subscriptionId)
      .select()
      .single();

    if (updateDbError) {
      console.error('Failed to update local database:', updateDbError);
      // Don't fail the request - LemonSqueezy was updated successfully
      // The webhook will eventually sync the data
    } else {
      console.info('Database updated successfully:', updatedRow);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: responseBody?.data?.id,
        status: attributes?.status,
        variantId: attributes?.variant_id,
        productName: attributes?.product_name,
        variantName: attributes?.variant_name,
        tier,
        billingInterval,
        amountCents: newPriceCents,
      },
    });
  } catch (error) {
    console.error('Update Subscription Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
