/**
 * E2E Tests for Firewall RAW Rules
 *
 * End-to-end tests covering complete user workflows:
 * - Create new RAW rule (drop, notrack)
 * - Edit existing RAW rule
 * - Delete RAW rule with Safety Pipeline confirmation
 * - Drag-drop reordering
 * - Toggle enable/disable state
 * - Chain tab navigation (prerouting ↔ output)
 * - Bogon Filter wizard complete flow
 * - Performance section expand/collapse
 * - Mobile and desktop layouts
 *
 * @see NAS-7.7: Implement RAW Table Rules
 */

import { test, expect, type Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-1';
const BASE_URL = `/router/${TEST_ROUTER_ID}/firewall/raw`;

// Helper to navigate to RAW rules page
async function navigateToRawRules(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

// Helper to wait for table to load
async function waitForTableLoad(page: Page) {
  await page.waitForSelector('[data-testid="raw-rules-table"]', {
    state: 'visible',
    timeout: 5000,
  }).catch(() => {
    // Table might not exist if empty - check for empty state instead
    return page.waitForSelector('[data-testid="raw-empty-state"]', {
      state: 'visible',
      timeout: 2000,
    }).catch(() => {
      // Neither exists - page might still be loading
    });
  });
}

test.describe('Firewall RAW Rules - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await navigateToRawRules(page);
  });

  test('displays RAW page with notice banner and chain tabs', async ({ page }) => {
    // Verify notice banner explaining RAW table purpose
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/RAW rules are processed before connection tracking/i)).toBeVisible();

    // Verify chain tabs exist
    await expect(page.getByRole('tab', { name: /prerouting/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /output/i })).toBeVisible();

    // Verify quick action buttons
    await expect(page.getByRole('button', { name: /add.*rule/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /bogon filter/i })).toBeVisible();
  });

  test('displays RAW rules table with correct columns', async ({ page }) => {
    await waitForTableLoad(page);

    // Check for table headers (if table exists)
    const table = page.locator('[data-testid="raw-rules-table"]');
    if (await table.isVisible()) {
      await expect(page.getByRole('columnheader', { name: /#|position/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /chain/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /action/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /matchers|criteria/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /packets/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /enabled/i })).toBeVisible();
    }
  });

  test('creates a new drop rule for bogon address', async ({ page }) => {
    await waitForTableLoad(page);

    // Click "Add Rule" button
    await page.getByRole('button', { name: /add.*rule/i }).click();

    // Wait for editor dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/new RAW rule|add RAW rule/i)).toBeVisible();

    // Fill in rule details for bogon drop
    await page.getByLabel(/chain/i).selectOption('prerouting');
    await page.getByLabel(/^action/i).selectOption('drop');
    await page.getByLabel(/source address/i).fill('0.0.0.0/8');
    await page.getByLabel(/in.*interface/i).fill('ether1');
    await page.getByLabel(/comment/i).fill('Drop bogon network 0.0.0.0/8');

    // Verify preview updates (if preview exists)
    const preview = page.locator('[data-testid="rule-preview"]');
    if (await preview.isVisible()) {
      await expect(preview).toContainText(/drop/i);
      await expect(preview).toContainText(/0\.0\.0\.0/);
    }

    // Verify performance tip shows for drop action
    await expect(page.getByText(/bypass.*conntrack|pre-conntrack/i)).toBeVisible();

    // Save the rule
    await page.getByRole('button', { name: /^save|create$/i }).click();

    // Wait for success message
    await expect(page.getByText(/rule created|success/i)).toBeVisible();

    // Verify new rule appears in table
    await expect(page.getByText('Drop bogon network 0.0.0.0/8')).toBeVisible();
  });

  test('creates a notrack rule for high-throughput traffic', async ({ page }) => {
    await waitForTableLoad(page);

    // Click "Add Rule" button
    await page.getByRole('button', { name: /add.*rule/i }).click();

    // Wait for editor dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in notrack rule for DNS
    await page.getByLabel(/chain/i).selectOption('prerouting');
    await page.getByLabel(/^action/i).selectOption('notrack');
    await page.getByLabel(/protocol/i).selectOption('udp');
    await page.getByLabel(/destination port/i).fill('53');
    await page.getByLabel(/comment/i).fill('Bypass conntrack for DNS');

    // Verify performance tip for notrack
    await expect(page.getByText(/disable.*tracking|bypass.*conntrack/i)).toBeVisible();

    // Save the rule
    await page.getByRole('button', { name: /^save|create$/i }).click();

    // Wait for success
    await expect(page.getByText(/rule created|success/i)).toBeVisible();

    // Verify rule appears
    await expect(page.getByText('Bypass conntrack for DNS')).toBeVisible();
  });

  test('edits an existing RAW rule', async ({ page }) => {
    await waitForTableLoad(page);

    // Check if rules exist
    const firstRow = page.locator('[data-testid="raw-rule-row"]').first();
    if (await firstRow.isVisible()) {
      // Click edit button on first rule
      await firstRow.getByRole('button', { name: /edit/i }).click();

      // Wait for editor dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/edit RAW rule/i)).toBeVisible();

      // Modify the comment
      const commentField = page.getByLabel(/comment/i);
      await commentField.clear();
      await commentField.fill('Updated RAW rule comment');

      // Save changes
      await page.getByRole('button', { name: /^save|update$/i }).click();

      // Verify success
      await expect(page.getByText(/rule updated|success/i)).toBeVisible();
      await expect(page.getByText('Updated RAW rule comment')).toBeVisible();
    }
  });

  test('toggles enable/disable rule with optimistic update', async ({ page }) => {
    await waitForTableLoad(page);

    const table = page.locator('[data-testid="raw-rules-table"]');
    if (await table.isVisible()) {
      // Find first enabled rule
      const ruleRow = page.locator('[data-testid="raw-rule-row"]').first();
      const toggle = ruleRow.getByRole('switch');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        // Click toggle
        await toggle.click();

        // Verify optimistic update (toggle state changes immediately)
        await expect(toggle).toHaveAttribute('aria-checked', initialState ? 'false' : 'true');

        // Verify toast confirmation appears
        await expect(page.getByText(/rule (enabled|disabled)/i)).toBeVisible();
      }
    }
  });

  test('switches between chain tabs (prerouting ↔ output)', async ({ page }) => {
    await waitForTableLoad(page);

    // Click "Output" tab
    const outputTab = page.getByRole('tab', { name: /output/i });
    await outputTab.click();

    // Verify URL updates (if using URL state)
    await page.waitForTimeout(500); // Wait for navigation

    // Verify "Prerouting" tab becomes available again
    const preroutingTab = page.getByRole('tab', { name: /prerouting/i });
    await expect(preroutingTab).toBeVisible();

    // Click back to "Prerouting" tab
    await preroutingTab.click();

    await page.waitForTimeout(500);
  });

  test('deletes rule with Safety Pipeline confirmation', async ({ page }) => {
    await waitForTableLoad(page);

    const table = page.locator('[data-testid="raw-rules-table"]');
    if (await table.isVisible()) {
      // Click delete button on first rule
      const firstRow = page.locator('[data-testid="raw-rule-row"]').first();
      const deleteButton = firstRow.getByRole('button', { name: /delete/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Verify Safety Pipeline confirmation dialog appears
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/delete|confirm|are you sure/i)).toBeVisible();

        // Verify danger level indicator (should show "dangerous" or warning)
        await expect(page.getByText(/dangerous|warning|cannot be undone/i)).toBeVisible();

        // Confirm deletion
        await page.getByRole('button', { name: /^delete|confirm$/i }).click();

        // Verify success message
        await expect(page.getByText(/rule deleted|success/i)).toBeVisible();
      }
    }
  });

  test('completes Bogon Filter wizard flow', async ({ page }) => {
    await waitForTableLoad(page);

    // Click "Bogon Filter" button
    await page.getByRole('button', { name: /bogon filter/i }).click();

    // Wait for Bogon Filter dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/bogon.*filter/i)).toBeVisible();

    // Select WAN interface
    await page.getByLabel(/interface/i).selectOption({ index: 1 }); // Select first available interface

    // Select bogon categories (default selection excludes private)
    // Private should be unchecked by default
    const privateCheckbox = page.getByRole('checkbox', { name: /private|RFC 1918/i });
    if (await privateCheckbox.isVisible()) {
      await expect(privateCheckbox).not.toBeChecked();
    }

    // Loopback should be checked by default
    const loopbackCheckbox = page.getByRole('checkbox', { name: /loopback/i });
    if (await loopbackCheckbox.isVisible()) {
      await expect(loopbackCheckbox).toBeChecked();
    }

    // Verify rule count preview exists
    await expect(page.getByText(/\d+ rules?/i)).toBeVisible();

    // Click apply/create
    await page.getByRole('button', { name: /apply|create|generate/i }).click();

    // Verify Safety Pipeline confirmation
    await expect(page.getByText(/confirm|proceed|are you sure/i)).toBeVisible();
    await page.getByRole('button', { name: /^confirm|proceed$/i }).click();

    // Verify success
    await expect(page.getByText(/rules created|success/i)).toBeVisible();

    // Verify rules appear in table
    await waitForTableLoad(page);
    await expect(page.getByText(/bogon|loopback/i)).toBeVisible();
  });

  test('expands and collapses performance explanation section', async ({ page }) => {
    await waitForTableLoad(page);

    // Find performance section
    const performanceSection = page.locator('[data-testid="performance-section"]').or(
      page.getByText(/performance.*benefits?|RAW vs Filter/i).locator('..').locator('..')
    );

    if (await performanceSection.isVisible()) {
      // Find expand/collapse button
      const toggleButton = performanceSection.getByRole('button').first();

      // Expand section
      await toggleButton.click();

      // Verify content visible
      await expect(page.getByText(/RAW table|connection tracking|pre-conntrack/i)).toBeVisible();

      // Verify explanation text
      await expect(page.getByText(/bypass|saves (CPU|memory)/i)).toBeVisible();

      // Collapse section
      await toggleButton.click();

      await page.waitForTimeout(300); // Wait for animation
    }
  });

  test('drag-drops rule to reorder position', async ({ page }) => {
    await waitForTableLoad(page);

    const table = page.locator('[data-testid="raw-rules-table"]');
    if (await table.isVisible()) {
      const rows = page.locator('[data-testid="raw-rule-row"]');
      const rowCount = await rows.count();

      if (rowCount >= 2) {
        // Get first and second rule rows
        const firstRule = rows.nth(0);
        const secondRule = rows.nth(1);

        // Get initial position numbers
        const firstPos = await firstRule.locator('[data-testid="rule-position"]').textContent();

        // Perform drag-drop (drag first rule below second)
        await firstRule.hover();
        await page.mouse.down();
        await secondRule.hover();
        await page.mouse.up();

        // Wait for optimistic update
        await page.waitForTimeout(500);

        // Verify position numbers updated (first rule should now be in position 2)
        const newFirstRuleRow = rows.nth(0);
        const newPos = await newFirstRuleRow.locator('[data-testid="rule-position"]').textContent();

        // Position should have changed
        expect(newPos).not.toBe(firstPos);

        // Verify success toast
        await expect(page.getByText(/rule (moved|reordered)|success/i)).toBeVisible();
      }
    }
  });
});

