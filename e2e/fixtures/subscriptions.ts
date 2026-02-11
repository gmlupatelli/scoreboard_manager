/**
 * Subscription Fixtures for Playwright E2E Tests
 *
 * Provides helpers to seed and manage subscription data for testing.
 * These fixtures create database records with various subscription states.
 *
 * Note: The patron@example.com user must exist in the database first.
 * Run the test user setup before using these fixtures.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), quiet: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

// Service role client for database operations
const getServiceClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials for test fixtures');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// =============================================================================
// SUBSCRIPTION STATE TYPES
// =============================================================================

export type SubscriptionState =
  | 'active'
  | 'cancelled_grace_period'
  | 'expired'
  | 'gifted'
  | 'past_due'
  | 'paused';

export interface SubscriptionFixtureOptions {
  tier?: 'supporter' | 'champion' | 'legend' | 'hall_of_famer';
  billingInterval?: 'monthly' | 'yearly';
  amountCents?: number;
}

// =============================================================================
// SUBSCRIPTION FIXTURE DATA
// =============================================================================

/**
 * Generate subscription data for a specific state
 */
export const getSubscriptionData = (
  userId: string,
  state: SubscriptionState,
  options: SubscriptionFixtureOptions = {}
) => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + 1);
  const pastDate = new Date(now);
  pastDate.setMonth(pastDate.getMonth() - 1);

  const tier = options.tier || 'supporter';
  const billingInterval = options.billingInterval || 'monthly';
  const amountCents =
    options.amountCents ||
    (tier === 'supporter' ? 400 : tier === 'champion' ? 800 : tier === 'legend' ? 2300 : 4800);

  const baseData = {
    user_id: userId,
    lemonsqueezy_subscription_id: `test_sub_${state}_${Date.now()}`,
    lemonsqueezy_customer_id: `test_cust_${Date.now()}`,
    billing_interval: billingInterval,
    amount_cents: amountCents,
    currency: 'USD',
    tier,
    is_gifted: false,
    show_created_by: true,
    show_on_supporters_page: true,
    card_brand: 'visa',
    card_last_four: '4242',
  };

  switch (state) {
    case 'active':
      return {
        ...baseData,
        status: 'active',
        status_formatted: 'Active',
        current_period_start: now.toISOString(),
        current_period_end: futureDate.toISOString(),
        cancelled_at: null,
      };

    case 'cancelled_grace_period':
      return {
        ...baseData,
        status: 'cancelled',
        status_formatted: 'Cancelled',
        current_period_start: pastDate.toISOString(),
        current_period_end: futureDate.toISOString(),
        cancelled_at: futureDate.toISOString(), // Benefits until this date
      };

    case 'expired':
      return {
        ...baseData,
        status: 'expired',
        status_formatted: 'Expired',
        lemonsqueezy_subscription_id: null, // Expired subs lose LS link
        current_period_start: pastDate.toISOString(),
        current_period_end: pastDate.toISOString(),
        cancelled_at: pastDate.toISOString(),
        card_brand: null,
        card_last_four: null,
      };

    case 'gifted': {
      const giftExpiry = new Date(now);
      giftExpiry.setMonth(giftExpiry.getMonth() + 3);
      return {
        ...baseData,
        status: 'active',
        status_formatted: 'Active (Gifted)',
        lemonsqueezy_subscription_id: null, // Gifted subs have no LS link
        is_gifted: true,
        gifted_expires_at: giftExpiry.toISOString(),
        current_period_start: null,
        current_period_end: null,
        cancelled_at: null,
        card_brand: null,
        card_last_four: null,
      };
    }

    case 'past_due':
      return {
        ...baseData,
        status: 'past_due',
        status_formatted: 'Past Due',
        current_period_start: pastDate.toISOString(),
        current_period_end: pastDate.toISOString(),
        cancelled_at: null,
      };

    case 'paused':
      return {
        ...baseData,
        status: 'paused',
        status_formatted: 'Paused',
        current_period_start: pastDate.toISOString(),
        current_period_end: futureDate.toISOString(),
        cancelled_at: null,
      };

    default:
      throw new Error(`Unknown subscription state: ${state}`);
  }
};

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Get user ID by email
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  const client = getServiceClient();
  const { data, error } = await client
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !data) {
    console.error(`Failed to find user ${email}:`, error);
    return null;
  }
  return data.id;
};

/**
 * Seed a subscription for a user
 */
