import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Fast Playwright configuration for rapid development/debugging
 * Only runs Desktop Chrome for quick feedback
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for faster feedback
  workers: 6, // More parallel workers
  reporter: 'list', // Simpler reporter
  timeout: 30000,

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000',
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

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
