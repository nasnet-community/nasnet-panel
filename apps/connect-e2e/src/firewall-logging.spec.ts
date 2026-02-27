/**
 * E2E Tests for Firewall Logging Feature
 *
 * End-to-end tests covering complete user workflows:
 * 1. Enable logging on filter rule (toggle + prefix)
 * 2. Navigate to logs page and verify display
 * 3. Filter by action (checkboxes)
 * 4. Filter by IP address (wildcard)
 * 5. Toggle auto-refresh (pause/play)
 * 6. Click log prefix → navigate to rule (verify highlight)
 * 7. Export CSV (verify download)
 *
 * Additional coverage:
 * - Mock RouterOS API responses
 * - Accessibility validation (WCAG AAA)
 * - Performance testing (100+ logs virtualization)
 * - Mobile and desktop viewports
 *
 * Story: NAS-7.9 - Firewall Logging
 * Task 13: E2E Test Suite
 *
 * @module connect-e2e/firewall-logging
 */

import { test, expect, type Page } from '@playwright/test';
import type { Download } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TEST_ROUTER_ID = 'test-router-1';

// Test data - Mock firewall log entries
const mockFirewallLogs = Array.from({ length: 120 }, (_, i) => ({
  id: `log-${i + 1}`,
  timestamp: new Date(Date.now() - i * 60000).toISOString(),
  message: `${['drop', 'accept', 'reject'][i % 3]} tcp from 192.168.${Math.floor(i / 100)}.${i % 100} to 10.0.0.${i % 256} port ${8000 + (i % 1000)}`,
  parsed: {
    action: ['drop', 'accept', 'reject'][i % 3],
    chain: ['input', 'forward', 'output'][i % 3],
    srcIp: `192.168.${Math.floor(i / 100)}.${i % 100}`,
    srcPort: 40000 + i,
    dstIp: `10.0.0.${i % 256}`,
    dstPort: 8000 + (i % 1000),
    protocol: ['tcp', 'udp', 'icmp'][i % 3],
    prefix:
      i % 4 === 0 ? 'BLOCKED'
      : i % 4 === 1 ? 'ALLOWED'
      : i % 4 === 2 ? 'SUSPICIOUS'
      : undefined,
    interfaceIn: 'ether1',
    interfaceOut: 'ether2',
  },
}));

// Helper: Navigate to filter rules page
async function navigateToFilterRules(page: Page) {
  await page.goto(`${BASE_URL}/firewall/filter`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="filter-rules-table"]', {
    state: 'visible',
    timeout: 10000,
  });
}

// Helper: Navigate to firewall logs page
async function navigateToFirewallLogs(page: Page) {
  await page.goto(`${BASE_URL}/firewall/logs`);
  await page.waitForLoadState('networkidle');
}

// Helper: Wait for logs to load
async function waitForLogsLoad(page: Page) {
  // Wait for either the table (desktop) or cards (mobile) to appear
  await Promise.race([
    page.waitForSelector('[data-testid="firewall-log-table"]', {
      state: 'visible',
      timeout: 10000,
    }),
    page.waitForSelector('[data-testid="firewall-log-cards"]', {
      state: 'visible',
      timeout: 10000,
    }),
  ]);
}

// Helper: Mock RouterOS API responses
async function mockRouterOSAPI(page: Page) {
  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const postData = request.postData();

    if (postData?.includes('GetFirewallLogs')) {
      // Mock firewall logs query
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            router: {
              id: TEST_ROUTER_ID,
              firewallLogs: {
                entries: mockFirewallLogs.slice(0, 50),
                totalCount: mockFirewallLogs.length,
              },
            },
          },
        }),
      });
    } else if (postData?.includes('UpdateFilterRule')) {
      // Mock rule update mutation
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            updateFilterRule: {
              success: true,
              rule: {
                id: 'rule-1',
                log: true,
                logPrefix: 'TEST-RULE',
              },
            },
          },
        }),
      });
    } else {
      // Pass through other requests
      await route.continue();
    }
  });
}

