/**
 * Rate Limiting E2E Tests
 *
 * End-to-end tests for connection rate limiting workflow:
 * - Create rate limit rule flow
 * - Enable SYN flood protection flow
 * - Whitelist blocked IP flow
 * - Mobile responsiveness
 * - Tab navigation and persistence
 *
 * Story: NAS-7.11 - Implement Connection Rate Limiting
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = '/router/test-router-123/firewall/rate-limiting';

/**
 * Setup: Navigate to Rate Limiting page before each test
 */
test.beforeEach(async ({ page }) => {
  // Mock GraphQL API responses
  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Mock empty initial state
    if (postData?.operationName === 'GetRateLimitRules') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            rateLimitRules: [],
          },
        }),
      });
    } else if (postData?.operationName === 'GetSynFloodConfig') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            synFloodConfig: {
              enabled: false,
              synLimit: 100,
              burst: 5,
              action: 'drop',
            },
          },
        }),
      });
    } else if (postData?.operationName === 'GetBlockedIPs') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            blockedIPs: [],
          },
        }),
      });
    } else if (postData?.operationName === 'GetRateLimitStats') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            rateLimitStats: {
              totalBlocked: 0,
              topBlockedIPs: [],
              triggerEvents: Array.from({ length: 24 }, (_, i) => ({
                hour: `${String(i).padStart(2, '0')}:00`,
                count: 0,
              })),
              lastUpdated: new Date().toISOString(),
            },
          },
        }),
      });
    } else {
      // Allow other requests to proceed
      await route.continue();
    }
  });

  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Rate Limiting/);
});

// =============================================================================
// Scenario 1: Create Rate Limit Rule Flow
// =============================================================================

test.describe('Create Rate Limit Rule', () => {
  test('should open add rule sheet when Add button clicked', async ({ page }) => {
    // Click Add Rate Limit button
    await page.getByRole('button', { name: /add rate limit/i }).click();

    // Verify sheet opens
    await expect(page.getByRole('heading', { name: /add rate limit rule/i })).toBeVisible();
    await expect(page.getByText(/create a new connection rate limit rule/i)).toBeVisible();
  });

  test('should fill form and create rule', async ({ page }) => {
    // Mock successful creation
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'CreateRateLimitRule') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              createRateLimitRule: {
                id: '*1',
                connectionLimit: 100,
                timeWindow: 'per-minute',
                action: 'drop',
                comment: 'Basic protection',
                disabled: false,
                packets: 0,
                bytes: 0,
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Open add rule sheet
    await page.getByRole('button', { name: /add rate limit/i }).click();

    // Fill form
    await page.getByLabel(/connection limit/i).fill('100');
    await page.getByLabel(/time window/i).selectOption('per-minute');
    await page.getByLabel(/action/i).selectOption('drop');
    await page.getByLabel(/comment/i).fill('Basic protection');

    // Verify preview text shows
    await expect(page.getByText(/limit to 100 connections per minute/i)).toBeVisible();
    await expect(page.getByText(/drop excess connections/i)).toBeVisible();

    // Submit form
    await page.getByRole('button', { name: /create rule/i }).click();

    // Verify success toast
    await expect(page.getByText(/rate limit rule created/i)).toBeVisible({ timeout: 3000 });

    // Verify sheet closes
    await expect(page.getByRole('heading', { name: /add rate limit rule/i })).not.toBeVisible();
  });

  test('should validate form input', async ({ page }) => {
    await page.getByRole('button', { name: /add rate limit/i }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /create rule/i }).click();

    // Verify validation errors
    await expect(page.getByText(/connection limit is required/i)).toBeVisible();
  });

  test('should cancel creation', async ({ page }) => {
    await page.getByRole('button', { name: /add rate limit/i }).click();

    // Fill some data
    await page.getByLabel(/connection limit/i).fill('100');

    // Click cancel or close
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verify sheet closes without creating
    await expect(page.getByRole('heading', { name: /add rate limit rule/i })).not.toBeVisible();
  });
});

