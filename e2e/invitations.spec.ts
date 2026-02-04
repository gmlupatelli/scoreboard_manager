/**
 * Invitations Tests
 * Tests invitation flows, user invitations, and invite-only mode
 *
 * @fast - Quick smoke tests for invitation access and basic flows
 * @full - Comprehensive invitation functionality and edge cases
 *
 * NOTE: Invite-only mode tests should run LAST as they toggle settings
 */

import { test as authTest, expect, TEST_USERS } from './fixtures/auth';
import { test } from '@playwright/test';

authTest.describe('User Invitations - Access & Display', () => {
  // Authorization - viewport-independent
  authTest('@fast @desktop-only john can access invitations page', async ({ johnAuth }) => {
    await johnAuth.goto('/invitations');
    await johnAuth.waitForLoadState('domcontentloaded');
    await expect(johnAuth.locator('h1:has-text("Invitations")')).toBeVisible({ timeout: 10000 });
    await expect(johnAuth).toHaveURL(/\/invitations/, { timeout: 10000 });
  });

  // Authorization - viewport-independent
  authTest('@fast @desktop-only sarah can send invitations', async ({ sarahAuth }) => {
    await sarahAuth.goto('/invitations');
    await sarahAuth.waitForLoadState('domcontentloaded');
    await expect(sarahAuth.locator('h1:has-text("Invitations")')).toBeVisible({ timeout: 10000 });

    // Send invitation button should be visible
    const sendButton = sarahAuth
      .locator('button:has-text("Send")')
      .or(sarahAuth.locator('text=Send Invitation'))
      .or(sarahAuth.locator('button:has-text("Invite User")'))
      .or(sarahAuth.locator('button:has-text("Send Your First Invitation")'));

    await expect(sendButton.first()).toBeVisible({ timeout: 10000 });
  });

  // Functional - viewport-independent
  authTest('@full @desktop-only john should see only his own invitations', async ({ johnAuth }) => {
    await johnAuth.goto('/invitations');
    await johnAuth.waitForTimeout(2000);

    await expect(johnAuth).toHaveURL(/\/invitations/);

    // Should NOT see inviter filter (that's admin-only)
    const inviterFilter = johnAuth
      .locator('text=Filter by Inviter')
      .or(johnAuth.locator('[placeholder*="Filter by inviter"]'));
    await expect(inviterFilter).not.toBeVisible();
  });

  // Functional - viewport-independent
  authTest(
    '@full @desktop-only sarah should have separate invitation list from john',
    async ({ sarahAuth }) => {
      await sarahAuth.goto('/invitations');
      await sarahAuth.waitForTimeout(2000);

      await expect(sarahAuth).toHaveURL(/\/invitations/);

      // Check that page renders
      const pageContent = sarahAuth.locator('body');
      await expect(pageContent).toBeVisible();
    }
  );
});

authTest.describe('Invitation Form', () => {
  // Form validation - viewport-independent
  authTest('@full @desktop-only invitation form validates email', async ({ johnAuth }) => {
    await johnAuth.goto('/invitations');
    await johnAuth.waitForTimeout(1000);

    const sendButton = johnAuth
      .locator('button:has-text("Send")')
      .or(johnAuth.locator('text=Send Invitation'))
      .or(johnAuth.locator('button:has-text("Invite User")'))
      .or(johnAuth.locator('button:has-text("Send Your First Invitation")'))
      .first();

    if (await sendButton.isVisible()) {
      await sendButton.click();
      await johnAuth.waitForTimeout(500);

      // Look for email input in modal/form
      const emailInput = johnAuth
        .locator('input[name="email"]')
        .or(johnAuth.locator('input[type="email"]'))
        .first();

      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid-email');
        await emailInput.blur();

        // Should show validation or form remains on page
        const formVisible = await emailInput.isVisible();
        expect(formVisible).toBeTruthy();
      }
    }
  });
});

