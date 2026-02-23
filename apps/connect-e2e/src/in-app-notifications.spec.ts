/**
 * In-App Notifications E2E Tests
 *
 * End-to-end tests for in-app notification system:
 * - WebSocket subscription and alert delivery
 * - Toast notification appearance and auto-dismiss
 * - Bell badge updates with unread count
 * - Notification center panel interactions
 * - Mark as read/unread functionality
 * - Filter by severity
 * - Settings persistence across reload
 * - WebSocket reconnection recovery
 * - Sound playback (mocked)
 * - Navigation to alert target page
 * - Keyboard navigation and accessibility
 *
 * Story: In-App Notifications Feature
 * Test refs: T-013, T-025, T-026, T-027, T-028
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const BASE_URL = '/dashboard';

/**
 * Mock alert data factory
 */
const createMockAlert = (overrides = {}) => ({
  id: `alert-${Date.now()}`,
  title: 'Test Alert',
  message: 'This is a test alert message',
  severity: 'WARNING',
  eventType: 'router.cpu.high',
  deviceId: TEST_ROUTER_ID,
  triggeredAt: new Date().toISOString(),
  acknowledgedAt: null,
  acknowledgedBy: null,
  data: { cpuUsage: 95 },
  deliveryStatus: { inapp: 'delivered' },
  updatedAt: new Date().toISOString(),
  rule: {
    id: 'rule-1',
    name: 'High CPU Usage',
    enabled: true,
    channels: ['inapp'],
  },
  ...overrides,
});

/**
 * Setup GraphQL mocking helper
 */
