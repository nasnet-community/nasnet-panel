/**
 * Address Lists E2E Tests
 *
 * End-to-end tests for Address Lists management feature.
 * Tests all workflows: view, create, context menu, bulk import/export, navigation.
 *
 * Story: NAS-7.3 - Implement Address Lists
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = '/dashboard/firewall/address-lists';

// Mock address list data
const MOCK_ADDRESS_LISTS = [
  {
    name: 'blocklist',
    entryCount: 150,
    dynamicCount: 5,
    referencingRulesCount: 3,
  },
  {
    name: 'trusted_devices',
    entryCount: 12,
    dynamicCount: 0,
    referencingRulesCount: 2,
  },
  {
    name: 'internal_network',
    entryCount: 3,
    dynamicCount: 0,
    referencingRulesCount: 5,
  },
];

const MOCK_ENTRIES = [
  {
    id: '*1',
    list: 'blocklist',
    address: '192.168.1.100',
    comment: 'Suspicious IP',
    timeout: '1d',
    creationTime: new Date().toISOString(),
    dynamic: false,
    disabled: false,
  },
  {
    id: '*2',
    list: 'blocklist',
    address: '10.0.0.50',
    comment: 'Blocked device',
    timeout: null,
    creationTime: new Date(Date.now() - 3600000).toISOString(),
    dynamic: false,
    disabled: false,
  },
  {
    id: '*3',
    list: 'blocklist',
    address: '172.16.0.0/24',
    comment: 'Blocked subnet',
    timeout: null,
    creationTime: new Date(Date.now() - 7200000).toISOString(),
    dynamic: false,
    disabled: false,
  },
];

/**
 * Setup: Navigate to Address Lists page before each test
 */
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// AC1: View address lists with entry count
// =============================================================================

test.describe('Address Lists View', () => {
  test('should display address lists with entry counts', async ({ page }) => {
    // Check page title/heading
    await expect(page.getByRole('heading', { name: /address lists/i })).toBeVisible();

    // Mock GraphQL response
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          addressLists: MOCK_ADDRESS_LISTS,
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Verify lists are displayed
    await expect(page.getByText('blocklist')).toBeVisible();
    await expect(page.getByText('trusted_devices')).toBeVisible();
    await expect(page.getByText('internal_network')).toBeVisible();

    // Verify entry count badges
    await expect(page.getByText('150')).toBeVisible(); // blocklist count
    await expect(page.getByText('12')).toBeVisible(); // trusted_devices count
    await expect(page.getByText('3')).toBeVisible(); // internal_network count
  });

  test('should display dynamic entries badge', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          addressLists: [
            {
              name: 'dynamic_test',
              entryCount: 25,
              dynamicCount: 10,
              referencingRulesCount: 1,
            },
          ],
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Verify dynamic badge is shown
    await expect(page.getByText(/dynamic/i)).toBeVisible();
    await expect(page.getByText('10')).toBeVisible(); // dynamic count
  });

  test('should sort lists by name', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          addressLists: MOCK_ADDRESS_LISTS,
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Click sort by name
    const nameHeader = page.getByRole('columnheader', { name: /name/i });
    if (await nameHeader.isVisible()) {
      await nameHeader.click();

      // Verify sorted order (ascending)
      const rows = page.locator('tbody tr');
      const firstRow = rows.first();
      await expect(firstRow).toContainText('blocklist');
    }
  });

  test('should sort lists by entry count', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          addressLists: MOCK_ADDRESS_LISTS,
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Click sort by entry count
    const countHeader = page.getByRole('columnheader', { name: /entries/i });
    if (await countHeader.isVisible()) {
      await countHeader.click();

      // Verify sorted order (descending - highest first)
      const rows = page.locator('tbody tr');
      const firstRow = rows.first();
      await expect(firstRow).toContainText('150');
    }
  });

  test('should show empty state when no lists exist', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const json = {
        data: {
          addressLists: [],
        },
      };
      await route.fulfill({ json });
    });

    await page.reload();

    // Verify empty state
    await expect(page.getByText(/no address lists/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add.*entry/i })).toBeVisible();
  });
});

