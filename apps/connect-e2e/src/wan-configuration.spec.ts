/**
 * WAN Configuration E2E Tests
 *
 * End-to-end tests for WAN link configuration workflow.
 * Tests all connection types: DHCP, PPPoE, Static IP, and LTE.
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = '/dashboard/wan';

/**
 * Setup: Navigate to WAN Management page before each test
 */
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/WAN Management/);
});

// =============================================================================
// Scenario 1: DHCP Client Configuration
// =============================================================================

test.describe('DHCP Client Configuration', () => {
  test('should configure DHCP WAN successfully', async ({ page }) => {
    // Step 1: Open configuration dialog
    await page.getByRole('button', { name: /add wan/i }).click();

    // Step 2: Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/add wan connection/i)).toBeVisible();

    // Step 3: Select DHCP Client type
    await page.getByRole('button', { name: /dhcp client/i }).click();

    // Step 4: Fill out DHCP form
    await page.getByLabel(/interface/i).fill('ether1');

    // Step 5: Enable options
    await page.getByLabel(/add default route/i).check();
    await page.getByLabel(/use peer dns/i).check();
    await page.getByLabel(/use peer ntp/i).check();

    // Step 6: Add comment
    await page.getByLabel(/comment/i).fill('Test DHCP WAN Configuration');

    // Step 7: Submit form
    await page.getByRole('button', { name: /configure dhcp client/i }).click();

    // Step 8: Wait for success state
    await expect(page.getByText(/dhcp client configured/i)).toBeVisible({ timeout: 5000 });

    // Step 9: Verify dialog closes automatically
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Step 10: Verify WAN appears in overview list
    await expect(page.getByText('ether1')).toBeVisible();
    await expect(page.getByText(/dhcp/i)).toBeVisible();
  });

  test('should show validation errors for invalid DHCP input', async ({ page }) => {
    // Open dialog and select DHCP
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /dhcp client/i }).click();

    // Try to submit without interface
    await page.getByRole('button', { name: /configure dhcp client/i }).click();

    // Verify validation error
    await expect(page.getByText(/interface is required/i)).toBeVisible();
  });

  test('should allow canceling DHCP configuration', async ({ page }) => {
    // Open dialog and select DHCP
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /dhcp client/i }).click();

    // Fill some data
    await page.getByLabel(/interface/i).fill('ether1');

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verify dialog is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

// =============================================================================
// Scenario 2: PPPoE Wizard Flow
// =============================================================================

test.describe('PPPoE Configuration Wizard', () => {
  test('should complete PPPoE wizard successfully', async ({ page }) => {
    // Step 1: Open configuration dialog
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /pppoe/i }).click();

    // Step 2: Interface Selection (Step 1/5)
    await expect(page.getByText(/step 1/i)).toBeVisible();
    await page.getByLabel(/interface/i).fill('ether2');
    await page.getByLabel(/pppoe name/i).fill('pppoe-wan');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Credentials (Step 2/5)
    await expect(page.getByText(/step 2/i)).toBeVisible();
    await page.getByLabel(/username/i).fill('testuser@isp.com');
    await page.getByLabel(/password/i).fill('secretpassword123');

    // Verify password is masked
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Toggle password visibility
    await page.getByRole('button', { name: /show password/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Options (Step 3/5)
    await expect(page.getByText(/step 3/i)).toBeVisible();

    // Select MTU preset
    await page.getByRole('combobox', { name: /mtu/i }).selectOption('1492');

    // Enable options
    await page.getByLabel(/add default route/i).check();
    await page.getByLabel(/use peer dns/i).check();

    await page.getByRole('button', { name: /next/i }).click();

    // Step 5: Preview (Step 4/5)
    await expect(page.getByText(/step 4/i)).toBeVisible();
    await expect(page.getByText(/preview/i)).toBeVisible();

    // Verify RouterOS commands are shown
    await expect(page.getByText(/\/interface\/pppoe-client\/add/i)).toBeVisible();

    // Verify password is NOT shown in preview
    await expect(page.getByText(/secretpassword123/)).not.toBeVisible();
    await expect(page.getByText(/\*{8,}/)).toBeVisible(); // Masked password

    await page.getByRole('button', { name: /next/i }).click();

    // Step 6: Confirmation (Step 5/5)
    await expect(page.getByText(/step 5/i)).toBeVisible();
    await page.getByRole('button', { name: /configure pppoe/i }).click();

    // Step 7: Wait for success
    await expect(page.getByText(/pppoe configured/i)).toBeVisible({ timeout: 5000 });

    // Step 8: Verify WAN appears in list
    await expect(page.getByText('pppoe-wan')).toBeVisible();
    await expect(page.getByText(/connecting|connected/i)).toBeVisible();
  });

  test('should allow navigating back in PPPoE wizard', async ({ page }) => {
    // Open PPPoE wizard
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /pppoe/i }).click();

    // Fill step 1
    await page.getByLabel(/interface/i).fill('ether2');
    await page.getByRole('button', { name: /next/i }).click();

    // Go to step 2
    await expect(page.getByText(/step 2/i)).toBeVisible();
    await page.getByLabel(/username/i).fill('user@test.com');

    // Go back to step 1
    await page.getByRole('button', { name: /back/i }).click();

    // Verify step 1 is shown with preserved data
    await expect(page.getByText(/step 1/i)).toBeVisible();
    await expect(page.getByLabel(/interface/i)).toHaveValue('ether2');
  });

  test('should validate required fields in PPPoE wizard', async ({ page }) => {
    // Open PPPoE wizard
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /pppoe/i }).click();

    // Try to proceed without filling required fields
    await page.getByRole('button', { name: /next/i }).click();

    // Verify validation errors
    await expect(page.getByText(/interface is required/i)).toBeVisible();
    await expect(page.getByText(/pppoe name is required/i)).toBeVisible();
  });
});

