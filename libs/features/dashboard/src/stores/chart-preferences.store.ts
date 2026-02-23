/**
 * Zustand store for BandwidthChart preferences
 * Persists user's time range and interface filter selections to localStorage
 * Follows ADR-002 (State Management Approach): UI state → Zustand
 *
 * @module BandwidthChart/stores
 * @see https://docs.nasnet.io/architecture/frontend-architecture#ui-state-zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Time range type for bandwidth chart views
 * - '5m': Real-time view with 2-second granularity
 * - '1h': Hourly view with 1-minute aggregation
 * - '24h': Daily view with 5-minute aggregation
 *
 * @typedef {('5m' | '1h' | '24h')} TimeRange
 */
type TimeRange = '5m' | '1h' | '24h';

/**
 * Chart preferences state interface
 * Defines the shape of the preferences store
 *
 * @interface ChartPreferencesState
 * @property {TimeRange} timeRange - Selected time range (5m, 1h, 24h)
 * @property {string|null} interfaceId - Selected interface ID (null = all interfaces)
 * @property {Function} setTimeRange - Update time range preference
 * @property {Function} setInterfaceId - Update interface filter preference
 * @property {Function} reset - Reset to default preferences
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
 * Applied on store initialization
 *
 * @constant
 * @type {Pick<ChartPreferencesState, 'timeRange' | 'interfaceId'>}
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
 * Stores user's BandwidthChart preferences (time range and interface filter)
 * across page reloads and sessions
 *
 * @function useChartPreferencesStore
 * @returns {ChartPreferencesState} Store with state and actions
 *
 * @example
 * const { timeRange, interfaceId, setTimeRange, setInterfaceId, reset } = useChartPreferencesStore();
 *
 * // Update preferences
 * setTimeRange('1h');
 * setInterfaceId('ether1');
 *
 * // Reset to defaults
 * reset();
 *
 * @see https://docs.nasnet.io/architecture/frontend-architecture#zustand-store-pattern
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
      name: 'nasnet-chart-preferences', // localStorage key (with nasnet- prefix for namespace)
      version: 1,
      // Only persist these fields (omit action functions)
      partialize: (state) => ({
        timeRange: state.timeRange,
        interfaceId: state.interfaceId,
      }),
    }
  )
);
