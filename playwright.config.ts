import { defineConfig, devices } from '@playwright/test';
import { loadTestEnv } from './e2e/loadTestEnv.js';

// Load .env.local first, then .env.test overrides for Playwright
loadTestEnv();

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';
const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

/**
 * Playwright configuration for E2E testing
 *
 * File-level parallel execution — each spec file has dedicated user accounts
 * so no two files share the same Supabase Auth session. This avoids the
 * "Target page, context or browser has been closed" errors caused by
 * concurrent logins for the same email.
 *
 * The system-settings project runs first (serial) because it toggles
 * allow_public_registration which affects the auth spec's registration tests.
 * All other specs run in independent parallel workers.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  reporter: 'html',
  timeout: 30000,

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  expect: {
    timeout: 7000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  /* Visual-regression snapshot paths */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',

  projects: [
    // Phase 1: system-settings runs first (toggles shared global state)
    {
      name: 'system-settings',
      testMatch: /system-settings\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Phase 2: all other specs run in parallel after system-settings completes
    {
      name: 'Desktop Chrome',
      dependencies: ['system-settings'],
      testIgnore: /system-settings\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: isLocalhost
    ? {
        command: 'npm run build && npm run start',
        url: 'http://localhost:5000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: 'ignore',
        stderr: 'ignore',
      }
    : undefined,
});
