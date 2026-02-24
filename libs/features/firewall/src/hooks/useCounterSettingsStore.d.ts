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
    /** Polling interval in milliseconds (null = no auto-polling) */
    pollingInterval: PollingInterval;
    /** Whether to show relative size bar in counter cell */
    showRelativeBar: boolean;
    /** Whether to show rate calculations (packets/s, bytes/s) */
    showRate: boolean;
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
 * Counter Settings Store
 *
 * Persists user preferences for counter visualization via localStorage:
 * - Polling interval (how often to refresh counters)
 * - Display options (relative bar, rate calculations)
 *
 * Storage: localStorage with JSON serialization via Zustand persist middleware
 */
export declare const useCounterSettingsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<CounterSettingsState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<CounterSettingsState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: CounterSettingsState) => void) => () => void;
        onFinishHydration: (fn: (state: CounterSettingsState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<CounterSettingsState, unknown>>;
    };
}>;
/**
 * Get the current polling interval setting
 *
 * @example
 * const interval = usePollingInterval();
 */
export declare const usePollingInterval: () => PollingInterval;
/**
 * Get whether to show relative size bar
 *
 * @example
 * const shouldShow = useShowRelativeBar();
 */
export declare const useShowRelativeBar: () => boolean;
/**
 * Get whether to show rate calculations
 *
 * @example
 * const shouldShow = useShowRate();
 */
export declare const useShowRate: () => boolean;
//# sourceMappingURL=useCounterSettingsStore.d.ts.map