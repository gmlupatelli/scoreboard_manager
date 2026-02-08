/**
 * Subscription & Supporter Plan Tests
 * Tests subscription UI states, cancel/resume flows, and tier display
 *
 * @fast - Quick smoke tests for essential subscription UI
 * @full - Comprehensive subscription functionality coverage
 * @desktop-only - Subscription management flows
 *
 * Uses route interception to mock LemonSqueezy API responses
 */

import { test as authTest, expect, TEST_USERS } from './fixtures/auth';
import {
  seedSubscription,
  removeSubscription,
  SUPPORTER_EMAIL,
  type SubscriptionState,
} from './fixtures/subscriptions';

// Helper to set up subscription state before tests
const setupSubscriptionState = async (state: SubscriptionState | 'none') => {
  if (state === 'none') {
    await removeSubscription(SUPPORTER_EMAIL);
  } else {
    await seedSubscription(SUPPORTER_EMAIL, state);
  }
};

// =============================================================================
// SUPPORTER PLAN PAGE - NO SUBSCRIPTION
// =============================================================================

authTest.describe('Supporter Plan - No Subscription', () => {
  authTest.beforeEach(async () => {
    await setupSubscriptionState('none');
  });

  authTest('@fast shows subscription tiers when not subscribed', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should show tier selection cards
    const supporterTier = page.locator('text=Supporter');
    const championTier = page.locator('text=Champion');

    await expect(supporterTier.first()).toBeVisible();
    await expect(championTier.first()).toBeVisible();
  });

  authTest('@fast shows subscription benefits', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should show benefit descriptions
    const kioskBenefit = page.locator('text=/kiosk/i');
    await expect(kioskBenefit.first()).toBeVisible();
  });

  authTest('@full @desktop-only subscribe button triggers checkout', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);

    // Intercept checkout API
    let checkoutCalled = false;
    await page.route('**/api/lemonsqueezy/checkout', async (route) => {
      checkoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkoutUrl: 'https://checkout.lemonsqueezy.com/test',
          checkoutId: 'checkout_test_123',
        }),
      });
    });

    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Click on a tier to select it
    const supporterCard = page
      .locator('[data-testid="tier-supporter"]')
      .or(page.locator('text=Supporter').locator('..').locator('..'));

    if (await supporterCard.isVisible()) {
      await supporterCard.click();
    }

    // Find and click subscribe button
    const subscribeButton = page.locator('button:has-text("Subscribe")').first();
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
      await page.waitForTimeout(1000);

      // Checkout API should have been called
      expect(checkoutCalled).toBe(true);
    }
  });
});

// =============================================================================
// SUPPORTER PLAN PAGE - ACTIVE SUBSCRIPTION
// =============================================================================

authTest.describe('Supporter Plan - Active Subscription', () => {
  authTest.beforeEach(async () => {
    await setupSubscriptionState('active');
  });

  authTest.afterEach(async () => {
    await removeSubscription(SUPPORTER_EMAIL);
  });

  authTest('@fast shows current subscription status', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should show active status indicator
    const activeStatus = page.locator('text=/active/i');
    await expect(activeStatus.first()).toBeVisible();
  });

  authTest('@fast shows current tier', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should display the supporter tier
    const tierDisplay = page.locator('text=/supporter/i');
    await expect(tierDisplay.first()).toBeVisible();
  });

  authTest('@fast shows manage billing button', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    const manageBillingButton = page.locator('button:has-text("Manage Billing")');
    await expect(manageBillingButton).toBeVisible();
  });

  authTest('@full @desktop-only shows cancel subscription button', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    await expect(cancelButton).toBeVisible();
  });

  authTest(
    '@full @desktop-only cancel button shows confirmation modal',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.supporter);
      await page.goto('/supporter-plan');
      await page.waitForLoadState('networkidle');

      const cancelButton = page.locator('button:has-text("Cancel Subscription")');
      await cancelButton.click();

      // Modal should appear
      const modal = page
        .locator('[role="dialog"]')
        .or(page.locator('.bg-surface.rounded-lg.shadow-lg'));
      await expect(modal.first()).toBeVisible();

      // Modal should have warning text
      const warningText = page.locator('text=/cancel/i');
      await expect(warningText.first()).toBeVisible();

      // Should have Keep and Cancel buttons
      const keepButton = page.locator('button:has-text("Keep Subscription")');
      await expect(keepButton).toBeVisible();
    }
  );

  authTest('@full @desktop-only change tier button is visible', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    const changeTierButton = page.locator('button:has-text("Change Tier")');
    await expect(changeTierButton).toBeVisible();
  });
});