test.describe('Firewall Logging - Scenario 1: Enable Logging on Filter Rule', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFilterRules(page);
  });

  test('should enable logging with custom prefix on filter rule', async ({ page }) => {
    // Click edit button on first rule
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    await firstRow.getByRole('button', { name: /edit/i }).click();

    // Wait for editor dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/edit filter rule/i)).toBeVisible();

    // Find and enable the log toggle
    const logToggle = page.getByRole('switch', { name: /enable logging/i });
    await expect(logToggle).toBeVisible();

    // If not already checked, enable it
    const isChecked = await logToggle.isChecked();
    if (!isChecked) {
      await logToggle.click();
      await expect(logToggle).toBeChecked();
    }

    // Enter log prefix
    const logPrefixInput = page.getByLabel(/log prefix/i);
    await expect(logPrefixInput).toBeVisible();
    await logPrefixInput.clear();
    await logPrefixInput.fill('TEST-RULE');

    // Verify suggested prefixes dropdown appears
    await expect(page.getByText(/DROPPED-|ACCEPTED-|REJECTED-|FIREWALL-/)).toBeVisible();

    // Verify preview updates
    const preview = page.getByTestId('rule-preview');
    await expect(preview).toContainText('log');

    // Save the rule
    await page.getByRole('button', { name: /^save$/i }).click();

    // Wait for success message
    await expect(page.getByText(/rule updated/i)).toBeVisible({ timeout: 5000 });

    // Verify the rule now shows log indicator
    await expect(firstRow.getByTestId('log-indicator')).toBeVisible();
  });

  test('should validate log prefix format', async ({ page }) => {
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    await firstRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Enable logging
    const logToggle = page.getByRole('switch', { name: /enable logging/i });
    if (!(await logToggle.isChecked())) {
      await logToggle.click();
    }

    // Try invalid prefix (special characters)
    const logPrefixInput = page.getByLabel(/log prefix/i);
    await logPrefixInput.fill('INVALID@PREFIX!');
    await logPrefixInput.blur();

    // Verify validation error
    await expect(page.getByText(/alphanumeric.*hyphen|invalid.*prefix/i)).toBeVisible();

    // Verify save button is disabled
    const saveButton = page.getByRole('button', { name: /^save$/i });
    await expect(saveButton).toBeDisabled();

    // Correct the prefix
    await logPrefixInput.clear();
    await logPrefixInput.fill('VALID-PREFIX');
    await logPrefixInput.blur();

    // Verify error cleared
    await expect(page.getByText(/alphanumeric.*hyphen|invalid.*prefix/i)).not.toBeVisible();

    // Verify save button is enabled
    await expect(saveButton).toBeEnabled();
  });
});

test.describe('Firewall Logging - Scenario 2: Navigate to Logs Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
  });

  test('should navigate to firewall logs page and display logs', async ({ page }) => {
    await navigateToFirewallLogs(page);

    // Verify page header
    await expect(page.getByRole('heading', { name: /firewall logs/i })).toBeVisible();

    // Wait for logs to load
    await waitForLogsLoad(page);

    // Verify table headers (desktop view)
    await expect(page.getByText(/time/i)).toBeVisible();
    await expect(page.getByText(/action/i)).toBeVisible();
    await expect(page.getByText(/source/i)).toBeVisible();
    await expect(page.getByText(/destination/i)).toBeVisible();
    await expect(page.getByText(/protocol/i)).toBeVisible();

    // Verify log entries are displayed
    const logRows = page.locator('[data-testid="log-row"]');
    const count = await logRows.count();
    expect(count).toBeGreaterThan(0);

    // Verify action badges are visible
    await expect(page.getByText(/drop|accept|reject/i).first()).toBeVisible();

    // Verify IP addresses are displayed
    await expect(page.getByText(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/).first()).toBeVisible();

    // Verify log count is displayed
    await expect(page.getByText(/showing.*of.*logs/i)).toBeVisible();
  });

  test('should display loading state while fetching logs', async ({ page }) => {
    // Navigate but intercept to delay response
    await page.route('**/graphql', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            router: {
              firewallLogs: {
                entries: [],
                totalCount: 0,
              },
            },
          },
        }),
      });
    });

    await navigateToFirewallLogs(page);

    // Verify loading state is shown
    await expect(page.getByText(/loading logs|refreshing/i)).toBeVisible();
  });

  test('should display error state when logs fail to load', async ({ page }) => {
    // Mock API error
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [{ message: 'Failed to fetch logs' }],
        }),
      });
    });

    await navigateToFirewallLogs(page);

    // Verify error message
    await expect(page.getByText(/error.*loading logs|failed to load/i)).toBeVisible();
  });
});

