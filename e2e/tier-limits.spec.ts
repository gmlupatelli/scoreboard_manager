/**
 * Free Tier vs Supporter E2E Tests
 * Tests free-tier limitations, supporter-unlocked features, and downgrade flows.
 *
 * Free tier limits:
 *   - 2 public scoreboards max
 *   - 0 private scoreboards
 *   - 50 entries per scoreboard
 *
 * Supporter unlocked:
 *   - Higher/unlimited scoreboard and entry limits
 *
 * Downgrade tests (serial, SUPPORTER_6):
 *   - Downgrade notice modal appears for expired subscriptions
 *   - Locked scoreboards shown on dashboard
 *   - Locked scoreboards prevent editing on management page
 *
 * Dedicated accounts: USER_7 (free tier), SUPPORTER_6 (supporter/downgrade)
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import {
  seedSubscription,
  removeSubscription,
  lockAllScoreboards,
  unlockAllScoreboards,
  clearDowngradeNotice,
  markDowngradeNoticeSeen,
  SUPPORTER_6_EMAIL,
} from './fixtures/subscriptions';
import { safeGoto } from './fixtures/helpers';

/**
 * Helper to dismiss the DowngradeNoticeModal if it appears.
 * The modal is a full-screen z-50 overlay that blocks all dashboard interactions.
 */
async function dismissDowngradeModal(page: import('@playwright/test').Page) {
  const dismissButton = page.locator('[data-testid="downgrade-notice-dismiss"]');
  try {
    await dismissButton.waitFor({ state: 'visible', timeout: 5000 });
    await dismissButton.click();
    await page.locator('text=Your plan has ended').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  } catch {
    // Modal didn't appear — continue
  }
}

// =============================================================================
// FREE TIER LIMITS
// =============================================================================

test.describe('Free Tier Limits', () => {
  test('should show scoreboard count and limit indicator', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user7);
    await safeGoto(page, '/dashboard');

    // Wait for dashboard content to load
    await page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
      .waitFor({ state: 'visible', timeout: 20000 });

    // Free users should see usage counter (e.g., "2 of 2 public scoreboards")
    const usageCounter = page.locator('text=/\\d+.*of.*\\d+.*public scoreboards/i');
    await expect(usageCounter.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show create scoreboard button with limit context', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user7);
    await safeGoto(page, '/dashboard');

    await page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
      .waitFor({ state: 'visible', timeout: 20000 });

    // Open create modal
    const createButton = page.locator('button:has-text("Create")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for modal to appear
    const modal = page.locator('[role="dialog"], .fixed');
    await modal.first().waitFor({ state: 'visible', timeout: 5000 });

    // Check for limit warning or usage text (shown when user is at 2/2 public scoreboards)
    const limitWarning = page.locator('text=/Limit reached/i');
    const usageText = page.locator('text=/\\d+ of \\d+ public scoreboards/i');
    const supporterLabel = page.locator('text=/Supporter feature/i');

    let hasWarning = false;
    let hasUsage = false;
    let hasSupporterLock = false;
    try { await limitWarning.waitFor({ state: 'visible', timeout: 3000 }); hasWarning = true; } catch { /* not visible */ }
    try { await usageText.waitFor({ state: 'visible', timeout: 3000 }); hasUsage = true; } catch { /* not visible */ }
    try { await supporterLabel.first().waitFor({ state: 'visible', timeout: 3000 }); hasSupporterLock = true; } catch { /* not visible */ }

    // Free user create modal should show at least one limit indicator
    expect(hasWarning || hasUsage || hasSupporterLock).toBeTruthy();

    await page.keyboard.press('Escape');
  });

  test('should enforce entry limits per scoreboard', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user7);
    await safeGoto(page, '/dashboard');

    // Wait for scoreboard cards to load
    const manageButton = page
      .locator('[data-testid="scoreboard-card-manage"]')
      .first();

    await manageButton.waitFor({ state: 'visible', timeout: 20000 });
    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, { timeout: 15000 });

    // Wait for management page data to load
    await page.locator('h1, h2, [data-testid]').first().waitFor({ state: 'visible', timeout: 10000 });

    // Free users see entry usage counter
    const entryCounter = page.locator('text=/\\d+.*of.*\\d+.*entries/i');
    await expect(entryCounter.first()).toBeVisible({ timeout: 20000 });
  });
});

// =============================================================================
// SUPPORTER BENEFITS
// =============================================================================

test.describe('Supporter Benefits', () => {
  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_6_EMAIL, 'active');
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_6_EMAIL);
  });

  test('should have higher scoreboard limit for supporters', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter6);
    await safeGoto(page, '/dashboard');

    // Wait for dashboard content
    await page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
      .waitFor({ state: 'visible', timeout: 20000 });

    // Supporters should NOT see the free-tier "X of 2 public scoreboards" counter
    const freeTierCounter = page.locator('text=/\\d+.*of.*2.*public scoreboards/i');
    await expect(freeTierCounter).not.toBeVisible({ timeout: 5000 });
  });

  test('should have higher entry limit for supporters', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter6);
    await safeGoto(page, '/dashboard');

    // Navigate to scoreboard management
    const manageButton = page
      .locator('[data-testid="scoreboard-card-manage"]')
      .first();

    await manageButton.waitFor({ state: 'visible', timeout: 20000 });
    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, { timeout: 15000 });

    // Wait for management page to load
    await page.locator('h1, h2, [data-testid]').first().waitFor({ state: 'visible', timeout: 10000 });

    // Supporters should NOT see the free-tier "X of 50 entries" counter
    const freeTierEntryCounter = page.locator('text=/\\d+.*of.*50.*entries/i');
    await expect(freeTierEntryCounter).not.toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// DOWNGRADE FLOW (serial — tests share SUPPORTER_6 state)
