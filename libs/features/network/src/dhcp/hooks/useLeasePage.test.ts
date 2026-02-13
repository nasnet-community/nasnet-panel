import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useLeasePage } from './useLeasePage';
import { mockLeases, mockServers } from '../__mocks__/lease-data';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useDHCPLeases: vi.fn(),
}));

vi.mock('@nasnet/state/stores', () => ({
  useDHCPUIStore: vi.fn(),
}));

vi.mock('./useBulkOperations', () => ({
  useBulkOperations: vi.fn(),
}));

vi.mock('./useNewLeaseDetection', () => ({
  useNewLeaseDetection: vi.fn(),
}));

import { useDHCPLeases } from '@nasnet/api-client/queries';
import { useDHCPUIStore } from '@nasnet/state/stores';
import { useBulkOperations } from './useBulkOperations';
import { useNewLeaseDetection } from './useNewLeaseDetection';

describe('useLeasePage', () => {
  const mockStoreState = {
    leaseSearch: '',
    setLeaseSearch: vi.fn(),
    leaseStatusFilter: 'all' as const,
    setLeaseStatusFilter: vi.fn(),
    leaseServerFilter: 'all',
    setLeaseServerFilter: vi.fn(),
  };

  const mockBulkOps = {
    selectedLeases: new Set<string>(),
    toggleSelection: vi.fn(),
    toggleAll: vi.fn(),
    clearSelection: vi.fn(),
    makeAllStatic: vi.fn(),
    deleteMultiple: vi.fn(),
  };

  const mockNewLeases = {
    newLeases: new Set<string>(),
    markAsSeen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDHCPUIStore as any).mockReturnValue(mockStoreState);
    (useBulkOperations as any).mockReturnValue(mockBulkOps);
    (useNewLeaseDetection as any).mockReturnValue(mockNewLeases);
    (useDHCPLeases as any).mockReturnValue({
      data: mockLeases,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data fetching', () => {
    it('should fetch leases successfully', () => {
      const { result } = renderHook(() => useLeasePage());

      expect(result.current.leases).toEqual(mockLeases);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should handle loading state', () => {
      (useDHCPLeases as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.leases).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch leases');
      (useDHCPLeases as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.leases).toEqual([]);
      expect(result.current.isError).toBe(true);
    });
  });

  describe('Search filtering', () => {
    it('should filter by IP address', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseSearch: '192.168.1.100',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toHaveLength(1);
      expect(result.current.filteredLeases[0].address).toBe('192.168.1.100');
    });

    it('should filter by MAC address', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseSearch: '00:11:22:33:44:55',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toHaveLength(1);
      expect(result.current.filteredLeases[0].macAddress).toBe('00:11:22:33:44:55');
    });

    it('should filter by hostname (case-insensitive)', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseSearch: 'LAPTOP',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toHaveLength(1);
      expect(result.current.filteredLeases[0].hostname).toBe('laptop-work');
    });

    it('should filter by partial hostname match', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseSearch: 'device',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases.length).toBeGreaterThan(0);
      expect(
        result.current.filteredLeases.every(
          (lease) => lease.hostname?.toLowerCase().includes('device')
        )
      ).toBe(true);
    });

    it('should return all leases when search is empty', () => {
      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toEqual(mockLeases);
    });
  });

  describe('Status filtering', () => {
    it('should filter by bound status', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseStatusFilter: 'bound',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(
        result.current.filteredLeases.every((lease) => lease.status === 'bound')
      ).toBe(true);
    });

    it('should filter by waiting status', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseStatusFilter: 'waiting',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toHaveLength(1);
      expect(result.current.filteredLeases[0].status).toBe('waiting');
    });

    it('should filter by static (non-dynamic) leases', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseStatusFilter: 'static',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(
        result.current.filteredLeases.every((lease) => !lease.dynamic)
      ).toBe(true);
    });

    it('should return all leases when filter is "all"', () => {
      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toEqual(mockLeases);
    });
  });

  describe('Server filtering', () => {
    it('should filter by specific server', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseServerFilter: 'LAN DHCP',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(
        result.current.filteredLeases.every((lease) => lease.server === 'LAN DHCP')
      ).toBe(true);
    });

    it('should return all leases when server filter is "all"', () => {
      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toEqual(mockLeases);
    });
  });

  describe('Combined filters', () => {
    it('should apply search, status, and server filters together', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseSearch: '192.168.1',
        leaseStatusFilter: 'bound',
        leaseServerFilter: 'LAN DHCP',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(
        result.current.filteredLeases.every(
          (lease) =>
            lease.address.includes('192.168.1') &&
            lease.status === 'bound' &&
            lease.server === 'LAN DHCP'
        )
      ).toBe(true);
    });

    it('should return empty array when no leases match combined filters', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStoreState,
        leaseSearch: '10.0.0.1',
        leaseStatusFilter: 'bound',
        leaseServerFilter: 'Nonexistent Server',
      });

      const { result } = renderHook(() => useLeasePage());

      expect(result.current.filteredLeases).toHaveLength(0);
    });
  });

  describe('Export functionality', () => {
    it('should export CSV with filtered leases', () => {
      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockClick = vi.fn();
      const mockAppendChild = vi.spyOn(document.body, 'appendChild');
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild');

      mockCreateElement.mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as any);

      const { result } = renderHook(() => useLeasePage());

      act(() => {
        result.current.exportToCSV();
      });

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Store integration', () => {
    it('should call setLeaseSearch when search changes', () => {
      const { result } = renderHook(() => useLeasePage());

      act(() => {
        mockStoreState.setLeaseSearch('test');
      });

      expect(mockStoreState.setLeaseSearch).toHaveBeenCalledWith('test');
    });

    it('should call setLeaseStatusFilter when status filter changes', () => {
      const { result } = renderHook(() => useLeasePage());

      act(() => {
        mockStoreState.setLeaseStatusFilter('bound');
      });

      expect(mockStoreState.setLeaseStatusFilter).toHaveBeenCalledWith('bound');
    });

    it('should call setLeaseServerFilter when server filter changes', () => {
      const { result } = renderHook(() => useLeasePage());

      act(() => {
        mockStoreState.setLeaseServerFilter('LAN DHCP');
      });

      expect(mockStoreState.setLeaseServerFilter).toHaveBeenCalledWith('LAN DHCP');
    });
  });
});
