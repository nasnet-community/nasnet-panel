/**
 * Help Mode State Store
 * Manages Simple/Technical help mode with localStorage persistence
 *
 * Features:
 * - Persist mode preference to localStorage
 * - Simple/Technical terminology toggle
 * - Redux DevTools integration for debugging
 *
 * @see NAS-4A.12: Build Help System Components
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

/**
 * Help mode type
 * - 'simple': User-friendly explanations for beginners
 * - 'technical': Technical terminology for power users
 */
export type HelpMode = 'simple' | 'technical';

/**
 * Help mode store state interface
 */
export interface HelpModeState {
  /**
   * Current help mode
   * Controls terminology level in help content
   */
  mode: HelpMode;

  /**
   * Toggle between simple and technical modes
   */
  toggleMode: () => void;

  /**
   * Set the help mode explicitly
   * @param mode - The mode to set
   */
  setMode: (mode: HelpMode) => void;
}

/**
 * Zustand store for help mode management with localStorage persistence
 *
 * Usage:
 * ```tsx
 * const { mode, toggleMode, setMode } = useHelpModeStore();
 *
 * // Toggle mode (persists automatically)
 * toggleMode();
 *
 * // Set specific mode
 * setMode('technical');
 *
 * // Use mode for conditional rendering
 * const label = mode === 'simple' ? 'Gateway' : 'Default Route';
 * ```
 *
 * Persistence:
 * - Automatically saves to localStorage under key: 'nasnet-help-mode'
 * - Hydrates state on app initialization
 * - Falls back gracefully if localStorage is unavailable
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'help-mode-store'
 */
export const useHelpModeStore = create<HelpModeState>()(
  devtools(
    persist(
      (set) => ({
        mode: 'simple', // Default to simple mode for new users

        toggleMode: () =>
          set(
            (state) => ({
              mode: state.mode === 'simple' ? 'technical' : 'simple',
            }),
            false, // Don't replace the entire state
            'toggleMode' // Action name for DevTools
          ),

        setMode: (mode) =>
          set(
            { mode },
            false,
            'setMode' // Action name for DevTools
          ),
      }),
      {
        name: 'nasnet-help-mode', // localStorage key
        version: 1, // For future migrations
      }
    ),
    {
      name: 'help-mode-store',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

/**
 * Selector for help mode
 */
export const selectHelpMode = (state: HelpModeState) => state.mode;

/**
 * Get help mode store state outside of React
 * Useful for imperative code or testing
 */
export const getHelpModeState = () => useHelpModeStore.getState();
