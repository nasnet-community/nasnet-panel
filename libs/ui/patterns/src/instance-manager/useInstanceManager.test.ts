/**
 * useInstanceManager Hook Tests
 *
 * Unit tests for the headless InstanceManager hook.
 * Tests filtering, sorting, bulk operations, and selection logic.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useInstanceManager } from './useInstanceManager';

import type { InstanceManagerProps } from './types';
import type { Service } from '../service-card/types';

describe('useInstanceManager', () => {
  const mockInstances: Service[] = [
    {
      id: '1',
      name: 'Tor Proxy',
      category: 'privacy',
      status: 'running',
      description: 'Privacy proxy',
      metrics: { cpu: 5.2, memory: 128 },
    },
    {
      id: '2',
      name: 'Sing-Box',
      category: 'proxy',
      status: 'stopped',
      description: 'Universal proxy',
      metrics: { cpu: 0, memory: 64 },
    },
    {
      id: '3',
      name: 'AdGuard Home',
      category: 'dns',
      status: 'running',
      description: 'DNS blocker',
      metrics: { cpu: 3.5, memory: 96 },
    },
    {
      id: '4',
      name: 'MTProxy',
      category: 'proxy',
      status: 'failed',
      description: 'Telegram proxy',
    },
  ];

  const defaultProps: InstanceManagerProps = {
    instances: mockInstances,
    selectedIds: [],
    onSelectionChange: vi.fn(),
    onInstanceClick: vi.fn(),
    onBulkOperation: vi.fn(),
    filters: {
      search: '',
      category: 'all',
      status: 'all',
    },
    onFiltersChange: vi.fn(),
    sort: {
      field: 'name',
      direction: 'asc',
    },
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filtering', () => {
    it('should return all instances when no filters are active', () => {
      const { result } = renderHook(() => useInstanceManager(defaultProps));

      expect(result.current.filteredInstances).toHaveLength(4);
    });

    it('should filter by search query (case-insensitive)', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: 'tor', category: 'all', status: 'all' },
        })
      );

      expect(result.current.filteredInstances).toHaveLength(1);
      expect(result.current.filteredInstances[0].name).toBe('Tor Proxy');
    });

    it('should filter by category', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: '', category: 'proxy', status: 'all' },
        })
      );

      expect(result.current.filteredInstances).toHaveLength(2);
      expect(result.current.filteredInstances.map((i) => i.category)).toEqual([
        'proxy',
        'proxy',
      ]);
    });

    it('should filter by status', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: '', category: 'all', status: 'running' },
        })
      );

      expect(result.current.filteredInstances).toHaveLength(2);
      expect(result.current.filteredInstances.map((i) => i.status)).toEqual([
        'running',
        'running',
      ]);
    });

    it('should apply multiple filters simultaneously', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: 'proxy', category: 'proxy', status: 'stopped' },
        })
      );

      expect(result.current.filteredInstances).toHaveLength(1);
      expect(result.current.filteredInstances[0].name).toBe('Sing-Box');
    });

    it('should update hasActiveFilters correctly', () => {
      const { result: noFilters } = renderHook(() =>
        useInstanceManager(defaultProps)
      );
      expect(noFilters.current.hasActiveFilters).toBe(false);

      const { result: withSearch } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: 'tor', category: 'all', status: 'all' },
        })
      );
      expect(withSearch.current.hasActiveFilters).toBe(true);

      const { result: withCategory } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: '', category: 'proxy', status: 'all' },
        })
      );
      expect(withCategory.current.hasActiveFilters).toBe(true);
    });
  });

  describe('sorting', () => {
    it('should sort by name ascending', () => {
      const { result } = renderHook(() => useInstanceManager(defaultProps));

      const names = result.current.filteredInstances.map((i) => i.name);
      expect(names).toEqual(['AdGuard Home', 'MTProxy', 'Sing-Box', 'Tor Proxy']);
    });

    it('should sort by name descending', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          sort: { field: 'name', direction: 'desc' },
        })
      );

      const names = result.current.filteredInstances.map((i) => i.name);
      expect(names).toEqual(['Tor Proxy', 'Sing-Box', 'MTProxy', 'AdGuard Home']);
    });

    it('should sort by status', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          sort: { field: 'status', direction: 'asc' },
        })
      );

      const statuses = result.current.filteredInstances.map((i) => i.status);
      expect(statuses).toEqual(['failed', 'running', 'running', 'stopped']);
    });

    it('should sort by category', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          sort: { field: 'category', direction: 'asc' },
        })
      );

      const categories = result.current.filteredInstances.map((i) => i.category);
      expect(categories).toEqual(['dns', 'privacy', 'proxy', 'proxy']);
    });

    it('should sort by CPU usage', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          sort: { field: 'cpu', direction: 'desc' },
        })
      );

      const cpuValues = result.current.filteredInstances.map(
        (i) => i.metrics?.cpu || 0
      );
      expect(cpuValues).toEqual([5.2, 3.5, 0, 0]);
    });

    it('should sort by memory usage', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          sort: { field: 'memory', direction: 'asc' },
        })
      );

      const memoryValues = result.current.filteredInstances.map(
        (i) => i.metrics?.memory || 0
      );
      expect(memoryValues).toEqual([0, 64, 96, 128]);
    });
  });

  describe('selection', () => {
    it('should track selected count', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2'],
        })
      );

      expect(result.current.selectedCount).toBe(2);
    });

    it('should determine allSelected correctly', () => {
      const { result: allSelected } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2', '3', '4'],
        })
      );
      expect(allSelected.current.allSelected).toBe(true);

      const { result: someSelected } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2'],
        })
      );
      expect(someSelected.current.allSelected).toBe(false);
    });

    it('should determine someSelected correctly', () => {
      const { result: someSelected } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2'],
        })
      );
      expect(someSelected.current.someSelected).toBe(true);
      expect(someSelected.current.allSelected).toBe(false);

      const { result: allSelected } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2', '3', '4'],
        })
      );
      expect(allSelected.current.someSelected).toBe(false);
      expect(allSelected.current.allSelected).toBe(true);
    });

    it('should handle select all correctly', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          onSelectionChange,
        })
      );

      act(() => {
        result.current.handleSelectAll();
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2', '3', '4']);
    });

    it('should clear selection when all are already selected', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2', '3', '4'],
          onSelectionChange,
        })
      );

      act(() => {
        result.current.handleSelectAll();
      });

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should toggle individual selection', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1'],
          onSelectionChange,
        })
      );

      // Add to selection
      act(() => {
        result.current.handleToggleSelection('2');
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);

      // Remove from selection
      act(() => {
        result.current.handleToggleSelection('1');
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['2']);
    });

    it('should clear selection', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2'],
          onSelectionChange,
        })
      );

      act(() => {
        result.current.handleClearSelection();
      });

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('bulk operations', () => {
    it('should provide start action when all selected are stopped', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['2'], // Sing-Box is stopped
        })
      );

      const startAction = result.current.availableBulkActions.find(
        (a) => a.operation === 'start'
      );
      expect(startAction).toBeDefined();
      expect(startAction?.label).toBe('Start (1)');
    });

    it('should provide stop action when all selected are running', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '3'], // Tor and AdGuard are running
        })
      );

      const stopAction = result.current.availableBulkActions.find(
        (a) => a.operation === 'stop'
      );
      expect(stopAction).toBeDefined();
      expect(stopAction?.label).toBe('Stop (2)');
    });

    it('should provide restart action when any selected are running', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2'], // Tor running, Sing-Box stopped
        })
      );

      const restartAction = result.current.availableBulkActions.find(
        (a) => a.operation === 'restart'
      );
      expect(restartAction).toBeDefined();
    });

    it('should always provide delete action', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2', '3'],
        })
      );

      const deleteAction = result.current.availableBulkActions.find(
        (a) => a.operation === 'delete'
      );
      expect(deleteAction).toBeDefined();
      expect(deleteAction?.label).toBe('Delete (3)');
      expect(deleteAction?.variant).toBe('destructive');
      expect(deleteAction?.requiresConfirmation).toBe(true);
    });

    it('should not provide bulk actions when nothing is selected', () => {
      const { result } = renderHook(() => useInstanceManager(defaultProps));

      expect(result.current.availableBulkActions).toHaveLength(0);
      expect(result.current.canPerformBulkOperation).toBe(false);
    });

    it('should call onBulkOperation with correct parameters', () => {
      const onBulkOperation = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          selectedIds: ['1', '2'],
          onBulkOperation,
        })
      );

      act(() => {
        result.current.handleBulkOperation('stop');
      });

      expect(onBulkOperation).toHaveBeenCalledWith('stop', ['1', '2']);
    });
  });

  describe('counts', () => {
    it('should track total count', () => {
      const { result } = renderHook(() => useInstanceManager(defaultProps));

      expect(result.current.totalCount).toBe(4);
    });

    it('should track filtered count', () => {
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: 'proxy', category: 'all', status: 'all' },
        })
      );

      expect(result.current.filteredCount).toBe(3);
      expect(result.current.totalCount).toBe(4);
    });
  });

  describe('event handlers', () => {
    it('should call onInstanceClick when handleInstanceClick is invoked', () => {
      const onInstanceClick = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          onInstanceClick,
        })
      );

      act(() => {
        result.current.handleInstanceClick(mockInstances[0]);
      });

      expect(onInstanceClick).toHaveBeenCalledWith(mockInstances[0]);
    });

    it('should call onFiltersChange when handleFilterChange is invoked', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.handleFilterChange({ search: 'tor' });
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        search: 'tor',
        category: 'all',
        status: 'all',
      });
    });

    it('should call onSortChange when handleSortChange is invoked', () => {
      const onSortChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          onSortChange,
        })
      );

      act(() => {
        result.current.handleSortChange('cpu');
      });

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'cpu',
        direction: 'asc',
      });
    });

    it('should toggle sort direction when same field is clicked', () => {
      const onSortChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          sort: { field: 'name', direction: 'asc' },
          onSortChange,
        })
      );

      act(() => {
        result.current.handleSortChange('name');
      });

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'name',
        direction: 'desc',
      });
    });

    it('should clear all filters when handleClearFilters is invoked', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useInstanceManager({
          ...defaultProps,
          filters: { search: 'test', category: 'proxy', status: 'running' },
          onFiltersChange,
        })
      );

      act(() => {
        result.current.handleClearFilters();
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        search: '',
        category: 'all',
        status: 'all',
      });
    });

    it('should maintain stable references for event handlers', () => {
      const { result, rerender } = renderHook(() =>
        useInstanceManager(defaultProps)
      );

      const firstHandleClick = result.current.handleInstanceClick;

      rerender();

      expect(result.current.handleInstanceClick).toBe(firstHandleClick);
    });
  });
});
