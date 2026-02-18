/**
 * useResourceLifecycle Hook
 *
 * React hook for managing resource lifecycle state machine.
 * Provides a clean interface for resource state transitions.
 *
 * @module @nasnet/state/machines/hooks
 */

import { useCallback, useMemo } from 'react';

import { useMachine } from '@xstate/react';

import type { Resource, RuntimeState, ValidationResult } from '@nasnet/core/types';

import {
  createResourceLifecycleMachine,
  type ResourceLifecycleConfig,
  type ResourceLifecycleContext,
  type ResourceLifecycleStateValue,
  isResourcePending,
  isResourceActive,
  isResourceEditable,
  isResourceAppliable,
  getResourceStateDisplayInfo,
} from '../resourceLifecycleMachine';


// ============================================================================
// Types
// ============================================================================

/**
 * Options for useResourceLifecycle hook
 */
export interface UseResourceLifecycleOptions<TConfig = unknown>
  extends Omit<ResourceLifecycleConfig<TConfig>, 'id'> {
  /** Machine ID (optional) */
  id?: string;
}

/**
 * Return type for useResourceLifecycle hook
 */
export interface UseResourceLifecycleResult<TConfig = unknown> {
  /** Current lifecycle state */
  state: ResourceLifecycleStateValue;
  /** Machine context */
  context: ResourceLifecycleContext<TConfig>;
  /** State display info for UI */
  displayInfo: ReturnType<typeof getResourceStateDisplayInfo>;

  // State predicates
  /** Whether an async operation is in progress */
  isPending: boolean;
  /** Whether resource is active on router */
  isActive: boolean;
  /** Whether resource can be edited */
  isEditable: boolean;
  /** Whether resource can be applied */
  isAppliable: boolean;
  /** Whether resource has errors */
  hasError: boolean;
  /** Whether resource is degraded */
  isDegraded: boolean;

  // Actions
  /** Edit resource configuration */
  edit: (configuration: TConfig) => void;
  /** Validate resource */
  validate: () => void;
  /** Apply resource to router */
  apply: (force?: boolean) => void;
  /** Update runtime state (from subscription) */
  updateRuntime: (runtime: RuntimeState) => void;
  /** Mark resource as degraded */
  degrade: (reason: string) => void;
  /** Recover from degraded state */
  recover: () => void;
  /** Deprecate resource */
  deprecate: () => void;
  /** Restore deprecated resource */
  restore: () => void;
  /** Archive resource */
  archive: () => void;
  /** Retry failed operation */
  retry: () => void;
  /** Reset to draft state */
  reset: () => void;
  /** Sync configuration from router */
  sync: () => void;