export const seedSubscription = async (
  userEmail: string,
  state: SubscriptionState,
  options: SubscriptionFixtureOptions = {}
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> => {
  const client = getServiceClient();

  // Get user ID
  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return { success: false, error: `User not found: ${userEmail}` };
  }

  // Delete any existing subscription for this user
  await client.from('subscriptions').delete().eq('user_id', userId);

  // Insert new subscription
  const subscriptionData = getSubscriptionData(userId, state, options);
  const { data, error } = await client
    .from('subscriptions')
    .insert(subscriptionData)
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // When seeding an active subscription, ensure the downgrade notice is dismissed
  // and scoreboards are unlocked. This prevents the DowngradeNoticeModal from
  // blocking test interactions after a previous removeSubscription call.
  if (state === 'active' || state === 'gifted') {
    await client
      .from('user_profiles')
      .update({ downgrade_notice_seen_at: new Date().toISOString() })
      .eq('id', userId);

    await client
      .from('scoreboards')
      .update({ is_locked: false })
      .eq('owner_id', userId);
  }

  return { success: true, subscriptionId: data?.id };
};

/**
 * Remove subscription for a user
 */
export const removeSubscription = async (
  userEmail: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getServiceClient();

  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return { success: false, error: `User not found: ${userEmail}` };
  }

  const { error } = await client.from('subscriptions').delete().eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Unlock all scoreboards for a user (reset is_locked to false).
 * Use in afterEach to clean up after downgrade tests that trigger locking.
 */
export const unlockAllScoreboards = async (
  userEmail: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getServiceClient();

  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return { success: false, error: `User not found: ${userEmail}` };
  }

  const { error } = await client
    .from('scoreboards')
    .update({ is_locked: false })
    .eq('owner_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Clear the downgrade notice seen timestamp for a user.
 * Use in afterEach to ensure the downgrade modal appears on next expired login.
 */
export const clearDowngradeNotice = async (
  userEmail: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getServiceClient();

  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return { success: false, error: `User not found: ${userEmail}` };
  }

  const { error } = await client
    .from('user_profiles')
    .update({ downgrade_notice_seen_at: null })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Lock all scoreboards for a user (set is_locked to true).
 * Use in beforeEach to simulate the effect of a downgrade without
 * relying on the client-side DowngradeNoticeManager.
 */
export const lockAllScoreboards = async (
  userEmail: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getServiceClient();

  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return { success: false, error: `User not found: ${userEmail}` };
  }

  const { error } = await client
    .from('scoreboards')
    .update({ is_locked: true })
    .eq('owner_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Mark the downgrade notice as seen for a user.
 * Use in beforeEach to prevent the DowngradeNoticeModal from appearing
 * and blocking interactions with the dashboard in tests that don't test the modal itself.
 */
export const markDowngradeNoticeSeen = async (
  userEmail: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getServiceClient();

  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return { success: false, error: `User not found: ${userEmail}` };
  }

  const { error } = await client
    .from('user_profiles')
    .update({ downgrade_notice_seen_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Get subscription for a user
 */
export const getSubscription = async (userEmail: string) => {
  const client = getServiceClient();

  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return null;
  }

  const { data } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
};

// =============================================================================
// PLAYWRIGHT FIXTURE HELPERS
// =============================================================================

/**
 * Setup subscription before test (use in test.beforeEach)
 */
export const setupTestSubscription = async (
  userEmail: string,
  state: SubscriptionState,
  options?: SubscriptionFixtureOptions
) => {
  const result = await seedSubscription(userEmail, state, options);
  if (!result.success) {
    throw new Error(`Failed to setup subscription: ${result.error}`);
  }
  return result.subscriptionId;
};

/**
 * Cleanup subscription after test (use in test.afterEach)
 */
export const cleanupTestSubscription = async (userEmail: string) => {
  await removeSubscription(userEmail);
};

// =============================================================================
// EXPORT TEST USER EMAIL
// =============================================================================

export const SUPPORTER_EMAIL =
  process.env.AUTOMATED_TEST_SUPPORTER_2_EMAIL || 'patron@example.com';

export const SARAH_SUPPORTER_EMAIL =
  process.env.AUTOMATED_TEST_SUPPORTER_1_EMAIL || 'sarah@example.com';

/** Per-project supporter email for Mobile iPhone 12 (avoids cross-project subscription races) */
export const SUPPORTER_3_EMAIL =
  process.env.AUTOMATED_TEST_SUPPORTER_3_EMAIL || 'patron2@example.com';

/** Per-project supporter email for Mobile Minimum (avoids cross-project subscription races) */
export const SUPPORTER_4_EMAIL =
  process.env.AUTOMATED_TEST_SUPPORTER_4_EMAIL || 'patron3@example.com';

/** Dedicated supporter email for tier-limits downgrade tests (avoids races with subscription.spec.ts) */
export const SUPPORTER_6_EMAIL =
  process.env.AUTOMATED_TEST_SUPPORTER_6_EMAIL || 'patron5@example.com';
