/**
 * Undo/Redo History Types
 *
 * Defines the core types for the undo/redo system including:
 * - UndoableAction interface
 * - Action types and scopes
 * - Non-undoable action categories
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */
/**
 * Types of actions that can be tracked in history
 */
export type HistoryActionType = 'edit' | 'delete' | 'create' | 'reorder' | 'changeset' | 'custom';
/**
 * Action scope determines history clearing behavior
 * - 'page': Cleared on navigation (form edits, UI changes)
 * - 'global': Persisted across navigation (router-wide configuration changes)
 */
export type ActionScope = 'page' | 'global';
/**
 * Represents an action that can be undone and redone
 *
 * @example
 * ```tsx
 * const editAction: UndoableAction = {
 *   id: 'action-123',
 *   type: 'edit',
 *   description: 'Edit interface name',
 *   timestamp: new Date(),
 *   scope: 'page',
 *   execute: async () => { applyNewValue(); },
 *   undo: async () => { restorePreviousValue(); },
 *   resourceId: 'interface-ether1',
 *   resourceType: 'network.interface',
 * };
 * ```
 */
export interface UndoableAction {
    /**
     * Unique action ID (auto-generated)
     * Format: `action-{timestamp}-{random}`
     */
    id: string;
    /**
     * Action type for categorization and display
     * Used for icons and filtering in history panel
     */
    type: HistoryActionType;
    /**
     * Human-readable description shown in history panel and notifications
     * Should be concise but descriptive (e.g., "Rename interface to 'WAN'")
     */
    description: string;
    /**
     * Timestamp when the action was originally executed
     */
    timestamp: Date;
    /**
     * Scope determines persistence behavior:
     * - 'page': Cleared when navigating away
     * - 'global': Persisted across navigation and to localStorage
     */
    scope: ActionScope;
    /**
     * Execute the action (for redo)
     * Called when redoing the action or applying it initially
     * @returns void or Promise<void> for async operations
     */
    execute: () => void | Promise<void>;
    /**
     * Undo the action
     * Called when undoing to restore previous state
     * @returns void or Promise<void> for async operations
     */
    undo: () => void | Promise<void>;
    /**
     * Optional: Resource ID affected by this action
     * Used for context and grouping related actions
     */
    resourceId?: string;
    /**
     * Optional: Resource type affected (e.g., 'network.bridge', 'vpn.wireguard')
     * Used for icons and categorization
     */
    resourceType?: string;
}
/**
 * Input type for creating new undoable actions
 * Omits auto-generated fields (id, timestamp)
 */
export type UndoableActionInput = Omit<UndoableAction, 'id' | 'timestamp'>;
/**
 * Categories of actions that should NOT be added to undo history
 * These are security-sensitive, irreversible, or already confirmed
 */
export declare const NON_UNDOABLE_CATEGORIES: readonly ["applied-configuration", "confirmed-delete", "security-change", "authentication", "restart-required", "external-integration"];
/**
 * Type for non-undoable action categories
 */
export type NonUndoableCategory = (typeof NON_UNDOABLE_CATEGORIES)[number];
/**
 * Check if a category is non-undoable
 * @param category - The category to check
 * @returns true if the category should not be tracked in undo history
 */
export declare function isNonUndoableCategory(category: string): category is NonUndoableCategory;
/**
 * State structure for the history store
 */
export interface HistoryState {
    /**
     * Stack of past actions (most recent at end)
     * Pushing a new action clears future
     */
    past: UndoableAction[];
    /**
     * Stack of future actions (most recent undo at start)
     * Cleared when a new action is pushed
     */
    future: UndoableAction[];
}
/**
 * Actions available on the history store
 */
export interface HistoryActions {
    /**
     * Push a new action to history
     * - Adds to past stack
     * - Clears future stack (branching)
     * - Trims to MAX_ACTIONS limit
     * @param action - Action to add (without id/timestamp)
     * @returns Generated action ID
     */
    pushAction: (action: UndoableActionInput) => string;
    /**
     * Undo the most recent action
     * - Pops from past, pushes to future
     * - Executes action's undo() method
     * @returns true if undo was performed, false if nothing to undo
     */
    undo: () => Promise<boolean>;
    /**
     * Redo the most recently undone action
     * - Pops from future, pushes to past
     * - Executes action's execute() method
     * @returns true if redo was performed, false if nothing to redo
     */
    redo: () => Promise<boolean>;
    /**
     * Jump to a specific point in history
     * - Undoes/redoes multiple actions to reach the target
     * - Actions beyond that point are discarded
     * @param index - Index in past array to jump to
     */
    jumpToIndex: (index: number) => Promise<void>;
    /**
     * Clear all history (past and future)
     */
    clearHistory: () => void;
    /**
     * Clear only page-scoped history
     * Called on navigation to clean up form edits
     */
    clearPageHistory: () => void;
}
/**
 * Combined history store type
 */
export type HistoryStore = HistoryState & HistoryActions;
//# sourceMappingURL=types.d.ts.map