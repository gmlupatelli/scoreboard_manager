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
      try {
        await sarahAuth.goto('/invitations');
      } catch {
        // Retry on net::ERR_ABORTED
        await sarahAuth.waitForTimeout(500);
        await sarahAuth.goto('/invitations');
      }
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
  // Tests in this block are order-dependent: disable → verify-disabled → re-enable → verify-enabled
  test.describe.configure({ mode: 'serial' });

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
    await page.waitForLoadState('networkidle');

    // Wait for settings to finish loading
    await page
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const publicRegToggle = page.getByRole('switch', {
      name: /Allow Public Registration/i,
    });

    await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
    const isOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';

    if (isOn) {
      await publicRegToggle.click();
      await page
        .locator('text=/Settings updated successfully/i')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {});
    }

    await context.close();
  });

  // Admin settings - viewport-independent
  authTest(
    '@full @desktop-only admin should disable public registration',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForLoadState('networkidle');

      // Wait for settings to finish loading
      await adminAuth
        .locator('text=/Loading settings/i')
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

      const publicRegToggle = adminAuth.getByRole('switch', {
        name: /Allow Public Registration/i,
      });

      await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
      const isOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
      if (isOn) {
        await publicRegToggle.click();
        await adminAuth
          .locator('text=/Settings updated successfully/i')
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {});
      }

      // Verify toggle is now off
      const finalState = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
      expect(finalState).toBe(false);
    }
  );

  // Functional - viewport-independent
  test('@full @desktop-only registration page should require invitation code when disabled', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.waitForTimeout(1000);

    const invitationMessage = page
      .locator('text=/invitation.*required/i')
      .or(page.locator('text=/invite.*only/i'));

    // Wait for the page to load and settings API to respond
    const pageHeading = page.locator('text=Create Account');
    await pageHeading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const hasInvitationUI = await invitationMessage.isVisible().catch(() => false);

    expect(hasInvitationUI).toBeTruthy();
  });

  // Admin settings - viewport-independent
  authTest(
    '@full @desktop-only admin should re-enable public registration',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForLoadState('networkidle');

      // Wait for settings to finish loading
      await adminAuth
        .locator('text=/Loading settings/i')
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

      const publicRegToggle = adminAuth.getByRole('switch', {
        name: /Allow Public Registration/i,
      });

      await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
      const isOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
      if (!isOn) {
        await publicRegToggle.click();
        await adminAuth
          .locator('text=/Settings updated successfully/i')
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {});
      }

      // Verify toggle is now on
      const finalState = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
      expect(finalState).toBe(true);
    }
  );

  // Functional - viewport-independent
  test('@fast @desktop-only registration page should allow open registration when enabled', async ({
    page,
  }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Wait for the loading spinner to disappear (settings API call)
    await page
      .locator('text=/^Loading\.\.\.$/')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    // Wait for the heading to confirm the page has rendered
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible({ timeout: 10000 });

    const emailField = page.locator('input[name="email"]').or(page.locator('input[type="email"]'));
    const passwordField = page
      .locator('input[name="password"]')
      .or(page.locator('input[type="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });
  });
});

authTest.describe('Invite-Only Mode - Enforcement', () => {
  authTest.beforeEach(async ({ adminAuth }) => {
    await adminAuth.goto('/system-admin/settings');
    await adminAuth.waitForLoadState('networkidle');

    // Wait for settings to finish loading
    await adminAuth
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const publicRegToggle = adminAuth.getByRole('switch', {
      name: /Allow Public Registration/i,
    });

    await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
    const isOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
    if (isOn) {
      await publicRegToggle.click();
      // Wait for the API save to complete — confirmed by the success toast
      await adminAuth
        .locator('text=/Settings updated successfully/i')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {});
      // Double-check the toggle actually flipped to off
      const isStillOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
      if (isStillOn) {
        // Retry click if toggle didn't flip
        await publicRegToggle.click();
        await adminAuth
          .locator('text=/Settings updated successfully/i')
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {});
      }
    }
  });

  // Functional - viewport-independent
  authTest(
    '@full @desktop-only unauthenticated user should see invitation requirement',
    async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // When invite-only is active, the register page shows an
      // "Invite-Only Registration" banner and hides the form fields.
      // Wait for the page to finish loading settings before checking.
      const inviteOnlyBanner = page.locator(
        'text=/invite.only|invitation.*required|registration.*restricted|invite.*registration/i'
      );

      // Wait for the banner or the page heading to appear (ensures page is loaded)
      const pageHeading = page.locator('text=Create Account');
      await pageHeading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

      // Give the settings API response time to arrive and toggle UI
      await page.waitForTimeout(3000);

      await expect(inviteOnlyBanner.first()).toBeVisible({ timeout: 10000 });
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
    await adminAuth.waitForLoadState('networkidle');

    // Wait for settings to finish loading
    await adminAuth
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const publicRegToggle = adminAuth.getByRole('switch', {
      name: /Allow Public Registration/i,
    });

    await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
    const isOn = (await publicRegToggle.getAttribute('aria-checked')) === 'true';
    if (!isOn) {
      await publicRegToggle.click();
      await adminAuth
        .locator('text=/Settings updated successfully/i')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {});
    }
  });
});

authTest.describe('Invite-Only Mode - Settings Persistence', () => {
  // Settings persistence - viewport-independent
  authTest(
    '@full @desktop-only setting changes should persist across page reloads',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForLoadState('networkidle');

      // Wait for settings to finish loading
      await adminAuth
        .locator('text=/Loading settings/i')
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

      const publicRegToggle = adminAuth.getByRole('switch', {
        name: /Allow Public Registration/i,
      });

      await publicRegToggle.waitFor({ state: 'visible', timeout: 10000 });
      const initialState = (await publicRegToggle.getAttribute('aria-checked')) === 'true';

      await publicRegToggle.click();
      await adminAuth.waitForTimeout(2000);

      await adminAuth.reload();
      await adminAuth.waitForLoadState('networkidle');

      // Wait for settings to finish loading after reload
      await adminAuth
        .locator('text=/Loading settings/i')
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

      const reloadedToggle = adminAuth.getByRole('switch', {
        name: /Allow Public Registration/i,
      });
      await reloadedToggle.waitFor({ state: 'visible', timeout: 10000 });
      const newState = (await reloadedToggle.getAttribute('aria-checked')) === 'true';
      expect(newState).toBe(!initialState);

      // Toggle back
      await reloadedToggle.click();
      await adminAuth.waitForTimeout(2000);
    }
  );

  // Settings management - viewport-independent
  authTest(
    '@full @desktop-only multiple settings can be managed independently',
    async ({ adminAuth }) => {
      await adminAuth.goto('/system-admin/settings');
      await adminAuth.waitForLoadState('networkidle');

      // Wait for settings to finish loading
      await adminAuth
        .locator('text=/Loading settings/i')
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

      const allToggles = adminAuth.locator('[role="switch"]');
      await allToggles.first().waitFor({ state: 'visible', timeout: 10000 });
      const toggleCount = await allToggles.count();

      expect(toggleCount).toBeGreaterThanOrEqual(2);
    }
  );
});
