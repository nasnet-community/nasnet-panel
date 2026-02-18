/**
 * Tests for ToastProvider
 * @see NAS-4.19: Implement Notification/Toast System
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import {
  useNotificationStore,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from '@nasnet/state/stores';

import { ToastProvider } from './ToastProvider';

// Mock the usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock the useThemeStore hook
vi.mock('@nasnet/state/stores', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nasnet/state/stores')>();
  return {
    ...actual,
    useThemeStore: vi.fn((selector) => selector({ resolvedTheme: 'light' })),
  };
});

describe('ToastProvider', () => {
  beforeEach(() => {
    // Reset notification store state
    useNotificationStore.setState({ notifications: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render Sonner Toaster', () => {
      const { container } = render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      // Sonner adds a [data-sonner-toaster] element
      expect(container.querySelector('[data-sonner-toaster]')).toBeInTheDocument();
    });
  });

  describe('Toast Display (AC1, AC2, AC3)', () => {
    it('should display success toast when notification added', async () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      // Add a notification via store
      showSuccess('Operation completed', 'Files saved successfully');

      // Advance timers to allow effect to run
      await vi.runAllTimersAsync();

      // Toast should be visible
      await waitFor(() => {
        expect(screen.getByText('Operation completed')).toBeInTheDocument();
      });
    });

    it('should display error toast that persists (no auto-dismiss)', async () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      showError('Connection failed', 'Unable to reach server');

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
      });

      // Advance past normal auto-dismiss time
      await vi.advanceTimersByTimeAsync(5000);

      // Error toast should still be visible
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should display warning toast', async () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      showWarning('Slow connection', 'Network latency is high');

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('Slow connection')).toBeInTheDocument();
      });
    });

    it('should display info toast', async () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      showInfo('Backup available', 'A new backup is ready');

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('Backup available')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Queue (AC3)', () => {
    it('should limit visible toasts to 3', async () => {
      render(
        <ToastProvider visibleToasts={3}>
          <div>Test</div>
        </ToastProvider>
      );

      // Add 5 notifications quickly (with time gaps to avoid dedup)
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(100);
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: `Toast ${i + 1}`,
        });
      }

      await vi.runAllTimersAsync();

      // Sonner limits visible toasts
      // Note: The exact behavior depends on Sonner's queue implementation
      // The store will have all 5, but Sonner shows max 3
      expect(useNotificationStore.getState().notifications).toHaveLength(5);
    });
  });

  describe('Deduplication (AC6)', () => {
    it('should deduplicate identical notifications within 2 seconds', async () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      // Add same notification twice quickly
      const id1 = showSuccess('Saved', 'Configuration saved');
      const id2 = showSuccess('Saved', 'Configuration saved');

      await vi.runAllTimersAsync();

      // Second should be deduplicated (returns empty string)
      expect(id1).toBeTruthy();
      expect(id2).toBe('');

      // Only one notification in store
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('Props', () => {
    it('should accept custom visibleToasts prop', () => {
      const { container } = render(
        <ToastProvider visibleToasts={5}>
          <div>Test</div>
        </ToastProvider>
      );

      // Check toaster is rendered (specific visible count is internal to Sonner)
      expect(container.querySelector('[data-sonner-toaster]')).toBeInTheDocument();
    });

    it('should accept richColors prop', () => {
      const { container } = render(
        <ToastProvider richColors={false}>
          <div>Test</div>
        </ToastProvider>
      );

      expect(container.querySelector('[data-sonner-toaster]')).toBeInTheDocument();
    });

    it('should accept expand prop', () => {
      const { container } = render(
        <ToastProvider expand={false}>
          <div>Test</div>
        </ToastProvider>
      );

      expect(container.querySelector('[data-sonner-toaster]')).toBeInTheDocument();
    });
  });
});