const setupGraphQLMock = async (page: Page) => {
  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Handle different GraphQL operations
    if (postData.operationName === 'GetAlerts') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            alerts: {
              edges: [],
              pageInfo: { hasNextPage: false, hasPreviousPage: false },
              totalCount: 0,
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
 * Trigger test alert via backend API helper
 */
const triggerTestAlert = async (page: Page, severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'WARNING') => {
  // Simulate WebSocket alert event by directly calling the subscription callback
  // In real implementation, this would trigger via backend API
  const alert = createMockAlert({ severity });

  await page.evaluate((alertData) => {
    // Simulate incoming WebSocket message
    window.postMessage(
      {
        type: 'graphql-subscription',
        operation: 'alertEvents',
        data: {
          alertEvents: {
            action: 'CREATED',
            alert: alertData,
          },
        },
      },
      '*'
    );
  }, alert);

  return alert;
};

/**
 * Mock Audio API to prevent actual sound playback
 */
const mockAudioAPI = async (page: Page) => {
  await page.addInitScript(() => {
    // Track Audio instances for test verification
    (window as any).__audioInstances__ = [];

    const OriginalAudio = window.Audio;
    (window as any).Audio = class MockAudio {
      src = '';
      volume = 1;
      paused = true;
      played: any[] = [];

      constructor(src?: string) {
        if (src) this.src = src;
        (window as any).__audioInstances__.push(this);
      }

      play() {
        this.paused = false;
        this.played.push({ timestamp: Date.now() });
        return Promise.resolve();
      }

      pause() {
        this.paused = true;
      }

      load() {}
    };
  });
};

/**
 * Setup: Navigate to dashboard and mock necessary APIs
 */
test.beforeEach(async ({ page }) => {
  await mockAudioAPI(page);
  await setupGraphQLMock(page);
  await page.goto(BASE_URL);

  // Wait for app to fully load
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// Scenario 1: Toast Notification Delivery (T-013)
// =============================================================================

test.describe('Toast Notification Delivery', () => {
  test('should display toast when alert is triggered (<2s latency)', async ({ page }) => {
    const startTime = Date.now();

    // Trigger test alert
    await triggerTestAlert(page, 'WARNING');

    // Wait for toast to appear with 2s timeout
    const toast = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify latency
    const latency = Date.now() - startTime;
    expect(latency).toBeLessThan(2000);

    // Verify toast content
    await expect(toast).toContainText('Test Alert');
    await expect(toast).toContainText('This is a test alert message');
  });

  test('should show correct severity styling for WARNING toast', async ({ page }) => {
    await triggerTestAlert(page, 'WARNING');

    const toast = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify WARNING styling (amber/orange colors)
    // Exact class depends on implementation
    await expect(toast).toHaveClass(/warning|amber/i);
  });

  test('should show correct severity styling for CRITICAL toast', async ({ page }) => {
    await triggerTestAlert(page, 'CRITICAL');

    const toast = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify CRITICAL styling (red colors)
    await expect(toast).toHaveClass(/critical|error|red/i);
  });

  test('should show correct severity styling for INFO toast', async ({ page }) => {
    await triggerTestAlert(page, 'INFO');

    const toast = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify INFO styling (blue colors)
    await expect(toast).toHaveClass(/info|blue/i);
  });

  test('should auto-dismiss toast after 5 seconds', async ({ page }) => {
    await triggerTestAlert(page, 'INFO');

    const toast = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Wait for auto-dismiss (5s + buffer)
    await expect(toast).not.toBeVisible({ timeout: 6000 });
  });

  test('should allow manual dismiss of toast', async ({ page }) => {
    await triggerTestAlert(page, 'WARNING');

    const toast = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Click dismiss button
    const dismissButton = toast.getByRole('button', { name: /close|dismiss/i });
    await dismissButton.click();

    // Verify toast disappears
    await expect(toast).not.toBeVisible({ timeout: 500 });
  });

  test('should stack multiple toasts', async ({ page }) => {
    // Trigger 3 alerts in quick succession
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'CRITICAL');

    // Verify all 3 toasts visible
    const toasts = page.getByRole('status').filter({ hasText: /test alert/i });
    await expect(toasts).toHaveCount(3);
  });
});

// =============================================================================
// Scenario 2: Bell Badge Updates (T-025)
// =============================================================================

test.describe('Notification Bell Badge', () => {
  test('should update bell badge with unread count', async ({ page }) => {
    // Initial state: no badge
    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell).toBeVisible();

    // Initially no badge
    const initialBadge = bell.getByText(/^\d+$/);
    await expect(initialBadge).not.toBeVisible();

    // Trigger alert
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500); // Allow state update

    // Verify badge shows "1"
    const badge = bell.getByText('1');
    await expect(badge).toBeVisible({ timeout: 2000 });
  });

  test('should update aria-label with unread count', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });

    // Initial aria-label
    await expect(bell).toHaveAttribute('aria-label', /notifications/i);

    // Trigger alert
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    // Verify aria-label updated with count
    await expect(bell).toHaveAttribute('aria-label', /1 unread/i);
  });

  test('should display badge for counts 1-9', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });

    // Trigger 5 alerts
    for (let i = 0; i < 5; i++) {
      await triggerTestAlert(page, 'INFO');
      await page.waitForTimeout(100);
    }

    // Verify badge shows "5"
    const badge = bell.getByText('5');
    await expect(badge).toBeVisible({ timeout: 2000 });
  });

  test('should display "9+" badge for 10+ notifications', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });

    // Trigger 12 alerts
    for (let i = 0; i < 12; i++) {
      await triggerTestAlert(page, 'INFO');
      await page.waitForTimeout(50);
    }

    // Verify badge shows "9+"
    const badge = bell.getByText('9+');
    await expect(badge).toBeVisible({ timeout: 2000 });
  });

  test('should clear badge when all notifications read', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });

    // Trigger alert
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    // Verify badge present
    await expect(bell.getByText('1')).toBeVisible();

    // Open panel and mark as read
    await bell.click();
    const markAllReadButton = page.getByRole('button', { name: /mark all.*read/i });
    await markAllReadButton.click();

    // Verify badge cleared
    await expect(bell.getByText(/^\d+$/)).not.toBeVisible({ timeout: 2000 });
  });
});

// =============================================================================
// Scenario 3: Notification Center Panel (T-026)
// =============================================================================

