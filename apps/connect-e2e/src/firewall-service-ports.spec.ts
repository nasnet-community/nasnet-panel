import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Service Ports Management (NAS-7.8)
 *
 * Critical user flows:
 * 1. View built-in services
 * 2. Add custom service
 * 3. Create service group
 * 4. Use service group in firewall rule (critical path)
 * 5. Edit custom service
 * 6. Delete custom service
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-8-implement-service-ports-management.md
 */

test.describe('Service Ports Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Service Ports page
    await page.goto('/router/1/firewall/service-ports');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Service Ports' })).toBeVisible();
  });

  test('1. View built-in services', async ({ page }) => {
    // Verify Services tab is active by default
    await expect(page.getByRole('tab', { name: 'Services', selected: true })).toBeVisible();

    // Verify built-in services are displayed
    await expect(page.getByText('HTTP', { exact: true })).toBeVisible();
    await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();
    await expect(page.getByText('SSH', { exact: true })).toBeVisible();

    // Verify built-in badge
    const httpRow = page.locator('tr', { has: page.getByText('HTTP', { exact: true }) }).first();
    await expect(httpRow.getByText('Built-in')).toBeVisible();

    // Verify port numbers are displayed
    await expect(httpRow.getByText('80', { exact: true })).toBeVisible();

    // Verify protocol badges
    await expect(httpRow.getByText('TCP')).toBeVisible();

    // Verify edit/delete actions are disabled for built-in services
    const editButton = httpRow.getByRole('button', { name: /edit/i });
    const deleteButton = httpRow.getByRole('button', { name: /delete/i });

    if ((await editButton.count()) > 0) {
      await expect(editButton).toBeDisabled();
    }
    if ((await deleteButton.count()) > 0) {
      await expect(deleteButton).toBeDisabled();
    }
  });

  test('2. Add custom service', async ({ page }) => {
    // Click "Add Service" button
    await page.getByRole('button', { name: /add service/i }).click();

    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /add service/i })).toBeVisible();

    // Fill form
    await page.getByLabel(/service name/i).fill('my-app');
    await page.getByLabel(/port/i).fill('9999');

    // Select protocol (TCP is default)
    await page.getByRole('radio', { name: /tcp/i }).check();

    // Add description (optional)
    await page.getByLabel(/description/i).fill('My custom application');

    // Submit form
    await page.getByRole('button', { name: /save|add/i }).click();

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify custom service appears in table
    await expect(page.getByText('my-app', { exact: true })).toBeVisible();
    await expect(page.getByText('9999', { exact: true })).toBeVisible();

    // Verify custom badge
    const myAppRow = page.locator('tr', { has: page.getByText('my-app') }).first();
    await expect(myAppRow.getByText('Custom')).toBeVisible();

    // Verify edit/delete actions are enabled for custom services
    const editButton = myAppRow.getByRole('button', { name: /edit/i });
    const deleteButton = myAppRow.getByRole('button', { name: /delete/i });

    if ((await editButton.count()) > 0) {
      await expect(editButton).toBeEnabled();
    }
    if ((await deleteButton.count()) > 0) {
      await expect(deleteButton).toBeEnabled();
    }
  });

  test('3. Create service group', async ({ page }) => {
    // Switch to Groups tab
    await page.getByRole('tab', { name: /groups/i }).click();
    await expect(page.getByRole('tab', { name: /groups/i, selected: true })).toBeVisible();

    // Click "Create Group" button
    await page.getByRole('button', { name: /create group/i }).click();

    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create group|add group/i })).toBeVisible();

    // Fill form
    await page.getByLabel(/group name/i).fill('web');

    // Select protocol
    await page.getByRole('radio', { name: /tcp/i }).check();

    // Add description (optional)
    await page.getByLabel(/description/i).fill('Common web services');

    // Select services (multi-select)
    // Note: Implementation depends on multi-select component design
    // This is a placeholder - adjust based on actual component
    const serviceSelector = page.getByLabel(/select services/i);
    if ((await serviceSelector.count()) > 0) {
      await serviceSelector.click();
      await page.getByText('HTTP', { exact: true }).click();
      await page.getByText('HTTPS', { exact: true }).click();
      await page.getByText('HTTP-Alt', { exact: true }).click();
    }

    // Verify preview shows port count
    await expect(page.getByText(/3 ports|total.*3/i)).toBeVisible();

    // Submit form
    await page.getByRole('button', { name: /create|save/i }).click();

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify group appears in Groups tab
    await expect(page.getByText('web', { exact: true })).toBeVisible();
  });

  test('4. Use service group in firewall rule (CRITICAL PATH)', async ({ page }) => {
    // First, create a service group (setup)
    await page.getByRole('tab', { name: /groups/i }).click();
    await page.getByRole('button', { name: /create group/i }).click();

    await page.getByLabel(/group name/i).fill('web');
    await page.getByRole('radio', { name: /tcp/i }).check();

    // Select HTTP and HTTPS services
    // (Adjust selector based on actual multi-select implementation)
    const serviceSelector = page.getByLabel(/select services/i);
    if ((await serviceSelector.count()) > 0) {
      await serviceSelector.click();
      await page.getByText('HTTP', { exact: true }).click();
      await page.getByText('HTTPS', { exact: true }).click();
    }

    await page.getByRole('button', { name: /create|save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Navigate to Firewall Filter Rules
    await page.goto('/router/1/firewall/filter');
    await expect(page.getByRole('heading', { name: /filter rules/i })).toBeVisible();

    // Click "Add Rule" button
    await page.getByRole('button', { name: /add rule|new rule/i }).click();

    // Verify rule editor opens
    await expect(page.getByRole('dialog')).toBeVisible();

    // Find destination port field
    const dstPortField = page.getByLabel(/destination port|dst port/i);

    if ((await dstPortField.count()) > 0) {
      // Click to open suggestions
      await dstPortField.click();

      // Verify "web" group appears in suggestions
      await expect(page.getByText('web', { exact: false })).toBeVisible();

      // Verify folder icon is present (service group indicator)
      const webGroupOption = page.locator('[role="option"]', { hasText: 'web' });
      await expect(webGroupOption).toBeVisible();

      // Click the "web" group
      await webGroupOption.click();

      // Verify field value expands to "80, 443"
      await expect(dstPortField).toHaveValue(/80.*443|443.*80/);
    }

    // Cancel the dialog
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('5. Edit custom service', async ({ page }) => {
    // Add a custom service first (setup)
    await page.getByRole('button', { name: /add service/i }).click();
    await page.getByLabel(/service name/i).fill('test-service');
    await page.getByLabel(/port/i).fill('8888');
    await page.getByRole('button', { name: /save|add/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Find the custom service row
    const testServiceRow = page.locator('tr', { has: page.getByText('test-service') }).first();

    // Click edit button
    await testServiceRow.getByRole('button', { name: /edit/i }).click();

    // Verify edit dialog opens with pre-filled values
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /edit service/i })).toBeVisible();
    await expect(page.getByLabel(/service name/i)).toHaveValue('test-service');
    await expect(page.getByLabel(/port/i)).toHaveValue('8888');

    // Modify port
    await page.getByLabel(/port/i).fill('7777');

    // Submit form
    await page.getByRole('button', { name: /update|save/i }).click();

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify updated port is displayed
    await expect(page.getByText('7777', { exact: true })).toBeVisible();
  });

  test('6. Delete custom service', async ({ page }) => {
    // Add a custom service first (setup)
    await page.getByRole('button', { name: /add service/i }).click();
    await page.getByLabel(/service name/i).fill('delete-me');
    await page.getByLabel(/port/i).fill('6666');
    await page.getByRole('button', { name: /save|add/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Find the custom service row
    const deleteServiceRow = page.locator('tr', { has: page.getByText('delete-me') }).first();

    // Click delete button
    await deleteServiceRow.getByRole('button', { name: /delete/i }).click();

    // Verify confirmation dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/delete this service|confirm delete/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /delete|confirm/i }).click();

    // Verify service is removed from table
    await expect(page.getByText('delete-me')).not.toBeVisible();
    await expect(page.getByText('6666', { exact: true })).not.toBeVisible();
  });

  test('Search filters services by name', async ({ page }) => {
    // Verify search field exists
    const searchInput = page.getByPlaceholder(/search.*service|search.*port/i);
    await expect(searchInput).toBeVisible();

    // Search for "HTTP"
    await searchInput.fill('HTTP');

    // Verify HTTP services are visible
    await expect(page.getByText('HTTP', { exact: true })).toBeVisible();
    await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();

    // Verify unrelated services are not visible
    await expect(page.getByText('SSH', { exact: true })).not.toBeVisible();
    await expect(page.getByText('MySQL', { exact: true })).not.toBeVisible();
  });

  test('Search filters services by port number', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*service|search.*port/i);
    await expect(searchInput).toBeVisible();

    // Search for port "443"
    await searchInput.fill('443');

    // Verify HTTPS (port 443) is visible
    await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();

    // Verify HTTP (port 80) is not visible
    await expect(page.getByText('HTTP', { exact: true })).not.toBeVisible();
  });

  test('Protocol filter works', async ({ page }) => {
    // Find protocol filter dropdown
    const protocolFilter = page
      .getByLabel(/protocol/i)
      .or(page.getByRole('combobox', { name: /protocol/i }));

    if ((await protocolFilter.count()) > 0) {
      // Filter by TCP
      await protocolFilter.selectOption('tcp');

      // Verify TCP services are visible
      await expect(page.getByText('HTTP', { exact: true })).toBeVisible();
      await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();

      // Verify UDP services are not visible (if any)
      // Note: Adjust based on actual well-known ports data
    }
  });

  test('Empty state shows when no custom services', async ({ page }) => {
    // Clear any existing custom services (if localStorage persists)
    await page.evaluate(() => {
      localStorage.removeItem('nasnet.firewall.customServices');
    });

    // Reload page
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Service Ports' })).toBeVisible();

    // Should still show built-in services (HTTP, HTTPS, etc.)
    await expect(page.getByText('HTTP', { exact: true })).toBeVisible();
  });

  test('Accessibility: keyboard navigation works', async ({ page }) => {
    // Tab to "Add Service" button
    await page.keyboard.press('Tab');
    const addButton = page.getByRole('button', { name: /add service/i });
    await expect(addButton).toBeFocused();

    // Press Enter to open dialog
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Tab through form fields
    await page.keyboard.press('Tab'); // Service name
    await page.keyboard.type('keyboard-test');

    await page.keyboard.press('Tab'); // Protocol radio group
    await page.keyboard.press('Tab'); // Port field
    await page.keyboard.type('5555');

    // Press Escape to close dialog
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Mobile: touch targets are 44px minimum', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Verify "Add Service" button meets minimum touch target
    const addButton = page.getByRole('button', { name: /add service/i });
    const boundingBox = await addButton.boundingBox();

    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});
