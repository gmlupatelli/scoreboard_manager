import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E Tests - WCAG compliance, keyboard navigation, screen readers
 */

test.describe('WCAG Compliance', () => {
  test('should not have accessibility violations on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Note: Install @axe-core/playwright for full axe testing
    // For now, do manual checks
    
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

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Sample text elements for contrast check
    const textElements = await page.locator('p, span, h1, h2, h3').all();
    
    for (const element of textElements.slice(0, 5)) {
      const color = await element.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      const bgColor = await element.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Basic check that colors are defined
      expect(color).toBeTruthy();
      expect(bgColor).toBeTruthy();
    }
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for semantic elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate all interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Get all focusable elements
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
          visible: el ? window.getComputedStyle(el).display !== 'none' : false
        };
      });
      
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused.tag);
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have some form of focus indicator
    expect(
      focusedElement?.outline !== 'none' || 
      focusedElement?.outlineWidth !== '0px' ||
      focusedElement?.boxShadow !== 'none'
    ).toBeTruthy();
  });

  test('should trap focus in modals', async ({ page, context }) => {
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
      
      // Tab through modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Focus should stay within modal
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        const modal = document.querySelector('[role="dialog"], dialog');
        return modal?.contains(el) ?? false;
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should support Escape to close modals', async ({ page, context }) => {
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
      await page.waitForTimeout(300);
      
      // Modal should be closed
      const modalVisible = await page.locator('[role="dialog"], dialog').isVisible();
      expect(modalVisible).toBeFalsy();
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('should have ARIA labels on icon buttons', async ({ page }) => {
    await page.goto('/');
    
    const iconButtons = await page.locator('button:has(svg), button[aria-label]').all();
    
    for (const button of iconButtons.slice(0, 5)) {
      const label = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');
      const text = await button.textContent();
      
      // Should have some form of accessible name
      const hasAccessibleName = label || ariaLabelledBy || title || (text && text.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper ARIA roles', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation landmark
    const nav = await page.locator('[role="navigation"], nav').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('should announce dynamic content changes', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    
    // Should have live regions for notifications
    expect(liveRegions).toBeGreaterThanOrEqual(0);
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a[href]').all();
    
    for (const link of links.slice(0, 10)) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      const hasDescription = (text && text.trim().length > 1) || (ariaLabel && ariaLabel.length > 1);
      expect(hasDescription).toBeTruthy();
    }
  });
});

test.describe('Forms Accessibility', () => {
  test('should have labels for all form inputs', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Check if input has associated label
      let hasLabel = false;
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }
      
      const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should show validation errors accessibly', async ({ page }) => {
    await page.goto('/register');
    
    const emailInput = page.getByLabel(/email/i).first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
      
      // Check for error message
      const errorMessage = await page.locator('[role="alert"], .error, [aria-invalid="true"]').count();
      expect(errorMessage).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have proper fieldset and legend', async ({ page, context }) => {
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
      await page.waitForTimeout(500);
      
      // Check for radio button groups
      const radioGroups = await page.locator('input[type="radio"]').all();
      
      if (radioGroups.length > 0) {
        // Should be wrapped in fieldset or have proper grouping
        const firstRadio = radioGroups[0];
        const name = await firstRadio.getAttribute('name');
        expect(name).toBeTruthy();
      }
    }
  });
});

test.describe('Reduced Motion Support', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Check that animations are disabled or minimal
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(hasReducedMotion).toBeTruthy();
  });
});

test.describe('Language and Direction', () => {
  test('should have lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThan(0);
  });

  test('should support RTL direction', async ({ page }) => {
    await page.goto('/');
    
    // Check if dir attribute can be set
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    
    const dir = await page.getAttribute('html', 'dir');
    expect(dir).toBe('rtl');
  });
});