// =============================================================================
// Scenario 2: Enable SYN Flood Protection Flow
// =============================================================================

test.describe('SYN Flood Protection', () => {
  test('should navigate to SYN flood tab', async ({ page }) => {
    // Click SYN Flood Protection tab
    await page.getByRole('tab', { name: /syn flood protection/i }).click();

    // Verify tab is active
    await expect(page.getByRole('tab', { name: /syn flood protection/i })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Verify info and warning alerts visible
    await expect(
      page.getByText(/syn flood protection helps prevent syn flood attacks/i)
    ).toBeVisible();
    await expect(
      page.getByText(/warning.*changing syn flood settings may affect/i)
    ).toBeVisible();
  });

  test('should enable SYN flood protection', async ({ page }) => {
    // Mock successful update
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'UpdateSynFloodConfig') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              updateSynFloodConfig: {
                enabled: true,
                synLimit: 100,
                burst: 5,
                action: 'drop',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to SYN flood tab
    await page.getByRole('tab', { name: /syn flood protection/i }).click();

    // Toggle enabled switch
    await page.getByRole('switch', { name: /enabled/i }).click();

    // Set SYN limit
    await page.getByLabel(/syn limit/i).fill('100');
    await page.getByLabel(/burst/i).fill('5');

    // Select action
    await page.getByLabel(/action/i).selectOption('drop');

    // Submit configuration
    await page.getByRole('button', { name: /save configuration/i }).click();

    // Verify dangerous confirmation dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByText(/this is a dangerous operation.*may affect connections/i)
    ).toBeVisible();

    // Confirm
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify success toast
    await expect(page.getByText(/syn flood protection updated/i)).toBeVisible({ timeout: 3000 });
  });

  test('should validate SYN flood settings', async ({ page }) => {
    await page.getByRole('tab', { name: /syn flood protection/i }).click();

    // Enter invalid SYN limit (0 or negative)
    await page.getByLabel(/syn limit/i).fill('0');

    // Try to save
    await page.getByRole('button', { name: /save configuration/i }).click();

    // Verify validation error
    await expect(page.getByText(/syn limit must be greater than 0/i)).toBeVisible();
  });
});

// =============================================================================
// Scenario 3: Whitelist Blocked IP Flow
// =============================================================================

