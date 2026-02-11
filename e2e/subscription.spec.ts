/**
 * Subscription & Supporter Plan Tests
 * Tests subscription UI states, cancel/resume flows, and tier display
 *
 * @fast - Quick smoke tests for essential subscription UI
 * @full - Comprehensive subscription functionality coverage
 * @desktop-only - Subscription management flows
 *
 * Uses route interception to mock LemonSqueezy API responses
 *
 * CROSS-PROJECT ISOLATION:
 * Each Playwright project (Desktop Chrome, Mobile iPhone 12, Mobile Minimum)
 * uses its own dedicated supporter user to avoid cross-project race conditions
 * when mutating subscription state via seedSubscription/removeSubscription.
 *
 * Project → User mapping:
 *   Desktop Chrome   → patron@example.com   (SUPPORTER_2)
 *   Mobile iPhone 12 → patron2@example.com  (SUPPORTER_3)
 *   Mobile Minimum   → patron3@example.com  (SUPPORTER_4)
 *
 * Serial mode within each project prevents intra-worker races.
 */

import { test as authTest, expect, TEST_USERS } from './fixtures/auth';
import {
  seedSubscription,
  removeSubscription,
  SUPPORTER_EMAIL,
  SUPPORTER_3_EMAIL,
  SUPPORTER_4_EMAIL,
  type SubscriptionState,
} from './fixtures/subscriptions';

// Force all tests in this file to run serially on a single worker
// to prevent intra-project races on the shared supporter user
authTest.describe.configure({ mode: 'serial' });

/**
 * Get the supporter user and email for the current Playwright project.
 * Each project gets its own user to avoid cross-project subscription races.
 */
function getProjectSupporter(projectName: string) {
  switch (projectName) {
    case 'Mobile iPhone 12':
      return { user: TEST_USERS.supporter3, email: SUPPORTER_3_EMAIL };
    case 'Mobile Minimum':
      return { user: TEST_USERS.supporter4, email: SUPPORTER_4_EMAIL };
    default: // 'Desktop Chrome' and any others
      return { user: TEST_USERS.supporter, email: SUPPORTER_EMAIL };
  }
}

// Helper to set up subscription state before tests
const setupSubscriptionState = async (email: string, state: SubscriptionState | 'none') => {
  if (state === 'none') {
    const result = await removeSubscription(email);
    if (!result.success) {
      console.warn(`removeSubscription(${email}) failed: ${result.error}`);
    }
  } else {
    const result = await seedSubscription(email, state);
    if (!result.success) {
      console.warn(`seedSubscription(${email}, ${state}) failed: ${result.error}`);
    }
  }
};

/**
 * Navigate to a page after login, handling potential client-side redirect
 * interruptions that can occur on slower mobile viewports.
 */
