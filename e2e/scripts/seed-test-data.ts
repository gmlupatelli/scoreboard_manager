/**
 * Seed Test Data Script
 *
 * Generates reproducible test data for john@example.com and sarah@example.com
 * Run once before first test execution: npm run test:seed
 *
 * Prerequisites:
 * - Test users must exist in Supabase Auth (john, sarah, jane, admin)
 * - .env.test must be configured with credentials
 * - Application must be running on localhost:5000
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

interface TestUser {
  email: string;
  password: string;
  name: string;
}

interface ScoreboardEntry {
  name: string;
  score: string;
}

interface ScoreboardData {
  title: string;
  description: string;
  scoreType: 'number' | 'time';
  sortOrder: 'asc' | 'desc';
  isPublic: boolean;
  entries: ScoreboardEntry[];
}

interface UserSeedData {
  scoreboards: ScoreboardData[];
  invitations: string[];
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

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

async function login(page: Page, user: TestUser) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  console.log(`✓ Logged in as ${user.email}`);
}

async function createScoreboard(
  page: Page,
  title: string,
  description: string,
  scoreType: 'number' | 'time',
  sortOrder: 'desc' | 'asc',
  isPublic: boolean
) {
  // Click create button
  await page.click('text=Create Scoreboard');

  // Wait for modal
  await page.waitForSelector('text=Create New Scoreboard');

  // Fill form
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="description"]', description);

  // Select score type
  await page.selectOption('select[name="scoreType"]', scoreType);

  // Select sort order
  await page.selectOption('select[name="sortOrder"]', sortOrder);

  // Set visibility
  const visibilityCheckbox = page.locator('input[type="checkbox"]').first();
  const isChecked = await visibilityCheckbox.isChecked();
  if (isPublic !== isChecked) {
    await visibilityCheckbox.click();
  }

  // Submit
  await page.click('button[type="submit"]:has-text("Create")');

  // Wait for success
  await page.waitForTimeout(2000);

  console.log(`✓ Created scoreboard: ${title}`);
}

async function addEntries(
  page: Page,
  scoreboardTitle: string,
  entries: Array<{ name: string; score: string }>
) {
  // Navigate to scoreboard management from dashboard
  await page.click(`text=${scoreboardTitle}`);
  await page.waitForTimeout(1000);

  // Click manage button (or navigate to management page)
  const manageButton = page.locator('text=Manage').or(page.locator('text=Edit'));
  if (await manageButton.isVisible()) {
    await manageButton.click();
    await page.waitForTimeout(1000);
  }

  // Add each entry
  for (const entry of entries) {
    await page.click('text=Add Entry');
    await page.waitForSelector('input[name="name"]');

    await page.fill('input[name="name"]', entry.name);
    await page.fill('input[name="score"]', entry.score);

    await page.click('button[type="submit"]:has-text("Add")');
    await page.waitForTimeout(1000);

    console.log(`  ✓ Added entry: ${entry.name} - ${entry.score}`);
  }

  // Navigate back to dashboard
  await page.click('text=Dashboard');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

async function sendInvitation(page: Page, inviteeEmail: string) {
  // Navigate to invitations page
  await page.goto(`${BASE_URL}/invitations`);
  await page.waitForTimeout(1000);

  // Click send invitation button
  await page.click('text=Send Invitation');

  // Wait for modal
  await page.waitForSelector('input[name="email"]');

  // Fill email
  await page.fill('input[name="email"]', inviteeEmail);

  // Submit
  await page.click('button[type="submit"]:has-text("Send")');

  await page.waitForTimeout(2000);

  console.log(`✓ Sent invitation to ${inviteeEmail}`);
}

async function seedUserData(browser: Browser, user: TestUser, data: UserSeedData) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`\n📝 Seeding data for ${user.name} (${user.email})`);

    await login(page, user);

    // Create scoreboards
    for (const scoreboard of data.scoreboards) {
      await createScoreboard(
        page,
        scoreboard.title,
        scoreboard.description,
        scoreboard.scoreType,
        scoreboard.sortOrder,
        scoreboard.isPublic
      );

      // Add entries if provided
      if (scoreboard.entries && scoreboard.entries.length > 0) {
        await addEntries(page, scoreboard.title, scoreboard.entries);
      }
    }

    // Send invitations if provided
    if (data.invitations && data.invitations.length > 0) {
      for (const inviteeEmail of data.invitations) {
        await sendInvitation(page, inviteeEmail);
      }
    }

    console.log(`✅ Completed seeding for ${user.email}\n`);
  } catch (error) {
    console.error(`❌ Error seeding data for ${user.email}:`, error);
    throw error;
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('🌱 Starting test data seed...\n');

  const browser = await chromium.launch({ headless: false });

  try {
    // Seed John's data
    await seedUserData(browser, JOHN, {
      scoreboards: [
        {
          title: "John's Private Scoreboard",
          description: 'Private test scoreboard for RBAC testing',
          scoreType: 'number',
          sortOrder: 'desc',
          isPublic: false,
          entries: [
            { name: 'Alice Johnson', score: '950' },
            { name: 'Bob Williams', score: '850' },
            { name: 'Charlie Brown', score: '780' },
            { name: 'Diana Prince', score: '720' },
            { name: 'Eve Adams', score: '680' },
          ],
        },
        {
          title: "John's Public Leaderboard",
          description: 'Public test scoreboard visible to all users',
          scoreType: 'number',
          sortOrder: 'desc',
          isPublic: true,
          entries: [
            { name: 'Frank Castle', score: '1200' },
            { name: 'Grace Hopper', score: '1100' },
            { name: 'Henry Ford', score: '1050' },
            { name: 'Iris West', score: '990' },
            { name: 'Jack Ryan', score: '920' },
            { name: 'Kelly Olsen', score: '880' },
            { name: 'Leo Fitz', score: '850' },
          ],
        },
      ],
      invitations: ['test@example.com'],
    });

    // Seed Sarah's data
    await seedUserData(browser, SARAH, {
      scoreboards: [
        {
          title: "Sarah's Race Times",
          description: 'Public time-based scoreboard',
          scoreType: 'time',
          sortOrder: 'asc',
          isPublic: true,
          entries: [
            { name: 'Runner A', score: '125.45' },
            { name: 'Runner B', score: '132.78' },
            { name: 'Runner C', score: '145.23' },
            { name: 'Runner D', score: '156.89' },
          ],
        },
        {
          title: "Sarah's Game Scores",
          description: 'Public number-based scoreboard',
          scoreType: 'number',
          sortOrder: 'desc',
          isPublic: true,
          entries: [
            { name: 'Player 1', score: '5600' },
            { name: 'Player 2', score: '5200' },
            { name: 'Player 3', score: '4800' },
            { name: 'Player 4', score: '4500' },
            { name: 'Player 5', score: '4200' },
          ],
        },
      ],
      invitations: [],
    });

    console.log('✅ Test data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - John: 2 scoreboards (1 private, 1 public), 1 invitation');
    console.log('  - Sarah: 2 scoreboards (2 public), 0 invitations');
    console.log('  - Jane: Untouched (for manual testing)\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
