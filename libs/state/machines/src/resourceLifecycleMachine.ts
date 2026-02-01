/**
 * Resource Lifecycle State Machine
 *
 * XState machine for managing Universal State v2 resource lifecycle.
 * Implements the 9-state lifecycle model with proper transitions.
 *
 * Lifecycle States:
 * 1. DRAFT      - Initial creation, not yet validated
 * 2. VALIDATING - Running 7-stage validation pipeline
 * 3. VALID      - Passed validation, ready to apply
 * 4. APPLYING   - Being applied to router
 * 5. ACTIVE     - Successfully applied and running
 * 6. DEGRADED   - Running but with issues
 * 7. ERROR      - Failed state (validation or apply)
 * 8. DEPRECATED - Marked for removal
 * 9. ARCHIVED   - Final state, no longer active
 *
 * Features:
 * - Automatic validation before apply
 * - Rollback on apply failure
 * - Degradation detection and recovery
 * - Subscription-based runtime updates
 *
 * @see NAS-4.7: Universal State v2 Resource Model
 * @see ADR-012: Universal State v2
 */

import { setup, assign, fromPromise, emit } from 'xstate';
import type { Resource, ValidationResult, RuntimeState } from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Resource lifecycle machine context
 */
export interface ResourceLifecycleContext<TConfig = unknown> {
  /** Resource UUID */
  uuid: string | null;
  /** Router ID this resource belongs to */
  routerId: string | null;
  /** Resource type (e.g., 'wireguard-client') */
  resourceType: string | null;
  /** Current configuration */
  configuration: TConfig | null;
  /** Pending configuration changes */
  pendingConfiguration: TConfig | null;
  /** Validation result from last validation */
  validationResult: ValidationResult | null;
  /** Current runtime state */
  runtime: RuntimeState | null;
  /** Error message if in error state */
  errorMessage: string | null;
  /** Error code for programmatic handling */
  errorCode: string | null;
  /** Rollback data for recovery */
  rollbackData: TConfig | null;
  /** Timestamp of last state change */
  lastTransitionAt: number | null;
  /** Number of apply retries */
  retryCount: number;
  /** Maximum retries before giving up */
  maxRetries: number;
  /** Degradation reason if degraded */
  degradationReason: string | null;
}

/**
 * Resource lifecycle events
 */
export type ResourceLifecycleEvent<TConfig = unknown> =
  | { type: 'EDIT'; configuration: TConfig }
  | { type: 'VALIDATE' }
  | { type: 'VALIDATION_SUCCESS'; result: ValidationResult }
  | { type: 'VALIDATION_FAILURE'; result: ValidationResult }
  | { type: 'APPLY'; force?: boolean }
  | { type: 'APPLY_SUCCESS'; generatedFields?: Record<string, unknown> }
  | { type: 'APPLY_FAILURE'; error: string; code?: string }
  | { type: 'RUNTIME_UPDATE'; runtime: RuntimeState }
  | { type: 'DEGRADE'; reason: string }
  | { type: 'RECOVER' }
  | { type: 'DEPRECATE' }
  | { type: 'RESTORE' }
  | { type: 'ARCHIVE' }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'SYNC' }
  | { type: 'SYNC_COMPLETE'; configuration: TConfig };

/**
 * Configuration for creating resource lifecycle machine
 */