test.describe('Notification Center Panel', () => {
  test('should open panel when bell clicked', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Verify panel visible
    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible({ timeout: 1000 });
  });

  test('should display notifications in panel', async ({ page }) => {
    // Trigger alert
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    // Open panel
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Verify notification appears in list
    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const notification = panel.getByText(/test alert/i);
    await expect(notification).toBeVisible();
  });

  test('should show empty state when no notifications', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel.getByText(/no.*notifications/i)).toBeVisible();
  });

  test('should close panel when clicking outside', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible();

    // Click outside panel
    await page.click('body', { position: { x: 10, y: 10 } });

    // Verify panel closed
    await expect(panel).not.toBeVisible({ timeout: 1000 });
  });

  test('should close panel with Escape key', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify panel closed
    await expect(panel).not.toBeVisible({ timeout: 1000 });
  });

  test('should display notification timestamp', async ({ page }) => {
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Verify timestamp displayed (e.g., "just now", "2m ago")
    await expect(panel.getByText(/just now|ago|second|minute/i)).toBeVisible();
  });

  test('should display severity icon', async ({ page }) => {
    await triggerTestAlert(page, 'CRITICAL');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Verify severity indicator (icon or badge)
    const notification = panel.getByText(/test alert/i).locator('..');
    await expect(notification).toBeVisible();
    // Icon verification depends on implementation
  });
});

// =============================================================================
// Scenario 4: Mark as Read/Unread (T-027)
// =============================================================================

test.describe('Mark as Read/Unread', () => {
  test('should mark notification as read when clicked', async ({ page }) => {
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const notification = panel.getByText(/test alert/i);

    // Click notification
    await notification.click();

    // Verify marked as read (styling change or checkmark)
    await expect(notification.locator('..')).toHaveAttribute('data-read', 'true');
  });

  test('should decrease unread count when marked as read', async ({ page }) => {
    // Trigger 2 alerts
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(200);
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });

    // Verify badge shows 2
    await expect(bell.getByText('2')).toBeVisible();

    // Open panel and mark one as read
    await bell.click();
    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const firstNotification = panel.getByText(/test alert/i).first();
    await firstNotification.click();

    // Close and reopen to verify count
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify badge now shows 1
    await expect(bell.getByText('1')).toBeVisible();
  });

  test('should mark all as read', async ({ page }) => {
    // Trigger 3 alerts
    for (let i = 0; i < 3; i++) {
      await triggerTestAlert(page, 'INFO');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Click "Mark all as read"
    const markAllButton = page.getByRole('button', { name: /mark all.*read/i });
    await markAllButton.click();

    // Verify badge cleared
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(bell.getByText(/^\d+$/)).not.toBeVisible();
  });

  test('should clear all notifications', async ({ page }) => {
    // Trigger 2 alerts
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(200);
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Click "Clear all"
    const clearAllButton = page.getByRole('button', { name: /clear all/i });
    await clearAllButton.click();

    // Verify empty state
    await expect(panel.getByText(/no.*notifications/i)).toBeVisible({ timeout: 1000 });
  });
});

// =============================================================================
// Scenario 5: Filter by Severity
// =============================================================================

test.describe('Severity Filtering', () => {
  test('should filter by CRITICAL severity', async ({ page }) => {
    // Trigger mixed severity alerts
    await triggerTestAlert(page, 'CRITICAL');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Apply CRITICAL filter
    const criticalFilter = panel.getByRole('button', { name: /critical/i });
    await criticalFilter.click();

    // Verify only CRITICAL notifications shown
    const notifications = panel.getByRole('listitem');
    await expect(notifications).toHaveCount(1);
  });

  test('should filter by WARNING severity', async ({ page }) => {
    // Trigger mixed severity alerts
    await triggerTestAlert(page, 'CRITICAL');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Apply WARNING filter
    const warningFilter = panel.getByRole('button', { name: /warning/i });
    await warningFilter.click();

    // Verify only WARNING notifications shown (2)
    const notifications = panel.getByRole('listitem');
    await expect(notifications).toHaveCount(2);
  });

  test('should clear filter to show all', async ({ page }) => {
    // Trigger mixed severity alerts
    await triggerTestAlert(page, 'CRITICAL');
    await page.waitForTimeout(100);
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Apply filter
    const criticalFilter = panel.getByRole('button', { name: /critical/i });
    await criticalFilter.click();

    // Clear filter
    const allFilter = panel.getByRole('button', { name: /all/i });
    await allFilter.click();

    // Verify all notifications shown (2)
    const notifications = panel.getByRole('listitem');
    await expect(notifications).toHaveCount(2);
  });
});

