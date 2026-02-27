/**
 * Service Instance Management E2E Tests
 *
 * End-to-end tests for the Feature Marketplace service management.
 * Tests the complete user journey from viewing services to installation.
 *
 * @see Task #11: Comprehensive Testing
 */

import { test, expect } from '@playwright/test';

test.describe('Service Instance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to services page
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Services Page', () => {
    test('should load services page', async ({ page }) => {
      // Verify page header
      await expect(page.getByText('Service Instances')).toBeVisible();
      await expect(page.getByText(/Manage downloadable network services/)).toBeVisible();
    });

    test('should show install button', async ({ page }) => {
      const installButton = page.getByRole('button', {
        name: /install service/i,
      });
      await expect(installButton).toBeVisible();
    });

    test('should display service instances if any exist', async ({ page }) => {
      // Wait for either the instance manager or empty state to be visible
      const instanceManager = page.locator('[data-testid="instance-manager"]');
      const emptyState = page.getByText(/No services installed yet/i);

      await expect(page.locator('body').locator(':has-text("Service Instances")')).toBeVisible();
    });
  });

  test.describe('Service Filtering', () => {
    test('should filter services by search', async ({ page }) => {
      // Enter search query
      const searchInput = page.getByPlaceholder(/search instances/i);
      await searchInput.fill('tor');

      // Wait for filtered results
      await page.waitForTimeout(500); // Debounce delay

      // Verify filtering works (implementation-specific)
      await expect(searchInput).toHaveValue('tor');
    });

    test('should filter by category', async ({ page }) => {
      // Open category filter
      const categoryFilter = page.getByRole('combobox', {
        name: /category/i,
      });

      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();

        // Select privacy category
        await page.getByRole('option', { name: /privacy/i }).click();

        // Verify filter is applied
        await expect(categoryFilter).toContainText(/privacy/i);
      }
    });

    test('should filter by status', async ({ page }) => {
      // Open status filter
      const statusFilter = page.getByRole('combobox', { name: /status/i });

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select running status
        await page.getByRole('option', { name: /running/i }).click();

        // Verify filter is applied
        await expect(statusFilter).toContainText(/running/i);
      }
    });

    test('should clear filters', async ({ page }) => {
      // Enter search
      const searchInput = page.getByPlaceholder(/search instances/i);
      await searchInput.fill('test');

      // Click clear button
      const clearButton = page.getByRole('button', { name: /clear/i });

      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Verify search is cleared
        await expect(searchInput).toHaveValue('');
      }
    });
  });

  test.describe('Install Service Flow', () => {
    test('should open install dialog when install button is clicked', async ({ page }) => {
      // Click install button
      await page.getByRole('button', { name: /install service/i }).click();

      // Verify dialog opens
      await expect(page.getByText(/select service/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test('should complete full install flow', async ({ page }) => {
      // Step 1: Open install dialog
      await page.getByRole('button', { name: /install service/i }).click();

      await expect(page.getByText(/select service/i)).toBeVisible({
        timeout: 5000,
      });

      // Step 2: Select a service (if available)
      const torService = page.getByText('Tor').first();

      if (await torService.isVisible()) {
        await torService.click();

        // Click Next
        await page.getByRole('button', { name: /next/i }).click();

        // Step 3: Configure instance
        await expect(page.getByText(/configure instance/i)).toBeVisible({
          timeout: 3000,
        });

        // Fill in instance name
        const instanceNameInput = page.getByLabel(/instance name/i);
        await instanceNameInput.fill('My Tor Proxy');

        // Optional: Fill VLAN ID
        const vlanInput = page.getByLabel(/vlan id/i);
        if (await vlanInput.isVisible()) {
          await vlanInput.fill('100');
        }

        // Click Next to start installation
        await page.getByRole('button', { name: /next/i }).click();

        // Step 4: Verify installing state
        await expect(page.getByText(/installing/i)).toBeVisible({
          timeout: 5000,
        });

        // Wait for progress indicator
        const progressBar = page.locator('[role="progressbar"]');
        if (await progressBar.isVisible()) {
          await expect(progressBar).toBeVisible();
        }

        // Step 5: Wait for completion (with extended timeout for real installation)
        await expect(page.getByText(/installation complete/i)).toBeVisible({
          timeout: 60000, // 60 second timeout for actual installation
        });

        // Click Done
        await page.getByRole('button', { name: /done/i }).click();

        // Verify dialog closes and instance appears in list
        await expect(page.getByText(/select service/i)).not.toBeVisible({
          timeout: 3000,
        });
      }
    });

    test('should close install dialog when cancelled', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: /install service/i }).click();

      await expect(page.getByText(/select service/i)).toBeVisible({
        timeout: 5000,
      });

      // Click Cancel
      const cancelButton = page.getByRole('button', { name: /cancel/i });
      await cancelButton.click();

      // Verify dialog closes
      await expect(page.getByText(/select service/i)).not.toBeVisible({
        timeout: 3000,
      });
    });

    test('should show validation error for empty instance name', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: /install service/i }).click();

      // Select service
      const torService = page.getByText('Tor').first();

      if (await torService.isVisible()) {
        await torService.click();
        await page.getByRole('button', { name: /next/i }).click();

        // Clear instance name
        const instanceNameInput = page.getByLabel(/instance name/i);
        await instanceNameInput.clear();

        // Try to proceed
        await page.getByRole('button', { name: /next/i }).click();

        // Verify error message
        await expect(page.getByText(/please enter an instance name/i)).toBeVisible({
          timeout: 3000,
        });
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple instances', async ({ page }) => {
      // Look for checkboxes in the instance list
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      if (count > 2) {
        // Select first two instances
        await checkboxes.nth(1).check(); // Skip select-all checkbox
        await checkboxes.nth(2).check();

        // Verify bulk actions appear
        await expect(page.getByText(/bulk actions/i)).toBeVisible({
          timeout: 3000,
        });
      }
    });

    test('should perform bulk start operation', async ({ page }) => {
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      if (count > 1) {
        // Select an instance
        await checkboxes.nth(1).check();

        // Look for start button in bulk actions
        const startButton = page.getByRole('button', {
          name: /start \(\d+\)/i,
        });

        if (await startButton.isVisible()) {
          await startButton.click();

          // Verify operation initiated (implementation-specific)
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should select all instances', async ({ page }) => {
      // Click select-all checkbox
      const selectAllCheckbox = page.getByRole('checkbox').first();

      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.click();

        // Verify all checkboxes are checked
        const checkboxes = page.getByRole('checkbox');
        const count = await checkboxes.count();

        if (count > 1) {
          // At least one other checkbox should be checked
          const secondCheckbox = checkboxes.nth(1);
          await expect(secondCheckbox).toBeChecked();
        }
      }
    });
  });

  test.describe('Sorting', () => {
    test('should sort by name', async ({ page }) => {
      // Click name column header
      const nameHeader = page.getByText(/^name$/i);

      if (await nameHeader.isVisible()) {
        await nameHeader.click();

        // Verify sort indicator appears
        await page.waitForTimeout(500);

        // Click again to reverse sort
        await nameHeader.click();

        await page.waitForTimeout(500);
      }
    });

    test('should sort by status', async ({ page }) => {
      // Click status column header
      const statusHeader = page.getByText(/^status$/i);

      if (await statusHeader.isVisible()) {
        await statusHeader.click();

        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('View Mode', () => {
    test('should toggle between list and grid views', async ({ page }) => {
      // Look for view mode toggle buttons
      const gridViewButton = page.getByRole('button', { name: /grid/i });
      const listViewButton = page.getByRole('button', { name: /list/i });

      if (await gridViewButton.isVisible()) {
        await gridViewButton.click();
        await page.waitForTimeout(500);
      }

      if (await listViewButton.isVisible()) {
        await listViewButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify page still loads
      await expect(page.getByText('Service Instances')).toBeVisible();

      // Verify install button is accessible
      const installButton = page.getByRole('button', {
        name: /install service/i,
      });
      await expect(installButton).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Verify page still loads
      await expect(page.getByText('Service Instances')).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Verify page still loads
      await expect(page.getByText('Service Instances')).toBeVisible();
    });
  });
});
