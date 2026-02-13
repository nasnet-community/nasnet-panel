import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useNewLeaseDetection } from './useNewLeaseDetection';
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
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      expect(result.current.newLeases.size).toBe(0);

      // Add a new lease
      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      expect(result.current.newLeases.size).toBe(1);
      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);
    });

    it('should detect multiple new leases simultaneously', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 2) } }
      );

      expect(result.current.newLeases.size).toBe(0);

      // Add multiple new leases
      const updatedLeases = [
        ...mockLeases.slice(0, 2),
        mockLeases[2],
        mockLeases[3],
        mockLeases[4],
      ];
      rerender({ leases: updatedLeases });

      expect(result.current.newLeases.size).toBe(3);
      expect(result.current.newLeases.has(mockLeases[2].id)).toBe(true);
      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);
      expect(result.current.newLeases.has(mockLeases[4].id)).toBe(true);
    });

    it('should not detect existing leases as new', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases } }
      );

      expect(result.current.newLeases.size).toBe(0);

      // Re-render with same leases
      rerender({ leases: mockLeases });

      expect(result.current.newLeases.size).toBe(0);
    });

    it('should handle empty lease list', () => {
      const { result } = renderHook(() => useNewLeaseDetection([]));

      expect(result.current.newLeases.size).toBe(0);
    });

    it('should handle lease list becoming empty', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases } }
      );

      rerender({ leases: [] });

      expect(result.current.newLeases.size).toBe(0);
    });
  });

  describe('Auto-fade after 5 seconds', () => {
    it('should remove new lease badge after 5 seconds', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      // Add a new lease
      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(false);
    });

    it('should handle multiple timers for multiple new leases', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 2) } }
      );

      // Add first new lease
      const updatedLeases1 = [...mockLeases.slice(0, 2), mockLeases[2]];
      rerender({ leases: updatedLeases1 });

      expect(result.current.newLeases.size).toBe(1);

      // Fast-forward 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Add second new lease
      const updatedLeases2 = [...updatedLeases1, mockLeases[3]];
      rerender({ leases: updatedLeases2 });

      expect(result.current.newLeases.size).toBe(2);

      // Fast-forward 3 more seconds (total 5 seconds for first lease)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.newLeases.has(mockLeases[2].id)).toBe(false);
      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);

      // Fast-forward 2 more seconds (total 5 seconds for second lease)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.newLeases.size).toBe(0);
    });

    it('should not fade before 5 seconds', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);

      // Fast-forward 4.9 seconds (not quite 5)
      act(() => {
        vi.advanceTimersByTime(4900);
      });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);
    });
  });

  describe('Manual marking as seen', () => {
    it('should remove lease from new set when marked as seen', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);

      act(() => {
        result.current.markAsSeen(mockLeases[3].id);
      });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(false);
    });

    it('should cancel auto-fade timer when manually marked as seen', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      act(() => {
        result.current.markAsSeen(mockLeases[3].id);
      });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(false);

      // Fast-forward 5 seconds - should not re-appear
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(false);
    });

    it('should handle marking non-existent lease as seen', () => {
      const { result } = renderHook(() => useNewLeaseDetection(mockLeases));

      act(() => {
        result.current.markAsSeen('non-existent-id');
      });

      // Should not throw error
      expect(result.current.newLeases.size).toBe(0);
    });
  });

  describe('Lease removal', () => {
    it('should remove lease from new set when lease is deleted', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(true);

      // Remove the lease
      rerender({ leases: mockLeases.slice(0, 3) });

      expect(result.current.newLeases.has(mockLeases[3].id)).toBe(false);
    });

    it('should cleanup timers when lease is removed', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3]];
      rerender({ leases: updatedLeases });

      // Remove the lease
      rerender({ leases: mockLeases.slice(0, 3) });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid lease additions', () => {
      const { result, rerender } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: [] } }
      );

      // Rapidly add leases
      for (let i = 0; i < mockLeases.length; i++) {
        rerender({ leases: mockLeases.slice(0, i + 1) });
      }

      expect(result.current.newLeases.size).toBe(mockLeases.length);
    });

    it('should cleanup all timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { rerender, unmount } = renderHook(
        ({ leases }) => useNewLeaseDetection(leases),
        { initialProps: { leases: mockLeases.slice(0, 3) } }
      );

      const updatedLeases = [...mockLeases.slice(0, 3), mockLeases[3], mockLeases[4]];
      rerender({ leases: updatedLeases });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2); // One for each new lease
    });
  });
});
