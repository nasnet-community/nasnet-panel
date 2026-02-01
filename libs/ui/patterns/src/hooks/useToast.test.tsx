/**
 * Tests for useToast Hook
 * @see NAS-4.19: Implement Notification/Toast System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useToast } from './useToast';
import { useNotificationStore } from '@nasnet/state/stores';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    dismiss: vi.fn(),
  },
}));

describe('useToast', () => {
  beforeEach(() => {
    // Reset notification store state
    useNotificationStore.setState({ notifications: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('should add success notification', () => {
      const { result } = renderHook(() => useToast());

      let id: string;
      act(() => {
        id = result.current.success('Operation completed');
      });

      expect(id!).toBeTruthy();
      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('success');
      expect(notification.title).toBe('Operation completed');
    });

    it('should add success notification with message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Saved', { message: 'Configuration saved' });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.message).toBe('Configuration saved');
    });

    it('should respect custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Quick toast', { duration: 1000 });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.duration).toBe(1000);
    });
  });

  describe('error', () => {
    it('should add error notification', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Connection failed');
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('error');
      expect(notification.title).toBe('Connection failed');
    });

    it('should have null duration by default (no auto-dismiss)', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Error');
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.duration).toBe(null);
    });

    it('should include action when provided', () => {
      const { result } = renderHook(() => useToast());
      const mockRetry = vi.fn();

      act(() => {
        result.current.error('Failed', {
          action: { label: 'Retry', onClick: mockRetry },
        });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.action?.label).toBe('Retry');
      notification.action?.onClick();
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('warning', () => {
    it('should add warning notification', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Low battery');
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('warning');
    });
  });

  describe('info', () => {
    it('should add info notification', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Update available');
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('info');
    });
  });

  describe('progress', () => {
    it('should add progress notification', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.progress('Uploading...');
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('progress');
      expect(notification.progress).toBe(0);
    });

    it('should accept initial progress value', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.progress('Uploading...', { progress: 25 });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.progress).toBe(25);
    });

    it('should have null duration (no auto-dismiss)', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.progress('Processing...');
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.duration).toBe(null);
    });
  });

  describe('update', () => {
    it('should update existing notification', () => {
      const { result } = renderHook(() => useToast());

      let id: string;
      act(() => {
        id = result.current.progress('Uploading...', { progress: 0 });
      });

      act(() => {
        result.current.update(id, { progress: 50 });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.progress).toBe(50);
    });

    it('should update title', () => {
      const { result } = renderHook(() => useToast());

      let id: string;
      act(() => {
        id = result.current.progress('Uploading...', { progress: 0 });
      });

      act(() => {
        result.current.update(id, { title: 'Almost done...', progress: 90 });
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.title).toBe('Almost done...');
      expect(notification.progress).toBe(90);
    });
  });

  describe('dismiss', () => {
    it('should remove notification by ID', () => {
      const { result } = renderHook(() => useToast());

      let id: string;
      act(() => {
        id = result.current.success('Test');
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      act(() => {
        result.current.dismiss(id);
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('dismissAll', () => {
    it('should clear all notifications', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Toast 1');
      });
      vi.advanceTimersByTime(100);
      act(() => {
        result.current.success('Toast 2');
      });
      vi.advanceTimersByTime(100);
      act(() => {
        result.current.error('Toast 3');
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(3);

      act(() => {
        result.current.dismissAll();
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('promise', () => {
    it('should show loading then success on resolved promise', async () => {
      const { result } = renderHook(() => useToast());
      const mockPromise = Promise.resolve('done');

      let promiseResult: string;
      await act(async () => {
        promiseResult = await result.current.promise(mockPromise, {
          loading: 'Loading...',
          success: 'Done!',
          error: 'Failed',
        });
      });

      expect(promiseResult!).toBe('done');

      // Should have success notification after resolution
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].title).toBe('Done!');
    });

    it('should show loading then error on rejected promise', async () => {
      const { result } = renderHook(() => useToast());
      const mockPromise = Promise.reject(new Error('Network error'));

      await act(async () => {
        try {
          await result.current.promise(mockPromise, {
            loading: 'Loading...',
            success: 'Done!',
            error: 'Failed',
          });
        } catch {
          // Expected
        }
      });

      // Should have error notification after rejection
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].title).toBe('Failed');
    });

    it('should support dynamic success message', async () => {
      const { result } = renderHook(() => useToast());
      const mockPromise = Promise.resolve({ count: 5 });

      await act(async () => {
        await result.current.promise(mockPromise, {
          loading: 'Saving...',
          success: (data) => `Saved ${data.count} items`,
          error: 'Failed',
        });
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].title).toBe('Saved 5 items');
    });

    it('should support dynamic error message', async () => {
      const { result } = renderHook(() => useToast());
      const mockPromise = Promise.reject(new Error('Timeout'));

      await act(async () => {
        try {
          await result.current.promise(mockPromise, {
            loading: 'Loading...',
            success: 'Done!',
            error: (e) => `Failed: ${(e as Error).message}`,
          });
        } catch {
          // Expected
        }
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].title).toBe('Failed: Timeout');
    });
  });

  describe('memoization', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useToast());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(firstRender.success).toBe(secondRender.success);
      expect(firstRender.error).toBe(secondRender.error);
      expect(firstRender.warning).toBe(secondRender.warning);
      expect(firstRender.info).toBe(secondRender.info);
      expect(firstRender.progress).toBe(secondRender.progress);
      expect(firstRender.dismiss).toBe(secondRender.dismiss);
      expect(firstRender.dismissAll).toBe(secondRender.dismissAll);
    });
  });
});
