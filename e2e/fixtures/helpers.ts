/**
 * Shared E2E Test Helpers
 *
 * De-duplicated helpers that were previously copy-pasted across spec files.
 * Import from '@e2e/fixtures/helpers' in any spec file.
 */

import { type Page, expect } from '@playwright/test';
import {
  seedSubscription,
  removeSubscription,
  type SubscriptionState,
  type SubscriptionFixtureOptions,
  SUPPORTER_EMAIL,
} from './subscriptions';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

// =============================================================================
// NAVIGATION HELPERS
// =============================================================================

/**
 * Navigate to a URL with retry logic for flaky page loads.
 * Replaces the copy-pasted `safeGoto` found in auth.spec.ts and admin.spec.ts.
 */
export async function safeGoto(
  page: Page,
  url: string,
  options: { maxRetries?: number; waitForSelector?: string } = {}
): Promise<void> {
  const { maxRetries = 2, waitForSelector } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }
      return;
    } catch {
      if (attempt === maxRetries) throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts`);
    }
  }
}

/**
 * Navigate to dashboard and wait for it to be ready.
 * Replaces the copy-pasted `navigateAfterLogin` from subscription/supporter-recognition specs.
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');
  // Wait for either the scoreboard cards or the empty state to appear
  await expect(
    page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to the subscription/supporter plan page and wait for loading to complete.
 */
export async function navigateToSubscription(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/supporter-plan`, { waitUntil: 'domcontentloaded' });
  // Wait for the supporter plan page to finish loading
  await expect(
    page.locator('text=/Supporter Plan|Current Plan|Loading subscription/i').first()
  ).toBeVisible({ timeout: 15000 });
}

// =============================================================================
// SUBSCRIPTION HELPERS
// =============================================================================

/**
 * Seed subscription state via DB and navigate so the page reflects it.
 * Replaces the copy-pasted `setupSubscriptionState` from subscription.spec.ts
 * and supporter-recognition.spec.ts.
 */
export async function setupSubscriptionState(
  page: Page,
  state: SubscriptionState,
  options: SubscriptionFixtureOptions & { userEmail?: string } = {}
): Promise<void> {
  const email = options.userEmail || SUPPORTER_EMAIL;
  const result = await seedSubscription(email, state, options);
  if (!result.success) {
    throw new Error(`Failed to seed subscription state "${state}": ${result.error}`);
  }
  // Reload to pick up the new subscription state
  await page.reload({ waitUntil: 'domcontentloaded' });
}

/**
 * Remove subscription via DB and reload page.
 */
export async function teardownSubscription(
  page: Page,
  userEmail: string = SUPPORTER_EMAIL
): Promise<void> {
  await removeSubscription(userEmail);
  // No reload — callers typically navigate away or the test ends
}

// =============================================================================
// WAITING HELPERS
// =============================================================================

/**
 * Wait for subscription data to be loaded on the page.
 * Replaces waitForSubscriptionLoaded polling in kiosk.spec.ts.
 */
export async function waitForSubscriptionLoaded(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const loadingIndicator = page.locator('text=/loading subscription|checking subscription/i');
        return (await loadingIndicator.count()) === 0;
      },
      { timeout: 10000, intervals: [500] }
    )
    .toBeTruthy();
}

/**
 * Dismiss any modal that might be blocking the UI (e.g., downgrade notice, welcome modal).
 */
export async function dismissModal(page: Page): Promise<void> {
  const closeButton = page
    .locator('button')
    .filter({ hasText: /close|dismiss|got it|okay|×/i })
    .first();

  try {
    await closeButton.waitFor({ state: 'visible', timeout: 2000 });
    await closeButton.click();
  } catch {
    // No modal to dismiss
  }
}
