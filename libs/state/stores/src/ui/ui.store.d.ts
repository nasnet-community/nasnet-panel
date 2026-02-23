/**
 * UI state interface - preferences and transient state
 */
export interface UIState {
    /**
     * Active navigation tab
     * Used for tab-based navigation within pages
     */
    activeTab: string | null;
    /**
     * Whether the command palette is open
     */
    commandPaletteOpen: boolean;
    /**
     * Compact mode - reduces spacing and padding
     */
    compactMode: boolean;
    /**
     * Whether animations are enabled
     * Respects prefers-reduced-motion by default
     */
    animationsEnabled: boolean;
    /**
     * Default duration for notifications in ms
     */
    defaultNotificationDuration: number;
    /**
     * Hide hostnames in device lists (privacy mode)
     * When enabled, shows masked names like "Device-XXXX"
     * @see NAS-5.4: Connected Devices Privacy Controls
     */
    hideHostnames: boolean;
}
/**
 * UI actions interface
 */
export interface UIActions {
    /**
     * Set the active tab
     */
    setActiveTab: (tab: string | null) => void;
    /**
     * Open the command palette
     */
    openCommandPalette: () => void;
    /**
     * Close the command palette
     */
    closeCommandPalette: () => void;
    /**
     * Toggle the command palette
     */
    toggleCommandPalette: () => void;
    /**
     * Set command palette open state
     */
    setCommandPaletteOpen: (open: boolean) => void;
    /**
     * Set compact mode
     */
    setCompactMode: (compact: boolean) => void;
    /**
     * Toggle compact mode
     */
    toggleCompactMode: () => void;
    /**
     * Set animations enabled
     */
    setAnimationsEnabled: (enabled: boolean) => void;
    /**
     * Set default notification duration
     */
    setDefaultNotificationDuration: (duration: number) => void;
    /**
     * Reset all preferences to defaults
     */
    resetPreferences: () => void;
    /**
     * Set hide hostnames (privacy mode)
     */
    setHideHostnames: (hide: boolean) => void;
    /**
     * Toggle hide hostnames
     */
    toggleHideHostnames: () => void;
}
/**
 * Zustand store for UI preferences and state
 *
 * Usage:
 * ```tsx
 * const { commandPaletteOpen, toggleCommandPalette } = useUIStore();
 *
 * // Toggle command palette
 * toggleCommandPalette();
 *
 * // Or use with keyboard shortcut
 * useEffect(() => {
 *   const handler = (e: KeyboardEvent) => {
 *     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 *       e.preventDefault();
 *       toggleCommandPalette();
 *     }
 *   };
 *   window.addEventListener('keydown', handler);
 *   return () => window.removeEventListener('keydown', handler);
 * }, [toggleCommandPalette]);
 * ```
 *
 * Persistence:
 * - Saves preferences to localStorage under key: 'nasnet-ui-store'
 * - Does NOT persist transient state (commandPaletteOpen, activeTab)
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'ui-store'
 */
export declare const useUIStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<UIState & UIActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (UIState & UIActions) | Partial<UIState & UIActions> | ((state: UIState & UIActions) => (UIState & UIActions) | Partial<UIState & UIActions>), replace?: boolean | undefined, action?: A | undefined): void;
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<UIState & UIActions, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: UIState & UIActions) => void) => () => void;
        onFinishHydration: (fn: (state: UIState & UIActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<UIState & UIActions, unknown>>;
    };
}>;
/**
 * Select active tab
 */
export declare const selectActiveTab: (state: UIState) => string | null;
/**
 * Select command palette open state
 */
export declare const selectCommandPaletteOpen: (state: UIState) => boolean;
/**
 * Select compact mode
 */
export declare const selectCompactMode: (state: UIState) => boolean;
/**
 * Select animations enabled
 */
export declare const selectAnimationsEnabled: (state: UIState) => boolean;
/**
 * Select default notification duration
 */
export declare const selectDefaultNotificationDuration: (state: UIState) => number;
/**
 * Get UI store state outside of React
 * Useful for imperative code or testing
 */
export declare const getUIState: () => UIState & UIActions;
/**
 * Subscribe to UI store changes outside of React
 */
export declare const subscribeUIState: (listener: (state: UIState & UIActions, prevState: UIState & UIActions) => void) => () => void;
//# sourceMappingURL=ui.store.d.ts.map