/**
 * Authentication Fixtures for Playwright Tests
 * Provides helpers for real Supabase authentication flows
 *
 * Credentials are loaded from .env.test using the numbered naming convention:
 *   AUTOMATED_TEST_ADMIN_<N>_EMAIL / AUTOMATED_TEST_ADMIN_<N>_PASSWORD
 *   AUTOMATED_TEST_USER_<N>_EMAIL / AUTOMATED_TEST_USER_<N>_PASSWORD
 */

import { test as base, type Page, type BrowserContext as _BrowserContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test'), quiet: true });

interface AuthUser {
  email: string;
  password: string;
}

/**
 * Get test user credentials from environment variables
 * Falls back to defaults if not configured (for backwards compatibility)
 */
const ADMIN: AuthUser = {
  email: process.env.AUTOMATED_TEST_ADMIN_1_EMAIL || 'admin@example.com',
  password: process.env.AUTOMATED_TEST_ADMIN_1_PASSWORD || 'admin123',
};

const JOHN: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_1_EMAIL || 'john@example.com',
  password: process.env.AUTOMATED_TEST_USER_1_PASSWORD || 'user123',
};

const SARAH: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_2_EMAIL || 'sarah@example.com',
  password: process.env.AUTOMATED_TEST_USER_2_PASSWORD || 'sarah456',
};

const SUPPORTER: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_3_EMAIL || 'supporter@example.com',
  password: process.env.AUTOMATED_TEST_USER_3_PASSWORD || 'supporter789',
};

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

/**
 * Perform login via UI
 */
async function performLogin(page: Page, user: AuthUser) {
  const maxAttempts = 3;

  const waitForDashboard = async (): Promise<boolean> => {
    try {
      await page.waitForURL(/\/dashboard(\?|$)/, {
        timeout: 45000,
        waitUntil: 'domcontentloaded',
      });
      return true;
    } catch {
      return page.url().includes('/dashboard');
    }
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });

    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);

    await submitButton.click();

    const loginSucceeded = await waitForDashboard();

    if (loginSucceeded) {
      await page.waitForLoadState('domcontentloaded');
      await page
        .waitForSelector(
          '[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign Out")',
          { timeout: 10000 }
        )
        .catch(() => {
          // If no user menu found, continue - auth may still be settling
        });
      await page.waitForTimeout(500);
      return;
    }

    if (attempt === maxAttempts || page.isClosed()) {
      throw new Error('Failed to sign in after multiple attempts');
    }

    await page.waitForTimeout(1000);
  }
}

/**
 * Extended test fixtures with authentication helpers
 */
type AuthFixtures = {
  adminAuth: Page;
  johnAuth: Page;
  sarahAuth: Page;
  supporterAuth: Page;
  loginAs: (user: AuthUser) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Admin authenticated page
   */
  adminAuth: async ({ page }, use) => {
    await performLogin(page, ADMIN);
    await use(page);
  },

  /**
   * John (regular user) authenticated page
   */
  johnAuth: async ({ page }, use) => {
    await performLogin(page, JOHN);
    await use(page);
  },

  /**
   * Sarah (regular user) authenticated page
   */
  sarahAuth: async ({ page }, use) => {
    await performLogin(page, SARAH);
    await use(page);
  },

  /**
   * Supporter (user with subscription) authenticated page
   */
  supporterAuth: async ({ page }, use) => {
    await performLogin(page, SUPPORTER);
    await use(page);
  },

  /**
   * Helper function to login as any user
   */
  loginAs: async ({ page }, use) => {
    const loginHelper = async (user: AuthUser) => {
      await performLogin(page, user);
    };
    await use(loginHelper);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper to logout
 */
export async function logout(page: Page) {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
}

/**
 * Export user credentials for direct access
 */
export const TEST_USERS = {
  admin: ADMIN,
  john: JOHN,
  sarah: SARAH,
  supporter: SUPPORTER,
};
