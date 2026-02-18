/**
 * Change Set State Store
 * Manages active change sets for atomic multi-resource operations
 *
 * Features:
 * - Track multiple change sets per router
 * - Active change set management
 * - Item manipulation (add, update, remove)
 * - Status tracking
 * - Session persistence (survives page refresh)
 * - Redux DevTools integration
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetStatus,
  ChangeSetSummary,
  ChangeOperation,
  ChangeSetItemStatus,
} from '@nasnet/core/types';
import { ChangeSetStatus as CS } from '@nasnet/core/types';
import {
  topologicalSort,
  buildDependencyGraph,
  computeApplyOrder,
} from '@nasnet/core/utils';

// =============================================================================
// Types
// =============================================================================

/**
 * Map of change set ID to change set
 */
export type ChangeSetMap = Map<string, ChangeSet>;

/**
 * Change set store state
 */
export interface ChangeSetState {
  /**
   * All active change sets indexed by ID
   */
  changeSets: Record<string, ChangeSet>;

  /**
   * Currently selected/active change set ID (for UI focus)
   */
  activeChangeSetId: string | null;

  /**
   * Change sets being applied (for optimistic UI)
   */
  applyingChangeSetIds: string[];

  /**
   * Last error message
   */
  lastError: string | null;
}

/**
 * Change set store actions
 */
export interface ChangeSetActions {
  // ===== Change Set Lifecycle =====

  /**
   * Create a new change set
   * @returns The new change set ID
   */
  createChangeSet: (params: {
    name: string;
    description?: string;
    routerId: string;
    source?: string;
  }) => string;

  /**
   * Get a change set by ID
   */
  getChangeSet: (id: string) => ChangeSet | null;

  /**
   * Get all change sets for a router
   */
  getChangeSetsForRouter: (routerId: string) => ChangeSet[];

  /**
   * Delete a change set (only if not applying)
   */
  deleteChangeSet: (id: string) => boolean;

  /**
   * Set the active change set
   */
  setActiveChangeSet: (id: string | null) => void;

  // ===== Item Management =====

  /**
   * Add an item to a change set
   */
  addItem: (
    changeSetId: string,
    item: Omit<ChangeSetItem, 'id' | 'status' | 'applyOrder' | 'applyStartedAt' | 'applyCompletedAt' | 'confirmedState' | 'error'>
  ) => string;

  /**
   * Update an item in a change set
   */
  updateItem: (
    changeSetId: string,
    itemId: string,
    updates: Partial<Pick<ChangeSetItem, 'name' | 'description' | 'configuration' | 'dependencies'>>
  ) => void;

  /**
   * Remove an item from a change set
   */
  removeItem: (changeSetId: string, itemId: string) => void;

  /**
   * Reorder dependencies for an item
   */
  setItemDependencies: (
    changeSetId: string,
    itemId: string,
    dependencies: string[]
  ) => void;

  // ===== Status Updates =====

  /**
   * Update change set status
   */
  updateStatus: (changeSetId: string, status: ChangeSetStatus) => void;

  /**
   * Update item status
   */
  updateItemStatus: (
    changeSetId: string,
    itemId: string,
    status: ChangeSetItemStatus,
    error?: string
  ) => void;

  /**
   * Mark change set as applying
   */
  markApplying: (changeSetId: string) => void;

  /**
   * Mark change set as completed
   */
  markCompleted: (changeSetId: string) => void;

  /**
   * Mark change set as failed
   */
  markFailed: (changeSetId: string, error: string, failedItemId: string) => void;

  /**
   * Mark change set as rolled back
   */
  markRolledBack: (changeSetId: string) => void;

  // ===== Validation =====

  /**
   * Recalculate apply order based on dependencies
   */
  recalculateApplyOrder: (changeSetId: string) => void;

  // ===== Utilities =====

  /**
   * Get summary for display in lists
   */
  getChangeSetSummary: (id: string) => ChangeSetSummary | null;

  /**
   * Get all summaries for a router
   */
  getAllSummaries: (routerId: string) => ChangeSetSummary[];

  /**
   * Clear all completed/failed change sets
   */
  clearCompleted: (routerId?: string) => void;

