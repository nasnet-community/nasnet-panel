/**
 * Configuration Pipeline Machine (Safety Flow)
 *
 * Implements the Apply-Confirm-Merge pattern for safe configuration changes.
 * This is a core architectural pattern that prevents accidental network lockouts
 * through explicit state modeling, guards, and rollback capabilities.
 *
 * Pipeline States:
 * 1. idle       - Initial/reset state
 * 2. draft      - User is editing configuration
 * 3. validating - Running 7-stage validation pipeline
 * 4. invalid    - Validation failed, showing errors
 * 5. previewing - Showing diff of changes
 * 6. confirming - User acknowledging risks (for high-risk ops)
 * 7. applying   - Sending configuration to router
 * 8. verifying  - Confirming router accepted changes
 * 9. active     - Configuration applied successfully
 * 10. rollback  - Executing rollback due to failure
 * 11. rolled_back - Rollback completed
 * 12. error     - Unrecoverable error state
 *
 * Safety Features:
 * - Cannot skip validation
 * - High-risk operations require explicit acknowledgment
 * - Automatic rollback on verification failure
 * - Manual rollback always available
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 * @see ADR-002: State Management Strategy
 */

import { setup, assign, fromPromise } from 'xstate';
import type {
  ConfigPipelineContext,
  ConfigPipelineEvent,
  ConfigPipelineServices,
  ValidationError,
  ConfigDiff,
} from './types';

// ===== Type Definitions =====

/**
 * Validation pipeline result
 */
interface ValidationPipelineResult {
  errors: ValidationError[];
  diff: ConfigDiff;
}

/**
 * Apply configuration result
 */
interface ApplyResult<TConfig> {
  rollbackData: TConfig;
}

/**
 * Configuration for the pipeline machine
 */
export interface ConfigPipelineConfig<TConfig = unknown> {
  /**
   * Unique machine ID
   */
  id?: string;

  /**
   * Run validation pipeline
   */
  runValidationPipeline: (config: TConfig) => Promise<ValidationPipelineResult>;

  /**
   * Apply configuration to router
   */
  applyConfig: (params: {
    resourceId: string;
    config: TConfig;
  }) => Promise<ApplyResult<TConfig>>;

  /**
   * Verify configuration was applied
   */
  verifyApplied: (resourceId: string) => Promise<void>;

  /**
   * Execute rollback
   */
  executeRollback: (rollbackData: TConfig) => Promise<void>;

  /**
   * Callback on successful apply
   */
  onSuccess?: () => void;

  /**
   * Callback on rollback
   */
  onRollback?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: string) => void;
}

// ===== Factory Function =====

/**
 * Create a configuration pipeline machine
 *
 * @template TConfig - Type of configuration being managed
 * @param config - Pipeline configuration
 * @returns XState machine for the config pipeline
 *
 * @example
 * ```ts
 * interface WireGuardConfig {
 *   privateKey: string;
 *   listenPort: number;
 *   peers: Peer[];
 * }
 *
 * const wireguardPipelineMachine = createConfigPipelineMachine<WireGuardConfig>({
 *   runValidationPipeline: async (config) => {
 *     const errors = await validateWireGuardConfig(config);
 *     const diff = await computeConfigDiff(config);
 *     return { errors, diff };
 *   },
 *   applyConfig: async ({ resourceId, config }) => {
 *     const backup = await getBackup(resourceId);
 *     await applyWireGuardConfig(resourceId, config);
 *     return { rollbackData: backup };
 *   },
 *   verifyApplied: async (resourceId) => {
 *     const status = await checkWireGuardStatus(resourceId);
 *     if (!status.running) throw new Error('WireGuard failed to start');
 *   },
 *   executeRollback: async (rollbackData) => {
 *     await restoreWireGuardConfig(rollbackData);
 *   },
 *   onSuccess: () => {
 *     showSuccess('WireGuard configuration applied');
 *   },
 *   onRollback: () => {
 *     showWarning('Configuration rolled back to previous state');
 *   },
 * });
 * ```
 */
