import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { PaymentHistoryEntry, Subscription } from '@/types/models';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type PaymentHistoryRow = Database['public']['Tables']['payment_history']['Row'];
type AppreciationTier = Database['public']['Enums']['appreciation_tier'];
type BillingInterval = Database['public']['Enums']['billing_interval'];

export type SubscriptionFeature = 'kiosk_mode';

type CheckoutResponse = {
  checkoutUrl: string;
  checkoutId: string;
};

interface CreateCheckoutOptions {
  tier: AppreciationTier;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl?: string;
}

interface PortalResponse {
  updatePaymentMethodUrl: string | null;
  customerPortalUrl: string | null;
  customerPortalUpdateSubscriptionUrl: string | null;
}

const ACTIVE_STATUSES: Subscription['status'][] = ['active', 'trialing'];

const rowToSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  userId: row.user_id,
  lemonsqueezySubscriptionId: row.lemonsqueezy_subscription_id,
  status: row.status,
  statusFormatted: row.status_formatted,
  billingInterval: row.billing_interval,
  amountCents: row.amount_cents,
  currency: row.currency,
  tier: row.tier,
  showCreatedBy: row.show_created_by,
  showOnSupportersPage: row.show_on_supporters_page,
  supporterDisplayName: row.supporter_display_name,
  updatePaymentMethodUrl: row.update_payment_method_url,
  customerPortalUrl: row.customer_portal_url,
  customerPortalUpdateSubscriptionUrl: row.customer_portal_update_subscription_url,
  cardBrand: row.card_brand,
  cardLastFour: row.card_last_four,
  paymentProcessor: row.payment_processor,
  currentPeriodStart: row.current_period_start,
  currentPeriodEnd: row.current_period_end,
  cancelledAt: row.cancelled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToPaymentHistory = (row: PaymentHistoryRow): PaymentHistoryEntry => ({
  id: row.id,
  userId: row.user_id,
  subscriptionId: row.subscription_id,
  lemonsqueezyOrderId: row.lemonsqueezy_order_id,
  orderNumber: row.lemonsqueezy_order_number,
  orderIdentifier: row.order_identifier,
  status: row.status,
  statusFormatted: row.status_formatted,
  currency: row.currency,
  totalCents: row.total_cents,
  totalUsdCents: row.total_usd_cents,
  taxCents: row.tax_cents,
  discountTotalCents: row.discount_total_cents,
  createdAt: row.created_at,
  receiptUrl: row.receipt_url,
  orderItemProductName: row.order_item_product_name,
  orderItemVariantName: row.order_item_variant_name,
  orderItemQuantity: row.order_item_quantity,
  orderItemPriceCents: row.order_item_price_cents,
});

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export const subscriptionService = {
  /**
   * Get the latest subscription for a user
   */
  async getSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ? rowToSubscription(data) : null, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to fetch subscription. Please try again.',
      };
    }
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: null, error: error.message };
      }

      const entries = (data || []).map((row) => rowToPaymentHistory(row));
      return { data: entries, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to fetch billing history. Please try again.',
      };
    }
  },

  /**
   * Get the stored subscription tier for a user
   */
  async getSubscriptionTier(userId: string) {
    const { data, error } = await this.getSubscription(userId);

    if (error) {
      return { data: null, error };
    }

    return { data: data?.tier ?? null, error: null };
  },

  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(userId: string) {
    const { data, error } = await this.getSubscription(userId);

    if (error) {
      return { data: false, error };
    }

    const isActive = data ? ACTIVE_STATUSES.includes(data.status) : false;
    return { data: isActive, error: null };
  },

  /**
   * Check if user is a supporter (any active tier)
   */
  async isSupporter(userId: string) {
    return this.hasActiveSubscription(userId);
  },

  /**
   * Check feature access for a user
   */
  async canAccessFeature(userId: string, _feature: SubscriptionFeature) {
    return this.hasActiveSubscription(userId);
  },

  /**
   * Create a Lemon Squeezy checkout session (overlay)
   */
  async createCheckout(options: CreateCheckoutOptions) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return {
          data: null,
          error: errorBody.error || 'Failed to start checkout.',
        };
      }

      const data = (await response.json()) as CheckoutResponse;
      return { data, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to start checkout. Please try again.',
      };
    }
  },

  /**
   * Fetch fresh customer portal URLs from Lemon Squeezy
   */
  async getCustomerPortalUrls(subscriptionId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/lemonsqueezy/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return {
          data: null,
          error: errorBody.error || 'Failed to fetch customer portal links.',
        };
      }

      const data = (await response.json()) as PortalResponse;
      return { data, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to fetch customer portal links.',
      };
    }
  },
};
