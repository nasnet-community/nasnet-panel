/**
 * Unit Tests for useFirewallLogViewer Hook
 *
 * Tests the headless hook logic for firewall log viewing including:
 * - Filter state management with debouncing
 * - Auto-refresh control
 * - Log selection
 * - Sorting
 * - Search with debouncing
 * - CSV export
 *
 * @see NAS-7.9: Implement Firewall Logging
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useFirewallLogs } from '@nasnet/api-client/queries';
import type { FirewallLogEntry } from '@nasnet/core/types';
import { exportLogsToCSV } from '@nasnet/core-utils';

import { useFirewallLogViewer } from './use-firewall-log-viewer';

// Mock the API hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useFirewallLogs: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock the export utility
vi.mock('@nasnet/core-utils', () => ({
  exportLogsToCSV: vi.fn(),
}));

// Mock data
const mockLogs: FirewallLogEntry[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    topic: 'firewall',
    severity: 'info',
    message: 'input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443',
    parsed: {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.100',
      srcPort: 54321,
      dstIp: '10.0.0.1',
      dstPort: 443,
      protocol: 'TCP',
      interfaceIn: 'ether1',
    },
  },
  {
    id: '2',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    topic: 'firewall',
    severity: 'info',
    message: 'forward: in:ether1 out:ether2, proto UDP, 192.168.1.101:12345->8.8.8.8:53',
    parsed: {
      chain: 'forward',
      action: 'accept',
      srcIp: '192.168.1.101',
      srcPort: 12345,
      dstIp: '8.8.8.8',
      dstPort: 53,
      protocol: 'UDP',
      interfaceIn: 'ether1',
      interfaceOut: 'ether2',
    },
  },
  {
    id: '3',
    timestamp: new Date('2024-01-01T10:02:00Z'),
    topic: 'firewall',
    severity: 'info',
    message: 'input: in:ether1, proto TCP, 10.0.0.50:22222->10.0.0.1:22',
    parsed: {
      chain: 'input',
      action: 'reject',
      srcIp: '10.0.0.50',
      srcPort: 22222,
      dstIp: '10.0.0.1',
      dstPort: 22,
      protocol: 'TCP',
      interfaceIn: 'ether1',
      prefix: 'SSH-BLOCK-',
    },
  },
];

describe('useFirewallLogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (useFirewallLogs as any).mockReturnValue({
      data: mockLogs,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.state.isAutoRefreshEnabled).toBe(true);
      expect(result.current.state.refreshInterval).toBe(5000);
      expect(result.current.state.sortBy).toBe('timestamp');
      expect(result.current.state.sortOrder).toBe('desc');
      expect(result.current.state.expandedStats).toBe(false);
      expect(result.current.state.selectedLog).toBeNull();
    });

    it('accepts initial state override', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({
          routerId: 'router-1',
          initialState: {
            isAutoRefreshEnabled: false,
            refreshInterval: 10000,
            sortBy: 'action',
            sortOrder: 'asc',
          },
        })
      );

      expect(result.current.state.isAutoRefreshEnabled).toBe(false);
      expect(result.current.state.refreshInterval).toBe(10000);
      expect(result.current.state.sortBy).toBe('action');
      expect(result.current.state.sortOrder).toBe('asc');
    });

    it('loads logs from API', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.logs).toHaveLength(3);
      expect(result.current.totalCount).toBe(3);
      expect(result.current.visibleCount).toBe(3);
    });
  });

  describe('Filter Management', () => {
    it('updates filters', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setFilters({ action: 'drop' });
      });

      expect(result.current.state.filters.action).toBe('drop');
    });

    it('merges filter updates', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setFilters({ action: 'drop' });
      });

      act(() => {
        result.current.setFilters({ srcIp: '192.168.1.*' });
      });

      expect(result.current.state.filters).toEqual({
        action: 'drop',
        srcIp: '192.168.1.*',
      });
    });

    it('clears all filters', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setFilters({
          action: 'drop',
          srcIp: '192.168.1.*',
        });
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.state.filters).toEqual({});
    });

    it('debounces filter updates', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useFirewallLogViewer({
          routerId: 'router-1',
          debounceDelay: 300,
        })
      );

      // Set filters multiple times rapidly
      act(() => {
        result.current.setFilters({ srcIp: '192' });
      });
      act(() => {
        result.current.setFilters({ srcIp: '192.168' });
      });
      act(() => {
        result.current.setFilters({ srcIp: '192.168.1.*' });
      });

      // Fast-forward timers past debounce
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // State should have final value
      expect(result.current.state.filters.srcIp).toBe('192.168.1.*');

      vi.useRealTimers();
    });
  });

  describe('Auto-Refresh Control', () => {
    it('toggles auto-refresh', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.state.isAutoRefreshEnabled).toBe(true);

      act(() => {
        result.current.toggleAutoRefresh();
      });

      expect(result.current.state.isAutoRefreshEnabled).toBe(false);

      act(() => {
        result.current.toggleAutoRefresh();
      });

      expect(result.current.state.isAutoRefreshEnabled).toBe(true);
    });

    it('sets refresh interval', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setRefreshInterval(10000);
      });

      expect(result.current.state.refreshInterval).toBe(10000);
      expect(result.current.state.isAutoRefreshEnabled).toBe(true);
    });

    it('disables auto-refresh when interval is false', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setRefreshInterval(false);
      });

      expect(result.current.state.refreshInterval).toBe(false);
      expect(result.current.state.isAutoRefreshEnabled).toBe(false);
    });

    it('passes correct refetchInterval to useFirewallLogs', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(useFirewallLogs).toHaveBeenCalledWith(
        'router-1',
        expect.objectContaining({
          refetchInterval: 5000,
        })
      );

      act(() => {
        result.current.setRefreshInterval(3000);
      });

      expect(useFirewallLogs).toHaveBeenLastCalledWith(
        'router-1',
        expect.objectContaining({
          refetchInterval: 3000,
        })
      );
    });

    it('disables polling when auto-refresh is off', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.toggleAutoRefresh();
      });

      expect(useFirewallLogs).toHaveBeenLastCalledWith(
        'router-1',
        expect.objectContaining({
          refetchInterval: false,
        })
      );
    });
  });

  describe('Log Selection', () => {
    it('selects a log', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.selectLog(mockLogs[0]);
      });

      expect(result.current.selectedLog).toBe(mockLogs[0]);
      expect(result.current.state.selectedLog).toBe(mockLogs[0]);
    });

    it('deselects log when passing null', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.selectLog(mockLogs[0]);
      });

      expect(result.current.selectedLog).toBe(mockLogs[0]);

      act(() => {
        result.current.selectLog(null);
      });

      expect(result.current.selectedLog).toBeNull();
    });
  });

  describe('Statistics Panel', () => {
    it('toggles stats panel', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.state.expandedStats).toBe(false);

      act(() => {
        result.current.toggleStats();
      });

      expect(result.current.state.expandedStats).toBe(true);

      act(() => {
        result.current.toggleStats();
      });

      expect(result.current.state.expandedStats).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('sorts logs by timestamp (default)', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      // Default sort is timestamp desc (newest first)
      expect(result.current.logs[0].id).toBe('3');
      expect(result.current.logs[2].id).toBe('1');
    });

    it('sets sort field', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setSortBy('action');
      });

      expect(result.current.state.sortBy).toBe('action');
    });

    it('toggles sort order', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.state.sortOrder).toBe('desc');

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.state.sortOrder).toBe('asc');

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.state.sortOrder).toBe('desc');
    });

    it('sorts logs by action ascending', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setSortBy('action');
        result.current.toggleSortOrder(); // asc
      });

      // accept < drop < reject
      expect(result.current.logs[0].parsed?.action).toBe('accept');
      expect(result.current.logs[1].parsed?.action).toBe('drop');
      expect(result.current.logs[2].parsed?.action).toBe('reject');
    });

    it('sorts logs by srcIp', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setSortBy('srcIp');
        result.current.toggleSortOrder(); // asc
      });

      expect(result.current.logs[0].parsed?.srcIp).toBe('10.0.0.50');
      expect(result.current.logs[2].parsed?.srcIp).toBe('192.168.1.101');
    });
  });

  describe('Search Functionality', () => {
    it('sets search query', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.setSearchQuery('192.168');
      });

      expect(result.current.state.searchQuery).toBe('192.168');
    });

    it('filters logs by search query', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useFirewallLogViewer({
          routerId: 'router-1',
          debounceDelay: 300,
        })
      );

      act(() => {
        result.current.setSearchQuery('192.168');
      });

      // Fast-forward debounce
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Should only show logs with 192.168 in message or IPs
      expect(result.current.logs.length).toBe(2);
      expect(result.current.logs.every(log =>
        log.message.includes('192.168') ||
        log.parsed?.srcIp?.includes('192.168') ||
        log.parsed?.dstIp?.includes('192.168')
      )).toBe(true);

      vi.useRealTimers();
    });

    it('debounces search query updates', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useFirewallLogViewer({
          routerId: 'router-1',
          debounceDelay: 300,
        })
      );

      // Rapidly update search query
      act(() => {
        result.current.setSearchQuery('1');
      });
      act(() => {
        result.current.setSearchQuery('10');
      });
      act(() => {
        result.current.setSearchQuery('10.0');
      });

      // Should still show all logs before debounce
      expect(result.current.logs.length).toBe(3);

      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Should filter after debounce
      expect(result.current.logs.length).toBeLessThan(3);

      vi.useRealTimers();
    });
  });

  describe('CSV Export', () => {
    it('exports logs to CSV', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      act(() => {
        result.current.exportToCSV();
      });

      expect(exportLogsToCSV).toHaveBeenCalledWith(
        expect.arrayContaining(mockLogs),
        'router-1'
      );
    });

    it('exports filtered logs only', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useFirewallLogViewer({
          routerId: 'router-1',
          debounceDelay: 300,
        })
      );

      act(() => {
        result.current.setSearchQuery('192.168');
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      act(() => {
        result.current.exportToCSV();
      });

      // Should only export filtered logs (2 entries with 192.168)
      const call = (exportLogsToCSV as any).mock.calls[0];
      expect(call[0]).toHaveLength(2);
      expect(call[1]).toBe('router-1');

      vi.useRealTimers();
    });
  });

  describe('Loading and Error States', () => {
    it('exposes loading state', () => {
      (useFirewallLogs as any).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('exposes error state', () => {
      const error = new Error('Failed to fetch logs');
      (useFirewallLogs as any).mockReturnValue({
        data: [],
        isLoading: false,
        error,
      });

      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.error).toBe(error);
    });
  });

  describe('Virtualization Support', () => {
    it('provides total and visible counts', () => {
      const { result } = renderHook(() =>
        useFirewallLogViewer({ routerId: 'router-1' })
      );

      expect(result.current.totalCount).toBe(3);
      expect(result.current.visibleCount).toBe(3);
    });

    it('updates visible count after filtering', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useFirewallLogViewer({
          routerId: 'router-1',
          debounceDelay: 300,
        })
      );

      act(() => {
        result.current.setSearchQuery('SSH');
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(result.current.totalCount).toBe(3); // Total unchanged
      expect(result.current.visibleCount).toBe(1); // Only SSH-related logs

      vi.useRealTimers();
    });
  });
});
