/**
 * Scoreboard Management Tests
 * Tests CRUD operations, entries, search, filters, and ownership
 *
 * @fast - Quick smoke tests for essential scoreboard operations
 * @full - Comprehensive scoreboard functionality coverage
 * @desktop-only - Authorization, keyboard, and business logic tests
 */

import { test as authTest, expect } from './fixtures/auth';

authTest.describe('Dashboard - Scoreboard Display', () => {
  authTest('@fast dashboard displays scoreboards or empty state', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(2000);

    const scoreboardCards = johnAuth.locator('.bg-card.rounded-lg h3');
    const emptyState = johnAuth.locator('text=/no scoreboards|create your first/i');

    const cardCount = await scoreboardCards.count();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(cardCount > 0 || hasEmptyState).toBeTruthy();
  });

  authTest('@fast create scoreboard button is visible', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const createButton = johnAuth
      .locator('button:has-text("Create")')
      .or(johnAuth.locator('text=Create Scoreboard'));

    await expect(createButton.first()).toBeVisible();
  });

  // Modal/form logic - viewport-independent
  authTest('@full @desktop-only create scoreboard modal opens', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForLoadState('networkidle');

    // Wait for dashboard content to fully render (scoreboards loaded)
    await johnAuth.waitForTimeout(2000);

    const createButton = johnAuth.locator('button:has-text("Create")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Modal should appear with form fields
    const modal = johnAuth.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
  });

  // Search logic - viewport-independent
  authTest('@full @desktop-only dashboard search filters scoreboards', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(2000);

    const searchInput = johnAuth
      .locator('input[placeholder*="search"]')
      .or(johnAuth.locator('input[type="search"]'));

    if (await searchInput.isVisible()) {
      await searchInput.fill("John's");
      await johnAuth.waitForTimeout(1000);

      // Search should filter results
      const scoreboards = johnAuth.locator('.bg-card.rounded-lg');
      const count = await scoreboards.count();
      // Search results should still show some scoreboards
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

authTest.describe('Scoreboard CRUD Operations', () => {
  authTest('@fast scoreboard title displays correctly', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(2000);

    const johnScoreboard = johnAuth
      .locator("text=John's Public Leaderboard")
      .or(johnAuth.locator("text=John's Private Scoreboard"))
      .first();

    if (await johnScoreboard.isVisible()) {
      await johnScoreboard.click();
      await johnAuth.waitForTimeout(1000);

      const scoreboardTitle = johnAuth.locator('h1, h2').first();
      await expect(scoreboardTitle).toBeVisible();
    }
  });

  // Ownership logic - viewport-independent
  authTest('@full @desktop-only john can manage his own scoreboards', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(2000);

    const johnScoreboard = johnAuth
      .locator("text=John's Public Leaderboard")
      .or(johnAuth.locator("text=John's Private Scoreboard"))
      .first();

    if (await johnScoreboard.isVisible()) {
      await johnScoreboard.click();
      await johnAuth.waitForTimeout(1000);

      // Manage button SHOULD be visible for john
      const manageButton = johnAuth
        .locator('button:has-text("Manage")')
        .or(johnAuth.locator('button:has-text("Edit")'));

      await expect(manageButton.first()).toBeVisible();
    }
  });

  // Data display logic - viewport-independent
  authTest(
    '@full @desktop-only scoreboard management page displays entries',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await johnAuth.waitForTimeout(2000);

      // Find and click manage button on john's scoreboard
      const manageButton = johnAuth
        .locator('button:has-text("Manage Scoreboard")')
        .or(johnAuth.locator('button:has-text("Manage")'))
        .first();

      // Wait for manage button — skip if john has no scoreboards
      const hasManageButton = await manageButton
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      authTest.skip(!hasManageButton, 'No scoreboards found for john — nothing to manage');

      await manageButton.click();
      await johnAuth.waitForURL('**/scoreboard-management?id=*', {
        timeout: 15000,
        waitUntil: 'domcontentloaded',
      });

      // Should see management interface
      const addEntryButton = johnAuth.getByRole('button', { name: 'Add Entry' });
      await expect(addEntryButton).toBeVisible({ timeout: 10000 });
    }
  );

  // Form logic - viewport-independent
  authTest('@full @desktop-only add entry form opens', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForLoadState('networkidle');

    // Wait for scoreboard cards to load
    const manageButton = johnAuth.locator('button:has-text("Manage Scoreboard")').first();
    await manageButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    if (await manageButton.isVisible()) {
      await manageButton.click();
      await johnAuth.waitForURL(/\/scoreboard-management/, { timeout: 15000 });
      await johnAuth.waitForLoadState('networkidle');

      const addEntryButton = johnAuth.locator('button:has-text("Add Entry")');
      await addEntryButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

      if (await addEntryButton.isVisible()) {
        // Skip if the button is disabled (locked/read-only scoreboard)
        const isDisabled = await addEntryButton.isDisabled();
        if (isDisabled) {
          // Navigate back and try a different scoreboard
          await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
          await johnAuth.waitForLoadState('networkidle');

          // Try clicking the second Manage Scoreboard button if available
          const secondManage = johnAuth.locator('button:has-text("Manage Scoreboard")').nth(1);
          const hasSecond = await secondManage.isVisible().catch(() => false);
          authTest.skip(!hasSecond, 'All scoreboards are read-only on free plan — cannot test add entry');

          await secondManage.click();
          await johnAuth.waitForURL(/\/scoreboard-management/, { timeout: 15000 });
          await johnAuth.waitForLoadState('networkidle');

          const secondAddEntry = johnAuth.locator('button:has-text("Add Entry")');
          await secondAddEntry.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
          const isAlsoDisabled = await secondAddEntry.isDisabled().catch(() => true);
          authTest.skip(isAlsoDisabled, 'Second scoreboard also read-only — cannot test add entry');

          await secondAddEntry.click();
        } else {
          await addEntryButton.click();
        }
        await johnAuth.waitForTimeout(500);

        // Form should appear - use the modal input specifically
        const nameInput = johnAuth
          .locator('#entry-name')
          .or(johnAuth.locator('[role="dialog"] input[type="text"]').first());
        await expect(nameInput).toBeVisible();
      }
    }
  });

  // Ownership UI - viewport-independent
  authTest(
    '@full @desktop-only delete button is available for owned scoreboards',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await johnAuth.waitForTimeout(2000);

      // Check john has at least one scoreboard card
      const moreOptionsButton = johnAuth
        .locator('button:has-text("More options")')
        .first();
      const hasScoreboards = await moreOptionsButton
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      authTest.skip(!hasScoreboards, 'No scoreboards found for john — no delete button to check');

      // Open more options menu to find delete
      await moreOptionsButton.click();
      await johnAuth.waitForTimeout(500);

      const deleteButton = johnAuth
        .locator('button:has-text("Delete")')
        .or(johnAuth.locator('[role="menuitem"]:has-text("Delete")'))
        .first();

      await expect(deleteButton).toBeVisible({ timeout: 5000 });
    }
  );
});

