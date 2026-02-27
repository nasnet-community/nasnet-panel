/**
 * Alert Notification Store Tests
 * Tests deduplication, max queue, persistence, and 24h filtering
 */

import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  useAlertNotificationStore,
  type InAppNotification,
  type AlertSeverity,
} from './alert-notification.store';

describe('AlertNotificationStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useAlertNotificationStore());
    act(() => {
      result.current.clearAll();
      result.current.updateSettings({
        enabled: true,
        soundEnabled: true,
        severityFilter: 'ALL',
        autoDismissTiming: 5000,
      });
    });

    // Clear localStorage
    localStorage.clear();

    // Reset timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should add a notification', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Router Offline',
          message: 'Router 192.168.1.1 is offline',
          severity: 'CRITICAL',
          deviceId: 'router-1',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        alertId: 'alert-1',
        title: 'Router Offline',
        severity: 'CRITICAL',
        read: false,
      });
      expect(result.current.notifications[0].id).toBeDefined();
      expect(result.current.notifications[0].receivedAt).toBeDefined();
    });

    it('should update unread count when adding notifications', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      expect(result.current.unreadCount).toBe(0);

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test 1',
          message: 'Message 1',
          severity: 'INFO',
        });
      });

      expect(result.current.unreadCount).toBe(1);

      act(() => {
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Test 2',
          message: 'Message 2',
          severity: 'WARNING',
        });
      });

      expect(result.current.unreadCount).toBe(2);
    });

    it('should mark a notification as read', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test',
          message: 'Test message',
          severity: 'INFO',
        });
      });

      const notificationId = result.current.notifications[0].id;

      act(() => {
        result.current.markAsRead(notificationId);
      });

      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test 1',
          message: 'Message 1',
          severity: 'INFO',
        });
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Test 2',
          message: 'Message 2',
          severity: 'WARNING',
        });
      });

      expect(result.current.unreadCount).toBe(2);

      act(() => {
        result.current.markAllRead();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every((n) => n.read)).toBe(true);
    });

    it('should clear a single notification', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test 1',
          message: 'Message 1',
          severity: 'INFO',
        });
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Test 2',
          message: 'Message 2',
          severity: 'WARNING',
        });
      });

      expect(result.current.notifications).toHaveLength(2);

      const firstId = result.current.notifications[0].id;

      act(() => {
        result.current.clearNotification(firstId);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].alertId).toBe('alert-2');
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test 1',
          message: 'Message 1',
          severity: 'INFO',
        });
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Test 2',
          message: 'Message 2',
          severity: 'WARNING',
        });
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate notifications with same alertId within 2s window', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAlertNotificationStore());

      // Add first notification
      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Router Offline',
          message: 'Router is offline',
          severity: 'CRITICAL',
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      // Try to add duplicate within 2s window
      act(() => {
        vi.advanceTimersByTime(1000); // 1 second later
      });

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1', // Same alert ID
          title: 'Router Offline',
          message: 'Router is still offline',
          severity: 'CRITICAL',
        });
      });

      // Should still have only 1 notification (duplicate ignored)
      expect(result.current.notifications).toHaveLength(1);

      vi.useRealTimers();
    });

    it('should allow duplicate alertId after 2s deduplication window', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAlertNotificationStore());

      // Add first notification
      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Router Offline',
          message: 'Router is offline',
          severity: 'CRITICAL',
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      // Wait 2.5 seconds (outside deduplication window)
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // Add "duplicate" after window expires
      act(() => {
        result.current.addNotification({
          alertId: 'alert-1', // Same alert ID
          title: 'Router Offline Again',
          message: 'Router went offline again',
          severity: 'CRITICAL',
        });
      });

      // Should have 2 notifications (window expired)
      expect(result.current.notifications).toHaveLength(2);

      vi.useRealTimers();
    });

    it('should allow notifications with different alertIds', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Router Offline',
          message: 'Router 1 is offline',
          severity: 'CRITICAL',
        });
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Interface Down',
          message: 'Interface ether1 is down',
          severity: 'WARNING',
        });
      });

      expect(result.current.notifications).toHaveLength(2);
    });
  });

  describe('Max Queue Size', () => {
    it('should enforce max queue size of 100 notifications', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      // Add 120 notifications
      act(() => {
        for (let i = 0; i < 120; i++) {
          result.current.addNotification({
            alertId: `alert-${i}`,
            title: `Alert ${i}`,
            message: `Message ${i}`,
            severity: 'INFO',
          });
        }
      });

      // Should only keep 100 (newest)
      expect(result.current.notifications).toHaveLength(100);

      // Verify newest notifications are kept
      const alertIds = result.current.notifications.map((n) => n.alertId);
      expect(alertIds).toContain('alert-119'); // Newest
      expect(alertIds).not.toContain('alert-0'); // Oldest (should be dropped)
    });

    it('should keep newest notifications when enforcing queue limit', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      // Add 105 notifications
      act(() => {
        for (let i = 0; i < 105; i++) {
          result.current.addNotification({
            alertId: `alert-${i}`,
            title: `Alert ${i}`,
            message: `Message ${i}`,
            severity: 'INFO',
          });
        }
      });

      expect(result.current.notifications).toHaveLength(100);

      // The first notification (alert-0 through alert-4) should be dropped
      const firstNotification =
        result.current.notifications[result.current.notifications.length - 1];
      expect(parseInt(firstNotification.alertId.split('-')[1])).toBeGreaterThanOrEqual(5);

      // The last notification should be alert-104
      const lastNotification = result.current.notifications[0];
      expect(lastNotification.alertId).toBe('alert-104');
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      expect(result.current.settings.enabled).toBe(true);

      act(() => {
        result.current.updateSettings({ enabled: false });
      });

      expect(result.current.settings.enabled).toBe(false);
    });

    it('should update partial settings', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      const initialSettings = result.current.settings;

      act(() => {
        result.current.updateSettings({ soundEnabled: false });
      });

      expect(result.current.settings).toEqual({
        ...initialSettings,
        soundEnabled: false,
      });
    });

    it('should update severity filter', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.updateSettings({ severityFilter: 'CRITICAL' });
      });

      expect(result.current.settings.severityFilter).toBe('CRITICAL');
    });

    it('should update auto-dismiss timing', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.updateSettings({ autoDismissTiming: 10000 });
      });

      expect(result.current.settings.autoDismissTiming).toBe(10000);
    });
  });

  describe('Persistence', () => {
    it('should persist settings to localStorage', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.updateSettings({
          enabled: false,
          soundEnabled: false,
          severityFilter: 'CRITICAL',
          autoDismissTiming: 8000,
        });
      });

      // Check localStorage
      const stored = localStorage.getItem('alert-notification-store');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.settings).toEqual({
        enabled: false,
        soundEnabled: false,
        severityFilter: 'CRITICAL',
        autoDismissTiming: 8000,
      });
    });

    it('should NOT persist notifications to localStorage', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test',
          message: 'Test message',
          severity: 'INFO',
        });
      });

      const stored = localStorage.getItem('alert-notification-store');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.notifications).toBeUndefined();
    });
  });

  describe('24-Hour Filtering', () => {
    it('should filter out notifications older than 24 hours on rehydration', () => {
      vi.useFakeTimers();
      const now = new Date('2024-02-11T12:00:00Z');
      vi.setSystemTime(now);

      const { result } = renderHook(() => useAlertNotificationStore());

      // Add notification 25 hours ago
      const oldNotification: InAppNotification = {
        id: 'notif-old',
        alertId: 'alert-old',
        title: 'Old Alert',
        message: 'This is old',
        severity: 'INFO',
        read: false,
        receivedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      // Add recent notification (1 hour ago)
      const recentNotification: InAppNotification = {
        id: 'notif-recent',
        alertId: 'alert-recent',
        title: 'Recent Alert',
        message: 'This is recent',
        severity: 'WARNING',
        read: false,
        receivedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      };

      // Manually set notifications (simulating pre-existing state)
      act(() => {
        useAlertNotificationStore.setState({
          notifications: [recentNotification, oldNotification],
          unreadCount: 2,
        });
      });

      // Trigger filtering (simulate rehydration)
      act(() => {
        result.current._filterOldNotifications();
      });

      // Should only have recent notification
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe('notif-recent');
      expect(result.current.unreadCount).toBe(1);

      vi.useRealTimers();
    });

    it('should keep notifications within 24 hours', () => {
      vi.useFakeTimers();
      const now = new Date('2024-02-11T12:00:00Z');
      vi.setSystemTime(now);

      const { result } = renderHook(() => useAlertNotificationStore());

      // Add notifications at various ages (all within 24h)
      const notifications: InAppNotification[] = [
        {
          id: 'notif-1',
          alertId: 'alert-1',
          title: 'Alert 1',
          message: 'Message 1',
          severity: 'INFO',
          read: false,
          receivedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
        },
        {
          id: 'notif-2',
          alertId: 'alert-2',
          title: 'Alert 2',
          message: 'Message 2',
          severity: 'WARNING',
          read: false,
          receivedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        },
        {
          id: 'notif-3',
          alertId: 'alert-3',
          title: 'Alert 3',
          message: 'Message 3',
          severity: 'CRITICAL',
          read: false,
          receivedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
      ];

      act(() => {
        useAlertNotificationStore.setState({
          notifications,
          unreadCount: 3,
        });
      });

      // Trigger filtering
      act(() => {
        result.current._filterOldNotifications();
      });

      // All should remain (all within 24h)
      expect(result.current.notifications).toHaveLength(3);

      vi.useRealTimers();
    });
  });

  describe('Selector Hooks', () => {
    it('should get all notifications', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test 1',
          message: 'Message 1',
          severity: 'INFO',
        });
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Test 2',
          message: 'Message 2',
          severity: 'WARNING',
        });
      });

      expect(result.current.notifications).toHaveLength(2);
    });

    it('should calculate unread count correctly', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test 1',
          message: 'Message 1',
          severity: 'INFO',
        });
        result.current.addNotification({
          alertId: 'alert-2',
          title: 'Test 2',
          message: 'Message 2',
          severity: 'WARNING',
        });
      });

      expect(result.current.unreadCount).toBe(2);

      const firstId = result.current.notifications[0].id;

      act(() => {
        result.current.markAsRead(firstId);
      });

      expect(result.current.unreadCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle marking non-existent notification as read', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test',
          message: 'Message',
          severity: 'INFO',
        });
      });

      // Try to mark non-existent notification as read
      act(() => {
        result.current.markAsRead('non-existent-id');
      });

      // Should not crash, notification should remain unread
      expect(result.current.notifications[0].read).toBe(false);
    });

    it('should handle clearing non-existent notification', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      act(() => {
        result.current.addNotification({
          alertId: 'alert-1',
          title: 'Test',
          message: 'Message',
          severity: 'INFO',
        });
      });

      const initialLength = result.current.notifications.length;

      // Try to clear non-existent notification
      act(() => {
        result.current.clearNotification('non-existent-id');
      });

      // Should not crash, notification count should remain the same
      expect(result.current.notifications).toHaveLength(initialLength);
    });

    it('should handle empty notification queue', () => {
      const { result } = renderHook(() => useAlertNotificationStore());

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);

      // Operations on empty queue should not crash
      act(() => {
        result.current.markAllRead();
        result.current.clearAll();
        result.current._filterOldNotifications();
        result.current._updateUnreadCount();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });
});
