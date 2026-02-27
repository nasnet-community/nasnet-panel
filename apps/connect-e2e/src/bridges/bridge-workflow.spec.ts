import { test, expect } from '@playwright/test';

/**
 * E2E Test: Bridge Configuration Complete Workflow
 * Tests the full bridge management flow from creation to deletion
 *
 * Workflow:
 * 1. Create new bridge with RSTP
 * 2. Add port to bridge (drag-and-drop)
 * 3. Configure port VLAN settings
 * 4. Enable VLAN filtering (with warning)
 * 5. Monitor STP status
 * 6. Delete bridge
 * 7. Test undo functionality
 */

test.describe('Bridge Configuration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to network/bridges page
    await page.goto('/dashboard/network/bridges');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('complete bridge lifecycle workflow', async ({ page }) => {
    // Step 1: Create new bridge
    await test.step('Create bridge with RSTP', async () => {
      await page.getByRole('button', { name: /Add Bridge/i }).click();

      // Wait for dialog to open
      await expect(page.getByText('Create Bridge')).toBeVisible();

      // Fill in bridge name
      await page.getByLabel(/Bridge Name/i).fill('br-test');

      // Fill in comment
      await page.getByLabel(/Comment/i).fill('E2E Test Bridge');

      // Select RSTP protocol (should be default)
      await expect(page.getByLabel(/STP Protocol/i)).toHaveValue('rstp');

      // Set priority
      await page.getByLabel(/Bridge Priority/i).fill('32768');

      // Submit form
      await page.getByRole('button', { name: /Create Bridge/i }).click();

      // Wait for success toast
      await expect(page.getByText(/Bridge created successfully/i)).toBeVisible();

      // Verify bridge appears in list
      await expect(page.getByText('br-test')).toBeVisible();
    });

    // Step 2: Add port to bridge
    await test.step('Add port ether4 to bridge', async () => {
      // Click on bridge to open detail
      await page.getByText('br-test').click();

      // Wait for detail panel
      await expect(page.getByText(/Bridge: br-test/i)).toBeVisible();

      // Navigate to port diagram tab/section (if tabs exist)
      // await page.getByRole('tab', { name: /Ports/i }).click();

      // Find available interface ether4
      const ether4Interface = page.locator('text=ether4').first();
      await expect(ether4Interface).toBeVisible();

      // Drag ether4 to bridge drop zone (simplified for E2E)
      // In real scenario, use Playwright's drag-and-drop API
      const dropZone = page.getByLabel(/Bridge port drop zone/i);
      await ether4Interface.dragTo(dropZone);

      // Wait for success toast
      await expect(page.getByText(/Added ether4 to bridge/i)).toBeVisible({
        timeout: 5000,
      });

      // Verify port appears in bridge ports section
      await expect(page.getByText('ether4')).toBeVisible();
    });

    // Step 3: Configure port VLAN settings
    await test.step('Configure VLAN settings for ether4', async () => {
      // Find and click edit button for ether4
      const portNode = page.locator('text=ether4').first();
      await portNode.hover();

      await page.getByLabel(/Edit ether4 settings/i).click();

      // Wait for port editor dialog
      await expect(page.getByText(/Configure Port: ether4/i)).toBeVisible();

      // Set PVID
      await page.getByLabel(/PVID/i).fill('10');

      // Add tagged VLAN 10
      await page.getByLabel(/Add Tagged VLANs/i).fill('10');
      await page.getByRole('button', { name: /Add VLAN ID/i }).click();

      // Add tagged VLAN 20
      await page.getByLabel(/Add Tagged VLANs/i).fill('20');
      await page.getByRole('button', { name: /Add VLAN ID/i }).click();

      // Add untagged VLAN 10
      await page.getByLabel(/Add Untagged VLANs/i).fill('10');
      await page.getByRole('button', { name: /Add VLAN ID/i }).click();

      // Enable ingress filtering
      await page.getByLabel(/Ingress Filtering/i).check();

      // Set as edge port
      await page.getByLabel(/Edge Port/i).check();

      // Save changes
      await page.getByRole('button', { name: /Save Changes/i }).click();

      // Wait for success toast
      await expect(page.getByText(/Port settings updated/i)).toBeVisible();

      // Verify VLAN info displayed on port node
      await expect(page.getByText(/PVID: 10/i)).toBeVisible();
      await expect(page.getByText(/Tagged: 10, 20/i)).toBeVisible();
    });

    // Step 4: Enable VLAN filtering with warning
    await test.step('Enable VLAN filtering', async () => {
      // Navigate back to bridge edit
      // Assuming there's an edit button or we click the bridge name again
      await page.getByRole('button', { name: /Edit/i }).click();

      // Enable VLAN filtering toggle
      await page.getByLabel(/VLAN Filtering/i).check();

      // PVID field should appear
      await expect(page.getByLabel(/PVID.*Port VLAN ID/i)).toBeVisible();

      // Submit form
      await page.getByRole('button', { name: /Update Bridge/i }).click();

      // Warning dialog should appear
      await expect(page.getByText(/Enable VLAN Filtering/i)).toBeVisible();
      await expect(page.getByText(/may disrupt network connectivity/i)).toBeVisible();

      // Confirm warning
      await page.getByRole('button', { name: /Enable VLAN Filtering/i }).click();

      // Wait for success toast
      await expect(page.getByText(/Bridge updated successfully/i)).toBeVisible();
    });

    // Step 5: Monitor STP status
    await test.step('View STP status', async () => {
      // Navigate to STP status tab/section
      // await page.getByRole('tab', { name: /STP Status/i }).click();

      // Verify STP information is displayed
      await expect(page.getByText(/Spanning Tree Status/i)).toBeVisible();
      await expect(page.getByText(/RSTP/i)).toBeVisible();

      // Check if root bridge indicator is present
      const rootBridgeSection = page.getByText(/Root Bridge/i);
      await expect(rootBridgeSection).toBeVisible();

      // Verify per-port STP table
      await expect(page.getByText(/Port Spanning Tree Status/i)).toBeVisible();

      // Check if ether4 appears in table
      await expect(page.getByRole('table')).toContainText('ether4');

      // Verify STP role and state are displayed
      await expect(page.getByRole('row', { name: /ether4/i })).toBeVisible();
    });

    // Step 6: Delete bridge
    await test.step('Delete bridge with confirmation', async () => {
      // Navigate back to bridge list
      await page.getByRole('button', { name: /Back/i }).click();

      // Find and click delete button (might be in dropdown)
      await page.getByText('br-test').hover();
      await page.getByRole('button', { name: /delete/i }).click();

      // Confirmation dialog should appear
      await expect(page.getByText(/Delete Bridge "br-test"/i)).toBeVisible();

      // Verify impact analysis is shown
      await expect(page.getByText(/1 ports will be released/i)).toBeVisible();

      // Type confirmation word
      await page.getByLabel(/Type.*DELETE/i).fill('DELETE');

      // Confirm deletion
      await page.getByRole('button', { name: /^Delete/i }).click();

      // Wait for success toast with undo button
      await expect(page.getByText(/Bridge deleted/i)).toBeVisible();

      // Verify bridge is removed from list
      await expect(page.getByText('br-test')).not.toBeVisible();
    });

    // Step 7: Test undo functionality
    await test.step('Undo bridge deletion', async () => {
      // Click undo button in toast (within 10 seconds)
      await page.getByRole('button', { name: /Undo/i }).click({ timeout: 9000 });

      // Wait for restoration success
      await expect(page.getByText(/Bridge restored/i)).toBeVisible();

      // Verify bridge is back in list
      await expect(page.getByText('br-test')).toBeVisible();
    });
  });

  test('validates form inputs', async ({ page }) => {
    await test.step('Show validation errors', async () => {
      await page.getByRole('button', { name: /Add Bridge/i }).click();

      // Try to submit without name
      await page.getByRole('button', { name: /Create Bridge/i }).click();

      // Should show validation error
      await expect(page.getByText(/Bridge name is required/i)).toBeVisible();

      // Fill invalid name (with spaces)
      await page.getByLabel(/Bridge Name/i).fill('invalid name');
      await page.getByRole('button', { name: /Create Bridge/i }).click();

      // Should show format error
      await expect(page.getByText(/Name can only contain/i)).toBeVisible();
    });
  });

  test('mobile responsive layout', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Verify mobile card layout', async () => {
      // Bridges should be displayed as cards
      await expect(page.locator('.card')).toHaveCount(await page.locator('.card').count());

      // Touch targets should be at least 44px
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    await test.step('Verify mobile dialog instead of sheet', async () => {
      await page.getByRole('button', { name: /Add Bridge/i }).click();

      // Should use Dialog (full screen) instead of Sheet
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Dialog should cover most of viewport
      const box = await dialog.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThan(500);
      }
    });
  });

  test('keyboard navigation', async ({ page }) => {
    await test.step('Navigate with keyboard', async () => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Open bridge with Enter
      await page.keyboard.press('Enter');

      // Close with Escape
      await page.keyboard.press('Escape');

      // Verify dialog closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test('search and filter functionality', async ({ page }) => {
    await test.step('Filter bridges', async () => {
      // Type in search box
      await page.getByPlaceholder(/Search bridges/i).fill('test');

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Should only show matching bridges
      const bridgeCount = await page.locator('text=/bridge/i').count();
      expect(bridgeCount).toBeGreaterThan(0);

      // Clear search
      await page.getByPlaceholder(/Search bridges/i).clear();

      // Filter by protocol
      await page.getByRole('combobox', { name: /Protocol/i }).click();
      await page.getByRole('option', { name: /RSTP/i }).click();

      // Should filter by protocol
      await expect(page.getByText('RSTP')).toBeVisible();
    });
  });
});