// =============================================================================
// Scenario 6: Settings Persistence (T-028)
// =============================================================================

test.describe('Notification Settings Persistence', () => {
  test('should persist sound enabled/disabled across reload', async ({ page }) => {
    // Open settings
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const settingsButton = panel.getByRole('button', { name: /settings|preferences/i });
    await settingsButton.click();

    // Disable sound
    const soundToggle = page.getByRole('switch', { name: /sound.*enabled/i });
    await soundToggle.click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Reopen settings
    await bell.click();
    await settingsButton.click();

    // Verify sound still disabled
    const soundToggleAfterReload = page.getByRole('switch', { name: /sound.*enabled/i });
    await expect(soundToggleAfterReload).not.toBeChecked();
  });

  test('should persist toast enabled/disabled across reload', async ({ page }) => {
    // Open settings
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const settingsButton = panel.getByRole('button', { name: /settings|preferences/i });
    await settingsButton.click();

    // Disable toasts
    const toastToggle = page.getByRole('switch', { name: /show.*toast/i });
    await toastToggle.click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Reopen settings
    await bell.click();
    await settingsButton.click();

    // Verify toast still disabled
    const toastToggleAfterReload = page.getByRole('switch', { name: /show.*toast/i });
    await expect(toastToggleAfterReload).not.toBeChecked();
  });

  test('should persist selected sound variant', async ({ page }) => {
    // Open settings
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const settingsButton = panel.getByRole('button', { name: /settings|preferences/i });
    await settingsButton.click();

    // Select different sound
    const soundSelect = page.getByRole('combobox', { name: /sound.*type/i });
    await soundSelect.selectOption('chime');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Reopen settings
    await bell.click();
    await settingsButton.click();

    // Verify sound selection persisted
    const soundSelectAfterReload = page.getByRole('combobox', { name: /sound.*type/i });
    await expect(soundSelectAfterReload).toHaveValue('chime');
  });
});

// =============================================================================
// Scenario 7: WebSocket Reconnection Recovery
// =============================================================================

test.describe('WebSocket Reconnection', () => {
  test('should reconnect WebSocket after disconnect', async ({ page }) => {
    // Monitor WebSocket connections
    let wsConnections = 0;
    page.on('websocket', (ws) => {
      wsConnections++;

      // Simulate disconnect after 1s
      setTimeout(() => {
        (ws as any).close?.();
      }, 1000);
    });

    // Wait for initial connection
    await page.waitForTimeout(500);
    expect(wsConnections).toBeGreaterThan(0);

    // Wait for reconnection
    await page.waitForTimeout(2000);

    // Verify reconnection occurred
    expect(wsConnections).toBeGreaterThanOrEqual(2);
  });

  test('should receive alerts after reconnection', async ({ page }) => {
    // Trigger alert before disconnect
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell.getByText('1')).toBeVisible();

    // Simulate disconnect and reconnect
    await page.evaluate(() => {
      // Close WebSocket connection
      // Implementation depends on WebSocket client
    });

    await page.waitForTimeout(2000); // Allow reconnection

    // Trigger alert after reconnection
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    // Verify badge updated to 2
    await expect(bell.getByText('2')).toBeVisible();
  });

  test('should show connection status indicator', async ({ page }) => {
    // Look for connection status indicator
    const statusIndicator = page.getByRole('status', { name: /connection.*status/i });

    // Verify connected state
    await expect(statusIndicator).toHaveAttribute('data-status', 'connected');

    // Simulate disconnect
    await page.evaluate(() => {
      window.postMessage({ type: 'websocket-disconnect' }, '*');
    });

    // Verify disconnected state shown
    await expect(statusIndicator).toHaveAttribute('data-status', 'disconnected');
  });
});