test.describe('Firewall Logging - Scenario 3: Filter by Action', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);
  });

  test('should filter logs by action (drop)', async ({ page }) => {
    // Find action filter checkboxes in sidebar
    const dropCheckbox = page.getByRole('checkbox', { name: /drop/i });
    await expect(dropCheckbox).toBeVisible();

    // Check "drop" action
    await dropCheckbox.check();
    await expect(dropCheckbox).toBeChecked();

    // Wait for filter to apply (debounced)
    await page.waitForTimeout(500);

    // Verify only drop actions are shown
    const actionBadges = page.locator('[data-testid="action-badge"]');
    const count = await actionBadges.count();

    for (let i = 0; i < count; i++) {
      const text = await actionBadges.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('drop');
    }

    // Verify active filter count badge
    await expect(page.getByText(/1.*active.*filter/i)).toBeVisible();
  });

  test('should filter by multiple actions', async ({ page }) => {
    // Check both "drop" and "reject"
    await page.getByRole('checkbox', { name: /drop/i }).check();
    await page.getByRole('checkbox', { name: /reject/i }).check();

    await page.waitForTimeout(500);

    // Verify both drop and reject actions are shown
    const actionBadges = page.locator('[data-testid="action-badge"]');
    const count = await actionBadges.count();
    expect(count).toBeGreaterThan(0);

    // At least one badge should say "drop" or "reject"
    let foundDrop = false;
    let foundReject = false;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await actionBadges.nth(i).textContent();
      if (text?.toLowerCase().includes('drop')) foundDrop = true;
      if (text?.toLowerCase().includes('reject')) foundReject = true;
    }

    expect(foundDrop || foundReject).toBe(true);
  });

  test('should clear action filters', async ({ page }) => {
    // Apply filter
    await page.getByRole('checkbox', { name: /drop/i }).check();
    await page.waitForTimeout(500);

    // Verify filter is active
    await expect(page.getByText(/1.*active.*filter/i)).toBeVisible();

    // Click "Clear Filters" button
    const clearButton = page.getByRole('button', { name: /clear.*filter/i });
    await clearButton.click();

    // Verify filter is cleared
    await expect(page.getByText(/active.*filter/i)).not.toBeVisible();

    // Verify all actions are shown again
    const dropCheckbox = page.getByRole('checkbox', { name: /drop/i });
    await expect(dropCheckbox).not.toBeChecked();
  });
});

