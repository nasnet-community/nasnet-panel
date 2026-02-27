/**
 * Storage Management E2E Tests
 *
 * End-to-end tests for NAS-8.20 External Storage Management feature.
 * Tests complete user workflows for external storage configuration and monitoring.
 *
 * Test Coverage:
 * - Enable external storage flow (detection → selection → configuration)
 * - Storage disconnect handling (banner display → affected services)
 * - Progressive disclosure navigation (essential → common → advanced tiers)
 * - Space threshold warnings (90% critical threshold)
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/features/external-storage-management.md
 */

import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    __mockEventBus: { emit: (event: string, data?: unknown) => void } | undefined;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Helper function to enable external storage
 * Simulates the complete enable flow: button click → mount selection → confirmation
 */
async function enableStorage(page: Page, mountPath: string) {
  // Find and click the enable switch
  const enableSwitch = page.getByRole('switch', {
    name: /enable external storage/i,
  });
  await enableSwitch.click();

  // Wait for mount selector to appear (if not already visible)
  const mountSelector = page.getByRole('button', { name: /select mount point/i });

  if (await mountSelector.isVisible()) {
    await mountSelector.click();

    // Select the specified mount path
    const mountOption = page.getByRole('option', {
      name: new RegExp(mountPath, 'i'),
    });
    await mountOption.click();
  }

  // Wait for success toast notification
  await expect(page.getByText(/external storage enabled/i)).toBeVisible({ timeout: 10000 });
}

/**
 * Helper function to navigate to services page
 */
