/// <reference types="jest" />

/**
 * LemonSqueezy API Mock Responses for Testing
 * Based on LemonSqueezy API documentation structure
 */

// =============================================================================
// SUBSCRIPTION MOCK DATA
// =============================================================================

export interface MockLemonSqueezySubscription {
  id: string;
  status: 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
  status_formatted: string;
  variant_id: number;
  product_id: number;
  customer_id: number;
  user_email: string;
  user_name: string;
  card_brand: string | null;
  card_last_four: string | null;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
  urls: {
    update_payment_method: string;
    customer_portal: string;
    customer_portal_update_subscription: string;
  };
}

export const createMockSubscription = (
  overrides: Partial<MockLemonSqueezySubscription> = {}
): MockLemonSqueezySubscription => {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    id: '123456',
    status: 'active',
    status_formatted: 'Active',
    variant_id: 100001,
    product_id: 200001,
    customer_id: 300001,
    user_email: 'supporter@example.com',
    user_name: 'Test Supporter',
    card_brand: 'visa',
    card_last_four: '4242',
    renews_at: nextMonth.toISOString(),
    ends_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    test_mode: true,
    urls: {
      update_payment_method: 'https://app.lemonsqueezy.com/my-orders/123/update-payment-method',
      customer_portal: 'https://app.lemonsqueezy.com/my-orders/123',
      customer_portal_update_subscription:
        'https://app.lemonsqueezy.com/my-orders/123/subscription/456',
    },
    ...overrides,
  };
};

// =============================================================================
// WEBHOOK PAYLOAD MOCK DATA
// =============================================================================

export interface MockWebhookPayload {
  meta: {
    event_name: string;
    custom_data: {
      user_id: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

/**
 * Create a mock subscription webhook payload
 */
export const createMockSubscriptionWebhookPayload = (
  eventName: string,
  userId: string,
  subscriptionOverrides: Partial<MockLemonSqueezySubscription> = {}
): MockWebhookPayload => {
  const subscription = createMockSubscription(subscriptionOverrides);

  return {
    meta: {
      event_name: eventName,
      custom_data: {
        user_id: userId,
      },
    },
    data: {
      id: subscription.id,
      type: 'subscriptions',
      attributes: {
        status: subscription.status,
        status_formatted: subscription.status_formatted,
        variant_id: subscription.variant_id,
        product_id: subscription.product_id,
        customer_id: subscription.customer_id,
        user_email: subscription.user_email,
        user_name: subscription.user_name,
        card_brand: subscription.card_brand,
        card_last_four: subscription.card_last_four,
        renews_at: subscription.renews_at,
        ends_at: subscription.ends_at,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        test_mode: subscription.test_mode,
        urls: subscription.urls,
      },
    },
  };
};

/**
 * Create a mock order webhook payload
 */
export const createMockOrderWebhookPayload = (
  userId: string,
  orderOverrides: Partial<{
    id: string;
    status: string;
    status_formatted: string;
    total: number;
    currency: string;
    receipt_url: string;
    order_number: number;
    identifier: string;
    user_email: string;
    user_name: string;
    test_mode: boolean;
  }> = {}
): MockWebhookPayload => {
  const now = new Date();

  const order = {
    id: '789012',
    status: 'paid',
    status_formatted: 'Paid',
    total: 400,
    currency: 'USD',
    receipt_url: 'https://app.lemonsqueezy.com/receipt/123',
    order_number: 1001,
    identifier: 'ORD-1001',
    user_email: 'supporter@example.com',
    user_name: 'Test Supporter',
    test_mode: true,
    ...orderOverrides,
  };

  return {
    meta: {
      event_name: 'order_created',
      custom_data: {
        user_id: userId,
      },
    },
    data: {
      id: order.id,
      type: 'orders',
      attributes: {
        status: order.status,
        status_formatted: order.status_formatted,
        total: order.total,
        currency: order.currency,
        receipt_url: order.receipt_url,
        order_number: order.order_number,
        identifier: order.identifier,
        user_email: order.user_email,
        user_name: order.user_name,
        test_mode: order.test_mode,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    },
  };
};

// =============================================================================
// API RESPONSE MOCK DATA
// =============================================================================

export interface MockCheckoutResponse {
  data: {
    id: string;
    type: 'checkouts';
    attributes: {
      store_id: number;
      variant_id: number;
      custom_price: number | null;
      product_options: Record<string, unknown>;
      checkout_options: Record<string, unknown>;
      checkout_data: Record<string, unknown>;
      expires_at: string | null;
      url: string;
    };
  };
}

/**
 * Create a mock checkout response
 */
export const createMockCheckoutResponse = (url: string): MockCheckoutResponse => ({
  data: {
    id: 'checkout_123',
    type: 'checkouts',
    attributes: {
      store_id: 12345,
      variant_id: 100001,
      custom_price: null,
      product_options: {},
      checkout_options: {},
      checkout_data: {},
      expires_at: null,
      url,
    },
  },
});

/**
 * Create a mock subscription API response (for GET/PATCH /subscriptions/:id)
 */
export const createMockSubscriptionApiResponse = (subscription: MockLemonSqueezySubscription) => ({
  data: {
    id: subscription.id,
    type: 'subscriptions',
    attributes: subscription,
  },
});

// =============================================================================
// FETCH MOCK HELPER
// =============================================================================

/**
 * Create a mock fetch function for LemonSqueezy API calls
 */
export const createMockLemonSqueezyFetch = (
  responses: Map<string, { ok: boolean; status: number; body: unknown }>
) => {
  return jest.fn((url: string, _options?: RequestInit) => {
    const response = responses.get(url);
    if (response) {
      return Promise.resolve({
        ok: response.ok,
        status: response.status,
        json: () => Promise.resolve(response.body),
        text: () => Promise.resolve(JSON.stringify(response.body)),
      });
    }
    // Default 404 response
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
      text: () => Promise.resolve('Not found'),
    });
  });
};

// =============================================================================
// COMMON TEST SCENARIOS
// =============================================================================

export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RESUMED: 'subscription_resumed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_PAUSED: 'subscription_paused',
  SUBSCRIPTION_UNPAUSED: 'subscription_unpaused',
  SUBSCRIPTION_PAYMENT_SUCCESS: 'subscription_payment_success',
  SUBSCRIPTION_PAYMENT_FAILED: 'subscription_payment_failed',
  ORDER_CREATED: 'order_created',
  ORDER_REFUNDED: 'order_refunded',
} as const;

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
  PAST_DUE: 'past_due',
  EXPIRED: 'expired',
  ON_TRIAL: 'on_trial',
  UNPAID: 'unpaid',
} as const;

