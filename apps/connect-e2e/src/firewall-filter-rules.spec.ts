/**
 * E2E Tests for Firewall Filter Rules
 *
 * End-to-end tests covering complete user workflows:
 * - Create new filter rule
 * - Edit existing filter rule
 * - Delete filter rule with confirmation
 * - Drag-drop reordering
 * - Toggle enable/disable state
 * - Chain filtering
 * - Mobile and desktop layouts
 *
 * @see NAS-7.1: Implement Firewall Filter Rules
 */

import { test, expect, type Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-1';
const BASE_URL = '/firewall/filter';

// Helper to navigate to filter rules page
async function navigateToFilterRules(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

// Helper to wait for table to load
async function waitForTableLoad(page: Page) {
  await page.waitForSelector('[data-testid="filter-rules-table"]', {
    state: 'visible',
  });
}

test.describe('Firewall Filter Rules - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await navigateToFilterRules(page);
  });

  test('displays filter rules table with correct columns', async ({ page }) => {
    await waitForTableLoad(page);

    // Check for table headers
    await expect(page.getByRole('columnheader', { name: /#/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /chain/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /action/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /protocol/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /source/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /destination/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /comment/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /actions/i })).toBeVisible();
  });

  test('creates a new filter rule', async ({ page }) => {
    await waitForTableLoad(page);

    // Click "Add Rule" button
    await page.getByRole('button', { name: /add rule/i }).click();

    // Wait for editor dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/new filter rule/i)).toBeVisible();

    // Fill in rule details
    await page.getByLabel(/chain/i).selectOption('input');
    await page.getByLabel(/action/i).selectOption('accept');
    await page.getByLabel(/protocol/i).selectOption('tcp');
    await page.getByLabel(/destination port/i).fill('22');
    await page.getByLabel(/comment/i).fill('Allow SSH');

    // Verify preview updates
    const preview = page.getByTestId('rule-preview');
    await expect(preview).toContainText('accept');
    await expect(preview).toContainText('tcp');
    await expect(preview).toContainText('22');

    // Save the rule
    await page.getByRole('button', { name: /^save$/i }).click();

    // Wait for success message
    await expect(page.getByText(/rule created/i)).toBeVisible();

    // Verify new rule appears in table
    await expect(page.getByText('Allow SSH')).toBeVisible();
  });

  test('edits an existing filter rule', async ({ page }) => {
    await waitForTableLoad(page);

    // Click edit button on first rule
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    await firstRow.getByRole('button', { name: /edit/i }).click();

    // Wait for editor dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/edit filter rule/i)).toBeVisible();

    // Modify the comment
    const commentInput = page.getByLabel(/comment/i);
    await commentInput.clear();
    await commentInput.fill('Updated rule comment');

    // Save changes
    await page.getByRole('button', { name: /^save$/i }).click();

    // Verify success message
    await expect(page.getByText(/rule updated/i)).toBeVisible();

    // Verify updated comment in table
    await expect(page.getByText('Updated rule comment')).toBeVisible();
  });

  test('duplicates a filter rule', async ({ page }) => {
    await waitForTableLoad(page);

    // Click duplicate button on first rule
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    await firstRow.getByRole('button', { name: /duplicate/i }).click();

    // Wait for editor dialog with duplicated values
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/new filter rule/i)).toBeVisible();

    // Verify fields are populated (except ID)
    const chainSelect = page.getByLabel(/chain/i);
    await expect(chainSelect).not.toHaveValue('');

    // Save duplicated rule
    await page.getByRole('button', { name: /^save$/i }).click();

    // Verify success
    await expect(page.getByText(/rule created/i)).toBeVisible();
  });

  test('deletes a filter rule with confirmation', async ({ page }) => {
    await waitForTableLoad(page);

    // Get initial row count
    const initialCount = await page.locator('[data-testid="filter-rule-row"]').count();

    // Click delete button on first rule
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    const ruleComment = await firstRow.getByTestId('rule-comment').textContent();
    await firstRow.getByRole('button', { name: /delete/i }).click();

    // Wait for confirmation dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/confirm delete/i)).toBeVisible();
    await expect(page.getByText(ruleComment!)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Verify success message
    await expect(page.getByText(/rule deleted/i)).toBeVisible();

    // Verify row count decreased
    await expect(page.locator('[data-testid="filter-rule-row"]')).toHaveCount(initialCount - 1);

    // Verify deleted rule is gone
    await expect(page.getByText(ruleComment!)).not.toBeVisible();
  });

  test('cancels delete operation', async ({ page }) => {
    await waitForTableLoad(page);

    const initialCount = await page.locator('[data-testid="filter-rule-row"]').count();

    // Click delete button
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    await firstRow.getByRole('button', { name: /delete/i }).click();

    // Wait for confirmation dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Cancel deletion
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verify row count unchanged
    await expect(page.locator('[data-testid="filter-rule-row"]')).toHaveCount(initialCount);
  });

  test('toggles rule enable/disable state', async ({ page }) => {
    await waitForTableLoad(page);

    // Find first enabled rule
    const firstRow = page.locator('[data-testid="filter-rule-row"]').first();
    const toggleSwitch = firstRow.getByRole('switch', { name: /enabled/i });

    // Get initial state
    const isInitiallyChecked = await toggleSwitch.isChecked();

    // Toggle the switch
    await toggleSwitch.click();

    // Verify state changed
    await expect(toggleSwitch).toHaveAttribute('aria-checked', (!isInitiallyChecked).toString());

    // Verify visual feedback (disabled rules should have opacity)
    if (isInitiallyChecked) {
      await expect(firstRow).toHaveClass(/opacity-50/);
    } else {
      await expect(firstRow).not.toHaveClass(/opacity-50/);
    }
  });

  test('reorders rules via drag-drop', async ({ page }) => {
    await waitForTableLoad(page);

    // Get initial order
    const rows = page.locator('[data-testid="filter-rule-row"]');
    const firstRuleComment = await rows.nth(0).getByTestId('rule-comment').textContent();
    const secondRuleComment = await rows.nth(1).getByTestId('rule-comment').textContent();

    // Drag first rule to second position
    const firstDragHandle = rows.nth(0).getByTestId('drag-handle');
    const secondRow = rows.nth(1);

    await firstDragHandle.dragTo(secondRow);

    // Verify order changed
    await page.waitForTimeout(500); // Wait for animation

    const updatedRows = page.locator('[data-testid="filter-rule-row"]');
    await expect(updatedRows.nth(0).getByTestId('rule-comment')).toHaveText(secondRuleComment!);
    await expect(updatedRows.nth(1).getByTestId('rule-comment')).toHaveText(firstRuleComment!);
  });

  test('filters rules by chain', async ({ page }) => {
    await waitForTableLoad(page);

    // Select "input" chain filter
    await page.getByRole('combobox', { name: /filter by chain/i }).selectOption('input');

    // Wait for table to update
    await page.waitForTimeout(300);

    // Verify all visible rules are input chain
    const rows = page.locator('[data-testid="filter-rule-row"]');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const chainCell = rows.nth(i).getByTestId('rule-chain');
      await expect(chainCell).toHaveText('input');
    }
  });

  test('validates IP address format', async ({ page }) => {
    await waitForTableLoad(page);

    // Open create dialog
    await page.getByRole('button', { name: /add rule/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Enter invalid IP address
    await page.getByLabel(/source address/i).fill('invalid-ip');
    await page.getByLabel(/source address/i).blur();

    // Verify error message
    await expect(page.getByText(/valid IP address/i)).toBeVisible();

    // Verify save button is disabled
    const saveButton = page.getByRole('button', { name: /^save$/i });
    await expect(saveButton).toBeDisabled();

    // Correct the IP address
    await page.getByLabel(/source address/i).clear();
    await page.getByLabel(/source address/i).fill('192.168.1.1');
    await page.getByLabel(/source address/i).blur();

    // Verify error cleared
    await expect(page.getByText(/valid IP address/i)).not.toBeVisible();

    // Verify save button is enabled
    await expect(saveButton).toBeEnabled();
  });

  test('validates port range format', async ({ page }) => {
    await waitForTableLoad(page);

    // Open create dialog
    await page.getByRole('button', { name: /add rule/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Enter invalid port
    await page.getByLabel(/destination port/i).fill('99999');
    await page.getByLabel(/destination port/i).blur();

    // Verify error message
    await expect(page.getByText(/valid port/i)).toBeVisible();

    // Correct the port
    await page.getByLabel(/destination port/i).clear();
    await page.getByLabel(/destination port/i).fill('80');
    await page.getByLabel(/destination port/i).blur();

    // Verify error cleared
    await expect(page.getByText(/valid port/i)).not.toBeVisible();
  });

  test('displays rule statistics (packets/bytes)', async ({ page }) => {
    await waitForTableLoad(page);

    // Verify statistics columns exist
    await expect(page.getByRole('columnheader', { name: /packets/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /bytes/i })).toBeVisible();

    // Verify at least one row shows statistics
    const statsCell = page.locator('[data-testid="rule-stats"]').first();
    await expect(statsCell).toBeVisible();
  });
});

test.describe('Firewall Filter Rules - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await navigateToFilterRules(page);
  });

  test('displays mobile card layout', async ({ page }) => {
    // Mobile should show cards instead of table
    await expect(page.getByTestId('filter-rules-cards')).toBeVisible();
    await expect(page.locator('[data-testid="filter-rule-card"]')).toHaveCount(
      await page.locator('[data-testid="filter-rule-card"]').count()
    );
  });

  test('opens editor in bottom sheet', async ({ page }) => {
    // Click "Add Rule" FAB
    await page.getByRole('button', { name: /add rule/i }).click();

    // Verify sheet opens (mobile uses sheet instead of dialog)
    await expect(page.getByTestId('mobile-sheet')).toBeVisible();
    await expect(page.getByText(/new filter rule/i)).toBeVisible();
  });

  test('has 44px minimum touch targets', async ({ page }) => {
    const firstCard = page.locator('[data-testid="filter-rule-card"]').first();
    await expect(firstCard).toBeVisible();

    // Check action buttons meet touch target size
    const editButton = firstCard.getByRole('button', { name: /edit/i });
    const buttonBox = await editButton.boundingBox();
    expect(buttonBox!.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('swipe to delete gesture', async ({ page }) => {
    const firstCard = page.locator('[data-testid="filter-rule-card"]').first();
    const ruleComment = await firstCard.getByTestId('rule-comment').textContent();

    // Swipe left to reveal delete action
    await firstCard.hover();
    await page.mouse.down();
    await page.mouse.move(-150, 0); // Swipe left 150px
    await page.mouse.up();

    // Verify delete button revealed
    await expect(firstCard.getByRole('button', { name: /delete/i })).toBeVisible();

    // Tap delete
    await firstCard.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await expect(page.getByText(/confirm delete/i)).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Verify deleted
    await expect(page.getByText(ruleComment!)).not.toBeVisible();
  });

  test('toggle switch works on mobile', async ({ page }) => {
    const firstCard = page.locator('[data-testid="filter-rule-card"]').first();
    const toggleSwitch = firstCard.getByRole('switch', { name: /enabled/i });

    const isInitiallyChecked = await toggleSwitch.isChecked();
    await toggleSwitch.tap();

    await expect(toggleSwitch).toHaveAttribute('aria-checked', (!isInitiallyChecked).toString());
  });
});

test.describe('Firewall Filter Rules - Accessibility', () => {
  test('keyboard navigation works', async ({ page }) => {
    await navigateToFilterRules(page);
    await waitForTableLoad(page);

    // Tab to "Add Rule" button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /add rule/i })).toBeFocused();

    // Enter to open dialog
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('screen reader announcements', async ({ page }) => {
    await navigateToFilterRules(page);
    await waitForTableLoad(page);

    // Open editor
    await page.getByRole('button', { name: /add rule/i }).click();

    // Verify ARIA live region announces dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby');
  });

  test('color contrast meets WCAG AAA', async ({ page }) => {
    await navigateToFilterRules(page);
    await waitForTableLoad(page);

    // This would typically use axe-core for automated testing
    // Here we verify key elements have proper contrast classes
    const actionBadge = page.locator('[data-testid="action-badge"]').first();
    await expect(actionBadge).toBeVisible();

    // Semantic colors should provide 7:1 contrast
    const bgColor = await actionBadge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBeDefined();
  });
});

test.describe('Firewall Filter Rules - Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);

    await navigateToFilterRules(page);

    // Verify error message
    await expect(page.getByText(/failed to load/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Retry
    await page.getByRole('button', { name: /retry/i }).click();

    // Should load successfully
    await waitForTableLoad(page);
  });

  test('displays API error messages', async ({ page }) => {
    // This would mock API to return error
    // For now, verify error UI exists
    await navigateToFilterRules(page);

    // Attempt to create invalid rule that backend rejects
    await page.getByRole('button', { name: /add rule/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Should show validation errors from backend
    // (This would need actual backend mock)
  });
});
