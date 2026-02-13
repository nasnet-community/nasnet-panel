/**
 * E2E Tests for NAT Configuration Feature
 *
 * Tests the complete Port Forward Wizard flow from opening to deletion.
 *
 * @see apps/connect/src/routes/firewall/nat/index.tsx
 */

import { test, expect, type Page } from '@playwright/test';

// ============================================================================
// TEST SETUP
// ============================================================================

const ROUTER_ID = 'test-router-1';
const BASE_URL = '/firewall/nat';

/**
 * Navigate to NAT Configuration page
 */
async function navigateToNATPage(page: Page) {
  await page.goto(`${BASE_URL}?routerId=${ROUTER_ID}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Open the Port Forward Wizard
 */
async function openPortForwardWizard(page: Page) {
  const addButton = page.getByRole('button', { name: /add port forward/i });
  await addButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

// ============================================================================
// PORT FORWARD WIZARD TESTS
// ============================================================================

test.describe('NAT Configuration - Port Forward Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToNATPage(page);
  });

  test('should open port forward wizard', async ({ page }) => {
    await openPortForwardWizard(page);

    // Verify wizard dialog is visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /port forward wizard/i })
    ).toBeVisible();

    // Verify Step 1: External Settings is shown
    await expect(
      page.getByText(/external settings/i, { exact: false })
    ).toBeVisible();
  });

  test('should complete full port forward wizard flow', async ({ page }) => {
    await openPortForwardWizard(page);

    // ============================================
    // Step 1: External Settings
    // ============================================
    await expect(
      page.getByText(/external settings/i, { exact: false })
    ).toBeVisible();

    // Select protocol
    const protocolSelect = page.getByLabel(/protocol/i);
    await protocolSelect.click();
    await page.getByRole('option', { name: 'TCP' }).click();

    // Enter external port
    const externalPortInput = page.getByLabel(/external port/i);
    await externalPortInput.fill('80');

    // Optional: Enter name
    const nameInput = page.getByLabel(/name/i);
    await nameInput.fill('Web Server');

    // Click Next
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    // ============================================
    // Step 2: Internal Settings
    // ============================================
    await expect(
      page.getByText(/internal settings/i, { exact: false })
    ).toBeVisible();

    // Enter internal IP
    const internalIPInput = page.getByLabel(/internal ip/i);
    await internalIPInput.fill('192.168.1.100');

    // Enter internal port (different from external)
    const internalPortInput = page.getByLabel(/internal port/i);
    await internalPortInput.fill('8080');

    // Click Next
    await nextButton.click();

    // ============================================
    // Step 3: Review Summary
    // ============================================
    await expect(page.getByText(/review/i, { exact: false })).toBeVisible();

    // Verify summary displays correct information
    await expect(page.getByText(/tcp port 80/i)).toBeVisible();
    await expect(page.getByText(/192\.168\.1\.100:8080/i)).toBeVisible();
    await expect(page.getByText(/web server/i)).toBeVisible();

    // Verify NAT rule preview is shown
    await expect(
      page.getByText(/\/ip\/firewall\/nat\/add/i)
    ).toBeVisible();
    await expect(page.getByText(/chain=dstnat/i)).toBeVisible();
    await expect(page.getByText(/action=dst-nat/i)).toBeVisible();

    // Click Next to proceed to safety confirmation
    await nextButton.click();

    // ============================================
    // Step 4: Safety Confirmation
    // ============================================
    await expect(
      page.getByText(/safety confirmation/i, { exact: false })
    ).toBeVisible();

    // Verify warning message
    await expect(
      page.getByText(/network configuration/i)
    ).toBeVisible();

    // Check acknowledgment checkbox
    const acknowledgmentCheckbox = page.getByRole('checkbox', {
      name: /i understand/i,
    });
    await acknowledgmentCheckbox.check();

    // Confirm button should now be enabled
    const confirmButton = page.getByRole('button', { name: /confirm/i });
    await expect(confirmButton).toBeEnabled();

    // Click Confirm to create port forward
    await confirmButton.click();

    // ============================================
    // Verify Port Forward Created
    // ============================================

    // Wait for success notification
    await expect(page.getByText(/port forward created/i)).toBeVisible();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify port forward appears in the table
    await expect(page.getByText(/web server/i)).toBeVisible();
    await expect(page.getByText(/80/)).toBeVisible();
    await expect(page.getByText(/192\.168\.1\.100/)).toBeVisible();
    await expect(page.getByText(/8080/)).toBeVisible();
  });

  test('should validate required fields in wizard', async ({ page }) => {
    await openPortForwardWizard(page);

    // Try to proceed without filling external port
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    // Should show validation error
    await expect(
      page.getByText(/external port is required/i)
    ).toBeVisible();

    // Fill external port
    const externalPortInput = page.getByLabel(/external port/i);
    await externalPortInput.fill('80');

    // Now should be able to proceed
    await nextButton.click();

    // Step 2: Try to proceed without internal IP
    await nextButton.click();

    // Should show validation error
    await expect(page.getByText(/internal ip is required/i)).toBeVisible();
  });

  test('should validate port range (1-65535)', async ({ page }) => {
    await openPortForwardWizard(page);

    const externalPortInput = page.getByLabel(/external port/i);

    // Invalid port: 0
    await externalPortInput.fill('0');
    await externalPortInput.blur();
    await expect(
      page.getByText(/port must be between 1 and 65535/i)
    ).toBeVisible();

    // Invalid port: 70000
    await externalPortInput.fill('70000');
    await externalPortInput.blur();
    await expect(
      page.getByText(/port must be between 1 and 65535/i)
    ).toBeVisible();

    // Valid port: 80
    await externalPortInput.fill('80');
    await externalPortInput.blur();
    await expect(
      page.queryByText(/port must be between 1 and 65535/i)
    ).not.toBeVisible();
  });

  test('should validate IP address format', async ({ page }) => {
    await openPortForwardWizard(page);

    // Go to Step 2
    const externalPortInput = page.getByLabel(/external port/i);
    await externalPortInput.fill('80');
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    // Enter invalid IP
    const internalIPInput = page.getByLabel(/internal ip/i);
    await internalIPInput.fill('999.999.999.999');
    await internalIPInput.blur();

    await expect(
      page.getByText(/must be a valid ip address/i)
    ).toBeVisible();

    // Enter valid IP
    await internalIPInput.fill('192.168.1.100');
    await internalIPInput.blur();

    await expect(
      page.queryByText(/must be a valid ip address/i)
    ).not.toBeVisible();
  });

  test('should allow canceling wizard at any step', async ({ page }) => {
    await openPortForwardWizard(page);

    // Cancel from Step 1
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should allow going back to previous steps', async ({ page }) => {
    await openPortForwardWizard(page);

    // Fill Step 1
    const externalPortInput = page.getByLabel(/external port/i);
    await externalPortInput.fill('80');

    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    // Now on Step 2
    await expect(
      page.getByText(/internal settings/i, { exact: false })
    ).toBeVisible();

    // Click Back
    const backButton = page.getByRole('button', { name: /back/i });
    await backButton.click();

    // Should be back on Step 1
    await expect(
      page.getByText(/external settings/i, { exact: false })
    ).toBeVisible();

    // Previous values should be preserved
    await expect(externalPortInput).toHaveValue('80');
  });

  test('should detect port conflicts', async ({ page }) => {
    // Assume port 22 (SSH) is already forwarded
    await openPortForwardWizard(page);

    // Fill wizard with conflicting port
    const externalPortInput = page.getByLabel(/external port/i);
    await externalPortInput.fill('22');

    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    const internalIPInput = page.getByLabel(/internal ip/i);
    await internalIPInput.fill('192.168.1.200');

    await nextButton.click();

    // Should show conflict warning in review step
    await expect(
      page.getByText(/port 22 is already forwarded/i)
    ).toBeVisible();

    // Confirm button should be disabled or show warning
    await nextButton.click();
    await expect(
      page.getByText(/resolve the conflict/i)
    ).toBeVisible();
  });

  test('should use common service port templates', async ({ page }) => {
    await openPortForwardWizard(page);

    // Look for service templates dropdown
    const serviceTemplateSelect = page.getByLabel(/common service/i);
    await serviceTemplateSelect.click();

    // Select HTTP
    await page.getByRole('option', { name: /http \(80\)/i }).click();

    // Port should be auto-filled
    const externalPortInput = page.getByLabel(/external port/i);
    await expect(externalPortInput).toHaveValue('80');
  });
});

// ============================================================================
// PORT FORWARD MANAGEMENT TESTS
// ============================================================================

test.describe('NAT Configuration - Port Forward Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToNATPage(page);
  });

  test('should display existing port forwards in table', async ({ page }) => {
    // Verify table headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /protocol/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /external port/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /internal/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();

    // Verify at least one row exists (assuming test data)
    const rows = page.getByRole('row');
    await expect(rows).not.toHaveCount(0);
  });

  test('should delete port forward with confirmation', async ({ page }) => {
    // Find first port forward delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    await deleteButton.click();

    // Verify confirmation dialog
    await expect(
      page.getByText(/delete port forward/i)
    ).toBeVisible();
    await expect(
      page.getByText(/this will remove both nat and filter rules/i)
    ).toBeVisible();

    // Confirm deletion
    const confirmDeleteButton = page.getByRole('button', {
      name: /confirm delete/i,
    });
    await confirmDeleteButton.click();

    // Wait for success notification
    await expect(page.getByText(/port forward deleted/i)).toBeVisible();
  });

  test('should cancel port forward deletion', async ({ page }) => {
    // Find first port forward delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    await deleteButton.click();

    // Cancel deletion
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Dialog should close without deleting
    await expect(
      page.queryByText(/delete port forward/i)
    ).not.toBeVisible();
  });

  test('should toggle port forward enable/disable', async ({ page }) => {
    // Find first port forward toggle
    const toggleSwitch = page.getByRole('switch').first();
    const initialState = await toggleSwitch.isChecked();

    // Toggle the switch
    await toggleSwitch.click();

    // Wait for state change
    await page.waitForTimeout(500);

    // Verify state changed
    const newState = await toggleSwitch.isChecked();
    expect(newState).toBe(!initialState);

    // Verify status badge updated
    if (newState) {
      await expect(page.getByText(/active/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/disabled/i).first()).toBeVisible();
    }
  });

  test('should filter port forwards by protocol', async ({ page }) => {
    // Find protocol filter
    const protocolFilter = page.getByLabel(/filter by protocol/i);
    await protocolFilter.click();

    // Select TCP
    await page.getByRole('option', { name: 'TCP' }).click();

    // Verify only TCP forwards are shown
    const rows = page.getByRole('row');
    const tcpCount = await rows.count();

    // Switch to UDP
    await protocolFilter.click();
    await page.getByRole('option', { name: 'UDP' }).click();

    // Count should change
    const udpCount = await rows.count();
    expect(udpCount).not.toBe(tcpCount);
  });

  test('should search port forwards by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('web');

    // Wait for debounce
    await page.waitForTimeout(300);

    // Verify filtered results
    await expect(page.getByText(/web server/i)).toBeVisible();
  });
});

// ============================================================================
// NAT RULES MANAGEMENT TESTS
// ============================================================================

test.describe('NAT Configuration - NAT Rules Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToNATPage(page);
  });

  test('should switch to NAT Rules tab', async ({ page }) => {
    const natRulesTab = page.getByRole('tab', { name: /nat rules/i });
    await natRulesTab.click();

    // Verify NAT rules table is displayed
    await expect(
      page.getByRole('columnheader', { name: /chain/i })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /action/i })
    ).toBeVisible();
  });

  test('should create masquerade rule', async ({ page }) => {
    // Switch to NAT Rules tab
    const natRulesTab = page.getByRole('tab', { name: /nat rules/i });
    await natRulesTab.click();

    // Click Add NAT Rule
    const addButton = page.getByRole('button', { name: /add nat rule/i });
    await addButton.click();

    // Fill masquerade rule
    const actionSelect = page.getByLabel(/action/i);
    await actionSelect.click();
    await page.getByRole('option', { name: 'masquerade' }).click();

    const outInterfaceInput = page.getByLabel(/out interface/i);
    await outInterfaceInput.fill('ether1');

    const commentInput = page.getByLabel(/comment/i);
    await commentInput.fill('WAN Masquerade');

    // Submit
    const createButton = page.getByRole('button', { name: /create/i });
    await createButton.click();

    // Verify success
    await expect(page.getByText(/nat rule created/i)).toBeVisible();
  });

  test('should filter NAT rules by chain', async ({ page }) => {
    // Switch to NAT Rules tab
    const natRulesTab = page.getByRole('tab', { name: /nat rules/i });
    await natRulesTab.click();

    // Filter by srcnat
    const chainFilter = page.getByLabel(/filter by chain/i);
    await chainFilter.click();
    await page.getByRole('option', { name: 'srcnat' }).click();

    // Verify only srcnat rules shown
    await expect(page.getByText(/srcnat/i).first()).toBeVisible();
  });
});

// ============================================================================
// MOBILE RESPONSIVE TESTS
// ============================================================================

test.describe('NAT Configuration - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized port forward wizard', async ({
    page,
  }) => {
    await navigateToNATPage(page);
    await openPortForwardWizard(page);

    // Verify mobile layout
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Form fields should stack vertically on mobile
    const externalPortInput = page.getByLabel(/external port/i);
    const boundingBox = await externalPortInput.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(300); // Full width on mobile
  });

  test('should display mobile-optimized port forward cards', async ({
    page,
  }) => {
    await navigateToNATPage(page);

    // Mobile should show cards instead of table
    const card = page.locator('[data-testid="port-forward-card"]').first();
    await expect(card).toBeVisible();

    // Cards should stack vertically
    const cards = page.locator('[data-testid="port-forward-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('NAT Configuration - Accessibility', () => {
  test('should have proper ARIA labels on wizard', async ({ page }) => {
    await navigateToNATPage(page);
    await openPortForwardWizard(page);

    // Verify ARIA labels
    await expect(page.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby'
    );
    await expect(page.getByLabel(/protocol/i)).toBeVisible();
    await expect(page.getByLabel(/external port/i)).toBeVisible();
  });

  test('should support keyboard navigation in wizard', async ({ page }) => {
    await navigateToNATPage(page);
    await openPortForwardWizard(page);

    // Tab through form fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // External port input should be focused
    const externalPortInput = page.getByLabel(/external port/i);
    await expect(externalPortInput).toBeFocused();
  });

  test('should announce validation errors to screen readers', async ({
    page,
  }) => {
    await navigateToNATPage(page);
    await openPortForwardWizard(page);

    const externalPortInput = page.getByLabel(/external port/i);
    await externalPortInput.fill('0');
    await externalPortInput.blur();

    // Error should have aria-describedby
    const errorMessage = page.getByText(/port must be between 1 and 65535/i);
    await expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
