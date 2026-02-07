/**
 * UI State Store
 * Manages global UI preferences and transient UI state
 *
 * Note: Sidebar state is managed separately in sidebar.store.ts
 * This store handles additional UI preferences and state
 *
 * @see NAS-4.5: Implement UI State with Zustand
 */

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';

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
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Default state values
 */
const defaultState: UIState = {
  activeTab: null,
  commandPaletteOpen: false,
  compactMode: false,
  animationsEnabled: !prefersReducedMotion(),
  defaultNotificationDuration: 4000,
  hideHostnames: false,
};

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
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...defaultState,

        // Actions
        setActiveTab: (tab) => set({ activeTab: tab }),

        openCommandPalette: () => set({ commandPaletteOpen: true }),

        closeCommandPalette: () => set({ commandPaletteOpen: false }),

        toggleCommandPalette: () =>
          set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

        setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

        setCompactMode: (compact) => set({ compactMode: compact }),

        toggleCompactMode: () =>
          set((state) => ({ compactMode: !state.compactMode })),

        setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),

        setDefaultNotificationDuration: (duration) =>
          set({ defaultNotificationDuration: Math.max(1000, Math.min(30000, duration)) }),

        setHideHostnames: (hide) => set({ hideHostnames: hide }),

        toggleHideHostnames: () =>
          set((state) => ({ hideHostnames: !state.hideHostnames })),

        resetPreferences: () =>
          set({
            compactMode: defaultState.compactMode,
            animationsEnabled: !prefersReducedMotion(),
            defaultNotificationDuration: defaultState.defaultNotificationDuration,
            hideHostnames: defaultState.hideHostnames,
          }),
      }),
      {
        name: 'nasnet-ui-store',
        version: 1,
        storage: createJSONStorage(() => localStorage),
        // Only persist user preferences, not transient UI state
        partialize: (state) => ({
          compactMode: state.compactMode,
          animationsEnabled: state.animationsEnabled,
          defaultNotificationDuration: state.defaultNotificationDuration,
          hideHostnames: state.hideHostnames,
        }),
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.warn('Failed to hydrate UI store from localStorage:', error);
            }
          };
        },
      }
    ),
    {
      name: 'ui-store',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

// ===== Selectors =====

/**
 * Select active tab
 */
export const selectActiveTab = (state: UIState) => state.activeTab;

/**
 * Select command palette open state
 */
export const selectCommandPaletteOpen = (state: UIState) => state.commandPaletteOpen;

/**
 * Select compact mode
 */
export const selectCompactMode = (state: UIState) => state.compactMode;

/**
 * Select animations enabled
 */
export const selectAnimationsEnabled = (state: UIState) => state.animationsEnabled;

/**
 * Select default notification duration
 */
export const selectDefaultNotificationDuration = (state: UIState) =>
  state.defaultNotificationDuration;

// ===== Helper functions =====

/**
 * Get UI store state outside of React
 * Useful for imperative code or testing
 */
export const getUIState = () => useUIStore.getState();

/**
 * Subscribe to UI store changes outside of React
 */
export const subscribeUIState = useUIStore.subscribe;
