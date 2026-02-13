/**
 * Authentication Fixtures for Playwright Tests
 * Provides helpers for real Supabase authentication flows
 *
 * Each spec file gets dedicated user accounts for file-level parallel execution.
 * Credentials are loaded from .env.test using the numbered naming convention:
 *   AUTOMATED_TEST_ADMIN_<N>_EMAIL / AUTOMATED_TEST_ADMIN_<N>_PASSWORD
 *   AUTOMATED_TEST_USER_<N>_EMAIL / AUTOMATED_TEST_USER_<N>_PASSWORD
 *   AUTOMATED_TEST_SUPPORTER_<N>_EMAIL / AUTOMATED_TEST_SUPPORTER_<N>_PASSWORD
 */

import { test as base, type Page, type BrowserContext as _BrowserContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test'), quiet: true });

export interface AuthUser {
  email: string;
  password: string;
}

// =============================================================================
// ADMIN ACCOUNTS (system_admin role)
// =============================================================================

/** Admin 1: admin.spec.ts + global-setup */
const ADMIN_1: AuthUser = {
  email: process.env.AUTOMATED_TEST_ADMIN_1_EMAIL || 'admin@example.com',
  password: process.env.AUTOMATED_TEST_ADMIN_1_PASSWORD || 'admin123',
};

/** Admin 2: auth.spec.ts */
const ADMIN_2: AuthUser = {
  email: process.env.AUTOMATED_TEST_ADMIN_2_EMAIL || 'admin-auth@example.com',
  password: process.env.AUTOMATED_TEST_ADMIN_2_PASSWORD || 'admin123',
};

/** Admin 3: invitations.spec.ts */
const ADMIN_3: AuthUser = {
  email: process.env.AUTOMATED_TEST_ADMIN_3_EMAIL || 'admin-invite@example.com',
  password: process.env.AUTOMATED_TEST_ADMIN_3_PASSWORD || 'admin123',
};

/** Admin 4: system-settings.spec.ts */
const ADMIN_4: AuthUser = {
  email: process.env.AUTOMATED_TEST_ADMIN_4_EMAIL || 'admin-settings@example.com',
  password: process.env.AUTOMATED_TEST_ADMIN_4_PASSWORD || 'admin123',
};

// =============================================================================
// USER ACCOUNTS (regular user role, free tier)
// =============================================================================

/** User 1 (John): scoreboard.spec.ts */
const USER_1: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_1_EMAIL || 'john@example.com',
  password: process.env.AUTOMATED_TEST_USER_1_PASSWORD || 'user123',
};

/** User 2: auth.spec.ts */
const USER_2: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_2_EMAIL || 'user-auth@example.com',
  password: process.env.AUTOMATED_TEST_USER_2_PASSWORD || 'user123',
};

/** User 3: invitations.spec.ts */
const USER_3: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_3_EMAIL || 'user-invite@example.com',
  password: process.env.AUTOMATED_TEST_USER_3_PASSWORD || 'user123',
};

/** User 4: kiosk.spec.ts (free-user gate test) */
const USER_4: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_4_EMAIL || 'user-kiosk@example.com',
  password: process.env.AUTOMATED_TEST_USER_4_PASSWORD || 'user123',
};

/** User 5: accessibility.spec.ts */
const USER_5: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_5_EMAIL || 'user-a11y@example.com',
  password: process.env.AUTOMATED_TEST_USER_5_PASSWORD || 'user123',
};

/** User 6: visual.spec.ts */
const USER_6: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_6_EMAIL || 'user-visual@example.com',
  password: process.env.AUTOMATED_TEST_USER_6_PASSWORD || 'user123',
};

/** User 7: tier-limits.spec.ts (free-tier tests) */
const USER_7: AuthUser = {
  email: process.env.AUTOMATED_TEST_USER_7_EMAIL || 'user-tier@example.com',
  password: process.env.AUTOMATED_TEST_USER_7_PASSWORD || 'user123',
};

// =============================================================================
// SUPPORTER ACCOUNTS (user role + active subscription)
// =============================================================================

