/**
 * Tests for Notification Store
 * @see NAS-4.5: Implement UI State with Zustand
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  useNotificationStore,
  selectNotifications,
  selectHasNotifications,
  selectNotificationCount,
  selectErrorNotifications,
  selectNotificationsByType,
  getNotificationState,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from './notification.store';

describe('useNotificationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotificationStore.setState({ notifications: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty notifications array', () => {
      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
    });
  });

  describe('addNotification Action', () => {
    it('should add a notification with auto-generated ID', () => {
      const { addNotification } = useNotificationStore.getState();

      const id = addNotification({
        type: 'success',
        title: 'Test notification',
      });

      expect(id).toBeTruthy();
      expect(id).toMatch(/^notification-\d+-/);
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(useNotificationStore.getState().notifications[0].title).toBe(
        'Test notification'
      );
    });

    it('should add notification with message', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'info',
        title: 'Test',
        message: 'This is a message',
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.message).toBe('This is a message');
    });

    it('should set createdAt timestamp', () => {
      const { addNotification } = useNotificationStore.getState();
      const before = Date.now();

      addNotification({
        type: 'success',
        title: 'Test',
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('should set default duration for success type (4000ms)', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test',
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(4000);
    });

    it('should set default duration for info type (4000ms)', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'info',
        title: 'Test',
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(4000);
    });

    it('should set default duration for warning type (5000ms)', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'warning',
        title: 'Test',
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(5000);
    });

    it('should set null duration for error type (no auto-dismiss)', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'error',
        title: 'Test',
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(null);
    });

    it('should set null duration for progress type', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'progress',
        title: 'Test',
        progress: 50,
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(null);
    });

    it('should respect custom duration', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test',
        duration: 10000,
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(10000);
    });

    it('should allow null duration override', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test',
        duration: null,
      });

      expect(useNotificationStore.getState().notifications[0].duration).toBe(null);
    });

    it('should add action to notification', () => {
      const { addNotification } = useNotificationStore.getState();
      const mockAction = vi.fn();

      addNotification({
        type: 'info',
        title: 'Test',
        action: {
          label: 'Click me',
          onClick: mockAction,
        },
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.action?.label).toBe('Click me');
      notification.action?.onClick();
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate notifications within 2 seconds', () => {
      const { addNotification } = useNotificationStore.getState();

      const id1 = addNotification({
        type: 'success',
        title: 'Test',
        message: 'Hello',
      });
      const id2 = addNotification({
        type: 'success',
        title: 'Test',
        message: 'Hello',
      });

      expect(id1).toBeTruthy();
      expect(id2).toBe(''); // Empty ID for duplicate
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });

    it('should allow same notification after dedup window (2s)', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test',
        message: 'Hello',
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      // Advance time past dedup window
      vi.advanceTimersByTime(2001);

      addNotification({
        type: 'success',
        title: 'Test',
        message: 'Hello',
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(2);
    });

    it('should not deduplicate different messages', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test',
        message: 'Hello 1',
      });
      addNotification({
        type: 'success',
        title: 'Test',
        message: 'Hello 2',
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(2);
    });

    it('should not deduplicate different titles', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test 1',
        message: 'Hello',
      });
      addNotification({
        type: 'success',
        title: 'Test 2',
        message: 'Hello',
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(2);
    });
  });

  describe('Max Queue Size', () => {
    it('should remove oldest when exceeding max (10)', () => {
      const { addNotification } = useNotificationStore.getState();

      // Add 12 notifications
      for (let i = 0; i < 12; i++) {
        vi.advanceTimersByTime(100); // Avoid dedup
        addNotification({
          type: 'info',
          title: `Notification ${i}`,
        });
      }

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(10);
      // Oldest (0 and 1) should be removed
      expect(notifications[0].title).toBe('Notification 2');
      expect(notifications[9].title).toBe('Notification 11');
    });

    it('should keep most recent 10 notifications', () => {
      const { addNotification } = useNotificationStore.getState();

      for (let i = 0; i < 15; i++) {
        vi.advanceTimersByTime(100);
        addNotification({
          type: 'info',
          title: `Notification ${i}`,
        });
      }

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(10);
      // Should have notifications 5-14 (most recent 10)
      expect(notifications[0].title).toBe('Notification 5');
      expect(notifications[9].title).toBe('Notification 14');
    });
  });

  describe('removeNotification Action', () => {
    it('should remove notification by ID', () => {
      const { addNotification, removeNotification } =
        useNotificationStore.getState();

      const id = addNotification({
        type: 'success',
        title: 'Test',
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      act(() => {
        removeNotification(id);
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('should handle removing non-existent notification', () => {
      const { removeNotification } = useNotificationStore.getState();

      // Should not throw
      expect(() => {
        act(() => {
          removeNotification('non-existent-id');
        });
      }).not.toThrow();
    });
  });

  describe('updateNotification Action', () => {
    it('should update notification properties', () => {
      const { addNotification, updateNotification } =
        useNotificationStore.getState();

      const id = addNotification({
        type: 'progress',
        title: 'Uploading...',
        progress: 0,
      });

      act(() => {
        updateNotification(id, { progress: 50 });
      });

      expect(useNotificationStore.getState().notifications[0].progress).toBe(50);
    });

    it('should update multiple properties', () => {
      const { addNotification, updateNotification } =
        useNotificationStore.getState();

      const id = addNotification({
        type: 'progress',
        title: 'Uploading...',
        progress: 0,
      });

      act(() => {
        updateNotification(id, { progress: 100, title: 'Upload complete' });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.progress).toBe(100);
      expect(notification.title).toBe('Upload complete');
    });
  });

  describe('clearAllNotifications Action', () => {
    it('should remove all notifications', () => {
      const { addNotification, clearAllNotifications } =
        useNotificationStore.getState();

      vi.advanceTimersByTime(100);
      addNotification({ type: 'success', title: 'Test 1' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'error', title: 'Test 2' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'info', title: 'Test 3' });

      expect(useNotificationStore.getState().notifications).toHaveLength(3);

      act(() => {
        clearAllNotifications();
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('getNotification Method', () => {
    it('should return notification by ID', () => {
      const { addNotification, getNotification } =
        useNotificationStore.getState();

      const id = addNotification({
        type: 'success',
        title: 'Test',
      });

      const notification = getNotification(id);
      expect(notification?.title).toBe('Test');
      expect(notification?.id).toBe(id);
    });

    it('should return undefined for non-existent ID', () => {
      const { getNotification } = useNotificationStore.getState();

      const notification = getNotification('non-existent');
      expect(notification).toBeUndefined();
    });
  });

  describe('Selectors', () => {
    it('selectNotifications should return all notifications', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Test',
      });

      const notifications = selectNotifications(useNotificationStore.getState());
      expect(notifications).toHaveLength(1);
    });

    it('selectHasNotifications should return true when notifications exist', () => {
      expect(selectHasNotifications(useNotificationStore.getState())).toBe(false);

      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Test',
      });

      expect(selectHasNotifications(useNotificationStore.getState())).toBe(true);
    });

    it('selectNotificationCount should return count', () => {
      const { addNotification } = useNotificationStore.getState();

      expect(selectNotificationCount(useNotificationStore.getState())).toBe(0);

      addNotification({ type: 'success', title: 'Test 1' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'success', title: 'Test 2' });

      expect(selectNotificationCount(useNotificationStore.getState())).toBe(2);
    });

    it('selectErrorNotifications should return only error notifications', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({ type: 'success', title: 'Success' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'error', title: 'Error 1' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'error', title: 'Error 2' });

      const errors = selectErrorNotifications(useNotificationStore.getState());
      expect(errors).toHaveLength(2);
      expect(errors[0].title).toBe('Error 1');
      expect(errors[1].title).toBe('Error 2');
    });

    it('selectNotificationsByType should filter by type', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({ type: 'success', title: 'Success' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'warning', title: 'Warning 1' });
      vi.advanceTimersByTime(100);
      addNotification({ type: 'warning', title: 'Warning 2' });

      const warnings = selectNotificationsByType('warning')(
        useNotificationStore.getState()
      );
      expect(warnings).toHaveLength(2);
    });
  });

  describe('Convenience Functions', () => {
    it('showSuccess should add success notification', () => {
      const id = showSuccess('Success!', 'Operation completed');

      expect(id).toBeTruthy();
      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('success');
      expect(notification.title).toBe('Success!');
      expect(notification.message).toBe('Operation completed');
    });

    it('showError should add error notification', () => {
      const id = showError('Error!', 'Something went wrong');

      expect(id).toBeTruthy();
      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('error');
      expect(notification.duration).toBe(null); // Errors don't auto-dismiss
    });

    it('showWarning should add warning notification', () => {
      const id = showWarning('Warning!');

      expect(id).toBeTruthy();
      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('warning');
    });

    it('showInfo should add info notification', () => {
      const id = showInfo('Info');

      expect(id).toBeTruthy();
      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('info');
    });
  });

  describe('Helper Functions', () => {
    it('getNotificationState should return current state', () => {
      const state = getNotificationState();
      expect(state.notifications).toEqual([]);
      expect(typeof state.addNotification).toBe('function');
      expect(typeof state.removeNotification).toBe('function');
    });
  });

  describe('Session-Only (No Persistence)', () => {
    it('should not persist to localStorage', () => {
      // Notification store has no persist middleware
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Test',
      });

      // No localStorage key should be set for notifications
      expect(localStorage.getItem('nasnet-notification-store')).toBe(null);
    });
  });
});