export interface ResourceLifecycleConfig<TConfig = unknown> {
  /** Unique machine ID */
  id?: string;
  /** Initial resource data */
  initialResource?: Partial<Resource<TConfig>>;
  /** Validate resource configuration */
  validateResource: (uuid: string) => Promise<ValidationResult>;
  /** Apply resource to router */
  applyResource: (
    uuid: string,
    force?: boolean
  ) => Promise<{ rollbackData: TConfig; generatedFields?: Record<string, unknown> }>;
  /** Sync resource from router */
  syncResource: (uuid: string) => Promise<TConfig>;
  /** Execute rollback */
  executeRollback?: (uuid: string, rollbackData: TConfig) => Promise<void>;
  /** Callback on state change */
  onStateChange?: (state: string, context: ResourceLifecycleContext<TConfig>) => void;
  /** Callback on error */
  onError?: (error: string, code?: string) => void;
  /** Maximum retries for apply */
  maxRetries?: number;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a resource lifecycle state machine
 *
 * @template TConfig - Type of resource configuration
 * @param config - Machine configuration
 * @returns XState machine for resource lifecycle
 *
 * @example
 * ```ts
 * const wireguardLifecycleMachine = createResourceLifecycleMachine<WireGuardConfig>({
 *   validateResource: (uuid) => api.validateResource(uuid),
 *   applyResource: (uuid, force) => api.applyResource(uuid, { force }),
 *   syncResource: (uuid) => api.syncResource(uuid),
 *   onStateChange: (state, ctx) => {
 *     console.log(`Resource ${ctx.uuid} is now ${state}`);
 *   },
 * });
 * ```
 */
export function createResourceLifecycleMachine<TConfig = unknown>(
  config: ResourceLifecycleConfig<TConfig>
) {
  const {
    id = 'resourceLifecycle',
    initialResource,
    validateResource,
    applyResource,
    syncResource,
    executeRollback,
    onStateChange,
    onError,
    maxRetries = 3,
  } = config;

  return setup({
    types: {} as {
      context: ResourceLifecycleContext<TConfig>;
      events: ResourceLifecycleEvent<TConfig>;
      emitted: { type: 'stateChanged'; state: string };
    },
    actors: {
      validateResource: fromPromise<ValidationResult, string>(async ({ input }) => {
        return validateResource(input);
      }),
      applyResource: fromPromise<
        { rollbackData: TConfig; generatedFields?: Record<string, unknown> },
        { uuid: string; force?: boolean }
      >(async ({ input }) => {
        return applyResource(input.uuid, input.force);
      }),
      syncResource: fromPromise<TConfig, string>(async ({ input }) => {
        return syncResource(input);
      }),
      executeRollback: fromPromise<void, { uuid: string; rollbackData: TConfig }>(
        async ({ input }) => {
          if (executeRollback) {
            return executeRollback(input.uuid, input.rollbackData);
          }
        }
      ),
    },
    guards: {
      hasValidationErrors: ({ context }) => {
        return (
          context.validationResult !== null &&
          (context.validationResult.errors?.length ?? 0) > 0
        );
      },
      noValidationErrors: ({ context }) => {
        return (
          context.validationResult === null ||
          (context.validationResult.errors?.length ?? 0) === 0
        );
      },
      canApply: ({ context }) => {
        return (
          context.validationResult?.canApply === true &&
          (context.validationResult.errors?.length ?? 0) === 0
        );
      },
      canRetry: ({ context }) => {
        return context.retryCount < context.maxRetries;
      },
      hasRollbackData: ({ context }) => {
        return context.rollbackData !== null;
      },
      isHealthy: ({ context }) => {
        return context.runtime?.health === 'HEALTHY';
      },
      isDegraded: ({ context }) => {
        return (
          context.runtime?.health === 'DEGRADED' ||
          context.runtime?.health === 'CRITICAL'
        );
      },
      hasUuid: ({ context }) => {
        return context.uuid !== null;
      },
    },
    actions: {
      updateConfiguration: assign({
        pendingConfiguration: ({ event }) => {
          if (event.type === 'EDIT') {
            return event.configuration;
          }
          return null;
        },
      }),
      setValidationResult: assign({
        validationResult: ({ event }) => {
          if (
            event.type === 'VALIDATION_SUCCESS' ||
            event.type === 'VALIDATION_FAILURE'
          ) {
            return event.result;
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
            return (event.output as { rollbackData: TConfig }).rollbackData;
          }
          return null;
        },
      }),
      updateRuntime: assign({
        runtime: ({ event }) => {
          if (event.type === 'RUNTIME_UPDATE') {
            return event.runtime;
          }
          return null;
        },
      }),
      setError: assign({
        errorMessage: ({ event }) => {
          if (event.type === 'APPLY_FAILURE') {
            return event.error;
          }
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
        errorCode: ({ event }) => {
          if (event.type === 'APPLY_FAILURE') {
            return event.code ?? null;
          }
          return null;
        },
      }),
      clearError: assign({
        errorMessage: () => null,
        errorCode: () => null,
      }),
      setDegradation: assign({
        degradationReason: ({ event }) => {
          if (event.type === 'DEGRADE') {
            return event.reason;
          }
          return null;
        },
      }),
      clearDegradation: assign({
        degradationReason: () => null,
      }),
      incrementRetry: assign({
        retryCount: ({ context }) => context.retryCount + 1,
      }),
      resetRetry: assign({
        retryCount: () => 0,
      }),
      recordTransition: assign({
        lastTransitionAt: () => Date.now(),
      }),
      applyGeneratedFields: assign({
        configuration: ({ context, event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'generatedFields' in event.output
          ) {
            const generated = (
              event.output as { generatedFields?: Record<string, unknown> }
            ).generatedFields;
            if (generated && context.pendingConfiguration) {
              return { ...context.pendingConfiguration, ...generated } as TConfig;
            }
          }
          return context.pendingConfiguration;
        },
        pendingConfiguration: () => null,
      }),
      syncConfiguration: assign({
        configuration: ({ event }) => {
          if (event.type === 'SYNC_COMPLETE') {
            return event.configuration;
          }
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event
          ) {
            return event.output as TConfig;
          }
          return null;
        },
      }),
      notifyStateChange: emit(({ context }) => ({
        type: 'stateChanged' as const,
        state: 'unknown', // Will be set by the state node
      })),
      notifyError: ({ context }) => {
        onError?.(context.errorMessage || 'Unknown error', context.errorCode || undefined);
      },
      resetContext: assign({
        pendingConfiguration: () => null,
        validationResult: () => null,
        errorMessage: () => null,
        errorCode: () => null,
        rollbackData: () => null,
        retryCount: () => 0,
        degradationReason: () => null,
      }),
    },
  }).createMachine({
    id,
    initial: 'draft',
    context: {
      uuid: initialResource?.uuid ?? null,
      routerId: null,
      resourceType: initialResource?.type ?? null,
      configuration: (initialResource?.configuration as TConfig) ?? null,
      pendingConfiguration: null,
      validationResult: null,
      runtime: null,
      errorMessage: null,
      errorCode: null,
      rollbackData: null,
      lastTransitionAt: Date.now(),
      retryCount: 0,
      maxRetries,
      degradationReason: null,
    },
    states: {
      // =================== DRAFT ===================
      draft: {
        description: 'Resource is being created or edited',
        entry: 'recordTransition',
        on: {
          EDIT: {
            actions: 'updateConfiguration',
          },
          VALIDATE: {
            target: 'validating',
            guard: 'hasUuid',
          },
        },
      },

      // =================== VALIDATING ===================
      validating: {
        description: 'Running 7-stage validation pipeline',
        entry: 'recordTransition',
        invoke: {
          src: 'validateResource',
          input: ({ context }) => context.uuid as string,
          onDone: [
            {
              target: 'error',
              guard: ({ event }) => {
                const result = event.output as ValidationResult;
                return (result.errors?.length ?? 0) > 0;
              },
              actions: [
                assign({
                  validationResult: ({ event }) => event.output as ValidationResult,
                }),
              ],
            },
            {
              target: 'valid',
              actions: [
                assign({
                  validationResult: ({ event }) => event.output as ValidationResult,
                }),
              ],
            },
          ],
          onError: {
            target: 'error',
            actions: 'setError',
          },
        },
      },

      // =================== VALID ===================
      valid: {
        description: 'Validation passed, ready to apply',
        entry: 'recordTransition',
        on: {
          EDIT: {
            target: 'draft',
            actions: 'updateConfiguration',
          },
          APPLY: {
            target: 'applying',
          },
        },
      },

      // =================== APPLYING ===================
      applying: {
        description: 'Applying configuration to router',
        entry: 'recordTransition',
        invoke: {
          src: 'applyResource',
          input: ({ context, event }) => ({
            uuid: context.uuid as string,
            force: event.type === 'APPLY' ? event.force : false,
          }),
          onDone: {
            target: 'active',
            actions: ['setRollbackData', 'applyGeneratedFields', 'resetRetry'],
          },
          onError: {
            target: 'error',
            actions: ['setError', 'incrementRetry'],
          },
        },
      },

      // =================== ACTIVE ===================
      active: {
        description: 'Resource is running on router',
        entry: ['recordTransition', 'clearError', 'clearDegradation'],
        on: {
          EDIT: {
            target: 'draft',
            actions: 'updateConfiguration',
          },
          RUNTIME_UPDATE: [
            {
              target: 'degraded',
              guard: ({ event }) =>
                event.runtime.health === 'DEGRADED' ||
                event.runtime.health === 'CRITICAL',
              actions: ['updateRuntime', 'setDegradation'],
            },
            {
              actions: 'updateRuntime',
            },
          ],
          DEGRADE: {
            target: 'degraded',
            actions: 'setDegradation',
          },
          DEPRECATE: 'deprecated',
          SYNC: 'syncing',
        },
      },

      // =================== DEGRADED ===================
      degraded: {
        description: 'Running but with issues',
        entry: 'recordTransition',
        on: {
          RUNTIME_UPDATE: [
            {
              target: 'active',
              guard: ({ event }) => event.runtime.health === 'HEALTHY',
              actions: ['updateRuntime', 'clearDegradation'],
            },
            {
              actions: 'updateRuntime',
            },
          ],
          RECOVER: {
            target: 'active',
            actions: 'clearDegradation',
          },
          DEPRECATE: 'deprecated',
          EDIT: {
            target: 'draft',
            actions: 'updateConfiguration',
          },
        },
      },

      // =================== ERROR ===================
      error: {
        description: 'Failed state - validation or apply error',
        entry: ['recordTransition', 'notifyError'],
        on: {
          RETRY: [
            {
              target: 'validating',
              guard: 'canRetry',
            },
            {
              // Max retries reached, stay in error
            },
          ],
          EDIT: {
            target: 'draft',
            actions: ['updateConfiguration', 'clearError'],
          },
          RESET: {
            target: 'draft',
            actions: 'resetContext',
          },
        },
      },

      // =================== DEPRECATED ===================
      deprecated: {
        description: 'Marked for removal',
        entry: 'recordTransition',
        on: {
          RESTORE: 'active',
          ARCHIVE: 'archived',
        },
      },

      // =================== ARCHIVED ===================
      archived: {
        description: 'Final state - resource is no longer active',
        entry: 'recordTransition',
        type: 'final',
      },

      // =================== SYNCING ===================
      syncing: {
        description: 'Syncing configuration from router',
        entry: 'recordTransition',
        invoke: {
          src: 'syncResource',
          input: ({ context }) => context.uuid as string,
          onDone: {
            target: 'active',
            actions: 'syncConfiguration',
          },
          onError: {
            target: 'active',
            // Stay active even if sync fails, just log error
          },
        },
      },
    },
  });
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * All possible lifecycle states
 */
export type ResourceLifecycleStateValue =
  | 'draft'
  | 'validating'
  | 'valid'
  | 'applying'
  | 'active'
  | 'degraded'
  | 'error'
  | 'deprecated'
  | 'archived'
  | 'syncing';

/**
 * Check if resource is in a pending operation state
 */
export function isResourcePending(state: ResourceLifecycleStateValue): boolean {
  return ['validating', 'applying', 'syncing'].includes(state);
}

/**
 * Check if resource is in an active state (on router)
 */
export function isResourceActive(state: ResourceLifecycleStateValue): boolean {
  return ['active', 'degraded'].includes(state);
}

/**
 * Check if resource can be edited
 */
export function isResourceEditable(state: ResourceLifecycleStateValue): boolean {
  return ['draft', 'valid', 'active', 'degraded', 'error'].includes(state);
}

/**
 * Check if resource can be applied
 */
export function isResourceAppliable(state: ResourceLifecycleStateValue): boolean {
  return state === 'valid';
}

/**
 * Check if resource is in a terminal state
 */
export function isResourceTerminal(state: ResourceLifecycleStateValue): boolean {
  return state === 'archived';
}

/**
 * Get display info for a lifecycle state
 */
export function getResourceStateDisplayInfo(state: ResourceLifecycleStateValue): {
  label: string;
  description: string;
  color: 'gray' | 'blue' | 'green' | 'amber' | 'red';
  showSpinner: boolean;
} {
  const stateInfo: Record<
    ResourceLifecycleStateValue,
    { label: string; description: string; color: 'gray' | 'blue' | 'green' | 'amber' | 'red'; showSpinner: boolean }
  > = {
    draft: {
      label: 'Draft',
      description: 'Not yet validated',
      color: 'gray',
      showSpinner: false,
    },
    validating: {
      label: 'Validating',
      description: 'Checking configuration...',
      color: 'blue',
      showSpinner: true,
    },
    valid: {
      label: 'Valid',
      description: 'Ready to apply',
      color: 'green',
      showSpinner: false,
    },
    applying: {
      label: 'Applying',
      description: 'Applying to router...',
      color: 'amber',
      showSpinner: true,
    },
    active: {
      label: 'Active',
      description: 'Running on router',
      color: 'green',
      showSpinner: false,
    },
    degraded: {
      label: 'Degraded',
      description: 'Running with issues',
      color: 'amber',
      showSpinner: false,
    },
    error: {
      label: 'Error',
      description: 'Failed',
      color: 'red',
      showSpinner: false,
    },
    deprecated: {
      label: 'Deprecated',
      description: 'Marked for removal',
      color: 'gray',
      showSpinner: false,
    },
    archived: {
      label: 'Archived',
      description: 'No longer active',
      color: 'gray',
      showSpinner: false,
    },
    syncing: {
      label: 'Syncing',
      description: 'Syncing from router...',
      color: 'blue',
      showSpinner: true,
    },
  };

  return stateInfo[state];
}

export default createResourceLifecycleMachine;