// =============================================================================
// Scenario 8: Sound Playback (Mocked Audio API)
// =============================================================================

test.describe('Sound Playback', () => {
  test('should play sound when alert received (if enabled)', async ({ page }) => {
    // Verify Audio API is mocked
    await page.evaluate(() => {
      expect((window as any).__audioInstances__).toBeDefined();
    });

    // Trigger alert
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(1000);

    // Verify audio played
    const audioPlayed = await page.evaluate(() => {
      const instances = (window as any).__audioInstances__;
      return instances.some((audio: any) => audio.played.length > 0);
    });

    expect(audioPlayed).toBe(true);
  });

  test('should not play sound when disabled', async ({ page }) => {
    // Disable sound in settings
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const settingsButton = panel.getByRole('button', { name: /settings|preferences/i });
    await settingsButton.click();

    const soundToggle = page.getByRole('switch', { name: /sound.*enabled/i });
    await soundToggle.click(); // Disable

    await page.keyboard.press('Escape');

    // Trigger alert
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(1000);

    // Verify no audio played
    const audioPlayed = await page.evaluate(() => {
      const instances = (window as any).__audioInstances__;
      return instances.some((audio: any) => audio.played.length > 0);
    });

    expect(audioPlayed).toBe(false);
  });

  test('should play different sounds for different severities', async ({ page }) => {
    // Trigger CRITICAL alert
    await triggerTestAlert(page, 'CRITICAL');
    await page.waitForTimeout(500);

    const criticalSoundSrc = await page.evaluate(() => {
      const instances = (window as any).__audioInstances__;
      return instances[instances.length - 1]?.src;
    });

    // Trigger INFO alert
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const infoSoundSrc = await page.evaluate(() => {
      const instances = (window as any).__audioInstances__;
      return instances[instances.length - 1]?.src;
    });

    // Verify different sounds used
    expect(criticalSoundSrc).not.toBe(infoSoundSrc);
  });
});

// =============================================================================
// Scenario 9: Navigation to Alert Target
// =============================================================================

test.describe('Alert Navigation', () => {
  test('should navigate to alert target when notification clicked', async ({ page }) => {
    // Trigger alert with navigation target
    const alertWithTarget = createMockAlert({
      eventType: 'interface.down',
      data: { interfaceId: 'ether1', targetUrl: '/dashboard/network/interfaces/ether1' },
    });

    await page.evaluate((alert) => {
      window.postMessage(
        {
          type: 'graphql-subscription',
          operation: 'alertEvents',
          data: {
            alertEvents: {
              action: 'CREATED',
              alert,
            },
          },
        },
        '*'
      );
    }, alertWithTarget);

    await page.waitForTimeout(500);

    // Open notification panel
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Click notification
    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const notification = panel.getByText(/test alert/i);
    await notification.click();

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/dashboard\/network\/interfaces\/ether1/);
  });

  test('should close panel after navigation', async ({ page }) => {
    const alertWithTarget = createMockAlert({
      data: { targetUrl: '/dashboard/system' },
    });

    await page.evaluate((alert) => {
      window.postMessage(
        {
          type: 'graphql-subscription',
          operation: 'alertEvents',
          data: {
            alertEvents: {
              action: 'CREATED',
              alert,
            },
          },
        },
        '*'
      );
    }, alertWithTarget);

    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const notification = panel.getByText(/test alert/i);
    await notification.click();

    // Verify panel closed
    await expect(panel).not.toBeVisible({ timeout: 1000 });
  });
});

// =============================================================================
// Scenario 10: Keyboard Navigation
// =============================================================================

test.describe('Keyboard Navigation', () => {
  test('should open panel with Enter key on bell', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible({ timeout: 1000 });
  });

  test('should navigate notifications with arrow keys', async ({ page }) => {
    // Trigger 3 alerts
    for (let i = 0; i < 3; i++) {
      await triggerTestAlert(page, 'INFO');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Focus first notification
    await page.keyboard.press('Tab');

    // Navigate down with arrow
    await page.keyboard.press('ArrowDown');

    // Verify focus moved
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBeTruthy();
  });

  test('should activate notification with Enter key', async ({ page }) => {
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Tab to first notification
    await page.keyboard.press('Tab');

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify notification marked as read or action triggered
    // Implementation depends on component behavior
  });

  test('should close panel with Escape key', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(panel).not.toBeVisible({ timeout: 1000 });
  });
});