// =============================================================================
// AC2: Expand each list to view entries
// =============================================================================

test.describe('Address List Entries Expansion', () => {
  test('should expand list to show entries (desktop)', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetAddressLists') {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      } else if (requestBody.operationName === 'GetAddressListEntries') {
        await route.fulfill({
          json: {
            data: {
              addressListEntries: {
                edges: MOCK_ENTRIES.map((entry, idx) => ({
                  cursor: `cursor_${idx}`,
                  node: entry,
                })),
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor_0',
                  endCursor: 'cursor_2',
                },
                totalCount: 3,
              },
            },
          },
        });
      }
    });

    await page.reload();

    // Click to expand list
    await page.getByText('blocklist').click();

    // Verify entries are displayed
    await expect(page.getByText('192.168.1.100')).toBeVisible();
    await expect(page.getByText('10.0.0.50')).toBeVisible();
    await expect(page.getByText('172.16.0.0/24')).toBeVisible();

    // Verify entry details
    await expect(page.getByText('Suspicious IP')).toBeVisible();
    await expect(page.getByText('Blocked device')).toBeVisible();
    await expect(page.getByText('Blocked subnet')).toBeVisible();
  });

  test('should open sheet panel on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetAddressLists') {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      }
    });

    await page.reload();

    // Click to open sheet
    await page.getByText('blocklist').click();

    // Verify sheet is visible
    const sheet = page.locator('[role="dialog"]').or(page.locator('[data-testid="sheet"]'));
    await expect(sheet).toBeVisible();
  });

  test('should handle infinite scroll for large lists', async ({ page }) => {
    // Mock large dataset
    const largeEntrySet = Array.from({ length: 100 }, (_, i) => ({
      id: `*${i}`,
      list: 'blocklist',
      address: `192.168.1.${i}`,
      comment: `Entry ${i}`,
      timeout: null,
      creationTime: new Date().toISOString(),
      dynamic: false,
      disabled: false,
    }));

    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetAddressListEntries') {
        const first = requestBody.variables.first || 50;
        const after = requestBody.variables.after;
        const startIdx = after ? parseInt(after.split('_')[1]) + 1 : 0;
        const endIdx = Math.min(startIdx + first, largeEntrySet.length);

        await route.fulfill({
          json: {
            data: {
              addressListEntries: {
                edges: largeEntrySet.slice(startIdx, endIdx).map((entry, idx) => ({
                  cursor: `cursor_${startIdx + idx}`,
                  node: entry,
                })),
                pageInfo: {
                  hasNextPage: endIdx < largeEntrySet.length,
                  hasPreviousPage: startIdx > 0,
                  startCursor: `cursor_${startIdx}`,
                  endCursor: `cursor_${endIdx - 1}`,
                },
                totalCount: largeEntrySet.length,
              },
            },
          },
        });
      } else {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      }
    });

    await page.reload();

    // Expand list
    await page.getByText('blocklist').click();

    // Wait for initial entries to load
    await expect(page.getByText('192.168.1.0')).toBeVisible();

    // Scroll to bottom to trigger load more
    const scrollContainer = page
      .locator('[data-testid="entries-list"]')
      .or(page.locator('.entries-container'));
    if (await scrollContainer.isVisible()) {
      await scrollContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // Wait for more entries to load
      await page.waitForTimeout(1000);

      // Verify more entries loaded
      await expect(page.getByText('192.168.1.50')).toBeVisible();
    }
  });

  test('should display timeout countdown', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetAddressListEntries') {
        await route.fulfill({
          json: {
            data: {
              addressListEntries: {
                edges: [
                  {
                    cursor: 'cursor_0',
                    node: {
                      id: '*1',
                      list: 'blocklist',
                      address: '192.168.1.100',
                      comment: 'Temporary block',
                      timeout: '1d',
                      creationTime: new Date().toISOString(),
                      dynamic: false,
                      disabled: false,
                    },
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor_0',
                  endCursor: 'cursor_0',
                },
                totalCount: 1,
              },
            },
          },
        });
      } else {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      }
    });

    await page.reload();

    // Expand list
    await page.getByText('blocklist').click();

    // Verify timeout is displayed
    await expect(page.getByText(/1d|24h|expires/i)).toBeVisible();
  });
});

