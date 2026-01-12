/**
 * Shared swipe gesture helpers for E2E tests
 * Provides reusable functions for simulating and verifying swipe gestures
 */

import { Page, Locator, expect } from '@playwright/test';

export interface SwipeOptions {
  /** Distance in pixels to swipe (default: 150) */
  distance?: number;
  /** Number of steps for smooth animation (default: 5) */
  steps?: number;
  /** Delay between steps in ms (default: 50) */
  stepDelay?: number;
}

/**
 * Simulate a horizontal swipe gesture on an element
 */
export async function simulateSwipe(
  page: Page,
  locator: Locator,
  direction: 'left' | 'right',
  options: SwipeOptions = {}
): Promise<void> {
  const { distance = 150, steps = 5, stepDelay = 50 } = options;

  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Element not found or not visible');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = direction === 'left' ? startX - distance : startX + distance;

  // Start touch/mouse interaction
  await page.touchscreen.tap(startX, startY);
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Move in steps for progressive feedback
  for (let i = 1; i <= steps; i++) {
    const currentX = startX + ((endX - startX) * i) / steps;
    await page.mouse.move(currentX, startY);
    await page.waitForTimeout(stepDelay);
  }

  await page.mouse.up();
}

/**
 * Verify that swipe visual feedback is displayed during swipe
 */
export async function expectSwipeFeedback(
  locator: Locator,
  _expectedDirection: 'left' | 'right'
): Promise<void> {
  // Check for swipe background color change
  const backgroundColor = await locator.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );

  // Should have some color applied (not transparent or initial)
  expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
}

/**
 * Verify that a swipeable card exists and is visible
 */
export async function getSwipeableCard(
  page: Page,
  testId = 'swipeable-card'
): Promise<Locator | null> {
  const card = page.locator(`[data-testid="${testId}"]`).first();
  const isVisible = await card.isVisible().catch(() => false);
  return isVisible ? card : null;
}

/**
 * Wait for swipe animation to complete and reset
 */
export async function waitForSwipeReset(page: Page, timeout = 500): Promise<void> {
  await page.waitForTimeout(timeout);
}

/**
 * Perform a complete swipe action and wait for result
 */
export async function performSwipeAction(
  page: Page,
  locator: Locator,
  direction: 'left' | 'right',
  options: SwipeOptions = {}
): Promise<void> {
  await simulateSwipe(page, locator, direction, options);
  await waitForSwipeReset(page);
}

/**
 * Test swipe gesture respects reduced motion preference
 * Returns true if reduced motion is enabled
 */
export async function checkReducedMotion(page: Page): Promise<boolean> {
  return await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Set reduced motion preference for testing
 */
export async function setReducedMotion(page: Page, enabled: boolean): Promise<void> {
  await page.emulateMedia({
    reducedMotion: enabled ? 'reduce' : 'no-preference',
  });
}

/**
 * Check if the document is in RTL mode
 */
export async function isRTL(page: Page): Promise<boolean> {
  return await page.evaluate(() => document.documentElement.dir === 'rtl');
}

/**
 * Set document direction for RTL testing
 */
export async function setRTL(page: Page, enabled: boolean): Promise<void> {
  await page.evaluate((rtl) => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, enabled);
}