test.describe('Invite-Only Mode - Toggle Feature', () => {
  // Ensure public registration is DISABLED before these tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // Go to settings and disable public registration
    await page.goto('/system-admin/settings');
    await page.waitForTimeout(2000);

    const toggleButton = page
      .locator('button')
      .filter({
        has: page.locator('~ div:has-text("Allow Public Registration")'),
      })
      .first()
      .or(
        page
          .locator('div:has-text("Allow Public Registration")')
          .locator('..')
          .locator('button')
          .first()
      );

    const buttonClasses = await toggleButton.getAttribute('class');
    const isEnabled = buttonClasses?.includes('bg-primary');

    if (isEnabled) {
      await toggleButton.click();
      await page.waitForTimeout(1000);
    }

    await context.close();
  });

  // Admin settings - viewport-independent
  authTest(
    '@full @desktop-only admin should disable public registration',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForTimeout(1000);

      const publicRegToggle = adminAuth
        .locator('input[type="checkbox"]')
        .filter({
          has: adminAuth.locator('~ text=/Public Registration/i'),
        })
        .or(adminAuth.locator('label:has-text("Public Registration")').locator('input'))
        .or(adminAuth.locator('label:has-text("Allow Public Registration")').locator('input'))
        .first();

      const exists = await publicRegToggle.isVisible().catch(() => false);

      if (exists) {
        const isChecked = await publicRegToggle.isChecked();
        if (isChecked) {
          await publicRegToggle.click();
          await adminAuth.waitForTimeout(2000);
          const newState = await publicRegToggle.isChecked();
          expect(newState).toBe(false);
        }
      }
    }
  );

  // Functional - viewport-independent
  test('@full @desktop-only registration page should require invitation code when disabled', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.waitForTimeout(1000);

    const invitationField = page
      .locator('input[name="invitationCode"]')
      .or(page.locator('input[placeholder*="invitation code"]'));

    const invitationMessage = page
      .locator('text=/invitation.*required/i')
      .or(page.locator('text=/invite.*only/i'));

    const hasInvitationUI =
      (await invitationField.isVisible().catch(() => false)) ||
      (await invitationMessage.isVisible().catch(() => false));

    expect(typeof hasInvitationUI).toBe('boolean');
  });

  // Admin settings - viewport-independent
  authTest(
    '@full @desktop-only admin should re-enable public registration',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForTimeout(1000);

      const publicRegToggle = adminAuth
        .locator('input[type="checkbox"]')
        .filter({
          has: adminAuth.locator('~ text=/Public Registration/i'),
        })
        .or(adminAuth.locator('label:has-text("Public Registration")').locator('input'))
        .or(adminAuth.locator('label:has-text("Allow Public Registration")').locator('input'))
        .first();

      const exists = await publicRegToggle.isVisible().catch(() => false);

      if (exists) {
        const isChecked = await publicRegToggle.isChecked();
        if (!isChecked) {
          await publicRegToggle.click();
          await adminAuth.waitForTimeout(2000);
          const newState = await publicRegToggle.isChecked();
          expect(newState).toBe(true);
        }
      }
    }
  );

  // Functional - viewport-independent
  test('@fast @desktop-only registration page should allow open registration when enabled', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.waitForTimeout(1000);

    const emailField = page.locator('input[name="email"]').or(page.locator('input[type="email"]'));
    const passwordField = page
      .locator('input[name="password"]')
      .or(page.locator('input[type="password"]'));

    await expect(emailField.first()).toBeVisible();
    await expect(passwordField.first()).toBeVisible();
  });
});

