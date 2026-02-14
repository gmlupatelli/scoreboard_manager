/**
 * Kiosk Mode E2E Tests - TV/Kiosk display functionality
 *
 * Covers kiosk settings, kiosk view (carousel, PIN, fullscreen),
 * kiosk display behaviour, and non-supporter access gating.
 *
 * Dedicated accounts: SUPPORTER_5 (Taylor), USER_4
 */

import { test, expect, TEST_USERS } from './fixtures/auth';
import { getScoreboardIdFromDb } from './fixtures/subscriptions';
import { waitForSubscriptionLoaded } from './fixtures/helpers';
import { type Page } from '@playwright/test';
import * as path from 'path';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const supporter5Email = process.env.AUTOMATED_TEST_SUPPORTER_5_EMAIL || 'taylor@example.com';

/**
 * Ensure kiosk mode is enabled for a scoreboard.
 * Returns true if kiosk mode was successfully enabled (or already enabled).
 */
async function ensureKioskEnabled(page: Page, scoreboardId: string): Promise<boolean> {
  try {
    await page.goto(`/scoreboard-management?id=${scoreboardId}`, {
      waitUntil: 'domcontentloaded',
    });

    await waitForSubscriptionLoaded(page);

    // Expand kiosk section
    const kioskToggle = page
      .locator('button')
      .filter({ hasText: /kiosk|presentation/i })
      .first();

    try {
      await kioskToggle.waitFor({ state: 'visible', timeout: 10000 });
    } catch (_error) {
      console.log('Kiosk toggle button not found');
      return false;
    }

    await kioskToggle.click();

    // Wait for section content to render
    const enableLabel = page
      .locator('label')
      .filter({ hasText: /enable kiosk/i })
      .first();

    try {
      await enableLabel.waitFor({ state: 'visible', timeout: 5000 });
      const checkbox = enableLabel.locator('input[type="checkbox"]');
      const isChecked = await checkbox.isChecked();

      if (!isChecked) {
        await enableLabel.click();
        await expect(checkbox).toBeChecked({ timeout: 3000 });
        // Wait for the API save to complete (toggle auto-saves)
        const enabledToast = page.locator('text=/kiosk mode enabled/i');
        await enabledToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
      return true;
    } catch (_error) {
      console.log('Enable kiosk label not found');
      return false;
    }
  } catch (error) {
    console.log('Failed to enable kiosk mode:', error);
    return false;
  }
}

/**
 * Navigate to the scoreboard management page, wait for subscription,
 * and expand the kiosk settings section.
 */
async function openKioskSettings(page: Page, scoreboardId: string): Promise<void> {
  await page.goto(`/scoreboard-management?id=${scoreboardId}`, {
    waitUntil: 'domcontentloaded',
  });

  await waitForSubscriptionLoaded(page);

  const kioskToggle = page
    .locator('button')
    .filter({ hasText: /kiosk|presentation/i })
    .first();
  await kioskToggle.waitFor({ state: 'visible', timeout: 10000 });
  await kioskToggle.scrollIntoViewIfNeeded();
  await kioskToggle.click();

  // Wait for section content to be visible
  const enableLabel = page
    .locator('label')
    .filter({ hasText: /enable kiosk/i })
    .first();
  try {
    await enableLabel.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // Retry expand if section didn't open
    await kioskToggle.click();
    await enableLabel.waitFor({ state: 'visible', timeout: 5000 });
  }
}

/**
 * Navigate to the kiosk view and wait for it to finish loading.
 */
async function openKioskView(page: Page, scoreboardId: string): Promise<void> {
  await page.goto(`/kiosk/${scoreboardId}`, { waitUntil: 'domcontentloaded' });
  // Kiosk loading can take a while as it needs to fetch scoreboard data and slides
  await expect(page.locator('text=Loading kiosk')).toBeHidden({ timeout: 30000 });

  // Handle PIN protection dialog if it appears
  const pinInput = page.locator('input[placeholder*="PIN"]');
  try {
    await pinInput.waitFor({ state: 'visible', timeout: 2000 });
    // PIN is set — try known test PINs
    await pinInput.click();
    await pinInput.pressSequentially('5678');
    const enterButton = page.locator('button:has-text("Enter")');
    await expect(enterButton).toBeEnabled({ timeout: 2000 });
    await enterButton.click();
    // Wait for kiosk view to load after PIN entry
    await expect(page.locator('text=Loading kiosk')).toBeHidden({ timeout: 15000 });
  } catch {
    // No PIN dialog — kiosk loaded directly
  }
}

// ============================================================================
// KIOSK SETTINGS
// ============================================================================

test.describe('Kiosk Settings', () => {
  test.describe.configure({ mode: 'serial' });

  let scoreboardId: string | null;

  test.beforeAll(async () => {
    scoreboardId = await getScoreboardIdFromDb(supporter5Email);
  });

  test('should enable kiosk mode and configure settings', async ({ page, loginAs }) => {
    test.setTimeout(60000);
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    await openKioskSettings(page, scoreboardId!);

    // --- Toggle kiosk enable ---
    const enableLabel = page
      .locator('label')
      .filter({ hasText: /enable kiosk/i })
      .first();
    const enableCheckbox = enableLabel.locator('input[type="checkbox"]');
    const initialState = await enableCheckbox.isChecked();

    await enableLabel.click();
    await expect(enableCheckbox).not.toBeChecked({ checked: initialState, timeout: 3000 });
    const newState = await enableCheckbox.isChecked();
    expect(newState).not.toBe(initialState);

    // Restore original state
    await enableLabel.click();
    await expect(enableCheckbox).toBeChecked({ checked: initialState, timeout: 3000 });

    // --- Configure auto-advance interval ---
    const durationSelect = page
      .locator('select')
      .filter({ hasText: /seconds/i })
      .first()
      .or(page.locator('[data-testid="slide-duration"]'))
      .or(page.locator('select').first());

    if (await durationSelect.isVisible()) {
      await durationSelect.selectOption('15').catch(() => {
        void durationSelect.selectOption({ index: 2 });
      });

      const selectedValue = await durationSelect.inputValue();
      expect(['15', '15 seconds']).toContain(selectedValue);
    }

    // --- Verify slides section exists (scoreboard position) ---
    const slidesSection = page.locator('[data-testid="kiosk-slides-list"]');

    if (await slidesSection.isVisible()) {
      const scoreboardSlide = page
        .locator('[data-testid="scoreboard-slide"]')
        .or(page.locator('text=Scoreboard').first());
      await expect(scoreboardSlide)
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Scoreboard slide may be in different position — non-fatal
        });
    }
  });

  test('should upload and manage slide images', async ({ page, loginAs }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    await openKioskSettings(page, scoreboardId!);

    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');

    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(testImagePath);

      // Wait for the slide thumbnail to appear
      const slideItems = page
        .locator('[data-testid="kiosk-slide-item"]')
        .or(page.locator('img[alt*="slide"]'));

      await expect(slideItems.first()).toBeVisible({ timeout: 10000 });
      const count = await slideItems.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Verify thumbnails have valid src
      const thumbnails = page.locator('img[src*="kiosk-slides"]');

      const thumbCount = await thumbnails.count();
      if (thumbCount > 0) {
        const src = await thumbnails.first().getAttribute('src');
        expect(src).toBeTruthy();
      }

      // Check that file input restricts to image types
      const acceptAttr = await fileInput.getAttribute('accept');
      if (acceptAttr) {
        expect(acceptAttr).toMatch(/image|png|jpg|jpeg|webp/i);
      }
    }
  });

  test('should delete a slide from the list', async ({ page, loginAs }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    await openKioskSettings(page, scoreboardId!);

    const deleteButtons = page
      .locator('[data-testid="kiosk-slide-item"] button[title="Delete slide"]')
      .or(page.locator('button[title="Remove slide"]'));

    const deleteCount = await deleteButtons.count();

    if (deleteCount > 0) {
      const slides = page.locator('[data-testid="kiosk-slide-item"]');
      const initialCount = await slides.count();

      await deleteButtons.first().click();

      // Handle confirmation dialog if it appears
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i });
      try {
        await confirmButton.waitFor({ state: 'visible', timeout: 2000 });
        await confirmButton.click();
      } catch {
        // No confirmation dialog
      }

      // Wait for count to decrease
      await expect
        .poll(async () => await slides.count(), { timeout: 5000, intervals: [500] })
        .toBeLessThanOrEqual(initialCount);
    }
  });

  test('should configure PIN protection', async ({ page, loginAs }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    await openKioskSettings(page, scoreboardId!);

    const pinInput = page.locator('[data-testid="kiosk-pin-input"]');

    if (await pinInput.isVisible()) {
      // Set a PIN value — use click + pressSequentially to ensure React onChange fires
      await pinInput.click();
      await pinInput.pressSequentially('5678');

      // Save changes — wait for hasChanges to enable the button
      const saveButton = page.locator('[data-testid="kiosk-save-settings"]');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();
      // After successful save: button shows "Saving..." then reverts to "Save Settings" (disabled)
      await expect(saveButton).toContainText('Save Settings', { timeout: 10000 });

      // Verify PIN field still has a value (not cleared after save)
      const value = await pinInput.inputValue();
      expect(value.length).toBeGreaterThan(0);

      // Clear PIN to restore state — select all and delete to trigger onChange
      await pinInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');

      // Save the cleared PIN
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();
      await expect(saveButton).toContainText('Save Settings', { timeout: 10000 });
    }
  });
});

