/**
 * Service Update XState Machine (NAS-8.7)
 *
 * @description
 * State machine for managing service instance update workflow with proper
 * state transitions, progress tracking, rollback detection, and error handling.
 * Ensures consistent update lifecycle management across the application.
 *
 * States:
 * - idle: Ready to start a new update
 * - updating: Update in progress, receiving progress events
 * - complete: Update completed successfully
 * - failed: Update failed with error
 * - rolledBack: Update was rolled back due to health check failure
 *
 * Events:
 * - START_UPDATE: Begin a new update
 * - PROGRESS: Update progress received via subscription
 * - COMPLETE: Update completed successfully
 * - ROLLED_BACK: Update was rolled back
 * - FAILED: Update failed with error
 * - CANCEL: User manually cancels the update
 * - RESET: Reset to idle state
 *
 * @see Docs/architecture/adrs/002-state-management-approach.md
 */

import { setup, assign } from 'xstate';
import type { UpdateStage } from '@nasnet/api-client/queries';

/**
 * Context for update machine
 */
interface UpdateContext {
  /** Service instance ID being updated */
  instanceId: string | null;
  /** Version being updated from */
  fromVersion: string | null;
  /** Version being updated to */
  toVersion: string | null;
  /** Current update stage */
  stage: UpdateStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current progress message */
  message: string;
  /** Error message if failed */
  error: string | null;
  /** Whether update was rolled back */
  rolledBack: boolean;
  /** Timestamp when update started */
  startedAt: Date | null;
  /** Timestamp when update completed/failed */
  completedAt: Date | null;
}

/**
 * Events that can be sent to the update machine
 */
type UpdateEvent =
  | {
      type: 'START_UPDATE';
      instanceId: string;
      fromVersion: string;
      toVersion: string;
    }
  | {
      type: 'PROGRESS';
      stage: UpdateStage;
      progress: number;
      message: string;
    }
  | { type: 'COMPLETE'; toVersion: string }
  | { type: 'ROLLED_BACK'; error: string }
  | { type: 'FAILED'; error: string }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

/**
 * Initial context with no data
 */
const initialContext: UpdateContext = {
  instanceId: null,
  fromVersion: null,
  toVersion: null,
  stage: 'PENDING',
  progress: 0,
  message: '',
  error: null,
  rolledBack: false,
  startedAt: null,
  completedAt: null,
};

/**
 * Service Update state machine
 *
 * Manages the lifecycle of a service instance update with automatic
 * progress tracking and rollback detection.
 *
 * @example
 * ```tsx
 * const [state, send] = useMachine(updateMachine);
 *
 * // Start update
 * send({
 *   type: 'START_UPDATE',
 *   instanceId: 'instance-123',
 *   fromVersion: '1.0.0',
 *   toVersion: '1.1.0',
 * });
 *
 * // Handle progress events from subscription
 * useEffect(() => {
 *   if (progressEvent) {
 *     send({
 *       type: 'PROGRESS',
 *       stage: progressEvent.stage,
 *       progress: progressEvent.progress,
 *       message: progressEvent.message,
 *     });
 *
 *     if (progressEvent.stage === 'COMPLETE') {
 *       send({ type: 'COMPLETE', toVersion: progressEvent.newVersion });
 *     } else if (progressEvent.stage === 'FAILED') {
 *       send({ type: 'FAILED', error: progressEvent.error });
 *     } else if (progressEvent.rolledBack) {
 *       send({ type: 'ROLLED_BACK', error: progressEvent.error });
 *     }
 *   }
 * }, [progressEvent]);
 * ```
 */
export const updateMachine = setup({
  types: {
    context: {} as UpdateContext,
    events: {} as UpdateEvent,
  },
  guards: {
    /**
     * Check if progress indicates completion
     */
    isCompleteStage: ({ context }) => context.stage === 'COMPLETE' && context.progress >= 100,

    /**
     * Check if progress indicates failure
     */
    isFailedStage: ({ context }) => context.stage === 'FAILED',

    /**
     * Check if update was rolled back
     */
    wasRolledBack: ({ context }) => context.rolledBack,
  },
  actions: {
    /**
     * Initialize context for new update
     */
    setUpdateTarget: assign({
      instanceId: ({ event }) => (event as { type: 'START_UPDATE'; instanceId: string }).instanceId,
      fromVersion: ({ event }) =>
        (event as { type: 'START_UPDATE'; fromVersion: string }).fromVersion,
      toVersion: ({ event }) => (event as { type: 'START_UPDATE'; toVersion: string }).toVersion,
      stage: () => 'PENDING' as UpdateStage,
      progress: () => 0,
      message: () => 'Initializing update...',
      error: () => null,
      rolledBack: () => false,
      startedAt: () => new Date(),
      completedAt: () => null,
    }),

    /**
     * Update progress information
     */
    updateProgress: assign({
      stage: ({ event }) => (event as { type: 'PROGRESS'; stage: UpdateStage }).stage,
      progress: ({ event }) => (event as { type: 'PROGRESS'; progress: number }).progress,
      message: ({ event }) => (event as { type: 'PROGRESS'; message: string }).message,
    }),

    /**
     * Mark update as complete
     */
    setComplete: assign({
      stage: () => 'COMPLETE' as UpdateStage,
      progress: () => 100,
      message: () => 'Update completed successfully',
      completedAt: () => new Date(),
      toVersion: ({ event }) => (event as { type: 'COMPLETE'; toVersion: string }).toVersion,
    }),

    /**
     * Mark update as rolled back
     */
    setRolledBack: assign({
      stage: () => 'ROLLED_BACK' as UpdateStage,
      error: ({ event }) => (event as { type: 'ROLLED_BACK'; error: string }).error,
      rolledBack: () => true,
      message: () => 'Update rolled back due to health check failure',
      completedAt: () => new Date(),
    }),

    /**
     * Mark update as failed
     */
    setFailed: assign({
      stage: () => 'FAILED' as UpdateStage,
      error: ({ event }) => (event as { type: 'FAILED'; error: string }).error,
      message: ({ event }) =>
        `Update failed: ${(event as { type: 'FAILED'; error: string }).error}`,
      completedAt: () => new Date(),
    }),

    /**
     * Reset context to initial state
     */
    resetContext: assign(() => initialContext),
  },
}).createMachine({
  id: 'serviceUpdate',
  initial: 'idle',
  context: initialContext,
  states: {
    /**
     * Idle state - ready to start a new update
     */
    idle: {
      on: {
        START_UPDATE: {
          target: 'updating',
          actions: 'setUpdateTarget',
        },
      },
    },

    /**
     * Updating state - update in progress
     */
    updating: {
      on: {
        PROGRESS: {
          actions: 'updateProgress',
        },
        COMPLETE: {
          target: 'complete',
          actions: 'setComplete',
        },
        ROLLED_BACK: {
          target: 'rolledBack',
          actions: 'setRolledBack',
        },
        FAILED: {
          target: 'failed',
          actions: 'setFailed',
        },
        CANCEL: {
          target: 'idle',
          actions: 'resetContext',
        },
      },
    },

    /**
     * Complete state - update succeeded
     */
    complete: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'resetContext',
        },
      },
    },

    /**
     * Rolled back state - update was reverted
     */
    rolledBack: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'resetContext',
        },
      },
    },

    /**
     * Failed state - update failed
     */
    failed: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'resetContext',
        },
      },
    },
  },
});
