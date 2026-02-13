import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useBulkOperations } from './useBulkOperations';
import { mockLeases, createMockLease } from '../__mocks__/lease-data';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useMakeStaticMutation: vi.fn(),
  useDeleteLeaseMutation: vi.fn(),
}));

vi.mock('@nasnet/ui/primitives', () => ({
  useToast: vi.fn(),
}));

import { useMakeStaticMutation, useDeleteLeaseMutation } from '@nasnet/api-client/queries';
import { useToast } from '@nasnet/ui/primitives';

describe('useBulkOperations', () => {
  const mockToast = vi.fn();
  const mockMakeStatic = vi.fn();
  const mockDeleteLease = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useMakeStaticMutation as any).mockReturnValue([mockMakeStatic, { loading: false }]);
    (useDeleteLeaseMutation as any).mockReturnValue([mockDeleteLease, { loading: false }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Selection management', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      expect(result.current.selectedLeases.size).toBe(0);
    });

    it('should toggle single lease selection', () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
      });

      expect(result.current.selectedLeases.has('lease-1')).toBe(true);

      act(() => {
        result.current.toggleSelection('lease-1');
      });

      expect(result.current.selectedLeases.has('lease-1')).toBe(false);
    });

    it('should toggle multiple lease selections', () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
        result.current.toggleSelection('lease-3');
      });

      expect(result.current.selectedLeases.size).toBe(3);
      expect(result.current.selectedLeases.has('lease-1')).toBe(true);
      expect(result.current.selectedLeases.has('lease-2')).toBe(true);
      expect(result.current.selectedLeases.has('lease-3')).toBe(true);
    });

    it('should select all leases with toggleAll', () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleAll(true);
      });

      expect(result.current.selectedLeases.size).toBe(mockLeases.length);
      mockLeases.forEach((lease) => {
        expect(result.current.selectedLeases.has(lease.id)).toBe(true);
      });
    });

    it('should deselect all leases with toggleAll', () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleAll(true);
        result.current.toggleAll(false);
      });

      expect(result.current.selectedLeases.size).toBe(0);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
        result.current.clearSelection();
      });

      expect(result.current.selectedLeases.size).toBe(0);
    });
  });

  describe('makeAllStatic', () => {
    it('should make single lease static', async () => {
      mockMakeStatic.mockResolvedValue({ data: { makeStatic: true } });
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
      });

      await act(async () => {
        await result.current.makeAllStatic();
      });

      expect(mockMakeStatic).toHaveBeenCalledTimes(1);
      expect(mockMakeStatic).toHaveBeenCalledWith({
        variables: { leaseId: 'lease-1' },
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: '1 lease made static',
        variant: 'default',
      });
      expect(result.current.selectedLeases.size).toBe(0);
    });

    it('should make multiple leases static', async () => {
      mockMakeStatic.mockResolvedValue({ data: { makeStatic: true } });
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
        result.current.toggleSelection('lease-3');
      });

      await act(async () => {
        await result.current.makeAllStatic();
      });

      expect(mockMakeStatic).toHaveBeenCalledTimes(3);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: '3 leases made static',
        variant: 'default',
      });
      expect(result.current.selectedLeases.size).toBe(0);
    });

    it('should handle partial failures', async () => {
      mockMakeStatic
        .mockResolvedValueOnce({ data: { makeStatic: true } })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { makeStatic: true } });

      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
        result.current.toggleSelection('lease-3');
      });

      await act(async () => {
        await result.current.makeAllStatic();
      });

      expect(mockMakeStatic).toHaveBeenCalledTimes(3);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Partial Success',
        description: '2 leases made static, 1 failed',
        variant: 'warning',
      });
    });

    it('should handle all failures', async () => {
      mockMakeStatic.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
      });

      await act(async () => {
        await result.current.makeAllStatic();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to make leases static',
        variant: 'destructive',
      });
    });

    it('should do nothing when no leases selected', async () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      await act(async () => {
        await result.current.makeAllStatic();
      });

      expect(mockMakeStatic).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('deleteMultiple', () => {
    it('should delete single lease', async () => {
      mockDeleteLease.mockResolvedValue({ data: { deleteLease: true } });
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
      });

      await act(async () => {
        await result.current.deleteMultiple();
      });

      expect(mockDeleteLease).toHaveBeenCalledTimes(1);
      expect(mockDeleteLease).toHaveBeenCalledWith({
        variables: { leaseId: 'lease-1' },
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: '1 lease deleted',
        variant: 'default',
      });
      expect(result.current.selectedLeases.size).toBe(0);
    });

    it('should delete multiple leases', async () => {
      mockDeleteLease.mockResolvedValue({ data: { deleteLease: true } });
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
        result.current.toggleSelection('lease-3');
        result.current.toggleSelection('lease-4');
      });

      await act(async () => {
        await result.current.deleteMultiple();
      });

      expect(mockDeleteLease).toHaveBeenCalledTimes(4);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: '4 leases deleted',
        variant: 'default',
      });
      expect(result.current.selectedLeases.size).toBe(0);
    });

    it('should handle partial failures during deletion', async () => {
      mockDeleteLease
        .mockResolvedValueOnce({ data: { deleteLease: true } })
        .mockRejectedValueOnce(new Error('Cannot delete static lease'))
        .mockResolvedValueOnce({ data: { deleteLease: true } });

      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
        result.current.toggleSelection('lease-3');
      });

      await act(async () => {
        await result.current.deleteMultiple();
      });

      expect(mockDeleteLease).toHaveBeenCalledTimes(3);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Partial Success',
        description: '2 leases deleted, 1 failed',
        variant: 'warning',
      });
    });

    it('should handle all failures during deletion', async () => {
      mockDeleteLease.mockRejectedValue(new Error('Permission denied'));
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
      });

      await act(async () => {
        await result.current.deleteMultiple();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to delete leases',
        variant: 'destructive',
      });
    });

    it('should do nothing when no leases selected', async () => {
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      await act(async () => {
        await result.current.deleteMultiple();
      });

      expect(mockDeleteLease).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('Selection persistence', () => {
    it('should maintain selection across re-renders', () => {
      const { result, rerender } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
        result.current.toggleSelection('lease-2');
      });

      expect(result.current.selectedLeases.size).toBe(2);

      rerender();

      expect(result.current.selectedLeases.size).toBe(2);
      expect(result.current.selectedLeases.has('lease-1')).toBe(true);
      expect(result.current.selectedLeases.has('lease-2')).toBe(true);
    });

    it('should clear selection after successful operation', async () => {
      mockMakeStatic.mockResolvedValue({ data: { makeStatic: true } });
      const { result } = renderHook(() => useBulkOperations(mockLeases));

      act(() => {
        result.current.toggleSelection('lease-1');
      });

      expect(result.current.selectedLeases.size).toBe(1);

      await act(async () => {
        await result.current.makeAllStatic();
      });

      expect(result.current.selectedLeases.size).toBe(0);
    });
  });
});
