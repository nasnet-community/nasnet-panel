import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

  // ===== Router CRUD Operations =====

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

  // ===== Selection Management =====

  /**
   * Select a router (for connection attempt)
   */
  selectRouter: (id: string) => void;

  /**
   * Clear current selection
   */
  clearSelection: () => void;

  // ===== Scan Progress =====

  /**
   * Update scan progress
   */
  setScanProgress: (progress: ScanProgress | null) => void;

  // ===== Connection Tracking =====

  /**
   * Mark a router as the last successfully connected
   * Called after successful authentication
   */
  setLastConnected: (id: string) => void;

  /**
   * Get the last connected router
   */
  getLastConnectedRouter: () => Router | undefined;

  // ===== Utility =====

  /**
   * Clear all routers (for testing/reset)
   */
  clearAll: () => void;

  // ===== Configuration Check Tracking =====

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
export const useRouterStore = create<RouterStore>()(
  persist(
    (set, get) => ({
      routers: {},
      selectedRouterId: null,
      scanProgress: null,
      lastConnectedRouterId: null,
      configurationCheckedRouters: [],

      // ===== Router CRUD Operations =====

      addRouter: (router) =>
        set((state) => ({
          routers: {
            ...state.routers,
            [router.id]: router,
          },
        })),

      updateRouter: (id, updates) =>
        set((state) => {
          const router = state.routers[id];
          if (!router) return state;

          return {
            routers: {
              ...state.routers,
              [id]: { ...router, ...updates },
            },
          };
        }),

      removeRouter: (id) =>
        set((state) => {
          const { [id]: removed, ...remaining } = state.routers;
          return {
            routers: remaining,
            // Clear selection if removing selected router
            selectedRouterId:
              state.selectedRouterId === id ? null : state.selectedRouterId,
            // Clear last connected if removing that router
            lastConnectedRouterId:
              state.lastConnectedRouterId === id
                ? null
                : state.lastConnectedRouterId,
          };
        }),

      getRouter: (id) => get().routers[id],

      getAllRouters: () => Object.values(get().routers),

      // ===== Selection Management =====

      selectRouter: (id) => set({ selectedRouterId: id }),

      clearSelection: () => set({ selectedRouterId: null }),

      // ===== Scan Progress =====

      setScanProgress: (progress) => set({ scanProgress: progress }),

      // ===== Connection Tracking =====

      setLastConnected: (id) =>
        set((state) => {
          const router = state.routers[id];
          if (!router) return state;

          return {
            lastConnectedRouterId: id,
            routers: {
              ...state.routers,
              [id]: {
                ...router,
                connectionStatus: 'online',
                lastConnected: new Date(),
              },
            },
          };
        }),

      getLastConnectedRouter: () => {
        const { lastConnectedRouterId, routers } = get();
        return lastConnectedRouterId ? routers[lastConnectedRouterId] : undefined;
      },

      // ===== Utility =====

      clearAll: () =>
        set({
          routers: {},
          selectedRouterId: null,
          scanProgress: null,
          lastConnectedRouterId: null,
          configurationCheckedRouters: [],
        }),

      // ===== Configuration Check Tracking =====

      isConfigurationChecked: (routerId) =>
        get().configurationCheckedRouters.includes(routerId),

      markConfigurationChecked: (routerId) =>
        set((state) => {
          // Avoid duplicates
          if (state.configurationCheckedRouters.includes(routerId)) {
            return state;
          }
          return {
            configurationCheckedRouters: [
              ...state.configurationCheckedRouters,
              routerId,
            ],
          };
        }),

      clearConfigurationChecked: (routerId) =>
        set((state) => ({
          configurationCheckedRouters: state.configurationCheckedRouters.filter(
            (id) => id !== routerId
          ),
        })),
    }),
    {
      name: 'nasnet-router-store',
      // Persist routers, lastConnectedRouterId, and configurationCheckedRouters
      // Don't persist scanProgress or selectedRouterId (session-only)
      partialize: (state) => ({
        routers: state.routers,
        lastConnectedRouterId: state.lastConnectedRouterId,
        configurationCheckedRouters: state.configurationCheckedRouters,
      }),
    }
  )
);
