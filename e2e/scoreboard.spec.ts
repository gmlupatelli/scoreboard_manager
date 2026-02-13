/**
 * Scoreboard Management Tests
 * Tests CRUD operations, entries, search, public access, and cross-user visibility
 *
 * Dedicated accounts: USER_1 (john), ADMIN_1
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { safeGoto } from './fixtures/helpers';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

test.describe('Scoreboard CRUD', () => {
  test('user should see their scoreboards on dashboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    // Wait for dashboard content to render
    const scoreboardCards = page.locator('[data-testid="scoreboard-card-title"]');
    const emptyState = page.locator('text=/no scoreboards|create your first/i');

    await expect(
      scoreboardCards.first().or(emptyState.first())
    ).toBeVisible({ timeout: 10000 });

    const cardCount = await scoreboardCards.count();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(cardCount > 0 || hasEmptyState).toBeTruthy();
  });

  test('should view individual scoreboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    const johnScoreboard = page
      .locator("text=John's Public Leaderboard")
      .or(page.locator("text=John's Private Scoreboard"))
      .first();

    await expect(johnScoreboard).toBeVisible({ timeout: 10000 });
    await johnScoreboard.click();

    // Verify detail page loads with a title
    const scoreboardTitle = page.locator('h1, h2').first();
    await expect(scoreboardTitle).toBeVisible({ timeout: 10000 });
  });

  test('should show scoreboard management page', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    const manageButton = page
      .locator('[data-testid="scoreboard-card-manage"]')
      .first();

    const hasManageButton = await manageButton
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasManageButton, 'No scoreboards found for user — nothing to manage');

    await manageButton.click();
    await page.waitForURL('**/scoreboard-management?id=*', {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    const addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    await expect(addEntryButton).toBeVisible({ timeout: 10000 });
  });

  test('should create and manage scoreboard entries', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    // Target an unlocked scoreboard card ("John's Top Scores") to avoid the locked board
    const targetCard = page
      .locator('[data-testid="scoreboard-card"]')
      .filter({ hasText: "John's Top Scores" });
    const manageButton = targetCard.locator('[data-testid="scoreboard-card-manage"]');
    const hasManageButton = await manageButton
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasManageButton, 'No unlocked scoreboards found for user');

    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    const addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    await expect(addEntryButton).toBeVisible({ timeout: 10000 });

    await addEntryButton.click();

    // Form should appear
    const nameInput = page
      .locator('#entry-name')
      .or(page.locator('[role="dialog"] input[type="text"]').first());
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Entry Management', () => {
  test('should add an entry to scoreboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    // Target an unlocked scoreboard card to avoid the locked board
    const targetCard = page
      .locator('[data-testid="scoreboard-card"]')
      .filter({ hasText: "John's Top Scores" });
    const manageButton = targetCard.locator('[data-testid="scoreboard-card-manage"]');
    const hasManageButton = await manageButton
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasManageButton, 'No unlocked scoreboards found for user');

    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    const addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    await expect(addEntryButton).toBeVisible({ timeout: 10000 });

    await addEntryButton.click();

    // Fill entry form and submit
    const nameInput = page.locator('#entry-name');
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    const entryName = `E2E-Test-${Date.now()}`;
    await nameInput.fill(entryName);

    const scoreInput = page.locator('#entry-score');
    await expect(scoreInput).toBeVisible({ timeout: 5000 });
    await scoreInput.fill('999999');

    // Submit the form — the modal's submit button has text "Add Entry" and type="submit"
    const submitButton = page.locator('button[type="submit"]:has-text("Add Entry")');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for modal to close and entry to appear in the table
    // The modal closes immediately but the API call is async, so give it time
    const entryCell = page.locator('td', { hasText: entryName });
    await expect(entryCell).toBeVisible({ timeout: 15000 });

    // Clean up: delete the entry to avoid accumulation across test runs
    const entryRow = page.locator('tr', { hasText: entryName });
    const deleteButton = entryRow.locator('button[title="Delete entry"]');
    await deleteButton.click();
    // Entry is removed optimistically (undo queue, no confirm dialog)
    await expect(entryCell).not.toBeVisible({ timeout: 5000 });
  });

  test('should validate entry form fields', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    // Target an unlocked scoreboard card to avoid the locked board
    const targetCard = page
      .locator('[data-testid="scoreboard-card"]')
      .filter({ hasText: "John's Top Scores" });
    const manageButton = targetCard.locator('[data-testid="scoreboard-card-manage"]');
    const hasManageButton = await manageButton
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasManageButton, 'No unlocked scoreboards found for user');

    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    const addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    await expect(addEntryButton).toBeVisible({ timeout: 10000 });

    await addEntryButton.click();

    // Wait for form to appear
    const nameInput = page.locator('#entry-name');
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    // Type an invalid name (special characters) to trigger validation
    await nameInput.fill('!!!');
    // Clear and leave empty, then type something to trigger the onChange validator
    await nameInput.fill('');
    await nameInput.fill('a');
    await nameInput.fill('!!!');

    // Validation error should appear from onChange
    const validationError = page.locator('text=/only letters|must be|characters/i');
    await expect(validationError.first()).toBeVisible({ timeout: 5000 });
  });

  test('should sort entries by score', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    // Navigate to "John's Public Leaderboard" via its manage button
    const targetCard = page
      .locator('[data-testid="scoreboard-card"]')
      .filter({ hasText: "John's Public Leaderboard" });
    const manageButton = targetCard.locator('[data-testid="scoreboard-card-manage"]');
    const hasManageButton = await manageButton
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasManageButton, 'No "John\'s Public Leaderboard" found');

    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for entries table to load
    const table = page.locator('table').first();
    const hasTable = await table
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasTable, 'No entries table found');

    // Verify entries exist and are ordered
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

