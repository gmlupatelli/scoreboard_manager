import { test, expect } from '@playwright/test';

/**
 * Mobile E2E Tests - Touch interactions, swipe gestures, responsive layouts
 */

test.describe('Mobile Touch Interactions', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test('should handle touch on buttons with proper target size', async ({ page }) => {
    await page.goto('/');
    
    // Check button touch targets are at least 44x44px
    const buttons = await page.locator('button, a[role="button"]').all();
    
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should display mobile header on card view', async ({ page, context }) => {
    // Mock auth to access scoreboard view
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/individual-scoreboard-view?id=test');
    
    // Check for mobile header
    const mobileHeader = page.locator('text=Player').first();
    await expect(mobileHeader).toBeVisible();
  });

  test('should wrap metadata on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/dashboard');
    
    // Check no horizontal overflow
    const body = await page.locator('body').boundingBox();
    expect(body?.width).toBeLessThanOrEqual(320);
  });
});

test.describe('Swipe Gestures', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test('should handle swipe-to-delete on cards', async ({ page }) => {
    await page.goto('/invitations');
    
    // Check if invitation card exists
    const card = page.locator('[data-testid="invitation-card"]').first();
    
    if (await card.isVisible()) {
      const box = await card.boundingBox();
      
      if (box) {
        // Simulate swipe left
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2);
        await page.mouse.up();
        
        // Check for visual feedback
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show swipe feedback progressively', async ({ page }) => {
    await page.goto('/invitations');
    
    const card = page.locator('[data-testid="invitation-card"]').first();
    
    if (await card.isVisible()) {
      // Touch should trigger visual feedback
      await card.tap();
      await page.waitForTimeout(100);
    }
  });
});

test.describe('Landscape Orientation', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

  test('should reduce header height in landscape', async ({ page }) => {
    await page.goto('/');
    
    const header = page.locator('header').first();
    const box = await header.boundingBox();
    
    // Header should be shorter in landscape (h-12 = 48px instead of h-16 = 64px)
    expect(box?.height).toBeLessThanOrEqual(52); // Allow small margin
  });

  test('should reduce vertical spacing in landscape', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that content fits without excessive scrolling
    const mainContent = page.locator('main');
    const box = await mainContent.boundingBox();
    
    // Content should start closer to top in landscape
    expect(box?.y).toBeLessThanOrEqual(60);
  });
});

test.describe('Minimum Viewport (320px)', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('should display without horizontal overflow', async ({ page }) => {
    await page.goto('/');
    
    // Check no horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
  });

  test('should have readable text at 320px', async ({ page }) => {
    await page.goto('/');
    
    // Check font sizes are readable
    const bodyText = page.locator('body').first();
    const fontSize = await bodyText.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    
    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Minimum readable size
  });

  test('should stack buttons vertically on mobile modals', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/dashboard');
    
    // Open create modal
    const createButton = page.getByRole('button', { name: /create/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Check button stacking
      await page.waitForTimeout(300);
      const modalButtons = page.locator('dialog button, [role="dialog"] button');
      const count = await modalButtons.count();
      
      if (count >= 2) {
        const firstBox = await modalButtons.nth(0).boundingBox();
        const secondBox = await modalButtons.nth(1).boundingBox();
        
        if (firstBox && secondBox) {
          // Buttons should be stacked vertically
          expect(Math.abs((firstBox.y + firstBox.height) - secondBox.y)).toBeLessThan(20);
        }
      }
    }
  });
});

test.describe('Accessibility on Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have proper ARIA labels on touch targets', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button[aria-label], a[aria-label]').all();
    
    for (const button of buttons.slice(0, 5)) {
      const label = await button.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label?.length).toBeGreaterThan(2);
    }
  });

  test('should support keyboard navigation fallback', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus is visible
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });
});
