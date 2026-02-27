/**
 * Unit Tests for useFirewallLogFilters Hook
 *
 * Tests the headless hook logic for firewall log filtering including:
 * - Filter state management
 * - Time range preset conversion
 * - Action toggling
 * - IP wildcard validation
 * - Port range validation
 * - Active filter counting
 * - Clear filters functionality
 *
 * @see NAS-7.9: Implement Firewall Logging
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useFirewallLogFilters } from './use-firewall-log-filters';

import type { FirewallLogFilterState } from './firewall-log-filters.types';

describe('useFirewallLogFilters', () => {
  const defaultFilters: FirewallLogFilterState = {
    timeRangePreset: '1h',
    actions: [],
  };

  describe('Initialization', () => {
    it('initializes with provided filters', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      expect(result.current.filters.timeRangePreset).toBe('1h');
      expect(result.current.filters.actions).toEqual([]);
      expect(result.current.activeFilterCount).toBe(0);
    });

    it('computes time range from preset', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: { ...defaultFilters, timeRangePreset: '1h' },
          onFiltersChange,
        })
      );

      const { computedTimeRange } = result.current;
      const hourDiff =
        (computedTimeRange.end.getTime() - computedTimeRange.start.getTime()) / (1000 * 60 * 60);

      expect(hourDiff).toBeCloseTo(1, 0);
    });
  });

  describe('Time Range Management', () => {
    it('updates time range preset', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setTimeRangePreset('6h');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        timeRangePreset: '6h',
        timeRange: undefined,
      });
    });

    it('computes correct time range for different presets', () => {
      const onFiltersChange = vi.fn();

      // Test 6h preset
      const { result: result6h } = renderHook(() =>
        useFirewallLogFilters({
          filters: { ...defaultFilters, timeRangePreset: '6h' },
          onFiltersChange,
        })
      );
      const hourDiff6h =
        (result6h.current.computedTimeRange.end.getTime() -
          result6h.current.computedTimeRange.start.getTime()) /
        (1000 * 60 * 60);
      expect(hourDiff6h).toBeCloseTo(6, 0);

      // Test 1d preset
      const { result: result1d } = renderHook(() =>
        useFirewallLogFilters({
          filters: { ...defaultFilters, timeRangePreset: '1d' },
          onFiltersChange,
        })
      );
      const dayDiff =
        (result1d.current.computedTimeRange.end.getTime() -
          result1d.current.computedTimeRange.start.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(dayDiff).toBeCloseTo(1, 0);
    });

    it('sets custom time range', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      const customRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-02'),
      };

      act(() => {
        result.current.setCustomTimeRange(customRange);
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        timeRangePreset: 'custom',
        timeRange: customRange,
      });
    });
  });

  describe('Action Filters', () => {
    it('toggles action on', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.toggleAction('drop');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        actions: ['drop'],
      });
    });

    it('toggles action off', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: { ...defaultFilters, actions: ['drop', 'reject'] },
          onFiltersChange,
        })
      );

      act(() => {
        result.current.toggleAction('drop');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        actions: ['reject'],
      });
    });

    it('handles multiple action toggles', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.toggleAction('drop');
      });
      act(() => {
        result.current.toggleAction('reject');
      });

      // Should have both actions
      const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
      expect(lastCall.actions).toContain('reject');
    });
  });

  describe('IP Address Filters', () => {
    it('sets source IP', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setSrcIp('192.168.1.100');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        srcIp: '192.168.1.100',
      });
    });

    it('sets destination IP', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setDstIp('10.0.0.1');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        dstIp: '10.0.0.1',
      });
    });

    it('validates IP with wildcards - valid cases', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      // Valid wildcard patterns
      expect(result.current.isValidIpFilter('192.168.1.*')).toBe(true);
      expect(result.current.isValidIpFilter('10.0.*.*')).toBe(true);
      expect(result.current.isValidIpFilter('*.*.*.*')).toBe(true);
      expect(result.current.isValidIpFilter('172.16.0.1')).toBe(true);
      expect(result.current.isValidIpFilter('')).toBe(true); // Empty is valid
    });

    it('validates IP with wildcards - invalid cases', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      // Invalid patterns
      expect(result.current.isValidIpFilter('192.168.1')).toBe(false);
      expect(result.current.isValidIpFilter('999.999.999.999')).toBe(false);
      expect(result.current.isValidIpFilter('192.168.1.256')).toBe(false);
      expect(result.current.isValidIpFilter('not-an-ip')).toBe(false);
    });
  });

  describe('Port Filters', () => {
    it('sets source port as single value', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setSrcPort('443');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        srcPort: 443,
      });
    });

    it('sets destination port as range', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setDstPort('8000-9000');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        dstPort: { min: 8000, max: 9000 },
      });
    });

    it('validates port filters - valid cases', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      expect(result.current.isValidPortFilter('80')).toBe(true);
      expect(result.current.isValidPortFilter('443')).toBe(true);
      expect(result.current.isValidPortFilter('8000-9000')).toBe(true);
      expect(result.current.isValidPortFilter('1-65535')).toBe(true);
      expect(result.current.isValidPortFilter('')).toBe(true);
    });

    it('validates port filters - invalid cases', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      expect(result.current.isValidPortFilter('0')).toBe(false);
      expect(result.current.isValidPortFilter('65536')).toBe(false);
      expect(result.current.isValidPortFilter('9000-8000')).toBe(false); // Reversed range
      expect(result.current.isValidPortFilter('not-a-port')).toBe(false);
    });
  });

  describe('Prefix Filter', () => {
    it('sets prefix filter', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setPrefix('DROPPED-');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        prefix: 'DROPPED-',
      });
    });

    it('clears prefix when empty string provided', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: { ...defaultFilters, prefix: 'DROPPED-' },
          onFiltersChange,
        })
      );

      act(() => {
        result.current.setPrefix('');
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        prefix: undefined,
      });
    });
  });

  describe('Clear Filters', () => {
    it('clears all filters to default state', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: {
            timeRangePreset: '1d',
            actions: ['drop', 'reject'],
            srcIp: '192.168.1.*',
            dstPort: 443,
            prefix: 'DROPPED-',
          },
          onFiltersChange,
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        timeRangePreset: '1h',
        actions: [],
      });
    });
  });

  describe('Active Filter Count', () => {
    it('counts zero active filters for default state', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      expect(result.current.activeFilterCount).toBe(0);
    });

    it('counts actions as one active filter', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: { ...defaultFilters, actions: ['drop', 'reject'] },
          onFiltersChange,
        })
      );

      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts multiple filter types correctly', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: {
            timeRangePreset: '1h',
            actions: ['drop'],
            srcIp: '192.168.1.*',
            dstPort: 443,
            prefix: 'DROPPED-',
          },
          onFiltersChange,
        })
      );

      // actions (1) + srcIp (1) + dstPort (1) + prefix (1) = 4
      expect(result.current.activeFilterCount).toBe(4);
    });

    it('counts custom time range as active filter', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: {
            timeRangePreset: 'custom',
            timeRange: {
              start: new Date('2024-01-01'),
              end: new Date('2024-01-02'),
            },
            actions: [],
          },
          onFiltersChange,
        })
      );

      expect(result.current.activeFilterCount).toBe(1);
    });
  });

  describe('Available Prefixes', () => {
    it('passes through available prefixes', () => {
      const onFiltersChange = vi.fn();
      const prefixes = ['DROPPED-', 'ACCEPTED-', 'FIREWALL-'];

      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
          availablePrefixes: prefixes,
        })
      );

      expect(result.current.availablePrefixes).toEqual(prefixes);
    });

    it('handles empty available prefixes', () => {
      const onFiltersChange = vi.fn();
      const { result } = renderHook(() =>
        useFirewallLogFilters({
          filters: defaultFilters,
          onFiltersChange,
        })
      );

      expect(result.current.availablePrefixes).toEqual([]);
    });
  });
});
