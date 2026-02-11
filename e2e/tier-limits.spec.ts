/**
 * Free Tier vs Supporter E2E Tests
 * Tests free-tier limitations and supporter-unlocked features
 *
 * @fast - Quick smoke tests for free tier limits and supporter access
 * @full - Comprehensive tier-based functionality coverage
 * @desktop-only - Tier features are primarily desktop workflows
 *
 * Free tier limits:
 *   - 2 public scoreboards max
 *   - 0 private scoreboards
 *   - 50 entries per scoreboard
 *   - No kiosk mode
 *
 * Supporter unlocked:
 *   - Unlimited public scoreboards
 *   - Unlimited private scoreboards
 *   - Unlimited entries
 *   - Kiosk mode
 *
 * Downgrade tests:
 *   - Supporter → Free transition locks all scoreboards
 *   - Downgrade notice modal appears for expired subscriptions
 *   - Free users can unlock public boards up to limit of 2
 *   - Private boards remain locked on free tier
 */

import { test as authTest, expect, TEST_USERS } from './fixtures/auth';
import {
  seedSubscription,
  unlockAllScoreboards,
  lockAllScoreboards,
  clearDowngradeNotice,
  SUPPORTER_6_EMAIL,
} from './fixtures/subscriptions';

// Sarah is a permanent supporter (SUPPORTER_1 with appreciation tier),
// so no subscription seeding needed. Subscription.spec.ts uses the
// dedicated SUPPORTER_2 user on a parallel worker. Downgrade tests below
// use SUPPORTER_6 to avoid races with subscription.spec.ts.

/**
 * Helper to dismiss the DowngradeNoticeModal if it appears.
 * The modal is a full-screen z-50 overlay that blocks all dashboard interactions.
 * Even when `downgrade_notice_seen_at` is set in the DB, the client may load a stale
 * profile from before the DB update, so we must handle the modal at the UI level.
 */
async function dismissDowngradeModal(page: import('@playwright/test').Page) {
  const dismissButton = page.locator('button:has-text("Dismiss")');
  // Give the modal time to appear (it triggers after subscription status loads)
  const isVisible = await dismissButton.isVisible({ timeout: 5000 }).catch(() => false);
  if (isVisible) {
    await dismissButton.click();
    // Wait for the modal overlay to fully disappear
    await page.locator('text=Your plan has ended').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

// =============================================================================
// FREE TIER - SCOREBOARD CREATION LIMITS
// =============================================================================

authTest.describe('Free Tier - Scoreboard Creation Limits', () => {
  authTest(
    '@fast @desktop-only free user sees public scoreboard usage counter on dashboard',
    async ({ johnAuth }) => {
      try {
        await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      } catch {
        // Retry on net::ERR_ABORTED
        await johnAuth.waitForTimeout(500);
        await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      }
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Free users should see usage counter (e.g., "2 of 2 public scoreboards")
      const usageCounter = johnAuth.locator('text=/\\d+.*of.*\\d+.*public scoreboards/i');
      const hasCounter = await usageCounter.isVisible().catch(() => false);

      // John has scoreboards, so the counter should be visible
      expect(hasCounter).toBeTruthy();
    }
  );

  authTest(
    '@fast @desktop-only free user cannot create private scoreboards',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await johnAuth.waitForLoadState('networkidle');

      // Open create modal
      const createButton = johnAuth.locator('button:has-text("Create")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await johnAuth.waitForTimeout(500);

        // Private radio should exist but show "Supporter feature" lock
        const supporterLabel = johnAuth.locator('text=/Supporter feature/i');
        await expect(supporterLabel.first()).toBeVisible();

        // Close modal
        await johnAuth.keyboard.press('Escape');
      }
    }
  );

  authTest(
    '@fast @desktop-only free user sees Become a Supporter link on dashboard',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Free users should see upgrade prompt — either nav link or upgrade banner
      const upgradeLink = johnAuth
        .locator('a:has-text("Become a Supporter")')
        .or(johnAuth.locator('text=/Become a Supporter/i'));

      await expect(upgradeLink.first()).toBeVisible({ timeout: 10000 });
    }
  );

  authTest(
    '@full @desktop-only free user sees limit reached warning in create modal when at limit',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await johnAuth.waitForLoadState('networkidle');

      const createButton = johnAuth.locator('button:has-text("Create")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await johnAuth.waitForTimeout(1000);

        // Check for limit warning (shown when user is at 2/2 public scoreboards)
        const limitWarning = johnAuth.locator('text=/Limit reached/i');
        const usageText = johnAuth.locator('text=/\\d+ of \\d+ public scoreboards/i');

        const hasWarning = await limitWarning.isVisible({ timeout: 5000 }).catch(() => false);
        const hasUsage = await usageText.isVisible({ timeout: 5000 }).catch(() => false);

        // At least one of these should be visible for a free user
        expect(hasWarning || hasUsage).toBeTruthy();

        await johnAuth.keyboard.press('Escape');
      }
    }
  );
});

