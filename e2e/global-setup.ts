/**
 * Global Setup for Playwright E2E Tests
 * 
 * Runs once before all test files.
 * Seeds test data for john@example.com and sarah@example.com.
 */

import { chromium, type FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

interface TestUser {
  email: string;
  password: string;
  name: string;
}

const JOHN: TestUser = {
  email: process.env.TEST_USER_JOHN_EMAIL || 'john@example.com',
  password: process.env.TEST_USER_JOHN_PASSWORD || 'user123',
  name: 'John Doe',
};

const SARAH: TestUser = {
  email: process.env.TEST_USER_SARAH_EMAIL || 'sarah@example.com',
  password: process.env.TEST_USER_SARAH_PASSWORD || 'test123',
  name: 'Sarah Smith',
};

const ADMIN: TestUser = {
  email: process.env.TEST_USER_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_USER_ADMIN_PASSWORD || 'test123',
  name: 'Test Admin',
};

async function login(page: any, user: TestUser) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  console.log(`✓ Logged in as ${user.email}`);
}

async function createScoreboard(
  page: any,
  title: string,
  description: string,
  scoreType: 'number' | 'time' = 'number',
  visibility: 'public' | 'private' = 'public'
) {
  try {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Open create modal - use more specific selector
    const createButton = page.locator('button:has-text("Create New Scoreboard")');
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();
    
    // Wait for modal to be visible - look for the heading instead of role
    await page.waitForSelector('h2:has-text("Create New Scoreboard")', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Fill form - use id selectors which match the actual form
    await page.fill('#title', title);
    await page.fill('#subtitle', description);
    
    // Select score type
    if (scoreType === 'time') {
      await page.click('input[value="time"]');
    }
    
    // Select visibility
    if (visibility === 'private') {
      await page.click('input[value="private"]');
    }
    
    // Submit - find button by text
    await page.click('button:has-text("Create Scoreboard")');
    
    // Wait for modal to close - wait for heading to disappear
    await page.waitForSelector('h2:has-text("Create New Scoreboard")', { state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log(`✓ Created scoreboard: ${title}`);
  } catch (error: any) {
    console.log(`✗ Failed to create scoreboard "${title}":`, error.message);
    throw error;
  }
}

async function enablePublicRegistration(page: any) {
  try {
    console.log('\n⚙️  Enabling public registration...');
    await page.goto(`${BASE_URL}/system-admin/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Find the toggle button for public registration
    const toggleButton = page.locator('button').filter({
      has: page.locator('~ div:has-text("Allow Public Registration")'),
    }).first().or(
      page.locator('div:has-text("Allow Public Registration")').locator('..').locator('button').first()
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

async function globalSetup(config: FullConfig) {
  console.log('\n🌱 Starting test data setup...\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // First, ensure public registration is enabled
    console.log('\n🔑 Logging in as admin...');
    await login(page, ADMIN);
    await enablePublicRegistration(page);
    await page.context().clearCookies();
    
    // Seed data for John
    console.log('\n👤 Setting up John\'s scoreboards...');
    await login(page, JOHN);
    
    await createScoreboard(page, 'John\'s Gaming Leaderboard', 'High scores for gaming competition', 'number', 'public');
    await createScoreboard(page, 'Speed Run Records', 'Best times for speed runs', 'time', 'public');
    await createScoreboard(page, 'Private Tracker', 'Personal progress tracking', 'number', 'private');
    
    await page.context().clearCookies();
    
    // Seed data for Sarah
    console.log('\n👤 Setting up Sarah\'s scoreboards...');
    await login(page, SARAH);
    
    await createScoreboard(page, 'Sarah\'s Quiz Scores', 'Quiz competition results', 'number', 'public');
    await createScoreboard(page, 'Marathon Times', 'Running event times', 'time', 'public');
    
    await page.context().clearCookies();
    
    console.log('\n✅ Test data setup complete!\n');
  } catch (error) {
    console.error('\n❌ Test data setup failed:', error);
    // Don't fail the test run if seeding fails - data might already exist
    console.log('⚠️  Continuing with existing data...\n');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
