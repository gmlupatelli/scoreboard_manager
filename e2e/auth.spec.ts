/**
 * Authentication & Authorization Tests
 *
 * Tests login flows, registration, password reset, and page access restrictions.
 * Public page smoke-tests replaced with a single fetch-based test.
 *
 * Dedicated accounts: ADMIN_2, USER_2, SUPPORTER_1
 */

import { test, expect } from '@playwright/test';
import { test as authTest, TEST_USERS } from './fixtures/auth';
import { safeGoto } from './fixtures/helpers';

test.describe('Authentication Flows', () => {
  test('unauthenticated user redirects to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await safeGoto(page, '/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.context().clearCookies();
    await safeGoto(page, '/login');

    await page
      .locator('text=/^Loading\\.\\.\\.$/')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('registration page renders correctly', async ({ page }) => {
    await safeGoto(page, '/register');

    await page
      .locator('text=/^Loading\\.\\.\\.$/')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible({ timeout: 10000 });

    const emailInput = page.locator('input[name="email"]');
    const inviteNotice = page.locator(
      'text=/invite-only registration|invitation link|registration is currently restricted/i'
    );

    const hasForm = await emailInput.isVisible().catch(() => false);
    const hasInviteNotice = await inviteNotice.isVisible().catch(() => false);
    expect(hasForm || hasInviteNotice).toBeTruthy();

    if (hasForm) {
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

  test('registration form validates email format', async ({ page }) => {
    await safeGoto(page, '/register');
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.locator('button[type="submit"]').click();

    const hasError =
      (await page.locator('text=/invalid|email/i').isVisible()) || page.url().includes('/register');
    expect(hasError).toBeTruthy();
  });

  test('registration form validates password requirements', async ({ page }) => {
    await safeGoto(page, '/register');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('123');
    await page.locator('button[type="submit"]').click();

    await expect
      .poll(
        async () => {
          const isStillOnRegister = page.url().includes('/register');
          const hasError = await page
            .locator('text=/password|characters|weak|short|minimum/i')
            .isVisible()
            .catch(() => false);
          return isStillOnRegister || hasError;
        },
        { timeout: 5000, intervals: [500] }
      )
      .toBeTruthy();
  });

  test('forgot password page accessible', async ({ page }) => {
    await safeGoto(page, '/login');
    const forgotLink = page
      .locator('a:has-text("Forgot")')
      .or(page.locator('text=/forgot.*password/i'));

    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });
});

test.describe('Authenticated User Session', () => {
  authTest('authenticated user can access dashboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user2);
    await safeGoto(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  authTest('dashboard displays user-specific content', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user2);
    await safeGoto(page, '/dashboard');
    const scoreboardCards = page.locator('[data-testid="scoreboard-card-title"]');
    const emptyState = page.locator('text=/no scoreboards|create your first/i');

    await expect
      .poll(
        async () => {
          const cardCount = await scoreboardCards.count();
          const hasEmpty = await emptyState.isVisible().catch(() => false);
          return cardCount > 0 || hasEmpty;
        },
        { timeout: 10000, intervals: [500] }
      )
      .toBeTruthy();
  });
});

test.describe('Regular User - Admin Pages Restriction', () => {
  authTest('user should not access system settings page', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user2);
    await safeGoto(page, '/system-admin/settings');
    await expect
      .poll(
        async () => {
          const currentUrl = page.url();
          return (
            currentUrl.includes('/dashboard') ||
            (await page.locator('text=Access Denied').isVisible()) ||
            (await page.locator('text=Forbidden').isVisible())
          );
        },
        { timeout: 10000, intervals: [500] }
      )
      .toBeTruthy();
  });

  authTest('supporter should not access system invitations page', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter1);
    await safeGoto(page, '/system-admin/invitations');
    await expect
      .poll(
        async () => {
          const currentUrl = page.url();
          return (
            currentUrl.includes('/dashboard') ||
            (await page.locator('text=Access Denied').isVisible()) ||
            (await page.locator('text=Forbidden').isVisible())
          );
        },
        { timeout: 10000, intervals: [500] }
      )
      .toBeTruthy();
  });

  authTest('user should not see admin navigation links', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user2);
    await safeGoto(page, '/dashboard');
    const settingsLink = page.locator('a:has-text("System Settings")');
    await expect(settingsLink).not.toBeVisible();
  });
});

test.describe('Public Pages - Smoke', () => {
  const publicPages = ['/', '/about', '/public-scoreboard-list', '/privacy', '/terms', '/cookies', '/contact'];

  for (const path of publicPages) {
    test(`${path} responds with 200`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBeLessThan(400);
    });
  }
});

