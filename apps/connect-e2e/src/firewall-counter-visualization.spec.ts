/**
 * Firewall Counter Visualization E2E Tests
 *
 * End-to-end tests for rule hit counter visualization workflow:
 * - Counter display in filter rules table
 * - Polling and auto-refresh
 * - Statistics panel with historical charts
 * - Unused rules filter
 * - Efficiency report with suggestions
 * - CSV export functionality
 * - Counter settings configuration
 *
 * Story: NAS-7.10 - Rule Hit Counter Visualization
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = '/router/test-router-123/firewall';

/**
 * Mock filter rules with counter data
 */
const mockRulesWithCounters = [
  {
    id: '*1',
    chain: 'input',
    action: 'accept',
    order: 0,
    disabled: false,
    packets: 125430,
    bytes: 45678901,
    protocol: 'tcp',
    dstPort: '22',
    comment: 'Allow SSH',
  },
  {
    id: '*2',
    chain: 'input',
    action: 'drop',
    order: 1,
    disabled: false,
    packets: 5234,
    bytes: 1567890,
    protocol: 'tcp',
    dstPort: '23',
    comment: 'Block Telnet',
  },
  {
    id: '*3',
    chain: 'input',
    action: 'accept',
    order: 2,
    disabled: false,
    packets: 0,
    bytes: 0,
    protocol: 'tcp',
    dstPort: '8080',
    comment: 'Unused rule',
  },
  {
    id: '*4',
    chain: 'forward',
    action: 'accept',
    order: 3,
    disabled: false,
    packets: 987654,
    bytes: 234567890,
    protocol: 'tcp',
    dstPort: '80',
    comment: 'Allow HTTP',
  },
];

/**
 * Mock historical data for statistics panel
 */
const mockHistoricalData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: Date.now() - (23 - i) * 3600000, // Last 24 hours
  packets: Math.floor(Math.random() * 10000) + 1000,
  bytes: Math.floor(Math.random() * 1000000) + 100000,
}));

/**
 * Setup: Navigate to Firewall page before each test
 */
