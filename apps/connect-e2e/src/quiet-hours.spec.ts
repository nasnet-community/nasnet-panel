/**
 * Quiet Hours E2E Tests
 *
 * End-to-end tests for quiet hours feature:
 * - Configuration UI (time range, timezone, days of week, bypass critical)
 * - Settings persistence across page reloads
 * - Alert queueing during quiet hours
 * - Queued alert display in UI
 * - Day-of-week filtering
 *
 * Story: Quiet Hours Feature (Epic 18)
 * Test refs: T-QH-001, T-QH-002, T-QH-003
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const SETTINGS_URL = '/settings/notifications';

/**
 * Navigate to notification settings page
 */
const navigateToNotificationSettings = async (page: Page) => {
  await page.goto(SETTINGS_URL);
  await page.waitForLoadState('networkidle');
};

/**
 * Setup GraphQL mocking for settings persistence
 */
const setupQuietHoursGraphQLMock = async (page: Page) => {
  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData.operationName === 'GetAlertRuleConfig') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            alertRuleConfig: {
              quietHours: null, // No quiet hours configured initially
            },
          },
        }),
      });
    } else if (postData.operationName === 'UpdateQuietHours') {
      // Mock successful save
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            updateQuietHours: {
              success: true,
              quietHours: postData.variables.input,
            },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
};

/**
 * Create mock alert for testing
 */
const createMockAlert = (
  severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'WARNING',
  isQueued = false
) => ({
  id: `alert-${Date.now()}-${Math.random()}`,
  title: `Test ${severity} Alert`,
  message: 'This is a test alert message',
  severity,
  eventType: 'test.alert',
  deviceId: TEST_ROUTER_ID,
  triggeredAt: new Date().toISOString(),
  queuedDuringQuietHours: isQueued,
  deliveryStatus: {
    inapp: isQueued ? 'queued' : 'delivered',
  },
  acknowledgedAt: null,
  data: {},
  rule: {
    id: 'rule-test',
    name: 'Test Alert Rule',
    enabled: true,
    channels: ['inapp'],
  },
});

