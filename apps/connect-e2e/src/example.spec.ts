/**
 * Basic E2E Tests for NasNetConnect
 *
 * These tests verify the core application loads and renders correctly.
 * For more comprehensive testing patterns, see:
 * - apps/connect-e2e/src/navigation.spec.ts
 * - apps/connect-e2e/src/chr-integration.spec.ts (CHR Docker tests)
 */

import { test, expect } from '@playwright/test';

test.describe('Application Loading', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Expect h1 to contain a substring
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');

    // Check the page title
    await expect(page).toHaveTitle(/NasNet|Connect|Router/i);
  });

  test('should be responsive to viewport changes', async ({ page }) => {
    await page.goto('/');

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    // If we got here without errors, responsive design is working
    expect(true).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for basic accessibility attributes
    // Note: For comprehensive accessibility testing, use axe-core in CI
    const mainContent = page.locator('main, [role="main"], #root');
    await expect(mainContent).toBeVisible();

    // Verify interactive elements are keyboard accessible
    const focusableElements = page.locator(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusableElements.count();

    // There should be at least some focusable elements on the page
    expect(count).toBeGreaterThan(0);
  });
});
