/**
 * useServiceCard Hook Tests
 *
 * Unit tests for the headless ServiceCard hook.
 * Tests business logic, derived state, and event handlers.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useServiceCard } from './useServiceCard';

import type { ServiceCardProps , Service } from './types';

describe('useServiceCard', () => {
  const mockService: Service = {
    id: '1',
    name: 'Tor Proxy',
    description: 'Privacy-focused proxy service',
    category: 'privacy',
    status: 'running',
    version: '0.4.7.10',
    metrics: {
      cpu: 5.2,
      memory: 128,
      network: {
        rx: 1024000,
        tx: 512000,
      },
    },
  };

  const defaultProps: ServiceCardProps = {
    service: mockService,
  };

  describe('derived state', () => {
    it('should extract status from service', () => {
      const { result } = renderHook(() => useServiceCard(defaultProps));

      expect(result.current.status).toBe('running');
    });

    it('should determine isRunning correctly', () => {
      const { result: runningResult } = renderHook(() =>
        useServiceCard(defaultProps)
      );
      expect(runningResult.current.isRunning).toBe(true);

      const { result: stoppedResult } = renderHook(() =>
        useServiceCard({
          ...defaultProps,
          service: { ...mockService, status: 'stopped' },
        })
      );
      expect(stoppedResult.current.isRunning).toBe(false);
    });

    it('should determine isInstalled correctly', () => {
      const statuses: Service['status'][] = [
        'installed',
        'stopped',
        'starting',
        'running',
        'stopping',
      ];

      statuses.forEach((status) => {
        const { result } = renderHook(() =>
          useServiceCard({
            ...defaultProps,
            service: { ...mockService, status },
          })
        );
        expect(result.current.isInstalled).toBe(true);
      });

      const { result: availableResult } = renderHook(() =>
        useServiceCard({
          ...defaultProps,
          service: { ...mockService, status: 'available' },
        })
      );
      expect(availableResult.current.isInstalled).toBe(false);
    });

    it('should determine isAvailable correctly', () => {
      const { result } = renderHook(() =>
        useServiceCard({
          ...defaultProps,
          service: { ...mockService, status: 'available' },
        })
      );

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isInstalled).toBe(false);
    });

    it('should determine isFailed correctly', () => {
      const { result } = renderHook(() =>
        useServiceCard({
          ...defaultProps,
          service: { ...mockService, status: 'failed' },
        })
      );

      expect(result.current.isFailed).toBe(true);
    });

    it('should map status to correct badge color', () => {
      const statusColorMap: Record<Service['status'], string> = {
        running: 'success',
        installed: 'secondary',
        stopped: 'secondary',
        available: 'info',
        installing: 'warning',
        starting: 'warning',
        stopping: 'warning',
        failed: 'error',
        deleting: 'error',
      };

      Object.entries(statusColorMap).forEach(([status, expectedColor]) => {
        const { result } = renderHook(() =>
          useServiceCard({
            ...defaultProps,
            service: { ...mockService, status: status as Service['status'] },
          })
        );
        expect(result.current.statusColor).toBe(expectedColor);
      });
    });

    it('should map status to correct label', () => {
      const statusLabelMap: Record<Service['status'], string> = {
        available: 'Available',
        installing: 'Installing',
        installed: 'Installed',
        starting: 'Starting',
        running: 'Running',
        stopping: 'Stopping',
        stopped: 'Stopped',
        failed: 'Failed',
        deleting: 'Deleting',
      };

      Object.entries(statusLabelMap).forEach(([status, expectedLabel]) => {
        const { result } = renderHook(() =>
          useServiceCard({
            ...defaultProps,
            service: { ...mockService, status: status as Service['status'] },
          })
        );
        expect(result.current.statusLabel).toBe(expectedLabel);
      });
    });

    it('should map category to correct color class', () => {
      const categoryColorMap: Record<Service['category'], string> = {
        privacy: 'text-purple-600 dark:text-purple-400',
        proxy: 'text-blue-600 dark:text-blue-400',
        dns: 'text-green-600 dark:text-green-400',
        security: 'text-red-600 dark:text-red-400',
        monitoring: 'text-orange-600 dark:text-orange-400',
      };

      Object.entries(categoryColorMap).forEach(([category, expectedColor]) => {
        const { result } = renderHook(() =>
          useServiceCard({
            ...defaultProps,
            service: {
              ...mockService,
              category: category as Service['category'],
            },
          })
        );
        expect(result.current.categoryColor).toBe(expectedColor);
      });
    });
  });

  describe('actions', () => {
    it('should extract primary action from actions array', () => {
      const actions = [
        {
          id: 'start',
          label: 'Start',
          onClick: vi.fn(),
        },
        {
          id: 'configure',
          label: 'Configure',
          onClick: vi.fn(),
        },
      ];

      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, actions })
      );

      expect(result.current.primaryAction).toBe(actions[0]);
    });

    it('should extract secondary actions correctly', () => {
      const actions = [
        {
          id: 'start',
          label: 'Start',
          onClick: vi.fn(),
        },
        {
          id: 'configure',
          label: 'Configure',
          onClick: vi.fn(),
        },
        {
          id: 'delete',
          label: 'Delete',
          onClick: vi.fn(),
        },
      ];

      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, actions })
      );

      expect(result.current.secondaryActions).toEqual([actions[1], actions[2]]);
    });

    it('should determine hasActions correctly', () => {
      const { result: withActions } = renderHook(() =>
        useServiceCard({
          ...defaultProps,
          actions: [{ id: 'start', label: 'Start', onClick: vi.fn() }],
        })
      );
      expect(withActions.current.hasActions).toBe(true);

      const { result: withoutActions } = renderHook(() =>
        useServiceCard(defaultProps)
      );
      expect(withoutActions.current.hasActions).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should determine hasMetrics correctly when showMetrics is true and metrics exist', () => {
      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, showMetrics: true })
      );

      expect(result.current.hasMetrics).toBe(true);
    });

    it('should determine hasMetrics as false when showMetrics is false', () => {
      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, showMetrics: false })
      );

      expect(result.current.hasMetrics).toBe(false);
    });

    it('should determine hasMetrics as false when metrics are undefined', () => {
      const { result } = renderHook(() =>
        useServiceCard({
          ...defaultProps,
          service: { ...mockService, metrics: undefined },
        })
      );

      expect(result.current.hasMetrics).toBe(false);
    });

    it('should extract CPU usage from metrics', () => {
      const { result } = renderHook(() => useServiceCard(defaultProps));

      expect(result.current.cpuUsage).toBe(5.2);
    });

    it('should extract memory usage from metrics', () => {
      const { result } = renderHook(() => useServiceCard(defaultProps));

      expect(result.current.memoryUsage).toBe(128);
    });

    it('should extract network RX from metrics', () => {
      const { result } = renderHook(() => useServiceCard(defaultProps));

      expect(result.current.networkRx).toBe(1024000);
    });

    it('should extract network TX from metrics', () => {
      const { result } = renderHook(() => useServiceCard(defaultProps));

      expect(result.current.networkTx).toBe(512000);
    });
  });

  describe('event handlers', () => {
    it('should call onClick when handleClick is invoked', () => {
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, onClick })
      );

      act(() => {
        result.current.handleClick();
      });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is undefined', () => {
      const { result } = renderHook(() => useServiceCard(defaultProps));

      expect(() => {
        act(() => {
          result.current.handleClick();
        });
      }).not.toThrow();
    });

    it('should call primaryAction.onClick when handlePrimaryAction is invoked', () => {
      const onClick = vi.fn();
      const actions = [{ id: 'start', label: 'Start', onClick }];

      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, actions })
      );

      act(() => {
        result.current.handlePrimaryAction();
      });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when action is disabled', () => {
      const onClick = vi.fn();
      const actions = [
        { id: 'start', label: 'Start', onClick, disabled: true },
      ];

      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, actions })
      );

      act(() => {
        result.current.handlePrimaryAction();
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when action is loading', () => {
      const onClick = vi.fn();
      const actions = [
        { id: 'start', label: 'Start', onClick, loading: true },
      ];

      const { result } = renderHook(() =>
        useServiceCard({ ...defaultProps, actions })
      );

      act(() => {
        result.current.handlePrimaryAction();
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should maintain stable references for event handlers', () => {
      const onClick = vi.fn();
      const { result, rerender } = renderHook(() =>
        useServiceCard({ ...defaultProps, onClick })
      );

      const firstHandleClick = result.current.handleClick;

      rerender();

      expect(result.current.handleClick).toBe(firstHandleClick);
    });
  });

  describe('formatBytes helper', () => {
    it('should format bytes correctly', () => {
      const { formatBytes } = await import('./useServiceCard');

      expect(formatBytes(0)).toBe('0 B/s');
      expect(formatBytes(512)).toBe('512.0 B/s');
      expect(formatBytes(1024)).toBe('1.0 KB/s');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB/s');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB/s');
      expect(formatBytes(1536)).toBe('1.5 KB/s');
    });
  });
});