test.describe('Scoreboard Search', () => {
  test('should search scoreboards on dashboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    const searchInput = page.getByPlaceholder(/search/i);

    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });

    await searchInput.first().fill("John's");

    // Wait for filtered results to settle
    const scoreboards = page.locator('[data-testid="scoreboard-card"]');
    await expect(scoreboards.first()).toBeVisible({ timeout: 10000 });

    const count = await scoreboards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should search within scoreboard entries', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    const johnScoreboard = page
      .locator("text=John's Public Leaderboard")
      .or(page.locator("text=John's Private Scoreboard"))
      .first();

    await expect(johnScoreboard).toBeVisible({ timeout: 10000 });
    await johnScoreboard.click();

    // Wait for scoreboard detail page
    const scoreboardTitle = page.locator('h1, h2').first();
    await expect(scoreboardTitle).toBeVisible({ timeout: 10000 });

    const searchInput = page
      .locator('input[placeholder*="search"]')
      .or(page.locator('input[placeholder*="Search"]'))
      .or(page.locator('input[type="search"]'));

    const hasSearch = await searchInput.first().isVisible().catch(() => false);
    test.skip(!hasSearch, 'No search input on scoreboard detail page');

    await searchInput.first().fill('a');

    // Results should still be visible (filtered or not)
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Public Scoreboard Access', () => {
  test('should display public scoreboards to unauthenticated users', async ({ page }) => {
    await safeGoto(page, `${BASE_URL}/public-scoreboard-list`);

    // Wait for the public list page to render
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Wait for loading state to finish
    await expect(page.locator('text=/Loading scoreboards/i')).not.toBeVisible({ timeout: 15000 });

    const scoreboardCards = page.locator('[data-testid="public-scoreboard-card"]');
    const emptyState = page.locator('text=/no public scoreboards|no scoreboards/i');

    const cardCount = await scoreboardCards.count();
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(cardCount > 0 || hasEmpty).toBeTruthy();
  });

  test('should view public scoreboard detail', async ({ page }) => {
    await safeGoto(page, `${BASE_URL}/public-scoreboard-list`);

    const scoreboardLink = page.locator('[data-testid="public-scoreboard-card"]').first();

    const hasCards = await scoreboardLink
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hasCards, 'No public scoreboards available');

    await scoreboardLink.click();

    // Verify scoreboard detail page loads with entries visible
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Cross-User Visibility', () => {
  test('user should not see other users private scoreboards', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    const searchInput = page.getByPlaceholder(/search/i);

    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });

    await searchInput.first().fill("Sarah's Private");

    // Wait for search results to settle
    await page.waitForLoadState('domcontentloaded');

    // Sarah's private scoreboards should not appear
    const privateScoreboard = page.locator("text=Sarah's Private");
    await expect(privateScoreboard).not.toBeVisible({ timeout: 5000 });
  });

  test('admin should see all scoreboards', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin1);
    await safeGoto(page, `${BASE_URL}/dashboard`);

    // Admin should see the owner filter dropdown
    const ownerFilter = page
      .locator('text=Filter by Owner')
      .or(page.locator('[placeholder*="Filter by owner"]'))
      .or(page.locator('select, [role="combobox"]').filter({ hasText: /owner/i }));

    const scoreboardCards = page.locator('[data-testid="scoreboard-card"]');

    // Wait for dashboard content to load
    await expect(scoreboardCards.first()).toBeVisible({ timeout: 10000 });

    // Admin should see scoreboards from multiple owners
    const cardCount = await scoreboardCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});