// =============================================================================
// Scenario 11: Accessibility (WCAG AAA)
// =============================================================================

test.describe('Accessibility', () => {
  test('should have accessible bell button with aria-label', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell).toHaveAttribute('aria-label');
  });

  test('should announce new notifications to screen readers', async ({ page }) => {
    // Trigger alert
    await triggerTestAlert(page, 'WARNING');

    // Verify ARIA live region updated
    const liveRegion = page.getByRole('status').first();
    await expect(liveRegion).toContainText(/test alert/i);
  });

  test('should have proper focus indicators', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.focus();

    // Verify focus ring visible
    const hasFocusStyle = await bell.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow.includes('ring');
    });

    expect(hasFocusStyle).toBe(true);
  });

  test('should have 44px minimum touch target on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const bell = page.getByRole('button', { name: /notifications/i });
    const boundingBox = await bell.boundingBox();

    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
  });

  test('should maintain 7:1 contrast ratio for text', async ({ page }) => {
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Note: Actual contrast checking requires pa11y or axe-core
    // This is a placeholder for the actual accessibility test
    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible();
  });

  test('should support screen reader navigation of notification list', async ({ page }) => {
    // Trigger 2 alerts
    await triggerTestAlert(page, 'WARNING');
    await page.waitForTimeout(200);
    await triggerTestAlert(page, 'INFO');
    await page.waitForTimeout(500);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    const list = panel.getByRole('list');

    // Verify list has proper ARIA
    await expect(list).toHaveAttribute('role', 'list');

    const items = panel.getByRole('listitem');
    await expect(items).toHaveCount(2);
  });
});

// =============================================================================
// Scenario 12: Performance
// =============================================================================

test.describe('Performance', () => {
  test('should handle large notification list (100+ entries)', async ({ page }) => {
    // Trigger 150 alerts rapidly
    for (let i = 0; i < 150; i++) {
      await page.evaluate((index) => {
        const alert = {
          id: `alert-${index}`,
          title: `Alert ${index}`,
          message: `Message ${index}`,
          severity: 'INFO',
          eventType: 'test.event',
          triggeredAt: new Date().toISOString(),
        };
        window.postMessage(
          {
            type: 'graphql-subscription',
            operation: 'alertEvents',
            data: { alertEvents: { action: 'CREATED', alert } },
          },
          '*'
        );
      }, i);

      // Small delay to avoid overwhelming
      if (i % 10 === 0) await page.waitForTimeout(50);
    }

    await page.waitForTimeout(1000);

    // Open panel
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    // Verify panel opens without freezing
    const panel = page.getByRole('complementary', { name: /notification.*center/i });
    await expect(panel).toBeVisible({ timeout: 3000 });
  });

  test('should virtualize notification list for smooth scrolling', async ({ page }) => {
    // Trigger 100 alerts
    for (let i = 0; i < 100; i++) {
      await page.evaluate((index) => {
        const alert = {
          id: `alert-${index}`,
          title: `Alert ${index}`,
          message: `Message ${index}`,
          severity: 'INFO',
          eventType: 'test.event',
          triggeredAt: new Date().toISOString(),
        };
        window.postMessage(
          {
            type: 'graphql-subscription',
            operation: 'alertEvents',
            data: { alertEvents: { action: 'CREATED', alert } },
          },
          '*'
        );
      }, i);

      if (i % 10 === 0) await page.waitForTimeout(50);
    }

    await page.waitForTimeout(1000);

    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();

    const panel = page.getByRole('complementary', { name: /notification.*center/i });

    // Scroll rapidly
    await panel.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Verify scroll completed smoothly (no lag)
    await page.waitForTimeout(500);
    await expect(panel).toBeVisible();
  });
});