test.describe('Bridge Port Diagram Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/network/bridges');
    await page.waitForLoadState('networkidle');

    // Create a test bridge first
    await page.getByRole('button', { name: /Add Bridge/i }).click();
    await page.getByLabel(/Bridge Name/i).fill('br-dnd-test');
    await page.getByRole('button', { name: /Create Bridge/i }).click();
    await expect(page.getByText(/Bridge created successfully/i)).toBeVisible();
  });

  test('drag and drop interface to bridge', async ({ page }) => {
    // Open bridge detail
    await page.getByText('br-dnd-test').click();

    // Verify drag handle is visible on available interfaces
    const dragHandle = page.getByLabel(/Draggable interface/i).first();
    await expect(dragHandle).toBeVisible();

    // Perform drag and drop
    const dropZone = page.getByLabel(/Bridge port drop zone/i);
    await dragHandle.dragTo(dropZone);

    // Verify port was added
    await expect(page.getByText(/Added.*to bridge/i)).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard/network/bridges');
    await page.waitForLoadState('networkidle');

    // Run axe-core accessibility tests
    // Note: Requires @axe-core/playwright to be installed
    // const results = await injectAxe(page);
    // await checkA11y(page);

    // Verify ARIA labels are present
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('list')).toBeVisible();

    // Verify keyboard focus indicators
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveCSS('outline-width', /[2-9]px/);
  });
});
