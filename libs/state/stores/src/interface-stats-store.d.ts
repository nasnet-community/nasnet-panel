/**
 * Interface Statistics Store
 * Manages user preferences for interface statistics monitoring
 *
 * @see NAS-6.9: Implement Interface Traffic Statistics
 */
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
export declare const useInterfaceStatsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<InterfaceStatsState & InterfaceStatsActions>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<InterfaceStatsState & InterfaceStatsActions, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: InterfaceStatsState & InterfaceStatsActions) => void) => () => void;
        onFinishHydration: (fn: (state: InterfaceStatsState & InterfaceStatsActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<InterfaceStatsState & InterfaceStatsActions, unknown>>;
    };
}>;
/**
 * Select polling interval
 */
export declare const selectPollingInterval: (state: InterfaceStatsState) => PollingInterval;
/**
 * Get interface stats store state outside of React
 * Useful for imperative code or testing
 */
export declare const getInterfaceStatsState: () => InterfaceStatsState & InterfaceStatsActions;
/**
 * Subscribe to interface stats store changes outside of React
 */
export declare const subscribeInterfaceStatsState: (listener: (state: InterfaceStatsState & InterfaceStatsActions, prevState: InterfaceStatsState & InterfaceStatsActions) => void) => () => void;
/**
 * Polling interval display labels with descriptions
 */
export declare const POLLING_INTERVAL_LABELS: Record<PollingInterval, {
    label: string;
    description: string;
}>;
//# sourceMappingURL=interface-stats-store.d.ts.map