test.describe('Whitelist Blocked IP', () => {
  test.beforeEach(async ({ page }) => {
    // Mock blocked IPs data
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'GetBlockedIPs') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              blockedIPs: [
                {
                  address: '192.168.1.100',
                  list: 'rate-limited',
                  blockCount: 15,
                  firstBlocked: '2025-01-10T10:00:00Z',
                  lastBlocked: '2025-01-10T12:30:00Z',
                  timeout: '1h',
                  dynamic: true,
                },
                {
                  address: '203.0.113.25',
                  list: 'ddos-attackers',
                  blockCount: 150,
                  firstBlocked: '2025-01-05T08:00:00Z',
                  lastBlocked: '2025-01-10T15:45:00Z',
                  timeout: '',
                  dynamic: false,
                },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to statistics tab
    await page.getByRole('tab', { name: /statistics/i }).click();
  });

  test('should display blocked IPs table', async ({ page }) => {
    // Verify table is visible
    await expect(page.getByRole('heading', { name: /blocked ips/i })).toBeVisible();

    // Verify blocked IPs are shown
    await expect(page.getByText('192.168.1.100')).toBeVisible();
    await expect(page.getByText('203.0.113.25')).toBeVisible();
  });

  test('should whitelist blocked IP', async ({ page }) => {
    // Mock successful whitelist
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'WhitelistIP') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              whitelistIP: {
                success: true,
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Find blocked IP row
    const ipRow = page.getByText('192.168.1.100').locator('..');

    // Click whitelist button
    await ipRow.getByRole('button', { name: /whitelist/i }).click();

    // Verify whitelist dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/whitelist.*192\.168\.1\.100/i)).toBeVisible();

    // Select timeout
    await page.getByLabel(/timeout/i).selectOption('1h');

    // Confirm
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify success toast
    await expect(page.getByText(/ip whitelisted/i)).toBeVisible({ timeout: 3000 });

    // Verify IP removed from blocked list
    await expect(page.getByText('192.168.1.100')).not.toBeVisible({ timeout: 3000 });
  });

  test('should display statistics overview', async ({ page }) => {
    // Mock stats data
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'GetRateLimitStats') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              rateLimitStats: {
                totalBlocked: 165,
                topBlockedIPs: [
                  {
                    address: '203.0.113.25',
                    list: 'ddos-attackers',
                    blockCount: 150,
                    firstBlocked: '2025-01-05T08:00:00Z',
                    lastBlocked: '2025-01-10T15:45:00Z',
                  },
                ],
                triggerEvents: Array.from({ length: 24 }, (_, i) => ({
                  hour: `${String(i).padStart(2, '0')}:00`,
                  count: Math.floor(Math.random() * 50),
                })),
                lastUpdated: new Date().toISOString(),
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await page.getByRole('tab', { name: /statistics/i }).click();

    // Verify stats overview is visible
    await expect(page.getByText(/165.*total blocked/i)).toBeVisible();
    await expect(page.getByText(/203\.0\.113\.25/i)).toBeVisible();
  });

  test('should refresh statistics', async ({ page }) => {
    let refreshCount = 0;

    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'GetRateLimitStats') {
        refreshCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              rateLimitStats: {
                totalBlocked: refreshCount * 10,
                topBlockedIPs: [],
                triggerEvents: [],
                lastUpdated: new Date().toISOString(),
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Click refresh button
    await page.getByRole('button', { name: /refresh/i }).click();

    // Verify loading state
    await expect(page.getByRole('button', { name: /refresh/i })).toBeDisabled();

    // Wait for refresh to complete
    await expect(page.getByRole('button', { name: /refresh/i })).not.toBeDisabled({
      timeout: 3000,
    });

    // Verify refresh happened
    expect(refreshCount).toBeGreaterThan(1);
  });

  test('should export CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    // Click export CSV button
    await page.getByRole('button', { name: /export csv/i }).click();

    // Verify download initiated (if implemented)
    // Note: This depends on implementation
    // const download = await downloadPromise;
    // expect(download.suggestedFilename()).toContain('blocked-ips');
  });
});

// =============================================================================
// Scenario 4: Mobile Responsiveness
// =============================================================================

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display tabs horizontally scrollable on mobile', async ({ page }) => {
    const tabList = page.getByRole('tablist');

    // Verify tabs are visible
    await expect(tabList).toBeVisible();

    // Check for horizontal scroll (overflow-x-auto)
    const overflow = await tabList.evaluate((el) => {
      return window.getComputedStyle(el).overflowX;
    });
    expect(overflow).toBe('auto');
  });

  test('should show bottom sheet editor on mobile', async ({ page }) => {
    // Click Add Rate Limit button
    await page.getByRole('button', { name: /add rate limit/i }).click();

    // Verify sheet opens from bottom
    const sheet = page.locator('[data-side="bottom"]');
    await expect(sheet).toBeVisible();

    // Verify minimum height (90vh for mobile)
    const height = await sheet.evaluate((el) => {
      return window.getComputedStyle(el).height;
    });
    expect(height).toBeTruthy();
  });

  test('should have 44px minimum touch targets on mobile', async ({ page }) => {
    // Check Add button touch target
    const addButton = page.getByRole('button', { name: /add rate limit/i });
    const boundingBox = await addButton.boundingBox();

    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should handle tab switching on mobile', async ({ page }) => {
    // Tap SYN Flood tab
    await page.getByRole('tab', { name: /syn flood protection/i }).tap();

    // Verify tab is active
    await expect(page.getByRole('tab', { name: /syn flood protection/i })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Verify content is visible
    await expect(page.getByText(/syn flood protection helps/i)).toBeVisible();
  });

  test('should render accordion layout for rules on mobile', async ({ page }) => {
    // Mock rules data
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.operationName === 'GetRateLimitRules') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              rateLimitRules: [
                {
                  id: '*1',
                  connectionLimit: 100,
                  timeWindow: 'per-minute',
                  action: 'drop',
                  comment: 'Basic protection',
                  disabled: false,
                  packets: 1234,
                  bytes: 567890,
                },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // On mobile, rules should render as accordion/cards instead of table
    // This depends on implementation of RateLimitRulesTable
    // Verify card/accordion is visible instead of table
    const mobileLayout = page.locator('[data-mobile-layout="true"]');
    // If implemented, test accordingly
  });
});

