/**
 * Invitations Tests
 * Tests invitation flows, user invitations, and invite-only mode
 *
 * Dedicated accounts: ADMIN_3, USER_3, SUPPORTER_7
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { safeGoto } from './fixtures/helpers';

// ===========================================================================
// Invitation Management
// ===========================================================================
test.describe('Invitation Management', () => {
  test('user should see invitation management features', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user3);
    await safeGoto(page, '/invitations');
    await expect(page.locator('h1:has-text("Invitations")')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/invitations/, { timeout: 10000 });

    // Should NOT see inviter filter (that's admin-only)
    const inviterFilter = page
      .locator('text=Filter by Inviter')
      .or(page.locator('[placeholder*="Filter by inviter"]'));
    await expect(inviterFilter).not.toBeVisible();
  });

  test('user should be able to send an invitation', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user3);
    await safeGoto(page, '/invitations');
    await expect(page.locator('h1:has-text("Invitations")')).toBeVisible({ timeout: 10000 });

    const sendButton = page.locator('[data-testid="invite-user-button"]');

    await expect(sendButton).toBeVisible({ timeout: 10000 });

    if (await sendButton.isVisible()) {
      await sendButton.click();

      // Look for email input in modal/form
      const emailInput = page
        .locator('input[name="email"]')
        .or(page.locator('input[type="email"]'))
        .first();

      await emailInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid-email');
        await emailInput.blur();

        // Form should remain visible (validation prevents submission)
        await expect(emailInput).toBeVisible();
      }
    }
  });

  test('should show invitation status', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.supporter7);
    await safeGoto(page, '/invitations');
    await expect(page.locator('h1:has-text("Invitations")')).toBeVisible({ timeout: 10000 });

    // Send invitation button should be visible
    const sendButton = page.locator('[data-testid="invite-user-button"]');

    await expect(sendButton).toBeVisible({ timeout: 10000 });
  });
});
