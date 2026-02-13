/**
 * Counter Settings Store
 * Manages UI state for firewall rule counter visualization
 *
 * Story: Counter Visualization Feature
 * @see libs/ui/patterns/src/counter-cell - Counter visualization components
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Polling interval options (milliseconds)
 * - null: No automatic polling (manual refresh only)
 * - 5000: 5 seconds (high frequency)
 * - 10000: 10 seconds (moderate frequency)
 * - 30000: 30 seconds (low frequency)
 * - 60000: 60 seconds (minimal frequency)
 */
export type PollingInterval = 5000 | 10000 | 30000 | 60000 | null;

/**
 * Counter Settings State Interface
 */
export interface CounterSettingsState {
  // Polling configuration
  /** Polling interval in milliseconds, null = no auto-polling */
  pollingInterval: PollingInterval;

  // Display preferences
  /** Show relative size bar in counter cell */
  showRelativeBar: boolean;

  /** Show rate calculations (packets/s, bytes/s) */
  showRate: boolean;

  // Actions
  /** Set polling interval for counter updates */
  setPollingInterval: (interval: PollingInterval) => void;

  /** Toggle relative size bar display */
  setShowRelativeBar: (show: boolean) => void;

  /** Toggle rate calculation display */
  setShowRate: (show: boolean) => void;

  /** Reset all settings to defaults */
  reset: () => void;
}

/**
 * Initial state values
 */
const initialState = {
  pollingInterval: null as PollingInterval, // Default: no auto-polling
  showRelativeBar: true,
  showRate: true,
};

/**
 * Counter Settings Store
 *
 * Persists user preferences for counter visualization:
 * - Polling interval (how often to refresh counters)
 * - Display options (relative bar, rate calculations)
 *
 * Storage: localStorage via Zustand persist middleware
 */
export const useCounterSettingsStore = create<CounterSettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      // Actions
      setPollingInterval: (interval) => set({ pollingInterval: interval }),

      setShowRelativeBar: (show) => set({ showRelativeBar: show }),

      setShowRate: (show) => set({ showRate: show }),

      reset: () => set(initialState),
    }),
    {
      name: 'nasnet-counter-settings',
      storage: createJSONStorage(() => localStorage),
      // Persist all settings
      partialize: (state) => ({
        pollingInterval: state.pollingInterval,
        showRelativeBar: state.showRelativeBar,
        showRate: state.showRate,
      }),
    }
  )
);

/**
 * Selector hooks for optimized access
 * Use these to prevent unnecessary re-renders in components
 */
export const usePollingInterval = () =>
  useCounterSettingsStore((state) => state.pollingInterval);

export const useShowRelativeBar = () =>
  useCounterSettingsStore((state) => state.showRelativeBar);

export const useShowRate = () =>
  useCounterSettingsStore((state) => state.showRate);
