import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/apiClient';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy/webhookUtils';
import { mapVariantToTierAndInterval } from '@/lib/lemonsqueezy/variantMapping';
import { Database } from '@/types/database.types';
import { pricingService } from '@/services/pricingService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

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

// mapVariantToTierAndInterval is now imported from @/lib/lemonsqueezy/variantMapping

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

    // Try to get user_id from custom_data first, then fall back to DB lookup by subscription ID
    let resolvedUserId = userId;

    if (!resolvedUserId && dataId && dataType === 'subscriptions') {
      console.info('[Webhook] No user_id in custom_data, looking up by subscription ID:', dataId);
      const { data: existingSub } = await serviceClient
        .from('subscriptions')
        .select('user_id')
        .eq('lemonsqueezy_subscription_id', String(dataId))
        .maybeSingle();

      if (existingSub?.user_id) {
        resolvedUserId = existingSub.user_id;
        console.info('[Webhook] Found user_id from existing subscription:', resolvedUserId);
      }
    }

    // For subscription-invoices, resolve user_id via the related subscription_id
    if (!resolvedUserId && dataType === 'subscription-invoices') {
      const attr = attributes as Record<string, unknown>;
      const lsSubscriptionId = getString(attr.subscription_id);
      if (lsSubscriptionId) {
        console.info('[Webhook] Resolving user_id from invoice subscription_id:', lsSubscriptionId);
        const { data: existingSub } = await serviceClient
          .from('subscriptions')
          .select('user_id')
          .eq('lemonsqueezy_subscription_id', String(lsSubscriptionId))
          .maybeSingle();

        if (existingSub?.user_id) {
          resolvedUserId = existingSub.user_id;
          console.info('[Webhook] Found user_id from subscription for invoice:', resolvedUserId);
        }
      }
    }

    if (!resolvedUserId) {
      console.info('[Webhook] Missing user_id in custom_data and no existing subscription found');
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

      // Get fallback price from DB tier_pricing table
      const { data: dbPriceCents } = await pricingService.getPriceCents(tier, billingInterval);

      // Use price from webhook if available, otherwise use DB price
      const finalAmountCents = amountCents ?? dbPriceCents ?? 0;

      // Use a single timestamp for both created_at and updated_at to prevent
      // chk_subscriptions_timestamps constraint violation (created_at <= updated_at)
      const now = new Date().toISOString();

      const subscriptionInsert = {
        user_id: resolvedUserId,
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
        created_at: now,
        updated_at: now,
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

      // Deactivate any gifted appreciation subscription for this user
      // A paid subscription should replace the gifted one
      // Note: Gifted subscriptions have lemonsqueezy_subscription_id = NULL,
      // so we filter by is_gifted = true (which also avoids SQL NULL comparison issues)
      const { error: deactivateError } = await serviceClient
        .from('subscriptions')
        .delete()
        .eq('user_id', resolvedUserId)
        .eq('is_gifted', true);

      if (deactivateError) {
        console.error('[Webhook] Failed to deactivate gifted subscription:', deactivateError);
        // Non-fatal — the paid subscription is already saved
      }

      // Auto-sync tier_pricing if LemonSqueezy sent a real price
      if (amountCents && variantId) {
        await pricingService.syncPriceIfChanged(
          serviceClient,
          tier,
          billingInterval,
          amountCents,
          variantId
        );
      }

      console.info('[Webhook] Subscription upserted successfully');
    }

    if (dataType === 'orders') {
      const attr = attributes as Record<string, unknown>;
      const firstOrderItem = getObject(attr.first_order_item);
      const orderItems = attr.order_items ?? (firstOrderItem ? [firstOrderItem] : null);

      // Use a single timestamp for both created_at and updated_at to prevent
      // chk_payment_history_timestamps constraint violation (created_at <= updated_at)
      const now = new Date().toISOString();

      const orderInsert = {
        user_id: resolvedUserId,
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
        created_at: now,
        updated_at: now,
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

    // ========================================================================
    // Handle subscription-invoices (payment success/failed/recovered/refunded)
    // ========================================================================
    if (dataType === 'subscription-invoices') {
      const attr = attributes as Record<string, unknown>;
      const lsSubscriptionId = getString(attr.subscription_id);

      const now = new Date().toISOString();

      const invoiceInsert = {
        user_id: resolvedUserId,
        lemonsqueezy_subscription_id: lsSubscriptionId,
        lemonsqueezy_invoice_id: dataId,
        lemonsqueezy_store_id: getString(attr.store_id),
        lemonsqueezy_customer_id: getString(attr.customer_id),
        billing_reason: getString(attr.billing_reason),
        invoice_status: getString(attr.status) ?? 'pending',
        card_brand: getString(attr.card_brand),
        card_last_four: getString(attr.card_last_four),
        currency: getString(attr.currency) ?? 'USD',
        currency_rate: getNumber(attr.currency_rate),
        subtotal_cents: getNumber(attr.subtotal) ?? 0,
        discount_total_cents: getNumber(attr.discount_total) ?? 0,
        tax_cents: getNumber(attr.tax) ?? 0,
        total_cents: getNumber(attr.total) ?? 0,
        subtotal_usd_cents: getNumber(attr.subtotal_usd) ?? 0,
        discount_total_usd_cents: getNumber(attr.discount_total_usd) ?? 0,
        tax_usd_cents: getNumber(attr.tax_usd) ?? 0,
        total_usd_cents: getNumber(attr.total_usd) ?? 0,
        refunded_amount_cents: getNumber(attr.refunded_amount) ?? 0,
        refunded_amount_usd_cents: getNumber(attr.refunded_amount_usd) ?? 0,
        invoice_url: getString(getObject(attr.urls)?.invoice_url),
        test_mode: getBoolean(attr.test_mode) ?? false,
        created_at: now,
        updated_at: now,
      };

      console.info('[Webhook] Upserting subscription invoice:', dataId);

      const { error } = await serviceClient
        .from('subscription_invoices')
        .upsert(invoiceInsert as never, {
          onConflict: 'lemonsqueezy_invoice_id',
        });

      if (error) {
        console.error('[Webhook] Subscription invoice upsert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Event-specific payment tracking logic
      if (eventName === 'subscription_payment_failed') {
        console.info('[Webhook] Payment failed for subscription:', lsSubscriptionId);

        // Increment payment failure count on associated subscription
        if (lsSubscriptionId) {
          const { error: updateError } = await serviceClient.rpc(
            'increment_payment_failure' as never,
            {
              p_ls_subscription_id: lsSubscriptionId,
            } as never
          );

          // Fallback: if RPC doesn't exist, update manually
          if (updateError) {
            console.info('[Webhook] RPC not available, updating payment failure manually');
            const { data: sub } = await serviceClient
              .from('subscriptions')
              .select('payment_failure_count')
              .eq('lemonsqueezy_subscription_id', lsSubscriptionId)
              .maybeSingle();

            await serviceClient
              .from('subscriptions')
              .update({
                payment_failure_count: (sub?.payment_failure_count ?? 0) + 1,
                last_payment_failed_at: now,
              } as never)
              .eq('lemonsqueezy_subscription_id', lsSubscriptionId);
          }

          // Log to admin audit log
          await serviceClient.from('admin_audit_log').insert({
            admin_id: null,
            action: 'payment_failed',
            target_user_id: resolvedUserId,
            details: {
              event: eventName,
              subscription_id: lsSubscriptionId,
              invoice_id: dataId,
              total_cents: getNumber(attr.total) ?? 0,
              currency: getString(attr.currency) ?? 'USD',
            },
          } as never);
        }
      }

      if (
        eventName === 'subscription_payment_success' ||
        eventName === 'subscription_payment_recovered'
      ) {
        console.info('[Webhook] Payment succeeded for subscription:', lsSubscriptionId);

        // Reset payment failure count on successful payment
        if (lsSubscriptionId) {
          await serviceClient
            .from('subscriptions')
            .update({
              payment_failure_count: 0,
              last_payment_failed_at: null,
            } as never)
            .eq('lemonsqueezy_subscription_id', lsSubscriptionId);

          const action =
            eventName === 'subscription_payment_recovered'
              ? 'payment_recovered'
              : 'payment_success';

          // Log to admin audit log
          await serviceClient.from('admin_audit_log').insert({
            admin_id: null,
            action,
            target_user_id: resolvedUserId,
            details: {
              event: eventName,
              subscription_id: lsSubscriptionId,
              invoice_id: dataId,
              total_cents: getNumber(attr.total) ?? 0,
              currency: getString(attr.currency) ?? 'USD',
            },
          } as never);
        }
      }

      if (eventName === 'subscription_payment_refunded') {
        console.info('[Webhook] Payment refunded for subscription:', lsSubscriptionId);

        if (lsSubscriptionId) {
          // Log to admin audit log
          await serviceClient.from('admin_audit_log').insert({
            admin_id: null,
            action: 'payment_refunded',
            target_user_id: resolvedUserId,
            details: {
              event: eventName,
              subscription_id: lsSubscriptionId,
              invoice_id: dataId,
              refunded_amount_cents: getNumber(attr.refunded_amount) ?? 0,
              currency: getString(attr.currency) ?? 'USD',
            },
          } as never);
        }
      }

      console.info('[Webhook] Subscription invoice processed successfully');
    }

    console.info('[Webhook] Successfully processed event:', eventName);
    return NextResponse.json({ received: true, event: eventName });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
