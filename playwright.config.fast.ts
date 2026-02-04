import { defineConfig, devices } from '@playwright/test';
import { loadTestEnv } from './e2e/loadTestEnv.js';

// Load .env.local first, then .env.test overrides for Playwright
loadTestEnv();

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';
const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

/**
 * Fast Playwright configuration for rapid development/debugging
 * Only runs Desktop Chrome for quick feedback
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for faster feedback
  workers: 2, // Reduce concurrency for auth stability
  reporter: 'list', // Simpler reporter
  timeout: 30000,

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL,
    trace: 'off', // Disable trace for speed
    screenshot: 'only-on-failure',
    video: 'off', // Disable video for speed
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    // Only Desktop Chrome for fast iteration
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: isLocalhost
    ? {
        command: 'npm run dev',
        url: 'http://localhost:5000',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
        stdout: 'ignore',
        stderr: 'pipe',
        env: {
          ...process.env,
          NEXT_DISABLE_FAST_REFRESH: 'true',
        },
      }
    : undefined,
});