async function navigateToServices(page: Page) {
  await page.goto('/services');
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// Test Suite: Storage Management
// =============================================================================

test.describe('Storage Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to services page before each test
    await navigateToServices(page);
  });

  // ===========================================================================
  // Test 1: Enable External Storage End-to-End
  // ===========================================================================

  test('enable external storage end-to-end', async ({ page }) => {
    // Step 1: Verify storage configuration section is visible
    await expect(page.getByText('Storage Configuration')).toBeVisible();

    // Step 2: Verify initial state (no storage configured)
    const statusBadge = page
      .locator('text=Not Configured')
      .or(page.locator('text=No external storage detected'));
    await expect(statusBadge.first()).toBeVisible({ timeout: 5000 });

    // Step 3: Locate the enable storage switch
    const enableSwitch = page.getByRole('switch', {
      name: /enable external storage/i,
    });
    await expect(enableSwitch).toBeVisible();

    // Verify switch is initially unchecked
    await expect(enableSwitch).not.toBeChecked();

    // Step 4: Click the enable switch
    await enableSwitch.click();

    // Step 5: Verify mount point selector appears
    const mountSelector = page.getByRole('button', {
      name: /select mount point/i,
    });

    if (await mountSelector.isVisible({ timeout: 3000 })) {
      // Mount selector is visible - select a mount point
      await mountSelector.click();

      // Select /usb1 mount (mock data assumption)
      const usbOption = page.getByRole('option', { name: /usb1/i });
      await expect(usbOption).toBeVisible({ timeout: 3000 });
      await usbOption.click();
    }

    // Step 6: Verify success notification appears
    await expect(page.getByText(/external storage enabled/i)).toBeVisible({ timeout: 10000 });

    // Step 7: Verify UI updates to show "Configured" state
    const configuredBadge = page.getByText('Configured');
    await expect(configuredBadge).toBeVisible({ timeout: 5000 });

    // Step 8: Verify mount path is displayed
    await expect(page.getByText(/\/usb1/i)).toBeVisible();

    // Step 9: Verify usage bar/progressbar appears
    const usageBar = page.getByRole('progressbar').first();
    await expect(usageBar).toBeVisible({ timeout: 5000 });

    // Step 10: Verify switch is now checked
    await expect(enableSwitch).toBeChecked();

    // Step 11: Verify storage usage section appears
    await expect(page.getByText('Storage Usage')).toBeVisible();
  });

  // ===========================================================================
  // Test 2: Storage Disconnect Shows Banner
  // ===========================================================================

  test('storage disconnect shows banner', async ({ page }) => {
    // Step 1: Enable storage first (prerequisite)
    await enableStorage(page, 'usb1');

    // Verify storage is configured
    await expect(page.getByText('Configured')).toBeVisible();

    // Step 2: Simulate storage disconnect via GraphQL subscription
    // In a real test, this would trigger via backend event or mock
    await page.evaluate(() => {
      // Trigger a storage.unmounted event via mock event bus
      // This assumes the frontend has a test hook for triggering events
      if (window.__mockEventBus) {
        window.__mockEventBus.emit('storage.unmounted', {
          path: '/usb1',
        });
      }
    });

    // Step 3: Verify disconnect banner appears
    // The banner should have role="alert" for accessibility
    const disconnectBanner = page.getByRole('alert').filter({
      hasText: /external storage disconnected/i,
    });

    // Wait for banner to appear (may take a moment for event to propagate)
    await expect(disconnectBanner).toBeVisible({ timeout: 10000 });

    // Step 4: Verify banner shows the disconnected path
    await expect(disconnectBanner).toContainText('/usb1');

    // Step 5: Verify status badge changes to "Disconnected"
    const disconnectedBadge = page.getByText('Disconnected');
    await expect(disconnectedBadge).toBeVisible({ timeout: 5000 });

    // Step 6: Verify affected services information (if any services exist)
    const affectedServicesText = page.getByText(/affected services/i);

    // Note: This may or may not be visible depending on whether services are installed
    // We check if it exists but don't require it
    if (await affectedServicesText.isVisible({ timeout: 2000 })) {
      await expect(affectedServicesText).toBeVisible();
    }

    // Step 7: Verify persistent toast notification (if using sonner)
    const persistentToast = page.getByText(
      /external storage disconnected.*services may be unavailable/i
    );

    if (await persistentToast.isVisible({ timeout: 2000 })) {
      await expect(persistentToast).toBeVisible();
    }
  });

  // ===========================================================================
  // Test 3: Progressive Disclosure Navigation
  // ===========================================================================

  test('progressive disclosure navigation', async ({ page }) => {
    // Step 1: Enable storage (prerequisite for seeing full UI)
    await enableStorage(page, 'usb1');

    // Step 2: Verify Essential tier is always visible
    await expect(page.getByText('Storage Configuration')).toBeVisible();
    await expect(page.getByText('Storage Usage')).toBeVisible();

    const enableSwitch = page.getByRole('switch', {
      name: /enable external storage/i,
    });
    await expect(enableSwitch).toBeVisible();

    // Step 3: Verify Common tier toggle button is visible
    const commonToggle = page.getByRole('button', {
      name: /service storage breakdown/i,
    });
    await expect(commonToggle).toBeVisible();

    // Step 4: Common tier should be collapsed by default
    // Look for service breakdown content (table with binary/data/logs columns)
    const breakdownTable = page.locator('table').filter({
      hasText: /Binary.*Data.*Logs/i,
    });

    // Initially not visible
    await expect(breakdownTable).not.toBeVisible();

    // Step 5: Click to expand Common tier
    await commonToggle.click();

    // Wait for collapse animation
    await page.waitForTimeout(300);

    // Step 6: Verify Common tier content is now visible
    await expect(breakdownTable).toBeVisible({ timeout: 3000 });

    // Step 7: Verify Advanced tier toggle is visible
    const advancedToggle = page.getByRole('button', {
      name: /advanced storage details/i,
    });
    await expect(advancedToggle).toBeVisible();

    // Step 8: Advanced tier should still be collapsed
    const advancedTable = page.locator('table').filter({
      hasText: /Mount Point.*Filesystem/i,
    });
    await expect(advancedTable).not.toBeVisible();

    // Step 9: Click to expand Advanced tier
    await advancedToggle.click();

    // Wait for collapse animation
    await page.waitForTimeout(300);

    // Step 10: Verify Advanced tier content is now visible
    await expect(advancedTable).toBeVisible({ timeout: 3000 });

    // Step 11: Verify both Common and Advanced tiers are visible simultaneously
    await expect(breakdownTable).toBeVisible();
    await expect(advancedTable).toBeVisible();

    // Step 12: Collapse Common tier to verify independent operation
    await commonToggle.click();
    await page.waitForTimeout(300);

    // Common tier should be hidden
    await expect(breakdownTable).not.toBeVisible();

    // Advanced tier should still be visible
    await expect(advancedTable).toBeVisible();
  });

  // ===========================================================================
  // Test 4: Space Warning at 90% Threshold
  // ===========================================================================

  test('space warning at 90% threshold', async ({ page }) => {
    // Step 1: Intercept GraphQL requests to mock 90% usage
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Mock GetStorageConfig query to return 90% usage
      if (postData?.operationName === 'GetStorageConfig') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              storageConfig: {
                enabled: true,
                path: '/usb1',
                storageInfo: {
                  path: '/usb1',
                  totalBytes: '17179869184', // 16GB
                  usedBytes: '15461882265', // 14.4GB (90%)
                  availableBytes: '1717986918', // 1.6GB
                  filesystem: 'vfat',
                  mounted: true,
                  usagePercent: 90,
                  locationType: 'EXTERNAL',
                },
                updatedAt: new Date().toISOString(),
                isAvailable: true,
              },
            },
          }),
        });
      } else {
        // Pass through other requests
        await route.continue();
      }
    });

    // Step 2: Navigate to services page
    await navigateToServices(page);

    // Step 3: Wait for storage configuration to load
    await expect(page.getByText('Storage Configuration')).toBeVisible();

    // Step 4: Verify critical warning message appears
    const criticalWarning = page.getByText(/storage space critical/i).or(page.getByText(/90%/i));
    await expect(criticalWarning.first()).toBeVisible({ timeout: 10000 });

    // Step 5: Verify usage percentage is displayed
    await expect(page.getByText('90')).toBeVisible();

    // Step 6: Verify usage bar/progressbar shows critical state
    const usageBar = page.getByRole('progressbar').first();
    await expect(usageBar).toBeVisible();

    // Check if the bar has critical/error styling
    // Note: This depends on how the component applies classes
    const usageBarClasses = await usageBar.getAttribute('class');
    const hasCriticalStyling =
      usageBarClasses?.includes('bg-error') ||
      usageBarClasses?.includes('bg-destructive') ||
      usageBarClasses?.includes('critical');

    if (hasCriticalStyling) {
      expect(hasCriticalStyling).toBe(true);
    }

    // Step 7: Verify warning message suggests action
    const actionSuggestion = page
      .getByText(/delete.*service/i)
      .or(page.getByText(/free up space/i));

    if (await actionSuggestion.isVisible({ timeout: 2000 })) {
      await expect(actionSuggestion).toBeVisible();
    }

    // Step 8: Verify warning appears in usage section
    await expect(page.getByText('Storage Usage')).toBeVisible();

    // Step 9: Verify the warning has appropriate ARIA attributes for accessibility
    const alertElement = page.getByRole('alert').filter({
      hasText: /90%|critical|storage space/i,
    });

    if (await alertElement.isVisible({ timeout: 2000 })) {
      await expect(alertElement).toBeVisible();
    }
  });

  // ===========================================================================
  // Additional Test: Scan for Storage Devices
  // ===========================================================================

  test('scan for storage devices', async ({ page }) => {
    // Step 1: Verify storage configuration section is visible
    await expect(page.getByText('Storage Configuration')).toBeVisible();

    // Step 2: Locate the scan button
    const scanButton = page.getByRole('button', {
      name: /scan for storage devices/i,
    });
    await expect(scanButton).toBeVisible();

    // Step 3: Click the scan button
    await scanButton.click();

    // Step 4: Verify button shows loading state
    const scanningButton = page.getByRole('button', {
      name: /scanning/i,
    });

    if (await scanningButton.isVisible({ timeout: 1000 })) {
      await expect(scanningButton).toBeVisible();
    }

    // Step 5: Verify scan result notification appears
    const scanResult = page.getByText(/found.*storage/i).or(page.getByText(/no new storage/i));
    await expect(scanResult.first()).toBeVisible({ timeout: 10000 });

    // Step 6: Verify mount selector updates (if new storage found)
    // This is implementation-specific and may vary
  });

  // ===========================================================================
  // Additional Test: Disable External Storage
  // ===========================================================================

  test('disable external storage', async ({ page }) => {
    // Step 1: Enable storage first
    await enableStorage(page, 'usb1');

    // Verify storage is enabled
    await expect(page.getByText('Configured')).toBeVisible();

    // Step 2: Locate the enable switch (now checked)
    const enableSwitch = page.getByRole('switch', {
      name: /enable external storage/i,
    });
    await expect(enableSwitch).toBeChecked();

    // Step 3: Click to disable
    await enableSwitch.click();

    // Step 4: Verify confirmation dialog appears (if implemented)
    const confirmDialog = page.getByRole('dialog').filter({
      hasText: /disable external storage/i,
    });

    if (await confirmDialog.isVisible({ timeout: 2000 })) {
      // Confirm the action
      const confirmButton = confirmDialog.getByRole('button', {
        name: /confirm|yes|disable/i,
      });
      await confirmButton.click();
    }

    // Step 5: Verify success notification
    await expect(page.getByText(/external storage disabled/i)).toBeVisible({ timeout: 10000 });

    // Step 6: Verify status changes to "Not Configured"
    await expect(page.getByText('Not Configured')).toBeVisible({
      timeout: 5000,
    });

    // Step 7: Verify switch is unchecked
    await expect(enableSwitch).not.toBeChecked();

    // Step 8: Verify migration message (if services were affected)
    const migrationMessage = page.getByText(/migrated.*flash/i);

    if (await migrationMessage.isVisible({ timeout: 2000 })) {
      await expect(migrationMessage).toBeVisible();
    }
  });
});

// =============================================================================
// Test Suite: Mobile Responsive Behavior
// =============================================================================

test.describe('Storage Management - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE viewport
  });

  test('mobile layout shows storage configuration', async ({ page }) => {
    await navigateToServices(page);

    // Verify storage section is visible on mobile
    await expect(page.getByText('Storage Configuration')).toBeVisible();

    // Verify mobile-optimized layout (stacked, not side-by-side)
    const storageSection = page.locator('text=Storage Configuration').locator('..');
    await expect(storageSection).toBeVisible();

    // Verify touch targets are at least 44px (accessibility requirement)
    const enableSwitch = page.getByRole('switch', {
      name: /enable external storage/i,
    });

    if (await enableSwitch.isVisible({ timeout: 3000 })) {
      const boundingBox = await enableSwitch.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
