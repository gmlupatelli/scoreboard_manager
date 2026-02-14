import { defineConfig, devices } from '@playwright/test';
import { loadTestEnv } from './e2e/loadTestEnv.js';

// Load .env.local first, then .env.test overrides for Playwright
loadTestEnv();

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';
const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

/**
 * Fast Playwright configuration for rapid development/debugging
 * File-level parallel with dedicated user accounts per spec.
 * system-settings runs first, then all other specs in parallel.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  timeout: 20000,

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: 'system-settings',
      testMatch: /system-settings\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
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
        stderr: 'pipe',
      }
    : undefined,
});
