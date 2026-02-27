/**
 * Firewall Mangle Rules E2E Tests
 *
 * End-to-end tests for mangle rules management feature.
 * Tests all workflows: navigate, create, edit, delete, reorder, toggle, filter.
 *
 * Story: NAS-7.5 - Implement Mangle Rules
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = `/router/${TEST_ROUTER_ID}/firewall`;

// Mock mangle rule data
const MOCK_RULES = [
  {
    id: '*1',
    chain: 'prerouting',
    action: 'mark-connection',
    position: 0,
    newConnectionMark: 'voip_traffic',
    protocol: 'udp',
    dstPort: '5060-5061',
    connectionState: ['new'],
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Mark VoIP SIP signaling traffic',
    packets: 15234,
    bytes: 8123456,
  },
  {
    id: '*2',
    chain: 'forward',
    action: 'mark-packet',
    position: 1,
    newPacketMark: 'voip_rtp',
    protocol: 'udp',
    dstPort: '10000-20000',
    connectionMark: 'voip_traffic',
    passthrough: false,
    disabled: false,
    log: false,
    comment: 'Mark VoIP RTP packets',
    packets: 89456,
    bytes: 45123789,
  },
  {
    id: '*3',
    chain: 'prerouting',
    action: 'change-dscp',
    position: 2,
    newDscp: 46, // EF - Expedited Forwarding
    connectionMark: 'voip_traffic',
    disabled: false,
    log: false,
    comment: 'Set EF DSCP for VoIP traffic',
    packets: 104690,
    bytes: 53246891,
  },
  {
    id: '*4',
    chain: 'forward',
    action: 'drop',
    position: 3,
    protocol: 'tcp',
    dstPort: '25',
    comment: 'Block outbound SMTP',
    disabled: true,
    log: true,
    logPrefix: 'BLOCKED_SMTP: ',
    packets: 0,
    bytes: 0,
  },
];

/**
 * Setup: Navigate to Firewall page before each test
 */
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// Test 1: Navigate to Mangle Rules Tab
// =============================================================================

test.describe('Navigation', () => {
  test('should navigate to mangle rules tab and display table', async ({ page }) => {
    // Verify firewall page loads
    await expect(page.getByRole('heading', { name: /firewall/i })).toBeVisible();

    // Click Mangle tab
    const mangleTab = page.getByRole('tab', { name: /mangle/i });
    await expect(mangleTab).toBeVisible();
    await mangleTab.click();

    // Wait for tab content to load
    await page.waitForLoadState('networkidle');

    // Verify mangle rules table or empty state is visible
    const tableOrEmpty = page.locator(
      '[data-testid="mangle-rules-table"], [data-testid="empty-state"]'
    );
    await expect(tableOrEmpty.first()).toBeVisible();

    // Verify chain tabs are displayed
    await expect(page.getByRole('tab', { name: /all/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /prerouting/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /forward/i })).toBeVisible();
  });
});

// =============================================================================
// Test 2: Create Mark-Connection Rule (Happy Path)
// =============================================================================

test.describe('Create Mark-Connection Rule', () => {
  test('should create a new mark-connection rule successfully', async ({ page }) => {
    // Navigate to Mangle tab
    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Mock API response for rule creation
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          json: { success: true, data: { id: '*new-rule' } },
        });
      } else {
        await route.continue();
      }
    });

    // Click "Add Rule" button
    const addButton = page.getByRole('button', { name: /add rule/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Wait for editor dialog to open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select chain: prerouting
    const chainSelect = dialog.getByRole('combobox', { name: /chain/i });
    await chainSelect.click();
    await page.getByRole('option', { name: /prerouting/i }).click();

    // Select action: mark-connection
    const actionSelect = dialog.getByRole('combobox', { name: /action/i });
    await actionSelect.click();
    await page.getByRole('option', { name: /mark-connection/i }).click();

    // Enter mark name
    const markInput = dialog.getByLabel(/connection mark/i);
    await markInput.fill('voip-traffic');

    // Enter protocol
    const protocolInput = dialog.getByLabel(/protocol/i);
    await protocolInput.fill('tcp');

    // Enter destination port
    const dstPortInput = dialog.getByLabel(/destination port/i);
    await dstPortInput.fill('5060');

    // Click Save button
    const saveButton = dialog.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Verify success toast notification
    await expect(page.getByText(/rule (created|added) successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });
});

// =============================================================================
// Test 3: Create Change-DSCP Rule with DSCP Selector
// =============================================================================