// =============================================================================
// Scenario 3: Static IP Configuration
// =============================================================================

test.describe('Static IP Configuration', () => {
  test('should configure static IP WAN successfully', async ({ page }) => {
    // Step 1: Open configuration dialog
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /static ip/i }).click();

    // Step 2: Fill out static IP form
    await page.getByLabel(/interface/i).fill('ether3');
    await page.getByLabel(/ip address \/ cidr/i).fill('203.0.113.10/24');
    await page.getByLabel(/gateway/i).fill('203.0.113.1');

    // Step 3: Configure DNS
    await page.getByRole('combobox', { name: /dns preset/i }).selectOption('Cloudflare');

    // Verify DNS fields are populated
    await expect(page.getByLabel(/primary dns/i)).toHaveValue('1.1.1.1');
    await expect(page.getByLabel(/secondary dns/i)).toHaveValue('1.0.0.1');

    // Step 4: Add comment
    await page.getByLabel(/comment/i).fill('Test Static IP WAN');

    // Step 5: Submit form
    await page.getByRole('button', { name: /configure static ip/i }).click();

    // Step 6: Wait for success
    await expect(page.getByText(/static ip configured/i)).toBeVisible({ timeout: 5000 });

    // Step 7: Verify WAN in overview
    await expect(page.getByText('ether3')).toBeVisible();
    await expect(page.getByText('203.0.113.10')).toBeVisible();
    await expect(page.getByText(/static/i)).toBeVisible();
  });

  test('should validate CIDR notation', async ({ page }) => {
    // Open static IP form
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /static ip/i }).click();

    // Enter invalid CIDR
    await page.getByLabel(/ip address \/ cidr/i).fill('192.168.1.10'); // Missing /XX

    // Try to submit
    await page.getByRole('button', { name: /configure static ip/i }).click();

    // Verify validation error
    await expect(page.getByText(/invalid cidr notation/i)).toBeVisible();
  });

  test('should validate gateway is in same subnet', async ({ page }) => {
    // Open static IP form
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /static ip/i }).click();

    // Enter IP in 192.168.1.0/24
    await page.getByLabel(/ip address \/ cidr/i).fill('192.168.1.10/24');

    // Enter gateway in different subnet
    await page.getByLabel(/gateway/i).fill('10.0.0.1');

    // Blur to trigger validation
    await page.getByLabel(/comment/i).click();

    // Verify validation error
    await expect(page.getByText(/gateway must be in the same subnet/i)).toBeVisible();
  });
});

// =============================================================================
// Scenario 4: LTE Modem Configuration
// =============================================================================

