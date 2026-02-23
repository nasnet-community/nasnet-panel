/**
 * Zustand store for BandwidthChart preferences
 * Persists user's time range and interface filter selections to localStorage
 * Follows ADR-002 (State Management Approach): UI state → Zustand
 *
 * @module BandwidthChart/stores
 * @see https://docs.nasnet.io/architecture/frontend-architecture#ui-state-zustand
 */
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
export declare const useChartPreferencesStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ChartPreferencesState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ChartPreferencesState, {
            timeRange: TimeRange;
            interfaceId: string | null;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ChartPreferencesState) => void) => () => void;
        onFinishHydration: (fn: (state: ChartPreferencesState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ChartPreferencesState, {
            timeRange: TimeRange;
            interfaceId: string | null;
        }>>;
    };
}>;
export {};
//# sourceMappingURL=chart-preferences.store.d.ts.map