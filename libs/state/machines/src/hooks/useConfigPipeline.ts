/**
 * useConfigPipeline React Hook
 *
 * Provides a convenient React hook for the configuration pipeline machine.
 * Handles the safety flow for applying configuration changes.
 *
 * Pipeline Flow:
 * 1. Edit - User makes changes
 * 2. Validate - Run validation pipeline
 * 3. Preview - Show diff of changes
 * 4. Confirm - Acknowledge risks (for high-risk ops)
 * 5. Apply - Send to router
 * 6. Verify - Confirm changes took effect
 * 7. Done - Success or rollback
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import { useMemo, useCallback, useEffect } from 'react';

import { useMachine } from '@xstate/react';

import {
  createConfigPipelineMachine,
  type ConfigPipelineConfig,
  type ConfigPipelineState,
  isPipelineFinal,
  isPipelineCancellable,
  isPipelineProcessing,
  getPipelineStateDescription,
} from '../configPipelineMachine';

import type { ValidationError, ConfigDiff } from '../types';

// ===== Hook Return Type =====

/**
 * Return type for useConfigPipeline hook
 */
export interface UseConfigPipelineReturn<TConfig> {
  /**
   * Current pipeline state
   */
  state: ConfigPipelineState;

  /**
   * Human-readable state description
   */
  stateDescription: string;

  /**
   * Resource ID being configured
   */
  resourceId: string | null;

  /**
   * Pending configuration changes
   */
  pendingConfig: TConfig | null;

  /**
   * Validation errors (if validation failed)
   */
  validationErrors: ValidationError[];

  /**
   * Configuration diff for preview
   */
  diff: ConfigDiff | null;

  /**
   * Error message (if in error state)
   */
  errorMessage: string | null;

  /**
   * Whether the pipeline is in a final state
   */
  isFinal: boolean;

  /**
   * Whether the pipeline can be cancelled
   */
  isCancellable: boolean;

  /**
   * Whether an async operation is in progress
   */
  isProcessing: boolean;

  /**
   * Whether validation is in progress
   */
  isValidating: boolean;

  /**
   * Whether applying is in progress
   */
  isApplying: boolean;

  /**
   * Whether verifying is in progress
   */
  isVerifying: boolean;

  /**
   * Whether rolling back is in progress
   */
  isRollingBack: boolean;

  /**
   * Whether in error state
   */
  isError: boolean;

  /**
   * Whether changes require high-risk confirmation
   */
  isHighRisk: boolean;

  /**
   * Whether the pipeline completed successfully
   */
  isSuccess: boolean;

  /**
   * Whether the pipeline rolled back
   */
  isRolledBack: boolean;

  /**
   * Start editing a configuration
   */
  edit: (config: TConfig) => void;

  /**
   * Trigger validation
   */
  validate: () => void;

  /**
   * Confirm changes after preview
   */
  confirm: () => void;

  /**
   * Acknowledge high-risk operation
   */
  acknowledge: () => void;

  /**
   * Cancel the pipeline
   */
  cancel: () => void;

  /**
   * Retry after error
   */
  retry: () => void;

  /**
   * Force rollback (from error state)
   */
  forceRollback: () => void;

  /**
   * Reset the pipeline to idle
   */
  reset: () => void;

  /**
   * Quick action: edit → validate in one call
   */
  editAndValidate: (config: TConfig) => void;
}

// ===== Hook Options =====

/**
 * Options for useConfigPipeline hook
 */
export interface UseConfigPipelineOptions {
  /**
   * Resource ID being configured
   */
  resourceId: string;

  /**
   * Original configuration (for diff comparison)
   */
  originalConfig?: unknown;

  /**
   * Callback when pipeline completes successfully
   */
  onSuccess?: () => void;

  /**
   * Callback when pipeline rolls back
   */
  onRollback?: () => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: string) => void;

  /**
   * Callback when validation fails
   */
  onValidationError?: (errors: ValidationError[]) => void;

  /**
   * Callback when entering preview state
   */
  onPreview?: (diff: ConfigDiff) => void;
}

// ===== Hook Implementation =====

/**
 * React hook for configuration pipeline machine
 *
 * @template TConfig - Type of configuration being managed
 * @param pipelineConfig - Pipeline service configuration
 * @param options - Hook options
 * @returns Pipeline state and actions
 *
 * @example
 * ```tsx
 * function WireGuardEditor({ resourceId, config }: Props) {
 *   const pipeline = useConfigPipeline<WireGuardConfig>(
 *     {
 *       runValidationPipeline: async (config) => {
 *         const errors = await api.validateWireGuard(config);
 *         const diff = await api.computeDiff(resourceId, config);
 *         return { errors, diff };
 *       },
 *       applyConfig: async ({ resourceId, config }) => {
 *         const backup = await api.getBackup(resourceId);
 *         await api.applyWireGuard(resourceId, config);
 *         return { rollbackData: backup };
 *       },
 *       verifyApplied: async (resourceId) => {
 *         const status = await api.getWireGuardStatus(resourceId);
 *         if (!status.running) throw new Error('Failed to start');
 *       },
 *       executeRollback: async (rollbackData) => {
 *         await api.restoreWireGuard(rollbackData);
 *       },
 *     },
 *     {
 *       resourceId,
 *       onSuccess: () => toast.success('Configuration applied!'),
 *       onRollback: () => toast.warning('Changes rolled back'),
 *     }
 *   );
 *
 *   const handleSave = () => {
 *     pipeline.editAndValidate(formData);
 *   };
 *
 *   if (pipeline.state === 'previewing') {
 *     return (
 *       <ConfigPreview
 *         diff={pipeline.diff}
 *         isHighRisk={pipeline.isHighRisk}
 *         onConfirm={pipeline.confirm}
 *         onCancel={pipeline.cancel}
 *       />
 *     );
 *   }
 *
 *   if (pipeline.state === 'confirming') {
 *     return (
 *       <HighRiskConfirmation
 *         diff={pipeline.diff}
 *         onAcknowledge={pipeline.acknowledge}
 *         onCancel={pipeline.cancel}
 *       />
 *     );
 *   }
 *
 *   return (
 *     <ConfigForm
 *       config={config}
 *       errors={pipeline.validationErrors}
 *       onSave={handleSave}
 *       isLoading={pipeline.isProcessing}
 *     />
 *   );
 * }
 * ```
 */
