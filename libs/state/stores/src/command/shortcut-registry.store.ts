/**
 * Shortcut Registry Store
 * Manages keyboard shortcuts with vim-style multi-key support
 *
 * Features:
 * - Global shortcut registration
 * - Vim-style multi-key shortcuts (e.g., g h for "go home")
 * - Auto-disable in editable elements
 * - Browser conflict prevention
 * - Platform detection (disabled on mobile)
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Shortcut group for categorization in the overlay
 */
export type ShortcutGroup =
  | 'navigation'
  | 'global'
  | 'actions'
  | 'editing'
  | 'context';

/**
 * Shortcut definition
 */
export interface Shortcut {
  /** Unique shortcut identifier */
  id: string;
  /** Display label */
  label: string;
  /** Key combination (e.g., "cmd+k", "g h", "?") */
  keys: string;
  /** Shortcut group for categorization */
  group: ShortcutGroup;
  /** Whether this is context-specific (only shown for certain routes) */
  contextual?: boolean;
  /** Routes where this shortcut is active (if contextual) */
  activeRoutes?: string[];
  /** Execution handler */
  onExecute: () => void;
}

/**
 * Shortcut registry state interface
 */
export interface ShortcutRegistryState {
  /** Registered shortcuts */
  shortcuts: Map<string, Shortcut>;
  /** Shortcuts overlay visibility */
  overlayOpen: boolean;
  /** Pending key for multi-key shortcuts */
  pendingKey: string | null;
  /** Current route for contextual shortcuts */
  currentRoute: string;
}

/**
 * Shortcut registry actions interface
 */
export interface ShortcutRegistryActions {
  /** Register a shortcut */
  register: (shortcut: Shortcut) => void;
  /** Register multiple shortcuts at once */
  registerMany: (shortcuts: Shortcut[]) => void;
  /** Unregister a shortcut by ID */
  unregister: (id: string) => void;
  /** Open shortcuts overlay */
  openOverlay: () => void;
  /** Close shortcuts overlay */
  closeOverlay: () => void;
  /** Toggle shortcuts overlay */
  toggleOverlay: () => void;
  /** Set pending key for multi-key shortcuts */
  setPendingKey: (key: string | null) => void;
  /** Set current route for contextual shortcuts */
  setCurrentRoute: (route: string) => void;
  /** Get all shortcuts as array */
  getAllShortcuts: () => Shortcut[];
  /** Get shortcuts by group */
  getByGroup: (group: ShortcutGroup) => Shortcut[];
  /** Get shortcuts for current context */
  getContextualShortcuts: () => Shortcut[];
  /** Get shortcut by keys */
  getByKeys: (keys: string) => Shortcut | undefined;
}

/**
 * Default state
 */
const defaultState: ShortcutRegistryState = {
  shortcuts: new Map(),
  overlayOpen: false,
  pendingKey: null,
  currentRoute: '/',
};

/**
 * Shortcut Registry Zustand Store
 *
 * Usage:
 * ```tsx
 * const { register, openOverlay } = useShortcutRegistry();
 *
 * // Register a shortcut
 * register({
 *   id: 'go-dashboard',
 *   label: 'Go to Dashboard',
 *   keys: 'g d',
 *   group: 'navigation',
 *   onExecute: () => navigate('/dashboard'),
 * });
 *
 * // The useGlobalShortcuts hook handles keyboard event listening
 * ```
 */
export const useShortcutRegistry = create<
  ShortcutRegistryState & ShortcutRegistryActions
>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...defaultState,

      // Actions
      register: (shortcut) =>
        set((state) => {
          const shortcuts = new Map(state.shortcuts);
          shortcuts.set(shortcut.id, shortcut);
          return { shortcuts };
        }),

      registerMany: (shortcuts) =>
        set((state) => {
          const newShortcuts = new Map(state.shortcuts);
          for (const shortcut of shortcuts) {
            newShortcuts.set(shortcut.id, shortcut);
          }
          return { shortcuts: newShortcuts };
        }),

      unregister: (id) =>
        set((state) => {
          const shortcuts = new Map(state.shortcuts);
          shortcuts.delete(id);
          return { shortcuts };
        }),

      openOverlay: () => set({ overlayOpen: true }),

      closeOverlay: () => set({ overlayOpen: false }),

      toggleOverlay: () => set((state) => ({ overlayOpen: !state.overlayOpen })),

      setPendingKey: (key) => set({ pendingKey: key }),

      setCurrentRoute: (route) => set({ currentRoute: route }),

      getAllShortcuts: () => Array.from(get().shortcuts.values()),

      getByGroup: (group) =>
        Array.from(get().shortcuts.values()).filter((s) => s.group === group),

      getContextualShortcuts: () => {
        const { shortcuts, currentRoute } = get();
        return Array.from(shortcuts.values()).filter((s) => {
          if (!s.contextual) return true;
          if (!s.activeRoutes) return false;
          return s.activeRoutes.some((route) => currentRoute.startsWith(route));
        });
      },

      getByKeys: (keys) => {
        const normalizedKeys = keys.toLowerCase().trim();
        return Array.from(get().shortcuts.values()).find(
          (s) => s.keys.toLowerCase() === normalizedKeys
        );
      },
    }),
    {
      name: 'shortcut-registry',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

// ===== Selectors =====

/**
 * Select overlay open state
 */
export const selectShortcutOverlayOpen = (state: ShortcutRegistryState) =>
  state.overlayOpen;

/**
 * Select pending key
 */
export const selectPendingKey = (state: ShortcutRegistryState) =>
  state.pendingKey;

// ===== Helper functions =====

/**
 * Get shortcut registry state outside of React
 */
export const getShortcutRegistryState = () => useShortcutRegistry.getState();

/**
 * Subscribe to shortcut registry changes outside of React
 */
export const subscribeShortcutRegistry = useShortcutRegistry.subscribe;

/**
 * Group shortcuts by category for display
 */
export function groupShortcutsByCategory(
  shortcuts: Shortcut[]
): Map<ShortcutGroup, Shortcut[]> {
  const groups = new Map<ShortcutGroup, Shortcut[]>();

  for (const shortcut of shortcuts) {
    const group = groups.get(shortcut.group) || [];
    group.push(shortcut);
    groups.set(shortcut.group, group);
  }

  return groups;
}

/**
 * Format shortcut keys for display
 * Converts "cmd+k" to "⌘K" on macOS or "Ctrl+K" on others
 */
export function formatShortcutKeys(keys: string, isMac: boolean): string {
  return keys
    .split(' ')
    .map((part) => {
      return part
        .split('+')
        .map((key) => {
          switch (key.toLowerCase()) {
            case 'cmd':
            case 'meta':
              return isMac ? '⌘' : 'Ctrl';
            case 'ctrl':
              return isMac ? '⌃' : 'Ctrl';
            case 'alt':
              return isMac ? '⌥' : 'Alt';
            case 'shift':
              return isMac ? '⇧' : 'Shift';
            case 'enter':
              return '↵';
            case 'escape':
            case 'esc':
              return 'Esc';
            case 'arrowup':
              return '↑';
            case 'arrowdown':
              return '↓';
            case 'arrowleft':
              return '←';
            case 'arrowright':
              return '→';
            default:
              return key.toUpperCase();
          }
        })
        .join(isMac ? '' : '+');
    })
    .join(' ');
}
