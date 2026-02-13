/**
 * Subscription & Supporter Plan Tests
 * Tests subscription UI states, cancel/resume flows, and tier display.
 *
 * Uses route interception to mock LemonSqueezy API responses where needed.
 * All tests use the same user, so we run serially to avoid subscription state races.
 *
 * Dedicated accounts: SUPPORTER_2
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import {
  seedSubscription,
  removeSubscription,
  SUPPORTER_2_EMAIL,
} from './fixtures/subscriptions';
import { navigateToSubscription } from './fixtures/helpers';

// Force serial: all tests share morgan@example.com and mutate subscription state
test.describe.configure({ mode: 'serial' });

// =============================================================================
// NO SUBSCRIPTION STATE
// =============================================================================

test.describe('No Subscription State', () => {
  test.beforeAll(async () => {
    await removeSubscription(SUPPORTER_2_EMAIL);
  });

  test('should display subscription tiers when not subscribed', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Should show tier selection cards (scope to main to avoid hidden mobile nav links)
    const mainContent = page.locator('main');
    const supporterTier = mainContent.locator('text=Supporter');
    const championTier = mainContent.locator('text=Champion');

    await expect(supporterTier.first()).toBeVisible({ timeout: 15000 });
    await expect(championTier.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show checkout button for each tier', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Checkout button should be present (shows "Become a Supporter" / "Become a Champion")
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    await expect(checkoutButton).toBeVisible({ timeout: 15000 });
  });
});

// =============================================================================
// ACTIVE SUBSCRIPTION
// =============================================================================

test.describe('Active Subscription', () => {
  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_2_EMAIL, 'active');
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_2_EMAIL);
  });

  test('should display current subscription status', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Dismiss downgrade modal if it appears from a previous test run gap
    const downgradeModal = page.locator('h3:has-text("Your plan has ended")');
    const dismissButton = page.locator('button:has-text("I Understand")');
    try {
      await downgradeModal.waitFor({ state: 'visible', timeout: 2000 });
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        await dismissButton.waitFor({ state: 'hidden' });
      }
    } catch {
      // Modal didn't appear — continue
    }

    // Target the specific status badge span (rounded-full pill)
    const statusBadge = page.locator('span.rounded-full:has-text("Active")');
    await expect(statusBadge.first()).toBeVisible({ timeout: 15000 });

    // Verify tier badge inside the Current Plan card
    const currentPlanCard = page.locator('text=/Current Plan/i').first();
    await expect(currentPlanCard).toBeVisible({ timeout: 15000 });
    const tierBadge = page.locator(
      '.rounded-lg:has(h2:has-text("Current Plan")) span.rounded-full:has-text("Supporter")'
    );
    await expect(tierBadge).toBeVisible({ timeout: 10000 });
  });

  test('should show cancel subscription option', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Wait for subscription data to fully render
    const activeIndicator = page.locator('text=/active/i').first();
    await expect(activeIndicator).toBeVisible({ timeout: 15000 });

    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
  });

  test('should intercept cancel and show confirmation', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Wait for subscription data to fully render
    const activeIndicator = page.locator('text=/active/i').first();
    await expect(activeIndicator).toBeVisible({ timeout: 15000 });

    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    await cancelButton.waitFor({ state: 'visible', timeout: 10000 });
    await cancelButton.click();

    // Confirmation modal should appear
    const modal = page
      .locator('[role="dialog"]')
      .or(page.locator('[data-testid="cancel-subscription-modal"]'));
    await expect(modal.first()).toBeVisible();

    // Modal should have warning text about cancellation
    const warningText = page.locator('text=/cancel/i');
    await expect(warningText.first()).toBeVisible();

    // Should have a "Keep Subscription" escape hatch
    const keepButton = page.locator('[data-testid="keep-subscription-button"]');
    await expect(keepButton).toBeVisible();
  });
});

// =============================================================================
// CANCELLED GRACE PERIOD
// =============================================================================

test.describe('Cancelled Grace Period', () => {
  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_2_EMAIL, 'cancelled_grace_period');
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_2_EMAIL);
  });

  test('should show cancelled status with grace period info', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Wait for cancelled status to render
    const cancelledStatus = page.locator('text=/cancelled/i');
    await expect(cancelledStatus.first()).toBeVisible({ timeout: 15000 });

    // Should display when benefits expire
    const benefitsUntil = page.locator('text=/benefits.*until/i');
    await expect(benefitsUntil.first()).toBeVisible();
  });

  test('should show resume subscription option', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);

    // Intercept resume API to avoid real LemonSqueezy calls
    let resumeCalled = false;
    await page.route('**/api/lemonsqueezy/resume-subscription', async (route) => {
      resumeCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await navigateToSubscription(page);

    // Wait for cancelled state to load
    const cancelledStatus = page.locator('text=/cancelled/i').first();
    await expect(cancelledStatus).toBeVisible({ timeout: 15000 });

    const reactivateButton = page.locator('button:has-text("Reactivate")');
    await expect(reactivateButton).toBeVisible({ timeout: 10000 });

    // Click reactivate and verify the API was called
    await reactivateButton.click();
    await expect.poll(() => resumeCalled, { timeout: 5000 }).toBe(true);
  });
});

// =============================================================================
// GIFTED SUBSCRIPTION
// =============================================================================

test.describe('Gifted Subscription', () => {
  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_2_EMAIL, 'gifted', { tier: 'supporter' });
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_2_EMAIL);
  });

  test('should display gifted subscription as active', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Gifted subscriptions should show Current Plan card with active status
    const currentPlan = page.locator('text=/Current Plan/i');
    await expect(currentPlan.first()).toBeVisible({ timeout: 15000 });

    const activeStatus = page.locator('text=/active/i');
    await expect(activeStatus.first()).toBeVisible();
  });

  test('should not show billing management for gifted', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter2);
    await navigateToSubscription(page);

    // Manage Billing should be visible but disabled for gifted (no LS subscription ID)
    const manageBillingButton = page.locator('[data-testid="manage-billing-button"]');
    await expect(manageBillingButton).toBeVisible({ timeout: 15000 });
    await expect(manageBillingButton).toBeDisabled();

    // Cancel/Reactivate buttons should be disabled for gifted subscriptions
    // (they exist in the DOM but are disabled since there's no LS subscription ID)
    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    const reactivateButton = page.locator('button:has-text("Reactivate")');

    // Cancel button may be visible but disabled
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeDisabled();
    }
    // Reactivate should not be visible for active gifted subscriptions
    await expect(reactivateButton).not.toBeVisible();
  });
});

// =============================================================================
// DASHBOARD WARNINGS
// =============================================================================

test.describe('Dashboard Warnings', () => {
  test('should show warning when subscription is cancelled with grace period', async ({ page, loginAs }) => {
    // Seed cancelled_grace_period state to trigger the "Subscription Cancelled" warning banner
    // The dashboard shows a warning when status === 'cancelled' and ends_at is in the future
    await seedSubscription(SUPPORTER_2_EMAIL, 'cancelled_grace_period');

    try {
      await loginAs(TEST_USERS.supporter2);
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // Look for the "Subscription Cancelled" warning banner
      const warningText = page
        .locator('text=/Subscription Cancelled/i')
        .or(page.locator('text=/Benefits active until/i'))
        .first();
      await expect(warningText).toBeVisible({ timeout: 20000 });
    } finally {
      await removeSubscription(SUPPORTER_2_EMAIL);
    }
  });
});
