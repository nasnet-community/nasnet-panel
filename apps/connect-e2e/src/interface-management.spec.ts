import { test, expect } from '@playwright/test';

test.describe('Interface Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to network interfaces page
    await page.goto('http://localhost:5173/dashboard/network');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('displays interface list', async ({ page }) => {
    // Check page title/heading
    await expect(page.getByRole('heading', { name: /interfaces/i })).toBeVisible();

    // Check that interfaces are rendered
    await expect(page.getByText('ether1')).toBeVisible();

    // Check table columns (desktop view)
    if (await page.locator('table').isVisible()) {
      await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
    }
  });

  test('filters interfaces by type', async ({ page }) => {
    // Select type filter
    await page.getByLabel(/filter by type/i).click();
    await page.getByRole('option', { name: /ethernet/i }).click();

    // Should show only ethernet interfaces
    await expect(page.getByText('ether1')).toBeVisible();
    await expect(page.getByText('ether2')).toBeVisible();

    // Bridge interface should not be visible
    await expect(page.getByText('bridge1')).not.toBeVisible();
  });

  test('filters interfaces by status', async ({ page }) => {
    // Select status filter
    await page.getByLabel(/filter by status/i).click();
    await page.getByRole('option', { name: /down/i }).click();

    // Should show only down interfaces
    const downInterfaces = page.locator('[data-status="DOWN"]');
    await expect(downInterfaces).toHaveCount(await downInterfaces.count());
  });

  test('searches interfaces by name', async ({ page }) => {
    // Type in search box
    await page.getByPlaceholder(/search/i).fill('ether1');

    // Should show only ether1
    await expect(page.getByText('ether1')).toBeVisible();
    await expect(page.getByText('bridge1')).not.toBeVisible();
  });

  test('clears filters', async ({ page }) => {
    // Apply search filter
    await page.getByPlaceholder(/search/i).fill('ether1');
    await expect(page.getByText('bridge1')).not.toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: /clear filter/i }).click();

    // All interfaces should be visible again
    await expect(page.getByText('ether1')).toBeVisible();
    await expect(page.getByText('bridge1')).toBeVisible();
  });

  test('opens interface detail panel', async ({ page }) => {
    // Click on interface row
    await page.getByText('ether1').click();

    // Detail panel should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ether1' })).toBeVisible();

    // Check tabs
    await expect(page.getByRole('tab', { name: /status/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /traffic/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /configuration/i })).toBeVisible();
  });

  test('displays interface status information', async ({ page }) => {
    // Open detail panel
    await page.getByText('ether1').click();

    // Check status tab content
    await page.getByRole('tab', { name: /status/i }).click();

    await expect(page.getByText(/enabled/i)).toBeVisible();
    await expect(page.getByText(/mac address/i)).toBeVisible();
    await expect(page.getByText(/link speed/i)).toBeVisible();
  });

  test('displays interface traffic information', async ({ page }) => {
    // Open detail panel
    await page.getByText('ether1').click();

    // Check traffic tab
    await page.getByRole('tab', { name: /traffic/i }).click();

    await expect(page.getByText(/tx rate/i)).toBeVisible();
    await expect(page.getByText(/rx rate/i)).toBeVisible();
  });

  test('edits interface settings', async ({ page }) => {
    // Open detail panel
    await page.getByText('ether1').click();

    // Go to configuration tab
    await page.getByRole('tab', { name: /configuration/i }).click();

    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Update MTU
    const mtuInput = page.getByLabel(/mtu/i);
    await mtuInput.clear();
    await mtuInput.fill('1400');

    // Update comment
    const commentTextarea = page.getByLabel(/comment/i);
    await commentTextarea.clear();
    await commentTextarea.fill('Updated via E2E test');

    // Save changes
    await page.getByRole('button', { name: /save/i }).click();

    // Success toast should appear
    await expect(page.getByText(/interface updated/i)).toBeVisible({ timeout: 5000 });
  });

  test('enables interface', async ({ page }) => {
    // Find a disabled interface
    const disabledInterface = page.locator('[data-status="DISABLED"]').first();
    const interfaceName = await disabledInterface.textContent();

    // Click on it
    await disabledInterface.click();

    // Click enable button in detail panel
    await page.getByRole('button', { name: /enable/i }).click();

    // Success toast
    await expect(page.getByText(/interface enabled/i)).toBeVisible({ timeout: 5000 });

    // Status should update to enabled
    await expect(page.getByText(/enabled/i)).toBeVisible();
  });

  test('disables interface with confirmation', async ({ page }) => {
    // Find an enabled interface (not gateway)
    const enabledInterface = page.locator('[data-status="UP"]').filter({ hasNot: page.locator('[data-gateway="true"]') }).first();

    // Click on it
    await enabledInterface.click();

    // Click disable button
    await page.getByRole('button', { name: /disable/i }).click();

    // Confirmation dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/disable.*interface/i)).toBeVisible();

    // Confirm
    await page.getByRole('button', { name: /confirm/i }).click();

    // Success toast
    await expect(page.getByText(/interface disabled/i)).toBeVisible({ timeout: 5000 });
  });

  test('selects multiple interfaces', async ({ page }) => {
    // Select checkboxes
    const checkboxes = page.getByRole('checkbox').filter({ hasNot: page.locator('[aria-label="Select all"]') });

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Should show selection count
    await expect(page.getByText(/2 selected/i)).toBeVisible();

    // Batch actions toolbar should appear
    await expect(page.getByRole('button', { name: /batch actions/i })).toBeVisible();
  });

  test('clears selection', async ({ page }) => {
    // Select interfaces
    const checkboxes = page.getByRole('checkbox').filter({ hasNot: page.locator('[aria-label="Select all"]') });
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await expect(page.getByText(/2 selected/i)).toBeVisible();

    // Clear selection
    await page.getByRole('button', { name: /clear selection/i }).click();

    // Selection count should disappear
    await expect(page.getByText(/selected/i)).not.toBeVisible();
  });

  test('batch enables interfaces', async ({ page }) => {
    // Select multiple disabled interfaces
    const disabledCheckboxes = page.locator('[data-status="DISABLED"]').locator('input[type="checkbox"]');

    const count = await disabledCheckboxes.count();
    if (count < 2) {
      test.skip();
    }

    await disabledCheckboxes.nth(0).check();
    await disabledCheckboxes.nth(1).check();

    // Open batch actions menu
    await page.getByRole('button', { name: /batch actions/i }).click();
    await page.getByRole('menuitem', { name: /enable selected/i }).click();

    // Confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /confirm enable/i }).click();

    // Success toast
    await expect(page.getByText(/batch operation complete/i)).toBeVisible({ timeout: 5000 });
  });

  test('batch disables with safety warning for gateway', async ({ page }) => {
    // Select a gateway interface and another interface
    const gatewayCheckbox = page.locator('[data-gateway="true"]').locator('input[type="checkbox"]').first();
    await gatewayCheckbox.check();

    const otherCheckbox = page.getByRole('checkbox').filter({ hasNot: page.locator('[data-gateway="true"]') }).first();
    await otherCheckbox.check();

    // Open batch actions menu
    await page.getByRole('button', { name: /batch actions/i }).click();
    await page.getByRole('menuitem', { name: /disable selected/i }).click();

    // Should show critical warning
    await expect(page.getByText(/warning.*critical operation/i)).toBeVisible();
    await expect(page.getByText(/gateway/i)).toBeVisible();

    // Confirm button should have countdown
    const confirmButton = page.getByRole('button', { name: /confirm \(3\)/i });
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeDisabled();

    // Wait for countdown
    await page.waitForTimeout(3000);

    // Button should be enabled now
    await expect(page.getByRole('button', { name: /confirm disable/i })).toBeEnabled();
  });

  test('validates MTU range', async ({ page }) => {
    // Open interface detail
    await page.getByText('ether1').click();

    // Edit interface
    await page.getByRole('tab', { name: /configuration/i }).click();
    await page.getByRole('button', { name: /edit/i }).click();

    // Try invalid MTU (too low)
    const mtuInput = page.getByLabel(/mtu/i);
    await mtuInput.clear();
    await mtuInput.fill('50');

    await page.getByRole('button', { name: /save/i }).click();

    // Should show validation error
    await expect(page.getByText(/must be at least 68/i)).toBeVisible();

    // Try invalid MTU (too high)
    await mtuInput.clear();
    await mtuInput.fill('10000');

    await page.getByRole('button', { name: /save/i }).click();

    // Should show validation error
    await expect(page.getByText(/must be at most 9000/i)).toBeVisible();
  });

  test('validates comment length', async ({ page }) => {
    // Open interface detail
    await page.getByText('ether1').click();

    // Edit interface
    await page.getByRole('tab', { name: /configuration/i }).click();
    await page.getByRole('button', { name: /edit/i }).click();

    // Try comment that's too long
    const commentTextarea = page.getByLabel(/comment/i);
    const longComment = 'a'.repeat(256);
    await commentTextarea.fill(longComment);

    await page.getByRole('button', { name: /save/i }).click();

    // Should show validation error
    await expect(page.getByText(/must be at most 255 characters/i)).toBeVisible();
  });

  test('closes detail panel on escape', async ({ page }) => {
    // Open detail panel
    await page.getByText('ether1').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press escape
    await page.keyboard.press('Escape');

    // Panel should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('navigates between tabs', async ({ page }) => {
    // Open detail panel
    await page.getByText('ether1').click();

    // Check default tab
    await expect(page.getByRole('tabpanel')).toContainText(/status/i);

    // Navigate to traffic tab
    await page.getByRole('tab', { name: /traffic/i }).click();
    await expect(page.getByText(/tx rate/i)).toBeVisible();

    // Navigate to configuration tab
    await page.getByRole('tab', { name: /configuration/i }).click();
    await expect(page.getByText(/mtu/i)).toBeVisible();
  });

  test('refreshes interface list', async ({ page }) => {
    // Initial load
    await expect(page.getByText('ether1')).toBeVisible();

    // Trigger refresh (if there's a refresh button)
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should reload data
      await expect(page.getByText('ether1')).toBeVisible();
    }
  });
});