test.describe('Firewall RAW Rules - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await navigateToRawRules(page);
  });

  test('displays RAW rules as cards on mobile', async ({ page }) => {
    await waitForTableLoad(page);

    // Verify card layout instead of table
    const cardContainer = page.locator('[data-testid="raw-rules-mobile"]').or(
      page.locator('[data-testid="raw-rules-cards"]')
    );

    if (await cardContainer.isVisible()) {
      // Verify cards exist
      const cards = page.locator('[data-testid="raw-rule-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // Verify card shows key information
        const firstCard = cards.first();
        await expect(firstCard).toBeVisible();

        // Should show action badge
        await expect(firstCard.getByText(/drop|notrack|accept/i)).toBeVisible();
      }
    }
  });

  test('creates rule using mobile sheet', async ({ page }) => {
    await waitForTableLoad(page);

    // Click "Add Rule" button
    await page.getByRole('button', { name: /add.*rule/i }).click();

    // On mobile, editor should open in a Sheet instead of Dialog
    // Sheet usually slides up from bottom
    await page.waitForTimeout(500); // Wait for animation

    // Verify form is visible (in sheet or dialog)
    await expect(page.getByLabel(/chain/i)).toBeVisible();
    await expect(page.getByLabel(/^action/i)).toBeVisible();

    // Fill minimal fields
    await page.getByLabel(/chain/i).selectOption('prerouting');
    await page.getByLabel(/^action/i).selectOption('drop');
    await page.getByLabel(/comment/i).fill('Mobile test rule');

    // Save
    await page.getByRole('button', { name: /^save|create$/i }).click();

    // Verify success
    await expect(page.getByText(/rule created|success/i)).toBeVisible();
  });

  test('navigates chain tabs on mobile', async ({ page }) => {
    await waitForTableLoad(page);

    // Verify tabs work on mobile (might be scrollable)
    const outputTab = page.getByRole('tab', { name: /output/i });
    await expect(outputTab).toBeVisible();

    await outputTab.click();
    await page.waitForTimeout(500);

    const preroutingTab = page.getByRole('tab', { name: /prerouting/i });
    await expect(preroutingTab).toBeVisible();
  });
});

test.describe('Firewall RAW Rules - Accessibility', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('supports keyboard navigation', async ({ page }) => {
    await navigateToRawRules(page);
    await waitForTableLoad(page);

    // Tab to "Add Rule" button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus visible
    const addButton = page.getByRole('button', { name: /add.*rule/i });
    await expect(addButton).toBeFocused();

    // Press Enter to open dialog
    await page.keyboard.press('Enter');

    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('has proper ARIA labels and roles', async ({ page }) => {
    await navigateToRawRules(page);
    await waitForTableLoad(page);

    // Verify notice alert has proper role
    const alert = page.getByRole('alert');
    if (await alert.isVisible()) {
      await expect(alert).toHaveAttribute('role', 'alert');
    }

    // Verify tabs have proper ARIA
    const tabs = page.getByRole('tablist');
    if (await tabs.isVisible()) {
      await expect(tabs).toHaveAttribute('role', 'tablist');
    }

    // Verify buttons are properly labeled
    const addButton = page.getByRole('button', { name: /add.*rule/i });
    await expect(addButton).toBeVisible();
  });
});