test.describe('LTE Modem Configuration', () => {
  test('should configure LTE modem successfully', async ({ page }) => {
    // Step 1: Open configuration dialog
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /lte.*4g modem/i }).click();

    // Step 2: Fill basic LTE settings
    await page.getByLabel(/interface name/i).fill('lte1');

    // Step 3: Select carrier preset
    await page.getByRole('combobox', { name: /carrier preset/i }).selectOption('T-Mobile (US)');

    // Verify APN is auto-filled
    await expect(page.getByLabel(/^apn$/i)).toHaveValue('fast.t-mobile.com');

    // Step 4: Configure SIM PIN (expand section)
    await page.getByText(/sim pin/i).click();
    await page.getByLabel(/pin.*4-8 digits/i).fill('1234');

    // Step 5: Configure advanced options
    await page.getByText(/advanced options/i).click();
    await page.getByLabel(/mtu/i).fill('1450');
    await page.getByLabel(/default route/i).check();
    await page.getByLabel(/enable interface/i).check();

    // Step 6: Submit form
    await page.getByRole('button', { name: /configure lte modem/i }).click();

    // Step 7: Wait for success
    await expect(page.getByText(/lte modem configured/i)).toBeVisible({ timeout: 5000 });

    // Step 8: Verify LTE WAN in overview
    await expect(page.getByText('lte1')).toBeVisible();
    await expect(page.getByText(/lte/i)).toBeVisible();
  });

  test('should display signal strength indicator', async ({ page }) => {
    // Navigate to page with mock signal data
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          wanInterface: {
            id: 'wan-lte-1',
            interfaceName: 'lte1',
            connectionType: 'LTE',
            lteModem: {
              signalStrength: -75,
              signalQuality: 85,
            },
          },
        },
      };
      await route.fulfill({ json });
    });

    // Open LTE configuration
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /lte.*4g modem/i }).click();

    // Verify signal strength is displayed
    await expect(page.getByText(/signal status/i)).toBeVisible();
    await expect(page.getByText(/-75 dBm/i)).toBeVisible();
    await expect(page.getByText(/signal quality: 85%/i)).toBeVisible();
    await expect(page.getByText(/good/i)).toBeVisible(); // -75 dBm is "Good"
  });

  test('should validate APN format', async ({ page }) => {
    // Open LTE form
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /lte.*4g modem/i }).click();

    // Enter invalid APN (contains spaces)
    await page.getByLabel(/^apn$/i).fill('invalid apn with spaces');

    // Try to submit
    await page.getByRole('button', { name: /configure lte modem/i }).click();

    // Verify validation error
    await expect(
      page.getByText(/apn can only contain letters.*numbers.*dots.*hyphens/i)
    ).toBeVisible();
  });
});

// =============================================================================
// Scenario 5: WAN Overview and Real-time Updates
// =============================================================================

test.describe('WAN Overview', () => {
  test('should display WAN interfaces in overview', async ({ page }) => {
    // Wait for overview to load
    await expect(page.getByText(/wan management/i)).toBeVisible();

    // Verify tab navigation
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /health monitoring/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /connection history/i })).toBeVisible();

    // Mock WAN data
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          wanInterfaces: [
            {
              id: 'wan-1',
              interfaceName: 'pppoe-wan',
              connectionType: 'PPPOE',
              status: 'CONNECTED',
              publicIP: '203.0.113.45',
              isDefaultRoute: true,
              healthStatus: 'HEALTHY',
            },
            {
              id: 'wan-2',
              interfaceName: 'ether1',
              connectionType: 'DHCP',
              status: 'DISCONNECTED',
              isDefaultRoute: false,
            },
          ],
        },
      };
      await route.fulfill({ json });
    });

    // Reload to get mocked data
    await page.reload();

    // Verify WAN cards are displayed
    await expect(page.getByText('pppoe-wan')).toBeVisible();
    await expect(page.getByText(/connected/i)).toBeVisible();
    await expect(page.getByText('203.0.113.45')).toBeVisible();
  });

  test('should allow refreshing WAN list', async ({ page }) => {
    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Verify loading state appears briefly
    await expect(page.getByText(/loading/i)).toBeVisible({ timeout: 1000 });
  });

  test('should show empty state when no WANs configured', async ({ page }) => {
    // Mock empty WAN list
    await page.route('**/graphql', async (route) => {
      const json = { data: { wanInterfaces: [] } };
      await route.fulfill({ json });
    });

    await page.reload();

    // Verify empty state
    await expect(page.getByText(/no wan configured/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add.*wan/i })).toBeVisible();
  });
});

// =============================================================================
// Scenario 6: Connection History
// =============================================================================