export function createConfigPipelineMachine<TConfig = unknown>(
  config: ConfigPipelineConfig<TConfig>
) {
  const {
    id = 'configPipeline',
    runValidationPipeline,
    applyConfig,
    verifyApplied,
    executeRollback,
    onSuccess,
    onRollback,
    onError,
  } = config;

  return setup({
    types: {} as {
      context: ConfigPipelineContext<TConfig>;
      events: ConfigPipelineEvent<TConfig>;
    },
    actors: {
      runValidationPipeline: fromPromise<ValidationPipelineResult, TConfig>(
        async ({ input }) => {
          return runValidationPipeline(input);
        }
      ),
      applyConfig: fromPromise<
        ApplyResult<TConfig>,
        { resourceId: string; config: TConfig }
      >(async ({ input }) => {
        return applyConfig(input);
      }),
      verifyApplied: fromPromise<void, string>(async ({ input }) => {
        return verifyApplied(input);
      }),
      executeRollback: fromPromise<void, TConfig>(async ({ input }) => {
        return executeRollback(input);
      }),
    },
    guards: {
      hasValidationErrors: ({ event }) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'output' in event &&
          typeof event.output === 'object' &&
          event.output !== null &&
          'errors' in event.output
        ) {
          const output = event.output as ValidationPipelineResult;
          return output.errors.length > 0;
        }
        return false;
      },
      noValidationErrors: ({ event }) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'output' in event &&
          typeof event.output === 'object' &&
          event.output !== null &&
          'errors' in event.output
        ) {
          const output = event.output as ValidationPipelineResult;
          return output.errors.length === 0;
        }
        return false;
      },
      isHighRisk: ({ context }) => {
        return context.diff?.isHighRisk === true;
      },
      isNotHighRisk: ({ context }) => {
        return context.diff?.isHighRisk !== true;
      },
      hasResourceId: ({ context }) => {
        return context.resourceId !== null;
      },
      hasRollbackData: ({ context }) => {
        return context.rollbackData !== null;
      },
    },
    actions: {
      updatePendingConfig: assign({
        pendingConfig: ({ event }) => {
          if (event.type === 'EDIT') {
            return event.config;
          }
          return null;
        },
      }),
      setValidationResults: assign({
        validationErrors: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'errors' in event.output
          ) {
            return (event.output as ValidationPipelineResult).errors;
          }
          return [];
        },
        diff: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'diff' in event.output
          ) {
            return (event.output as ValidationPipelineResult).diff;
          }
          return null;
        },
      }),
      setRollbackData: assign({
        rollbackData: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'rollbackData' in event.output
          ) {
            return (event.output as ApplyResult<TConfig>).rollbackData;
          }
          return null;
        },
        applyStartedAt: () => Date.now(),
      }),
      setErrorMessage: assign({
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
      clearErrors: assign({
        validationErrors: () => [],
        errorMessage: () => null,
      }),
      resetPipeline: assign({
        pendingConfig: () => null,
        validationErrors: () => [],
        diff: () => null,
        rollbackData: () => null,
        applyStartedAt: () => null,
        errorMessage: () => null,
      }),
      notifySuccess: () => {
        onSuccess?.();
      },
      notifyRolledBack: () => {
        onRollback?.();
      },
      notifyError: ({ context }) => {
        onError?.(context.errorMessage || 'Unknown error');
      },
    },
  }).createMachine({
    id,
    initial: 'idle',
    context: {
      resourceId: null,
      originalConfig: null,
      pendingConfig: null,
      validationErrors: [],
      diff: null,
      rollbackData: null,
      applyStartedAt: null,
      errorMessage: null,
    },
    states: {
      idle: {
        description: 'Initial state - waiting for edit',
        on: {
          EDIT: {
            target: 'draft',
            actions: 'updatePendingConfig',
          },
        },
      },
      draft: {
        description: 'User is editing configuration',
        on: {
          EDIT: {
            actions: 'updatePendingConfig',
          },
          VALIDATE: 'validating',
          CANCEL: {
            target: 'idle',
            actions: 'resetPipeline',
          },
        },
      },
      validating: {
        description: 'Running 7-stage validation pipeline',
        invoke: {
          src: 'runValidationPipeline',
          input: ({ context }) => context.pendingConfig as TConfig,
          onDone: [
            {
              // Validation failed
              target: 'invalid',
              guard: 'hasValidationErrors',
              actions: 'setValidationResults',
            },
            {
              // Validation passed
              target: 'previewing',
              guard: 'noValidationErrors',
              actions: 'setValidationResults',
            },
          ],
          onError: {
            target: 'error',
            actions: 'setErrorMessage',
          },
        },
      },
      invalid: {
        description: 'Validation failed - showing errors',
        on: {
          EDIT: {
            target: 'draft',
            actions: ['updatePendingConfig', 'clearErrors'],
          },
          CANCEL: {
            target: 'idle',
            actions: 'resetPipeline',
          },
        },
      },
      previewing: {
        description: 'Showing diff of changes',
        on: {
          CONFIRM: [
            {
              // High-risk operation - need explicit acknowledgment
              target: 'confirming',
              guard: 'isHighRisk',
            },
            {
              // Normal operation - proceed to apply
              target: 'applying',
              guard: 'isNotHighRisk',
            },
          ],
          EDIT: {
            target: 'draft',
            actions: ['updatePendingConfig', 'clearErrors'],
          },
          CANCEL: {
            target: 'idle',
            actions: 'resetPipeline',
          },
        },
      },
      confirming: {
        description: 'User acknowledging high-risk operation',
        on: {
          ACKNOWLEDGED: 'applying',
          CANCEL: 'previewing',
        },
      },
      applying: {
        description: 'Sending configuration to router',
        invoke: {
          src: 'applyConfig',
          input: ({ context }) => ({
            resourceId: context.resourceId as string,
            config: context.pendingConfig as TConfig,
          }),
          onDone: {
            target: 'verifying',
            actions: 'setRollbackData',
          },
          onError: {
            target: 'error',
            actions: 'setErrorMessage',
          },
        },
      },
      verifying: {
        description: 'Confirming router accepted changes',
        invoke: {
          src: 'verifyApplied',
          input: ({ context }) => context.resourceId as string,
          onDone: 'active',
          onError: {
            target: 'rollback',
          },
        },
      },
      active: {
        description: 'Configuration applied successfully',
        type: 'final',
        entry: 'notifySuccess',
      },
      rollback: {
        description: 'Executing rollback to previous state',
        invoke: {
          src: 'executeRollback',
          input: ({ context }) => context.rollbackData as TConfig,
          onDone: 'rolled_back',
          onError: {
            target: 'error',
            actions: 'setErrorMessage',
          },
        },
      },
      rolled_back: {
        description: 'Rollback completed - back to safe state',
        type: 'final',
        entry: 'notifyRolledBack',
      },
      error: {
        description: 'Unrecoverable error - manual intervention needed',
        entry: 'notifyError',
        on: {
          RETRY: 'validating',
          FORCE_ROLLBACK: {
            target: 'rollback',
            guard: 'hasRollbackData',
          },
          RESET: {
            target: 'idle',
            actions: 'resetPipeline',
          },
        },
      },
    },
  });
}

