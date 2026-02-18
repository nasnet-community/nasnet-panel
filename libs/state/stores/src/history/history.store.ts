/**
 * History State Store
 * Manages undo/redo history with command pattern
 *
 * Features:
 * - Undo/redo with arbitrary depth (max 50 actions)
 * - Page-local vs global action scopes
 * - Session persistence for global actions
 * - Redux DevTools integration
 * - Jump to any point in history
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type {
  UndoableAction,
  UndoableActionInput,
  HistoryState,
  HistoryActions,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Maximum number of actions to keep in history
 * Oldest actions are removed when limit is exceeded
 */
export const MAX_ACTIONS = 50;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique action ID
 */
function generateActionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `action-${timestamp}-${random}`;
}

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
 * Convert action to serialized form for localStorage
 * Note: execute/undo functions are not persisted
 */
function serializeAction(action: UndoableAction): SerializedAction {
  return {
    id: action.id,
    type: action.type,
    description: action.description,
    timestamp: action.timestamp.toISOString(),
    scope: action.scope,
    resourceId: action.resourceId,
    resourceType: action.resourceType,
  };
}

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Initial state
 */
const initialState: HistoryState = {
  past: [],
  future: [],
};

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
export const useHistoryStore = create<HistoryState & HistoryActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialState,

        // ===== Actions =====

        pushAction: (action) => {
          const id = generateActionId();
          const now = new Date();

          const newAction: UndoableAction = {
            ...action,
            id,
            timestamp: now,
          };

          set(
            (state) => {
              // Add to past, clear future (branching)
              let newPast = [...state.past, newAction];

              // Trim to MAX_ACTIONS limit
              if (newPast.length > MAX_ACTIONS) {
                newPast = newPast.slice(-MAX_ACTIONS);
              }

              return {
                past: newPast,
                future: [], // Clear future on new action
              };
            },
            false,
            `pushAction/${action.type}`
          );

          return id;
        },

        undo: async () => {
          const { past, future } = get();

          if (past.length === 0) {
            return false;
          }

          const action = past[past.length - 1];

          try {
            // Execute the undo operation
            await action.undo();

            // Update state
            set(
              {
                past: past.slice(0, -1),
                future: [action, ...future],
              },
              false,
              `undo/${action.description}`
            );

            return true;
          } catch (error) {
            console.error('[history-store] Undo failed:', error);
            return false;
          }
        },

        redo: async () => {
          const { past, future } = get();

          if (future.length === 0) {
            return false;
          }

          const action = future[0];

          try {
            // Execute the action
            await action.execute();

            // Update state
            set(
              {
                past: [...past, action],
                future: future.slice(1),
              },
              false,
              `redo/${action.description}`
            );

            return true;
          } catch (error) {
            console.error('[history-store] Redo failed:', error);
            return false;
          }
        },

        jumpToIndex: async (targetIndex) => {
          const { past, future } = get();
          const currentIndex = past.length - 1;

          if (targetIndex < 0 || targetIndex > past.length + future.length - 1) {
            console.warn('[history-store] Invalid jump index:', targetIndex);
            return;
          }

          if (targetIndex === currentIndex) {
            return; // Already at target
          }

          try {
            if (targetIndex < currentIndex) {
              // Undo multiple actions
              const undoCount = currentIndex - targetIndex;
              for (let i = 0; i < undoCount; i++) {
                const success = await get().undo();
                if (!success) break;
              }
            } else {
              // Redo multiple actions
              const redoCount = targetIndex - currentIndex;
              for (let i = 0; i < redoCount; i++) {
                const success = await get().redo();
                if (!success) break;
              }
            }
          } catch (error) {
            console.error('[history-store] Jump failed:', error);
          }
        },

        clearHistory: () =>
          set({ past: [], future: [] }, false, 'clearHistory'),

        clearPageHistory: () =>
          set(
            (state) => ({
              past: state.past.filter((a) => a.scope === 'global'),
              future: state.future.filter((a) => a.scope === 'global'),
            }),
            false,
            'clearPageHistory'
          ),
      }),
      {
        name: 'nasnet-history',
        version: 1,
        // Only persist global-scope actions (page-scope clears on navigation)
        // Note: Functions cannot be serialized, so we store metadata only
        partialize: (state) => ({
          past: state.past
            .filter((a) => a.scope === 'global')
            .map(serializeAction),
          future: state.future
            .filter((a) => a.scope === 'global')
            .map(serializeAction),
        }),
        // Custom storage to handle serialization properly
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              const data = JSON.parse(str);
              // Convert timestamp strings back to Date objects
              // Note: execute/undo functions are lost on reload
              if (data.state) {
                data.state.past = (data.state.past || []).map((a: SerializedAction) => ({
                  ...a,
                  timestamp: new Date(a.timestamp),
                  // Provide no-op functions for rehydrated actions
                  execute: () => {
                    console.warn('[history-store] Cannot re-execute persisted action');
                  },
                  undo: () => {
                    console.warn('[history-store] Cannot undo persisted action');
                  },
                }));
                data.state.future = (data.state.future || []).map((a: SerializedAction) => ({
                  ...a,
                  timestamp: new Date(a.timestamp),
                  execute: () => {
                    console.warn('[history-store] Cannot re-execute persisted action');
                  },
                  undo: () => {
                    console.warn('[history-store] Cannot undo persisted action');
                  },
                }));
              }
              return data;
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    {
      name: 'history-store',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select whether undo is available
 */
export const selectCanUndo = (state: HistoryState) => state.past.length > 0;

/**
 * Select whether redo is available
 */
export const selectCanRedo = (state: HistoryState) => state.future.length > 0;

/**
 * Select the most recent action in history
 */
export const selectLastAction = (state: HistoryState) =>
  state.past.length > 0 ? state.past[state.past.length - 1] : undefined;

/**
 * Select the total number of actions in past history
 */
export const selectHistoryLength = (state: HistoryState) => state.past.length;

/**
 * Select all past actions (for history panel display)
 */
export const selectPastActions = (state: HistoryState) => state.past;

/**
 * Select all future actions (for history panel display)
 */
export const selectFutureActions = (state: HistoryState) => state.future;

/**
 * Select current position in history (index of most recent action)
 */
export const selectCurrentPosition = (state: HistoryState) =>
  state.past.length - 1;

/**
 * Select total history length (past + future)
 */
export const selectTotalHistoryLength = (state: HistoryState) =>
  state.past.length + state.future.length;

// =============================================================================
// Helper Functions (Exported)
// =============================================================================

/**
 * Get history store state outside of React
 * Useful for imperative code or testing
 */
export const getHistoryState = () => useHistoryStore.getState();

/**
 * Subscribe to history store changes outside of React
 */
export const subscribeHistoryState = useHistoryStore.subscribe;

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Undo the last action
 * Convenience function for use outside React components
 * @returns true if undo was performed
 */
export async function undoLast(): Promise<boolean> {
  return useHistoryStore.getState().undo();
}

/**
 * Redo the last undone action
 * Convenience function for use outside React components
 * @returns true if redo was performed
 */
export async function redoLast(): Promise<boolean> {
  return useHistoryStore.getState().redo();
}

/**
 * Push an action to history
 * Convenience function for use outside React components
 * @param action - The action to push
 * @returns The generated action ID
 */
export function pushHistoryAction(action: UndoableActionInput): string {
  return useHistoryStore.getState().pushAction(action);
}

/**
 * Clear all history
 * Convenience function for use outside React components
 */
export function clearAllHistory(): void {
  useHistoryStore.getState().clearHistory();
}

/**
 * Clear page-scoped history
 * Call this on navigation to clean up form edits
 */
export function clearPageScopedHistory(): void {
  useHistoryStore.getState().clearPageHistory();
}
