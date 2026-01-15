/**
 * Authentication & Authorization Tests
 * Tests login flows, registration, password reset, and page access restrictions
 *
 * @fast - Quick smoke tests for critical auth paths
 * @full - Comprehensive auth flow coverage
 * @desktop-only - Authorization/validation tests that don't vary by viewport
 */

import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth';

test.describe('Authentication Flows', () => {
  // Authorization redirect - viewport-independent
  test('@fast @desktop-only unauthenticated user redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('@fast login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Check essential elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('@fast registration page renders correctly', async ({ page }) => {
    await page.goto('/register');

    // Check essential elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // Validation logic - viewport-independent
  test('@full @desktop-only registration form validates email format', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Trigger form validation
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Should show validation error or remain on page
    const hasError =
      (await page.locator('text=/invalid|email/i').isVisible()) ||
      page.url().includes('/register');

    expect(hasError).toBeTruthy();
  });

  // Validation logic - viewport-independent
  test('@full @desktop-only registration form validates password requirements', async ({ page }) => {
    await page.goto('/register');

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('123'); // Too short

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should show validation error or remain on page (not redirect to dashboard)
    const isStillOnRegister = page.url().includes('/register');
    const hasError = await page.locator('text=/password|characters|weak|short|minimum/i').isVisible().catch(() => false);
    const notOnDashboard = !page.url().includes('/dashboard');

    // Either shows error, stays on register, or doesn't redirect to dashboard
    expect(isStillOnRegister || hasError || notOnDashboard).toBeTruthy();
  });

  // Navigation flow - viewport-independent
  test('@full @desktop-only forgot password page accessible', async ({ page }) => {
    await page.goto('/login');

    // Find and click forgot password link
    const forgotLink = page.locator('a:has-text("Forgot")').or(page.locator('text=/forgot.*password/i'));

    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });
});

test.describe('Authenticated User Session', () => {
  // Auth check - viewport-independent
  authTest('@fast @desktop-only authenticated user can access dashboard', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await expect(johnAuth).toHaveURL(/\/dashboard/);
  });

  // Auth check - viewport-independent
  authTest('@fast @desktop-only user profile page is accessible', async ({ johnAuth }) => {
    await johnAuth.goto('/user-profile-management');
    await expect(johnAuth).toHaveURL(/\/user-profile-management/);
  });

  // Data display logic - viewport-independent
  authTest('@full @desktop-only dashboard displays user-specific content', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');
    await johnAuth.waitForTimeout(2000);

    // Should see scoreboard cards or empty state
    const scoreboardCards = johnAuth.locator('.bg-card.rounded-lg h3');
    const emptyState = johnAuth.locator('text=/no scoreboards|create your first/i');

    const cardCount = await scoreboardCards.count();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(cardCount > 0 || hasEmptyState).toBeTruthy();
  });
});

test.describe('Regular User - Admin Pages Restriction', () => {
  // Authorization - viewport-independent
  authTest('@fast @desktop-only john should not access system settings page', async ({ johnAuth }) => {
    await johnAuth.goto('/system-admin/settings');
    await johnAuth.waitForTimeout(2000);

    const currentUrl = johnAuth.url();
    const isBlocked =
      currentUrl.includes('/dashboard') ||
      currentUrl === 'http://localhost:5000/' ||
      (await johnAuth.locator('text=Access Denied').isVisible()) ||
      (await johnAuth.locator('text=Forbidden').isVisible()) ||
      (await johnAuth.locator('text=Unauthorized').isVisible());

    expect(isBlocked).toBeTruthy();
  });

  // Authorization - viewport-independent
  authTest('@fast @desktop-only sarah should not access system invitations page', async ({ sarahAuth }) => {
    await sarahAuth.goto('/system-admin/invitations');
    await sarahAuth.waitForTimeout(2000);

    const currentUrl = sarahAuth.url();
    const isBlocked =
      currentUrl.includes('/dashboard') ||
      currentUrl === 'http://localhost:5000/' ||
      (await sarahAuth.locator('text=Access Denied').isVisible()) ||
      (await sarahAuth.locator('text=Forbidden').isVisible());

    expect(isBlocked).toBeTruthy();
  });

  // Authorization UI - viewport-independent
  authTest('@full @desktop-only john should not see admin navigation links', async ({ johnAuth }) => {
    await johnAuth.goto('/dashboard');

    // System Settings link should not be visible
    const settingsLink = johnAuth.locator('a:has-text("System Settings")');
    await expect(settingsLink).not.toBeVisible();
  });

  // Authorization - viewport-independent
  authTest('@full @desktop-only users cannot bypass URL protection for admin pages', async ({ johnAuth }) => {
    // Try various admin URLs directly
    const adminUrls = ['/system-admin/settings', '/system-admin/invitations'];

    for (const url of adminUrls) {
      await johnAuth.goto(url);
      await johnAuth.waitForTimeout(1000);

      const currentUrl = johnAuth.url();
      const isBlocked =
        !currentUrl.includes('/system-admin') ||
        (await johnAuth.locator('text=Access Denied').isVisible()) ||
        (await johnAuth.locator('text=Forbidden').isVisible());

      expect(isBlocked).toBeTruthy();
    }
  });
});

test.describe('Public Pages Access', () => {
  // Navigation - viewport-independent
  test('@fast @desktop-only home page is publicly accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();
  });

  // Navigation - viewport-independent
  test('@fast @desktop-only about page is publicly accessible', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/\/about/);
  });

  // Navigation - viewport-independent
  test('@fast @desktop-only public scoreboard list is accessible', async ({ page }) => {
    await page.goto('/public-scoreboard-list');
    await expect(page).toHaveURL(/\/public-scoreboard-list/);
  });

  // Static page - viewport-independent
  test('@full @desktop-only privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Static page - viewport-independent
  test('@full @desktop-only terms of service page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveURL(/\/terms/);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Static page - viewport-independent
  test('@full @desktop-only cookies policy page loads', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page).toHaveURL(/\/cookies/);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Static page - viewport-independent
  test('@full @desktop-only contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveURL(/\/contact/);
  });
});
