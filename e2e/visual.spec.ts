/**
 * Visual Regression Tests
 *
 * Uses Playwright's built-in screenshot comparison to detect unintended
 * UI changes on key pages.  Baseline screenshots are stored in
 * e2e/__screenshots__/ and checked into git.
 *
 * Run `npx playwright test visual.spec.ts --update-snapshots` to update baselines.
 *
 * Dedicated accounts: USER_6 (free user)
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { safeGoto } from './fixtures/helpers';

test.describe('Visual Regression', () => {
  test('login page', async ({ page }) => {
    await page.context().clearCookies();
    await safeGoto(page, '/login');

    // Wait for auth loading to finish
    await page
      .locator('text=/^Loading\\.\\.\\.$/')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      mask: [page.locator('img[src*="logo"]')], // Mask logo to avoid font-loading diffs
    });
  });

  test('public scoreboard list', async ({ page }) => {
    await safeGoto(page, '/public-scoreboard-list');

    // Wait for scoreboard cards or empty state
    await expect(
      page.locator('[data-testid="scoreboard-card"], h1, h2').first()
    ).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('public-scoreboard-list.png', {
      fullPage: true,
    });
  });

  test('dashboard (authenticated)', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user6);
    await safeGoto(page, '/dashboard');

    // Wait for dashboard content to load
    await expect(
      page.locator('[data-testid="scoreboard-card-title"]').first()
    ).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      mask: [
        page.locator('time'), // Mask timestamps
      ],
    });
  });

  test('scoreboard management', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user6);
    await safeGoto(page, '/dashboard');

    // Navigate to first scoreboard management page
    const manageButton = page.locator('[data-testid="scoreboard-card-manage"]').first();
    await expect(manageButton).toBeVisible({ timeout: 15000 });
    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, { timeout: 10000 });

    const addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    await expect(addEntryButton).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveScreenshot('scoreboard-management.png', {
      fullPage: true,
      mask: [
        page.locator('time'),
        page.locator('[data-testid="entry-timestamp"]'),
      ],
    });
  });

  test('about page', async ({ page }) => {
    await safeGoto(page, '/about');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
    });
  });
});