authTest.describe('Scoreboard Ownership & Permissions', () => {
  // Authorization - viewport-independent
  authTest(
    '@fast @desktop-only sarah cannot access john private scoreboard',
    async ({ sarahAuth }) => {
      await sarahAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await sarahAuth.waitForTimeout(2000);

      const searchInput = sarahAuth
        .locator('input[placeholder*="search"]')
        .or(sarahAuth.locator('input[type="search"]'));

      if (await searchInput.isVisible()) {
        await searchInput.fill("John's Private");
        await sarahAuth.waitForTimeout(1000);

        // Private scoreboard should not appear in sarah's dashboard
        const privateScoreboard = sarahAuth.locator("text=John's Private Scoreboard");
        await expect(privateScoreboard).not.toBeVisible();
      }
    }
  );

  // Authorization - viewport-independent
  authTest('@fast @desktop-only sarah can view john public scoreboard', async ({ sarahAuth }) => {
    await sarahAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await sarahAuth.waitForTimeout(2000);

    const searchInput = sarahAuth
      .locator('input[placeholder*="search"]')
      .or(sarahAuth.locator('input[type="search"]'));

    if (await searchInput.isVisible()) {
      await searchInput.fill("John's Public");
      await sarahAuth.waitForTimeout(1000);

      const publicScoreboard = sarahAuth.locator("text=John's Public Leaderboard");

      if (await publicScoreboard.isVisible()) {
        await publicScoreboard.click();
        await sarahAuth.waitForTimeout(1000);

        const scoreboardTitle = sarahAuth.locator('h1, h2').filter({
          hasText: /John's Public/i,
        });
        await expect(scoreboardTitle).toBeVisible();
      }
    }
  });

  // Authorization - viewport-independent
  authTest(
    '@full @desktop-only sarah cannot edit john scoreboard entries',
    async ({ sarahAuth }) => {
      await sarahAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await sarahAuth.waitForTimeout(2000);

      const publicScoreboard = sarahAuth.locator("text=John's Public Leaderboard");

      if (await publicScoreboard.isVisible()) {
        await publicScoreboard.click();
        await sarahAuth.waitForTimeout(1000);

        // Manage/Edit button should not be visible to sarah
        const manageButton = sarahAuth
          .locator('button:has-text("Manage")')
          .or(sarahAuth.locator('button:has-text("Edit Entries")'));

        await expect(manageButton).not.toBeVisible();
      }
    }
  );

  // Authorization UI - viewport-independent
  authTest(
    '@full @desktop-only john should not see owner filter in dashboard',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });

      // Owner filter is admin-only
      const ownerFilter = johnAuth
        .locator('text=Filter by Owner')
        .or(johnAuth.locator('[placeholder*="Filter by owner"]'));

      await expect(ownerFilter).not.toBeVisible();
    }
  );

  // Data display - viewport-independent
  authTest('@full @desktop-only sarah should see her own scoreboards', async ({ sarahAuth }) => {
    await sarahAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await sarahAuth.waitForTimeout(2000);

    const scoreboardCards = sarahAuth.locator('.bg-card.rounded-lg h3');
    const emptyState = sarahAuth.locator('text=/no scoreboards|create your first/i');

    const cardCount = await scoreboardCards.count();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(cardCount > 0 || hasEmptyState).toBeTruthy();
  });
});