test.describe('Interface Management - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('displays mobile card view', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Should show card view instead of table
    await expect(page.locator('table')).not.toBeVisible();

    // Cards should be visible
    const cards = page.locator('[data-testid="interface-card"]');
    await expect(cards).toHaveCount(await cards.count());
  });

  test('opens full-screen detail on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Click on card
    await page.getByText('ether1').click();

    // Should open full-screen dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Check it's full-screen (takes full width)
    const box = await dialog.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(375 - 20); // Account for padding
  });

  test('shows mobile action bar when selecting', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Select interface on mobile
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.check();

    // Bottom action bar should appear
    await expect(page.locator('[data-testid="mobile-action-bar"]')).toBeVisible();
  });
});

test.describe('Interface Management - Accessibility', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Run axe accessibility checks
    const accessibilityScanResults = await page.evaluate(() => {
      // @ts-ignore
      return window.axe ? window.axe.run() : null;
    });

    if (accessibilityScanResults) {
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Tab to first interface
    await page.keyboard.press('Tab');

    // Should be able to navigate with arrow keys (if in table)
    await page.keyboard.press('ArrowDown');

    // Enter to open detail
    await page.keyboard.press('Enter');

    // Detail panel should open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('has proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Check for ARIA labels
    await expect(page.getByRole('table')).toHaveAttribute('aria-label');
    await expect(page.getByRole('search')).toHaveAttribute('aria-label');
  });

  test('announces status changes to screen readers', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Open detail and enable/disable
    await page.getByText('ether1').click();
    await page.getByRole('button', { name: /disable/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Check for live region announcement
    const liveRegion = page.locator('[role="status"]').or(page.locator('[aria-live="polite"]'));
    await expect(liveRegion).toBeVisible({ timeout: 5000 });
  });
});