  /**
   * Clear error
   */
  clearError: () => void;

  /**
   * Reset store (for testing)
   */
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: ChangeSetState = {
  changeSets: {},
  activeChangeSetId: null,
  applyingChangeSetIds: [],
  lastError: null,
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a unique ID (simple ULID-like)
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${random}`;
}

/**
 * Calculate operation counts for a change set
 */
function getOperationCounts(items: ChangeSetItem[]): { create: number; update: number; delete: number } {
  return items.reduce(
    (acc, item) => {
      if (item.operation === 'CREATE') acc.create++;
      else if (item.operation === 'UPDATE') acc.update++;
      else if (item.operation === 'DELETE') acc.delete++;
      return acc;
    },
    { create: 0, update: 0, delete: 0 }
  );
}

// =============================================================================
// Store
// =============================================================================

/**
 * Zustand store for change set management
 *
 * Usage:
 * ```tsx
 * const { createChangeSet, addItem, getChangeSet } = useChangeSetStore();
 *
 * // Create a new change set
 * const id = createChangeSet({
 *   name: 'Create LAN Network',
 *   routerId: 'router-123',
 *   source: 'lan-wizard'
 * });
 *
 * // Add items
 * addItem(id, {
 *   name: 'Bridge Interface',
 *   resourceType: 'network.bridge',
 *   operation: 'CREATE',
 *   configuration: { name: 'bridge-lan' },
 *   dependencies: []
 * });
 *
 * // Get for display
 * const changeSet = getChangeSet(id);
 * ```
 */
export const useChangeSetStore = create<ChangeSetState & ChangeSetActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialState,

        // ===== Change Set Lifecycle =====

        createChangeSet: ({ name, description, routerId, source }) => {
          const id = generateId();
          const now = new Date();

          const newChangeSet: ChangeSet = {
            id,
            name,
            description,
            routerId,
            items: [],
            status: CS.DRAFT,
            validation: null,
            rollbackPlan: [],
            error: null,
            createdAt: now,
            applyStartedAt: null,
            completedAt: null,
            source,
            version: 1,
          };

          set(
            (state) => ({
              changeSets: {
                ...state.changeSets,
                [id]: newChangeSet,
              },
              activeChangeSetId: id,
            }),
            false,
            'createChangeSet'
          );

          return id;
        },

        getChangeSet: (id) => get().changeSets[id] ?? null,

        getChangeSetsForRouter: (routerId) =>
          Object.values(get().changeSets).filter((cs) => cs.routerId === routerId),

        deleteChangeSet: (id) => {
          const cs = get().changeSets[id];
          if (!cs) return false;

          // Don't delete if applying
          if (cs.status === CS.APPLYING || cs.status === CS.ROLLING_BACK) {
            set({ lastError: 'Cannot delete change set while applying' });
            return false;
          }

          set(
            (state) => {
              const { [id]: removed, ...rest } = state.changeSets;
              return {
                changeSets: rest,
                activeChangeSetId:
                  state.activeChangeSetId === id ? null : state.activeChangeSetId,
              };
            },
            false,
            'deleteChangeSet'
          );

          return true;
        },

        setActiveChangeSet: (id) =>
          set({ activeChangeSetId: id }, false, 'setActiveChangeSet'),

        // ===== Item Management =====

        addItem: (changeSetId, item) => {
          const itemId = generateId();

          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs || cs.status !== CS.DRAFT) return state;

              const newItem: ChangeSetItem = {
                id: itemId,
                resourceType: item.resourceType,
                resourceCategory: item.resourceCategory,
                resourceUuid: item.resourceUuid,
                name: item.name,
                description: item.description,
                operation: item.operation,
                configuration: item.configuration,
                previousState: item.previousState,
                dependencies: item.dependencies,
                status: 'PENDING' as ChangeSetItemStatus,
                error: null,
                applyStartedAt: null,
                applyCompletedAt: null,
                confirmedState: null,
                applyOrder: cs.items.length,
              };

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    items: [...cs.items, newItem],
                    version: cs.version + 1,
                  },
                },
              };
            },
            false,
            'addItem'
          );

          // Recalculate apply order
          get().recalculateApplyOrder(changeSetId);

          return itemId;
        },

        updateItem: (changeSetId, itemId, updates) => {
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs || cs.status !== CS.DRAFT) return state;

              const items = cs.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              );

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    items,
                    version: cs.version + 1,
                  },
                },
              };
            },
            false,
            'updateItem'
          );

          // Recalculate if dependencies changed
          if (updates.dependencies) {
            get().recalculateApplyOrder(changeSetId);
          }
        },

        removeItem: (changeSetId, itemId) => {
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs || cs.status !== CS.DRAFT) return state;

              // Remove item and any dependencies on it
              const items = cs.items
                .filter((item) => item.id !== itemId)
                .map((item) => ({
                  ...item,
                  dependencies: item.dependencies.filter((d) => d !== itemId),
                }));

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    items,
                    version: cs.version + 1,
                  },
                },
              };
            },
            false,
            'removeItem'
          );

          get().recalculateApplyOrder(changeSetId);
        },

        setItemDependencies: (changeSetId, itemId, dependencies) => {
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs || cs.status !== CS.DRAFT) return state;

              const items = cs.items.map((item) =>
                item.id === itemId ? { ...item, dependencies } : item
              );

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    items,
                    version: cs.version + 1,
                  },
                },
              };
            },
            false,
            'setItemDependencies'
          );

          get().recalculateApplyOrder(changeSetId);
        },

        // ===== Status Updates =====

        updateStatus: (changeSetId, status) =>
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs) return state;

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    status,
                    version: cs.version + 1,
                  },
                },
              };
            },
            false,
            `updateStatus/${status}`
          ),

        updateItemStatus: (changeSetId, itemId, status, error) =>
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs) return state;

              const now = new Date();
              const items = cs.items.map((item) => {
                if (item.id !== itemId) return item;

                return {
                  ...item,
                  status,
                  error: error ?? null,
                  applyStartedAt:
                    status === 'APPLYING' ? now : item.applyStartedAt,
                  applyCompletedAt:
                    status === 'APPLIED' || status === 'FAILED'
                      ? now
                      : item.applyCompletedAt,
                };
              });

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: { ...cs, items },
                },
              };
            },
            false,
            `updateItemStatus/${status}`
          ),

        markApplying: (changeSetId) =>
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs) return state;

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    status: CS.APPLYING,
                    applyStartedAt: new Date(),
                  },
                },
                applyingChangeSetIds: [...state.applyingChangeSetIds, changeSetId],
              };
            },
            false,
            'markApplying'
          ),

        markCompleted: (changeSetId) =>
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs) return state;

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    status: CS.COMPLETED,
                    completedAt: new Date(),
                  },
                },
                applyingChangeSetIds: state.applyingChangeSetIds.filter(
                  (id) => id !== changeSetId
                ),
              };
            },
            false,
            'markCompleted'
          ),

        markFailed: (changeSetId, errorMessage, failedItemId) =>
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs) return state;

              const partiallyAppliedItemIds = cs.items
                .filter((item) => item.status === 'APPLIED')
                .map((item) => item.id);

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    status: CS.FAILED,
                    completedAt: new Date(),
                    error: {
                      message: errorMessage,
                      failedItemId,
                      partiallyAppliedItemIds,
                      failedRollbackItemIds: [],
                      requiresManualIntervention: false,
                    },
                  },
                },
                applyingChangeSetIds: state.applyingChangeSetIds.filter(
                  (id) => id !== changeSetId
                ),
                lastError: errorMessage,
              };
            },
            false,
            'markFailed'
          ),

        markRolledBack: (changeSetId) =>
          set(
            (state) => {
              const cs = state.changeSets[changeSetId];
              if (!cs) return state;

              // Update all applied items to rolled back
              const items = cs.items.map((item) =>
                item.status === 'APPLIED'
                  ? { ...item, status: 'ROLLED_BACK' as ChangeSetItemStatus }
                  : item
              );

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: {
                    ...cs,
                    status: CS.ROLLED_BACK,
                    items,
                    completedAt: new Date(),
                  },
                },
                applyingChangeSetIds: state.applyingChangeSetIds.filter(
                  (id) => id !== changeSetId
                ),
              };
            },
            false,
            'markRolledBack'
          ),

        // ===== Validation =====

        recalculateApplyOrder: (changeSetId) => {
          const cs = get().changeSets[changeSetId];
          if (!cs) return;

          const nodes = buildDependencyGraph(cs.items);
          const orderMap = computeApplyOrder(nodes);

          set(
            (state) => {
              const currentCs = state.changeSets[changeSetId];
              if (!currentCs) return state;

              const items = currentCs.items.map((item) => ({
                ...item,
                applyOrder: orderMap.get(item.id) ?? item.applyOrder,
              }));

              return {
                changeSets: {
                  ...state.changeSets,
                  [changeSetId]: { ...currentCs, items },
                },
              };
            },
            false,
            'recalculateApplyOrder'
          );
        },

        // ===== Utilities =====

        getChangeSetSummary: (id) => {
          const cs = get().changeSets[id];
          if (!cs) return null;

          const operationCounts = getOperationCounts(cs.items);
          const hasErrors = (cs.validation?.errors?.length ?? 0) > 0;
          const hasWarnings = (cs.validation?.warnings?.length ?? 0) > 0;

          return {
            id: cs.id,
            name: cs.name,
            status: cs.status,
            operationCounts,
            totalItems: cs.items.length,
            createdAt: cs.createdAt,
            hasErrors,
            hasWarnings,
          };
        },

        getAllSummaries: (routerId) => {
          const { changeSets, getChangeSetSummary } = get();
          return Object.values(changeSets)
            .filter((cs) => cs.routerId === routerId)
            .map((cs) => getChangeSetSummary(cs.id))
            .filter((s): s is ChangeSetSummary => s !== null);
        },

        clearCompleted: (routerId) =>
          set(
            (state) => {
              const changeSets = Object.fromEntries(
                Object.entries(state.changeSets).filter(([, cs]) => {
                  // Keep if not completed/failed
                  if (
                    cs.status !== CS.COMPLETED &&
                    cs.status !== CS.FAILED &&
                    cs.status !== CS.ROLLED_BACK &&
                    cs.status !== CS.CANCELLED
                  ) {
                    return true;
                  }
                  // Keep if router filter doesn't match
                  if (routerId && cs.routerId !== routerId) {
                    return true;
                  }
                  return false;
                })
              );

              return { changeSets };
            },
            false,
            'clearCompleted'
          ),

        clearError: () => set({ lastError: null }, false, 'clearError'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'nasnet-change-sets',
        version: 1,
        partialize: (state) => ({
          // Only persist draft change sets
          changeSets: Object.fromEntries(
            Object.entries(state.changeSets).filter(
              ([, cs]) => cs.status === CS.DRAFT || cs.status === CS.READY
            )
          ),
          activeChangeSetId: state.activeChangeSetId,
        }),
      }
    ),
    {
      name: 'change-set-store',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select active change set
 */
export const selectActiveChangeSet = (state: ChangeSetState) => {
  if (!state.activeChangeSetId) return null;
  return state.changeSets[state.activeChangeSetId] ?? null;
};

/**
 * Select all change sets for a router
 */
export const createSelectChangeSetsForRouter =
  (routerId: string) => (state: ChangeSetState) =>
    Object.values(state.changeSets).filter((cs) => cs.routerId === routerId);

/**
 * Select draft change sets for a router
 */
export const createSelectDraftChangeSets =
  (routerId: string) => (state: ChangeSetState) =>
    Object.values(state.changeSets).filter(
      (cs) => cs.routerId === routerId && cs.status === CS.DRAFT
    );

/**
 * Select applying change sets
 */
export const selectApplyingChangeSets = (state: ChangeSetState) =>
  state.applyingChangeSetIds.map((id) => state.changeSets[id]).filter(Boolean);

/**
 * Select if any change set is applying
 */
export const selectIsAnyApplying = (state: ChangeSetState) =>
  state.applyingChangeSetIds.length > 0;

/**
 * Get store state outside of React
 */
export const getChangeSetState = () => useChangeSetStore.getState();

/**
 * Subscribe to store changes outside of React
 */
export const subscribeChangeSetState = useChangeSetStore.subscribe;