test.describe('Quiet Hours Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await setupQuietHoursGraphQLMock(page);
    await navigateToNotificationSettings(page);
  });

  test('configure quiet hours and save settings', async ({ page }) => {
    // Find and expand quiet hours section
    await page.getByRole('heading', { name: /quiet hours/i }).waitFor();
    const quietHoursSection = page
      .locator('[data-testid="quiet-hours-config"], .quiet-hours-config')
      .first();

    // If section is collapsed, expand it
    const expandButton = page.getByRole('button', { name: /quiet hours/i }).first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }

    // Wait for quiet hours form to be visible
    await page.waitForTimeout(500); // Allow animation to complete

    // Configure time range (22:00 - 08:00)
    const startTimeInput = page
      .locator('input[name="startTime"], input[placeholder*="Start"]')
      .first();
    const endTimeInput = page.locator('input[name="endTime"], input[placeholder*="End"]').first();

    await startTimeInput.fill('22:00');
    await endTimeInput.fill('08:00');

    // Verify duration is calculated
    await expect(page.getByText(/10 hours/i)).toBeVisible();

    // Select days of week (Monday - Friday)
    // Days are typically buttons or toggles
    const dayButtons = page.locator('[data-testid="day-selector"] button, .day-selector button');
    const daysToSelect = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    for (const day of daysToSelect) {
      const dayButton = page.getByRole('button', { name: new RegExp(day, 'i') });
      if (await dayButton.isVisible()) {
        // Toggle on if not already selected
        const isSelected = (await dayButton.getAttribute('aria-pressed')) === 'true';
        if (!isSelected) {
          await dayButton.click();
        }
      }
    }

    // Unselect weekend days (Saturday, Sunday)
    const weekendDays = ['Saturday', 'Sunday'];
    for (const day of weekendDays) {
      const dayButton = page.getByRole('button', { name: new RegExp(day, 'i') });
      if (await dayButton.isVisible()) {
        const isSelected = (await dayButton.getAttribute('aria-pressed')) === 'true';
        if (isSelected) {
          await dayButton.click();
        }
      }
    }

    // Verify bypass critical switch is visible and toggle it
    const bypassCriticalSwitch = page.getByRole('switch', { name: /bypass critical/i });
    await expect(bypassCriticalSwitch).toBeVisible();

    // Ensure it's enabled
    const isChecked = await bypassCriticalSwitch.isChecked();
    if (!isChecked) {
      await bypassCriticalSwitch.click();
    }

    // Save settings
    const saveButton = page.getByRole('button', { name: /save|apply/i });
    await saveButton.click();

    // Wait for success toast
    await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 5000 });

    // Reload page to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Expand quiet hours section again
    const expandButtonAfterReload = page.getByRole('button', { name: /quiet hours/i }).first();
    if (await expandButtonAfterReload.isVisible()) {
      await expandButtonAfterReload.click();
      await page.waitForTimeout(500);
    }

    // Verify settings persisted
    const startTimeAfterReload = page
      .locator('input[name="startTime"], input[placeholder*="Start"]')
      .first();
    const endTimeAfterReload = page
      .locator('input[name="endTime"], input[placeholder*="End"]')
      .first();

    await expect(startTimeAfterReload).toHaveValue('22:00');
    await expect(endTimeAfterReload).toHaveValue('08:00');
    await expect(page.getByText(/10 hours/i)).toBeVisible();

    // Verify bypass critical is still enabled
    const bypassCriticalAfterReload = page.getByRole('switch', { name: /bypass critical/i });
    await expect(bypassCriticalAfterReload).toBeChecked();
  });

  test('queued alerts display in alert list', async ({ page }) => {
    // Configure quiet hours first (mocked)
    await page.evaluate(() => {
      localStorage.setItem(
        'quietHours',
        JSON.stringify({
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
          bypassCritical: true,
          daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
        })
      );
    });

    // Navigate to alerts page
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');

    // Mock queued alert via GraphQL
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'GetAlerts') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              alerts: {
                edges: [
                  {
                    node: createMockAlert('WARNING', true), // Queued alert
                  },
                  {
                    node: createMockAlert('INFO', false), // Normal alert
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
                totalCount: 2,
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Reload to trigger alert fetch
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for alerts to render
    await page.waitForTimeout(1000);

    // Verify "Queued" badge is visible
    const queuedBadge = page.getByText(/queued/i).first();
    await expect(queuedBadge).toBeVisible({ timeout: 5000 });

    // Verify queued count indicator (if present)
    const queuedCountIndicator = page.locator('[data-testid="queued-count"], .queued-count');
    if (await queuedCountIndicator.isVisible()) {
      await expect(queuedCountIndicator).toContainText('1');
    }
  });

  test('timezone selector works correctly', async ({ page }) => {
    // Find quiet hours section
    await page.getByRole('heading', { name: /quiet hours/i }).waitFor();

    // Expand if collapsed
    const expandButton = page.getByRole('button', { name: /quiet hours/i }).first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Find timezone selector (combobox or select)
    const timezoneSelector = page
      .locator('input[placeholder*="timezone" i], select[name="timezone"]')
      .first();
    await timezoneSelector.click();

    // Type to search for timezone
    await timezoneSelector.fill('America/New_York');

    // Select from dropdown (if combobox)
    const timezoneOption = page.getByRole('option', { name: /america\/new_york/i }).first();
    if (await timezoneOption.isVisible()) {
      await timezoneOption.click();
    }

    // Verify timezone is selected
    await expect(timezoneSelector).toHaveValue(/America\/New_York/i);
  });

  test('day selector toggles work correctly', async ({ page }) => {
    // Find quiet hours section
    await page.getByRole('heading', { name: /quiet hours/i }).waitFor();

    // Expand if collapsed
    const expandButton = page.getByRole('button', { name: /quiet hours/i }).first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Test toggling a specific day (e.g., Monday)
    const mondayButton = page.getByRole('button', { name: /monday/i });
    await expect(mondayButton).toBeVisible();

    // Get initial state
    const initiallyPressed = (await mondayButton.getAttribute('aria-pressed')) === 'true';

    // Toggle
    await mondayButton.click();

    // Verify state changed
    const afterTogglePressed = (await mondayButton.getAttribute('aria-pressed')) === 'true';
    expect(afterTogglePressed).toBe(!initiallyPressed);

    // Toggle back
    await mondayButton.click();

    // Verify state restored
    const finalPressed = (await mondayButton.getAttribute('aria-pressed')) === 'true';
    expect(finalPressed).toBe(initiallyPressed);
  });

  test('form validation prevents invalid time ranges', async ({ page }) => {
    // Find quiet hours section
    await page.getByRole('heading', { name: /quiet hours/i }).waitFor();

    // Expand if collapsed
    const expandButton = page.getByRole('button', { name: /quiet hours/i }).first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Try to set invalid time format
    const startTimeInput = page
      .locator('input[name="startTime"], input[placeholder*="Start"]')
      .first();
    await startTimeInput.fill('25:00'); // Invalid hour

    // Verify error message appears
    await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 3000 });

    // Fix the time
    await startTimeInput.fill('22:00');

    // Error should disappear
    await expect(page.getByText(/invalid|error/i)).not.toBeVisible();
  });

  test('bypass critical toggle works correctly', async ({ page }) => {
    // Find quiet hours section
    await page.getByRole('heading', { name: /quiet hours/i }).waitFor();

    // Expand if collapsed
    const expandButton = page.getByRole('button', { name: /quiet hours/i }).first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Find bypass critical switch
    const bypassSwitch = page.getByRole('switch', { name: /bypass critical/i });
    await expect(bypassSwitch).toBeVisible();

    // Get initial state
    const initiallyChecked = await bypassSwitch.isChecked();

    // Toggle
    await bypassSwitch.click();

    // Verify state changed
    const afterToggleChecked = await bypassSwitch.isChecked();
    expect(afterToggleChecked).toBe(!initiallyChecked);

    // Toggle back
    await bypassSwitch.click();

    // Verify state restored
    const finalChecked = await bypassSwitch.isChecked();
    expect(finalChecked).toBe(initiallyChecked);
  });
});

test.describe('Quiet Hours Cross-Browser', () => {
  test('quiet hours config renders on mobile viewport', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupQuietHoursGraphQLMock(page);
    await navigateToNotificationSettings(page);

    // Verify quiet hours section exists
    await expect(page.getByRole('heading', { name: /quiet hours/i })).toBeVisible();

    // On mobile, layout should be single column (no grid-cols-2)
    const quietHoursCard = page
      .locator('[data-testid="quiet-hours-config"], .quiet-hours-config')
      .first();
    const hasGridCols2 = await quietHoursCard.evaluate((el) =>
      el.className.includes('grid-cols-2')
    );
    expect(hasGridCols2).toBe(false);
  });

  test('quiet hours config renders on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await setupQuietHoursGraphQLMock(page);
    await navigateToNotificationSettings(page);

    // Verify quiet hours section exists
    await expect(page.getByRole('heading', { name: /quiet hours/i })).toBeVisible();

    // On desktop, should use 2-column grid
    const quietHoursCard = page
      .locator('[data-testid="quiet-hours-config"], .quiet-hours-config')
      .first();
    const hasGridCols2 = await quietHoursCard.evaluate((el) =>
      el.className.includes('grid-cols-2')
    );
    expect(hasGridCols2).toBe(true);
  });
});