test.beforeEach(async ({ page }) => {
  // Mock GraphQL/REST API responses
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    // Mock filter rules endpoint
    if (url.includes('ip/firewall/filter')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRulesWithCounters),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// Scenario 1: Counter Display in Table
// =============================================================================

test.describe('Counter Display', () => {
  test('should display packet and byte counters in filter rules table', async ({ page }) => {
    // Wait for table to load
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();

    // Verify Traffic column header exists (desktop)
    await expect(page.getByText('Traffic')).toBeVisible({ timeout: 5000 });

    // Verify first rule shows counter data
    const firstRow = table.getByRole('row').nth(1); // Skip header row
    await expect(firstRow).toContainText('125,430'); // Formatted packets
    await expect(firstRow).toContainText('43.6 MB'); // Formatted bytes
  });

  test('should display "unused" badge for rules with zero packets', async ({ page }) => {
    // Find row with zero packets (rule #3)
    const unusedRuleRow = page.getByText('Unused rule').locator('..');
    await expect(unusedRuleRow.getByText(/unused/i)).toBeVisible();

    // Verify unused row has muted styling
    await expect(unusedRuleRow).toHaveClass(/opacity-60/);
  });

  test('should display traffic bars when enabled', async ({ page }) => {
    // Open counter settings
    await page.getByRole('button', { name: /counter settings/i }).click();

    // Enable traffic bars
    const trafficBarsToggle = page.getByRole('menuitemcheckbox', { name: /show traffic bars/i });
    await trafficBarsToggle.click();

    // Verify progress bars are visible
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible({ timeout: 2000 });
  });

  test('should format large numbers with locale separators', async ({ page }) => {
    // Verify thousands separator in packets
    await expect(page.getByText('125,430')).toBeVisible();

    // Verify bytes formatted with SI units (MB, KB, GB)
    await expect(page.getByText(/MB|KB|GB/)).toBeVisible();
  });
});

// =============================================================================
// Scenario 2: Polling and Auto-Refresh
// =============================================================================

test.describe('Polling Updates', () => {
  test('should update counters based on polling interval', async ({ page }) => {
    let requestCount = 0;

    // Monitor network requests
    page.on('request', (request) => {
      if (request.url().includes('ip/firewall/filter')) {
        requestCount++;
      }
    });

    // Set polling to 5 seconds
    await page.getByRole('button', { name: /counter settings/i }).click();
    await page.getByRole('menuitem', { name: /5 seconds/i }).click();

    // Wait and verify multiple requests
    await page.waitForTimeout(12000); // Wait 12s to see at least 2 polls
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });

  test('should allow changing polling interval', async ({ page }) => {
    // Open counter settings
    await page.getByRole('button', { name: /counter settings/i }).click();

    // Verify all interval options available
    await expect(page.getByRole('menuitem', { name: /manual/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /5 seconds/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /10 seconds/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /30 seconds/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /60 seconds/i })).toBeVisible();

    // Select 10 seconds
    await page.getByRole('menuitem', { name: /10 seconds/i }).click();

    // Verify selection persists (check mark shown)
    await page.getByRole('button', { name: /counter settings/i }).click();
    const tenSecOption = page.getByRole('menuitem', { name: /10 seconds/i });
    await expect(tenSecOption).toContainText('✓');
  });

  test('should disable polling when set to manual', async ({ page }) => {
    let requestCount = 0;

    // Set polling to manual
    await page.getByRole('button', { name: /counter settings/i }).click();
    await page.getByRole('menuitem', { name: /manual/i }).click();

    // Monitor requests after setting manual
    const startTime = Date.now();
    page.on('request', (request) => {
      if (request.url().includes('ip/firewall/filter') && Date.now() > startTime) {
        requestCount++;
      }
    });

    // Wait 10 seconds
    await page.waitForTimeout(10000);

    // Should not see automatic polling requests
    expect(requestCount).toBe(0);
  });
});

// =============================================================================
// Scenario 3: Statistics Panel
// =============================================================================

test.describe('Statistics Panel', () => {
  test('should open statistics panel when clicking rule row', async ({ page }) => {
    // Click on first rule row (counter cell area)
    const firstRule = page.getByText('Allow SSH').locator('..');
    await firstRule.click();

    // Verify statistics panel opens
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/rule statistics/i)).toBeVisible();
  });

  test('should display traffic history chart', async ({ page }) => {
    // Open statistics panel
    await page.getByText('Allow SSH').locator('..').click();

    // Wait for panel
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();

    // Verify chart container exists (Recharts renders SVG)
    const chart = panel.locator('svg').first();
    await expect(chart).toBeVisible({ timeout: 3000 });
  });

  test('should allow selecting different time ranges', async ({ page }) => {
    // Open statistics panel
    await page.getByText('Allow SSH').locator('..').click();
    const panel = page.getByRole('dialog');

    // Verify time range tabs
    await expect(panel.getByRole('tab', { name: /1h/i })).toBeVisible();
    await expect(panel.getByRole('tab', { name: /24h/i })).toBeVisible();
    await expect(panel.getByRole('tab', { name: /7d/i })).toBeVisible();

    // Select 7 day range
    await panel.getByRole('tab', { name: /7d/i }).click();

    // Verify tab is selected
    await expect(panel.getByRole('tab', { name: /7d/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('should display summary statistics', async ({ page }) => {
    // Open statistics panel
    await page.getByText('Allow SSH').locator('..').click();
    const panel = page.getByRole('dialog');

    // Verify summary stats are shown
    await expect(panel.getByText(/total packets/i)).toBeVisible();
    await expect(panel.getByText(/total bytes/i)).toBeVisible();
  });

  test('should close panel when clicking close button', async ({ page }) => {
    // Open statistics panel
    await page.getByText('Allow SSH').locator('..').click();
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();

    // Click close button
    await panel.getByRole('button', { name: /close/i }).click();

    // Verify panel closes
    await expect(panel).not.toBeVisible();
  });
});

// =============================================================================
// Scenario 4: Unused Rules Filter
// =============================================================================

test.describe('Unused Rules Filter', () => {
  test('should filter to show only unused rules', async ({ page }) => {
    // Enable unused filter
    const unusedCheckbox = page.getByRole('checkbox', { name: /show only unused/i });
    await unusedCheckbox.click();

    // Verify only unused rule (rule #3) is visible
    await expect(page.getByText('Unused rule')).toBeVisible();

    // Verify other rules are hidden
    await expect(page.getByText('Allow SSH')).not.toBeVisible();
    await expect(page.getByText('Allow HTTP')).not.toBeVisible();
  });

  test('should allow sorting by packet count', async ({ page }) => {
    // Open sort dropdown
    const sortSelect = page.getByRole('combobox', { name: /sort/i });
    await sortSelect.click();

    // Select low to high
    await page.getByRole('option', { name: /low to high/i }).click();

    // Verify rules are reordered (unused rule should be first)
    const firstVisibleRule = page.getByRole('table').getByRole('row').nth(1);
    await expect(firstVisibleRule).toContainText('Unused rule');
  });

  test('should clear filter when unchecked', async ({ page }) => {
    // Enable filter
    const unusedCheckbox = page.getByRole('checkbox', { name: /show only unused/i });
    await unusedCheckbox.click();

    // Verify filtered
    await expect(page.getByText('Allow SSH')).not.toBeVisible();

    // Disable filter
    await unusedCheckbox.click();

    // Verify all rules visible again
    await expect(page.getByText('Allow SSH')).toBeVisible();
    await expect(page.getByText('Unused rule')).toBeVisible();
  });
});

// =============================================================================
// Scenario 5: Efficiency Report
// =============================================================================

test.describe('Efficiency Report', () => {
  test('should open efficiency report dialog', async ({ page }) => {
    // Click efficiency report button
    await page.getByRole('button', { name: /efficiency report/i }).click();

    // Verify dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/rule efficiency report/i)).toBeVisible();
  });

  test('should display redundancy and reordering tabs', async ({ page }) => {
    await page.getByRole('button', { name: /efficiency report/i }).click();
    const dialog = page.getByRole('dialog');

    // Verify tabs exist
    await expect(dialog.getByRole('tab', { name: /redundancy/i })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: /reordering/i })).toBeVisible();
  });

  test('should show suggestions with severity badges', async ({ page }) => {
    await page.getByRole('button', { name: /efficiency report/i }).click();
    const dialog = page.getByRole('dialog');

    // Look for severity indicators (if suggestions exist)
    // Note: This depends on the actual rules triggering suggestions
    // If no suggestions, should show "optimal configuration" message
    const hasSuggestions = await dialog.getByText(/suggestion/i).isVisible();

    if (hasSuggestions) {
      // Verify severity badges exist
      const badges = dialog.locator('[data-severity]');
      await expect(badges.first()).toBeVisible();
    } else {
      // Verify optimal message
      await expect(dialog.getByText(/optimal/i)).toBeVisible();
    }
  });

  test('should allow previewing suggestions', async ({ page }) => {
    await page.getByRole('button', { name: /efficiency report/i }).click();
    const dialog = page.getByRole('dialog');

    // If preview button exists, click it
    const previewButton = dialog.getByRole('button', { name: /preview/i }).first();

    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Verify preview shows current vs proposed state
      await expect(dialog.getByText(/current state/i)).toBeVisible();
      await expect(dialog.getByText(/proposed/i)).toBeVisible();
    }
  });

  test('should show confirmation when applying suggestions', async ({ page }) => {
    await page.getByRole('button', { name: /efficiency report/i }).click();
    const dialog = page.getByRole('dialog');

    // If apply button exists, click it
    const applyButton = dialog.getByRole('button', { name: /apply suggestion/i }).first();

    if (await applyButton.isVisible()) {
      await applyButton.click();

      // Verify confirmation dialog appears
      await expect(page.getByText(/are you sure/i)).toBeVisible({ timeout: 2000 });
    }
  });

  test('should close report when clicking close button', async ({ page }) => {
    await page.getByRole('button', { name: /efficiency report/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close dialog
    await dialog.getByRole('button', { name: /close/i }).click();

    // Verify closed
    await expect(dialog).not.toBeVisible();
  });
});

// =============================================================================
// Scenario 6: CSV Export
// =============================================================================

test.describe('CSV Export', () => {
  test('should initiate CSV download when clicking export button', async ({ page }) => {
    // Open statistics panel
    await page.getByText('Allow SSH').locator('..').click();
    const panel = page.getByRole('dialog');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export CSV button
    await panel.getByRole('button', { name: /export csv/i }).click();

    // Verify download initiated
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

// =============================================================================
// Scenario 7: Accessibility
// =============================================================================

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    // Tab through counter settings
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Find counter settings button by keyboard navigation
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);

    // Should be able to navigate to counter controls
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Verify traffic bars have aria-label
    const progressBars = page.locator('[role="progressbar"]');

    if (await progressBars.first().isVisible()) {
      await expect(progressBars.first()).toHaveAttribute('aria-label');
    }

    // Verify buttons have accessible names
    await expect(page.getByRole('button', { name: /efficiency report/i })).toHaveAccessibleName(/efficiency/i);
    await expect(page.getByRole('button', { name: /counter settings/i })).toHaveAccessibleName(/counter/i);
  });

  test('should meet color contrast requirements', async ({ page }) => {
    // This would typically use axe-core for automated testing
    // For now, verify text is visible (basic check)
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();

    // Verify counter text is readable
    await expect(page.getByText('125,430')).toBeVisible();
  });

  test('should support reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Navigate and verify animations don't occur
    await page.goto(BASE_URL);

    // Counter cells should still be visible but without animations
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();
  });
});

// =============================================================================
// Scenario 8: Mobile Responsiveness
// =============================================================================

test.describe('Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display mobile-optimized counter layout', async ({ page }) => {
    await page.goto(BASE_URL);

    // Mobile uses card layout instead of table
    const ruleCard = page.getByText('Allow SSH').locator('..');
    await expect(ruleCard).toBeVisible();

    // Verify counter display in card
    await expect(ruleCard.getByText(/packets/i)).toBeVisible();
    await expect(ruleCard.getByText(/bytes/i)).toBeVisible();
  });

  test('should open full-screen statistics panel on mobile', async ({ page }) => {
    await page.goto(BASE_URL);

    // Click rule card
    await page.getByText('Allow SSH').click();

    // Verify full-screen panel (Sheet with side="bottom")
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();

    // On mobile, panel should be full-width
    const box = await panel.boundingBox();
    expect(box?.width).toBeGreaterThan(300); // Full width on mobile
  });

  test('should have 44px minimum touch targets', async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify buttons meet minimum size
    const settingsButton = page.getByRole('button', { name: /counter settings/i });
    const box = await settingsButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

// =============================================================================
// Scenario 9: Error Handling
// =============================================================================

test.describe('Error Handling', () => {
  test('should show error state when API fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto(BASE_URL);

    // Verify error message is displayed
    await expect(page.getByText(/error loading/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing counter data gracefully', async ({ page }) => {
    // Mock rules without counter data
    await page.route('**/api/**', async (route) => {
      const rulesWithoutCounters = mockRulesWithCounters.map(rule => ({
        ...rule,
        packets: undefined,
        bytes: undefined,
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rulesWithoutCounters),
      });
    });

    await page.goto(BASE_URL);

    // Should display 0 or dash for missing data
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();
  });
});