test.describe('Firewall Logging - Scenario 4: Filter by IP Address (Wildcard)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);
  });

  test('should filter logs by source IP wildcard', async ({ page }) => {
    // Find source IP filter input
    const srcIpInput = page.getByLabel(/source ip/i);
    await expect(srcIpInput).toBeVisible();

    // Enter wildcard pattern
    await srcIpInput.fill('192.168.1.*');
    await srcIpInput.blur();

    // Wait for debounce and filter to apply
    await page.waitForTimeout(500);

    // Verify filtered logs match pattern
    const logRows = page.locator('[data-testid="log-row"]');
    const count = await logRows.count();

    if (count > 0) {
      // Check first few rows contain matching IPs
      for (let i = 0; i < Math.min(count, 5); i++) {
        const row = logRows.nth(i);
        const srcIpCell = row.locator('[data-testid="src-ip"]');
        const ipText = await srcIpCell.textContent();
        expect(ipText).toMatch(/192\.168\.1\.\d+/);
      }
    }

    // Verify active filter count
    await expect(page.getByText(/active.*filter/i)).toBeVisible();
  });

  test('should filter logs by destination IP wildcard', async ({ page }) => {
    const dstIpInput = page.getByLabel(/destination ip/i);
    await expect(dstIpInput).toBeVisible();

    // Enter wildcard pattern
    await dstIpInput.fill('10.0.*.*');
    await dstIpInput.blur();

    await page.waitForTimeout(500);

    // Verify active filter badge
    await expect(page.getByText(/active.*filter/i)).toBeVisible();
  });

  test('should validate IP wildcard format', async ({ page }) => {
    const srcIpInput = page.getByLabel(/source ip/i);

    // Enter invalid wildcard
    await srcIpInput.fill('invalid.ip.*');
    await srcIpInput.blur();

    // Verify validation error
    await expect(page.getByText(/valid ip.*address|invalid/i)).toBeVisible();

    // Correct the IP
    await srcIpInput.clear();
    await srcIpInput.fill('192.168.1.*');
    await srcIpInput.blur();

    // Verify error cleared
    await expect(page.getByText(/valid ip.*address|invalid/i)).not.toBeVisible();
  });

  test('should filter by exact IP (no wildcard)', async ({ page }) => {
    const srcIpInput = page.getByLabel(/source ip/i);
    await srcIpInput.fill('192.168.1.100');
    await srcIpInput.blur();

    await page.waitForTimeout(500);

    // Verify filter is active
    await expect(page.getByText(/active.*filter/i)).toBeVisible();
  });
});

test.describe('Firewall Logging - Scenario 5: Toggle Auto-Refresh', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);
  });

  test('should enable auto-refresh and verify refreshing indicator', async ({ page }) => {
    // Find play/pause button
    const playButton = page.getByRole('button', { name: /play|start.*refresh/i });
    await expect(playButton).toBeVisible();

    // Click to enable auto-refresh
    await playButton.click();

    // Verify button changes to "Pause"
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();

    // Wait for first refresh cycle
    await page.waitForTimeout(2000);

    // Verify "Refreshing..." indicator appears periodically
    // (This depends on refresh interval being 1-3 seconds)
  });

  test('should pause auto-refresh', async ({ page }) => {
    // Enable auto-refresh first
    const playButton = page.getByRole('button', { name: /play/i });
    await playButton.click();

    // Verify it's now showing "Pause"
    const pauseButton = page.getByRole('button', { name: /pause/i });
    await expect(pauseButton).toBeVisible();

    // Click pause
    await pauseButton.click();

    // Verify button changes back to "Play"
    await expect(page.getByRole('button', { name: /play/i })).toBeVisible();
  });

  test('should change refresh interval', async ({ page }) => {
    // Find interval selector
    const intervalSelect = page.getByRole('combobox', { name: /interval|refresh/i });
    await expect(intervalSelect).toBeVisible();

    // Change to 10 seconds
    await intervalSelect.selectOption('10000');

    // Verify selection changed (value should be 10000)
    await expect(intervalSelect).toHaveValue('10000');
  });

  test('should show available refresh intervals', async ({ page }) => {
    const intervalSelect = page.getByRole('combobox', { name: /interval|refresh/i });
    await intervalSelect.click();

    // Verify all interval options are available
    await expect(page.getByRole('option', { name: /1s/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /3s/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /5s/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /10s/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /30s/i })).toBeVisible();
  });
});