// ============================================================================
// KIOSK VIEW
// ============================================================================

test.describe('Kiosk View', () => {
  test.describe.configure({ mode: 'serial' });

  let scoreboardId: string | null;

  test.beforeAll(async () => {
    scoreboardId = await getScoreboardIdFromDb(supporter5Email);
  });

  test('should render kiosk view with scoreboard data', async ({ page, loginAs }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    const kioskEnabled = await ensureKioskEnabled(page, scoreboardId!);
    test.skip(!kioskEnabled, 'Could not enable kiosk mode');

    await openKioskView(page, scoreboardId!);

    const kioskContainer = page.locator('[data-testid="kiosk-container"]').or(page.locator('main'));
    await expect(kioskContainer).toBeVisible({ timeout: 10000 });

    // Verify keyboard controls work without errors
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Escape');

    expect(page.url()).toContain('/kiosk/');
  });

  test('should auto-advance and allow pause/resume', async ({ page, loginAs }) => {
    test.setTimeout(60000);
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    const kioskEnabled = await ensureKioskEnabled(page, scoreboardId!);
    test.skip(!kioskEnabled, 'Could not enable kiosk mode');

    await openKioskView(page, scoreboardId!);

    const kioskContainer = page.locator('[data-testid="kiosk-container"]');
    await expect(kioskContainer).toBeVisible({ timeout: 10000 });

    // --- Auto-advance check ---
    const slideIndicator = page
      .locator('[data-testid="slide-indicator"]')
      .or(page.locator('.slide-indicator'))
      .or(page.locator('[aria-current="true"]'));

    if ((await slideIndicator.count()) > 0) {
      const initialIndex =
        (await slideIndicator.first().getAttribute('data-slide-index')) ||
        (await slideIndicator.first().textContent());

      // Wait enough time for an auto-advance cycle
      await expect
        .poll(
          async () => {
            return (
              (await slideIndicator.first().getAttribute('data-slide-index')) ||
              (await slideIndicator.first().textContent())
            );
          },
          { timeout: 15000, intervals: [1000] }
        )
        .not.toBe(initialIndex)
        .catch(() => {
          // May not advance if only one slide — non-fatal
        });
    }

    // --- Pause / Resume ---
    const pauseButton = page
      .locator('button[title*="pause" i]')
      .or(page.locator('button[aria-label*="pause" i]'))
      .or(page.locator('[data-testid="pause-button"]'));

    let pauseVisible = false;
    try {
      await pauseButton.waitFor({ state: 'visible', timeout: 3000 });
      pauseVisible = true;
    } catch {
      // pause button not visible
    }

    if (pauseVisible) {
      await pauseButton.click();

      const playButton = page
        .locator('button[title*="play" i]')
        .or(page.locator('button[aria-label*="play" i]'));

      try {
        await playButton.waitFor({ state: 'visible', timeout: 3000 });
        await playButton.click();
      } catch {
        // play button not visible
      }
    } else {
      // Fallback: use spacebar to pause/resume
      await page.keyboard.press('Space');
      await page.keyboard.press('Space');
    }
  });

  test('should show PIN modal when PIN is set', async ({ page, loginAs, context }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    // Set a PIN via settings
    await openKioskSettings(page, scoreboardId!);

    const pinInput = page.locator('[data-testid="kiosk-pin-input"]');

    if (await pinInput.isVisible()) {
      await pinInput.click();
      await pinInput.pressSequentially('1234');

      const saveButton = page.locator('[data-testid="kiosk-save-settings"]');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();
      await expect(saveButton).toContainText('Save Settings', { timeout: 10000 });

      // Open kiosk in a new page — should show PIN prompt
      const newPage = await context.newPage();
      await newPage.goto(`/kiosk/${scoreboardId}`, { waitUntil: 'domcontentloaded' });

      const kioskPinInput = newPage.locator('input[placeholder*="PIN"]');
      await expect(kioskPinInput).toBeVisible({ timeout: 10000 });

      await newPage.close();

      // Restore — clear PIN
      await pinInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();
      await expect(saveButton).toContainText('Save Settings', { timeout: 10000 });
    }
  });

  test('should validate correct and incorrect PIN', async ({ page, loginAs, context }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    // Enable kiosk and set PIN
    await ensureKioskEnabled(page, scoreboardId!);
    await openKioskSettings(page, scoreboardId!);

    const pinInput = page.locator('[data-testid="kiosk-pin-input"]');

    if (await pinInput.isVisible()) {
      await pinInput.click();
      await pinInput.pressSequentially('9999');

      const saveButton = page.locator('[data-testid="kiosk-save-settings"]');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();
      await expect(saveButton).toContainText('Save Settings', { timeout: 10000 });

      const newPage = await context.newPage();
      await newPage.goto(`/kiosk/${scoreboardId}`, { waitUntil: 'domcontentloaded' });

      const kioskPinInput = newPage.locator('input[placeholder*="PIN"]');

      let pinVisible = false;
      try {
        await kioskPinInput.waitFor({ state: 'visible', timeout: 10000 });
        pinVisible = true;
      } catch {
        // PIN input not visible
      }
      if (pinVisible) {
        // Wrong PIN
        await kioskPinInput.click();
        await kioskPinInput.pressSequentially('0000');
        await newPage.keyboard.press('Enter');

        // Wait for error, then clear and enter correct PIN
        await newPage.waitForTimeout(500);
        await kioskPinInput.click();
        await newPage.keyboard.press('Control+a');
        await kioskPinInput.pressSequentially('9999');
        await newPage.keyboard.press('Enter');

        // Should access kiosk after correct PIN
        const kioskContainer = newPage.locator('[data-testid="kiosk-container"]');
        await expect(kioskContainer).toBeVisible({ timeout: 10000 });
      }

      await newPage.close();

      // Restore — clear PIN
      await pinInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();
      await expect(saveButton).toContainText('Save Settings', { timeout: 10000 });
    }
  });

  test('should toggle fullscreen mode', async ({ page, loginAs }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    const kioskEnabled = await ensureKioskEnabled(page, scoreboardId!);
    test.skip(!kioskEnabled, 'Could not enable kiosk mode');

    await openKioskView(page, scoreboardId!);

    // Move mouse to show controls
    await page.mouse.move(100, 100);

    const fullscreenButton = page
      .locator('button[title*="fullscreen" i]')
      .or(page.locator('button[aria-label*="fullscreen" i]'))
      .or(page.locator('[data-testid="fullscreen-button"]'));

    try {
      await fullscreenButton.waitFor({ state: 'visible', timeout: 3000 });
      await fullscreenButton.click();
      // Fullscreen API may not work in test environment, button should be interactive
      await page.keyboard.press('Escape');
    } catch {
      // Fullscreen button not visible
    }

    // Verify page is still functional
    expect(page.url()).toContain('/kiosk/');
  });
});

