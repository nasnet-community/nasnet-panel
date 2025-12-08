import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
   * Set the theme mode
   * @param theme - The theme mode to set
   */
  setTheme: (theme: ThemeMode) => void;

  /**
   * Reset theme to system preference
   * Clears localStorage and reverts to default
   */
  resetTheme: () => void;

  /**
   * Resolved theme after considering system preference
   * If theme is 'system', this will be 'light' or 'dark' based on OS
   * Otherwise, it matches the theme value
   */
  resolvedTheme: 'light' | 'dark';

  /**
   * Internal: Update resolved theme
   * Called when system preference changes
   */
  _setResolvedTheme: (theme: 'light' | 'dark') => void;
}

/**
 * Zustand store for theme management with localStorage persistence
 *
 * Usage:
 * ```tsx
 * const { theme, setTheme, resetTheme, resolvedTheme } = useThemeStore();
 *
 * // Toggle theme (persists automatically)
 * setTheme(theme === 'dark' ? 'light' : 'dark');
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
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(), // Detect system preference on initialization
      setTheme: (theme) => set({ theme }),
      resetTheme: () => set({ theme: 'system' }),
      _setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    {
      name: 'nasnet-theme', // localStorage key
      version: 1, // For future migrations
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Failed to hydrate theme from localStorage:', error);
          }
        };
      },
    }
  )
);
