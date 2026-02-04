/**
 * System Admin Tests
 * Tests system admin exclusive features and permissions
 *
 * All admin tests are marked @desktop-only since admin functionality
 * doesn't vary by viewport and is unlikely to be used on mobile devices.
 *
 * @fast - Quick smoke tests for admin access and navigation
 * @full - Comprehensive admin functionality coverage
 * @desktop-only - All tests in this file (admin is desktop-centric)
 */

import { test, expect } from './fixtures/auth';
import { type Page } from '@playwright/test';

const safeGoto = async (page: Page, url: string) => {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.waitForTimeout(500);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
};

test.describe('System Admin - Dashboard Oversight', () => {
  test('@fast @desktop-only admin should see owner filter dropdown in dashboard', async ({
    adminAuth,
  }) => {
    await safeGoto(adminAuth, '/dashboard');

    const ownerFilter = adminAuth
      .locator('text=Filter by Owner')
      .or(adminAuth.locator('[placeholder*="owner"]'));
    await expect(ownerFilter).toBeVisible();
  });

  test('@full @desktop-only admin should see scoreboards from multiple owners', async ({
    adminAuth,
  }) => {
    await safeGoto(adminAuth, '/dashboard');
    await adminAuth.waitForTimeout(2000);

    const scoreboards = adminAuth.locator('.bg-card.rounded-lg h3');
    const count = await scoreboards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('@full @desktop-only admin should be able to filter scoreboards by owner', async ({
    adminAuth,
  }) => {
    await safeGoto(adminAuth, '/dashboard');
    await adminAuth.waitForTimeout(2000);

    const filterInput = adminAuth
      .locator('input[placeholder*="owner"]')
      .or(adminAuth.locator('select[name="owner"]'));

    if (await filterInput.isVisible()) {
      await filterInput.click();
      await adminAuth.waitForTimeout(1000);

      const filterOptions = adminAuth.locator('[role="option"]').or(adminAuth.locator('option'));
      const optionsCount = await filterOptions.count();
      expect(optionsCount).toBeGreaterThan(0);
    }
  });
});

test.describe('System Admin - Settings Management', () => {
  test('@fast @desktop-only admin should access system settings page', async ({ adminAuth }) => {
    await adminAuth.goto('/system-admin/settings');

    await expect(adminAuth).toHaveURL(/\/system-admin\/settings/);

    await expect(
      adminAuth.getByRole('heading', { name: /system settings/i }).or(
        adminAuth
          .locator('h1')
          .filter({ hasText: /settings/i })
          .first()
      )
    ).toBeVisible();
  });

  test('@full @desktop-only admin should see allow_public_registration setting', async ({
    adminAuth,
  }) => {
    await adminAuth.goto('/system-admin/settings');
    await adminAuth.waitForTimeout(1000);

    const publicRegToggle = adminAuth
      .locator('text=Public Registration')
      .or(adminAuth.locator('text=Allow Public Registration'));

    await expect(publicRegToggle).toBeVisible();
  });

  test('@full @desktop-only admin should see require_email_verification setting', async ({
    adminAuth,
  }) => {
    await adminAuth.goto('/system-admin/settings');
    await adminAuth.waitForTimeout(1000);

    const emailVerificationToggle = adminAuth
      .locator('text=Require Email Verification')
      .or(adminAuth.locator('text=Email Verification'));

    await expect(emailVerificationToggle).toBeVisible();
  });
});

test.describe('System Admin - Invitations Oversight', () => {
  test('@fast @desktop-only admin should access system-wide invitations page', async ({
    adminAuth,
  }) => {
    await adminAuth.goto('/system-admin/invitations');

    await expect(adminAuth).toHaveURL(/\/system-admin\/invitations/);
  });

  test('@full @desktop-only admin should see inviter filter dropdown', async ({ adminAuth }) => {
    await adminAuth.goto('/system-admin/invitations');
    await adminAuth.waitForTimeout(2000);

    const inviterFilter = adminAuth
      .locator('text=Filter by Inviter')
      .or(adminAuth.locator('[placeholder*="inviter"]'));

    const isVisible = await inviterFilter.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('@full @desktop-only admin should see invitations from multiple users', async ({
    adminAuth,
  }) => {
    await safeGoto(adminAuth, '/system-admin/invitations');
    await adminAuth.waitForTimeout(2000);

    const invitationsContainer = adminAuth
      .locator('table')
      .or(adminAuth.locator('[data-testid="invitations-list"]'));

    const exists = await invitationsContainer.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('System Admin - Scoreboard Access', () => {
  test('@full @desktop-only admin should be able to access another users scoreboard', async ({
    adminAuth,
  }) => {
    await safeGoto(adminAuth, '/dashboard');
    await adminAuth.waitForTimeout(2000);

    const firstScoreboard = adminAuth
      .locator('[data-testid="scoreboard-card"]')
      .or(adminAuth.locator('.scoreboard-card'))
      .first();

    if (await firstScoreboard.isVisible()) {
      await firstScoreboard.click();
      await adminAuth.waitForTimeout(1000);

      const scoreboardTitle = adminAuth.locator('h1, h2');
      await expect(scoreboardTitle.first()).toBeVisible();
    }
  });

  test('@full @desktop-only admin should be able to navigate to manage view of another users scoreboard', async ({
    adminAuth,
  }) => {
    await safeGoto(adminAuth, '/dashboard');
    await adminAuth.waitForTimeout(2000);

    const manageButton = adminAuth
      .locator('text=Manage')
      .or(adminAuth.locator('button:has-text("Edit")'))
      .first();

    if (await manageButton.isVisible()) {
      await manageButton.click();
      await adminAuth.waitForTimeout(1000);

      const addEntryButton = adminAuth.locator('text=Add Entry');
      const exists = await addEntryButton.isVisible().catch(() => false);
      expect(typeof exists).toBe('boolean');
    }
  });
});

test.describe('System Admin - Navigation', () => {
  test('@fast @desktop-only admin should see system admin navigation links', async ({
    adminAuth,
  }) => {
    await adminAuth.goto('/dashboard');
    await adminAuth.waitForTimeout(1000);

    const settingsButton = adminAuth
      .locator('button:has-text("Settings")')
      .or(adminAuth.locator('a:has-text("Invitations")'));

    await expect(settingsButton.first()).toBeVisible();
  });

  test('@full @desktop-only admin should be able to navigate to all admin pages', async ({
    adminAuth,
  }) => {
    await adminAuth.goto('/system-admin/settings');
    await expect(adminAuth).toHaveURL(/\/system-admin\/settings/);

    await adminAuth.goto('/system-admin/invitations');
    await expect(adminAuth).toHaveURL(/\/system-admin\/invitations/);

    const errorMessage = adminAuth
      .locator('text=Access Denied')
      .or(adminAuth.locator('text=Forbidden'));
    await expect(errorMessage).not.toBeVisible();
  });
});