/** Supporter 1 (Sarah): auth.spec.ts - appreciation tier */
const SUPPORTER_1: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_1_EMAIL || 'sarah@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_1_PASSWORD || 'sarah456',
};

/** Supporter 2 (Morgan): subscription.spec.ts - supporter tier */
const SUPPORTER_2: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_2_EMAIL || 'morgan@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_2_PASSWORD || 'supporter789',
};

/** Supporter 3: supporter-recognition.spec.ts - supporter tier */
const SUPPORTER_3: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_3_EMAIL || 'supporter-recog@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_3_PASSWORD || 'supporter789',
};

/** Supporter 5 (Taylor): kiosk.spec.ts - subscription never mutated */
const SUPPORTER_5: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_5_EMAIL || 'taylor@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_5_PASSWORD || 'supporter789',
};

/** Supporter 6 (Riley): tier-limits.spec.ts - downgrade tests */
const SUPPORTER_6: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_6_EMAIL || 'riley@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_6_PASSWORD || 'supporter789',
};

/** Supporter 7: invitations.spec.ts - invitation status checks */
const SUPPORTER_7: AuthUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_7_EMAIL || 'supporter-invite@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_7_PASSWORD || 'supporter789',
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
      return;
    }

    if (attempt === maxAttempts || page.isClosed()) {
      throw new Error(`Failed to sign in as ${user.email} after multiple attempts`);
    }
  }
}

/**
 * Extended test fixtures with authentication helpers.
 *
 * Legacy fixture aliases (adminAuth, johnAuth, etc.) are preserved for backward
 * compatibility but all spec files should use loginAs(TEST_USERS.xxx) instead
 * to enable file-level parallel execution with dedicated accounts.
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
   * Admin authenticated page (ADMIN_1)
   * @deprecated Use loginAs(TEST_USERS.admin1) with a spec-specific admin account
   */
  adminAuth: async ({ page }, use) => {
    await performLogin(page, ADMIN_1);
    await use(page);
  },

  /**
   * John (regular user) authenticated page (USER_1)
   * @deprecated Use loginAs(TEST_USERS.user1) with a spec-specific user account
   */
  johnAuth: async ({ page }, use) => {
    await performLogin(page, USER_1);
    await use(page);
  },

  /**
   * Sarah (supporter - appreciation tier) authenticated page (SUPPORTER_1)
   * @deprecated Use loginAs(TEST_USERS.supporter1) with a spec-specific supporter account
   */
  sarahAuth: async ({ page }, use) => {
    await performLogin(page, SUPPORTER_1);
    await use(page);
  },

  /**
   * Kiosk-dedicated supporter (SUPPORTER_5) authenticated page.
   * @deprecated Use loginAs(TEST_USERS.supporter5)
   */
  supporterAuth: async ({ page }, use) => {
    await performLogin(page, SUPPORTER_5);
    await use(page);
  },

  /**
   * Helper function to login as any user.
   * This is the preferred auth method for parallel execution.
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
 * All test user credentials indexed by normalized names.
 * Each spec file should use only its dedicated accounts.
 */
export const TEST_USERS = {
  // Admins
  admin1: ADMIN_1,
  admin2: ADMIN_2,
  admin3: ADMIN_3,
  admin4: ADMIN_4,
  // Regular users (free tier)
  user1: USER_1,
  user2: USER_2,
  user3: USER_3,
  user4: USER_4,
  user5: USER_5,
  user6: USER_6,
  user7: USER_7,
  // Supporters
  supporter1: SUPPORTER_1,
  supporter2: SUPPORTER_2,
  supporter3: SUPPORTER_3,
  supporter5: SUPPORTER_5,
  supporter6: SUPPORTER_6,
  supporter7: SUPPORTER_7,

  // -----------------------------------------------------------------------
  // Legacy aliases — kept for backward compat during migration
  // -----------------------------------------------------------------------
  /** @deprecated Use admin1 */
  admin: ADMIN_1,
  /** @deprecated Use user1 */
  john: USER_1,
  /** @deprecated Use supporter1 */
  sarah: SUPPORTER_1,
  /** @deprecated Use supporter2 */
  supporter: SUPPORTER_2,
};