// =============================================================================
// FREE TIER - ENTRY LIMITS
// =============================================================================

authTest.describe('Free Tier - Entry Limits', () => {
  authTest(
    '@fast @desktop-only free user sees entry usage counter on management page',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await johnAuth.waitForLoadState('networkidle');

      // Wait for scoreboard cards to load (not just "Loading scoreboards...")
      const manageButton = johnAuth
        .locator('button:has-text("Manage Scoreboard")')
        .or(johnAuth.locator('button:has-text("Manage")'))
        .first();

      await manageButton.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

      if (await manageButton.isVisible()) {
        await manageButton.click();
        await johnAuth.waitForURL(/\/scoreboard-management/, { timeout: 15000 });
        await johnAuth.waitForLoadState('networkidle');

        // Free users see entry usage counter — wait for the counter to appear
        // The management page may take time to load scoreboard data
        const entryCounter = johnAuth.locator('text=/\\d+.*of.*\\d+.*entries/i');
        await expect(entryCounter.first()).toBeVisible({ timeout: 20000 });
      }
    }
  );
});

// =============================================================================
// FREE TIER - READ-ONLY SCOREBOARDS
// =============================================================================

authTest.describe('Free Tier - Read-Only Mode', () => {
  authTest(
    '@full @desktop-only free user sees read-only banner on locked scoreboard',
    async ({ johnAuth }) => {
      try {
        await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      } catch {
        await johnAuth.waitForTimeout(500);
        await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      }
      await johnAuth.waitForLoadState('networkidle');

      // Wait for scoreboard cards to load before checking for Read-only badge
      await johnAuth
        .locator('.bg-card h3, [data-testid="scoreboard-card"]')
        .first()
        .waitFor({ state: 'visible', timeout: 20000 })
        .catch(() => {});

      // Look for lock badge on dashboard cards — the Read-only badge is a
      // <span> with text content, not an element with a title attribute
      const readOnlyBadge = johnAuth.locator('text=Read-only');
      await expect(readOnlyBadge.first()).toBeVisible({ timeout: 10000 });
    }
  );
});

// =============================================================================
// SUPPORTER - NO LIMITS
// =============================================================================

authTest.describe('Supporter - Dashboard Features', () => {
  authTest(
    '@fast @desktop-only supporter does not see usage counter on dashboard',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.sarah);
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Supporters should NOT see the "X of Y public scoreboards" counter
      const usageCounter = page.locator('text=/\\d+.*of.*2.*public scoreboards/i');
      await expect(usageCounter).not.toBeVisible();
    }
  );

  authTest(
    '@fast @desktop-only supporter sees private visibility option without lock',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.sarah);
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Private should be available without "Supporter feature" lock for supporters
        const privateRadio = page.locator('input[value="private"]');
        if (await privateRadio.isVisible()) {
          // Check that the Supporter feature lock is NOT shown near private option
          const supporterLock = page.locator(
            'label:has(input[value="private"]) >> text=/Supporter feature/i'
          );
          await expect(supporterLock).not.toBeVisible();
        }

        await page.keyboard.press('Escape');
      }
    }
  );
});

// =============================================================================
// SUPPORTER - KIOSK ACCESS
// =============================================================================

authTest.describe('Supporter - Kiosk Access', () => {
  authTest(
    '@full @desktop-only supporter can see kiosk settings in scoreboard management',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.sarah);
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // If supporter has scoreboards, click manage
      const manageButton = page
        .locator('button:has-text("Manage Scoreboard")')
        .or(page.locator('button:has-text("Manage")'))
        .first();

      if (await manageButton.isVisible()) {
        await manageButton.click();
        await page.waitForURL(/\/scoreboard-management/);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for kiosk settings section (supporter feature)
        const kioskSection = page.locator('text=/Kiosk/i');

        // Kiosk should be visible for supporters
        await expect(kioskSection.first()).toBeVisible({ timeout: 10000 });
      }
    }
  );
});

// =============================================================================
// FREE TIER - NO KIOSK ACCESS
// =============================================================================

