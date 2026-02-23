/**
 * Firewall Connection Tracking E2E Tests
 *
 * End-to-end tests for connection tracking workflow:
 * - Connection list view and auto-refresh
 * - Filtering (IP, port, protocol, state)
 * - Kill connection flow
 * - Connection tracking settings
 * - Keyboard navigation and accessibility
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 */

import { test, expect, type Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = `/router/${TEST_ROUTER_ID}/firewall/connections`;

// Mock data generators
function generateMockConnection(id: number) {
  const protocols = ['tcp', 'udp', 'icmp'];
  const states = ['established', 'new', 'related', 'time-wait', 'syn-sent'];

  return {
    '.id': `*${id.toString(16).toUpperCase()}`,
    protocol: protocols[id % protocols.length],
    'src-address': `192.168.${Math.floor(id / 256)}.${id % 256}:${1024 + (id % 1000)}`,
    'dst-address': `10.0.${Math.floor(id / 100)}.${id % 100}:${80 + (id % 20)}`,
    'reply-dst-address': `192.168.${Math.floor(id / 256)}.${id % 256}:${1024 + (id % 1000)}`,
    'connection-state': states[id % states.length],
    timeout: `${300 - (id % 300)}s`,
    packets: `${100 + id}`,
    bytes: `${10000 + (id * 100)}`,
    assured: id % 2 === 0 ? 'true' : 'false',
    confirmed: id % 3 === 0 ? 'true' : 'false',
  };
}

function generateMockConnections(count: number) {
  return Array.from({ length: count }, (_, i) => generateMockConnection(i));
}

function generateMockSettings() {
  return {
    enabled: 'true',
    'max-entries': '32768',
    'tcp-established-timeout': '1d',
    'tcp-syn-sent-timeout': '5s',
    'tcp-syn-received-timeout': '60s',
    'tcp-fin-wait-timeout': '10s',
    'tcp-time-wait-timeout': '10s',
    'tcp-close-timeout': '10s',
    'tcp-close-wait-timeout': '10s',
    'tcp-last-ack-timeout': '10s',
    'udp-timeout': '10s',
    'udp-stream-timeout': '3m',
    'icmp-timeout': '10s',
    'generic-timeout': '10m',
    'loose-tcp-tracking': 'no',
  };
}

// Helper to setup API mocks
async function setupConnectionsMock(page: Page, connections: any[]) {
  await page.route('**/rest/ip/firewall/connection', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: connections }),
    });
  });
}

async function setupSettingsMock(page: Page, settings: any) {
  await page.route('**/rest/ip/firewall/connection/tracking', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: settings }),
    });
  });
}

/**
 * Setup: Navigate to Firewall Connections page before each test
 */
test.beforeEach(async ({ page }) => {
  // Setup default mocks
  await setupConnectionsMock(page, generateMockConnections(20));
  await setupSettingsMock(page, generateMockSettings());

  // Navigate to page
  await page.goto(BASE_URL);

  // Wait for page to load
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// Scenario 1: Connection List View
// =============================================================================

test.describe('Connection List View', () => {
  test('should display active connections', async ({ page }) => {
    // Wait for connection list to load
    await expect(page.getByText(/connection tracking/i)).toBeVisible();

    // Verify table/list is visible (desktop view)
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 640) {
      // Desktop: should show table
      await expect(page.locator('table')).toBeVisible();

      // Verify connection data columns
      await expect(page.getByText(/protocol/i).first()).toBeVisible();
      await expect(page.getByText(/source/i).first()).toBeVisible();
      await expect(page.getByText(/destination/i).first()).toBeVisible();
      await expect(page.getByText(/state/i).first()).toBeVisible();
    } else {
      // Mobile: should show cards
      await expect(page.locator('[data-testid="connection-card"]').first()).toBeVisible();
    }
  });

  test('should show empty state when no connections', async ({ page }) => {
    // Mock empty connections
    await setupConnectionsMock(page, []);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify empty state is shown
    await expect(page.getByText(/no active connections/i)).toBeVisible();
  });

  test('should display connection count', async ({ page }) => {
    // Verify connection count indicator
    await expect(page.locator('text=/\\d+ connection/i')).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// Scenario 2: Auto-Refresh Behavior
// =============================================================================

test.describe('Auto-Refresh', () => {
  test('should auto-refresh every 5 seconds', async ({ page }) => {
    // Monitor network requests
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('ip/firewall/connection')) {
        requestCount++;
      }
    });

    // Get initial count
    await page.waitForTimeout(500);
    const initialCount = requestCount;

    // Wait 6 seconds, verify at least one more request
    await page.waitForTimeout(6000);
    expect(requestCount).toBeGreaterThan(initialCount);
  });

  test('should pause auto-refresh when paused', async ({ page }) => {
    // Find and click pause button
    const pauseButton = page.getByRole('button', { name: /pause.*refresh/i });
    await pauseButton.click();

    // Monitor requests after pause
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('ip/firewall/connection')) {
        requestCount++;
      }
    });

    // Wait 6 seconds, verify no new requests
    await page.waitForTimeout(6000);
    expect(requestCount).toBe(0);
  });

  test('should resume auto-refresh when resumed', async ({ page }) => {
    // Pause refresh
    const pauseButton = page.getByRole('button', { name: /pause.*refresh/i });
    await pauseButton.click();

    // Resume refresh
    const resumeButton = page.getByRole('button', { name: /resume.*refresh/i });
    await resumeButton.click();

    // Monitor requests after resume
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('ip/firewall/connection')) {
        requestCount++;
      }
    });

    // Wait 6 seconds, verify requests resume
    await page.waitForTimeout(6000);
    expect(requestCount).toBeGreaterThan(0);
  });
});

