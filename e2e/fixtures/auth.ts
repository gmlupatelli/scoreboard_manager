/**
 * Authentication Fixtures for Playwright Tests
 * Provides helpers for real Supabase authentication flows
 */

import { test as base, type Page, type BrowserContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

interface AuthUser {
  email: string;
  password: string;
}

const ADMIN: AuthUser = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@scoreboard.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
};

const JOHN: AuthUser = {
  email: process.env.TEST_USER_JOHN_EMAIL || 'john@example.com',
  password: process.env.TEST_USER_JOHN_PASSWORD || 'user123',
};

const SARAH: AuthUser = {
  email: process.env.TEST_USER_SARAH_EMAIL || 'sarah@example.com',
  password: process.env.TEST_USER_SARAH_PASSWORD || 'test123',
};

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

/**
 * Perform login via UI
 */
async function performLogin(page: Page, user: AuthUser) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard (allow up to 45s for slower mobile viewports)
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 45000 });
}

/**
 * Extended test fixtures with authentication helpers
 */
type AuthFixtures = {
  adminAuth: Page;
  johnAuth: Page;
  sarahAuth: Page;
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
};
