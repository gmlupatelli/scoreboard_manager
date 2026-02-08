import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { getTierPrice } from '@/lib/subscription/tiers';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

type AppreciationTier = Database['public']['Enums']['appreciation_tier'];
type BillingInterval = Database['public']['Enums']['billing_interval'];

interface CheckoutRequestBody {
  tier: AppreciationTier;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl?: string;
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

    const body = (await request.json()) as CheckoutRequestBody;
    const { tier, billingInterval, successUrl, cancelUrl } = body;

    if (!tier || !billingInterval || !successUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!storeId || !apiKey) {
      return NextResponse.json({ error: 'Lemon Squeezy is not configured' }, { status: 500 });
    }

    const variantId = getVariantId(tier, billingInterval);

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant not configured for selected tier and interval' },
        { status: 500 }
      );
    }

    // Get fixed price for the tier
    const priceDollars = getTierPrice(tier, billingInterval);
    const priceCents = Math.round(priceDollars * 100);

    const checkoutPayload = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            redirect_url: successUrl,
            enabled_variants: [variantId],
          },
          checkout_options: {
            embed: true,
          },
          checkout_data: {
            email: user.email ?? undefined,
            name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
            custom: {
              user_id: user.id,
              tier,
              billing_interval: billingInterval,
              amount_cents: String(priceCents),
              cancel_url: cancelUrl,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    };

    const checkoutResponse = await fetch(`${LEMON_SQUEEZY_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorBody = await checkoutResponse.json();
      return NextResponse.json(
        { error: errorBody?.errors?.[0]?.detail ?? 'Failed to create checkout' },
        { status: 500 }
      );
    }

    const responseBody = await checkoutResponse.json();
    const checkoutUrl = responseBody?.data?.attributes?.url as string | undefined;
    const checkoutId = responseBody?.data?.id as string | undefined;

    if (!checkoutUrl || !checkoutId) {
      return NextResponse.json({ error: 'Invalid checkout response' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl, checkoutId });
  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
