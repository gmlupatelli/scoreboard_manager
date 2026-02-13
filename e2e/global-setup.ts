/**
 * Global Setup for Playwright E2E Tests
 *
 * Runs once before all test files.
 * Verifies test environment is ready (users exist, settings configured).
 * Test data is seeded by refresh-test-data script, not by global-setup.
 *
 * User verification uses the Supabase Auth API directly instead of
 * launching a browser for each user — cuts setup time from ~55s to ~3s.
 *
 * All 17 test accounts are verified:
 *   ADMIN_1-4, USER_1-7, SUPPORTER_1-3 + SUPPORTER_5-7
 */

import { chromium, type FullConfig, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { loadTestEnv } from './loadTestEnv.js';

// Load .env.local first, then .env.test overrides for Playwright
loadTestEnv();

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

interface TestUser {
  email: string;
  password: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Helper to build a TestUser from environment variables
// ---------------------------------------------------------------------------
function buildTestUser(
  role: 'ADMIN' | 'USER' | 'SUPPORTER',
  n: number,
  fallbackEmail: string,
  fallbackPassword: string,
  fallbackName: string,
): TestUser {
  return {
    email: process.env[`AUTOMATED_TEST_${role}_${n}_EMAIL`] || fallbackEmail,
    password: process.env[`AUTOMATED_TEST_${role}_${n}_PASSWORD`] || fallbackPassword,
    name: process.env[`AUTOMATED_TEST_${role}_${n}_DISPLAY_NAME`] || fallbackName,
  };
}

// Admins
const ADMIN_1 = buildTestUser('ADMIN', 1, 'admin@example.com', 'test123', 'Site Admin');
const ADMIN_2 = buildTestUser('ADMIN', 2, 'admin2@example.com', 'test123', 'Admin Two');
const ADMIN_3 = buildTestUser('ADMIN', 3, 'admin3@example.com', 'test123', 'Admin Three');
const ADMIN_4 = buildTestUser('ADMIN', 4, 'admin4@example.com', 'test123', 'Admin Four');

// Regular users
const USER_1 = buildTestUser('USER', 1, 'john@example.com', 'test123', 'John Doe');
const USER_2 = buildTestUser('USER', 2, 'user2@example.com', 'test123', 'User Two');
const USER_3 = buildTestUser('USER', 3, 'user3@example.com', 'test123', 'User Three');
const USER_4 = buildTestUser('USER', 4, 'user4@example.com', 'test123', 'User Four');
const USER_5 = buildTestUser('USER', 5, 'user5@example.com', 'test123', 'User Five');
const USER_6 = buildTestUser('USER', 6, 'user6@example.com', 'test123', 'User Six');
const USER_7 = buildTestUser('USER', 7, 'user7@example.com', 'test123', 'User Seven');

// Supporters
const SUPPORTER_1 = buildTestUser('SUPPORTER', 1, 'sarah@example.com', 'test123', 'Sarah Smith');
const SUPPORTER_2 = buildTestUser('SUPPORTER', 2, 'morgan@example.com', 'test123', 'Morgan Blake');
const SUPPORTER_3 = buildTestUser('SUPPORTER', 3, 'supporter3@example.com', 'test123', 'Supporter Three');
const SUPPORTER_5 = buildTestUser('SUPPORTER', 5, 'taylor@example.com', 'test123', 'Taylor Chen');
const SUPPORTER_6 = buildTestUser('SUPPORTER', 6, 'riley@example.com', 'test123', 'Riley Brooks');
const SUPPORTER_7 = buildTestUser('SUPPORTER', 7, 'supporter7@example.com', 'test123', 'Supporter Seven');

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
    await page.goto(`${BASE_URL}/system-admin/settings`);

    await page
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const publicRegToggle = page.getByRole('switch', {
      name: /Allow Public Registration/i,
    });

    await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
    const isOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';

    if (!isOn) {
      await publicRegToggle.click();
      await page
        .locator('text=/Settings updated successfully/i')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {});
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
 * Verify that a test user exists via the Supabase Auth API (no browser needed).
 * This is ~10x faster than the previous browser-based verification.
 */
async function verifyUserViaApi(user: TestUser): Promise<boolean> {
  try {
    const client = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (error) {
      console.log(`⚠️  ${user.email} API login failed: ${error.message}`);
      return false;
    }

    console.log(`✓ Verified ${user.email} via API`);
    return true;
  } catch {
    console.log(`⚠️  ${user.email} API verification error`);
    return false;
  }
}

async function globalSetup(_config: FullConfig) {
  console.log('\n🌱 Starting test data setup...\n');

  // Step 1: Log in as admin via browser to enable public registration
  // (This is the only step that requires a browser)
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔑 Logging in as admin...');
    await login(page, ADMIN_1);
    await enablePublicRegistration(page);
  } catch (error) {
    console.error('❌ Admin login/settings failed:', error);
  } finally {
    await browser.close();
  }

  // Step 2: Verify all 17 test users via Supabase Auth API (fast, no browser)
  console.log('\n👤 Verifying test users via API...');
  const users = [
    ADMIN_1, ADMIN_2, ADMIN_3, ADMIN_4,
    USER_1, USER_2, USER_3, USER_4, USER_5, USER_6, USER_7,
    SUPPORTER_1, SUPPORTER_2, SUPPORTER_3, SUPPORTER_5, SUPPORTER_6, SUPPORTER_7,
  ];

  const results = await Promise.all(users.map(verifyUserViaApi));
  const passedCount = results.filter(Boolean).length;
  const allPassed = results.every(Boolean);

  if (allPassed) {
    console.log(`\n✅ All ${users.length} test users verified!\n`);
  } else {
    console.log(`\n⚠️  ${passedCount}/${users.length} users verified. Some users could not be verified. Continuing with existing data...\n`);
  }
}

export default globalSetup;
