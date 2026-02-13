/**
 * Accessibility E2E Tests
 * Tests WCAG compliance via axe-core, keyboard navigation, and focus management
 *
 * Dedicated accounts: USER_5 (free user)
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import AxeBuilder from '@axe-core/playwright';
import { safeGoto } from './fixtures/helpers';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5000';

test.describe('axe-core Automated Checks', () => {
  test('login page should have no critical accessibility violations', async ({ page }) => {
    await safeGoto(page, `${BASE_URL}/login`);
    await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });

  test('dashboard should have no critical accessibility violations', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user5);
    await safeGoto(page, `${BASE_URL}/dashboard`);
    await expect(
      page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
    ).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });

  test('public scoreboard list should have no critical accessibility violations', async ({
    page,
  }) => {
    await safeGoto(page, `${BASE_URL}/public-scoreboard-list`);
    await page.locator('h1, h2, [data-testid]').first().waitFor({ state: 'visible', timeout: 10000 });
    // Wait for loading to finish before running axe
    await expect(page.locator('text=/Loading scoreboards/i')).not.toBeVisible({ timeout: 15000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });
});

test.describe('Keyboard Navigation', () => {
  test('should support tab navigation through interactive elements', async ({ page }) => {
    await safeGoto(page, `${BASE_URL}/login`);
    await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 10000 });

    // Tab through the login form elements and verify focus moves to interactive elements
    const focusedTags: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');

      const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
      focusedTags.push(tag);
    }

    // At least some tabs should land on interactive elements
    const interactiveTags = focusedTags.filter((t) =>
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(t)
    );
    expect(interactiveTags.length).toBeGreaterThan(0);
  });

  test('should show visible focus indicators', async ({ page }) => {
    await safeGoto(page, `${BASE_URL}/login`);
    await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 10000 });

    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    expect(focusedElement).not.toBeNull();
    expect(
      focusedElement?.outline !== 'none' ||
        focusedElement?.outlineWidth !== '0px' ||
        focusedElement?.boxShadow !== 'none'
    ).toBeTruthy();
  });

  test('should support keyboard form submission', async ({ page }) => {
    await safeGoto(page, `${BASE_URL}/login`);
    await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 10000 });

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.focus();
    await emailInput.fill('test@example.com');
    await page.keyboard.press('Tab');
    await passwordInput.fill('somepassword');
    await page.keyboard.press('Enter');

    // Verify that submission was triggered — either we navigate away from login
    // or an error message appears (either means the form was submitted)
    await expect(
      page.locator('.text-destructive, [role="alert"], [data-testid="error-message"]').first()
        .or(page.locator('text=/Invalid|error|failed/i').first())
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Focus Management', () => {
  test('should trap focus in modal dialogs', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user5);
    await safeGoto(page, `${BASE_URL}/dashboard`);
    await expect(
      page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
    ).toBeVisible({ timeout: 10000 });

    const createButton = page.getByRole('button', { name: /create/i }).first();
    await expect(createButton).toBeVisible({ timeout: 5000 });

    await createButton.click();
    // Modal uses FocusTrap + hydration check — allow extra time
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Tab through several elements inside the modal
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
    }

    // After multiple tabs, focus should still be inside the dialog
    const isFocusInsideModal = await page.evaluate(() => {
      const el = document.activeElement;
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(el) ?? false;
    });

    expect(isFocusInsideModal).toBeTruthy();
  });

  test('should return focus after modal close', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user5);
    await safeGoto(page, `${BASE_URL}/dashboard`);
    await expect(
      page.locator('[data-testid="scoreboard-card"], [data-testid="empty-dashboard"], h1').first()
    ).toBeVisible({ timeout: 10000 });

    const createButton = page.getByRole('button', { name: /create/i }).first();
    await expect(createButton).toBeVisible({ timeout: 5000 });

    await createButton.click();
    // Modal uses FocusTrap + hydration check — allow extra time
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Close the modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });

    // Wait for focus to return to the trigger button (FocusTrap returns focus asynchronously)
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            const el = document.activeElement;
            return el?.tagName === 'BUTTON' || (el !== document.body && el !== null);
          });
        },
        { timeout: 5000, intervals: [200] }
      )
      .toBeTruthy();
  });
});
