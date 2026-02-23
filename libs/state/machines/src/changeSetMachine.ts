/**
 * Change Set Machine (Atomic Multi-Resource Operations)
 *
 * Orchestrates the lifecycle of atomic multi-resource operations.
 * Handles validation, dependency-ordered apply, progress tracking,
 * and rollback on failure.
 *
 * Machine States:
 * 1. idle           - No active operation
 * 2. validating     - Running validation on all items
 * 3. ready          - Validation passed, awaiting user confirmation
 * 4. applying       - Applying items in dependency order
 *    └─ applyingItem - Applying current item
 *    └─ checkingMore - Checking if more items to apply
 * 5. completed      - All items applied successfully
 * 6. rollingBack    - Rolling back applied items due to failure
 * 7. rolledBack     - Rollback completed
 * 8. failed         - Apply failed (with or without rollback)
 * 9. partialFailure - Rollback partially failed, manual intervention needed
 * 10. cancelled     - User cancelled the operation
 *
 * Safety Features:
 * - Cannot skip validation
 * - Dependency-ordered apply (topological sort)
 * - Automatic rollback on failure (in reverse order)
 * - Cancellation stops at safe point
 * - Progress tracking for UI updates
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 * @see ADR-002: State Management Strategy
 * @see ADR-012: Universal State v2
 */

import { setup, assign, fromPromise } from 'xstate';

import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetStatus,
  ChangeSetValidationResult,
  ChangeSetError,
  RollbackStep,
} from '@nasnet/core/types';
import { topologicalSort, reverseOrder, buildDependencyGraph } from '@nasnet/core/utils';

// =============================================================================
// Types
// =============================================================================

/**
 * Context for the change set machine
 */
export interface ChangeSetMachineContext {
  /** The change set being processed */
  changeSet: ChangeSet | null;

  /** Router ID for the operation */
  routerId: string | null;

  /** Validation result */
  validationResult: ChangeSetValidationResult | null;

  /** Current item index in sorted apply order */
  currentItemIndex: number;

  /** Items in apply order (topologically sorted) */
  sortedItems: ChangeSetItem[];

  /** Items that have been applied */
  appliedItems: ChangeSetItem[];

  /** Rollback plan (populated as items are applied) */
  rollbackPlan: RollbackStep[];

  /** Error information */
  error: ChangeSetError | null;

  /** Error message for simple errors */
  errorMessage: string | null;

  /** Whether cancellation was requested */
  cancelRequested: boolean;

  /** Apply start time */
  applyStartedAt: number | null;

  /** Progress callbacks */
  onProgress?: (event: ChangeSetProgressEvent) => void;
}

/**
 * Events for the change set machine
 */
export type ChangeSetMachineEvent =
  | { type: 'LOAD'; changeSet: ChangeSet; routerId: string }
  | { type: 'START_VALIDATION' }
  | { type: 'APPLY' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'FORCE_ROLLBACK' };

/**
 * Progress event emitted during apply
 */
export interface ChangeSetProgressEvent {
  changeSetId: string;
  status: 'validating' | 'applying' | 'completed' | 'rolling_back' | 'failed';
  currentItem: {
    id: string;
    name: string;
    index: number;
  } | null;
  appliedCount: number;
  totalCount: number;
  progressPercent: number;
  error: string | null;
}

/**
 * Configuration for creating the change set machine
 */
export interface ChangeSetMachineConfig {
  /**
   * Unique machine ID
   */
  id?: string;

  /**
   * Validate all items in the change set
   */
  validateChangeSet: (changeSet: ChangeSet) => Promise<ChangeSetValidationResult>;

  /**
   * Apply a single item to the router
   * Returns the confirmed state from the router
   */
  applyItem: (params: {
    item: ChangeSetItem;
    routerId: string;
  }) => Promise<{ confirmedState: Record<string, unknown>; resourceUuid?: string }>;

  /**
   * Rollback a single item
   */
  rollbackItem: (params: {
    rollbackStep: RollbackStep;
    routerId: string;
  }) => Promise<void>;