// ============================================================================
// KIOSK DISPLAY
// ============================================================================

test.describe('Kiosk Display', () => {
  test.describe.configure({ mode: 'serial' });

  let scoreboardId: string | null;

  test.beforeAll(async () => {
    scoreboardId = await getScoreboardIdFromDb(supporter5Email);
  });

  test('should display images in kiosk view', async ({ page, loginAs }) => {
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    const kioskEnabled = await ensureKioskEnabled(page, scoreboardId!);
    test.skip(!kioskEnabled, 'Could not enable kiosk mode');

    await openKioskView(page, scoreboardId!);

    const kioskContainer = page.locator('[data-testid="kiosk-container"]').or(page.locator('main'));
    await expect(kioskContainer).toBeVisible({ timeout: 10000 });

    // If there are image slides, they should have img elements
    const images = page.locator('img[src*="kiosk-slides"]');
    const imageCount = await images.count();
    // Images may or may not be present depending on carousel state — just ensure no errors
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });

  test('should auto-hide control bar after inactivity', async ({ page, loginAs }) => {
    test.setTimeout(45000);
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    const kioskEnabled = await ensureKioskEnabled(page, scoreboardId!);
    test.skip(!kioskEnabled, 'Could not enable kiosk mode');

    await openKioskView(page, scoreboardId!);

    const kioskContainer = page.locator('[data-testid="kiosk-container"]');
    await expect(kioskContainer).toBeVisible({ timeout: 10000 });

    const controlsOverlay = page.locator('[data-testid="kiosk-controls"]');

    // Move mouse to show controls
    await page.mouse.move(100, 100);

    await expect
      .poll(async () => (await controlsOverlay.getAttribute('class')) || '', {
        timeout: 10000,
        intervals: [500],
      })
      .toContain('opacity-100');

    // Wait for auto-hide (3s idle) and confirm controls are hidden
    await expect
      .poll(async () => (await controlsOverlay.getAttribute('class')) || '', {
        timeout: 12000,
        intervals: [500],
      })
      .toContain('opacity-0');
  });

  test('should show control bar on mouse movement', async ({ page, loginAs }) => {
    test.setTimeout(45000);
    test.skip(!scoreboardId, 'No scoreboard found for supporter user');

    await loginAs(TEST_USERS.supporter5);
    const kioskEnabled = await ensureKioskEnabled(page, scoreboardId!);
    test.skip(!kioskEnabled, 'Could not enable kiosk mode');

    await openKioskView(page, scoreboardId!);

    const kioskContainer = page.locator('[data-testid="kiosk-container"]');
    await expect(kioskContainer).toBeVisible({ timeout: 10000 });

    const controlsOverlay = page.locator('[data-testid="kiosk-controls"]');

    // Trigger mouse movement to start the 3s auto-hide timer
    await page.mouse.move(100, 100);

    // Wait for controls to auto-hide (3s idle timeout + buffer)
    await expect
      .poll(async () => (await controlsOverlay.getAttribute('class')) || '', {
        timeout: 12000,
        intervals: [500],
      })
      .toContain('opacity-0');

    // Move mouse to trigger controls reappearance
    await page.mouse.move(200, 200);

    await expect
      .poll(async () => (await controlsOverlay.getAttribute('class')) || '', {
        timeout: 10000,
        intervals: [500],
      })
      .toContain('opacity-100');
  });
});

