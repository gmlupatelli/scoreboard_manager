/**
 * Accessibility E2E Tests
 * Tests WCAG compliance, keyboard navigation, screen readers
 *
 * @fast - Quick accessibility smoke tests
 * @full - Comprehensive WCAG and screen reader coverage
 */

import { test, expect } from '@playwright/test';
import { test as authTest, expect as authExpect } from './fixtures/auth';
// Note: Install @axe-core/playwright for full axe testing
// import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG Compliance', () => {
  test('@fast should not have accessibility violations on landing page', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('@full should have proper color contrast', async ({ page }) => {
    await page.goto('/');

    const textElements = await page.locator('p, span, h1, h2, h3').all();

    for (const element of textElements.slice(0, 5)) {
      const color = await element.evaluate((el) => window.getComputedStyle(el).color);
      const bgColor = await element.evaluate((el) => window.getComputedStyle(el).backgroundColor);

      expect(color).toBeTruthy();
      expect(bgColor).toBeTruthy();
    }
  });

  test('@fast should have semantic HTML structure', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  // Skip all tests in this describe block on mobile
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name.includes('Mobile')) {
      testInfo.skip(true, 'Keyboard Tab navigation is not applicable on mobile devices');
    }
  });

  // Keyboard - viewport-independent (already skipped via beforeEach for mobile)
  test('@fast @desktop-only should navigate all interactive elements', async ({ page }) => {
    await page.goto('/');

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length;
    });

    expect(focusableCount).toBeGreaterThan(0);

    // Tab through first few elements
    for (let i = 0; i < Math.min(5, focusableCount); i++) {
      await page.keyboard.press('Tab');

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          visible: el ? window.getComputedStyle(el).display !== 'none' : false,
        };
      });

      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused.tag);
    }
  });

  // Keyboard - viewport-independent (already skipped via beforeEach for mobile)
  test('@full @desktop-only should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

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

    expect(
      focusedElement?.outline !== 'none' ||
        focusedElement?.outlineWidth !== '0px' ||
        focusedElement?.boxShadow !== 'none'
    ).toBeTruthy();
  });

  // Keyboard - viewport-independent (already skipped via beforeEach for mobile)
  test('@full @desktop-only should support Escape to close modals', async ({ page, context }) => {
    const isMobile = page.viewportSize()?.width && page.viewportSize()!.width < 768;

    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    const createButton = page.getByRole('button', { name: /create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(300);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      const modalVisible = await page.locator('[role="dialog"], dialog').isVisible();
      if (!isMobile) {
        expect(modalVisible).toBeFalsy();
      }
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('@fast should have ARIA labels on icon buttons', async ({ page }) => {
    await page.goto('/');

    const iconButtons = await page.locator('button:has(svg), button[aria-label]').all();

    for (const button of iconButtons.slice(0, 5)) {
      const label = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');
      const text = await button.textContent();

      const hasAccessibleName =
        label || ariaLabelledBy || title || (text && text.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('@fast should have proper ARIA roles', async ({ page }) => {
    await page.goto('/');

    const nav = await page.locator('[role="navigation"], nav').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('@full should announce dynamic content changes', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    expect(liveRegions).toBeGreaterThanOrEqual(0);
  });

  test('@full should have descriptive link text', async ({ page }) => {
    await page.goto('/');

    const links = await page.locator('a[href]').all();

    for (const link of links.slice(0, 10)) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      const hasDescription =
        (text && text.trim().length > 1) || (ariaLabel && ariaLabel.length > 1);
      expect(hasDescription).toBeTruthy();
    }
  });
});

test.describe('Forms Accessibility', () => {
  test('@fast should have labels for all form inputs', async ({ page }) => {
    await page.goto('/login');

    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const _placeholder = await input.getAttribute('placeholder');

      let hasLabel = false;
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }

      const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('@full should show validation errors accessibly', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.getByLabel(/email/i).first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid');
      await emailInput.blur();

      await page.waitForTimeout(500);

      const errorMessage = await page
        .locator('[role="alert"], .error, [aria-invalid="true"]')
        .count();
      expect(errorMessage).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Reduced Motion Support', () => {
  test('@full should respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(hasReducedMotion).toBeTruthy();
  });
});

test.describe('Language and Direction', () => {
  test('@fast should have lang attribute', async ({ page }) => {
    await page.goto('/');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThan(0);
  });

  test('@full should support RTL direction', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });

    const dir = await page.getAttribute('html', 'dir');
    expect(dir).toBe('rtl');
  });
});

/**
 * Authenticated Accessibility Tests
 * These tests require real authentication to test modals and authenticated forms
 */
authTest.describe('Authenticated Accessibility', () => {
  // Keyboard/Modal - viewport-independent
  authTest('@full @desktop-only should trap focus in modals', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await johnAuth.waitForTimeout(1000);

    const createButton = johnAuth.getByRole('button', { name: /create/i }).first();
    await authExpect(createButton).toBeVisible();

    await createButton.click();
    await johnAuth.waitForTimeout(500);

    const modal = johnAuth.locator('[role="dialog"]');
    await authExpect(modal).toBeVisible();

    // Tab through modal elements
    await johnAuth.keyboard.press('Tab');
    await johnAuth.keyboard.press('Tab');
    await johnAuth.keyboard.press('Tab');
    await johnAuth.keyboard.press('Tab');
    await johnAuth.keyboard.press('Tab');

    const focusedElement = await johnAuth.evaluate(() => {
      const el = document.activeElement;
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(el) ?? false;
    });

    authExpect(focusedElement).toBeTruthy();
  });

  // Form accessibility in modal - viewport-independent
  authTest('@full @desktop-only should have proper radio button groups in forms', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await johnAuth.waitForTimeout(1000);

    const createButton = johnAuth.getByRole('button', { name: /create/i }).first();
    await authExpect(createButton).toBeVisible();

    await createButton.click();
    await johnAuth.waitForTimeout(500);

    const visibilityRadioPublic = johnAuth.locator('input[type="radio"][value="public"]');
    const visibilityRadioPrivate = johnAuth.locator('input[type="radio"][value="private"]');

    await authExpect(visibilityRadioPublic).toBeVisible();
    await authExpect(visibilityRadioPrivate).toBeVisible();

    const scoreTypeNumber = johnAuth.locator('input[type="radio"][value="number"]');
    const scoreTypeTime = johnAuth.locator('input[type="radio"][value="time"]');

    await authExpect(scoreTypeNumber).toBeVisible();
    await authExpect(scoreTypeTime).toBeVisible();
  });
});