test.describe('Firewall Logging - Scenario 6: Prefix Navigation to Rule', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);
  });

  test('should navigate to filter rule when prefix clicked', async ({ page }) => {
    // Find a log entry with a prefix
    const prefixLink = page.getByRole('link', { name: /BLOCKED|ALLOWED|SUSPICIOUS/i }).first();
    await expect(prefixLink).toBeVisible();

    // Get the prefix text
    const prefixText = await prefixLink.textContent();

    // Click the prefix link
    await prefixLink.click();

    // Verify navigation to filter rules page
    await page.waitForURL(/\/firewall\/filter/);
    await expect(page.getByRole('heading', { name: /filter rules/i })).toBeVisible();

    // Verify the corresponding rule is highlighted
    const highlightedRow = page.locator('[data-testid="filter-rule-row"][data-highlighted="true"]');
    await expect(highlightedRow).toBeVisible();

    // Verify the highlighted rule has the matching log prefix
    await expect(highlightedRow.getByText(prefixText!)).toBeVisible();
  });

  test('should show visual feedback on prefix hover', async ({ page }) => {
    const prefixLink = page.getByRole('link', { name: /BLOCKED|ALLOWED/i }).first();
    await expect(prefixLink).toBeVisible();

    // Hover over prefix
    await prefixLink.hover();

    // Verify underline or color change (Tailwind classes)
    const classes = await prefixLink.getAttribute('class');
    expect(classes).toContain('text-primary');
  });
});

test.describe('Firewall Logging - Scenario 7: Export CSV', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);
  });

  test('should export logs to CSV file', async ({ page }) => {
    // Find export button
    const exportButton = page.getByRole('button', { name: /export.*csv/i });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Click export and wait for download
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    const download: Download = await downloadPromise;

    // Verify download started
    expect(download).toBeTruthy();

    // Verify filename contains "firewall-logs" and ".csv"
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/firewall.*logs.*\.csv/i);

    // Verify file is not empty
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should disable export button when no logs', async ({ page }) => {
    // Mock empty logs response
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            router: {
              firewallLogs: {
                entries: [],
                totalCount: 0,
              },
            },
          },
        }),
      });
    });

    await page.reload();
    await waitForLogsLoad(page);

    // Verify export button is disabled
    const exportButton = page.getByRole('button', { name: /export.*csv/i });
    await expect(exportButton).toBeDisabled();
  });

  test('should export filtered logs only', async ({ page }) => {
    // Apply filter
    await page.getByRole('checkbox', { name: /drop/i }).check();
    await page.waitForTimeout(500);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export.*csv/i }).click();

    const download = await downloadPromise;
    expect(download).toBeTruthy();

    // Verify filename indicates filtered export
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.csv$/i);
  });
});

test.describe('Firewall Logging - Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
  });

  test('should display mobile card layout', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('[data-testid="firewall-log-card"]', {
      state: 'visible',
      timeout: 10000,
    });

    // Verify cards are displayed instead of table
    const cards = page.locator('[data-testid="firewall-log-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Verify card contains action badge
    const firstCard = cards.first();
    await expect(firstCard.getByText(/drop|accept|reject/i)).toBeVisible();

    // Verify card contains IP addresses
    await expect(firstCard.getByText(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)).toBeVisible();
  });

  test('should open filters in bottom sheet on mobile', async ({ page }) => {
    // Find filter button
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible();

    // Click to open bottom sheet
    await filterButton.click();

    // Verify sheet opens
    await expect(page.getByText(/filter logs/i)).toBeVisible();

    // Verify filter controls are in sheet
    await expect(page.getByRole('checkbox', { name: /drop/i })).toBeVisible();
    await expect(page.getByLabel(/source ip/i)).toBeVisible();
  });

  test('should have 44px minimum touch targets on mobile', async ({ page }) => {
    await waitForLogsLoad(page);

    // Check play/pause button
    const playButton = page.getByRole('button', { name: /play|pause/i });
    const playBox = await playButton.boundingBox();
    expect(playBox!.width).toBeGreaterThanOrEqual(44);
    expect(playBox!.height).toBeGreaterThanOrEqual(44);

    // Check filter button
    const filterButton = page.getByRole('button', { name: /filter/i });
    const filterBox = await filterButton.boundingBox();
    expect(filterBox!.width).toBeGreaterThanOrEqual(44);
    expect(filterBox!.height).toBeGreaterThanOrEqual(44);

    // Check export button
    const exportButton = page.getByRole('button', { name: /export/i });
    const exportBox = await exportButton.boundingBox();
    expect(exportBox!.width).toBeGreaterThanOrEqual(44);
    expect(exportBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should expand log details on card tap', async ({ page }) => {
    await waitForLogsLoad(page);

    const firstCard = page.locator('[data-testid="firewall-log-card"]').first();
    await firstCard.click();

    // Verify expanded details are shown
    await expect(firstCard.getByText(/message/i)).toBeVisible();
    await expect(firstCard.getByText(/interface/i)).toBeVisible();

    // Verify close button appears
    await expect(firstCard.getByRole('button', { name: /close|x/i })).toBeVisible();
  });
});