  // Validation helpers
  /** Get validation errors */
  validationErrors: ValidationResult['errors'];
  /** Get validation warnings */
  validationWarnings: ValidationResult['warnings'];
  /** Whether validation passed */
  isValid: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing resource lifecycle with XState.
 *
 * @example
 * ```tsx
 * function WireGuardResourceEditor({ resource }: { resource: Resource }) {
 *   const {
 *     state,
 *     isPending,
 *     isAppliable,
 *     edit,
 *     validate,
 *     apply,
 *     validationErrors,
 *     displayInfo,
 *   } = useResourceLifecycle<WireGuardConfig>({
 *     initialResource: resource,
 *     validateResource: (uuid) => validateWireGuardResource(uuid),
 *     applyResource: (uuid) => applyWireGuardResource(uuid),
 *     syncResource: (uuid) => syncWireGuardResource(uuid),
 *   });
 *
 *   return (
 *     <div>
 *       <StatusBadge
 *         status={displayInfo.color}
 *         label={displayInfo.label}
 *         showSpinner={displayInfo.showSpinner}
 *       />
 *
 *       <ConfigForm
 *         onSubmit={(config) => {
 *           edit(config);
 *           validate();
 *         }}
 *         disabled={isPending}
 *       />
 *
 *       {validationErrors.length > 0 && (
 *         <ValidationErrors errors={validationErrors} />
 *       )}
 *
 *       {isAppliable && (
 *         <Button onClick={() => apply()} disabled={isPending}>
 *           Apply to Router
 *         </Button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useResourceLifecycle<TConfig = unknown>(
  options: UseResourceLifecycleOptions<TConfig>
): UseResourceLifecycleResult<TConfig> {
  const { id = 'resourceLifecycle', ...config } = options;

  // Create machine with provided config
  const machine = useMemo(
    () => createResourceLifecycleMachine<TConfig>({ ...config, id }),
    [id] // Only recreate if ID changes
  );

  const [snapshot, send] = useMachine(machine);

  // Current state value
  const state = snapshot.value as ResourceLifecycleStateValue;
  const context = snapshot.context;

  // Display info
  const displayInfo = useMemo(() => getResourceStateDisplayInfo(state), [state]);

  // State predicates
  const isPending = isResourcePending(state);
  const isActive = isResourceActive(state);
  const isEditable = isResourceEditable(state);
  const isAppliable = isResourceAppliable(state);
  const hasError = state === 'error';
  const isDegraded = state === 'degraded';

  // Validation helpers
  const validationErrors = context.validationResult?.errors ?? [];
  const validationWarnings = context.validationResult?.warnings ?? [];
  const isValid = context.validationResult?.canApply === true;

  // Actions
  const edit = useCallback(
    (configuration: TConfig) => {
      send({ type: 'EDIT', configuration });
    },
    [send]
  );

  const validate = useCallback(() => {
    send({ type: 'VALIDATE' });
  }, [send]);

  const apply = useCallback(
    (force?: boolean) => {
      send({ type: 'APPLY', force });
    },
    [send]
  );

  const updateRuntime = useCallback(
    (runtime: RuntimeState) => {
      send({ type: 'RUNTIME_UPDATE', runtime });
    },
    [send]
  );

  const degrade = useCallback(
    (reason: string) => {
      send({ type: 'DEGRADE', reason });
    },
    [send]
  );

  const recover = useCallback(() => {
    send({ type: 'RECOVER' });
  }, [send]);

  const deprecate = useCallback(() => {
    send({ type: 'DEPRECATE' });
  }, [send]);

  const restore = useCallback(() => {
    send({ type: 'RESTORE' });
  }, [send]);

  const archive = useCallback(() => {
    send({ type: 'ARCHIVE' });
  }, [send]);

  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const reset = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);

  const sync = useCallback(() => {
    send({ type: 'SYNC' });
  }, [send]);

  return {
    state,
    context,
    displayInfo,

    // Predicates
    isPending,
    isActive,
    isEditable,
    isAppliable,
    hasError,
    isDegraded,

    // Actions
    edit,
    validate,
    apply,
    updateRuntime,
    degrade,
    recover,
    deprecate,
    restore,
    archive,
    retry,
    reset,
    sync,

    // Validation
    validationErrors,
    validationWarnings,
    isValid,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for resource lifecycle with Apollo Client integration.
 * Automatically wires up mutations and subscriptions.
 */
export function useResourceLifecycleWithApollo<TConfig = unknown>(
  uuid: string,
  options: {
    onStateChange?: (state: string, context: ResourceLifecycleContext<TConfig>) => void;
    onError?: (error: string, code?: string) => void;
  } = {}
): UseResourceLifecycleResult<TConfig> {
  // This would integrate with the Apollo hooks from api-client
  // For now, return a placeholder implementation
  // The actual implementation would use:
  // - useValidateResource mutation
  // - useApplyResource mutation
  // - useSyncResource mutation
  // - useResourceRuntimeSubscription

  return useResourceLifecycle<TConfig>({
    initialResource: { uuid } as Partial<Resource<TConfig>>,
    validateResource: async () => {
      throw new Error('Not implemented - use with Apollo Provider');
    },
    applyResource: async () => {
      throw new Error('Not implemented - use with Apollo Provider');
    },
    syncResource: async () => {
      throw new Error('Not implemented - use with Apollo Provider');
    },
    ...options,
  });
}

export default useResourceLifecycle;