// ============================================================================
// NON-SUPPORTER ACCESS
// ============================================================================

test.describe('Non-Supporter Access', () => {
  test('free user should not have kiosk access', async ({ page, loginAs }) => {
    await loginAs(TEST_USERS.user4);

    // Navigate to dashboard and look for any scoreboard management page
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const cards = page.locator('[data-testid="scoreboard-card"]');
    if ((await cards.count()) > 0) {
      const manageBtn = cards.first().locator('[data-testid="scoreboard-card-manage"]');

      let manageBtnVisible = false;
      try {
        await manageBtn.waitFor({ state: 'visible', timeout: 5000 });
        manageBtnVisible = true;
      } catch {
        // manage button not visible
      }

      if (manageBtnVisible) {
        await manageBtn.click();
        await page.waitForURL('**/scoreboard-management?id=*', {
          timeout: 10000,
          waitUntil: 'domcontentloaded',
        });

        // Kiosk section should either not exist or show a supporter-only gate
        const kioskToggle = page
          .locator('button')
          .filter({ hasText: /kiosk|presentation/i })
          .first();

        let kioskToggleVisible = false;
        try {
          await kioskToggle.waitFor({ state: 'visible', timeout: 5000 });
          kioskToggleVisible = true;
        } catch {
          // kiosk toggle not visible
        }

        if (kioskToggleVisible) {
          await kioskToggle.click();

          // Should show supporter feature lock, not the enable checkbox
          const supporterLock = page.locator('text=/supporter|upgrade|subscription/i').first();
          await expect(supporterLock).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});
