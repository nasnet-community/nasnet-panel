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
/**
 * Shortcut group for categorization in the overlay
 */
export type ShortcutGroup = 'navigation' | 'global' | 'actions' | 'editing' | 'context';
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
export declare const useShortcutRegistry: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ShortcutRegistryState & ShortcutRegistryActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (ShortcutRegistryState & ShortcutRegistryActions) | Partial<ShortcutRegistryState & ShortcutRegistryActions> | ((state: ShortcutRegistryState & ShortcutRegistryActions) => (ShortcutRegistryState & ShortcutRegistryActions) | Partial<ShortcutRegistryState & ShortcutRegistryActions>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
/**
 * Select overlay open state
 */
export declare const selectShortcutOverlayOpen: (state: ShortcutRegistryState) => boolean;
/**
 * Select pending key
 */
export declare const selectPendingKey: (state: ShortcutRegistryState) => string | null;
/**
 * Get shortcut registry state outside of React
 */
export declare const getShortcutRegistryState: () => ShortcutRegistryState & ShortcutRegistryActions;
/**
 * Subscribe to shortcut registry changes outside of React
 */
export declare const subscribeShortcutRegistry: (listener: (state: ShortcutRegistryState & ShortcutRegistryActions, prevState: ShortcutRegistryState & ShortcutRegistryActions) => void) => () => void;
/**
 * Group shortcuts by category for display
 */
export declare function groupShortcutsByCategory(shortcuts: Shortcut[]): Map<ShortcutGroup, Shortcut[]>;
/**
 * Format shortcut keys for display
 * Converts "cmd+k" to "⌘K" on macOS or "Ctrl+K" on others
 */
export declare function formatShortcutKeys(keys: string, isMac: boolean): string;
//# sourceMappingURL=shortcut-registry.store.d.ts.map