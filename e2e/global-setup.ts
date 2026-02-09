/**
 * Global Setup for Playwright E2E Tests
 *
 * Runs once before all test files.
 * Verifies test environment is ready (users exist, settings configured).
 * Test data is seeded by refresh-test-data script, not by global-setup.
 *
 * Credentials load from .env.local (Supabase) with .env.test overrides:
 *   AUTOMATED_TEST_ADMIN_<N>_EMAIL / AUTOMATED_TEST_ADMIN_<N>_PASSWORD
 *   AUTOMATED_TEST_USER_<N>_EMAIL / AUTOMATED_TEST_USER_<N>_PASSWORD
 *   AUTOMATED_TEST_SUPPORTER_<N>_EMAIL / AUTOMATED_TEST_SUPPORTER_<N>_PASSWORD
 */

import { chromium, type FullConfig, type Page } from '@playwright/test';
import { loadTestEnv } from './loadTestEnv.js';

// Load .env.local first, then .env.test overrides for Playwright
loadTestEnv();

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

interface TestUser {
  email: string;
  password: string;
  name: string;
}

/**
 * Get test user credentials from environment variables
 * Falls back to defaults if not configured (for backwards compatibility)
 */
const ADMIN: TestUser = {
  email: process.env.AUTOMATED_TEST_ADMIN_1_EMAIL || 'admin@example.com',
  password: process.env.AUTOMATED_TEST_ADMIN_1_PASSWORD || 'admin123',
  name: 'Test Admin',
};

const JOHN: TestUser = {
  email: process.env.AUTOMATED_TEST_USER_1_EMAIL || 'john@example.com',
  password: process.env.AUTOMATED_TEST_USER_1_PASSWORD || 'user123',
  name: 'John Doe',
};

const SARAH: TestUser = {
  email: process.env.AUTOMATED_TEST_USER_2_EMAIL || 'sarah@example.com',
  password: process.env.AUTOMATED_TEST_USER_2_PASSWORD || 'sarah456',
  name: 'Sarah Smith',
};

const SUPPORTER: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_1_EMAIL || 'supporter@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_1_PASSWORD || 'supporter789',
  name: 'Supporter User',
};

async function login(page: Page, user: TestUser) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  console.log(`✓ Logged in as ${user.email}`);
}

async function enablePublicRegistration(page: Page) {
  try {
    console.log('\n⚙️  Enabling public registration...');
    await page.goto(`${BASE_URL}/system-admin/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find the toggle button for public registration
    const toggleButton = page
      .locator('button')
      .filter({
        has: page.locator('~ div:has-text("Allow Public Registration")'),
      })
      .first()
      .or(
        page
          .locator('div:has-text("Allow Public Registration")')
          .locator('..')
          .locator('button')
          .first()
      );

    await toggleButton.waitFor({ state: 'visible', timeout: 5000 });

    // Check if it's already enabled by looking at the button's classes
    const buttonClasses = await toggleButton.getAttribute('class');
    const isEnabled = buttonClasses?.includes('bg-primary');

    if (!isEnabled) {
      await toggleButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Public registration enabled');
    } else {
      console.log('✓ Public registration already enabled');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️  Could not enable public registration:', errorMessage);
  }
}

/**
 * Verify that a test user can log in (data already exists from refresh-test-data).
 * This checks that the test environment is properly set up.
 */
async function verifyUserLogin(page: Page, user: TestUser): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    // Check that dashboard loads with content
    await page.waitForTimeout(2000);
    console.log(`✓ Verified ${user.email} can log in`);
    await page.context().clearCookies();
    return true;
  } catch {
    console.log(`⚠️  ${user.email} login failed - user may not exist yet`);
    await page.context().clearCookies();
    return false;
  }
}

async function globalSetup(_config: FullConfig) {
  console.log('\n🌱 Starting test data setup...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Log in as admin and ensure public registration is enabled
    console.log('\n🔑 Logging in as admin...');
    await login(page, ADMIN);
    await enablePublicRegistration(page);
    await page.context().clearCookies();

    // Step 2: Verify test users can log in
    // (Test data is seeded by refresh-test-data script, not by global-setup)
    console.log('\n👤 Verifying test users...');
    await verifyUserLogin(page, JOHN);
    await verifyUserLogin(page, SARAH);
    await verifyUserLogin(page, SUPPORTER);

    console.log('\n✅ Test data setup complete!\n');
  } catch (error) {
    console.error('\n❌ Test data setup failed:', error);
    // Don't fail the test run if verification fails - data might already exist
    console.log('⚠️  Continuing with existing data...\n');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