  /**
   * Callback when validation completes
   */
  onValidationComplete?: (result: ChangeSetValidationResult) => void;

  /**
   * Callback for progress updates
   */
  onProgress?: (event: ChangeSetProgressEvent) => void;

  /**
   * Callback when apply completes successfully
   */
  onComplete?: (changeSet: ChangeSet) => void;

  /**
   * Callback when apply fails
   */
  onFailed?: (error: ChangeSetError) => void;

  /**
   * Callback when rollback completes
   */
  onRolledBack?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sort items by dependency order
 */
function sortItemsByDependency(items: ChangeSetItem[]): ChangeSetItem[] {
  const nodes = buildDependencyGraph(items);
  const result = topologicalSort(nodes);

  if (!result.success) {
    // If cycle detected, return original order (validation should catch this)
    return items;
  }

  // Map sorted IDs back to items
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return [...result.sortedIds].map((id) => itemMap.get(id)!).filter(Boolean);
}

/**
 * Create rollback step from applied item
 */
function createRollbackStep(
  item: ChangeSetItem,
  confirmedResourceUuid?: string
): RollbackStep {
  let operation: RollbackStep['operation'];

  switch (item.operation) {
    case 'CREATE':
      operation = 'DELETE';
      break;
    case 'UPDATE':
      operation = 'REVERT';
      break;
    case 'DELETE':
      operation = 'RESTORE';
      break;
    default:
      operation = 'REVERT';
  }

  return {
    itemId: item.id,
    operation,
    restoreState: item.previousState,
    resourceUuid: confirmedResourceUuid ?? item.resourceUuid,
    success: false,
    error: null,
    rollbackOrder: 0, // Will be calculated when building full plan
  };
}

// =============================================================================
// Machine Factory
// =============================================================================

/**
 * Create a change set machine for orchestrating atomic multi-resource operations
 *
 * @example
 * ```ts
 * const changeSetMachine = createChangeSetMachine({
 *   validateChangeSet: async (changeSet) => {
 *     const response = await api.validateChangeSet(changeSet);
 *     return response.data.validation;
 *   },
 *   applyItem: async ({ item, routerId }) => {
 *     const response = await api.applyResource({
 *       routerId,
 *       resourceType: item.resourceType,
 *       configuration: item.configuration,
 *       operation: item.operation,
 *     });
 *     return {
 *       confirmedState: response.data.confirmedState,
 *       resourceUuid: response.data.resourceUuid,
 *     };
 *   },
 *   rollbackItem: async ({ rollbackStep, routerId }) => {
 *     await api.rollbackResource({
 *       routerId,
 *       ...rollbackStep,
 *     });
 *   },
 *   onComplete: (changeSet) => {
 *     toast.success(`Applied ${changeSet.items.length} changes`);
 *   },
 * });
 *
 * // Usage with useActor
 * const [state, send] = useActor(changeSetMachine);
 *
 * send({ type: 'LOAD', changeSet, routerId });
 * send({ type: 'START_VALIDATION' });
 * // After validation passes...
 * send({ type: 'APPLY' });
 * ```
 */
export function createChangeSetMachine(config: ChangeSetMachineConfig) {
  const {
    id = 'changeSet',
    validateChangeSet,
    applyItem,
    rollbackItem,
    onValidationComplete,
    onProgress,
    onComplete,
    onFailed,
    onRolledBack,
  } = config;

  return setup({
    types: {} as {
      context: ChangeSetMachineContext;
      events: ChangeSetMachineEvent;
    },
    actors: {
      validateAll: fromPromise<ChangeSetValidationResult, ChangeSet>(
        async ({ input }) => {
          return validateChangeSet(input);
        }
      ),
      applyCurrentItem: fromPromise<
        { confirmedState: Record<string, unknown>; resourceUuid?: string },
        { item: ChangeSetItem; routerId: string }
      >(async ({ input }) => {
        return applyItem(input);
      }),
      executeRollback: fromPromise<
        void,
        { rollbackPlan: RollbackStep[]; routerId: string }
      >(async ({ input }) => {
        const { rollbackPlan, routerId } = input;

        // Execute rollback in reverse order
        for (const step of rollbackPlan) {
          try {
            await rollbackItem({ rollbackStep: step, routerId });
            Object.assign(step, { success: true });
          } catch (error) {
            Object.assign(step, {
              success: false,
              error: error instanceof Error ? error.message : 'Rollback failed',
            });
            // Continue with remaining items even if one fails
          }
        }
      }),
    },
    guards: {
      hasMoreItems: ({ context }) =>
        context.currentItemIndex < context.sortedItems.length,
      noMoreItems: ({ context }) =>
        context.currentItemIndex >= context.sortedItems.length,
      canApply: ({ context }) =>
        context.validationResult?.canApply === true &&
        context.sortedItems.length > 0,
      hasAppliedItems: ({ context }) => context.appliedItems.length > 0,
      isCancelled: ({ context }) => context.cancelRequested,
      hasValidationErrors: ({ context }) =>
        (context.validationResult?.errors.length ?? 0) > 0,
    },
    actions: {
      loadChangeSet: assign({
        changeSet: ({ event }) =>
          event.type === 'LOAD' ? event.changeSet : null,
        routerId: ({ event }) =>
          event.type === 'LOAD' ? event.routerId : null,
        sortedItems: ({ event }) =>
          event.type === 'LOAD'
            ? sortItemsByDependency([...event.changeSet.items])
            : [],
        currentItemIndex: 0,
        appliedItems: [],
        rollbackPlan: [],
        error: null,
        errorMessage: null,
        cancelRequested: false,
        applyStartedAt: null,
      }),
      setValidationResult: assign({
        validationResult: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event
          ) {
            return event.output as ChangeSetValidationResult;
          }
          return null;
        },
      }),
      notifyValidationComplete: ({ context }) => {
        if (context.validationResult) {
          onValidationComplete?.(context.validationResult);
        }
      },
      startApply: assign({
        applyStartedAt: () => Date.now(),
      }),
      recordApplied: assign({
        appliedItems: ({ context, event }) => {
          const currentItem = context.sortedItems[context.currentItemIndex];
          if (!currentItem) return context.appliedItems;

          let confirmedState: Record<string, unknown> | null = null;
          let resourceUuid: string | undefined;

          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event
          ) {
            const output = event.output as {
              confirmedState: Record<string, unknown>;
              resourceUuid?: string;
            };
            confirmedState = output.confirmedState;
            resourceUuid = output.resourceUuid;
          }

          return [
            ...context.appliedItems,
            { ...currentItem, confirmedState, resourceUuid: resourceUuid ?? currentItem.resourceUuid },
          ];
        },
        rollbackPlan: ({ context, event }) => {
          const currentItem = context.sortedItems[context.currentItemIndex];
          if (!currentItem) return context.rollbackPlan;

          let resourceUuid: string | undefined;
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event
          ) {
            resourceUuid = (event.output as { resourceUuid?: string }).resourceUuid;
          }

          const rollbackStep = createRollbackStep(currentItem, resourceUuid);
          const stepWithOrder = { ...rollbackStep, rollbackOrder: context.rollbackPlan.length };

          // Insert at beginning (reverse order)
          return [stepWithOrder, ...context.rollbackPlan];
        },
      }),
      nextItem: assign({
        currentItemIndex: ({ context }) => context.currentItemIndex + 1,
      }),
      setError: assign({
        error: ({ context, event }) => {
          const currentItem = context.sortedItems[context.currentItemIndex];
          let errorMessage = 'An unknown error occurred';

          if (
            typeof event === 'object' &&
            event !== null &&
            'error' in event &&
            event.error instanceof Error
          ) {
            errorMessage = event.error.message;
          }

          const error: ChangeSetError = {
            message: errorMessage,
            failedItemId: currentItem?.id ?? 'unknown',
            partiallyAppliedItemIds: context.appliedItems.map((i) => i.id),
            failedRollbackItemIds: [],
            requiresManualIntervention: false,
          };

          return error;
        },
        errorMessage: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'error' in event &&
            event.error instanceof Error
          ) {
            return event.error.message;
          }
          return 'An unknown error occurred';
        },
      }),
      setValidationError: assign({
        errorMessage: () => 'Validation failed. Please fix errors and try again.',
      }),
      markCancelRequested: assign({
        cancelRequested: true,
      }),
      checkRollbackResults: assign({
        error: ({ context }) => {
          if (!context.error) return null;

          const failedRollbackItemIds = context.rollbackPlan
            .filter((step) => !step.success)
            .map((step) => step.itemId);

          return {
            ...context.error,
            failedRollbackItemIds,
            requiresManualIntervention: failedRollbackItemIds.length > 0,
          };
        },
      }),
      notifyProgress: ({ context }) => {
        if (!context.changeSet || !onProgress) return;

        const currentItem = context.sortedItems[context.currentItemIndex];
        const totalCount = context.sortedItems.length;
        const appliedCount = context.appliedItems.length;

        onProgress({
          changeSetId: context.changeSet.id,
          status: 'applying',
          currentItem: currentItem
            ? {
                id: currentItem.id,
                name: currentItem.name,
                index: context.currentItemIndex,
              }
            : null,
          appliedCount,
          totalCount,
          progressPercent: totalCount > 0 ? (appliedCount / totalCount) * 100 : 0,
          error: null,
        });
      },
      notifyComplete: ({ context }) => {
        if (context.changeSet) {
          onComplete?.(context.changeSet);
        }
      },
      notifyFailed: ({ context }) => {
        if (context.error) {
          onFailed?.(context.error);
        }
      },
      notifyRolledBack: () => {
        onRolledBack?.();
      },
      resetMachine: assign({
        changeSet: null,
        routerId: null,
        validationResult: null,
        currentItemIndex: 0,
        sortedItems: [],
        appliedItems: [],
        rollbackPlan: [],
        error: null,
        errorMessage: null,
        cancelRequested: false,
        applyStartedAt: null,
      }),
    },
  }).createMachine({
    id,
    initial: 'idle',
    context: {
      changeSet: null,
      routerId: null,
      validationResult: null,
      currentItemIndex: 0,
      sortedItems: [],
      appliedItems: [],
      rollbackPlan: [],
      error: null,
      errorMessage: null,
      cancelRequested: false,
      applyStartedAt: null,
      onProgress,
    },
    states: {
      idle: {
        description: 'No active change set',
        on: {
          LOAD: {
            target: 'idle',
            actions: 'loadChangeSet',
          },
          START_VALIDATION: {
            target: 'validating',
          },
        },
      },
      validating: {
        description: 'Validating all items in the change set',
        invoke: {
          src: 'validateAll',
          input: ({ context }) => context.changeSet!,
          onDone: [
            {
              target: 'idle',
              guard: 'hasValidationErrors',
              actions: ['setValidationResult', 'setValidationError', 'notifyValidationComplete'],
            },
            {
              target: 'ready',
              actions: ['setValidationResult', 'notifyValidationComplete'],
            },
          ],
          onError: {
            target: 'failed',
            actions: 'setError',
          },
        },
        on: {
          CANCEL: {
            target: 'cancelled',
          },
        },
      },
      ready: {
        description: 'Validation passed, ready to apply',
        on: {
          APPLY: {
            target: 'applying',
            guard: 'canApply',
            actions: 'startApply',
          },
          CANCEL: {
            target: 'cancelled',
          },
          RESET: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
      applying: {
        description: 'Applying items in dependency order',
        initial: 'applyingItem',
        states: {
          applyingItem: {
            description: 'Applying current item',
            entry: 'notifyProgress',
            invoke: {
              src: 'applyCurrentItem',
              input: ({ context }) => ({
                item: context.sortedItems[context.currentItemIndex],
                routerId: context.routerId!,
              }),
              onDone: {
                target: 'checkingMore',
                actions: 'recordApplied',
              },
              onError: {
                target: '#changeSet.rollingBack',
                actions: 'setError',
              },
            },
          },
          checkingMore: {
            description: 'Checking if more items to apply',
            always: [
              {
                target: '#changeSet.cancelled',
                guard: 'isCancelled',
              },
              {
                target: 'applyingItem',
                guard: 'hasMoreItems',
                actions: 'nextItem',
              },
              {
                target: '#changeSet.completed',
                guard: 'noMoreItems',
              },
            ],
          },
        },
        on: {
          CANCEL: {
            actions: 'markCancelRequested',
          },
        },
      },
      completed: {
        description: 'All items applied successfully',
        type: 'final',
        entry: 'notifyComplete',
      },
      rollingBack: {
        description: 'Rolling back applied items',
        invoke: {
          src: 'executeRollback',
          input: ({ context }) => ({
            rollbackPlan: context.rollbackPlan,
            routerId: context.routerId!,
          }),
          onDone: [
            {
              target: 'partialFailure',
              actions: 'checkRollbackResults',
              guard: ({ context }) =>
                context.rollbackPlan.some((step) => !step.success),
            },
            {
              target: 'rolledBack',
            },
          ],
          onError: {
            target: 'partialFailure',
            actions: 'checkRollbackResults',
          },
        },
      },
      rolledBack: {
        description: 'Rollback completed successfully',
        type: 'final',
        entry: 'notifyRolledBack',
      },
      failed: {
        description: 'Apply failed (may need manual intervention)',
        entry: 'notifyFailed',
        on: {
          RETRY: {
            target: 'validating',
          },
          FORCE_ROLLBACK: {
            target: 'rollingBack',
            guard: 'hasAppliedItems',
          },
          RESET: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
      partialFailure: {
        description: 'Rollback partially failed - manual intervention required',
        type: 'final',
        entry: 'notifyFailed',
      },
      cancelled: {
        description: 'Operation cancelled by user',
        type: 'final',
        on: {
          FORCE_ROLLBACK: {
            target: 'rollingBack',
            guard: 'hasAppliedItems',
          },
          RESET: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
    },
  });
}

// =============================================================================
// State Helpers
// =============================================================================

/**
 * Change set machine state values
 */
export type ChangeSetMachineStateValue =
  | 'idle'
  | 'validating'
  | 'ready'
  | { applying: 'applyingItem' | 'checkingMore' }
  | 'completed'
  | 'rollingBack'
  | 'rolledBack'
  | 'failed'
  | 'partialFailure'
  | 'cancelled';

/**
 * Check if machine is in a processing state
 */
export function isChangeSetProcessing(
  state: string | { applying: string }
): boolean {
  if (typeof state === 'object') return true;
  return ['validating', 'rollingBack'].includes(state);
}

/**
 * Check if machine is in a final state
 */
export function isChangeSetFinal(state: string | object): boolean {
  if (typeof state === 'object') return false;
  return ['completed', 'rolledBack', 'failed', 'partialFailure', 'cancelled'].includes(
    state
  );
}

/**
 * Check if machine can be cancelled
 */
export function isChangeSetCancellable(state: string | object): boolean {
  if (typeof state === 'object') return true; // Can cancel while applying
  return ['validating', 'ready'].includes(state);
}

/**
 * Get description for machine state
 */
export function getChangeSetMachineStateDescription(
  state: string | { applying: string }
): string {
  if (typeof state === 'object') {
    return state.applying === 'applyingItem'
      ? 'Applying changes...'
      : 'Processing...';
  }

  const descriptions: Record<string, string> = {
    idle: 'Ready',
    validating: 'Validating changes...',
    ready: 'Ready to apply',
    completed: 'Changes applied',
    rollingBack: 'Rolling back changes...',
    rolledBack: 'Changes rolled back',
    failed: 'Apply failed',
    partialFailure: 'Rollback partially failed',
    cancelled: 'Cancelled',
  };

  return descriptions[state] || 'Unknown';
}
