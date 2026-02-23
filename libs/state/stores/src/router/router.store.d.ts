import type { Router, ScanProgress } from '@nasnet/core/types';
/**
 * Router store state interface
 * Manages discovered/manually-added routers
 */
export interface RouterStore {
    /**
     * All routers (discovered + manually added)
     * Keyed by router ID for O(1) lookup
     */
    routers: Record<string, Router>;
    /**
     * Currently selected router ID
     * Used for connection attempts
     */
    selectedRouterId: string | null;
    /**
     * Current scan progress (null if not scanning)
     */
    scanProgress: ScanProgress | null;
    /**
     * ID of the last successfully connected router
     * Used for auto-reconnect on app start
     */
    lastConnectedRouterId: string | null;
    /**
     * Router IDs that have been checked for configuration
     * Used to avoid showing the configuration import wizard repeatedly
     */
    configurationCheckedRouters: string[];
    /**
     * Add a new router to the store
     */
    addRouter: (router: Router) => void;
    /**
     * Update an existing router
     */
    updateRouter: (id: string, updates: Partial<Router>) => void;
    /**
     * Remove a router from the store
     */
    removeRouter: (id: string) => void;
    /**
     * Get a specific router by ID
     */
    getRouter: (id: string) => Router | undefined;
    /**
     * Get all routers as an array
     */
    getAllRouters: () => Router[];
    /**
     * Select a router (for connection attempt)
     */
    selectRouter: (id: string) => void;
    /**
     * Clear current selection
     */
    clearSelection: () => void;
    /**
     * Update scan progress
     */
    setScanProgress: (progress: ScanProgress | null) => void;
    /**
     * Mark a router as the last successfully connected
     * Called after successful authentication
     */
    setLastConnected: (id: string) => void;
    /**
     * Get the last connected router
     */
    getLastConnectedRouter: () => Router | undefined;
    /**
     * Clear all routers (for testing/reset)
     */
    clearAll: () => void;
    /**
     * Check if a router has been checked for configuration
     */
    isConfigurationChecked: (routerId: string) => boolean;
    /**
     * Mark a router as checked for configuration
     * Called after showing the configuration wizard (or user skips)
     */
    markConfigurationChecked: (routerId: string) => void;
    /**
     * Clear configuration checked status for a router
     * Useful if user wants to re-import configuration
     */
    clearConfigurationChecked: (routerId: string) => void;
}
/**
 * Zustand store for router management
 *
 * Persisted to localStorage under key 'nasnet-router-store'
 *
 * Features:
 * - Automatic persistence
 * - Router CRUD operations
 * - Selection management
 * - Scan progress tracking
 * - Last connected router tracking for auto-reconnect
 *
 * Usage:
 * ```tsx
 * const { routers, addRouter, selectRouter } = useRouterStore();
 *
 * // Add a router
 * addRouter({
 *   id: crypto.randomUUID(),
 *   ipAddress: '192.168.88.1',
 *   name: 'Main Router',
 *   connectionStatus: 'unknown',
 *   discoveryMethod: 'manual',
 *   createdAt: new Date(),
 * });
 *
 * // Select for connection
 * selectRouter(routerId);
 * ```
 */
export declare const useRouterStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<RouterStore>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<RouterStore, {
            routers: Record<string, Router>;
            lastConnectedRouterId: string | null;
            configurationCheckedRouters: string[];
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: RouterStore) => void) => () => void;
        onFinishHydration: (fn: (state: RouterStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<RouterStore, {
            routers: Record<string, Router>;
            lastConnectedRouterId: string | null;
            configurationCheckedRouters: string[];
        }>>;
    };
}>;
//# sourceMappingURL=router.store.d.ts.map