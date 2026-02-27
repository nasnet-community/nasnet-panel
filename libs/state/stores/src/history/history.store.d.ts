import type { UndoableAction, UndoableActionInput, HistoryState, HistoryActions } from './types';
/**
 * Maximum number of actions to keep in history
 * Oldest actions are removed when limit is exceeded
 */
export declare const MAX_ACTIONS = 50;
/**
 * Serialize an action for persistence
 * Functions cannot be serialized, so we store action metadata only
 */
interface SerializedAction {
  id: string;
  type: UndoableAction['type'];
  description: string;
  timestamp: string;
  scope: UndoableAction['scope'];
  resourceId?: string;
  resourceType?: string;
}
/**
 * Zustand store for undo/redo history management
 *
 * Usage:
 * ```tsx
 * import { useHistoryStore, undoLast, redoLast } from '@nasnet/state/stores';
 *
 * // In a component
 * const { past, future, pushAction, undo, redo } = useHistoryStore();
 *
 * // Push an action
 * pushAction({
 *   type: 'edit',
 *   description: 'Edit interface name',
 *   scope: 'page',
 *   execute: () => setValue(newValue),
 *   undo: () => setValue(oldValue),
 * });
 *
 * // Undo/redo
 * await undo();
 * await redo();
 *
 * // Or use convenience functions
 * await undoLast();
 * await redoLast();
 * ```
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'history-store'
 *
 * Persistence:
 * - Only global-scope actions are persisted
 * - Page-scope actions are lost on navigation
 *
 * Note: Functions (execute/undo) cannot be persisted. Persisted actions
 * are for display purposes only. Full functionality requires re-registration.
 */
export declare const useHistoryStore: import('zustand').UseBoundStore<
  Omit<
    Omit<import('zustand').StoreApi<HistoryState & HistoryActions>, 'setState'> & {
      setState<
        A extends
          | string
          | {
              type: string;
            },
      >(
        partial:
          | (HistoryState & HistoryActions)
          | Partial<HistoryState & HistoryActions>
          | ((
              state: HistoryState & HistoryActions
            ) => (HistoryState & HistoryActions) | Partial<HistoryState & HistoryActions>),
        replace?: boolean | undefined,
        action?: A | undefined
      ): void;
    },
    'persist'
  > & {
    persist: {
      setOptions: (
        options: Partial<
          import('zustand/middleware').PersistOptions<
            HistoryState & HistoryActions,
            {
              past: SerializedAction[];
              future: SerializedAction[];
            }
          >
        >
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: HistoryState & HistoryActions) => void) => () => void;
      onFinishHydration: (fn: (state: HistoryState & HistoryActions) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<
          HistoryState & HistoryActions,
          {
            past: SerializedAction[];
            future: SerializedAction[];
          }
        >
      >;
    };
  }
>;
/**
 * Select whether undo is available
 */
export declare const selectCanUndo: (state: HistoryState) => boolean;
/**
 * Select whether redo is available
 */
export declare const selectCanRedo: (state: HistoryState) => boolean;
/**
 * Select the most recent action in history
 */
export declare const selectLastAction: (state: HistoryState) => UndoableAction | undefined;
/**
 * Select the total number of actions in past history
 */
export declare const selectHistoryLength: (state: HistoryState) => number;
/**
 * Select all past actions (for history panel display)
 */
export declare const selectPastActions: (state: HistoryState) => UndoableAction[];
/**
 * Select all future actions (for history panel display)
 */
export declare const selectFutureActions: (state: HistoryState) => UndoableAction[];
/**
 * Select current position in history (index of most recent action)
 */
export declare const selectCurrentPosition: (state: HistoryState) => number;
/**
 * Select total history length (past + future)
 */
export declare const selectTotalHistoryLength: (state: HistoryState) => number;
/**
 * Get history store state outside of React
 * Useful for imperative code or testing
 */
export declare const getHistoryState: () => HistoryState & HistoryActions;
/**
 * Subscribe to history store changes outside of React
 */
export declare const subscribeHistoryState: (
  listener: (state: HistoryState & HistoryActions, prevState: HistoryState & HistoryActions) => void
) => () => void;
/**
 * Undo the last action
 * Convenience function for use outside React components
 * @returns true if undo was performed
 */
export declare function undoLast(): Promise<boolean>;
/**
 * Redo the last undone action
 * Convenience function for use outside React components
 * @returns true if redo was performed
 */
export declare function redoLast(): Promise<boolean>;
/**
 * Push an action to history
 * Convenience function for use outside React components
 * @param action - The action to push
 * @returns The generated action ID
 */
export declare function pushHistoryAction(action: UndoableActionInput): string;
/**
 * Clear all history
 * Convenience function for use outside React components
 */
export declare function clearAllHistory(): void;
/**
 * Clear page-scoped history
 * Call this on navigation to clean up form edits
 */
export declare function clearPageScopedHistory(): void;
export {};
//# sourceMappingURL=history.store.d.ts.map