export function useConfigPipeline<TConfig = unknown>(
  pipelineConfig: Omit<ConfigPipelineConfig<TConfig>, 'id' | 'onSuccess' | 'onRollback' | 'onError'>,
  options: UseConfigPipelineOptions
): UseConfigPipelineReturn<TConfig> {
  const {
    resourceId,
    originalConfig,
    onSuccess,
    onRollback,
    onError,
    onValidationError,
    onPreview,
  } = options;

  // Create the machine with callbacks
  const machine = useMemo(
    () =>
      createConfigPipelineMachine<TConfig>({
        ...pipelineConfig,
        id: `configPipeline-${resourceId}`,
        onSuccess,
        onRollback,
        onError,
      }),
    [resourceId]
  );

  // Use the machine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [snapshot, send] = useMachine(machine, {
    input: {
      resourceId,
      originalConfig: originalConfig as TConfig | null,
      pendingConfig: null,
      validationErrors: [],
      diff: null,
      rollbackData: null,
      applyStartedAt: null,
      errorMessage: null,
    },
  } as any);

  // Current state as string
  const currentState = (
    typeof snapshot.value === 'string'
      ? snapshot.value
      : Object.keys(snapshot.value)[0]
  ) as ConfigPipelineState;

  // Handle validation error callback
  useEffect(() => {
    if (currentState === 'invalid' && snapshot.context.validationErrors.length > 0) {
      onValidationError?.(snapshot.context.validationErrors);
    }
  }, [currentState, snapshot.context.validationErrors]);

  // Handle preview callback
  useEffect(() => {
    if (currentState === 'previewing' && snapshot.context.diff) {
      onPreview?.(snapshot.context.diff);
    }
  }, [currentState, snapshot.context.diff]);

  // Actions
  const edit = useCallback(
    (config: TConfig) => {
      send({ type: 'EDIT', config });
    },
    [send]
  );

  const validate = useCallback(() => {
    send({ type: 'VALIDATE' });
  }, [send]);

  const confirm = useCallback(() => {
    send({ type: 'CONFIRM' });
  }, [send]);

  const acknowledge = useCallback(() => {
    send({ type: 'ACKNOWLEDGED' });
  }, [send]);

  const cancel = useCallback(() => {
    send({ type: 'CANCEL' });
  }, [send]);

  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const forceRollback = useCallback(() => {
    send({ type: 'FORCE_ROLLBACK' });
  }, [send]);

  const reset = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);

  const editAndValidate = useCallback(
    (config: TConfig) => {
      send({ type: 'EDIT', config });
      // Use setTimeout to ensure the edit is processed first
      setTimeout(() => {
        send({ type: 'VALIDATE' });
      }, 0);
    },
    [send]
  );

  return {
    // State
    state: currentState,
    stateDescription: getPipelineStateDescription(currentState),
    resourceId: snapshot.context.resourceId,
    pendingConfig: snapshot.context.pendingConfig,
    validationErrors: snapshot.context.validationErrors,
    diff: snapshot.context.diff,
    errorMessage: snapshot.context.errorMessage,

    // Status flags
    isFinal: isPipelineFinal(currentState),
    isCancellable: isPipelineCancellable(currentState),
    isProcessing: isPipelineProcessing(currentState),
    isValidating: currentState === 'validating',
    isApplying: currentState === 'applying',
    isVerifying: currentState === 'verifying',
    isRollingBack: currentState === 'rollback',
    isError: currentState === 'error',
    isHighRisk: snapshot.context.diff?.isHighRisk === true,
    isSuccess: currentState === 'active',
    isRolledBack: currentState === 'rolled_back',

    // Actions
    edit,
    validate,
    confirm,
    acknowledge,
    cancel,
    retry,
    forceRollback,
    reset,
    editAndValidate,
  };
}

/**
 * Simplified hook for quick edit-validate-apply flows
 * Automatically advances through states when possible
 */
export function useQuickConfigPipeline<TConfig = unknown>(
  pipelineConfig: Omit<ConfigPipelineConfig<TConfig>, 'id' | 'onSuccess' | 'onRollback' | 'onError'>,
  options: UseConfigPipelineOptions
): UseConfigPipelineReturn<TConfig> & {
  /**
   * Quick apply: edit → validate → confirm → apply
   * Skips preview for non-high-risk changes
   */
  quickApply: (config: TConfig) => void;
} {
  const pipeline = useConfigPipeline(pipelineConfig, options);

  // Auto-advance from preview to applying for non-high-risk changes
  useEffect(() => {
    if (pipeline.state === 'previewing' && !pipeline.isHighRisk) {
      pipeline.confirm();
    }
  }, [pipeline.state, pipeline.isHighRisk]);

  const quickApply = useCallback(
    (config: TConfig) => {
      pipeline.editAndValidate(config);
    },
    [pipeline.editAndValidate]
  );

  return {
    ...pipeline,
    quickApply,
  };
}
