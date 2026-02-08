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

interface UpdateSubscriptionOptions {
  subscriptionId: string;
  tier: AppreciationTier;
  billingInterval: BillingInterval;
}

interface UpdateSubscriptionResponse {
  success: boolean;
  requiresPortal?: boolean;
  portalUrl?: string;
  message?: string;
  subscription?: {
    id: string;
    status: string;
    variantId: number;
    productName: string;
    variantName: string;
    tier: string;
    billingInterval: string;
    amountCents: number;
  };
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
  isGifted: row.is_gifted ?? false,
  giftedExpiresAt: row.gifted_expires_at,
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
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Failed to get auth session:', error.message);
    return {};
  }
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    console.warn('No access token in session - user may need to re-login');
  }
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
   * Includes cancelled subscriptions that are still within their grace period (before ends_at)
   */
  async hasActiveSubscription(userId: string) {
    const { data, error } = await this.getSubscription(userId);

    if (error) {
      return { data: false, error };
    }

    if (!data) {
      return { data: false, error: null };
    }

    // Active or trialing subscriptions
    if (ACTIVE_STATUSES.includes(data.status)) {
      return { data: true, error: null };
    }

    // Cancelled subscriptions - still active until ends_at (stored as cancelledAt)
    // LemonSqueezy's ends_at field indicates when the subscription actually expires
    if (data.status === 'cancelled' && data.cancelledAt) {
      const endsAt = new Date(data.cancelledAt);
      if (endsAt > new Date()) {
        return { data: true, error: null };
      }
    }

    return { data: false, error: null };
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
   * Update an existing subscription (change tier/billing interval)
   */
  async updateSubscription(options: UpdateSubscriptionOptions) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/lemonsqueezy/update-subscription', {
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
          error: errorBody.error || 'Failed to update subscription.',
        };
      }

      const data = (await response.json()) as UpdateSubscriptionResponse;
      return { data, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to update subscription. Please try again.',
      };
    }
  },

  /**
   * Resume a cancelled subscription (before period end)
   * This "un-cancels" the subscription so it will continue renewing
   */
  async resumeSubscription(subscriptionId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/lemonsqueezy/resume-subscription', {
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
          error: errorBody.error || 'Failed to resume subscription.',
        };
      }

      const data = (await response.json()) as {
        success: boolean;
        subscription?: { id: string; status: string };
      };
      return { data, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to resume subscription. Please try again.',
      };
    }
  },

  /**
   * Cancel a subscription (will end at the end of the current billing period)
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/lemonsqueezy/cancel-subscription', {
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
          error: errorBody.error || 'Failed to cancel subscription.',
        };
      }

      const data = (await response.json()) as {
        success: boolean;
        subscription?: { id: string; status: string; endsAt: string };
      };
      return { data, error: null };
    } catch (_error) {
      return {
        data: null,
        error: 'Failed to cancel subscription. Please try again.',
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

  // =========================================================================
  // Admin-only methods - These call API endpoints that require system_admin role
  // =========================================================================

  /**
   * [Admin] Get all subscriptions with user info
   */
  async getAllSubscriptionsAdmin(options?: {
    search?: string;
    filter?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (options?.search) params.set('search', options.search);
      if (options?.filter) params.set('filter', options.filter);
      if (options?.page) params.set('page', options.page.toString());
      if (options?.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`/api/admin/subscriptions?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to fetch subscriptions.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch subscriptions.' };
    }
  },

  /**
   * [Admin] Get a specific user's subscription details
   */
  async getSubscriptionByUserIdAdmin(userId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to fetch subscription.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch subscription.' };
    }
  },

  /**
   * [Admin] Cancel a user's subscription via LemonSqueezy
   */
  async cancelSubscriptionAdmin(userId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/subscriptions/${userId}/cancel`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to cancel subscription.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to cancel subscription.' };
    }
  },

  /**
   * [Admin] Verify a LemonSqueezy subscription ID before linking
   */
  async verifySubscriptionLinkAdmin(lemonSqueezySubscriptionId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/subscriptions/verify-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ lemonSqueezySubscriptionId }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to verify subscription.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to verify subscription.' };
    }
  },

  /**
   * [Admin] Link a LemonSqueezy subscription to a user account
   */
  async linkSubscriptionAdmin(
    userId: string,
    lemonSqueezySubscriptionId: string,
    override: boolean = false
  ) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/subscriptions/${userId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ lemonSqueezySubscriptionId, override }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to link subscription.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to link subscription.' };
    }
  },

  /**
   * [Admin] Gift appreciation tier to a user
   */
  async giftAppreciationTierAdmin(userId: string, expiresAt?: string | null) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/subscriptions/${userId}/gift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ expiresAt }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to gift appreciation tier.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to gift appreciation tier.' };
    }
  },

  /**
   * [Admin] Remove gifted appreciation tier from a user
   */
  async removeAppreciationTierAdmin(userId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/subscriptions/${userId}/gift`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to remove appreciation tier.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to remove appreciation tier.' };
    }
  },

  /**
   * [Admin] Get admin audit log history
   */
  async getAuditLogsAdmin(options?: { page?: number; limit?: number }) {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (options?.page) params.set('page', options.page.toString());
      if (options?.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`/api/admin/subscriptions/audit-log?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        return { data: null, error: errorBody.error || 'Failed to fetch audit logs.' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch audit logs.' };
    }
  },
};
