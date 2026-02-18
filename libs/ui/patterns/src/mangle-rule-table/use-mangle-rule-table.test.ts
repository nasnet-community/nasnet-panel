/**
 * useMangleRuleTable Hook Tests
 *
 * Tests for mangle rule table state management including:
 * - Sorting by position, action, newConnectionMark, packets, bytes
 * - Sort direction toggle
 * - Filter by action, protocol, enabled/disabled, mark name
 * - Drag-drop reorder state management
 * - Column definitions
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import type { MangleRule } from '@nasnet/core/types';

import { useMangleRuleTable } from './use-mangle-rule-table';


const mockRules: MangleRule[] = [
  {
    id: '*1',
    chain: 'prerouting',
    action: 'mark-connection',
    position: 0,
    newConnectionMark: 'web_traffic',
    protocol: 'tcp',
    dstPort: '80,443',
    disabled: false,
    log: false,
    passthrough: true,
    packets: 1000,
    bytes: 500000,
  },
  {
    id: '*2',
    chain: 'forward',
    action: 'mark-packet',
    position: 1,
    newPacketMark: 'voip_packets',
    protocol: 'udp',
    dstPort: '5060',
    disabled: false,
    log: false,
    passthrough: true,
    packets: 500,
    bytes: 250000,
  },
  {
    id: '*3',
    chain: 'prerouting',
    action: 'change-dscp',
    position: 2,
    newDscp: 46,
    protocol: 'tcp',
    disabled: true,
    log: false,
    passthrough: true,
    packets: 0,
    bytes: 0,
  },
];

describe('useMangleRuleTable', () => {
  describe('Initialization', () => {
    it('initializes with provided data', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.data).toHaveLength(3);
      expect(result.current.totalCount).toBe(3);
      expect(result.current.filteredCount).toBe(3);
    });

    it('initializes with default sort (position asc)', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.sortBy).toBe('position');
      expect(result.current.sortDirection).toBe('asc');
    });

    it('initializes with custom sort configuration', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({
          data: mockRules,
          initialSortBy: 'packets',
          initialSortDirection: 'desc',
        })
      );

      expect(result.current.sortBy).toBe('packets');
      expect(result.current.sortDirection).toBe('desc');
    });
  });

  describe('Sorting', () => {
    it('sorts by position ascending', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.data[0].position).toBe(0);
      expect(result.current.data[1].position).toBe(1);
      expect(result.current.data[2].position).toBe(2);
    });

    it('sorts by action alphabetically', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({
          data: mockRules,
          initialSortBy: 'action',
        })
      );

      expect(result.current.data[0].action).toBe('change-dscp');
      expect(result.current.data[1].action).toBe('mark-connection');
      expect(result.current.data[2].action).toBe('mark-packet');
    });

    it('sorts by packets descending', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({
          data: mockRules,
          initialSortBy: 'packets',
          initialSortDirection: 'desc',
        })
      );

      expect(result.current.data[0].packets).toBe(1000);
      expect(result.current.data[1].packets).toBe(500);
      expect(result.current.data[2].packets).toBe(0);
    });

    it('sorts by bytes descending', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({
          data: mockRules,
          initialSortBy: 'bytes',
          initialSortDirection: 'desc',
        })
      );

      expect(result.current.data[0].bytes).toBe(500000);
      expect(result.current.data[1].bytes).toBe(250000);
      expect(result.current.data[2].bytes).toBe(0);
    });

    it('toggles sort direction when clicking same column', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({
          data: mockRules,
          initialSortBy: 'position',
        })
      );

      expect(result.current.sortDirection).toBe('asc');

      act(() => {
        result.current.setSortBy('position');
      });

      expect(result.current.sortDirection).toBe('desc');
    });

    it('resets to ascending when clicking different column', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({
          data: mockRules,
          initialSortBy: 'position',
          initialSortDirection: 'desc',
        })
      );

      act(() => {
        result.current.setSortBy('action');
      });

      expect(result.current.sortBy).toBe('action');
      expect(result.current.sortDirection).toBe('asc');
    });
  });

  describe('Filtering', () => {
    it('filters by action', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ action: 'mark-connection' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].action).toBe('mark-connection');
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('filters by protocol', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ protocol: 'tcp' });
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data.every(r => r.protocol === 'tcp')).toBe(true);
    });

    it('filters by status (enabled)', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ status: 'enabled' });
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data.every(r => !r.disabled)).toBe(true);
    });

    it('filters by status (disabled)', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ status: 'disabled' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].disabled).toBe(true);
    });

    it('filters by mark name (case-insensitive search)', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ markName: 'VOIP' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].newPacketMark).toBe('voip_packets');
    });

    it('filters by chain', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ chain: 'prerouting' });
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data.every(r => r.chain === 'prerouting')).toBe(true);
    });

    it('combines multiple filters', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({
          chain: 'prerouting',
          protocol: 'tcp',
        });
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('clears all filters', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({
          action: 'mark-connection',
          protocol: 'tcp',
        });
      });

      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.data).toHaveLength(1);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.data).toHaveLength(3);
    });
  });

  describe('Drag-Drop State', () => {
    it('manages isDragging state', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.setIsDragging(true);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('manages draggedItemId state', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.draggedItemId).toBeNull();

      act(() => {
        result.current.setDraggedItemId('*1');
      });

      expect(result.current.draggedItemId).toBe('*1');
    });

    it('calls reorder with correct indices', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      // reorder logs to console - just verify it doesn't throw
      expect(() => {
        act(() => {
          result.current.reorder(0, 2);
        });
      }).not.toThrow();
    });
  });

  describe('Column Definitions', () => {
    it('provides column definitions', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.columns).toBeDefined();
      expect(result.current.columns.length).toBeGreaterThan(0);
    });

    it('includes position column', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      const positionCol = result.current.columns.find(c => c.id === 'position');
      expect(positionCol).toBeDefined();
      expect(positionCol?.sortable).toBe(true);
    });

    it('includes action column', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      const actionCol = result.current.columns.find(c => c.id === 'action');
      expect(actionCol).toBeDefined();
      expect(actionCol?.sortable).toBe(true);
    });

    it('includes packets and bytes columns', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      const packetsCol = result.current.columns.find(c => c.id === 'packets');
      const bytesCol = result.current.columns.find(c => c.id === 'bytes');

      expect(packetsCol).toBeDefined();
      expect(bytesCol).toBeDefined();
      expect(packetsCol?.sortable).toBe(true);
      expect(bytesCol?.sortable).toBe(true);
    });
  });

  describe('Counts', () => {
    it('tracks total count', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.totalCount).toBe(3);
    });

    it('tracks filtered count', () => {
      const { result } = renderHook(() =>
        useMangleRuleTable({ data: mockRules })
      );

      expect(result.current.filteredCount).toBe(3);

      act(() => {
        result.current.setFilters({ action: 'mark-connection' });
      });

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.totalCount).toBe(3); // Total unchanged
    });
  });
});
