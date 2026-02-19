/**
 * Theme State Store
 * Manages theme mode (light/dark/system) with localStorage persistence
 *
 * Features:
 * - Persist theme preference to localStorage
 * - Auto-detect system theme preference
 * - Listen for system theme changes
 * - Sync theme class to DOM
 * - Redux DevTools integration for debugging
 *
 * @see NAS-4.5: Implement UI State with Zustand
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

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
export function getSystemTheme(): 'light' | 'dark' {
  // SSR safety: return default if window is not available
  if (typeof window === 'undefined') return 'light';

  // Check if browser supports prefers-color-scheme
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

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
export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'system',
        resolvedTheme: getSystemTheme(), // Detect system preference on initialization

        setTheme: (theme) => {
          // Update theme and resolve it
          if (theme === 'system') {
            set(
              { theme, resolvedTheme: getSystemTheme() },
              false,
              `setTheme/${theme}`
            );
          } else {
            set(
              { theme, resolvedTheme: theme },
              false,
              `setTheme/${theme}`
            );
          }
        },

        toggleTheme: () => {
          const current = get().resolvedTheme;
          const newTheme = current === 'dark' ? 'light' : 'dark';
          set(
            { theme: newTheme, resolvedTheme: newTheme },
            false,
            `toggleTheme/${newTheme}`
          );
        },

        resetTheme: () =>
          set(
            { theme: 'system', resolvedTheme: getSystemTheme() },
            false,
            'resetTheme'
          ),

        _setResolvedTheme: (resolvedTheme) =>
          set({ resolvedTheme }, false, `_setResolvedTheme/${resolvedTheme}`),
      }),
      {
        name: 'nasnet-theme', // localStorage key
        version: 1, // For future migrations
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.warn('Failed to hydrate theme from localStorage:', error);
            }
            // After rehydration, resolve the theme if it's 'system'
            if (state && state.theme === 'system') {
              state._setResolvedTheme(getSystemTheme());
            }
          };
        },
      }
    ),
    {
      name: 'theme-store',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

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
export function initThemeListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    const { theme, _setResolvedTheme } = useThemeStore.getState();
    // Only update if user prefers system theme
    if (theme === 'system') {
      _setResolvedTheme(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleChange);

  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handleChange);
}

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
export function syncThemeToDOM(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Apply immediately on first call
  const { resolvedTheme } = useThemeStore.getState();
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');

  // Subscribe to changes
  const unsubscribe = useThemeStore.subscribe((state, prevState) => {
    if (state.resolvedTheme !== prevState.resolvedTheme) {
      document.documentElement.classList.toggle('dark', state.resolvedTheme === 'dark');
    }
  });

  return unsubscribe;
}

/**
 * Selector for resolved theme only
 * Use for components that only need the resolved theme
 */
export const selectResolvedTheme = (state: ThemeState) => state.resolvedTheme;

/**
 * Selector for theme mode
 * Use for components that need to know the user's preference
 */
export const selectThemeMode = (state: ThemeState) => state.theme;

/**
 * Get theme store state outside of React
 * Useful for imperative code or testing
 */
export const getThemeState = () => useThemeStore.getState();
