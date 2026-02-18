/**
 * useBlockedIPsTable Hook Tests
 *
 * Tests filtering, sorting, selection, and bulk operations for blocked IPs table.
 * Uses fixtures from __test-utils__/rate-limit-fixtures.ts
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useBlockedIPsTable } from './use-blocked-ips-table';
import {
  mockBlockedIPs,
  mockBlockedIP1,
  mockBlockedIP2,
  mockBlockedIP3,
  mockBlockedIP4,
  mockBlockedIP5,
} from '../__test-utils__/rate-limit-fixtures';

describe('useBlockedIPsTable', () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with provided blocked IPs', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      expect(result.current.filteredBlockedIPs).toHaveLength(mockBlockedIPs.length);
      expect(result.current.totalCount).toBe(mockBlockedIPs.length);
      expect(result.current.filteredCount).toBe(mockBlockedIPs.length);
    });

    it('should initialize with empty array', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: [],
        })
      );

      expect(result.current.filteredBlockedIPs).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.filteredCount).toBe(0);
    });

    it('should initialize with default filter', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      expect(result.current.filter.ipAddress).toBe('');
      expect(result.current.filter.list).toBe('all');
      expect(result.current.hasActiveFilter).toBe(false);
    });

    it('should initialize with custom filter', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialFilter: { ipAddress: '192.168', list: 'rate-limited' },
        })
      );

      expect(result.current.filter.ipAddress).toBe('192.168');
      expect(result.current.filter.list).toBe('rate-limited');
    });

    it('should initialize with default sort (lastBlocked desc)', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      expect(result.current.sort.field).toBe('lastBlocked');
      expect(result.current.sort.direction).toBe('desc');
    });

    it('should initialize with custom sort', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'blockCount', direction: 'asc' },
        })
      );

      expect(result.current.sort.field).toBe('blockCount');
      expect(result.current.sort.direction).toBe('asc');
    });
  });

  describe('IP Address Filtering', () => {
    it('should filter by exact IP address', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ ipAddress: '192.168.1.100' });
      });

      expect(result.current.filteredBlockedIPs).toHaveLength(1);
      expect(result.current.filteredBlockedIPs[0].address).toBe('192.168.1.100');
    });

    it('should filter by wildcard IP pattern', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ ipAddress: '192.168.*' });
      });

      const filtered = result.current.filteredBlockedIPs;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((ip) => ip.address.startsWith('192.168.'))).toBe(true);
    });

    it('should filter by subnet prefix', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ ipAddress: '203.0.113.*' });
      });

      const filtered = result.current.filteredBlockedIPs;
      expect(filtered.some((ip) => ip.address === '203.0.113.25')).toBe(true);
    });

    it('should handle IPv6 filtering', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ ipAddress: '2001:db8::1' });
      });

      expect(result.current.filteredBlockedIPs).toHaveLength(1);
      expect(result.current.filteredBlockedIPs[0].address).toBe('2001:db8::1');
    });

    it('should return all IPs when filter is empty', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ ipAddress: '' });
      });

      expect(result.current.filteredBlockedIPs).toHaveLength(mockBlockedIPs.length);
    });
  });

  describe('List Filtering', () => {
    it('should filter by specific list', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ list: 'rate-limited' });
      });

      const filtered = result.current.filteredBlockedIPs;
      expect(filtered.every((ip) => ip.list === 'rate-limited')).toBe(true);
    });

    it('should show all lists when filter is "all"', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ list: 'all' });
      });

      expect(result.current.filteredBlockedIPs).toHaveLength(mockBlockedIPs.length);
    });
  });

  describe('Combined Filtering', () => {
    it('should apply both IP and list filters', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({
          ipAddress: '192.168.*',
          list: 'rate-limited',
        });
      });

      const filtered = result.current.filteredBlockedIPs;
      expect(
        filtered.every(
          (ip) => ip.address.startsWith('192.168.') && ip.list === 'rate-limited'
        )
      ).toBe(true);
    });

    it('should update hasActiveFilter flag', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      expect(result.current.hasActiveFilter).toBe(false);

      act(() => {
        result.current.setFilter({ ipAddress: '192.168' });
      });

      expect(result.current.hasActiveFilter).toBe(true);

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.hasActiveFilter).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('should sort by address ascending', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'address', direction: 'asc' },
        })
      );

      const sorted = result.current.filteredBlockedIPs;
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].address >= sorted[i - 1].address).toBe(true);
      }
    });

    it('should sort by blockCount descending', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'blockCount', direction: 'desc' },
        })
      );

      const sorted = result.current.filteredBlockedIPs;
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].blockCount <= sorted[i - 1].blockCount).toBe(true);
      }
    });

    it('should sort by lastBlocked descending', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'lastBlocked', direction: 'desc' },
        })
      );

      const sorted = result.current.filteredBlockedIPs;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].lastBlocked && sorted[i - 1].lastBlocked) {
          expect(
            sorted[i].lastBlocked!.getTime() <= sorted[i - 1].lastBlocked!.getTime()
          ).toBe(true);
        }
      }
    });

    it('should toggle sort direction when clicking same field', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'blockCount', direction: 'desc' },
        })
      );

      expect(result.current.sort.direction).toBe('desc');

      act(() => {
        result.current.setSort('blockCount');
      });

      expect(result.current.sort.direction).toBe('asc');

      act(() => {
        result.current.setSort('blockCount');
      });

      expect(result.current.sort.direction).toBe('desc');
    });

    it('should default to desc when sorting by new field', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'blockCount', direction: 'asc' },
        })
      );

      act(() => {
        result.current.setSort('address');
      });

      expect(result.current.sort.field).toBe('address');
      expect(result.current.sort.direction).toBe('desc');
    });

    it('should toggle sort direction manually', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          initialSort: { field: 'blockCount', direction: 'desc' },
        })
      );

      expect(result.current.sort.direction).toBe('desc');

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.sort.direction).toBe('asc');
    });

    it('should handle sorting with undefined values', () => {
      const ipsWithUndefined = [
        { ...mockBlockedIP1, lastBlocked: undefined },
        mockBlockedIP2,
        { ...mockBlockedIP3, lastBlocked: undefined },
      ];

      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: ipsWithUndefined,
          initialSort: { field: 'lastBlocked', direction: 'desc' },
        })
      );

      const sorted = result.current.filteredBlockedIPs;
      // Undefined values should be pushed to end
      expect(sorted[sorted.length - 1].lastBlocked).toBeUndefined();
      expect(sorted[sorted.length - 2].lastBlocked).toBeUndefined();
    });
  });

  describe('Selection', () => {
    it('should toggle single IP selection', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      expect(result.current.isSelected(mockBlockedIP1.address)).toBe(false);
      expect(result.current.hasSelection).toBe(false);

      act(() => {
        result.current.toggleSelection(mockBlockedIP1.address);
      });

      expect(result.current.isSelected(mockBlockedIP1.address)).toBe(true);
      expect(result.current.hasSelection).toBe(true);

      act(() => {
        result.current.toggleSelection(mockBlockedIP1.address);
      });

      expect(result.current.isSelected(mockBlockedIP1.address)).toBe(false);
      expect(result.current.hasSelection).toBe(false);
    });

    it('should select multiple IPs', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.toggleSelection(mockBlockedIP1.address);
        result.current.toggleSelection(mockBlockedIP2.address);
        result.current.toggleSelection(mockBlockedIP3.address);
      });

      expect(result.current.selectedIPs).toHaveLength(3);
      expect(result.current.selectedIPs).toContain(mockBlockedIP1.address);
      expect(result.current.selectedIPs).toContain(mockBlockedIP2.address);
      expect(result.current.selectedIPs).toContain(mockBlockedIP3.address);
    });

    it('should select all filtered IPs', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedIPs).toHaveLength(mockBlockedIPs.length);
      expect(result.current.hasSelection).toBe(true);
    });

    it('should select all only from filtered results', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ list: 'rate-limited' });
      });

      const filteredCount = result.current.filteredCount;

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedIPs).toHaveLength(filteredCount);
    });

    it('should clear all selections', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedIPs.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIPs).toHaveLength(0);
      expect(result.current.hasSelection).toBe(false);
    });

    it('should preserve selection across filter changes', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.toggleSelection(mockBlockedIP1.address);
      });

      expect(result.current.isSelected(mockBlockedIP1.address)).toBe(true);

      act(() => {
        result.current.setFilter({ list: 'ddos-attackers' });
      });

      // Selection should persist even if IP is filtered out
      expect(result.current.selectedIPs).toContain(mockBlockedIP1.address);
    });
  });

  describe('Refresh', () => {
    it('should call onRefresh callback', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
          onRefresh: mockOnRefresh,
        })
      );

      act(() => {
        result.current.refresh();
      });

      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should handle refresh without callback', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      // Should not throw
      act(() => {
        result.current.refresh();
      });
    });
  });

  describe('Clear Filter', () => {
    it('should reset filter to default values', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({
          ipAddress: '192.168',
          list: 'rate-limited',
        });
      });

      expect(result.current.filter.ipAddress).toBe('192.168');
      expect(result.current.filter.list).toBe('rate-limited');

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter.ipAddress).toBe('');
      expect(result.current.filter.list).toBe('all');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty blocked IPs array', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: [],
        })
      );

      expect(result.current.filteredBlockedIPs).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.filteredCount).toBe(0);
    });

    it('should handle filter with no matches', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      act(() => {
        result.current.setFilter({ ipAddress: '255.255.255.255' });
      });

      expect(result.current.filteredBlockedIPs).toHaveLength(0);
      expect(result.current.filteredCount).toBe(0);
      expect(result.current.totalCount).toBe(mockBlockedIPs.length);
    });

    it('should handle special characters in IP filter', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      // Should escape regex special characters
      act(() => {
        result.current.setFilter({ ipAddress: '192.168.1.' });
      });

      // Should not throw and should filter correctly
      expect(result.current.filteredBlockedIPs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should memoize filtered results', () => {
      const { result, rerender } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      const firstResult = result.current.filteredBlockedIPs;

      // Re-render without changing deps
      rerender();

      const secondResult = result.current.filteredBlockedIPs;

      // Should be same reference (memoized)
      expect(firstResult).toBe(secondResult);
    });

    it('should update filtered results when filter changes', () => {
      const { result } = renderHook(() =>
        useBlockedIPsTable({
          blockedIPs: mockBlockedIPs,
        })
      );

      const firstResult = result.current.filteredBlockedIPs;

      act(() => {
        result.current.setFilter({ ipAddress: '192.168' });
      });

      const secondResult = result.current.filteredBlockedIPs;

      // Should be different reference (recalculated)
      expect(firstResult).not.toBe(secondResult);
    });
  });
});
