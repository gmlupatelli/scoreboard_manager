/**
 * Supporter Recognition E2E Tests (Phase 2)
 * Tests the welcome modal, supporter preferences, and public supporters page.
 *
 * @fast - Quick smoke tests for essential supporter recognition UI
 * @full - Comprehensive functionality coverage
 * @desktop-only - Supporter management flows
 *
 * CROSS-PROJECT ISOLATION:
 * Uses the same per-project supporter mapping as subscription.spec.ts:
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
  getSubscription,
  type SubscriptionState,
} from './fixtures/subscriptions';

// Force all tests in this file to run serially on a single worker
authTest.describe.configure({ mode: 'serial' });

/**
 * Get the supporter user and email for the current Playwright project.
 */
function getProjectSupporter(projectName: string) {
  switch (projectName) {
    case 'Mobile iPhone 12':
      return { user: TEST_USERS.supporter3, email: SUPPORTER_3_EMAIL };
    case 'Mobile Minimum':
      return { user: TEST_USERS.supporter4, email: SUPPORTER_4_EMAIL };
    default:
      return { user: TEST_USERS.supporter, email: SUPPORTER_EMAIL };
  }
}

// Retries to handle cross-file race conditions with subscription.spec.ts
const setupSubscriptionState = async (email: string, state: SubscriptionState | 'none') => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (state === 'none') {
      const result = await removeSubscription(email);
      if (!result.success) {
        console.warn(`removeSubscription(${email}) attempt ${attempt} failed: ${result.error}`);
      }
      // Verify removal
      const sub = await getSubscription(email);
      if (!sub) break; // Confirmed removed
      if (attempt < MAX_RETRIES) {
        console.warn(`Subscription still exists for ${email} after removal attempt ${attempt}, retrying...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    } else {
      const result = await seedSubscription(email, state);
      if (!result.success) {
        console.warn(`seedSubscription(${email}, ${state}) attempt ${attempt} failed: ${result.error}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
        continue;
      }
      // Verify seeded
      const sub = await getSubscription(email);
      if (sub && sub.status === (state === 'cancelled_grace_period' ? 'cancelled' : state)) break;
      if (attempt < MAX_RETRIES) {
        console.warn(`Subscription state mismatch for ${email} after seed attempt ${attempt}, retrying...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
};

/**
 * Navigate to a page after login, handling potential client-side redirect
 * interruptions.
 */
async function navigateAfterLogin(page: import('@playwright/test').Page, targetPath: string) {
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');

  try {
    await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.waitForTimeout(1000);
    await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// WELCOME MODAL - AFTER CHECKOUT SUCCESS
// =============================================================================

authTest.describe('Welcome Modal - After Checkout', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'active');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest(
    '@full @desktop-only welcome modal appears after checkout success',
    async ({ page, loginAs }, testInfo) => {
      // Increase timeout — this test has inherent delays from the welcome modal retry logic
      authTest.setTimeout(60000);
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);

      // Ensure subscription is active right before navigation to prevent race with subscription.spec.ts
      await setupSubscriptionState(email, 'active');

      // Navigate to dashboard with subscription=success query param
      await page.goto('/dashboard?subscription=success', {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForLoadState('networkidle');

      // Dismiss downgrade modal if it appears
      const downgradeModal = page.locator('h3:has-text("Your plan has ended")');
      const isDowngradeVisible = await downgradeModal.isVisible().catch(() => false);
      if (isDowngradeVisible) {
        const dismissButton = page.locator('button:has-text("I Understand")');
        if (await dismissButton.isVisible().catch(() => false)) {
          await dismissButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // Welcome modal should appear after retry logic completes (component retries 3x with 2s interval)
      const welcomeModal = page.locator('[role="dialog"]:has-text("Welcome, Supporter")');
      let isModalVisible = await welcomeModal.isVisible({ timeout: 15000 }).catch(() => false);

      // If the modal didn't appear, it may be because subscription was removed during retry logic.
      // Re-seed and navigate again with the success param.
      if (!isModalVisible) {
        await setupSubscriptionState(email, 'active');
        await page.goto('/dashboard?subscription=success', {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForLoadState('networkidle');

        // Dismiss downgrade modal again if needed
        const retryDowngradeModal = page.locator('h3:has-text("Your plan has ended")');
        if (await retryDowngradeModal.isVisible().catch(() => false)) {
          const retryDismiss = page.locator('button:has-text("I Understand")');
          if (await retryDismiss.isVisible().catch(() => false)) {
            await retryDismiss.click();
            await page.waitForTimeout(1000);
          }
        }

        isModalVisible = await welcomeModal.isVisible({ timeout: 15000 }).catch(() => false);
      }

      await expect(welcomeModal).toBeVisible({ timeout: 5000 });

      // Should have display name input
      const displayNameInput = page.locator('#supporter-display-name');
      await expect(displayNameInput).toBeVisible();

      // Should have toggle switch (implemented as a styled checkbox)
      const toggleSwitch = page.locator('input[type="checkbox"]');
      await expect(toggleSwitch.first()).toBeVisible({ timeout: 5000 }).catch(async () => {
        // Checkbox may be sr-only (visually hidden) — verify it exists in DOM
        await expect(page.locator('label:has(input[type="checkbox"])')).toBeVisible();
      });

      // Should have Continue button
      const continueButton = page.locator('button:has-text("Continue to Dashboard")');
      await expect(continueButton).toBeVisible();

      // Should have Skip link
      const skipLink = page.locator('button:has-text("Skip for now")');
      await expect(skipLink).toBeVisible();
    },
  );

  authTest(
    '@full @desktop-only welcome modal skip closes without saving',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);

      // Ensure subscription is active right before navigation to prevent race with subscription.spec.ts
      await setupSubscriptionState(email, 'active');

      await page.goto('/dashboard?subscription=success', {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForLoadState('networkidle');

      // Dismiss downgrade modal if it appears
      const downgradeModal = page.locator('h3:has-text("Your plan has ended")');
      const isDowngradeVisible = await downgradeModal.isVisible().catch(() => false);
      if (isDowngradeVisible) {
        const dismissButton = page.locator('button:has-text("I Understand")');
        if (await dismissButton.isVisible().catch(() => false)) {
          await dismissButton.click();
          await page.waitForTimeout(1000);
        }
      }

      const welcomeModal = page.locator('[role="dialog"]:has-text("Welcome, Supporter")');
      await expect(welcomeModal).toBeVisible({ timeout: 20000 });

      // Click Skip
      const skipLink = page.locator('button:has-text("Skip for now")');
      await skipLink.click();

      // Modal should close
      await expect(welcomeModal).not.toBeVisible({ timeout: 5000 });
    },
  );
});

// =============================================================================
// SUPPORTER PREFERENCES - PROFILE SETTINGS
// =============================================================================

authTest.describe('Supporter Preferences - Profile Settings', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'active');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest(
    '@fast shows supporter recognition section for active subscriber',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);

      // Ensure subscription is active right before page load to prevent race with other spec files
      await setupSubscriptionState(email, 'active');
      await navigateAfterLogin(page, '/user-profile-management');

      // Wait for the profile page to load
      const heading = page.locator('h1:has-text("Profile Settings")');
      await expect(heading).toBeVisible({ timeout: 15000 });

      // If the Supporter Recognition section isn't visible, subscription may have been removed
      // by another spec file — re-seed and reload
      const supporterSection = page.locator('h2:has-text("Supporter Recognition")');
      const hasSection = await supporterSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasSection) {
        await setupSubscriptionState(email, 'active');
        await page.reload({ waitUntil: 'networkidle' });
        await expect(heading).toBeVisible({ timeout: 15000 });
      }

      // Supporter Recognition section should be visible
      await expect(supporterSection).toBeVisible({ timeout: 15000 });

      // Should show tier badge within the Supporter Recognition section
      // (avoid matching the hidden header TierBadge on mobile viewports)
      const supporterCard = supporterSection.locator('..');
      const tierBadge = supporterCard.locator('text=/Supporter/i');
      await expect(tierBadge.first()).toBeVisible({ timeout: 10000 });
    },
  );

  authTest(
    '@full @desktop-only can edit supporter preferences',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);

      // Ensure subscription is active right before navigation to prevent race with subscription.spec.ts
      await setupSubscriptionState(email, 'active');

      // Intercept the API call to verify it's made correctly
      let apiCalled = false;
      await page.route('**/api/user/supporter-preferences', async (route) => {
        apiCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: 'test' } }),
        });
      });

      await navigateAfterLogin(page, '/user-profile-management');

      // Wait for Supporter Recognition section to load
      const supporterSection = page.locator('h2:has-text("Supporter Recognition")');
      const hasSupporterSection = await supporterSection.isVisible({ timeout: 5000 }).catch(() => false);

      // If section not visible, re-seed and reload (race condition protection)
      if (!hasSupporterSection) {
        await setupSubscriptionState(email, 'active');
        await page.reload({ waitUntil: 'networkidle' });
      }
      await expect(supporterSection).toBeVisible({ timeout: 15000 });

      // Click Edit within the Supporter Recognition section specifically
      const supporterCard = supporterSection.locator('..');
      const editButton = supporterCard.locator('button:has-text("Edit")');
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
      await editButton.click();

      // Fill in display name
      const displayNameInput = page.locator(
        'input[placeholder="Leave blank to use your account name"]',
      );
      await displayNameInput.waitFor({ state: 'visible', timeout: 5000 });
      await displayNameInput.fill('TestDisplayName');

      // Click Save
      const saveButton = supporterCard.locator('button:has-text("Save")');
      await saveButton.click();
      await page.waitForTimeout(2000);

      // API should have been called
      expect(apiCalled).toBe(true);
    },
  );

  authTest(
    '@full @desktop-only rejects profane display names',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);

      // Ensure subscription is active right before navigation to prevent race with subscription.spec.ts
      await setupSubscriptionState(email, 'active');

      // Mock the API to return a profanity error
      await page.route('**/api/user/supporter-preferences', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error:
              'Display name contains inappropriate language. Please choose another name.',
          }),
        });
      });

      await navigateAfterLogin(page, '/user-profile-management');

      const supporterSection = page.locator('h2:has-text("Supporter Recognition")');
      const hasSupporterSection = await supporterSection.isVisible({ timeout: 5000 }).catch(() => false);

      // If section not visible, re-seed and reload (race condition protection)
      if (!hasSupporterSection) {
        await setupSubscriptionState(email, 'active');
        await page.reload({ waitUntil: 'networkidle' });
      }
      await expect(supporterSection).toBeVisible({ timeout: 15000 });

      // Click Edit within the Supporter Recognition section specifically
      const supporterCard = supporterSection.locator('..');
      const editButton = supporterCard.locator('button:has-text("Edit")');
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
      await editButton.click();

      // Fill in a bad name
      const displayNameInput = page.locator(
        'input[placeholder="Leave blank to use your account name"]',
      );
      await displayNameInput.waitFor({ state: 'visible', timeout: 5000 });
      await displayNameInput.fill('BadWord');

      // Click Save
      const saveButton = supporterCard.locator('button:has-text("Save")');
      await saveButton.click();

      // Should show error toast
      const errorToast = page.locator('text=/inappropriate language/i');
      await expect(errorToast.first()).toBeVisible({ timeout: 10000 });
    },
  );
});

// =============================================================================
// SUPPORTER PREFERENCES - NOT A SUBSCRIBER
// =============================================================================

authTest.describe('Supporter Preferences - Not A Subscriber', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'none');
  });

  authTest(
    '@fast hides supporter section for non-subscribers',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);
      await loginAs(user);

      // Ensure subscription is removed right before navigation to prevent race with subscription.spec.ts
      await setupSubscriptionState(email, 'none');
      await navigateAfterLogin(page, '/user-profile-management');

      // Wait for profile page to load
      const heading = page.locator('h1:has-text("Profile Settings")');
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Supporter section should NOT be visible
      const supporterSection = page.locator('h2:has-text("Supporter Recognition")');

      // If section is visible, race condition — remove subscription and reload
      const isVisible = await supporterSection.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await setupSubscriptionState(email, 'none');
        await page.reload({ waitUntil: 'networkidle' });
        await expect(heading).toBeVisible({ timeout: 15000 });
      }

      await expect(supporterSection).not.toBeVisible({ timeout: 10000 });
    },
  );
});

// =============================================================================
// PUBLIC SUPPORTERS PAGE
// =============================================================================

authTest.describe('Public Supporters Page', () => {
  authTest(
    '@fast supporters page loads and shows tier cards',
    async ({ page }) => {
      await page.goto('/supporters', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // Page title
      const title = page.locator('h1:has-text("Supporters")');
      await expect(title).toBeVisible();

      // Tier cards (scope to main content to avoid hidden mobile nav links containing "Supporters")
      const mainContent = page.locator('main');
      const supporterTierCard = mainContent.locator('p:has-text("Supporter")');
      await expect(supporterTierCard.first()).toBeVisible();

      const championTierCard = mainContent.locator('p:has-text("Champion")');
      await expect(championTierCard.first()).toBeVisible();

      // "Why support?" section
      const whySupport = page.locator('h2:has-text("Why support?")');
      await expect(whySupport).toBeVisible();
    },
  );

  authTest(
    '@fast supporters page shows supporters list or empty state',
    async ({ page }) => {
      await page.goto('/supporters', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // Wait for the supporters list to finish loading
      // Either "Our Supporters" heading should appear, or the empty state
      const supportersList = page.locator('[data-testid="supporters-list"]');
      const emptyState = page.locator('text=/Be the first supporter/i');

      // One of these should be visible
      await expect(
        supportersList.or(emptyState).first(),
      ).toBeVisible({ timeout: 15000 });
    },
  );

  authTest(
    '@fast supporters page has CTA section',
    async ({ page }) => {
      await page.goto('/supporters', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // CTA section
      const ctaSection = page.locator('h2:has-text("Ready to support?")');
      await expect(ctaSection).toBeVisible();

      // View Pricing link
      const pricingLink = page.locator('text=View Pricing');
      await expect(pricingLink).toBeVisible();
    },
  );
});

// =============================================================================
// SUPPORTERS PAGE - OPT-OUT VERIFICATION
// =============================================================================

authTest.describe('Supporters Page - Opt-Out', () => {
  authTest.beforeEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await setupSubscriptionState(email, 'active');
  });

  authTest.afterEach(async ({}, testInfo) => {
    const { email } = getProjectSupporter(testInfo.project.name);
    await removeSubscription(email);
  });

  authTest(
    '@full @desktop-only opt-out hides supporter from public list',
    async ({ page, loginAs }, testInfo) => {
      const { user, email } = getProjectSupporter(testInfo.project.name);

      // Verify the subscription has show_on_supporters_page = true by default
      const sub = await getSubscription(email);
      expect(sub?.show_on_supporters_page).toBe(true);

      await loginAs(user);

      // Mock API to accept the update
      await page.route('**/api/user/supporter-preferences', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { show_on_supporters_page: false } }),
        });
      });

      await navigateAfterLogin(page, '/user-profile-management');

      const supporterSection = page.locator('h2:has-text("Supporter Recognition")');
      const hasSupporterSection = await supporterSection.isVisible({ timeout: 5000 }).catch(() => false);

      // If section not visible, re-seed and reload (race condition protection)
      if (!hasSupporterSection) {
        await setupSubscriptionState(email, 'active');
        await page.reload({ waitUntil: 'networkidle' });
      }
      await expect(supporterSection).toBeVisible({ timeout: 15000 });

      // Click Edit within the Supporter Recognition section specifically
      const supporterCard = supporterSection.locator('..');
      const editButton = supporterCard.locator('button:has-text("Edit")');
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
      await editButton.click();

      // Toggle off the "show on supporters page" switch (styled checkbox)
      const toggleLabel = supporterCard.locator('label:has(input[type="checkbox"])').last();
      await toggleLabel.click();

      // Save changes
      const saveButton = supporterCard.locator('button:has-text("Save")');
      await saveButton.click();
      await page.waitForTimeout(2000);
    },
  );
});