/**
 * Test variant IDs - these should match your test environment
 * In tests, mock process.env to use these values
 */
export const TEST_VARIANT_IDS = {
  MONTHLY_SUPPORTER: '100001',
  MONTHLY_CHAMPION: '100002',
  MONTHLY_LEGEND: '100003',
  MONTHLY_HALL_OF_FAMER: '100004',
  YEARLY_SUPPORTER: '200001',
  YEARLY_CHAMPION: '200002',
  YEARLY_LEGEND: '200003',
  YEARLY_HALL_OF_FAMER: '200004',
} as const;

/**
 * Helper to set up environment variables for tests
 */
export const setupTestEnvVariables = () => {
  process.env.LEMONSQUEEZY_API_KEY = 'test_api_key_123';
  process.env.LEMONSQUEEZY_STORE_ID = '12345';
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'test_webhook_secret_456';
  process.env.LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID = TEST_VARIANT_IDS.MONTHLY_SUPPORTER;
  process.env.LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID = TEST_VARIANT_IDS.MONTHLY_CHAMPION;
  process.env.LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID = TEST_VARIANT_IDS.MONTHLY_LEGEND;
  process.env.LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID =
    TEST_VARIANT_IDS.MONTHLY_HALL_OF_FAMER;
  process.env.LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID = TEST_VARIANT_IDS.YEARLY_SUPPORTER;
  process.env.LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID = TEST_VARIANT_IDS.YEARLY_CHAMPION;
  process.env.LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID = TEST_VARIANT_IDS.YEARLY_LEGEND;
  process.env.LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID = TEST_VARIANT_IDS.YEARLY_HALL_OF_FAMER;
};

/**
 * Clean up test environment variables
 */
export const cleanupTestEnvVariables = () => {
  delete process.env.LEMONSQUEEZY_API_KEY;
  delete process.env.LEMONSQUEEZY_STORE_ID;
  delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  delete process.env.LEMONSQUEEZY_MONTHLY_SUPPORTER_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_MONTHLY_CHAMPION_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_MONTHLY_LEGEND_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_MONTHLY_HALL_OF_FAMER_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_YEARLY_SUPPORTER_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_YEARLY_CHAMPION_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_YEARLY_LEGEND_VARIANT_ID;
  delete process.env.LEMONSQUEEZY_YEARLY_HALL_OF_FAMER_VARIANT_ID;
};