// =============================================================================
// AC3: Create address list entry
// =============================================================================

test.describe('Create Address List Entry', () => {
  test('should create entry with IP address', async ({ page }) => {
    // Click Add Entry button
    await page.getByRole('button', { name: /add entry/i }).click();

    // Verify form dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill form
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('192.168.1.200');
    await page.getByLabel(/comment/i).fill('Test entry via E2E');

    // Submit form
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify success toast
    await expect(page.getByText(/entry created|added successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });

  test('should create entry with CIDR notation', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill form with CIDR
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('10.0.0.0/24');
    await page.getByLabel(/comment/i).fill('Blocked subnet');

    // Submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify success
    await expect(page.getByText(/entry created|added successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should create entry with IP range', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill form with IP range
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('192.168.1.1-192.168.1.50');
    await page.getByLabel(/comment/i).fill('IP range block');

    // Submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify success
    await expect(page.getByText(/entry created|added successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should create entry with timeout', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill form with timeout
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('203.0.113.50');
    await page.getByLabel(/timeout/i).fill('12h');
    await page.getByLabel(/comment/i).fill('Temporary block');

    // Submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify success
    await expect(page.getByText(/entry created|added successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate invalid IP address', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill with invalid IP
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('999.999.999.999');

    // Try to submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify validation error
    await expect(page.getByText(/invalid.*ip|must be.*valid ip/i)).toBeVisible();
  });

  test('should validate invalid CIDR notation', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill with invalid CIDR
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('192.168.1.0/99');

    // Try to submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify validation error
    await expect(page.getByText(/invalid.*cidr|must be.*valid cidr/i)).toBeVisible();
  });

  test('should validate invalid timeout format', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill with invalid timeout
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('192.168.1.100');
    await page.getByLabel(/timeout/i).fill('invalid');

    // Try to submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify validation error
    await expect(page.getByText(/invalid.*timeout|must be.*duration/i)).toBeVisible();
  });

  test('should validate comment length', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill with comment that's too long
    const longComment = 'a'.repeat(250);
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('192.168.1.100');
    await page.getByLabel(/comment/i).fill(longComment);

    // Try to submit
    await page.getByRole('button', { name: /create|add/i }).click();

    // Verify validation error
    await expect(page.getByText(/must be.*200 characters/i)).toBeVisible();
  });

  test('should autocomplete list name', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    await page.getByRole('button', { name: /add entry/i }).click();

    // Type partial list name
    const listInput = page.getByLabel(/list name/i);
    await listInput.fill('bloc');

    // Verify autocomplete suggestions appear
    await expect(page.getByText('blocklist')).toBeVisible();

    // Select suggestion
    await page.getByText('blocklist').click();

    // Verify field is filled
    await expect(listInput).toHaveValue('blocklist');
  });

  test('should allow canceling entry creation', async ({ page }) => {
    await page.getByRole('button', { name: /add entry/i }).click();

    // Fill some data
    await page.getByLabel(/list name/i).fill('blocklist');
    await page.getByLabel(/address/i).fill('192.168.1.100');

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verify dialog is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

// =============================================================================
// AC4: Quick-add IP to list from context menu
// =============================================================================

test.describe('Context Menu Quick-Add', () => {
  test('should show context menu on right-click (desktop)', async ({ page }) => {
    // Navigate to a page with IP addresses (e.g., DHCP leases)
    await page.goto('/dashboard/network/dhcp-leases');
    await page.waitForLoadState('networkidle');

    // Mock DHCP leases with IP addresses
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: {
          data: {
            dhcpLeases: [
              {
                id: '1',
                ipAddress: '192.168.1.50',
                macAddress: '00:11:22:33:44:55',
                hostname: 'device1',
              },
            ],
          },
        },
      });
    });

    await page.reload();

    // Right-click on IP address
    const ipAddress = page.getByText('192.168.1.50');
    await ipAddress.click({ button: 'right' });

    // Verify context menu appears
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /add to address list/i })).toBeVisible();
  });

  test('should add IP to existing list via context menu', async ({ page }) => {
    await page.goto('/dashboard/network/dhcp-leases');

    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetDHCPLeases') {
        await route.fulfill({
          json: {
            data: {
              dhcpLeases: [
                {
                  id: '1',
                  ipAddress: '192.168.1.50',
                  macAddress: '00:11:22:33:44:55',
                  hostname: 'device1',
                },
              ],
            },
          },
        });
      } else if (requestBody.operationName === 'GetAddressLists') {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      }
    });

    await page.reload();

    // Right-click on IP
    await page.getByText('192.168.1.50').click({ button: 'right' });

    // Select "Add to Address List"
    await page.getByRole('menuitem', { name: /add to address list/i }).click();

    // Select existing list
    await page.getByRole('menuitem', { name: /trusted_devices/i }).click();

    // Verify toast notification
    await expect(page.getByText(/added.*192\.168\.1\.50.*to.*trusted_devices/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should create new list inline from context menu', async ({ page }) => {
    await page.goto('/dashboard/network/dhcp-leases');

    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: {
          data: {
            dhcpLeases: [
              {
                id: '1',
                ipAddress: '192.168.1.50',
                macAddress: '00:11:22:33:44:55',
                hostname: 'device1',
              },
            ],
          },
        },
      });
    });

    await page.reload();

    // Right-click on IP
    await page.getByText('192.168.1.50').click({ button: 'right' });

    // Select "Add to Address List"
    await page.getByRole('menuitem', { name: /add to address list/i }).click();

    // Select "Create new list"
    await page.getByRole('menuitem', { name: /create new list/i }).click();

    // Fill new list name
    await page.getByLabel(/list name/i).fill('new_test_list');

    // Submit
    await page.getByRole('button', { name: /create/i }).click();

    // Verify success toast
    await expect(page.getByText(/added.*to.*new_test_list/i)).toBeVisible({ timeout: 5000 });
  });

  test('should support keyboard trigger (Shift+F10)', async ({ page }) => {
    await page.goto('/dashboard/network/dhcp-leases');

    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: {
          data: {
            dhcpLeases: [
              {
                id: '1',
                ipAddress: '192.168.1.50',
                macAddress: '00:11:22:33:44:55',
                hostname: 'device1',
              },
            ],
          },
        },
      });
    });

    await page.reload();

    // Focus on IP address
    const ipAddress = page.getByText('192.168.1.50');
    await ipAddress.focus();

    // Trigger context menu with Shift+F10
    await page.keyboard.press('Shift+F10');

    // Verify context menu appears
    await expect(page.getByRole('menu')).toBeVisible();
  });
});