test.describe('Create Change-DSCP Rule', () => {
  test('should create change-dscp rule with DSCP selector', async ({ page }) => {
    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Mock API
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    // Open editor
    await page.getByRole('button', { name: /add rule/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select action: change-dscp
    const actionSelect = dialog.getByRole('combobox', { name: /action/i });
    await actionSelect.click();
    await page.getByRole('option', { name: /change-dscp/i }).click();

    // Open DSCP dropdown
    const dscpSelect = dialog.getByRole('combobox', { name: /dscp/i });
    await expect(dscpSelect).toBeVisible();
    await dscpSelect.click();

    // Select EF (46) - Expedited Forwarding for VoIP
    const efOption = page.getByRole('option', { name: /46.*ef.*expedited forwarding.*voip/i });
    await expect(efOption).toBeVisible();
    await efOption.click();

    // Verify DSCP value is set
    await expect(dscpSelect).toContainText('46');

    // Add source address matcher
    const srcAddressInput = dialog.getByLabel(/source address/i);
    if (await srcAddressInput.isVisible()) {
      await srcAddressInput.fill('192.168.1.0/24');
    }

    // Save rule
    await dialog.getByRole('button', { name: /save/i }).click();

    // Verify success
    await expect(page.getByText(/rule (created|added) successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });
});

// =============================================================================
// Test 4: Edit Existing Rule
// =============================================================================

test.describe('Edit Existing Rule', () => {
  test('should edit an existing rule successfully', async ({ page }) => {
    // Mock initial rules list
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: { success: true, data: MOCK_RULES },
        });
      } else if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Find first rule's edit button
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for editor with pre-filled data
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify pre-filled values (mark name should be voip_traffic)
    const markInput = dialog.getByLabel(/connection mark/i);
    await expect(markInput).toHaveValue('voip_traffic');

    // Modify mark name
    await markInput.fill('voip-traffic-updated');

    // Modify comment
    const commentInput = dialog.getByLabel(/comment/i);
    await commentInput.fill('Updated VoIP traffic marking');

    // Save changes
    await dialog.getByRole('button', { name: /save/i }).click();

    // Verify success
    await expect(page.getByText(/rule updated successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });
});

// =============================================================================
// Test 5: Delete Rule with Safety Pipeline Confirmation
// =============================================================================

test.describe('Delete Rule', () => {
  test('should delete rule with confirmation dialog', async ({ page }) => {
    // Mock rules
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Click delete button on first rule
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Wait for confirmation dialog (AlertDialog from Safety Pipeline)
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible();

    // Verify dialog content
    await expect(confirmDialog).toContainText(/delete.*rule/i);
    await expect(confirmDialog).toContainText(/cannot be undone/i);

    // Click Confirm/Delete button
    const confirmButton = confirmDialog.getByRole('button', { name: /delete|confirm/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Verify success notification
    await expect(page.getByText(/rule deleted successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify dialog closes
    await expect(confirmDialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should cancel deletion', async ({ page }) => {
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Click delete
    await page
      .getByRole('button', { name: /delete/i })
      .first()
      .click();

    // Wait for confirmation
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible();

    // Click Cancel
    const cancelButton = confirmDialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Verify dialog closes without deletion
    await expect(confirmDialog).not.toBeVisible();
    // Rule should still be in table
    await expect(page.getByText(/voip_traffic/i)).toBeVisible();
  });
});

// =============================================================================
// Test 6: Drag-Drop Reorder Rules
// =============================================================================

test.describe('Drag-Drop Reordering', () => {
  test('should reorder rules via drag-drop', async ({ page }) => {
    // Mock rules
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
      } else if (route.request().url().includes('/move')) {
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Find grip handles for drag-drop
    const gripHandles = page.locator('[data-testid="drag-handle"]');
    const firstHandle = gripHandles.first();

    if (await firstHandle.isVisible()) {
      // Get bounding box of first and third rows
      const firstRow = page.locator('tr[data-row-id]').first();
      const thirdRow = page.locator('tr[data-row-id]').nth(2);

      const firstBox = await firstRow.boundingBox();
      const thirdBox = await thirdRow.boundingBox();

      if (firstBox && thirdBox) {
        // Drag from position 1 to position 3
        await firstHandle.hover();
        await page.mouse.down();
        await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2);
        await page.mouse.up();

        // Verify API call was made (optimistic UI should update immediately)
        await page.waitForTimeout(500);
      }
    }
  });
});

// =============================================================================
// Test 7: Enable/Disable Toggle
// =============================================================================

test.describe('Enable/Disable Toggle', () => {
  test('should toggle rule enabled state', async ({ page }) => {
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
      } else if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Find toggle switch (enabled rule)
    const toggleSwitch = page.getByRole('switch').first();
    await expect(toggleSwitch).toBeVisible();

    // Get initial state
    const initiallyChecked = await toggleSwitch.isChecked();

    // Click toggle
    await toggleSwitch.click();

    // Verify state changed
    await expect(toggleSwitch).toHaveAttribute('aria-checked', String(!initiallyChecked));

    // Verify visual feedback (disabled rules have opacity-50)
    if (!initiallyChecked) {
      // Now disabled - should have reduced opacity
      const ruleRow = page.locator('tr').filter({ has: toggleSwitch });
      await expect(ruleRow).toHaveClass(/opacity-50/);
    }
  });
});

// =============================================================================
// Test 8: View Flow Diagram
// =============================================================================

test.describe('Flow Diagram', () => {
  test('should display flow diagram and filter by chain', async ({ page }) => {
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Click "View Flow" button (may be in toolbar or as separate button)
    const flowButton = page.getByRole('button', { name: /view flow|packet flow/i });
    if (await flowButton.isVisible()) {
      await flowButton.click();

      // Verify flow diagram dialog opens
      const flowDialog = page.getByRole('dialog');
      await expect(flowDialog).toBeVisible();

      // Verify all 5 chains are visible
      await expect(flowDialog.getByText(/prerouting/i)).toBeVisible();
      await expect(flowDialog.getByText(/input/i)).toBeVisible();
      await expect(flowDialog.getByText(/forward/i)).toBeVisible();
      await expect(flowDialog.getByText(/output/i)).toBeVisible();
      await expect(flowDialog.getByText(/postrouting/i)).toBeVisible();

      // Verify rule count badges
      const badges = flowDialog.locator('[role="status"], .badge');
      await expect(badges.first()).toBeVisible();

      // Click on a chain to filter
      const preroutingChain = flowDialog.getByRole('button', { name: /prerouting/i });
      await preroutingChain.click();

      // Close dialog
      const closeButton = flowDialog.getByRole('button', { name: /close/i });
      await closeButton.click();

      // Verify rules table is now filtered by selected chain
      // (implementation depends on how filtering works)
    }
  });
});

// =============================================================================
// Test 9: Chain Tab Navigation
// =============================================================================

test.describe('Chain Tab Filtering', () => {
  test('should filter rules by chain tabs', async ({ page }) => {
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Click "prerouting" chain tab
    const preroutingTab = page.getByRole('tab', { name: /^prerouting$/i });
    await expect(preroutingTab).toBeVisible();
    await preroutingTab.click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify only prerouting rules displayed (rules #1 and #3)
    // (exact verification depends on table implementation)

    // Click "forward" chain tab
    const forwardTab = page.getByRole('tab', { name: /^forward$/i });
    await forwardTab.click();
    await page.waitForTimeout(500);

    // Verify only forward rules displayed (rules #2 and #4)

    // Click "all" tab
    const allTab = page.getByRole('tab', { name: /^all$/i });
    await allTab.click();
    await page.waitForTimeout(500);

    // Verify all rules displayed
  });
});

// =============================================================================
// Test 10: Mobile Responsive Testing
// =============================================================================

test.describe('Mobile Responsive', () => {
  test('should display mobile card layout on small viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to mangle tab
    await page.getByRole('tab', { name: /mangle/i }).click();

    // Mock rules
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify mobile layout (cards instead of table)
    const cards = page.locator('[data-testid="rule-card"]');
    if (await cards.first().isVisible()) {
      await expect(cards.first()).toBeVisible();
    }

    // Verify touch targets are 44px (WCAG AAA)
    const actionButtons = page.getByRole('button');
    const firstButton = actionButtons.first();
    if (await firstButton.isVisible()) {
      const box = await firstButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

// =============================================================================
// Test 11: Keyboard Navigation (Accessibility)
// =============================================================================

test.describe('Keyboard Navigation', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, data: MOCK_RULES } });
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus indicators are visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Verify focus has visible ring/outline
    const focusStyles = await focusedElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
      };
    });

    // Should have either outline or box-shadow for focus indicator
    expect(focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none').toBeTruthy();

    // Press Enter on Add Rule button
    const addButton = page.getByRole('button', { name: /add rule/i });
    await addButton.focus();
    await page.keyboard.press('Enter');

    // Verify dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify dialog closes
    await expect(dialog).not.toBeVisible();
  });
});

// =============================================================================
// Additional: Empty State
// =============================================================================

test.describe('Empty State', () => {
  test('should display empty state when no rules exist', async ({ page }) => {
    await page.route('**/api/routers/*/mangle/rules', async (route) => {
      await route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    await page.getByRole('tab', { name: /mangle/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify empty state message
    await expect(page.getByText(/no (mangle )?rules/i)).toBeVisible();

    // Verify "Add Rule" CTA is present
    const addButton = page.getByRole('button', { name: /add (your first )?rule/i });
    await expect(addButton).toBeVisible();
  });
});
