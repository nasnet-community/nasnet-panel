/**
 * useRawRuleTable Hook Tests
 *
 * Tests for RAW rule table state management hook.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRawRuleTable } from './use-raw-rule-table';
import type { RawRule } from '@nasnet/core/types';

describe('useRawRuleTable', () => {
  let mockRules: RawRule[];

  beforeEach(() => {
    mockRules = [
      {
        id: '1',
        chain: 'prerouting',
        action: 'drop',
        order: 0,
        protocol: 'tcp',
        srcAddress: '10.0.0.0/8',
        dstPort: '22',
        comment: 'Drop bogon SSH',
        disabled: false,
        packets: 100,
        bytes: 5000,
      },
      {
        id: '2',
        chain: 'prerouting',
        action: 'notrack',
        order: 1,
        protocol: 'udp',
        srcAddress: '192.168.1.0/24',
        dstPort: '53',
        comment: 'Skip DNS tracking',
        disabled: false,
        packets: 500,
        bytes: 25000,
      },
      {
        id: '3',
        chain: 'output',
        action: 'accept',
        order: 2,
        protocol: 'tcp',
        dstAddress: '8.8.8.8',
        comment: 'Allow to Google DNS',
        disabled: true,
        packets: 0,
        bytes: 0,
      },
    ];
  });

  describe('Initialization', () => {
    it('initializes with provided data', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      expect(result.current.data).toHaveLength(3);
      expect(result.current.totalCount).toBe(3);
      expect(result.current.filteredCount).toBe(3);
    });

    it('initializes with default sort', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      expect(result.current.sortBy).toBe('order');
      expect(result.current.sortDirection).toBe('asc');
    });

    it('initializes with custom sort', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({
          data: mockRules,
          initialSortBy: 'chain',
          initialSortDirection: 'desc',
        })
      );

      expect(result.current.sortBy).toBe('chain');
      expect(result.current.sortDirection).toBe('desc');
    });

    it('initializes with default filters', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      expect(result.current.filters.action).toBe('all');
      expect(result.current.filters.protocol).toBe('all');
      expect(result.current.filters.status).toBe('all');
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('sorts by order ascending by default', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      expect(result.current.data[0].id).toBe('1'); // order: 0
      expect(result.current.data[1].id).toBe('2'); // order: 1
      expect(result.current.data[2].id).toBe('3'); // order: 2
    });

    it('sorts by chain', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({
          data: mockRules,
          initialSortBy: 'chain',
        })
      );

      // output comes before prerouting alphabetically
      expect(result.current.data[0].chain).toBe('output');
      expect(result.current.data[1].chain).toBe('prerouting');
      expect(result.current.data[2].chain).toBe('prerouting');
    });

    it('toggles sort direction', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.toggleSort('order');
      });

      // Should be descending now
      expect(result.current.sortDirection).toBe('desc');
      expect(result.current.data[0].id).toBe('3'); // order: 2
    });

    it('sorts by packets count', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({
          data: mockRules,
          initialSortBy: 'packets',
          initialSortDirection: 'desc',
        })
      );

      expect(result.current.data[0].packets).toBe(500); // id: 2
      expect(result.current.data[1].packets).toBe(100); // id: 1
      expect(result.current.data[2].packets).toBe(0);   // id: 3
    });
  });

  describe('Filtering', () => {
    it('filters by action', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ action: 'drop' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].action).toBe('drop');
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('filters by protocol', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ protocol: 'tcp' });
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data.every(r => r.protocol === 'tcp')).toBe(true);
    });

    it('filters by status (enabled)', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ status: 'enabled' });
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data.every(r => r.disabled === false)).toBe(true);
    });

    it('filters by status (disabled)', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ status: 'disabled' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].disabled).toBe(true);
    });

    it('filters by chain', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ chain: 'output' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].chain).toBe('output');
    });

    it('filters by search term (comment)', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ searchTerm: 'DNS' });
      });

      expect(result.current.data).toHaveLength(2); // "DNS tracking" and "Google DNS"
    });

    it('filters by search term (address)', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ searchTerm: '192.168' });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].srcAddress).toContain('192.168');
    });

    it('combines multiple filters', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({
          chain: 'prerouting',
          protocol: 'tcp',
        });
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('1');
    });

    it('clears all filters', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ action: 'drop', protocol: 'tcp' });
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('Selection', () => {
    it('initializes with no selection', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules, enableSelection: true })
      );

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.hasSelection).toBe(false);
    });

    it('toggles single selection', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules, enableSelection: true })
      );

      act(() => {
        result.current.toggleSelection('1');
      });

      expect(result.current.selectedIds.has('1')).toBe(true);
      expect(result.current.isSelected('1')).toBe(true);
      expect(result.current.hasSelection).toBe(true);
    });

    it('deselects when toggling selected item', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules, enableSelection: true })
      );

      act(() => {
        result.current.toggleSelection('1');
      });

      expect(result.current.selectedIds.has('1')).toBe(true);

      act(() => {
        result.current.toggleSelection('1');
      });

      expect(result.current.selectedIds.has('1')).toBe(false);
    });

    it('selects all items', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules, enableSelection: true })
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedIds.size).toBe(3);
      expect(result.current.isSelected('1')).toBe(true);
      expect(result.current.isSelected('2')).toBe(true);
      expect(result.current.isSelected('3')).toBe(true);
    });

    it('clears all selections', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules, enableSelection: true })
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedIds.size).toBe(3);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.hasSelection).toBe(false);
    });
  });

  describe('Drag and Drop', () => {
    it('initializes drag state as false', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      expect(result.current.isDragging).toBe(false);
      expect(result.current.draggedItemId).toBe(null);
    });

    it('sets dragging state', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setIsDragging(true);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('sets dragged item ID', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setDraggedItemId('1');
      });

      expect(result.current.draggedItemId).toBe('1');
    });
  });

  describe('Counts', () => {
    it('provides correct total count', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      expect(result.current.totalCount).toBe(3);
    });

    it('provides correct filtered count', () => {
      const { result } = renderHook(() =>
        useRawRuleTable({ data: mockRules })
      );

      act(() => {
        result.current.setFilters({ action: 'drop' });
      });

      expect(result.current.totalCount).toBe(3);
      expect(result.current.filteredCount).toBe(1);
    });
  });
});
