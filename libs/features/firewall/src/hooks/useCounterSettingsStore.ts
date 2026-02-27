/**
 * Counter Settings Store
 *
 * Manages UI state for firewall rule counter visualization including polling
 * intervals and display preferences. Persists to localStorage via Zustand.
 *
 * @description Provides selector hooks for optimized component access, preventing
 * unnecessary re-renders by selecting only needed state slices.
 *
 * Story: Counter Visualization Feature
 * @see libs/ui/patterns/src/counter-cell - Counter visualization components
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// CONSTANTS
// ============================================

/** Polling interval options in milliseconds */
const POLLING_INTERVALS = {
  NONE: null,
  HIGH: 5000,
  MODERATE: 10000,
  LOW: 30000,
  MINIMAL: 60000,
} as const;

// ============================================
// TYPES
// ============================================

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
  /** Polling interval in milliseconds (null = no auto-polling) */
  pollingInterval: PollingInterval;

  // Display preferences
  /** Whether to show relative size bar in counter cell */
  showRelativeBar: boolean;

  /** Whether to show rate calculations (packets/s, bytes/s) */
  showRate: boolean;

  // Actions
  /** Set polling interval for counter updates */
  setPollingInterval: (interval: PollingInterval) => void;

  /** Toggle relative size bar display */
  setShowRelativeBar: (shouldShow: boolean) => void;

  /** Toggle rate calculation display */
  setShowRate: (shouldShow: boolean) => void;

  /** Reset all settings to defaults */
  reset: () => void;
}

/**
 * Initial state values
 */
const INITIAL_STATE: CounterSettingsState = {
  pollingInterval: POLLING_INTERVALS.NONE, // Default: no auto-polling
  showRelativeBar: true,
  showRate: true,
  setPollingInterval: () => {},
  setShowRelativeBar: () => {},
  setShowRate: () => {},
  reset: () => {},
};

/**
 * Counter Settings Store
 *
 * Persists user preferences for counter visualization via localStorage:
 * - Polling interval (how often to refresh counters)
 * - Display options (relative bar, rate calculations)
 *
 * Storage: localStorage with JSON serialization via Zustand persist middleware
 */
export const useCounterSettingsStore = create<CounterSettingsState>()(
  persist(
    (set) => {
      const baseState: Omit<
        CounterSettingsState,
        'setPollingInterval' | 'setShowRelativeBar' | 'setShowRate' | 'reset'
      > = {
        pollingInterval: null,
        showRelativeBar: true,
        showRate: true,
      };

      return {
        ...baseState,

        // ============================================
        // ACTIONS
        // ============================================

        setPollingInterval: (interval: PollingInterval) => set({ pollingInterval: interval }),

        setShowRelativeBar: (shouldShow: boolean) => set({ showRelativeBar: shouldShow }),

        setShowRate: (shouldShow: boolean) => set({ showRate: shouldShow }),

        reset: () =>
          set({
            pollingInterval: baseState.pollingInterval,
            showRelativeBar: baseState.showRelativeBar,
            showRate: baseState.showRate,
          }),
      };
    },
    {
      name: 'nasnet-counter-settings',
      storage: createJSONStorage(() => localStorage),
      // Persist all settings to localStorage
      partialize: (state) => ({
        pollingInterval: state.pollingInterval,
        showRelativeBar: state.showRelativeBar,
        showRate: state.showRate,
      }),
    }
  )
);

// ============================================
// SELECTOR HOOKS (For Optimized Component Access)
// ============================================

/**
 * Get the current polling interval setting
 *
 * @example
 * const interval = usePollingInterval();
 */
export const usePollingInterval = () => useCounterSettingsStore((state) => state.pollingInterval);

/**
 * Get whether to show relative size bar
 *
 * @example
 * const shouldShow = useShowRelativeBar();
 */
export const useShowRelativeBar = () => useCounterSettingsStore((state) => state.showRelativeBar);

/**
 * Get whether to show rate calculations
 *
 * @example
 * const shouldShow = useShowRate();
 */
export const useShowRate = () => useCounterSettingsStore((state) => state.showRate);
