import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetStatus,
  ChangeSetSummary,
  ChangeSetItemStatus,
} from '@nasnet/core/types';
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
  /**
   * Add an item to a change set
   */
  addItem: (
    changeSetId: string,
    item: Omit<
      ChangeSetItem,
      | 'id'
      | 'status'
      | 'applyOrder'
      | 'applyStartedAt'
      | 'applyCompletedAt'
      | 'confirmedState'
      | 'error'
    >
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
  setItemDependencies: (changeSetId: string, itemId: string, dependencies: string[]) => void;
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
  /**
   * Recalculate apply order based on dependencies
   */
  recalculateApplyOrder: (changeSetId: string) => void;
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
export declare const useChangeSetStore: import('zustand').UseBoundStore<
  Omit<
    Omit<import('zustand').StoreApi<ChangeSetState & ChangeSetActions>, 'setState'> & {
      setState<
        A extends
          | string
          | {
              type: string;
            },
      >(
        partial:
          | (ChangeSetState & ChangeSetActions)
          | Partial<ChangeSetState & ChangeSetActions>
          | ((
              state: ChangeSetState & ChangeSetActions
            ) => (ChangeSetState & ChangeSetActions) | Partial<ChangeSetState & ChangeSetActions>),
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
            ChangeSetState & ChangeSetActions,
            {
              changeSets: {
                [k: string]: ChangeSet<Record<string, unknown>>;
              };
              activeChangeSetId: string | null;
            }
          >
        >
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: ChangeSetState & ChangeSetActions) => void) => () => void;
      onFinishHydration: (fn: (state: ChangeSetState & ChangeSetActions) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<
          ChangeSetState & ChangeSetActions,
          {
            changeSets: {
              [k: string]: ChangeSet<Record<string, unknown>>;
            };
            activeChangeSetId: string | null;
          }
        >
      >;
    };
  }
>;
/**
 * Select active change set
 */
export declare const selectActiveChangeSet: (
  state: ChangeSetState
) => ChangeSet<Record<string, unknown>> | null;
/**
 * Select all change sets for a router
 */
export declare const createSelectChangeSetsForRouter: (
  routerId: string
) => (state: ChangeSetState) => ChangeSet<Record<string, unknown>>[];
/**
 * Select draft change sets for a router
 */
export declare const createSelectDraftChangeSets: (
  routerId: string
) => (state: ChangeSetState) => ChangeSet<Record<string, unknown>>[];
/**
 * Select applying change sets
 */
export declare const selectApplyingChangeSets: (
  state: ChangeSetState
) => ChangeSet<Record<string, unknown>>[];
/**
 * Select if any change set is applying
 */
export declare const selectIsAnyApplying: (state: ChangeSetState) => boolean;
/**
 * Get store state outside of React
 */
export declare const getChangeSetState: () => ChangeSetState & ChangeSetActions;
/**
 * Subscribe to store changes outside of React
 */
export declare const subscribeChangeSetState: (
  listener: (
    state: ChangeSetState & ChangeSetActions,
    prevState: ChangeSetState & ChangeSetActions
  ) => void
) => () => void;
//# sourceMappingURL=change-set.store.d.ts.map