// =============================================================================
// AC5: View firewall rules referencing each list
// =============================================================================

test.describe('Show Referencing Rules', () => {
  test('should display referencing rules modal', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetRulesReferencingAddressList') {
        await route.fulfill({
          json: {
            data: {
              rulesReferencingAddressList: [
                {
                  id: 'rule1',
                  chain: 'input',
                  action: 'drop',
                  srcAddressList: 'blocklist',
                  comment: 'Block bad IPs',
                },
                {
                  id: 'rule2',
                  chain: 'forward',
                  action: 'drop',
                  dstAddressList: 'blocklist',
                  comment: 'Block outbound',
                },
              ],
            },
          },
        });
      } else {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      }
    });

    await page.reload();

    // Click "Show Rules" button
    const showRulesButton = page.getByRole('button', { name: /show rules/i }).first();
    await showRulesButton.click();

    // Verify modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/rules referencing|using this list/i)).toBeVisible();

    // Verify rules are displayed
    await expect(page.getByText('Block bad IPs')).toBeVisible();
    await expect(page.getByText('Block outbound')).toBeVisible();
  });

  test('should navigate to rule from modal', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetRulesReferencingAddressList') {
        await route.fulfill({
          json: {
            data: {
              rulesReferencingAddressList: [
                {
                  id: 'rule1',
                  chain: 'input',
                  action: 'drop',
                  srcAddressList: 'blocklist',
                  comment: 'Block bad IPs',
                },
              ],
            },
          },
        });
      } else {
        await route.fulfill({
          json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
        });
      }
    });

    await page.reload();

    // Open rules modal
    await page
      .getByRole('button', { name: /show rules/i })
      .first()
      .click();

    // Click on rule link
    const ruleLink = page.getByRole('link', { name: /block bad ips|rule1/i });
    await ruleLink.click();

    // Verify navigation to rule detail (URL or page change)
    await expect(page).toHaveURL(/firewall\/rules|rule1/i);
  });

  test('should display count badge', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Verify count badge on internal_network (5 referencing rules)
    const internalNetworkRow = page.getByText('internal_network').locator('..');
    await expect(internalNetworkRow.getByText('5')).toBeVisible();
  });
});