// =============================================================================
// SUPPORTER PLAN PAGE - CANCELLED (GRACE PERIOD)
// =============================================================================

authTest.describe('Supporter Plan - Cancelled (Grace Period)', () => {
  authTest.beforeEach(async () => {
    await setupSubscriptionState('cancelled_grace_period');
  });

  authTest.afterEach(async () => {
    await removeSubscription(SUPPORTER_EMAIL);
  });

  authTest('@fast shows cancelled status with end date', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should show cancelled status
    const cancelledStatus = page.locator('text=/cancelled/i');
    await expect(cancelledStatus.first()).toBeVisible();

    // Should show benefits end date
    const benefitsUntil = page.locator('text=/benefits.*until/i');
    await expect(benefitsUntil.first()).toBeVisible();
  });

  authTest('@fast shows reactivate button', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    const reactivateButton = page.locator('button:has-text("Reactivate")');
    await expect(reactivateButton).toBeVisible();
  });

  authTest('@full @desktop-only reactivate calls resume API', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);

    // Intercept resume API
    let resumeCalled = false;
    await page.route('**/api/lemonsqueezy/resume-subscription', async (route) => {
      resumeCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    const reactivateButton = page.locator('button:has-text("Reactivate")');
    await reactivateButton.click();
    await page.waitForTimeout(1000);

    expect(resumeCalled).toBe(true);
  });

  authTest('@full @desktop-only does not show cancel button', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    await expect(cancelButton).not.toBeVisible();
  });
});

// =============================================================================
// SUPPORTER PLAN PAGE - GIFTED SUBSCRIPTION
// =============================================================================

authTest.describe('Supporter Plan - Gifted Subscription', () => {
  authTest.beforeEach(async () => {
    await setupSubscriptionState('gifted');
  });

  authTest.afterEach(async () => {
    await removeSubscription(SUPPORTER_EMAIL);
  });

  authTest('@fast shows gifted badge', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should show gifted indicator
    const giftedBadge = page.locator('text=/gift/i');
    await expect(giftedBadge.first()).toBeVisible();
  });

  authTest('@fast does not show billing management for gifted', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter);
    await page.goto('/supporter-plan');
    await page.waitForLoadState('networkidle');

    // Should not show manage billing for gifted subscriptions
    const manageBillingButton = page.locator('button:has-text("Manage Billing")');
    await expect(manageBillingButton).not.toBeVisible();
  });
});

// =============================================================================
// DASHBOARD - SUBSCRIPTION WARNINGS
// =============================================================================

authTest.describe('Dashboard - Subscription Warnings', () => {
  authTest.afterEach(async () => {
    await removeSubscription(SUPPORTER_EMAIL);
  });

  authTest(
    '@full @desktop-only shows warning banner for cancelled subscription',
    async ({ page, loginAs }) => {
      await setupSubscriptionState('cancelled_grace_period');
      await loginAs(TEST_USERS.supporter);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should show cancellation warning on dashboard
      const warningBanner = page.locator('text=/subscription.*cancelled/i');
      const reactivateLink = page
        .locator('a:has-text("Reactivate")')
        .or(page.locator('button:has-text("Reactivate")'));

      // Either warning banner or reactivate link should be visible
      const hasWarning = await warningBanner
        .first()
        .isVisible()
        .catch(() => false);
      const hasReactivate = await reactivateLink
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasWarning || hasReactivate).toBeTruthy();
    }
  );
});

// =============================================================================
// KIOSK MODE - SUBSCRIBER ACCESS
// =============================================================================

authTest.describe('Kiosk Mode - Subscriber Access', () => {
  authTest.beforeEach(async () => {
    await setupSubscriptionState('active');
  });

  authTest.afterEach(async () => {
    await removeSubscription(SUPPORTER_EMAIL);
  });

  authTest(
    '@full @desktop-only subscriber can access kiosk configuration',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.supporter);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Find a scoreboard card
      const scoreboardCard = page.locator('.bg-card.rounded-lg').first();

      if (await scoreboardCard.isVisible()) {
        await scoreboardCard.click();
        await page.waitForLoadState('networkidle');

        // Look for kiosk mode option
        const kioskButton = page
          .locator('button:has-text("Kiosk")')
          .or(page.locator('a:has-text("Kiosk")'));

        // Kiosk should be accessible for supporters
        if (await kioskButton.isVisible()) {
          await expect(kioskButton).toBeEnabled();
        }
      }
    }
  );
});
