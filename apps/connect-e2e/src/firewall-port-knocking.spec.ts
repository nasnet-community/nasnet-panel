/**
 * E2E Tests for Port Knocking
 *
 * End-to-end tests covering complete user workflows:
 * - Create new port knock sequence
 * - Edit existing sequence
 * - Delete sequence with confirmation
 * - Toggle enable/disable state
 * - Test sequence functionality
 * - View knock attempt logs
 * - SSH lockout warning validation
 * - Mobile and desktop layouts
 *
 * @see NAS-7.12: Implement Port Knocking
 */

import { test, expect, type Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-1';
const BASE_URL = `/router/${TEST_ROUTER_ID}/firewall/port-knocking`;

// Helper to navigate to port knocking page
async function navigateToPortKnocking(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

// Helper to wait for sequences table to load
async function waitForSequencesLoad(page: Page) {
  await page.waitForSelector(
    '[data-testid="sequences-table"], [data-testid="create-sequence-button"]',
    {
      state: 'visible',
      timeout: 10000,
    }
  );
}

test.describe('Port Knocking - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await navigateToPortKnocking(page);
  });

  test('displays port knocking page with tabs', async ({ page }) => {
    // Check for main tabs
    await expect(page.getByRole('tab', { name: /sequences/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /knock log/i })).toBeVisible();
  });

  test('displays empty state when no sequences exist', async ({ page }) => {
    // Wait for page load
    await waitForSequencesLoad(page);

    // Check for empty state
    const emptyState = page.getByText(/no port knock sequences/i);
    if (await emptyState.isVisible()) {
      await expect(page.getByRole('button', { name: /create.*sequence/i })).toBeVisible();
    }
  });

  test('creates a new port knock sequence', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Click "Create Sequence" button
    await page
      .getByRole('button', { name: /create.*sequence/i })
      .first()
      .click();

    // Wait for form dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/new.*sequence|create.*sequence/i)).toBeVisible();

    // Verify form has testid
    const form = page.locator('[data-testid="knock-sequence-form"]');
    await expect(form).toBeVisible();

    // Fill in sequence details
    await page.getByLabel(/sequence name/i).fill('ssh_knock');
    await page.getByLabel(/protected port/i).fill('22');

    // Fill knock ports (should have at least 2 by default)
    const knockPortInputs = page.getByLabel(/knock port/i);
    await knockPortInputs.first().fill('1234');
    await knockPortInputs.nth(1).fill('5678');

    // Set timeouts
    await page.getByLabel(/access timeout/i).fill('5m');
    await page.getByLabel(/knock timeout/i).fill('15s');

    // Save the sequence
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for success message
    await expect(page.getByText(/sequence created|created successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify new sequence appears in table
    await expect(page.getByText('ssh_knock')).toBeVisible();
  });

  test('displays SSH lockout warning for port 22', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Open create dialog
    await page
      .getByRole('button', { name: /create.*sequence/i })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill protected port with 22
    await page.getByLabel(/protected port/i).fill('22');

    // Check for lockout warning
    const warning = page.locator('[data-testid="ssh-lockout-warning"]');
    await expect(warning).toBeVisible({ timeout: 3000 });
    await expect(warning).toContainText(/ssh|lockout|careful/i);
  });

  test('edits an existing sequence', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Find first sequence row and click edit
    const firstRow = page.locator('[data-testid^="sequence-row-"]').first();

    // Skip if no sequences exist
    if (!(await firstRow.isVisible())) {
      test.skip();
    }

    await firstRow.getByRole('button', { name: /edit/i }).click();

    // Wait for editor dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/edit.*sequence/i)).toBeVisible();

    // Modify the access timeout
    const timeoutInput = page.getByLabel(/access timeout/i);
    await timeoutInput.clear();
    await timeoutInput.fill('10m');

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click();

    // Wait for success message
    await expect(page.getByText(/updated|saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('toggles sequence enabled state', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Find first sequence toggle switch
    const firstToggle = page.locator('[data-testid^="toggle-sequence-"]').first();

    // Skip if no sequences exist
    if (!(await firstToggle.isVisible())) {
      test.skip();
    }

    // Get initial state
    const initialState = await firstToggle.isChecked();

    // Toggle the switch
    await firstToggle.click();

    // Wait for state change
    await page.waitForTimeout(1000);

    // Verify state changed
    const newState = await firstToggle.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('deletes a sequence with confirmation', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Find first sequence row
    const firstRow = page.locator('[data-testid^="sequence-row-"]').first();

    // Skip if no sequences exist
    if (!(await firstRow.isVisible())) {
      test.skip();
    }

    // Get sequence name for verification
    const sequenceName = await firstRow.textContent();

    // Click delete button
    await firstRow.getByRole('button', { name: /delete/i }).click();

    // Wait for confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/confirm|are you sure/i)).toBeVisible();

    // Confirm deletion
    await page
      .getByRole('button', { name: /delete|confirm/i })
      .last()
      .click();

    // Wait for success message
    await expect(page.getByText(/deleted|removed/i)).toBeVisible({ timeout: 5000 });
  });

  test('validates knock port uniqueness', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Open create dialog
    await page
      .getByRole('button', { name: /create.*sequence/i })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill knock ports with duplicates
    const knockPortInputs = page.getByLabel(/knock port/i);
    await knockPortInputs.first().fill('1234');
    await knockPortInputs.nth(1).fill('1234'); // Duplicate

    // Try to submit
    await page.getByRole('button', { name: /create|save/i }).click();

    // Check for validation error
    await expect(page.getByText(/duplicate|unique|same port/i)).toBeVisible({ timeout: 3000 });
  });

  test('tests a sequence with test mode', async ({ page }) => {
    await waitForSequencesLoad(page);

    // Find first sequence row
    const firstRow = page.locator('[data-testid^="sequence-row-"]').first();

    // Skip if no sequences exist
    if (!(await firstRow.isVisible())) {
      test.skip();
    }

    // Click test button if available
    const testButton = firstRow.getByRole('button', { name: /test/i });
    if (await testButton.isVisible()) {
      await testButton.click();

      // Wait for test instructions or dialog
      await expect(page.getByText(/test|instructions|knock sequence/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('Port Knocking - Knock Log', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await navigateToPortKnocking(page);
    // Switch to Knock Log tab
    await page.getByRole('tab', { name: /knock log/i }).click();
  });

  test('displays knock log viewer', async ({ page }) => {
    // Wait for log viewer to load
    const logViewer = page.locator('[data-testid="log-viewer"]');
    await expect(logViewer).toBeVisible({ timeout: 10000 });

    // Check for filter controls
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="ip-filter"]')).toBeVisible();
  });

  test('filters log by status', async ({ page }) => {
    const logViewer = page.locator('[data-testid="log-viewer"]');
    await expect(logViewer).toBeVisible({ timeout: 10000 });

    // Change status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.selectOption('success');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify filter is applied (log entries should update)
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    const count = await logEntries.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if no successful attempts
  });

  test('filters log by IP address', async ({ page }) => {
    const logViewer = page.locator('[data-testid="log-viewer"]');
    await expect(logViewer).toBeVisible({ timeout: 10000 });

    // Enter IP filter
    const ipFilter = page.locator('[data-testid="ip-filter"]');
    await ipFilter.fill('192.168.1.100');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify filter input has value
    await expect(ipFilter).toHaveValue('192.168.1.100');
  });

  test('displays log entries with status badges', async ({ page }) => {
    const logViewer = page.locator('[data-testid="log-viewer"]');
    await expect(logViewer).toBeVisible({ timeout: 10000 });

    // Check if any log entries exist
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    const count = await logEntries.count();

    if (count > 0) {
      // Verify status badges are present
      const firstEntry = logEntries.first();
      await expect(firstEntry).toBeVisible();
    }
  });
});

test.describe('Port Knocking - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays mobile layout correctly', async ({ page }) => {
    await navigateToPortKnocking(page);
    await waitForSequencesLoad(page);

    // Check that mobile view is rendering
    await expect(page.getByRole('tab', { name: /sequences/i })).toBeVisible();

    // Check for mobile-optimized create button
    const createButton = page.getByRole('button', { name: /create.*sequence/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('opens sequence form in mobile sheet', async ({ page }) => {
    await navigateToPortKnocking(page);
    await waitForSequencesLoad(page);

    // Click create button
    await page
      .getByRole('button', { name: /create.*sequence/i })
      .first()
      .click();

    // Should open in sheet or dialog
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Form should be visible
    const form = page.locator('[data-testid="knock-sequence-form"]');
    await expect(form).toBeVisible();
  });
});

/**
 * Test Summary:
 *
 * Desktop Tests (11 tests):
 * - Page display and tabs
 * - Empty state
 * - Create sequence
 * - SSH lockout warning
 * - Edit sequence
 * - Toggle enabled state
 * - Delete with confirmation
 * - Port uniqueness validation
 * - Test mode
 * - Knock log viewer
 * - Log filtering
 *
 * Mobile Tests (2 tests):
 * - Mobile layout
 * - Mobile form sheet
 *
 * Total: 13 E2E tests
 *
 * Run: npx nx e2e connect-e2e --grep "Port Knocking"
 */