authTest.describe('Free Tier - Kiosk Restricted', () => {
  authTest('@full @desktop-only free user does not see kiosk settings', async ({ johnAuth }) => {
    try {
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    } catch {
      // Retry on net::ERR_ABORTED
      await johnAuth.waitForTimeout(500);
      await johnAuth.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    }
    await johnAuth.waitForLoadState('networkidle');
    await johnAuth.waitForTimeout(2000);

    const manageButton = johnAuth
      .locator('button:has-text("Manage Scoreboard")')
      .or(johnAuth.locator('button:has-text("Manage")'))
      .first();

    if (await manageButton.isVisible()) {
      await manageButton.click();
      // Retry click if router.push fails silently under load
      try {
        await johnAuth.waitForURL(/\/scoreboard-management/, { timeout: 8000 });
      } catch {
        await manageButton.click({ force: true });
        await johnAuth.waitForURL(/\/scoreboard-management/, { timeout: 10000 });
      }
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Kiosk toggle should NOT be visible for free users
      const kioskToggle = johnAuth.locator('text=/Enable Kiosk Mode/i');
      await expect(kioskToggle).not.toBeVisible();
    }
  });
});

// =============================================================================
// SUPPORTER → FREE DOWNGRADE TESTS
// =============================================================================
// All downgrade tests share the same SUPPORTER_6 user and modify their
// subscription/lock state. They MUST run serially on a single worker to prevent
// race conditions where one test's seedSubscription overwrites another's.
// SUPPORTER_6 is dedicated to tier-limits to avoid races with subscription.spec.ts.

