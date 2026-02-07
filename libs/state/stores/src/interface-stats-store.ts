/**
 * Interface Statistics Store
 * Manages user preferences for interface statistics monitoring
 *
 * @see NAS-6.9: Implement Interface Traffic Statistics
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Polling interval options for interface statistics
 * - 1s: Real-time monitoring (high CPU usage)
 * - 5s: Recommended default (balanced)
 * - 10s: Low bandwidth mode
 * - 30s: Minimal updates
 */
export type PollingInterval = '1s' | '5s' | '10s' | '30s';

/**
 * Interface statistics state interface
 */
export interface InterfaceStatsState {
  /**
   * Polling interval for real-time statistics updates
   * @default '5s'
   */
  pollingInterval: PollingInterval;
}

/**
 * Interface statistics actions interface
 */
export interface InterfaceStatsActions {
  /**
   * Set the polling interval for statistics updates
   * Changes apply immediately to active subscriptions
   */
  setPollingInterval: (interval: PollingInterval) => void;

  /**
   * Reset preferences to default values
   */
  resetPreferences: () => void;
}

/**
 * Default state values
 */
const defaultState: InterfaceStatsState = {
  pollingInterval: '5s',
};

/**
 * Zustand store for interface statistics preferences
 *
 * Usage:
 * ```tsx
 * const { pollingInterval, setPollingInterval } = useInterfaceStatsStore();
 *
 * // Use in subscription hook
 * const { data } = useInterfaceStatsSubscription({
 *   routerId,
 *   interfaceId,
 *   interval: pollingInterval,
 * });
 *
 * // Change interval
 * setPollingInterval('1s');  // Real-time mode
 * ```
 *
 * Persistence:
 * - Saves preferences to localStorage under key: 'nasnet-interface-stats-preferences'
 * - Survives page reloads and browser restarts
 */
export const useInterfaceStatsStore = create<InterfaceStatsState & InterfaceStatsActions>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultState,

      // Actions
      setPollingInterval: (interval) => set({ pollingInterval: interval }),

      resetPreferences: () => set({ ...defaultState }),
    }),
    {
      name: 'nasnet-interface-stats-preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Failed to hydrate interface stats store from localStorage:', error);
          }
        };
      },
    }
  )
);

// ===== Selectors =====

/**
 * Select polling interval
 */
export const selectPollingInterval = (state: InterfaceStatsState) => state.pollingInterval;

// ===== Helper functions =====

/**
 * Get interface stats store state outside of React
 * Useful for imperative code or testing
 */
export const getInterfaceStatsState = () => useInterfaceStatsStore.getState();

/**
 * Subscribe to interface stats store changes outside of React
 */
export const subscribeInterfaceStatsState = useInterfaceStatsStore.subscribe;

/**
 * Polling interval display labels with descriptions
 */
export const POLLING_INTERVAL_LABELS: Record<
  PollingInterval,
  { label: string; description: string }
> = {
  '1s': { label: '1 second', description: 'Real-time (high CPU)' },
  '5s': { label: '5 seconds', description: 'Recommended' },
  '10s': { label: '10 seconds', description: 'Low bandwidth' },
  '30s': { label: '30 seconds', description: 'Minimal updates' },
};
