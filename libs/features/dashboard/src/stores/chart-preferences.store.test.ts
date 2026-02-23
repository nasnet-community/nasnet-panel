/**
 * Unit tests for chart-preferences Zustand store
 * Verifies state management and persistence behavior
 *
 * @see chart-preferences.store.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChartPreferencesStore } from './chart-preferences.store';

describe('useChartPreferencesStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    const { result } = renderHook(() => useChartPreferencesStore());
    act(() => {
      result.current.reset();
    });
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      expect(result.current.timeRange).toBe('5m');
      expect(result.current.interfaceId).toBe(null);
    });
  });

  describe('setTimeRange', () => {
    it('should update time range to 1h', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('1h');
      });

      expect(result.current.timeRange).toBe('1h');
    });

    it('should update time range to 24h', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('24h');
      });

      expect(result.current.timeRange).toBe('24h');
    });

    it('should persist time range to localStorage', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('1h');
      });

      const stored = localStorage.getItem('nasnet-chart-preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.timeRange).toBe('1h');
    });
  });

  describe('setInterfaceId', () => {
    it('should update interface ID', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setInterfaceId('ether1');
      });

      expect(result.current.interfaceId).toBe('ether1');
    });

    it('should allow setting interface ID to null (all interfaces)', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setInterfaceId('ether1');
      });
      expect(result.current.interfaceId).toBe('ether1');

      act(() => {
        result.current.setInterfaceId(null);
      });

      expect(result.current.interfaceId).toBe(null);
    });

    it('should persist interface ID to localStorage', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setInterfaceId('ether2');
      });

      const stored = localStorage.getItem('nasnet-chart-preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.interfaceId).toBe('ether2');
    });
  });

  describe('reset', () => {
    it('should reset to default preferences', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('24h');
        result.current.setInterfaceId('ether1');
      });

      expect(result.current.timeRange).toBe('24h');
      expect(result.current.interfaceId).toBe('ether1');

      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRange).toBe('5m');
      expect(result.current.interfaceId).toBe(null);
    });

    it('should persist reset state to localStorage', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('24h');
        result.current.reset();
      });

      const stored = localStorage.getItem('nasnet-chart-preferences');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.timeRange).toBe('5m');
      expect(parsed.state.interfaceId).toBe(null);
    });
  });

  describe('Multiple operations', () => {
    it('should handle multiple sequential updates', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('1h');
      });
      expect(result.current.timeRange).toBe('1h');

      act(() => {
        result.current.setInterfaceId('ether1');
      });
      expect(result.current.interfaceId).toBe('ether1');

      act(() => {
        result.current.setTimeRange('24h');
      });
      expect(result.current.timeRange).toBe('24h');
      expect(result.current.interfaceId).toBe('ether1');
    });

    it('should not update unrelated state properties', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('1h');
      });

      expect(result.current.interfaceId).toBe(null);
      expect(Object.keys(result.current).length).toBeGreaterThan(2);
    });
  });

  describe('Persistence', () => {
    it('should only persist specific fields (not functions)', () => {
      const { result } = renderHook(() => useChartPreferencesStore());

      act(() => {
        result.current.setTimeRange('1h');
        result.current.setInterfaceId('ether1');
      });

      const stored = localStorage.getItem('nasnet-chart-preferences');
      const parsed = JSON.parse(stored!);

      expect(parsed.state).toHaveProperty('timeRange');
      expect(parsed.state).toHaveProperty('interfaceId');
      expect(parsed.state).not.toHaveProperty('setTimeRange');
      expect(parsed.state).not.toHaveProperty('setInterfaceId');
      expect(parsed.state).not.toHaveProperty('reset');
    });
  });
});