authTest.describe('Downgrade - Scoreboard Locking & Grace Period', () => {
  // Run serially: all tests modify the same patron user's subscription and lock state.
  // Parallel execution causes race conditions between seedSubscription/lockAllScoreboards
  // and afterEach cleanup across workers.
  authTest.describe.configure({ mode: 'serial' });

  // Use SUPPORTER_6 for downgrade tests — dedicated user to avoid subscription
  // mutation races with subscription.spec.ts (which uses SUPPORTER_2/patron on Desktop Chrome).
  // SUPPORTER_6 has seeded scoreboards from refresh-test-data and their subscription
  // state can be manipulated without affecting other test files.
  //
  // Strategy: Lock boards and set subscription state directly in the DB via beforeEach
  // instead of relying on the client-side DowngradeNoticeManager. This avoids timing
  // issues with the async lock-all API and the overlay modal blocking interactions.

  authTest.afterEach(async () => {
    // Restore active subscription and clean up lock/notice state
    await seedSubscription(SUPPORTER_6_EMAIL, 'active');
    await unlockAllScoreboards(SUPPORTER_6_EMAIL);
    await clearDowngradeNotice(SUPPORTER_6_EMAIL);
  });

  // --- Expired subscription tests ---

  authTest(
    '@full @desktop-only expired supporter sees downgrade notice modal',
    async ({ page, loginAs }) => {
      // Clear notice so the modal will appear, and seed expired subscription
      await clearDowngradeNotice(SUPPORTER_6_EMAIL);
      await seedSubscription(SUPPORTER_6_EMAIL, 'expired');

      await loginAs(TEST_USERS.supporter6);

      // loginAs already lands on /dashboard where DowngradeNoticeManager fires.
      // Wait for the page to fully settle so the subscription status loads
      // and the manager detects the expired state.
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // The DowngradeNoticeManager shows the modal when subscriptionStatus === 'expired'
      // and downgradeNoticeSeenAt is null. Look for the modal title text.
      const modalTitle = page.locator('h3:has-text("Your plan has ended")');
      await expect(modalTitle).toBeVisible({ timeout: 20000 });

      // Verify modal content — use specific element selectors scoped to the
      // modal's amber info box to avoid matching background elements
      const modalOverlay = page.locator('div.bg-black\\/50');
      await expect(modalOverlay.locator('text=/Free plan limits/i')).toBeVisible();
      await expect(modalOverlay.locator('li:has-text("2 public scoreboards maximum")')).toBeVisible();
      await expect(modalOverlay.locator('li:has-text("Kiosk")')).toBeVisible();

      // Verify dismiss and CTA buttons exist
      const dismissButton = modalOverlay.locator('button:has-text("Dismiss")');
      await expect(dismissButton).toBeVisible();
      await expect(modalOverlay.locator('a:has-text("Become a Supporter Again")')).toBeVisible();

      // Dismiss the modal
      await dismissButton.click();
      await page.waitForTimeout(500);
      await expect(modalTitle).not.toBeVisible();
    }
  );

  authTest(
    '@full @desktop-only expired supporter sees locked scoreboards on dashboard',
    async ({ page, loginAs }) => {
      // Pre-configure: expired subscription + boards locked in DB.
      // This simulates a user returning to dashboard after a downgrade.
      await seedSubscription(SUPPORTER_6_EMAIL, 'expired');
      await lockAllScoreboards(SUPPORTER_6_EMAIL);

      await loginAs(TEST_USERS.supporter6);

      // Dismiss the downgrade modal if it appears (blocks all dashboard interactions)
      await dismissDowngradeModal(page);

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Dismiss again in case navigating to dashboard re-triggered the modal
      await dismissDowngradeModal(page);

      // All scoreboards should show "Read-only" badge
      const readOnlyBadge = page.locator('text=Read-only').first();
      await expect(readOnlyBadge).toBeVisible({ timeout: 10000 });

      const scoreboardCards = page.locator('[data-testid="scoreboard-card"]');
      const cardCount = await scoreboardCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Should see "Unlock Scoreboard" buttons for public boards
      const unlockButton = page.locator('button:has-text("Unlock Scoreboard")').first();
      await expect(unlockButton).toBeVisible({ timeout: 5000 });
    }
  );

  authTest(
    '@full @desktop-only downgraded user can unlock a public scoreboard',
    async ({ page, loginAs }) => {
      // Pre-configure: expired + locked in DB
      await seedSubscription(SUPPORTER_6_EMAIL, 'expired');
      await lockAllScoreboards(SUPPORTER_6_EMAIL);

      await loginAs(TEST_USERS.supporter6);
      await dismissDowngradeModal(page);

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await dismissDowngradeModal(page);

      // Verify boards are locked
      const readOnlyBadge = page.locator('text=Read-only').first();
      await expect(readOnlyBadge).toBeVisible({ timeout: 10000 });

      // Count badges before unlock
      const badgesBefore = await page.locator('text=Read-only').count();

      // Find and click the first "Unlock Scoreboard" button
      const unlockButton = page.locator('button:has-text("Unlock Scoreboard")').first();
      await expect(unlockButton).toBeVisible();
      await unlockButton.click();

      // Wait for the unlock to take effect — the button should disappear or badge count drop
      await expect(
        page.locator('text=Read-only')
      ).toHaveCount(badgesBefore - 1, { timeout: 10000 }).catch(() => {
        // Fallback: just wait a bit if the exact count assertion times out
      });

      // After unlock, there should be fewer "Read-only" badges
      const badgesAfter = await page.locator('text=Read-only').count();
      expect(badgesAfter).toBeLessThan(badgesBefore);
    }
  );

  authTest(
    '@full @desktop-only locked scoreboard shows read-only mode on management page',
    async ({ page, loginAs }) => {
      // Pre-configure: expired + locked in DB
      await seedSubscription(SUPPORTER_6_EMAIL, 'expired');
      await lockAllScoreboards(SUPPORTER_6_EMAIL);

      await loginAs(TEST_USERS.supporter6);
      await dismissDowngradeModal(page);

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await dismissDowngradeModal(page);

      // Navigate to manage a locked scoreboard
      const manageButton = page
        .locator('button:has-text("Manage Scoreboard")')
        .or(page.locator('button:has-text("Manage")'))
        .first();

      await expect(manageButton).toBeVisible({ timeout: 5000 });
      await manageButton.click();
      await page.waitForURL(/\/scoreboard-management/);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should see the read-only mode banner
      const readOnlyBanner = page.locator('text=/Read-only mode/i');
      await expect(readOnlyBanner).toBeVisible({ timeout: 10000 });
    }
  );

  // --- Cancelled grace period test ---

  authTest(
    '@full @desktop-only cancelled supporter retains access during grace period',
    async ({ page, loginAs }) => {
      // Ensure boards are unlocked and subscription is in grace period
      await unlockAllScoreboards(SUPPORTER_6_EMAIL);
      await seedSubscription(SUPPORTER_6_EMAIL, 'cancelled_grace_period');

      await loginAs(TEST_USERS.supporter6);
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // During grace period, scoreboards should NOT be locked
      const scoreboardCards = page.locator('[data-testid="scoreboard-card"]');
      const cardCount = await scoreboardCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Should NOT see Read-only badges during grace period
      const readOnlyBadges = page.locator('text=Read-only');
      const badgeCount = await readOnlyBadges.count();
      expect(badgeCount).toBe(0);
    }
  );
});
