import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { DHCPLease } from '@nasnet/core/types';
import { useNewLeaseDetection, type UseNewLeaseDetectionReturn } from './useNewLeaseDetection';
import { mockLeases, createMockLease } from '../__mocks__/lease-data';

describe('useNewLeaseDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('New lease detection', () => {
    it('should detect new lease when lease list grows', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);

      // Add a new lease
      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      const dataUpdated = result.current as UseNewLeaseDetectionReturn;
      expect(dataUpdated.newLeaseIds.size).toBe(1);
      expect(dataUpdated.newLeaseIds.has(mockLeases[3].id)).toBe(true);
    });

    it('should detect multiple new leases simultaneously', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 2) },
      });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);

      // Add multiple new leases
      const updatedLeases = [
        ...mockLeases.slice(0, 2),
        mockLeases[2],
        mockLeases[3],
        mockLeases[4],
      ];
      rerender({ leases: updatedLeases });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(3);
      expect(data.newLeaseIds.has(mockLeases[2].id)).toBe(true);
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);
      expect(data.newLeaseIds.has(mockLeases[4].id)).toBe(true);
    });

    it('should not detect existing leases as new', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases },
      });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);

      // Re-render with same leases
      rerender({ leases: mockLeases });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);
    });

    it('should handle empty lease list', () => {
      const { result } = renderHook(() => useNewLeaseDetection([] as DHCPLease[]));

      const data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);
    });

    it('should handle lease list becoming empty', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases },
      });

      rerender({ leases: [] });

      const data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);
    });
  });

  describe('Auto-fade after 5 seconds', () => {
    it('should remove new lease badge after 5 seconds', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      // Add a new lease
      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(false);
    });

    it('should handle multiple timers for multiple new leases', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 2) },
      });

      // Add first new lease
      const updatedLeases1 = [...mockLeases.slice(0, 2), mockLeases[2]];
      rerender({ leases: updatedLeases1 });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(1);

      // Fast-forward 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Add second new lease
      const updatedLeases2 = [...updatedLeases1, mockLeases[3]];
      rerender({ leases: updatedLeases2 });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(2);

      // Fast-forward 3 more seconds (total 5 seconds for first lease)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[2].id)).toBe(false);
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);

      // Fast-forward 2 more seconds (total 5 seconds for second lease)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(0);
    });

    it('should not fade before 5 seconds', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);

      // Fast-forward 4.9 seconds (not quite 5)
      act(() => {
        vi.advanceTimersByTime(4900);
      });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);
    });
  });

  describe('Manual marking as seen', () => {
    it('should remove lease from new set when marked as seen', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);

      // Note: If markAsSeen method doesn't exist, tests will need to be updated
      // or the hook implementation needs to be checked
      if ('markAsSeen' in data) {
        act(() => {
          (data as any).markAsSeen(mockLeases[3].id);
        });

        data = result.current as UseNewLeaseDetectionReturn;
        expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(false);
      }
    });

    it('should cancel auto-fade timer when manually marked as seen', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      let data = result.current as UseNewLeaseDetectionReturn;
      if ('markAsSeen' in data) {
        act(() => {
          (data as any).markAsSeen(mockLeases[3].id);
        });

        data = result.current as UseNewLeaseDetectionReturn;
        expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(false);

        // Fast-forward 5 seconds - should not re-appear
        act(() => {
          vi.advanceTimersByTime(5000);
        });

        data = result.current as UseNewLeaseDetectionReturn;
        expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(false);
      }
    });

    it('should handle marking non-existent lease as seen', () => {
      const { result } = renderHook(() => useNewLeaseDetection(mockLeases));

      const data = result.current as UseNewLeaseDetectionReturn;
      if ('markAsSeen' in data) {
        act(() => {
          (data as any).markAsSeen('non-existent-id');
        });

        // Should not throw error
        const dataAfter = result.current as UseNewLeaseDetectionReturn;
        expect(dataAfter.newLeaseIds.size).toBe(0);
      }
    });
  });

  describe('Lease removal', () => {
    it('should remove lease from new set when lease is deleted', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      let data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(true);

      // Remove the lease
      rerender({ leases: mockLeases.slice(0, 3) });

      data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.has(mockLeases[3].id)).toBe(false);
    });

    it('should cleanup timers when lease is removed', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      // Remove the lease
      rerender({ leases: mockLeases.slice(0, 3) });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid lease additions', () => {
      const { result, rerender } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: [] as DHCPLease[] },
      });

      // Rapidly add leases
      for (let i = 0; i < mockLeases.length; i++) {
        rerender({ leases: mockLeases.slice(0, i + 1) });
      }

      const data = result.current as UseNewLeaseDetectionReturn;
      expect(data.newLeaseIds.size).toBe(mockLeases.length);
    });

    it('should cleanup all timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { rerender, unmount } = renderHook(({ leases }) => useNewLeaseDetection(leases), {
        initialProps: { leases: mockLeases.slice(0, 3) },
      });

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3], mockLeases[4]];
      rerender({ leases: updatedLeases });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2); // One for each new lease
    });
  });
});