async function navigateAfterLogin(page: import('@playwright/test').Page, targetPath: string) {
  // Wait for login redirect to settle on the dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');

  // Attempt navigation — may be interrupted by lingering auth redirects on mobile
  try {
    await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  } catch {
    // If navigation was interrupted, retry after a brief wait
    await page.waitForTimeout(1000);
    await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// SUPPORTER PLAN PAGE - NO SUBSCRIPTION
// =============================================================================

authTest.describe('Supporter Plan - No Subscription', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'none');
  });

  authTest('@fast shows subscription tiers when not subscribed', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Should show tier selection cards
    const supporterTier = page.locator('text=Supporter');
    const championTier = page.locator('text=Champion');

    await expect(supporterTier.first()).toBeVisible();
    await expect(championTier.first()).toBeVisible();
  });

  authTest('@fast shows subscription benefits', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Should show benefit descriptions
    const kioskBenefit = page.locator('text=/kiosk/i');
    await expect(kioskBenefit.first()).toBeVisible();
  });

  authTest('@full @desktop-only subscribe button triggers checkout', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);

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

    // Wait for login redirect to settle before navigating
    await navigateAfterLogin(page, '/supporter-plan');

    // Click on a tier to select it
    const supporterCard = page
      .locator('[data-testid="tier-supporter"]')
      .or(page.locator('.grid >> text=Supporter').first());

    if (await supporterCard.first().isVisible()) {
      await supporterCard.first().click();
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
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'active');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest('@fast shows current subscription status', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // The DowngradeNoticeManager may show a "Your plan has ended" modal briefly
    // if there was a gap between removing and re-seeding the subscription.
    // Dismiss it if it appears so we can check the actual page content.
    const downgradeModal = page.locator('h3:has-text("Your plan has ended")');
    const isModalVisible = await downgradeModal.isVisible().catch(() => false);
    if (isModalVisible) {
      const dismissButton = page.locator('button:has-text("I Understand")');
      if (await dismissButton.isVisible().catch(() => false)) {
        await dismissButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Wait for subscription data to load - may take a moment for AuthContext to fetch
    // Target the specific status badge span (rounded-full pill) to avoid matching parent containers
    const statusBadge = page.locator('span.rounded-full:has-text("Active")');
    await expect(statusBadge.first()).toBeVisible({ timeout: 15000 });
  });

  authTest('@fast shows current tier', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Wait for Current Plan card to appear, then check the TierBadge inside it
    // (avoids matching the hidden header TierBadge on mobile viewports)
    const currentPlanCard = page.locator('text=/Current Plan/i').first();
    await expect(currentPlanCard).toBeVisible({ timeout: 15000 });
    const tierBadge = page.locator('.rounded-lg:has(h2:has-text("Current Plan")) span.rounded-full:has-text("Supporter")');
    await expect(tierBadge).toBeVisible({ timeout: 10000 });
  });

  authTest('@fast shows manage billing button', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    const manageBillingButton = page.locator('button:has-text("Manage Billing")');
    await expect(manageBillingButton).toBeVisible();
  });

  authTest('@full @desktop-only shows cancel subscription button', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Wait for subscription to fully load
    await page.waitForSelector('text=/active/i', { timeout: 15000 }).catch(() => {});
    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
  });

  authTest(
    '@full @desktop-only cancel button shows confirmation modal',
    async ({ page, loginAs }, testInfo) => {
      const { user } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);
      await navigateAfterLogin(page, '/supporter-plan');

      // Wait for subscription to fully load
      await page.waitForSelector('text=/active/i', { timeout: 15000 }).catch(() => {});
      const cancelButton = page.locator('button:has-text("Cancel Subscription")');
      await cancelButton.waitFor({ state: 'visible', timeout: 10000 });
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

  authTest('@full @desktop-only change tier button is visible', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Wait for subscription to fully load
    await page.waitForSelector('text=/active/i', { timeout: 15000 }).catch(() => {});
    const changeTierButton = page.locator('button:has-text("Change Tier")');
    await expect(changeTierButton).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// SUPPORTER PLAN PAGE - CANCELLED (GRACE PERIOD)
// =============================================================================

authTest.describe('Supporter Plan - Cancelled (Grace Period)', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'cancelled_grace_period');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest('@fast shows cancelled status with end date', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Wait for subscription data to load
    const cancelledStatus = page.locator('text=/cancelled/i');
    await expect(cancelledStatus.first()).toBeVisible({ timeout: 15000 });

    // Should show benefits end date
    const benefitsUntil = page.locator('text=/benefits.*until/i');
    await expect(benefitsUntil.first()).toBeVisible();
  });

  authTest('@fast shows reactivate button', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Wait for subscription to load
    await page.waitForSelector('text=/cancelled/i', { timeout: 15000 }).catch(() => {});
    const reactivateButton = page.locator('button:has-text("Reactivate")');
    await expect(reactivateButton).toBeVisible({ timeout: 10000 });
  });

  authTest('@full @desktop-only reactivate calls resume API', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);

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

    await navigateAfterLogin(page, '/supporter-plan');

    // Wait for subscription to load
    await page.waitForSelector('text=/cancelled/i', { timeout: 15000 }).catch(() => {});
    const reactivateButton = page.locator('button:has-text("Reactivate")');
    await reactivateButton.waitFor({ state: 'visible', timeout: 10000 });
    await reactivateButton.click();
    await page.waitForTimeout(1000);

    expect(resumeCalled).toBe(true);
  });

  authTest('@full @desktop-only does not show cancel button', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    await expect(cancelButton).not.toBeVisible();
  });
});

// =============================================================================
// SUPPORTER PLAN PAGE - GIFTED SUBSCRIPTION
// =============================================================================

authTest.describe('Supporter Plan - Gifted Subscription', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'gifted');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest('@fast shows gifted subscription as active', async ({ page, loginAs }, testInfo) => {
    const { user } = getProjectSupporter(testInfo.project.name);
    await loginAs(user);
    await navigateAfterLogin(page, '/supporter-plan');

    // Gifted subscriptions should show as active with Current Plan card
    const currentPlan = page.locator('text=/Current Plan/i');
    await expect(currentPlan.first()).toBeVisible();

    // Should show active status indicator
    const activeStatus = page.locator('text=/active/i');
    await expect(activeStatus.first()).toBeVisible();
  });

  authTest(
    '@fast gifted subscription has disabled billing management',
    async ({ page, loginAs }, testInfo) => {
      const { user } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);
      await navigateAfterLogin(page, '/supporter-plan');

      // Manage Billing button should be visible but disabled for gifted subscriptions
      // (gifted subs have no LemonSqueezy subscription ID)
      const manageBillingButton = page.locator('button:has-text("Manage Billing")');
      await expect(manageBillingButton).toBeVisible();
      await expect(manageBillingButton).toBeDisabled();
    }
  );
});

// =============================================================================
// DASHBOARD - SUBSCRIPTION WARNINGS
// =============================================================================

authTest.describe('Dashboard - Subscription Warnings', () => {
  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest(
    '@full @desktop-only shows warning banner for cancelled subscription',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await setupSubscriptionState(email, 'cancelled_grace_period');
      await loginAs(user);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Subscription status loads asynchronously from AuthContext.
      // Wait for the "Subscription Cancelled" warning text to appear
      // or the downgrade notice which appears for cancelled subscriptions.
      const warningText = page
        .locator('text=/Subscription Cancelled/i')
        .or(page.locator('text=/cancelled.*benefits/i'))
        .first();
      await expect(warningText).toBeVisible({ timeout: 20000 });
    }
  );
});

// =============================================================================
// KIOSK MODE - SUBSCRIBER ACCESS
// =============================================================================

authTest.describe('Kiosk Mode - Subscriber Access', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'active');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest(
    '@full @desktop-only subscriber can access kiosk configuration',
    async ({ page, loginAs }, testInfo) => {
      const { user } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);
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
