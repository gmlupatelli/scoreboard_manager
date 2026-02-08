import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/apiClient';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy/webhookUtils';
import { Database } from '@/types/database.types';
import { getTierPrice } from '@/lib/subscription/tiers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
type BillingInterval = Database['public']['Enums']['billing_interval'];
type AppreciationTier = Database['public']['Enums']['appreciation_tier'];

type LemonSqueezyPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string | number;
    };
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: Record<string, unknown>;
  };
};

const getString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
};

const getNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getBoolean = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);

const getObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

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
 * Map variant ID to tier and billing interval
 * Returns { tier, interval } or null if variant not found
 */
const mapVariantToTierAndInterval = (
  variantId: string | null
): { tier: AppreciationTier; interval: BillingInterval } | null => {
  if (!variantId) return null;

  // Monthly variants
  if (variantId === process.env.LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID) {
    return { tier: 'supporter', interval: 'monthly' };
  }
  if (variantId === process.env.LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID) {
    return { tier: 'champion', interval: 'monthly' };
  }
  if (variantId === process.env.LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID) {
    return { tier: 'legend', interval: 'monthly' };
  }
  if (variantId === process.env.LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID) {
    return { tier: 'hall_of_famer', interval: 'monthly' };
  }

  // Yearly variants
  if (variantId === process.env.LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID) {
    return { tier: 'supporter', interval: 'yearly' };
  }
  if (variantId === process.env.LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID) {
    return { tier: 'champion', interval: 'yearly' };
  }
  if (variantId === process.env.LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID) {
    return { tier: 'legend', interval: 'yearly' };
  }
  if (variantId === process.env.LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID) {
    return { tier: 'hall_of_famer', interval: 'yearly' };
  }

  return null;
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get('X-Signature') ?? request.headers.get('x-signature') ?? '';
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    console.info('[Webhook] Received webhook request');
    console.info('[Webhook] Has signature:', !!signature);
    console.info('[Webhook] Has secret:', !!secret);

    if (!secret || !signature) {
      console.info('[Webhook] Missing signature or secret');
      return NextResponse.json({ error: 'Webhook signature missing' }, { status: 401 });
    }

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      console.info('[Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    console.info('[Webhook] Signature verified');

    const payload = JSON.parse(rawBody) as LemonSqueezyPayload;
    const eventName = payload.meta?.event_name ?? request.headers.get('X-Event-Name') ?? 'unknown';
    const userId = getString(payload.meta?.custom_data?.user_id ?? null);
    const dataType = getString(payload.data?.type);
    const dataId = getString(payload.data?.id);
    const attributes = payload.data?.attributes ?? {};

    console.info('[Webhook] Event:', eventName);
    console.info('[Webhook] User ID:', userId);
    console.info('[Webhook] Data type:', dataType);

    const serviceClient = getServiceRoleClient();

    if (!serviceClient) {
      console.info('[Webhook] Service role client not available');
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    if (!userId) {
      console.info('[Webhook] Missing user_id in custom_data');
      console.info('[Webhook] custom_data:', JSON.stringify(payload.meta?.custom_data));
      return NextResponse.json({ error: 'Missing user_id in custom data' }, { status: 400 });
    }

    if (dataType === 'subscriptions') {
      const attr = attributes as Record<string, unknown>;
      const statusRaw = getString(attr.status) ?? 'active';
      const status = normalizeStatus(statusRaw);
      const statusFormatted = getString(attr.status_formatted);
      const variantId = getString(attr.variant_id);

      // Map variant ID to tier and interval
      const variantMapping = mapVariantToTierAndInterval(variantId);
      if (!variantMapping) {
        return NextResponse.json(
          { error: 'Unknown variant ID - cannot determine tier and interval' },
          { status: 400 }
        );
      }

      const { tier, interval: billingInterval } = variantMapping;

      const currency = getString(attr.currency) ?? 'USD';
      const testMode = getBoolean(attr.test_mode) ?? false;
      const cardBrand = getString(attr.card_brand);
      const cardLastFour = getString(attr.card_last_four);
      const paymentProcessor = getString(attr.payment_processor);

      const urls = getObject(attr.urls);
      const updatePaymentMethodUrl = getString(urls?.update_payment_method);
      const customerPortalUrl = getString(urls?.customer_portal);
      const customerPortalUpdateSubscriptionUrl = getString(
        urls?.customer_portal_update_subscription
      );

      const firstSubscriptionItem = getObject(attr.first_subscription_item);
      const itemPrice = getNumber(firstSubscriptionItem?.price);
      const amountCents = itemPrice ?? getNumber(attr.price);

      // Calculate fixed price for the tier/interval (as cents)
      const fixedPriceDollars = getTierPrice(tier, billingInterval);
      const fixedPriceCents = fixedPriceDollars * 100;

      // Use price from webhook if available, otherwise use fixed price
      const finalAmountCents = amountCents ?? fixedPriceCents;

      const subscriptionInsert = {
        user_id: userId,
        lemonsqueezy_subscription_id: dataId,
        lemonsqueezy_customer_id: getString(attr.customer_id),
        lemonsqueezy_order_id: getString(attr.order_id),
        lemonsqueezy_order_item_id: getString(attr.order_item_id),
        lemonsqueezy_product_id: getString(attr.product_id),
        lemonsqueezy_variant_id: variantId,
        status,
        status_formatted: statusFormatted,
        billing_interval: billingInterval,
        amount_cents: finalAmountCents,
        currency,
        tier,
        update_payment_method_url: updatePaymentMethodUrl,
        customer_portal_url: customerPortalUrl,
        customer_portal_update_subscription_url: customerPortalUpdateSubscriptionUrl,
        card_brand: cardBrand,
        card_last_four: cardLastFour,
        payment_processor: paymentProcessor,
        test_mode: testMode,
        current_period_start: getString(attr.created_at),
        current_period_end: getString(attr.renews_at),
        cancelled_at: getString(attr.ends_at),
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['subscriptions']['Insert'];

      console.info(
        '[Webhook] Upserting subscription:',
        JSON.stringify(subscriptionInsert, null, 2)
      );

      const { error } = await serviceClient
        .from('subscriptions')
        .upsert(subscriptionInsert as never, {
          onConflict: 'lemonsqueezy_subscription_id',
        });

      if (error) {
        console.error('[Webhook] Subscription upsert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.info('[Webhook] Subscription upserted successfully');
    }

    if (dataType === 'orders') {
      const attr = attributes as Record<string, unknown>;
      const firstOrderItem = getObject(attr.first_order_item);
      const orderItems = attr.order_items ?? (firstOrderItem ? [firstOrderItem] : null);

      const orderInsert = {
        user_id: userId,
        subscription_id: null,
        lemonsqueezy_subscription_id: getString(attr.subscription_id),
        lemonsqueezy_order_id: dataId,
        lemonsqueezy_order_number: getNumber(attr.order_number),
        order_identifier: getString(attr.identifier),
        lemonsqueezy_customer_id: getString(attr.customer_id),
        lemonsqueezy_product_id: getString(firstOrderItem?.product_id),
        lemonsqueezy_variant_id: getString(firstOrderItem?.variant_id),
        lemonsqueezy_order_item_id: getString(firstOrderItem?.id),
        status: getString(attr.status),
        status_formatted: getString(attr.status_formatted),
        currency: getString(attr.currency),
        currency_rate: getNumber(attr.currency_rate),
        subtotal_cents: getNumber(attr.subtotal),
        discount_total_cents: getNumber(attr.discount_total),
        tax_cents: getNumber(attr.tax),
        total_cents: getNumber(attr.total),
        subtotal_usd_cents: getNumber(attr.subtotal_usd),
        discount_total_usd_cents: getNumber(attr.discount_total_usd),
        tax_usd_cents: getNumber(attr.tax_usd),
        total_usd_cents: getNumber(attr.total_usd),
        tax_name: getString(attr.tax_name),
        tax_rate: getString(attr.tax_rate),
        refunded: getBoolean(attr.refunded) ?? false,
        refunded_at: getString(attr.refunded_at),
        user_name: getString(attr.user_name),
        user_email: getString(attr.user_email),
        receipt_url: getString(getObject(attr.urls)?.receipt),
        order_item_quantity: getNumber(firstOrderItem?.quantity),
        order_item_price_cents: getNumber(firstOrderItem?.price),
        order_item_product_name: getString(firstOrderItem?.product_name),
        order_item_variant_name: getString(firstOrderItem?.variant_name),
        order_item_created_at: getString(firstOrderItem?.created_at),
        order_item_updated_at: getString(firstOrderItem?.updated_at),
        order_item_deleted_at: getString(firstOrderItem?.deleted_at),
        order_item_test_mode: getBoolean(firstOrderItem?.test_mode),
        order_items: orderItems
          ? (orderItems as Database['public']['Tables']['payment_history']['Row']['order_items'])
          : null,
        test_mode: getBoolean(attr.test_mode) ?? false,
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['payment_history']['Insert'];

      console.info('[Webhook] Upserting order:', orderInsert.lemonsqueezy_order_id);

      const { error } = await serviceClient.from('payment_history').upsert(orderInsert as never, {
        onConflict: 'lemonsqueezy_order_id',
      });

      if (error) {
        console.error('[Webhook] Order upsert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.info('[Webhook] Order upserted successfully');
    }

    console.info('[Webhook] Successfully processed event:', eventName);
    return NextResponse.json({ received: true, event: eventName });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