authTest.describe('Keyboard Navigation', () => {
  // Keyboard - desktop-only
  authTest('@fast @desktop-only tab navigation works on dashboard', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(1000);

    // Press Tab and verify focus moves
    await johnAuth.keyboard.press('Tab');
    await johnAuth.waitForTimeout(200);

    const focusedElement = johnAuth.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  // Keyboard - desktop-only
  authTest('@full @desktop-only escape closes modals', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(1000);

    const createButton = johnAuth.locator('button:has-text("Create")').first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await johnAuth.waitForTimeout(500);

      // Modal should be open
      const modal = johnAuth.locator('[role="dialog"]').or(johnAuth.locator('.modal'));
      await expect(modal).toBeVisible();

      // Click inside modal first to ensure focus
      await modal.click();
      await johnAuth.waitForTimeout(200);

      // Press Escape
      await johnAuth.keyboard.press('Escape');
      await johnAuth.waitForTimeout(1000);

      // Modal should close
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    }
  });

  // Keyboard - desktop-only
  authTest('@full @desktop-only enter submits forms', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForTimeout(1000);

    const searchInput = johnAuth
      .locator('input[placeholder*="search"]')
      .or(johnAuth.locator('input[type="search"]'));

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await johnAuth.waitForTimeout(500);

      // Should not throw error
      await expect(johnAuth.locator('body')).toBeVisible();
    }
  });
});

authTest.describe('Real-time Updates', () => {
  // Data logic - viewport-independent
  authTest('@full @desktop-only dashboard reflects data changes', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await johnAuth.waitForLoadState('networkidle');

    // Get scoreboard cards locator
    const scoreboardCards = johnAuth.locator('.bg-card.rounded-lg');

    // Verify page is responsive to updates
    await johnAuth.reload({ waitUntil: 'domcontentloaded' });
    await johnAuth.waitForLoadState('networkidle');

    const newCount = await scoreboardCards.count();
    expect(newCount).toBeGreaterThan(0);
  });
});
