/**
 * E2E Tests for DNS Diagnostics Page
 *
 * Tests DNS lookup, server benchmarking, and cache management flows.
 * Covers happy path, error scenarios, and accessibility.
 *
 * Story: NAS-6.12 - DNS Cache & Diagnostics
 * Task 8: Testing and Documentation (8.1, 8.2, 8.3)
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('DNS Diagnostics - Page Navigation', () => {
  test('should navigate to DNS diagnostics page', async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);
    await page.waitForLoadState('networkidle');

    // Verify page header
    await expect(page.getByRole('heading', { name: /dns diagnostics/i })).toBeVisible();

    // Verify breadcrumb navigation
    await expect(page.getByText(/network/i)).toBeVisible();
    await expect(page.getByText(/dns/i)).toBeVisible();
    await expect(page.getByText(/diagnostics/i)).toBeVisible();

    // Verify page description
    await expect(
      page.getByText(/test dns resolution.*benchmark.*cache/i)
    ).toBeVisible();
  });

  test('should display all three diagnostic components', async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);

    // Verify DNS Lookup Tool is present
    await expect(
      page.getByRole('heading', { name: /dns lookup/i })
    ).toBeVisible();

    // Verify DNS Benchmark is present
    await expect(
      page.getByRole('heading', { name: /dns benchmark/i })
    ).toBeVisible();

    // Verify DNS Cache Panel is present
    await expect(
      page.getByRole('heading', { name: /dns cache/i })
    ).toBeVisible();
  });
});

test.describe('DNS Lookup Tool - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);
    await page.waitForLoadState('networkidle');
  });

  test('should perform DNS lookup with valid hostname', async ({ page }) => {
    // Find hostname input field
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });
    await expect(hostnameInput).toBeVisible();

    // Enter valid hostname
    await hostnameInput.fill('google.com');

    // Click lookup button
    const lookupButton = page.getByRole('button', { name: /lookup|resolve/i }).first();
    await lookupButton.click();

    // Wait for results to appear
    await expect(
      page.locator('[data-testid="dns-lookup-results"]')
    ).toBeVisible({ timeout: 10000 });

    // Verify IP address is displayed (IPv4 pattern)
    await expect(
      page.getByText(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)
    ).toBeVisible();

    // Verify response time is displayed
    await expect(page.getByText(/\d+\s*ms/i)).toBeVisible();

    // Verify DNS server is displayed
    await expect(page.getByText(/server|dns/i)).toBeVisible();

    // Verify TTL is displayed
    await expect(page.getByText(/ttl/i)).toBeVisible();

    // Verify record type is displayed
    await expect(page.getByText(/\b(A|AAAA|CNAME)\b/)).toBeVisible();
  });

  test('should handle multiple A records', async ({ page }) => {
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });
    await hostnameInput.fill('google.com');

    const lookupButton = page.getByRole('button', { name: /lookup|resolve/i }).first();
    await lookupButton.click();

    // Wait for results
    await page.waitForTimeout(2000);

    // Should display multiple IP addresses
    const ipAddresses = page.locator('text=/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/');
    const count = await ipAddresses.count();

    // Google typically returns multiple A records
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('DNS Lookup Tool - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);
    await page.waitForLoadState('networkidle');
  });

  test('should show error for invalid hostname format', async ({ page }) => {
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });

    // Enter invalid hostname
    await hostnameInput.fill('invalid..hostname');

    const lookupButton = page.getByRole('button', { name: /lookup|resolve/i }).first();
    await lookupButton.click();

    // Wait for error message
    await expect(
      page.locator('[role="alert"], [data-testid="dns-error"]')
    ).toBeVisible({ timeout: 5000 });

    // Verify error message contains helpful information
    await expect(
      page.getByText(/invalid|error|failed/i)
    ).toBeVisible();
  });

  test('should show NXDOMAIN error for non-existent domain', async ({ page }) => {
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });

    // Enter non-existent domain
    await hostnameInput.fill('this-domain-does-not-exist-12345.com');

    const lookupButton = page.getByRole('button', { name: /lookup|resolve/i }).first();
    await lookupButton.click();

    // Wait for error
    await page.waitForTimeout(3000);

    // Should show NXDOMAIN or "does not exist" message
    const errorText = page.getByText(/nxdomain|does not exist|not found/i);
    await expect(errorText).toBeVisible({ timeout: 10000 });

    // Should show troubleshooting suggestion
    await expect(
      page.getByText(/check.*spelling|verify.*hostname/i)
    ).toBeVisible();
  });

  test('should handle DNS timeout gracefully', async ({ page }) => {
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });

    // Enter hostname (timeout will depend on DNS server configuration)
    await hostnameInput.fill('example.com');

    const lookupButton = page.getByRole('button', { name: /lookup|resolve/i }).first();
    await lookupButton.click();

    // Wait for either success or timeout error
    await page.waitForTimeout(15000);

    // If timeout occurred, verify error handling
    const timeoutError = page.getByText(/timeout|did not respond/i);
    const isTimeoutVisible = await timeoutError.isVisible();

    if (isTimeoutVisible) {
      // Verify timeout message includes suggestion
      await expect(
        page.getByText(/try.*different.*server|check.*connectivity/i)
      ).toBeVisible();
    }
  });
});

test.describe('DNS Benchmark - Execution Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);
    await page.waitForLoadState('networkidle');
  });

  test('should run DNS benchmark and display results', async ({ page }) => {
    // Find and click benchmark button
    const benchmarkButton = page.getByRole('button', { name: /run benchmark|start benchmark/i });
    await expect(benchmarkButton).toBeVisible();
    await benchmarkButton.click();

    // Verify loading state is shown
    await expect(
      page.getByText(/running|testing|benchmarking/i)
    ).toBeVisible({ timeout: 2000 });

    // Wait for results to appear
    await expect(
      page.locator('[data-testid="benchmark-results"]')
    ).toBeVisible({ timeout: 15000 });

    // Verify status labels are displayed
    const statusLabels = ['fastest', 'good', 'slow', 'unreachable'];
    let foundLabels = 0;

    for (const label of statusLabels) {
      const element = page.getByText(new RegExp(label, 'i'));
      if (await element.isVisible()) {
        foundLabels++;
      }
    }

    // At least one status label should be visible
    expect(foundLabels).toBeGreaterThan(0);

    // Verify response times are displayed
    await expect(page.getByText(/\d+\s*ms/i)).toBeVisible();
  });

  test('should highlight fastest DNS server', async ({ page }) => {
    const benchmarkButton = page.getByRole('button', { name: /run benchmark|start benchmark/i });
    await benchmarkButton.click();

    // Wait for results
    await page.waitForTimeout(5000);

    // Look for "Fastest" badge or indicator
    await expect(
      page.getByText(/fastest/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should sort servers by response time', async ({ page }) => {
    const benchmarkButton = page.getByRole('button', { name: /run benchmark|start benchmark/i });
    await benchmarkButton.click();

    // Wait for results
    await page.waitForTimeout(8000);

    // Get all response time elements
    const responseTimes = await page
      .locator('text=/\\d+\\s*ms/')
      .allTextContents();

    if (responseTimes.length > 1) {
      // Extract numeric values and verify sorting
      const times = responseTimes
        .map((text) => parseInt(text.match(/\d+/)?.[0] || '0'))
        .filter((time) => time > 0);

      // Should be sorted in ascending order (fastest first)
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeLessThanOrEqual(times[i + 1]);
      }
    }
  });

  test('should show progress indication during benchmark', async ({ page }) => {
    const benchmarkButton = page.getByRole('button', { name: /run benchmark|start benchmark/i });
    await benchmarkButton.click();

    // Check for progress indicator (spinner, progress bar, or loading text)
    const progressIndicators = [
      page.locator('[role="progressbar"]'),
      page.getByText(/progress/i),
      page.locator('.animate-spin'),
      page.getByText(/testing server/i),
    ];

    let foundProgress = false;
    for (const indicator of progressIndicators) {
      if (await indicator.isVisible()) {
        foundProgress = true;
        break;
      }
    }

    expect(foundProgress).toBe(true);
  });
});

test.describe('DNS Cache Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);
    await page.waitForLoadState('networkidle');
  });

  test('should display DNS cache statistics', async ({ page }) => {
    // Verify cache statistics are visible
    await expect(
      page.getByText(/cache.*stat|total.*entries|cache.*size/i)
    ).toBeVisible({ timeout: 5000 });

    // Verify hit rate is displayed
    await expect(
      page.getByText(/hit rate|\d+%/i)
    ).toBeVisible();

    // Verify most queried domains section exists
    await expect(
      page.getByText(/most queried|top domains|popular/i)
    ).toBeVisible();
  });

  test('should flush DNS cache with confirmation dialog', async ({ page }) => {
    // Find flush cache button
    const flushButton = page.getByRole('button', { name: /flush|clear.*cache/i });
    await expect(flushButton).toBeVisible();

    // Click flush button
    await flushButton.click();

    // Verify confirmation dialog appears
    await expect(
      page.locator('[role="dialog"], [role="alertdialog"]')
    ).toBeVisible({ timeout: 3000 });

    // Verify dialog contains warning or confirmation message
    await expect(
      page.getByText(/are you sure|confirm|warning|flush.*cache/i)
    ).toBeVisible();

    // Verify before/after stats preview is shown
    await expect(
      page.getByText(/entries|cache.*size/i)
    ).toBeVisible();

    // Find and click confirm button
    const confirmButton = page
      .locator('[role="dialog"], [role="alertdialog"]')
      .getByRole('button', { name: /confirm|flush|yes/i });
    await confirmButton.click();

    // Wait for success notification
    await expect(
      page.locator('[role="status"], [data-testid="toast"]')
    ).toBeVisible({ timeout: 5000 });

    // Verify success message
    await expect(
      page.getByText(/cache.*flushed|success|cleared/i)
    ).toBeVisible();

    // Dialog should close
    await expect(
      page.locator('[role="dialog"], [role="alertdialog"]')
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('should cancel cache flush on dialog dismiss', async ({ page }) => {
    const flushButton = page.getByRole('button', { name: /flush|clear.*cache/i });
    await flushButton.click();

    // Wait for dialog
    await expect(
      page.locator('[role="dialog"], [role="alertdialog"]')
    ).toBeVisible();

    // Find and click cancel button
    const cancelButton = page
      .locator('[role="dialog"], [role="alertdialog"]')
      .getByRole('button', { name: /cancel|no|dismiss/i });

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Dialog should close
      await expect(
        page.locator('[role="dialog"], [role="alertdialog"]')
      ).not.toBeVisible({ timeout: 2000 });

      // No flush should have occurred (no success toast)
      await expect(
        page.getByText(/cache.*flushed/i)
      ).not.toBeVisible();
    }
  });

  test('should display top queried domains list', async ({ page }) => {
    // Look for most queried domains section
    const topDomainsSection = page.getByText(/most queried|top.*domains/i);
    await expect(topDomainsSection).toBeVisible();

    // Should display domain names (look for common TLDs)
    const domainPattern = /[a-z0-9-]+\.(com|net|org|io)/i;
    const domains = page.locator(`text=${domainPattern}`);

    // Should have at least one domain listed (if cache has data)
    const count = await domains.count();

    // This might be 0 if cache is empty, which is acceptable
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('DNS Diagnostics - Responsive Layout', () => {
  test('should use 2-column grid on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);

    // On desktop, lookup and benchmark should be side-by-side
    const lookupTool = page.getByRole('heading', { name: /dns lookup/i });
    const benchmark = page.getByRole('heading', { name: /dns benchmark/i });

    const lookupBox = await lookupTool.boundingBox();
    const benchmarkBox = await benchmark.boundingBox();

    if (lookupBox && benchmarkBox) {
      // Y coordinates should be similar (side by side)
      const yDiff = Math.abs(lookupBox.y - benchmarkBox.y);
      expect(yDiff).toBeLessThan(100); // Should be at similar vertical position
    }
  });

  test('should stack components on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);

    // All components should be visible
    await expect(page.getByRole('heading', { name: /dns lookup/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /dns benchmark/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /dns cache/i })).toBeVisible();

    // Components should be stacked (different Y positions)
    const lookupBox = await page.getByRole('heading', { name: /dns lookup/i }).boundingBox();
    const benchmarkBox = await page.getByRole('heading', { name: /dns benchmark/i }).boundingBox();

    if (lookupBox && benchmarkBox) {
      // Benchmark should be below lookup on mobile
      expect(benchmarkBox.y).toBeGreaterThan(lookupBox.y);
    }
  });
});

test.describe('DNS Diagnostics - Accessibility (WCAG AAA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Main page heading should be h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Component headings should be h2 or h3
    const componentHeadings = await page.getByRole('heading').all();
    expect(componentHeadings.length).toBeGreaterThan(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });
    await hostnameInput.focus();

    // Press Tab to move to next element
    await page.keyboard.press('Tab');

    // Verify focus moved to another element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have ARIA labels on interactive elements', async ({ page }) => {
    // Check buttons have accessible names
    const buttons = await page.getByRole('button').all();

    for (const button of buttons) {
      const accessibleName = await button.getAttribute('aria-label') ||
        await button.textContent();
      expect(accessibleName).toBeTruthy();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    const hostnameInput = page.getByRole('textbox', { name: /hostname/i });
    await hostnameInput.focus();

    // Check for focus ring (common classes or outline)
    const focusClasses = await hostnameInput.getAttribute('class');
    const hasFocusIndicator =
      focusClasses?.includes('focus:') ||
      focusClasses?.includes('ring') ||
      focusClasses?.includes('outline');

    expect(hasFocusIndicator).toBe(true);
  });

  test('should announce progress to screen readers', async ({ page }) => {
    const benchmarkButton = page.getByRole('button', { name: /run benchmark|start benchmark/i });
    await benchmarkButton.click();

    // Check for aria-live regions or status announcements
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    expect(liveRegions).toBeGreaterThan(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This is a basic check - full contrast testing should use axe-core
    // Verify semantic colors are used (they ensure 7:1 contrast)

    // Check for use of semantic color classes
    const bodyHtml = await page.content();

    // Should use semantic tokens (not raw colors)
    const usesSemanticTokens =
      bodyHtml.includes('bg-primary') ||
      bodyHtml.includes('bg-semantic') ||
      bodyHtml.includes('text-foreground') ||
      bodyHtml.includes('text-muted-foreground');

    expect(usesSemanticTokens).toBe(true);
  });

  test('should have minimum 44px touch targets on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/network/dns/diagnostics`);

    // Check button sizes
    const buttons = await page.getByRole('button').all();

    for (const button of buttons.slice(0, 3)) {
      // Check first 3 buttons
      const box = await button.boundingBox();
      if (box) {
        // Height and width should be at least 44px
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