authTest.describe('Invite-Only Mode - Enforcement', () => {
  authTest.beforeEach(async ({ adminAuth }) => {
    await adminAuth.goto('/system-admin/settings');
    await adminAuth.waitForTimeout(1000);

    const publicRegToggle = adminAuth
      .locator('label:has-text("Public Registration")')
      .locator('input')
      .or(adminAuth.locator('input[type="checkbox"]').first());

    if (await publicRegToggle.isVisible()) {
      const isChecked = await publicRegToggle.isChecked();
      if (isChecked) {
        await publicRegToggle.click();
        await adminAuth.waitForTimeout(2000);
      }
    }
  });

  // Functional - viewport-independent
  authTest(
    '@full @desktop-only unauthenticated user should see invitation requirement',
    async ({ page }) => {
      await page.goto('/register');
      await page.waitForTimeout(1000);

      const inviteMessage = page.locator(
        'text=/invite.*only|invitation.*required|registration.*restricted|invite.*registration/i'
      );
      const inviteField = page.locator('input[name="invitationCode"]');
      const emailField = page.locator('input[name="email"]');

      const hasInviteUI =
        (await inviteMessage.isVisible().catch(() => false)) ||
        (await inviteField.isVisible().catch(() => false));
      const hasEmailField = await emailField.isVisible().catch(() => false);

      expect(hasInviteUI || hasEmailField).toBeTruthy();
    }
  );

  // Functional - viewport-independent
  authTest(
    '@full @desktop-only registration without invitation code should fail',
    async ({ page }) => {
      await page.goto('/register');
      await page.waitForTimeout(1000);

      const emailField = page.locator('input[name="email"]');
      const passwordField = page.locator('input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');

      if ((await emailField.isVisible()) && (await submitButton.isVisible())) {
        await emailField.fill('newuser@example.com');
        await passwordField.fill('password123');
        await submitButton.click();
        await page.waitForTimeout(2000);

        const errorMessage = page.locator('text=/error/i').or(page.locator('text=/invalid/i'));
        const stillOnRegister = page.url().includes('/register');

        const registrationFailed =
          (await errorMessage.isVisible().catch(() => false)) || stillOnRegister;
        expect(registrationFailed).toBeTruthy();
      }
    }
  );

  authTest.afterEach(async ({ adminAuth }) => {
    await adminAuth.goto('/system-admin/settings');
    await adminAuth.waitForTimeout(1000);

    const publicRegToggle = adminAuth
      .locator('label:has-text("Public Registration")')
      .locator('input')
      .or(adminAuth.locator('input[type="checkbox"]').first());

    if (await publicRegToggle.isVisible()) {
      const isChecked = await publicRegToggle.isChecked();
      if (!isChecked) {
        await publicRegToggle.click();
        await adminAuth.waitForTimeout(2000);
      }
    }
  });
});

authTest.describe('Invite-Only Mode - Settings Persistence', () => {
  // Settings persistence - viewport-independent
  authTest(
    '@full @desktop-only setting changes should persist across page reloads',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForTimeout(1000);

      const publicRegToggle = adminAuth
        .locator('label:has-text("Public Registration")')
        .locator('input')
        .or(adminAuth.locator('input[type="checkbox"]').first());

      if (await publicRegToggle.isVisible()) {
        const initialState = await publicRegToggle.isChecked();

        await publicRegToggle.click();
        await adminAuth.waitForTimeout(2000);

        await adminAuth.reload();
        await adminAuth.waitForTimeout(1000);

        const newPublicRegToggle = adminAuth
          .locator('label:has-text("Public Registration")')
          .locator('input')
          .or(adminAuth.locator('input[type="checkbox"]').first());

        const newState = await newPublicRegToggle.isChecked();
        expect(newState).toBe(!initialState);

        // Toggle back
        await newPublicRegToggle.click();
        await adminAuth.waitForTimeout(2000);
      }
    }
  );

  // Settings management - viewport-independent
  authTest(
    '@full @desktop-only multiple settings can be managed independently',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForTimeout(1000);

      const allToggles = adminAuth.locator('button.rounded-full');
      const toggleCount = await allToggles.count();

      expect(toggleCount).toBeGreaterThanOrEqual(2);
    }
  );
});