// =============================================================================
// AC6: Bulk import addresses
// =============================================================================

test.describe('Bulk Import Addresses', () => {
  test('should import CSV file', async ({ page }) => {
    // Click Import button
    await page.getByRole('button', { name: /import/i }).click();

    // Verify import dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select target list
    await page.getByLabel(/target list/i).fill('blocklist');

    // Upload CSV file (simulate file input)
    const fileInput = page.locator('input[type="file"]');

    // Create a mock CSV file
    const csvContent =
      '192.168.1.100,Imported entry 1\n10.0.0.50,Imported entry 2\n172.16.0.0/24,Imported subnet';
    const buffer = Buffer.from(csvContent);

    await fileInput.setInputFiles({
      name: 'addresses.csv',
      mimeType: 'text/csv',
      buffer,
    });

    // Verify file is uploaded and preview shown
    await expect(page.getByText(/192\.168\.1\.100/)).toBeVisible();
    await expect(page.getByText(/3.*entries/i)).toBeVisible();

    // Submit import
    await page.getByRole('button', { name: /import|start import/i }).click();

    // Verify progress bar
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    // Verify success message
    await expect(page.getByText(/import complete|successfully imported/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should import text file (one IP per line)', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    await page.getByLabel(/target list/i).fill('blocklist');

    // Upload TXT file
    const txtContent = '192.168.1.100\n10.0.0.50\n172.16.0.0/24';
    const buffer = Buffer.from(txtContent);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'addresses.txt',
      mimeType: 'text/plain',
      buffer,
    });

    // Verify preview
    await expect(page.getByText(/3.*entries/i)).toBeVisible();

    // Submit
    await page.getByRole('button', { name: /import|start import/i }).click();

    // Verify success
    await expect(page.getByText(/import complete/i)).toBeVisible({ timeout: 10000 });
  });

  test('should import JSON file', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    await page.getByLabel(/target list/i).fill('blocklist');

    // Upload JSON file
    const jsonContent = JSON.stringify([
      { address: '192.168.1.100', comment: 'Entry 1' },
      { address: '10.0.0.50', comment: 'Entry 2', timeout: '1d' },
    ]);
    const buffer = Buffer.from(jsonContent);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'addresses.json',
      mimeType: 'application/json',
      buffer,
    });

    // Verify preview
    await expect(page.getByText(/2.*entries/i)).toBeVisible();

    // Submit
    await page.getByRole('button', { name: /import|start import/i }).click();

    // Verify success
    await expect(page.getByText(/import complete/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle validation errors during import', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    await page.getByLabel(/target list/i).fill('blocklist');

    // Upload CSV with invalid entries
    const csvContent =
      '192.168.1.100,Valid entry\n999.999.999.999,Invalid IP\n10.0.0.50,Another valid entry';
    const buffer = Buffer.from(csvContent);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'addresses.csv',
      mimeType: 'text/csv',
      buffer,
    });

    // Submit
    await page.getByRole('button', { name: /import|start import/i }).click();

    // Verify error report
    await expect(page.getByText(/2.*succeeded/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/1.*failed/i)).toBeVisible();

    // Verify error details
    await expect(page.getByText(/999\.999\.999\.999/)).toBeVisible();
    await expect(page.getByText(/invalid.*ip/i)).toBeVisible();
  });

  test('should show progress for large imports', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    await page.getByLabel(/target list/i).fill('blocklist');

    // Create large CSV (100+ entries)
    const entries = Array.from({ length: 150 }, (_, i) => `192.168.1.${i},Entry ${i}`);
    const csvContent = entries.join('\n');
    const buffer = Buffer.from(csvContent);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-import.csv',
      mimeType: 'text/csv',
      buffer,
    });

    // Submit
    await page.getByRole('button', { name: /import|start import/i }).click();

    // Verify progress bar is shown
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Verify percentage is displayed
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test('should support paste from text area', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    await page.getByLabel(/target list/i).fill('blocklist');

    // Switch to paste mode (if available)
    const pasteTab = page.getByRole('tab', { name: /paste.*text/i });
    if (await pasteTab.isVisible()) {
      await pasteTab.click();

      // Paste IP addresses
      const textarea = page.getByRole('textbox', { name: /paste.*addresses/i });
      await textarea.fill('192.168.1.100\n10.0.0.50\n172.16.0.0/24');

      // Submit
      await page.getByRole('button', { name: /import/i }).click();

      // Verify success
      await expect(page.getByText(/import complete/i)).toBeVisible({ timeout: 10000 });
    }
  });
});

