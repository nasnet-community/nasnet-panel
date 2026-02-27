/**
 * Sidebar State Store
 * Manages sidebar collapse state with localStorage persistence
 *
 * State Precedence Rules (per story NAS-4.3):
 * - Mobile (<640px): Sidebar always hidden (bottom tabs instead)
 * - Tablet (640-1024px): Sidebar always visible, user can collapse
 * - Desktop (>1024px): Use persisted desktopCollapsed preference
 *
 * Usage:
 * The ResponsiveShell component in libs/ui/layouts uses these values
 * via props (dependency injection), as ui/ cannot import from state/.
 * The app layer (apps/connect) wires up the store.
 *
 * @see NAS-4.3: Build Responsive Layout System
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Sidebar state interface
 */
export interface SidebarState {
  /**
   * Whether the sidebar is collapsed on desktop
   * This preference is persisted to localStorage
   * Only applies when viewport is >1024px
   */
  desktopCollapsed: boolean;

  /**
   * Toggle sidebar collapsed state
   * Use for keyboard shortcut (Cmd+B) and toggle button
   */
  toggle: () => void;

  /**
   * Explicitly set collapsed state
   * Use when programmatically controlling sidebar
   */
  setCollapsed: (collapsed: boolean) => void;

  /**
   * Expand sidebar (set collapsed to false)
   */
  expand: () => void;

  /**
   * Collapse sidebar (set collapsed to true)
   */
  collapse: () => void;

  /**
   * Reset to default state (expanded)
   */
  reset: () => void;
}

/**
 * Sidebar Zustand store with localStorage persistence
 *
 * @example
 * ```tsx
 * // In apps/connect layout component
 * import { useSidebarStore } from '@nasnet/state/stores';
 * import { ResponsiveShell } from '@nasnet/ui/layouts';
 *
 * function AppLayout({ children }) {
 *   const { desktopCollapsed, toggle } = useSidebarStore();
 *
 *   return (
 *     <ResponsiveShell
 *       sidebar={<NavigationSidebar />}
 *       sidebarCollapsed={desktopCollapsed}
 *       onSidebarToggle={toggle}
 *     >
 *       {children}
 *     </ResponsiveShell>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Toggle with keyboard shortcut (handled in ResponsiveShell)
 * const { toggle } = useSidebarStore();
 * // Cmd+B (Mac) or Ctrl+B (Windows/Linux) triggers toggle()
 * ```
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      desktopCollapsed: false,

      toggle: () =>
        set((state) => ({
          desktopCollapsed: !state.desktopCollapsed,
        })),

      setCollapsed: (collapsed: boolean) => set({ desktopCollapsed: collapsed }),

      expand: () => set({ desktopCollapsed: false }),

      collapse: () => set({ desktopCollapsed: true }),

      reset: () => set({ desktopCollapsed: false }),
    }),
    {
      name: 'nasnet-sidebar', // localStorage key
      version: 1, // For future migrations
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist desktopCollapsed, not the actions
        desktopCollapsed: state.desktopCollapsed,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Failed to hydrate sidebar state from localStorage:', error);
          }
        };
      },
    }
  )
);

/**
 * Selector for collapsed state only
 * Use for components that only need to read the state
 *
 * @example
 * ```tsx
 * const isCollapsed = useSidebarStore(selectSidebarCollapsed);
 * ```
 */
export const selectSidebarCollapsed = (state: SidebarState) => state.desktopCollapsed;

/**
 * Selector for toggle action only
 * Use for components that only need the toggle action
 *
 * @example
 * ```tsx
 * const toggle = useSidebarStore(selectSidebarToggle);
 * ```
 */
export const selectSidebarToggle = (state: SidebarState) => state.toggle;

/**
 * Get sidebar store state outside of React
 * Useful for imperative code or testing
 *
 * @example
 * ```ts
 * // In a utility or test
 * const { desktopCollapsed, toggle } = getSidebarState();
 * ```
 */
export const getSidebarState = () => useSidebarStore.getState();

/**
 * Subscribe to sidebar state changes outside of React
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeSidebarState((state) => {
 *   console.log('Sidebar collapsed:', state.desktopCollapsed);
 * });
 * // Later: unsubscribe();
 * ```
 */
export const subscribeSidebarState = useSidebarStore.subscribe;