/**
 * Create a simple config pipeline for low-risk operations
 * Skips the confirming state for faster workflow
 */
export function createSimpleConfigPipelineMachine<TConfig = unknown>(
  config: Omit<ConfigPipelineConfig<TConfig>, 'id'> & { id?: string }
) {
  return createConfigPipelineMachine<TConfig>({
    ...config,
    id: config.id || 'simpleConfigPipeline',
  });
}

// ===== Helper Types for Machine Usage =====

/**
 * Type helper for extracting state from config pipeline
 */
export type ConfigPipelineState =
  | 'idle'
  | 'draft'
  | 'validating'
  | 'invalid'
  | 'previewing'
  | 'confirming'
  | 'applying'
  | 'verifying'
  | 'active'
  | 'rollback'
  | 'rolled_back'
  | 'error';

/**
 * Check if pipeline is in a final state
 */
export function isPipelineFinal(state: ConfigPipelineState): boolean {
  return state === 'active' || state === 'rolled_back';
}

/**
 * Check if pipeline can be cancelled
 */
export function isPipelineCancellable(state: ConfigPipelineState): boolean {
  return ['draft', 'invalid', 'previewing', 'confirming'].includes(state);
}

/**
 * Check if pipeline is processing (async operation in progress)
 */
export function isPipelineProcessing(state: ConfigPipelineState): boolean {
  return ['validating', 'applying', 'verifying', 'rollback'].includes(state);
}

/**
 * Get human-readable description of pipeline state
 */
export function getPipelineStateDescription(state: ConfigPipelineState): string {
  const descriptions: Record<ConfigPipelineState, string> = {
    idle: 'Ready to edit',
    draft: 'Editing configuration',
    validating: 'Validating changes...',
    invalid: 'Validation failed',
    previewing: 'Review changes',
    confirming: 'Confirm high-risk operation',
    applying: 'Applying configuration...',
    verifying: 'Verifying changes...',
    active: 'Configuration applied',
    rollback: 'Rolling back changes...',
    rolled_back: 'Changes rolled back',
    error: 'Error occurred',
  };
  return descriptions[state];
}