test.describe('Connection History', () => {
  test('should display connection history timeline', async ({ page }) => {
    // Navigate to history tab
    await page.getByRole('tab', { name: /connection history/i }).click();

    // Verify tab content is visible
    await expect(page.getByRole('tabpanel', { name: /connection history/i })).toBeVisible();

    // Verify filter controls
    await expect(page.getByPlaceholder(/search by ip.*interface.*reason/i)).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter/i })).toBeVisible();

    // Mock history data
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          wanConnectionHistory: {
            total: 3,
            events: [
              {
                id: 'event-1',
                eventType: 'CONNECTED',
                timestamp: new Date().toISOString(),
                publicIP: '203.0.113.10',
                reason: 'PPPoE authentication successful',
              },
              {
                id: 'event-2',
                eventType: 'DISCONNECTED',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                reason: 'Link down detected',
                duration: 120,
              },
              {
                id: 'event-3',
                eventType: 'IP_CHANGED',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                publicIP: '203.0.113.45',
              },
            ],
          },
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Verify events are displayed
    await expect(page.getByText(/connected/i)).toBeVisible();
    await expect(page.getByText('203.0.113.10')).toBeVisible();
  });

  test('should filter connection history by event type', async ({ page }) => {
    // Navigate to history tab
    await page.getByRole('tab', { name: /connection history/i }).click();

    // Select filter
    await page.getByRole('combobox', { name: /filter/i }).selectOption('CONNECTED');

    // Verify only CONNECTED events are shown
    await expect(page.getByText(/connected/i)).toBeVisible();
    await expect(page.getByText(/disconnected/i)).not.toBeVisible();
  });

  test('should search connection history', async ({ page }) => {
    // Navigate to history tab
    await page.getByRole('tab', { name: /connection history/i }).click();

    // Enter search query
    await page.getByPlaceholder(/search by ip.*interface.*reason/i).fill('203.0.113.10');

    // Verify filtered results
    await expect(page.getByText('203.0.113.10')).toBeVisible();

    // Other IPs should not be visible
    await expect(page.getByText('198.51.100')).not.toBeVisible();
  });

  test('should paginate connection history', async ({ page }) => {
    // Navigate to history tab with many events
    await page.getByRole('tab', { name: /connection history/i }).click();

    // Wait for events to load
    await page
      .waitForSelector('[data-testid="connection-event"]', { timeout: 3000 })
      .catch(() => {});

    // Verify pagination controls
    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous/i });

    // Previous should be disabled on first page
    await expect(prevButton).toBeDisabled();

    // Click next (if available)
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Previous should now be enabled
      await expect(prevButton).toBeEnabled();
    }
  });
});

// =============================================================================
// Scenario 7: Health Monitoring
// =============================================================================

test.describe('Health Monitoring', () => {
  test('should configure health check for WAN', async ({ page }) => {
    // Assume we have a WAN configured
    // Click configure on a WAN card
    const configureButton = page.getByRole('button', { name: /configure/i }).first();
    await configureButton.click();

    // Select health check option
    await page.getByRole('button', { name: /health check/i }).click();

    // Fill health check form
    await page.getByLabel(/target.*ip.*hostname/i).fill('1.1.1.1');
    await page.getByLabel(/interval/i).fill('10');
    await page.getByLabel(/enable health check/i).check();

    // Submit
    await page.getByRole('button', { name: /save health check/i }).click();

    // Verify success
    await expect(page.getByText(/health check configured/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display health status on WAN card', async ({ page }) => {
    // Mock WAN with health status
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          wanInterface: {
            id: 'wan-1',
            healthStatus: 'HEALTHY',
            healthLatency: 12,
            healthTarget: '1.1.1.1',
          },
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Verify health indicator
    await expect(page.getByText(/healthy/i)).toBeVisible();
    await expect(page.getByText(/12.*ms/i)).toBeVisible(); // Latency
  });
});

// =============================================================================
// Scenario 8: Accessibility Testing
// =============================================================================

test.describe('Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    // Tab to Add WAN button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter to open dialog
    await page.keyboard.press('Enter');

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify dialog is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Open configuration dialog
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /dhcp client/i }).click();

    // Verify ARIA labels
    const interfaceInput = page.getByLabel(/interface/i);
    await expect(interfaceInput).toHaveAttribute('aria-label');
  });

  test('should announce form errors to screen readers', async ({ page }) => {
    // Open DHCP form
    await page.getByRole('button', { name: /add wan/i }).click();
    await page.getByRole('button', { name: /dhcp client/i }).click();

    // Submit without filling required fields
    await page.getByRole('button', { name: /configure dhcp client/i }).click();

    // Verify error has proper ARIA attributes
    const errorMessage = page.getByText(/interface is required/i);
    await expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
