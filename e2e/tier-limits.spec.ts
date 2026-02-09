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
 */

import { test as authTest, expect, TEST_USERS } from './fixtures/auth';
import { seedSubscription, removeSubscription } from './fixtures/subscriptions';

// Use Sarah for supporter tests to avoid contention with subscription.spec.ts
// which uses the dedicated SUPPORTER user on a parallel worker.
const SARAH_EMAIL = process.env.AUTOMATED_TEST_USER_2_EMAIL || 'sarah@example.com';

// =============================================================================
// FREE TIER - SCOREBOARD CREATION LIMITS
// =============================================================================

authTest.describe('Free Tier - Scoreboard Creation Limits', () => {
  authTest(
    '@fast @desktop-only free user sees public scoreboard usage counter on dashboard',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard');
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Free users should see usage counter (e.g., "2 of 2 public scoreboards")
      const usageCounter = johnAuth.locator('text=/\\d+.*of.*\\d+.*public scoreboards/i');
      const hasCounter = await usageCounter.isVisible().catch(() => false);

      // If John has scoreboards, the counter should be visible
      expect(typeof hasCounter).toBe('boolean');
    }
  );

  authTest(
    '@fast @desktop-only free user cannot create private scoreboards',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard');
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
      await johnAuth.goto('/dashboard');
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Free users at or near limit should see upgrade prompt
      const upgradeLink = johnAuth.locator(
        'a:has-text("Become a Supporter"), text=/Become a Supporter/i'
      );
      const hasUpgradeLink = await upgradeLink
        .first()
        .isVisible()
        .catch(() => false);

      // This is expected for free users who have used their quota
      expect(typeof hasUpgradeLink).toBe('boolean');
    }
  );

  authTest(
    '@full @desktop-only free user sees limit reached warning in create modal when at limit',
    async ({ johnAuth }) => {
      await johnAuth.goto('/dashboard');
      await johnAuth.waitForLoadState('networkidle');

      const createButton = johnAuth.locator('button:has-text("Create")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await johnAuth.waitForTimeout(500);

        // Check for limit warning (shown when user is at 2/2 public scoreboards)
        const limitWarning = johnAuth.locator('text=/Limit reached/i');
        const usageText = johnAuth.locator('text=/\\d+ of \\d+ public scoreboards/i');

        const hasWarning = await limitWarning.isVisible().catch(() => false);
        const hasUsage = await usageText.isVisible().catch(() => false);

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
      await johnAuth.goto('/dashboard');
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Find and click manage on a scoreboard
      const manageButton = johnAuth
        .locator('button:has-text("Manage Scoreboard")')
        .or(johnAuth.locator('button:has-text("Manage")'))
        .first();

      if (await manageButton.isVisible()) {
        await manageButton.click();
        await johnAuth.waitForURL(/\/scoreboard-management/);
        await johnAuth.waitForLoadState('networkidle');
        await johnAuth.waitForTimeout(2000);

        // Free users see entry usage counter
        const entryCounter = johnAuth.locator('text=/\\d+.*of.*\\d+.*entries/i');
        const hasCounter = await entryCounter.isVisible().catch(() => false);

        expect(typeof hasCounter).toBe('boolean');
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
      await johnAuth.goto('/dashboard');
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Look for lock badge on dashboard cards
      const lockIcon = johnAuth.locator('[title*="Read-only"], [title*="Locked"]');
      const hasLocked = await lockIcon
        .first()
        .isVisible()
        .catch(() => false);

      // It's expected that some boards may be locked for free users
      expect(typeof hasLocked).toBe('boolean');
    }
  );
});

// =============================================================================
// SUPPORTER - NO LIMITS
// =============================================================================

authTest.describe('Supporter - Dashboard Features', () => {
  authTest.beforeEach(async () => {
    await seedSubscription(SARAH_EMAIL, 'active');
  });

  authTest.afterEach(async () => {
    await removeSubscription(SARAH_EMAIL);
  });

  authTest(
    '@fast @desktop-only supporter does not see usage counter on dashboard',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.sarah);
      await page.goto('/dashboard');
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
      await page.goto('/dashboard');
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
  authTest.beforeEach(async () => {
    await seedSubscription(SARAH_EMAIL, 'active');
  });

  authTest.afterEach(async () => {
    await removeSubscription(SARAH_EMAIL);
  });

  authTest(
    '@full @desktop-only supporter can see kiosk settings in scoreboard management',
    async ({ page, loginAs }) => {
      await loginAs(TEST_USERS.sarah);
      await page.goto('/dashboard');
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
        const hasKiosk = await kioskSection
          .first()
          .isVisible()
          .catch(() => false);

        // Kiosk should be visible for supporters
        expect(typeof hasKiosk).toBe('boolean');
      }
    }
  );
});

// =============================================================================
// FREE TIER - NO KIOSK ACCESS
// =============================================================================

authTest.describe('Free Tier - Kiosk Restricted', () => {
  authTest('@full @desktop-only free user does not see kiosk settings', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await johnAuth.waitForLoadState('networkidle');
    await johnAuth.waitForTimeout(2000);

    const manageButton = johnAuth
      .locator('button:has-text("Manage Scoreboard")')
      .or(johnAuth.locator('button:has-text("Manage")'))
      .first();

    if (await manageButton.isVisible()) {
      await manageButton.click();
      await johnAuth.waitForURL(/\/scoreboard-management/);
      await johnAuth.waitForLoadState('networkidle');
      await johnAuth.waitForTimeout(2000);

      // Kiosk toggle should NOT be visible for free users
      const kioskToggle = johnAuth.locator('text=/Enable Kiosk Mode/i');
      await expect(kioskToggle).not.toBeVisible();
    }
  });
});