// =============================================================================

test.describe('Downgrade Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await seedSubscription(SUPPORTER_6_EMAIL, 'expired');
    await lockAllScoreboards(SUPPORTER_6_EMAIL);
    await clearDowngradeNotice(SUPPORTER_6_EMAIL);
  });

  test.afterAll(async () => {
    await removeSubscription(SUPPORTER_6_EMAIL);
    await unlockAllScoreboards(SUPPORTER_6_EMAIL);
    await markDowngradeNoticeSeen(SUPPORTER_6_EMAIL);
  });

  test('should show downgrade notice modal on first login after expiry', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter6);

    // The DowngradeNoticeManager shows the modal when subscriptionStatus === 'expired'
    // and downgradeNoticeSeenAt is null.
    const modalTitle = page.locator('h3:has-text("Your plan has ended")');
    await expect(modalTitle).toBeVisible({ timeout: 20000 });
  });

  test('should explain what happens during downgrade', async ({ page, loginAs }) => {
    // Ensure notice hasn't been marked seen yet
    await clearDowngradeNotice(SUPPORTER_6_EMAIL);

    await loginAs(TEST_USERS.supporter6);

    const modalTitle = page.locator('h3:has-text("Your plan has ended")');
    await expect(modalTitle).toBeVisible({ timeout: 20000 });

    // Verify modal content scoped to the overlay
    const modalOverlay = page.locator('[data-testid="downgrade-notice-modal"]');
    await expect(modalOverlay.locator('text=/Free plan limits/i')).toBeVisible();
    await expect(modalOverlay.locator('li:has-text("2 public scoreboards maximum")')).toBeVisible();
    await expect(modalOverlay.locator('li:has-text("Kiosk")')).toBeVisible();

    // Verify dismiss and CTA buttons exist
    await expect(modalOverlay.locator('[data-testid="downgrade-notice-dismiss"]')).toBeVisible();
    await expect(modalOverlay.locator('a:has-text("Become a Supporter Again")')).toBeVisible();
  });

  test('should allow dismissing the downgrade notice', async ({ page, loginAs }) => {
    // Ensure the modal will appear
    await clearDowngradeNotice(SUPPORTER_6_EMAIL);

    await loginAs(TEST_USERS.supporter6);

    const modalTitle = page.locator('h3:has-text("Your plan has ended")');
    await expect(modalTitle).toBeVisible({ timeout: 20000 });

    // Dismiss the modal
    const dismissButton = page.locator('[data-testid="downgrade-notice-dismiss"]');
    await dismissButton.click();

    // Verify modal is gone
    await expect(modalTitle).not.toBeVisible({ timeout: 5000 });
  });

  test('should show locked scoreboards on dashboard', async ({ page, loginAs }) => {
    // Mark notice as seen so it doesn't block dashboard interactions
    await markDowngradeNoticeSeen(SUPPORTER_6_EMAIL);
    await lockAllScoreboards(SUPPORTER_6_EMAIL);

    await loginAs(TEST_USERS.supporter6);
    await dismissDowngradeModal(page);

    await safeGoto(page, '/dashboard');
    await dismissDowngradeModal(page);

    // Wait for scoreboard cards to load
    await page.locator('[data-testid="scoreboard-card-title"]').first()
      .waitFor({ state: 'visible', timeout: 20000 });

    // All scoreboards should show "Read-only" badge
    const readOnlyBadge = page.locator('text=Read-only').first();
    await expect(readOnlyBadge).toBeVisible({ timeout: 10000 });

    const scoreboardCards = page.locator('[data-testid="scoreboard-card"]');
    const cardCount = await scoreboardCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should prevent editing locked scoreboards', async ({ page, loginAs }) => {
    // Ensure boards are still locked and modal won't block
    await markDowngradeNoticeSeen(SUPPORTER_6_EMAIL);
    await lockAllScoreboards(SUPPORTER_6_EMAIL);

    await loginAs(TEST_USERS.supporter6);
    await dismissDowngradeModal(page);

    await safeGoto(page, '/dashboard');
    await dismissDowngradeModal(page);

    // Wait for cards, then navigate to manage a locked scoreboard
    await page.locator('[data-testid="scoreboard-card-title"]').first()
      .waitFor({ state: 'visible', timeout: 20000 });

    const manageButton = page
      .locator('[data-testid="scoreboard-card-manage"]')
      .first();

    await expect(manageButton).toBeVisible({ timeout: 5000 });
    await manageButton.click();
    await page.waitForURL(/\/scoreboard-management/, { timeout: 15000 });

    // Wait for management page to load
    await page.locator('h1, h2, [data-testid]').first().waitFor({ state: 'visible', timeout: 10000 });

    // Should see the read-only mode banner
    const readOnlyBanner = page.locator('text=/Read-only mode/i');
    await expect(readOnlyBanner).toBeVisible({ timeout: 10000 });
  });
});
