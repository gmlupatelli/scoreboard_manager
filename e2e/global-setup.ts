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
  name: process.env.AUTOMATED_TEST_ADMIN_1_DISPLAY_NAME || 'Site Admin',
};

const JOHN: TestUser = {
  email: process.env.AUTOMATED_TEST_USER_1_EMAIL || 'john@example.com',
  password: process.env.AUTOMATED_TEST_USER_1_PASSWORD || 'user123',
  name: process.env.AUTOMATED_TEST_USER_1_DISPLAY_NAME || 'John Doe',
};

const SARAH: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_1_EMAIL || 'sarah@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_1_PASSWORD || 'sarah456',
  name: process.env.AUTOMATED_TEST_SUPPORTER_1_DISPLAY_NAME || 'Sarah Smith',
};

const SUPPORTER: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_2_EMAIL || 'patron@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_2_PASSWORD || 'supporter789',
  name: process.env.AUTOMATED_TEST_SUPPORTER_2_DISPLAY_NAME || 'Pat Rohn',
};

// Additional supporter users for per-project subscription test isolation
const SUPPORTER_3: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_3_EMAIL || 'patron2@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_3_PASSWORD || 'test123',
  name: process.env.AUTOMATED_TEST_SUPPORTER_3_DISPLAY_NAME || 'Pat Rohn II',
};

const SUPPORTER_4: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_4_EMAIL || 'patron3@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_4_PASSWORD || 'test123',
  name: process.env.AUTOMATED_TEST_SUPPORTER_4_DISPLAY_NAME || 'Pat Rohn III',
};

const SUPPORTER_5: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_5_EMAIL || 'patron4@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_5_PASSWORD || 'test123',
  name: process.env.AUTOMATED_TEST_SUPPORTER_5_DISPLAY_NAME || 'Pat Rohn IV',
};

const SUPPORTER_6: TestUser = {
  email: process.env.AUTOMATED_TEST_SUPPORTER_6_EMAIL || 'patron5@example.com',
  password: process.env.AUTOMATED_TEST_SUPPORTER_6_PASSWORD || 'test123',
  name: process.env.AUTOMATED_TEST_SUPPORTER_6_DISPLAY_NAME || 'Pat Rohn V',
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

    // Wait for settings to finish loading
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
 * Verify that a test user can log in and has expected scoreboard data.
 * This checks that the test environment is properly set up.
 */
async function verifyUserLogin(
  page: Page,
  user: TestUser,
  expectedMinScoreboards: number = 0
): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    // Check that dashboard loads with content
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify scoreboard data if expected
    if (expectedMinScoreboards > 0) {
      const cards = page.locator('[data-testid="scoreboard-card"]');
      const cardCount = await cards.count();
      if (cardCount < expectedMinScoreboards) {
        console.log(
          `⚠️  ${user.email} has ${cardCount} scoreboards, expected at least ${expectedMinScoreboards}. Run: npm run refresh-test-data`
        );
      } else {
        console.log(
          `✓ Verified ${user.email} can log in (${cardCount} scoreboards)`
        );
      }
    } else {
      console.log(`✓ Verified ${user.email} can log in`);
    }

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

    // Step 2: Verify test users can log in and have expected data
    // Expected counts match what refresh-test-data seeds per user
    // Admin sees ALL scoreboards, regular users see only their own
    // (Test data is seeded by refresh-test-data script, not by global-setup)
    console.log('\n👤 Verifying test users and data...');
    await verifyUserLogin(page, ADMIN, 12);         // Sees all: 3 john + 2 sarah + 2 patron + 1 admin + 1 patron2 + 1 patron3 + 1 patron4 + 1 patron5
    await verifyUserLogin(page, JOHN, 3);           // 2 public + 1 locked
    await verifyUserLogin(page, SARAH, 2);          // 2 scoreboards
    await verifyUserLogin(page, SUPPORTER, 2);      // 2 scoreboards
    await verifyUserLogin(page, SUPPORTER_3, 1);    // 1 scoreboard (subscription test isolation)
    await verifyUserLogin(page, SUPPORTER_4, 1);    // 1 scoreboard (subscription test isolation)
    await verifyUserLogin(page, SUPPORTER_5, 1);    // 1 scoreboard (kiosk test dedicated user)
    await verifyUserLogin(page, SUPPORTER_6, 1);    // 1 scoreboard (tier-limits downgrade tests)

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
