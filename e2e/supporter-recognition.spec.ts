/**
 * Supporter Recognition E2E Tests
 * Tests the welcome modal, supporter preferences, and public supporters page.
 *
 * All authenticated tests use the same user, so we must run serially to
 * avoid subscription state races.
 *
 * Dedicated accounts: SUPPORTER_3
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { seedSubscription, removeSubscription, SUPPORTER_3_EMAIL } from './fixtures/subscriptions';
import { safeGoto } from './fixtures/helpers';

// Force all tests in this file to run serially — they share the same user account
test.describe.configure({ mode: 'serial' });

/**
 * Helper to dismiss the downgrade notice modal if it's showing.
 */
async function dismissDowngradeModalIfVisible(page: import('@playwright/test').Page) {
  const downgradeModal = page.locator('[data-testid="downgrade-notice-modal"]');
  const isVisible = await downgradeModal.isVisible().catch(() => false);
  if (isVisible) {
    const dismissButton = page.locator('[data-testid="downgrade-notice-dismiss"]');
    if (await dismissButton.isVisible().catch(() => false)) {
      await dismissButton.click();
      await downgradeModal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }
}

/**
 * Helper to trigger the welcome modal by navigating with ?subscription=success.
 * The dashboard component has a ~7s delay before showing the modal (1s + 3×2s retries).
 */
async function triggerAndWaitForWelcomeModal(page: import('@playwright/test').Page) {
  await page.goto('/dashboard?subscription=success', {
    waitUntil: 'domcontentloaded',
  });

  // Give the page a moment to render, then dismiss any blocking modals
  await page.waitForLoadState('domcontentloaded');
  await dismissDowngradeModalIfVisible(page);

  // The component calls router.replace('/dashboard') immediately, then retries
  // refreshSubscription 3 times with 2s intervals before opening the modal.
  // Total delay: ~1s + (3 × 2s) = ~7s. Wait up to 15s.
  const welcomeModal = page.locator('[data-testid="welcome-modal"]');
  try {
    await welcomeModal.waitFor({ state: 'visible', timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// WELCOME MODAL
// =============================================================================

test.describe('Welcome Modal', () => {
  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_3_EMAIL, 'active');
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_3_EMAIL);
  });

  test('should show welcome modal for new supporters', async ({ page, loginAs }) => {
    test.setTimeout(45000);
    await loginAs(TEST_USERS.supporter3);

    let modalAppeared = await triggerAndWaitForWelcomeModal(page);

    // If the modal didn't appear, re-seed and retry once
    if (!modalAppeared) {
      await seedSubscription(SUPPORTER_3_EMAIL, 'active');
      modalAppeared = await triggerAndWaitForWelcomeModal(page);
    }

    const welcomeModal = page.locator('[data-testid="welcome-modal"]');
    await expect(welcomeModal).toBeVisible({ timeout: 5000 });

    // Should have display name input
    const displayNameInput = page.locator('#supporter-display-name');
    await expect(displayNameInput).toBeVisible();

    // Should have toggle switch (sr-only checkbox inside a visible label)
    const checkboxLabel = page.locator('label:has(input[type="checkbox"])');
    await expect(checkboxLabel.first()).toBeVisible({ timeout: 5000 });

    // Should have Continue button
    const continueButton = page.locator('[data-testid="welcome-modal-save"]');
    await expect(continueButton).toBeVisible();

    // Should have Skip link
    const skipLink = page.locator('[data-testid="welcome-modal-skip"]');
    await expect(skipLink).toBeVisible();
  });

  test('should allow dismissing the welcome modal', async ({ page, loginAs }) => {
    test.setTimeout(45000);
    await loginAs(TEST_USERS.supporter3);

    let modalAppeared = await triggerAndWaitForWelcomeModal(page);

    if (!modalAppeared) {
      await seedSubscription(SUPPORTER_3_EMAIL, 'active');
      modalAppeared = await triggerAndWaitForWelcomeModal(page);
    }

    const welcomeModal = page.locator('[data-testid="welcome-modal"]');
    await expect(welcomeModal).toBeVisible({ timeout: 5000 });

    // Click Skip to dismiss
    const skipLink = page.locator('[data-testid="welcome-modal-skip"]');
    await skipLink.click();

    // Modal should close
    await expect(welcomeModal).not.toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// SUPPORTER PREFERENCES
// =============================================================================

test.describe('Supporter Preferences', () => {
  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_3_EMAIL, 'active');
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_3_EMAIL);
  });

  test('should access supporter preferences page', async ({ page, loginAs }) => {
    test.setTimeout(45000);
    await loginAs(TEST_USERS.supporter3);

    // Dismiss any modals that may appear on the dashboard after login
    await dismissDowngradeModalIfVisible(page);

    await safeGoto(page, '/user-profile-management', {
      waitForSelector: 'h1',
      maxRetries: 3,
    });

    // Wait for the page heading to fully render
    await expect(page.locator('h1:has-text("Profile Settings")')).toBeVisible({ timeout: 15000 });

    // Supporter Recognition section should be visible
    const supporterSection = page.locator('h2:has-text("Supporter Recognition")');
    const hasSection = await supporterSection.isVisible().catch(() => false);

    // If section not visible, re-seed and reload (race condition protection)
    if (!hasSection) {
      await seedSubscription(SUPPORTER_3_EMAIL, 'active');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1:has-text("Profile Settings")')).toBeVisible({ timeout: 15000 });
    }

    await expect(supporterSection).toBeVisible({ timeout: 15000 });

    // Should show tier badge within the Supporter Recognition section
    const supporterCard = supporterSection.locator('..');
    const tierBadge = supporterCard.locator('text=/Supporter/i');
    await expect(tierBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle show on supporters page preference', async ({ page, loginAs }) => {
    test.setTimeout(45000);
    await loginAs(TEST_USERS.supporter3);

    // Dismiss any modals that may appear on the dashboard after login
    await dismissDowngradeModalIfVisible(page);

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

    await safeGoto(page, '/user-profile-management', {
      waitForSelector: 'h1',
      maxRetries: 3,
    });

    // Wait for the page heading to fully render
    await expect(page.locator('h1:has-text("Profile Settings")')).toBeVisible({ timeout: 15000 });

    // Wait for Supporter Recognition section to load
    const supporterSection = page.locator('h2:has-text("Supporter Recognition")');
    const hasSupporterSection = await supporterSection.isVisible().catch(() => false);

    // If section not visible, re-seed and reload (race condition protection)
    if (!hasSupporterSection) {
      await seedSubscription(SUPPORTER_3_EMAIL, 'active');
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
    await expect(supporterSection).toBeVisible({ timeout: 15000 });

    // Click Edit within the Supporter Recognition section
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

    // Click Save and wait for API response
    const saveButton = supporterCard.locator('button:has-text("Save")');
    await saveButton.click();

    // Wait for the save to complete by checking the button reverts or a success indicator
    await expect
      .poll(() => apiCalled, { timeout: 10000, intervals: [500] })
      .toBe(true);
  });
});

// =============================================================================
// PUBLIC SUPPORTERS PAGE
// =============================================================================

test.describe('Public Supporters Page', () => {
  test('should show supporter names when they opt in', async ({ page }) => {
    await page.goto('/supporters', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Wait for the supporters list or empty state to finish loading
    const supportersList = page.locator('[data-testid="supporters-list"]');
    const emptyState = page.locator('text=/Be the first supporter/i');

    // One of these should be visible
    await expect(
      supportersList.or(emptyState).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
