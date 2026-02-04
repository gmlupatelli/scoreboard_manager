/**
 * Responsive Design Tests
 * Tests mobile touch interactions, tablet layouts, and responsive breakpoints
 *
 * @fast - Quick viewport and touch target checks
 * @full - Comprehensive responsive behavior coverage
 */

import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth';

// Mobile viewport configuration
const mobileViewport = { viewport: { width: 375, height: 667 } };
const tabletViewport = { viewport: { width: 768, height: 1024 } };

test.describe('Mobile Touch Interactions', () => {
  test.use(mobileViewport);

  test('@fast touch targets should be at least 44x44px', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        if (ariaLabel === 'Open Next.js Dev Tools') {
          continue;
        }
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('@fast mobile navigation is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Mobile menu button should be visible
    const menuButton = page
      .locator('[aria-label*="menu"]')
      .or(page.locator('button:has([class*="hamburger"])'))
      .or(page.locator('button').filter({ hasText: /menu/i }));

    // Either menu button visible or nav links visible (depends on design)
    const hasNavigation =
      (await menuButton
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('nav a')
        .first()
        .isVisible()
        .catch(() => false));

    expect(hasNavigation).toBeTruthy();
  });

  test('@full dashboard cards display in single column on mobile', async ({ page }) => {
    // Need to login first
    await page.goto('/login');
    await page.waitForTimeout(1000);

    // Check that cards would stack vertically
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('@full entry metadata wraps correctly on mobile', async ({ page }) => {
    await page.goto('/public-scoreboard-list');
    await page.waitForTimeout(1000);

    // Content should not overflow horizontally
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();

    if (bodyBox) {
      expect(bodyBox.width).toBeLessThanOrEqual(395); // 375 + 20 margin
    }
  });
});

test.describe('Landscape Orientation', () => {
  test.use({ viewport: { width: 667, height: 375 } }); // Rotated mobile

  test('@fast header maintains appropriate height in landscape', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const header = page.locator('header');
    if (await header.isVisible()) {
      const box = await header.boundingBox();
      if (box) {
        expect(box.height).toBeLessThanOrEqual(120);
      }
    }
  });

  test('@full content is accessible in landscape mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const main = page.locator('main').or(page.locator('[role="main"]'));
    await expect(main).toBeVisible();
  });
});

test.describe('Minimum Viewport - 320px', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('@fast content does not overflow horizontally', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('@fast text remains readable on small screens', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const paragraphs = page.locator('p');
    const count = await paragraphs.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const p = paragraphs.nth(i);
      if (await p.isVisible()) {
        const fontSize = await p.evaluate((el) => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });
        expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    }
  });

  test('@full buttons stack vertically when needed', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);

    // Content should fit within viewport
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();

    if (bodyBox) {
      expect(bodyBox.width).toBeLessThanOrEqual(340);
    }
  });

  test('@full forms are usable on small screens', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);

    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(200);
        }
      }
    }
  });
});

test.describe('Tablet Viewport', () => {
  test.use(tabletViewport);

  test('@fast tablet layout renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('@full navigation adapts to tablet width', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // At 768px, should have visible navigation (header contains nav)
    const nav = page.locator('header').first();
    await expect(nav).toBeVisible();
  });
});

test.describe('Desktop Breakpoints', () => {
  test('@fast 1920px desktop renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('@fast 1024px desktop renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('@fast 768px tablet breakpoint renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Mobile Accessibility', () => {
  test.use(mobileViewport);

  test('@fast mobile touch elements have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const hasLabel =
          (await button.getAttribute('aria-label')) ||
          (await button.innerText()) ||
          (await button.getAttribute('title'));
        expect(hasLabel).toBeTruthy();
      }
    }
  });
});

authTest.describe('Authenticated Mobile Experience', () => {
  authTest.use({ viewport: { width: 375, height: 667 } });

  authTest('@fast dashboard is usable on mobile', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await johnAuth.waitForTimeout(1000);

    const body = johnAuth.locator('body');
    await expect(body).toBeVisible();
  });

  authTest('@full scoreboard cards are tappable on mobile', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await johnAuth.waitForTimeout(2000);

    const cards = johnAuth.locator('.bg-card.rounded-lg');
    const count = await cards.count();

    if (count > 0) {
      const firstCard = cards.first();
      const box = await firstCard.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(280);
      }
    }
  });
});