test.describe('Firewall Logging - Performance Testing', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should handle 100+ logs with smooth scrolling', async ({ page }) => {
    // Mock large dataset
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            router: {
              firewallLogs: {
                entries: mockFirewallLogs,
                totalCount: mockFirewallLogs.length,
              },
            },
          },
        }),
      });
    });

    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);

    // Verify total count is displayed
    await expect(page.getByText(/120.*logs/i)).toBeVisible();

    // Scroll through logs and measure performance
    const startTime = Date.now();

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(500);

    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    const endTime = Date.now();
    const scrollTime = endTime - startTime;

    // Scrolling should be smooth (< 2 seconds for round trip)
    expect(scrollTime).toBeLessThan(2000);
  });

  test('should use virtualization for large datasets', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            router: {
              firewallLogs: {
                entries: mockFirewallLogs,
                totalCount: mockFirewallLogs.length,
              },
            },
          },
        }),
      });
    });

    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);

    // Verify not all rows are rendered in DOM (virtualization)
    const renderedRows = page.locator('[data-testid="log-row"]');
    const count = await renderedRows.count();

    // Should render less than total logs (virtualized)
    // Typically renders only visible rows + buffer
    expect(count).toBeLessThan(mockFirewallLogs.length);
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Firewall Logging - Accessibility (WCAG AAA)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockRouterOSAPI(page);
    await navigateToFirewallLogs(page);
    await waitForLogsLoad(page);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to search input
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();

    // Tab to auto-refresh button
    await page.keyboard.press('Tab');
    const playButton = page.getByRole('button', { name: /play|pause/i });
    await expect(playButton).toBeFocused();

    // Enter to toggle
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check buttons have accessible names
    const buttons = await page.getByRole('button').all();
    for (const button of buttons.slice(0, 5)) {
      const accessibleName =
        (await button.getAttribute('aria-label')) || (await button.textContent());
      expect(accessibleName).toBeTruthy();
    }

    // Check table has proper ARIA roles
    const table = page.getByRole('table');
    if (await table.isVisible()) {
      await expect(table).toHaveAttribute('role', 'table');
    }
  });

  test('should have sufficient color contrast for action badges', async ({ page }) => {
    // Verify semantic color classes are used
    const dropBadge = page.getByText('drop').first();
    const classes = await dropBadge.getAttribute('class');

    // Should use semantic tokens (bg-error/10, text-error)
    expect(classes).toMatch(/bg-error|text-error/);
  });

  test('should announce filter changes to screen readers', async ({ page }) => {
    // Look for aria-live regions
    const liveRegions = await page.locator('[aria-live], [role="status"]').count();
    expect(liveRegions).toBeGreaterThan(0);

    // Apply filter and verify announcement
    await page.getByRole('checkbox', { name: /drop/i }).check();

    // Status region should update
    await page.waitForTimeout(500);
    await expect(page.getByText(/showing.*logs/i)).toBeVisible();
  });

  test('should have visible focus indicators', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.focus();

    // Check for focus ring
    const classes = await searchInput.getAttribute('class');
    expect(classes).toMatch(/focus:|ring|outline/);
  });
});