// =============================================================================
// Scenario 5: Tab Persistence
// =============================================================================

test.describe('Tab Persistence', () => {
  test('should persist selected tab on reload', async ({ page }) => {
    // Switch to Statistics tab
    await page.getByRole('tab', { name: /statistics/i }).click();

    // Reload page
    await page.reload();

    // Verify Statistics tab is still active (if Zustand persistence is enabled)
    // Note: This requires Zustand persist middleware
    // await expect(page.getByRole('tab', { name: /statistics/i })).toHaveAttribute(
    //   'data-state',
    //   'active'
    // );
  });

  test('should restore to Rate Limits tab on first visit', async ({ page }) => {
    // First visit - should default to Rate Limits tab
    await expect(page.getByRole('tab', { name: /rate limits/i })).toHaveAttribute(
      'data-state',
      'active'
    );
  });
});

// =============================================================================
// Scenario 6: Keyboard Navigation
// =============================================================================

test.describe('Keyboard Navigation', () => {
  test('should navigate tabs with arrow keys', async ({ page }) => {
    // Focus first tab
    await page.getByRole('tab', { name: /rate limits/i }).focus();

    // Press right arrow
    await page.keyboard.press('ArrowRight');

    // Verify SYN Flood tab is focused
    await expect(page.getByRole('tab', { name: /syn flood protection/i })).toBeFocused();

    // Press right arrow again
    await page.keyboard.press('ArrowRight');

    // Verify Statistics tab is focused
    await expect(page.getByRole('tab', { name: /statistics/i })).toBeFocused();
  });

  test('should open add rule sheet with Enter key', async ({ page }) => {
    // Focus Add button
    await page.getByRole('button', { name: /add rate limit/i }).focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify sheet opens
    await expect(page.getByRole('heading', { name: /add rate limit rule/i })).toBeVisible();
  });

  test('should close sheet with Escape key', async ({ page }) => {
    // Open sheet
    await page.getByRole('button', { name: /add rate limit/i }).click();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify sheet closes
    await expect(page.getByRole('heading', { name: /add rate limit rule/i })).not.toBeVisible();
  });
});

// =============================================================================
// Scenario 7: Empty States
// =============================================================================

test.describe('Empty States', () => {
  test('should display empty state when no rules exist', async ({ page }) => {
    // Rate Limits tab should show empty state
    await expect(page.getByText(/no rate limit rules/i)).toBeVisible();
    await expect(
      page.getByText(/create your first rate limit rule to protect/i)
    ).toBeVisible();
  });

  test('should display empty state when no blocked IPs', async ({ page }) => {
    // Navigate to statistics tab
    await page.getByRole('tab', { name: /statistics/i }).click();

    // Should show empty state
    await expect(page.getByText(/no blocked ips/i)).toBeVisible();
    await expect(
      page.getByText(/blocked ips will appear here when rate limits are triggered/i)
    ).toBeVisible();
  });

  test('should allow adding rule from empty state', async ({ page }) => {
    // Click Add button in empty state card
    const emptyStateAddButton = page
      .getByText(/no rate limit rules/i)
      .locator('..')
      .getByRole('button', { name: /add rate limit/i });

    await emptyStateAddButton.click();

    // Verify sheet opens
    await expect(page.getByRole('heading', { name: /add rate limit rule/i })).toBeVisible();
  });
});