// =============================================================================
// AC7: Bulk export addresses
// =============================================================================

test.describe('Bulk Export Addresses', () => {
  test('should export to CSV format', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Find export button for a list
    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    // Verify export dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select CSV format
    await page.getByLabel(/format/i).selectOption('CSV');

    // Click download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click(),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export to JSON format', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    // Select JSON format
    await page.getByLabel(/format/i).selectOption('JSON');

    // Click download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click(),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should export to RouterOS script (.rsc)', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    // Select RouterOS script format
    await page.getByLabel(/format/i).selectOption('RouterOS Script');

    // Click download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click(),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.rsc$/);
  });

  test('should copy to clipboard', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    // Select format
    await page.getByLabel(/format/i).selectOption('CSV');

    // Click copy to clipboard
    await page.getByRole('button', { name: /copy.*clipboard/i }).click();

    // Verify success toast
    await expect(page.getByText(/copied.*clipboard/i)).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

test.describe('Performance with Large Lists', () => {
  test('should handle 1000+ entries with virtualization', async ({ page }) => {
    // Mock large dataset
    const largeEntrySet = Array.from({ length: 1500 }, (_, i) => ({
      id: `*${i}`,
      list: 'blocklist',
      address: `192.168.${Math.floor(i / 256)}.${i % 256}`,
      comment: `Entry ${i}`,
      timeout: null,
      creationTime: new Date().toISOString(),
      dynamic: false,
      disabled: false,
    }));

    await page.route('**/graphql', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (requestBody.operationName === 'GetAddressListEntries') {
        const first = requestBody.variables.first || 50;
        const after = requestBody.variables.after;
        const startIdx = after ? parseInt(after.split('_')[1]) + 1 : 0;
        const endIdx = Math.min(startIdx + first, largeEntrySet.length);

        await route.fulfill({
          json: {
            data: {
              addressListEntries: {
                edges: largeEntrySet.slice(startIdx, endIdx).map((entry, idx) => ({
                  cursor: `cursor_${startIdx + idx}`,
                  node: entry,
                })),
                pageInfo: {
                  hasNextPage: endIdx < largeEntrySet.length,
                  hasPreviousPage: startIdx > 0,
                  startCursor: `cursor_${startIdx}`,
                  endCursor: `cursor_${endIdx - 1}`,
                },
                totalCount: largeEntrySet.length,
              },
            },
          },
        });
      } else {
        await route.fulfill({
          json: {
            data: {
              addressLists: [
                {
                  name: 'large_blocklist',
                  entryCount: 1500,
                  dynamicCount: 0,
                  referencingRulesCount: 1,
                },
              ],
            },
          },
        });
      }
    });

    await page.reload();

    // Expand large list
    await page.getByText('large_blocklist').click();

    // Measure performance: page should remain responsive
    const startTime = Date.now();

    // Wait for entries to render
    await expect(page.getByText('192.168.0.0')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Verify virtualization: not all 1500 entries should be in DOM
    const renderedRows = await page.locator('[data-testid="entry-row"]').count();
    expect(renderedRows).toBeLessThan(100); // Only visible rows rendered
  });
});

// =============================================================================
// Mobile Responsive Tests
// =============================================================================

test.describe('Mobile Responsive Behavior', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('should display mobile card view', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Should show cards instead of table
    await expect(page.locator('table')).not.toBeVisible();

    // Cards should be visible
    const cards = page.locator('[data-testid="address-list-card"]');
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible();
    }
  });

  test('should open sheet for entries on mobile', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Click on list card
    await page.getByText('blocklist').click();

    // Sheet should slide up from bottom
    const sheet = page.locator('[role="dialog"]').or(page.locator('[data-testid="sheet"]'));
    await expect(sheet).toBeVisible();

    // Verify sheet takes full width
    const box = await sheet.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(375 - 40); // Account for padding
    }
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

test.describe('Accessibility Compliance', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Inject axe-core
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
    });

    // Run accessibility scan
    const accessibilityScanResults = await page.evaluate(() => {
      // @ts-ignore
      return window.axe ? window.axe.run() : null;
    });

    if (accessibilityScanResults) {
      // Should have no violations
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Tab to Add Entry button
    await page.keyboard.press('Tab');

    // Should be able to activate with Enter
    const addButton = page.getByRole('button', { name: /add entry/i });
    await addButton.focus();
    await page.keyboard.press('Enter');

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Escape should close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Check for ARIA labels on interactive elements
    const addButton = page.getByRole('button', { name: /add entry/i });
    await expect(addButton).toHaveAttribute('aria-label');

    // Open form and check inputs
    await addButton.click();

    const listInput = page.getByLabel(/list name/i);
    await expect(listInput).toHaveAttribute('aria-label');

    const addressInput = page.getByLabel(/address/i);
    await expect(addressInput).toHaveAttribute('aria-label');
  });

  test('should meet WCAG AAA contrast ratio (7:1)', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Check contrast ratio programmatically (requires axe-core)
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
    });

    const contrastResults = await page.evaluate(() => {
      // @ts-ignore
      return window.axe ?
          window.axe.run({ rules: { 'color-contrast-enhanced': { enabled: true } } })
        : null;
    });

    if (contrastResults) {
      const contrastViolations = contrastResults.violations.filter(
        (v: any) => v.id === 'color-contrast-enhanced'
      );
      expect(contrastViolations).toEqual([]);
    }
  });

  test('should have 44px touch targets (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Check button size
    const addButton = page.getByRole('button', { name: /add entry/i });
    const box = await addButton.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should have 3px focus indicators', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Focus on button
    const addButton = page.getByRole('button', { name: /add entry/i });
    await addButton.focus();

    // Check for focus ring
    const outlineWidth = await addButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth;
    });

    // Should have 3px outline
    expect(outlineWidth).toBe('3px');
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      await route.fulfill({
        json: { data: { addressLists: MOCK_ADDRESS_LISTS } },
      });
    });

    await page.reload();

    // Perform action that triggers status change
    await page.getByRole('button', { name: /add entry/i }).click();
    await page.getByLabel(/list name/i).fill('test_list');
    await page.getByLabel(/address/i).fill('192.168.1.100');
    await page.getByRole('button', { name: /create|add/i }).click();

    // Check for live region announcement
    const liveRegion = page.locator('[role="status"]').or(page.locator('[aria-live="polite"]'));
    await expect(liveRegion).toBeVisible({ timeout: 5000 });
  });
});
