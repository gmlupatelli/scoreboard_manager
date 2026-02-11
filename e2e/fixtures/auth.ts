/**
 * Authentication Fixtures for Playwright Tests
 * Provides helpers for real Supabase authentication flows
 *
 * Credentials are loaded from .env.test using the numbered naming convention:
 *   AUTOMATED_TEST_ADMIN_<N>_EMAIL / AUTOMATED_TEST_ADMIN_<N>_PASSWORD
 *   AUTOMATED_TEST_USER_<N>_EMAIL / AUTOMATED_TEST_USER_<N>_PASSWORD
 *   AUTOMATED_TEST_SUPPORTER_<N>_EMAIL / AUTOMATED_TEST_SUPPORTER_<N>_PASSWORD
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

/** Sarah - Supporter with appreciation tier (admin-gifted) */
const SARAH: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_1_EMAIL || 'sarah@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_1_PASSWORD || 'sarah456',
};

/** Pat Rohn - Supporter with supporter tier (paid subscription) */
const SUPPORTER: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_2_EMAIL || 'patron@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_2_PASSWORD || 'supporter789',
};

/** Pat Rohn II - Supporter for Mobile iPhone 12 subscription tests (avoids cross-project races) */
const SUPPORTER_3: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_3_EMAIL || 'patron2@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_3_PASSWORD || 'supporter789',
};

/** Pat Rohn III - Supporter for Mobile Minimum subscription tests (avoids cross-project races) */
const SUPPORTER_4: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_4_EMAIL || 'patron3@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_4_PASSWORD || 'supporter789',
};

/** Pat Rohn IV - Dedicated kiosk test user (subscription never mutated by subscription tests) */
const SUPPORTER_5: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_5_EMAIL || 'patron4@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_5_PASSWORD || 'supporter789',
};

/** Pat Rohn V - Dedicated tier-limits downgrade test user (avoids races with subscription.spec.ts) */
const SUPPORTER_6: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_6_EMAIL || 'patron5@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_6_PASSWORD || 'supporter789',
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

    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await submitButton.waitFor({ state: 'visible', timeout: 15000 });

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
   * Sarah (supporter - appreciation tier) authenticated page
   */
  sarahAuth: async ({ page }, use) => {
    await performLogin(page, SARAH);
    await use(page);
  },

  /**
   * Kiosk-dedicated supporter (SUPPORTER_5) authenticated page.
   * Uses a separate user whose subscription is never mutated by subscription tests.
   */
  supporterAuth: async ({ page }, use) => {
    await performLogin(page, SUPPORTER_5);
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
  /** Per-project supporter for Mobile iPhone 12 subscription tests */
  supporter3: SUPPORTER_3,
  /** Per-project supporter for Mobile Minimum subscription tests */
  supporter4: SUPPORTER_4,
  /** Dedicated supporter for tier-limits downgrade tests */
  supporter6: SUPPORTER_6,
};
