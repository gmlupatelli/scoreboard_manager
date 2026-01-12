import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright configuration for E2E testing
 * Tests mobile (375x667, 320x568), tablet (1024x768), and desktop (1920x1080)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Run 4 tests in parallel locally
  reporter: 'html',
  timeout: 30000, // 30 seconds per test

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // Only keep video on failure
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 15000, // 15 seconds for navigation
  },

  projects: [
    // Desktop - Chrome (primary browser for development)
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile - iPhone 12 (standard mobile)
    {
      name: 'Mobile iPhone 12',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },

    // Mobile - Minimum (320px - smallest supported)
    {
      name: 'Mobile Minimum',
      timeout: 60000, // Increased timeout for tiny viewport
      retries: 1, // Retry once on failure due to intermittent timing issues
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 320, height: 568 },
        hasTouch: true,
        isMobile: true,
      },
    },

    // Uncomment for full cross-browser testing:
    // {
    //   name: 'Desktop Firefox',
    //   use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 } },
    // },
    // {
    //   name: 'Desktop Safari',
    //   use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } },
    // },
    // {
    //   name: 'Tablet',
    //   use: { ...devices['iPad Pro'], viewport: { width: 1024, height: 768 } },
    // },
    // {
    //   name: 'Mobile iPhone SE',
    //   use: { ...devices['iPhone SE'], viewport: { width: 375, height: 667 } },
    // },
    // {
    //   name: 'Mobile Landscape',
    //   use: { ...devices['iPhone 12'], viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true },
    // },
    // {
    //   name: 'Mobile Android',
    //   use: { ...devices['Pixel 5'], viewport: { width: 393, height: 851 } },
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Reduced from 120s to 60s
    stdout: 'ignore', // Suppress dev server logs
    stderr: 'pipe', // Only show errors
  },
});
