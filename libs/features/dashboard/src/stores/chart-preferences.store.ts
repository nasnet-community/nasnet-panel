/**
 * Zustand store for BandwidthChart preferences
 * Persists user's time range and interface filter selections to localStorage
 * Follows ADR-002 (State Management Approach): UI state → Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Time range type for bandwidth chart
 */
type TimeRange = '5m' | '1h' | '24h';

/**
 * Chart preferences state interface
 */
interface ChartPreferencesState {
  /** Selected time range (5m, 1h, 24h) */
  timeRange: TimeRange;
  /** Selected interface ID (null = all interfaces) */
  interfaceId: string | null;
  /** Update time range preference */
  setTimeRange: (timeRange: TimeRange) => void;
  /** Update interface filter preference */
  setInterfaceId: (interfaceId: string | null) => void;
  /** Reset to default preferences */
  reset: () => void;
}

/**
 * Default chart preferences
 */
const DEFAULT_PREFERENCES: Pick<
  ChartPreferencesState,
  'timeRange' | 'interfaceId'
> = {
  timeRange: '5m', // Default to 5-minute real-time view
  interfaceId: null, // Default to all interfaces
};

/**
 * Chart preferences store with localStorage persistence
 *
 * Usage:
 * ```typescript
 * const { timeRange, interfaceId, setTimeRange, setInterfaceId } = useChartPreferencesStore();
 *
 * // Update preferences
 * setTimeRange('1h');
 * setInterfaceId('ether1');
 *
 * // Reset to defaults
 * reset();
 * ```
 */
export const useChartPreferencesStore = create<ChartPreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setTimeRange: (timeRange) => set({ timeRange }),

      setInterfaceId: (interfaceId) => set({ interfaceId }),

      reset: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'chart-preferences', // localStorage key
      version: 1,
      // Only persist these fields
      partialize: (state) => ({
        timeRange: state.timeRange,
        interfaceId: state.interfaceId,
      }),
    }
  )
);
