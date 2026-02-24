/**
 * Theme mode type
 * - 'light': Light theme
 * - 'dark': Dark theme
 * - 'system': Follow system preference (OS setting)
 */
export type ThemeMode = 'light' | 'dark' | 'system';
/**
 * Detect system theme preference using prefers-color-scheme media query
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
export declare function getSystemTheme(): 'light' | 'dark';
/**
 * Theme store state interface
 */
export interface ThemeState {
    /**
     * Current theme mode
     * Can be explicitly set or follow system preference
     */
    theme: ThemeMode;
    /**
     * Resolved theme after considering system preference
     * If theme is 'system', this will be 'light' or 'dark' based on OS
     * Otherwise, it matches the theme value
     */
    resolvedTheme: 'light' | 'dark';
}
/**
 * Theme store actions interface
 */
export interface ThemeActions {
    /**
     * Set the theme mode
     * @param theme - The theme mode to set
     */
    setTheme: (theme: ThemeMode) => void;
    /**
     * Toggle between light and dark themes
     * Convenience action for quick switching
     */
    toggleTheme: () => void;
    /**
     * Reset theme to system preference
     * Clears localStorage and reverts to default
     */
    resetTheme: () => void;
    /**
     * Internal: Update resolved theme
     * Called when system preference changes
     */
    _setResolvedTheme: (theme: 'light' | 'dark') => void;
}
/**
 * Combined theme store type (state + actions)
 */
export type ThemeStore = ThemeState & ThemeActions;
/**
 * Zustand store for theme management with localStorage persistence
 *
 * Usage:
 * ```tsx
 * const { theme, setTheme, toggleTheme, resetTheme, resolvedTheme } = useThemeStore();
 *
 * // Toggle theme (persists automatically)
 * toggleTheme();
 *
 * // Set specific theme
 * setTheme('dark');
 *
 * // Reset to system preference
 * resetTheme();
 *
 * // Use resolved theme for actual UI theming
 * document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
 * ```
 *
 * Persistence:
 * - Automatically saves to localStorage under key: 'nasnet-theme'
 * - Hydrates state on app initialization
 * - Falls back gracefully if localStorage is unavailable
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'theme-store'
 */
export declare const useThemeStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<ThemeState & ThemeActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (ThemeState & ThemeActions) | Partial<ThemeState & ThemeActions> | ((state: ThemeState & ThemeActions) => (ThemeState & ThemeActions) | Partial<ThemeState & ThemeActions>), replace?: boolean | undefined, action?: A | undefined): void;
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ThemeState & ThemeActions, ThemeState & ThemeActions>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ThemeState & ThemeActions) => void) => () => void;
        onFinishHydration: (fn: (state: ThemeState & ThemeActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ThemeState & ThemeActions, ThemeState & ThemeActions>>;
    };
}>;
/**
 * Initialize system theme change listener
 * Call this once in app initialization to auto-update theme when OS preference changes
 *
 * @returns Cleanup function to remove the listener
 *
 * @example
 * ```tsx
 * // In your app initialization (e.g., main.tsx or App.tsx)
 * useEffect(() => {
 *   const cleanup = initThemeListener();
 *   return cleanup;
 * }, []);
 * ```
 */
export declare function initThemeListener(): () => void;
/**
 * Sync theme to DOM by toggling 'dark' class on document element
 * Call in a useEffect or app initialization to keep DOM in sync with theme state
 *
 * @returns Cleanup function to unsubscribe from store
 *
 * @example
 * ```tsx
 * // In your app initialization
 * useEffect(() => {
 *   const cleanup = syncThemeToDOM();
 *   return cleanup;
 * }, []);
 * ```
 */
export declare function syncThemeToDOM(): () => void;
/**
 * Selector for resolved theme only
 * Use for components that only need the resolved theme
 */
export declare const selectResolvedTheme: (state: ThemeState) => "light" | "dark";
/**
 * Selector for theme mode
 * Use for components that need to know the user's preference
 */
export declare const selectThemeMode: (state: ThemeState) => ThemeMode;
/**
 * Get theme store state outside of React
 * Useful for imperative code or testing
 */
export declare const getThemeState: () => ThemeState & ThemeActions;
//# sourceMappingURL=theme.store.d.ts.map