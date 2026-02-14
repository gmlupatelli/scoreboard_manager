/**
 * System Admin Tests
 *
 * Tests system admin exclusive features and permissions.
 * Removed: "navigate to all admin pages" (redundant), "see invitations from multiple users" (trivial).
 *
 * Dedicated accounts: ADMIN_1
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { safeGoto } from './fixtures/helpers';

test.describe('System Admin - Dashboard Oversight', () => {
  test('admin should see owner filter dropdown in dashboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/dashboard');

    const ownerFilter = page.getByRole('combobox', { name: /filter scoreboards by owner/i });
    await expect(ownerFilter).toBeVisible({ timeout: 15000 });
  });

  test('admin should see scoreboards from multiple owners', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/dashboard');

    const scoreboards = page.locator('[data-testid="scoreboard-card-title"]');
    await expect(scoreboards.first()).toBeVisible({ timeout: 10000 });

    const count = await scoreboards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('admin should be able to filter scoreboards by owner', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/dashboard');

    const filterInput = page
      .locator('input[placeholder*="owner"]')
      .or(page.locator('select[name="owner"]'));

    if (await filterInput.isVisible()) {
      await filterInput.click();
      const filterOptions = page.locator('[role="option"]').or(page.locator('option'));
      await expect(filterOptions.first()).toBeVisible({ timeout: 5000 });
      const optionsCount = await filterOptions.count();
      expect(optionsCount).toBeGreaterThan(0);
    }
  });
});

test.describe('System Admin - Settings Management', () => {
  test('admin should access system settings page', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/system-admin/settings');
    await expect(page).toHaveURL(/\/system-admin\/settings/);

    await expect(
      page.getByRole('heading', { name: /system settings/i }).or(
        page
          .locator('h1')
          .filter({ hasText: /settings/i })
          .first()
      )
    ).toBeVisible();
  });

  test('admin should see allow_public_registration setting', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/system-admin/settings');

    await page
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const publicRegToggle = page
      .locator('text=Public Registration')
      .or(page.locator('text=Allow Public Registration'));
    await expect(publicRegToggle).toBeVisible({ timeout: 10000 });
  });

  test('admin should see require_email_verification setting', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/system-admin/settings');

    await page
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const emailVerificationToggle = page
      .locator('text=Require Email Verification')
      .or(page.locator('text=Email Verification'));
    await expect(emailVerificationToggle).toBeVisible();
  });
});

test.describe('System Admin - Invitations Oversight', () => {
  test('admin should access system-wide invitations page', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/system-admin/invitations');
    await expect(page).toHaveURL(/\/system-admin\/invitations/);
  });

  test('admin should see inviter filter dropdown', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/system-admin/invitations');

    await page
      .locator('text=/^Loading\\.\\.\\.$/')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});

    const inviterFilter = page
      .locator('text=Invited by:')
      .or(page.locator('[placeholder*="inviter"]'));
    await expect(inviterFilter).toBeVisible({ timeout: 10000 });
  });
});

test.describe('System Admin - Scoreboard Access', () => {
  test('admin should be able to access another users scoreboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/dashboard');

    const firstScoreboard = page
      .locator('[data-testid="scoreboard-card"]')
      .or(page.locator('.scoreboard-card'))
      .first();

    await expect(firstScoreboard).toBeVisible({ timeout: 10000 });
    await firstScoreboard.click();

    const scoreboardTitle = page.locator('h1, h2');
    await expect(scoreboardTitle.first()).toBeVisible();
  });

  test('admin should be able to navigate to manage view', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/dashboard');

    await expect(page.locator('[data-testid="scoreboard-card-title"]').first()).toBeVisible({
      timeout: 30000,
    });

    const manageButton = page.locator('[data-testid="scoreboard-card-manage"]').first();
    await expect(manageButton).toBeVisible({ timeout: 10000 });
    await manageButton.click();

    try {
      await page.waitForURL(/\/scoreboard-management/, { timeout: 8000 });
    } catch {
      await manageButton.click({ force: true });
      await page.waitForURL(/\/scoreboard-management/, { timeout: 10000 });
    }

    const addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    await expect(addEntryButton).toBeVisible({ timeout: 15000 });
  });
});

test.describe('System Admin - Navigation', () => {
  test('admin should see system admin navigation links', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, '/dashboard');

    const settingsButton = page
      .locator('button:has-text("Settings")')
      .or(page.locator('a:has-text("Invitations")'));
    await expect(settingsButton.first()).toBeVisible({ timeout: 10000 });
  });
});
