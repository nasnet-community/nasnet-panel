import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkOperations } from './useBulkOperations';
import { mockLeases, createMockLease } from '../__mocks__/lease-data';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useMakeLeaseStatic: vi.fn(),
  useDeleteLease: vi.fn(),
}));

vi.mock('@nasnet/state/stores', () => ({
  useDHCPUIStore: vi.fn(),
}));

import { useMakeLeaseStatic, useDeleteLease } from '@nasnet/api-client/queries';
import { useDHCPUIStore } from '@nasnet/state/stores';

describe('useBulkOperations', () => {
  const mockMakeStatic = vi.fn();
  const mockDeleteLease = vi.fn();
  const mockClearSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMakeLeaseStatic as any).mockReturnValue({
      mutateAsync: mockMakeStatic,
      isPending: false,
    });
    (useDeleteLease as any).mockReturnValue({
      mutateAsync: mockDeleteLease,
      isPending: false,
    });
    (useDHCPUIStore as any).mockReturnValue({
      clearLeaseSelection: mockClearSelection,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('makeAllStatic', () => {
    it('should return operation result on success', async () => {
      mockMakeStatic.mockResolvedValue({ data: { makeStatic: true } });
      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.makeAllStatic(['lease-1'], mockLeases);
      });

      expect(opResult).toEqual({
        succeeded: 1,
        failed: 0,
        total: 1,
      });
    });

    it('should handle partial failures', async () => {
      mockMakeStatic
        .mockResolvedValueOnce({ data: { makeStatic: true } })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { makeStatic: true } });

      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.makeAllStatic(
          ['lease-1', 'lease-2', 'lease-3'],
          mockLeases
        );
      });

      expect(opResult.succeeded).toBe(2);
      expect(opResult.failed).toBe(1);
    });

    it('should handle all failures', async () => {
      mockMakeStatic.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.makeAllStatic(['lease-1', 'lease-2'], mockLeases);
      });

      expect(opResult.succeeded).toBe(0);
      expect(opResult.failed).toBe(2);
    });
  });

  describe('deleteMultiple', () => {
    it('should delete single lease', async () => {
      mockDeleteLease.mockResolvedValue({ data: { deleteLease: true } });
      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.deleteMultiple(['lease-1']);
      });

      expect(opResult).toEqual({
        succeeded: 1,
        failed: 0,
        total: 1,
      });
    });

    it('should delete multiple leases', async () => {
      mockDeleteLease.mockResolvedValue({ data: { deleteLease: true } });
      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.deleteMultiple(['lease-1', 'lease-2', 'lease-3', 'lease-4']);
      });

      expect(opResult.succeeded).toBe(4);
      expect(opResult.failed).toBe(0);
    });

    it('should handle partial failures during deletion', async () => {
      mockDeleteLease
        .mockResolvedValueOnce({ data: { deleteLease: true } })
        .mockRejectedValueOnce(new Error('Cannot delete static lease'))
        .mockResolvedValueOnce({ data: { deleteLease: true } });

      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.deleteMultiple(['lease-1', 'lease-2', 'lease-3']);
      });

      expect(opResult.succeeded).toBe(2);
      expect(opResult.failed).toBe(1);
    });

    it('should handle all failures during deletion', async () => {
      mockDeleteLease.mockRejectedValue(new Error('Permission denied'));
      const { result } = renderHook(() => useBulkOperations('router-1'));

      const opResult = await act(async () => {
        return await result.current.deleteMultiple(['lease-1', 'lease-2']);
      });

      expect(opResult.succeeded).toBe(0);
      expect(opResult.failed).toBe(2);
    });
  });

  describe('Loading states', () => {
    it('should track make static loading state', () => {
      (useMakeLeaseStatic as any).mockReturnValue({
        mutateAsync: mockMakeStatic,
        isPending: true,
      });

      const { result } = renderHook(() => useBulkOperations('router-1'));

      expect(result.current.isMakingStatic).toBe(true);
    });

    it('should track delete loading state', () => {
      (useDeleteLease as any).mockReturnValue({
        mutateAsync: mockDeleteLease,
        isPending: true,
      });

      const { result } = renderHook(() => useBulkOperations('router-1'));

      expect(result.current.isDeleting).toBe(true);
    });
  });
});
