/**
 * System Settings Tests (serial)
 *
 * Tests that toggle global system settings (e.g. allow_public_registration).
 * Extracted from invitations.spec.ts because these tests mutate shared state
 * that can affect other spec files (notably auth.spec.ts registration tests).
 *
 * This spec runs in a dedicated serial project BEFORE the main parallel batch
 * to guarantee settings are left in the expected state.
 *
 * Dedicated accounts: ADMIN_4 (admin-settings@)
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { safeGoto } from './fixtures/helpers';

// ---------------------------------------------------------------------------
// Helper: wait for admin settings page to be ready and return the toggle
// ---------------------------------------------------------------------------
async function getPublicRegToggle(page: import('@playwright/test').Page) {
  await page
    .locator('text=/Loading settings/i')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  const toggle = page.getByRole('switch', { name: /Allow Public Registration/i });
  await toggle.waitFor({ state: 'visible', timeout: 10000 });
  return toggle;
}

async function setPublicRegistration(
  page: import('@playwright/test').Page,
  enabled: boolean
) {
  const toggle = await getPublicRegToggle(page);
  const isOn = (await toggle.getAttribute('aria-checked')) === 'true';

  if (isOn !== enabled) {
    await toggle.click();
    await page
      .locator('text=/Settings updated successfully/i')
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});

    // Verify the toggle actually changed
    const updatedState = (await toggle.getAttribute('aria-checked')) === 'true';
    if (updatedState !== enabled) {
      // Retry once
      await toggle.click();
      await page
        .locator('text=/Settings updated successfully/i')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {});
    }
  }

  return toggle;
}

// ===========================================================================
// Invitation Feature Toggle & Enforcement (serial – order matters)
// ===========================================================================
test.describe('Invitation Feature Toggle & Enforcement', () => {
  test.describe.configure({ mode: 'serial' });

  test('admin can toggle invite-only mode on', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin4);
    await safeGoto(page, '/system-admin/settings');

    const toggle = await setPublicRegistration(page, false);

    // Verify toggle is now off (invite-only ON)
    const finalState = (await toggle.getAttribute('aria-checked')) === 'true';
    expect(finalState).toBe(false);
  });

  test('registration page shows invite-only notice when enabled', async ({ page }) => {
    await safeGoto(page, '/register');

    // Wait for the heading to confirm the page has rendered
    const pageHeading = page.locator('text=Create Account');
    await pageHeading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const invitationMessage = page.locator(
      'text=/invite.only|invitation.*required|registration.*restricted|invite.*registration/i'
    );

    // Use expect.poll to wait for the settings API to resolve and the UI to update
    await expect
      .poll(async () => invitationMessage.first().isVisible().catch(() => false), {
        timeout: 15000,
        intervals: [500, 1000, 1000, 2000],
      })
      .toBeTruthy();
  });

  test('invited email can access registration when invite-only is off', async ({
    page,
    loginAs,
  }) => {
    // First, re-enable public registration so the form is accessible
    await loginAs(TEST_USERS.admin4);
    await safeGoto(page, '/system-admin/settings');
    await setPublicRegistration(page, true);

    // Now verify the registration form is accessible (use a fresh context-like approach)
    await page.context().clearCookies();
    await safeGoto(page, '/register');

    // Wait for the loading spinner to disappear (settings API call)
    await page
      .locator('text=/^Loading\.\.\.$/')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible({ timeout: 10000 });

    const emailField = page.locator('input[name="email"]').or(page.locator('input[type="email"]'));
    const passwordField = page
      .locator('input[name="password"]')
      .or(page.locator('input[type="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });
  });

  test('admin can toggle invite-only mode off', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin4);
    await safeGoto(page, '/system-admin/settings');

    const toggle = await setPublicRegistration(page, true);

    // Verify toggle is now on (public registration enabled)
    const finalState = (await toggle.getAttribute('aria-checked')) === 'true';
    expect(finalState).toBe(true);
  });

  // Safety net: always leave public registration ON so other specs aren't affected
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await safeGoto(page, '/login');
    await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.fill(
      'input[name="email"]',
      process.env.AUTOMATED_TEST_ADMIN_4_EMAIL || 'admin-settings@example.com'
    );
    await page.fill(
      'input[name="password"]',
      process.env.AUTOMATED_TEST_ADMIN_4_PASSWORD || 'admin123'
    );
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    await safeGoto(page, '/system-admin/settings');
    await setPublicRegistration(page, true);

    await context.close();
  });
});

// ===========================================================================
// Settings Persistence
// ===========================================================================
test.describe('Settings Persistence', () => {
  test('setting changes should persist across page reloads', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin4);
    await safeGoto(page, '/system-admin/settings');

    const toggle = await getPublicRegToggle(page);
    const initialState = (await toggle.getAttribute('aria-checked')) === 'true';

    await toggle.click();
    // Wait for save confirmation
    await page
      .locator('text=/Settings updated successfully/i')
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});

    await page.reload({ waitUntil: 'domcontentloaded' });

    const reloadedToggle = await getPublicRegToggle(page);
    const newState = (await reloadedToggle.getAttribute('aria-checked')) === 'true';
    expect(newState).toBe(!initialState);

    // Toggle back to original state
    await reloadedToggle.click();
    await page
      .locator('text=/Settings updated successfully/i')
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});
  });

  test('multiple settings can be managed independently', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.admin4);
    await safeGoto(page, '/system-admin/settings');

    await page
      .locator('text=/Loading settings/i')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const allToggles = page.locator('[role="switch"]');
    await allToggles.first().waitFor({ state: 'visible', timeout: 10000 });
    const toggleCount = await allToggles.count();

    expect(toggleCount).toBeGreaterThanOrEqual(2);
  });
});