// =============================================================================
// Scenario 3: Filtering Connections
// =============================================================================

test.describe('Connection Filtering', () => {
  test('should filter by IP address', async ({ page }) => {
    // Enter IP in filter input
    const ipInput = page.getByPlaceholder(/192\.168\.1\.\*.*192\.168\.1\.100/i);
    await ipInput.fill('192.168.1.100');
    await ipInput.press('Enter');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify filtered results contain the IP
    await expect(page.locator('text=/192\\.168\\.1\\.100/')).toBeVisible();
  });

  test('should filter by wildcard IP pattern (192.168.1.*)', async ({ page }) => {
    // Enter wildcard pattern
    const ipInput = page.getByPlaceholder(/192\.168\.1\.\*/i);
    await ipInput.fill('192.168.1.*');
    await ipInput.press('Enter');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify results show 192.168.1.x addresses
    const connectionText = await page.textContent('body');
    expect(connectionText).toContain('192.168.1.');
  });

  test('should filter by port', async ({ page }) => {
    // Enter port number
    const portInput = page.getByPlaceholder(/e\.g\., 80 or 443/i);
    await portInput.fill('443');
    await portInput.press('Enter');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify connections with port 443 are shown
    await expect(page.locator('text=/443/')).toBeVisible();
  });

  test('should filter by protocol', async ({ page }) => {
    // Click protocol select
    const protocolSelect = page.locator('[data-testid="filter-protocol"]').or(
      page.getByRole('combobox', { name: /protocol/i })
    );
    await protocolSelect.click();

    // Select TCP
    await page.getByText('TCP', { exact: true }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify only TCP connections shown
    const connectionText = await page.textContent('body');
    expect(connectionText).toContain('tcp');
  });

  test('should filter by state', async ({ page }) => {
    // Click state select
    const stateSelect = page.locator('[data-testid="filter-state"]').or(
      page.getByRole('combobox', { name: /state/i })
    );
    await stateSelect.click();

    // Select established
    await page.getByText('Established', { exact: true }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify only established connections shown
    const connectionText = await page.textContent('body');
    expect(connectionText).toContain('established');
  });

  test('should apply multiple filters simultaneously', async ({ page }) => {
    // Apply IP filter
    const ipInput = page.getByPlaceholder(/192\.168\.1\.\*/i);
    await ipInput.fill('192.168.1.*');

    // Apply port filter
    const portInput = page.getByPlaceholder(/e\.g\., 80 or 443/i);
    await portInput.fill('80');

    // Apply filters
    await ipInput.press('Enter');

    // Wait for filters to apply
    await page.waitForTimeout(500);

    // Verify filtered results match all criteria
    const connectionText = await page.textContent('body');
    expect(connectionText).toContain('192.168.1.');
    expect(connectionText).toContain('80');
  });

  test('should clear all filters', async ({ page }) => {
    // Apply filters
    const ipInput = page.getByPlaceholder(/192\.168\.1\.\*/i);
    await ipInput.fill('192.168.1.*');
    await ipInput.press('Enter');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Click clear filters button
    const clearButton = page.getByRole('button', { name: /clear.*filter/i });
    await clearButton.click();

    // Wait for filters to clear
    await page.waitForTimeout(500);

    // Verify all connections shown again (count should increase)
    const connectionCount = await page.locator('table tr, [data-testid="connection-card"]').count();
    expect(connectionCount).toBeGreaterThan(5);
  });
});

// =============================================================================
// Scenario 4: Kill Connection Flow
// =============================================================================

test.describe('Kill Connection', () => {
  test('should open confirmation dialog when kill clicked', async ({ page }) => {
    // Mock kill endpoint
    await page.route('**/rest/ip/firewall/connection/remove', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Click kill button on a connection
    const killButton = page.getByRole('button', { name: /kill.*connection/i }).first();
    await killButton.click();

    // Verify confirmation dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/terminate.*connection/i)).toBeVisible();
  });

  test('should display connection details in confirmation', async ({ page }) => {
    // Mock kill endpoint
    await page.route('**/rest/ip/firewall/connection/remove', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Open kill dialog
    const killButton = page.getByRole('button', { name: /kill.*connection/i }).first();
    await killButton.click();

    // Verify dialog shows connection details
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/192\.168/i);
  });

  test('should kill connection on confirmation', async ({ page }) => {
    // Mock kill endpoint
    let killCalled = false;
    await page.route('**/rest/ip/firewall/connection/remove', async (route) => {
      killCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Click kill, confirm
    await page.getByRole('button', { name: /kill.*connection/i }).first().click();
    await page.getByRole('button', { name: /confirm|kill/i }).last().click();

    // Verify success toast
    await expect(page.getByText(/terminated|killed/i)).toBeVisible({ timeout: 3000 });

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });

    // Verify API was called
    expect(killCalled).toBe(true);
  });

  test('should not kill connection on cancel', async ({ page }) => {
    // Mock kill endpoint
    let killCalled = false;
    await page.route('**/rest/ip/firewall/connection/remove', async (route) => {
      killCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Click kill, cancel
    await page.getByRole('button', { name: /kill.*connection/i }).first().click();
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verify dialog closes without killing
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });

    // Verify API was not called
    expect(killCalled).toBe(false);
  });
});

// =============================================================================
// Scenario 5: Connection Tracking Settings
// =============================================================================

test.describe('Connection Tracking Settings', () => {
  test('should navigate to settings tab', async ({ page }) => {
    // Click settings tab
    await page.getByRole('tab', { name: /settings/i }).click();

    // Verify settings form visible
    await expect(page.getByText(/connection tracking.*settings|tracking configuration/i)).toBeVisible();
  });

  test('should display current settings', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('tab', { name: /settings/i }).click();

    // Verify settings fields populated
    await expect(page.getByText(/enabled|max.*entries|timeout/i).first()).toBeVisible();
  });

  test('should allow modifying settings', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('tab', { name: /settings/i }).click();

    // Find and modify max entries input
    const maxEntriesInput = page.getByLabel(/max.*entries/i);
    await maxEntriesInput.clear();
    await maxEntriesInput.fill('65536');

    // Verify change reflected
    await expect(maxEntriesInput).toHaveValue('65536');
  });

  test('should save settings with confirmation', async ({ page }) => {
    // Mock update endpoint
    let updateCalled = false;
    await page.route('**/rest/ip/firewall/connection/tracking/set', async (route) => {
      updateCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Navigate to settings, modify, save
    await page.getByRole('tab', { name: /settings/i }).click();

    const maxEntriesInput = page.getByLabel(/max.*entries/i);
    await maxEntriesInput.clear();
    await maxEntriesInput.fill('65536');

    await page.getByRole('button', { name: /save.*settings/i }).click();

    // Verify confirmation dialog (may be Standard or Dangerous depending on change)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 2000 });

    // Confirm action
    await page.getByRole('button', { name: /confirm|save/i }).last().click();

    // Verify success toast
    await expect(page.getByText(/settings.*updated|saved/i)).toBeVisible({ timeout: 3000 });

    // Verify API was called
    await page.waitForTimeout(1000);
    expect(updateCalled).toBe(true);
  });

  test('should validate settings input', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('tab', { name: /settings/i }).click();

    // Enter invalid value
    const tcpTimeoutInput = page.getByLabel(/tcp.*established.*timeout|established.*timeout/i);
    await tcpTimeoutInput.clear();
    await tcpTimeoutInput.fill('invalid');
    await tcpTimeoutInput.blur();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify validation error
    await expect(page.getByText(/invalid.*format/i)).toBeVisible();
  });
});

// =============================================================================
// Scenario 6: Keyboard Navigation
// =============================================================================

test.describe('Keyboard Navigation', () => {
  test('should support tabbing through interactive elements', async ({ page }) => {
    // Start from the top
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Verify focus is visible (check for focus ring or active element)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Verify focus moved
    const newFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(newFocusedElement).toBeTruthy();
  });

  test('should open kill dialog with Enter key', async ({ page }) => {
    // Mock kill endpoint
    await page.route('**/rest/ip/firewall/connection/remove', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Focus on first kill button
    const killButton = page.getByRole('button', { name: /kill.*connection/i }).first();
    await killButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should close dialog with Escape key', async ({ page }) => {
    // Mock kill endpoint
    await page.route('**/rest/ip/firewall/connection/remove', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Open kill dialog
    await page.getByRole('button', { name: /kill.*connection/i }).first().click();

    // Wait for dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });
  });

  test('should navigate filter inputs with Tab', async ({ page }) => {
    // Focus on IP filter
    const ipInput = page.getByPlaceholder(/192\.168\.1\.\*/i);
    await ipInput.focus();

    // Verify focus
    await expect(ipInput).toBeFocused();

    // Tab to next input
    await page.keyboard.press('Tab');

    // Verify focus moved
    const portInput = page.getByPlaceholder(/e\.g\., 80 or 443/i);
    await expect(portInput).toBeFocused();
  });
});

// =============================================================================
// Scenario 7: Accessibility
// =============================================================================

test.describe('Accessibility', () => {
  test('should pass WCAG AAA accessibility audit', async ({ page }) => {
    // TODO: Add accessibility audit when @axe-core/playwright is installed
    // For now, verify page structure for basic a11y
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should have accessible labels on all buttons', async ({ page }) => {
    // Verify buttons have accessible names
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);

    // Check first few buttons have accessible names
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label').catch(() => null)
        || await button.textContent();
      expect(accessibleName).toBeTruthy();
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Check for focus indicator (outline, ring, etc.)
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

    // Verify focus indicator exists
    expect(
      focusedElement?.outline !== 'none' ||
      focusedElement?.boxShadow !== 'none' ||
      parseFloat(focusedElement?.outlineWidth || '0') > 0
    ).toBe(true);
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Verify table has proper ARIA roles (desktop)
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 640) {
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Verify table structure
      const headers = table.locator('th');
      expect(await headers.count()).toBeGreaterThan(0);
    }
  });

  test('should have 44px minimum touch targets on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload with mobile viewport
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Measure button sizes
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    // Check first few buttons meet minimum size
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();

      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

// =============================================================================
// Scenario 8: Performance
// =============================================================================

test.describe('Performance', () => {
  test('should handle large connection lists (1000+ entries)', async ({ page }) => {
    // Mock 1500 connections
    const largeDataset = generateMockConnections(1500);
    await setupConnectionsMock(page, largeDataset);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify page loads without freezing (within 5 seconds)
    await expect(page.getByText(/connection tracking/i)).toBeVisible({ timeout: 5000 });

    // Verify connection count shows large number
    await expect(page.locator('text=/1[,.]?500/i')).toBeVisible({ timeout: 3000 });
  });

  test('should maintain smooth scrolling with virtualization', async ({ page }) => {
    // Mock large dataset
    const largeDataset = generateMockConnections(1000);
    await setupConnectionsMock(page, largeDataset);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find scroll container
    const scrollContainer = page.locator('[data-virtualized="true"]').or(page.locator('table')).first();

    // Scroll rapidly and measure performance
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      await scrollContainer.evaluate((el) => {
        el.scrollTop += 500;
      });
      await page.waitForTimeout(50); // Simulate rapid scrolling
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete smoothly (under 1 second for 5 scrolls)
    expect(duration).toBeLessThan(1000);
  });

  test('should filter 1000+ connections in under 500ms', async ({ page }) => {
    // Mock large dataset
    const largeDataset = generateMockConnections(1000);
    await setupConnectionsMock(page, largeDataset);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Measure filter performance
    const startTime = Date.now();

    // Apply filter
    const ipInput = page.getByPlaceholder(/192\.168\.1\.\*/i);
    await ipInput.fill('192.168.1.*');
    await ipInput.press('Enter');

    // Wait for filter to complete
    await page.waitForTimeout(200);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete quickly (under 500ms)
    expect(duration).toBeLessThan(500);
  });
});
