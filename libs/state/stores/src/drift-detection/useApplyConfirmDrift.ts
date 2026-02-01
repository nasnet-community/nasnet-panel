/**
 * Apply-Confirm-Merge Drift Integration Hook
 *
 * React hook that integrates drift detection with the Apply-Confirm-Merge pattern.
 * Ensures mutations follow the correct flow and updates drift status appropriately.
 *
 * Flow:
 * 1. Apply: Send configuration to router
 * 2. Confirm: Query router to verify actual state
 * 3. Update: Store confirmed state in Deployment layer
 * 4. Publish: Drift status event to event bus for UI updates
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#state-flow-apply--confirm--merge
 */

import { useCallback, useState } from 'react';
import type { Resource, DeploymentState } from '@nasnet/core/types';
import { DriftStatus, type DriftResult } from './types';
import { detectResourceDrift } from './useDriftDetection';

// =============================================================================
// Types
// =============================================================================

/**
 * Apply operation result
 */
export interface ApplyResult<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Updated resource data from server */
  resource?: Resource<T>;
  /** Drift result after confirmation */
  driftResult?: DriftResult;
  /** Operation timestamp */
  timestamp: Date;
}

/**
 * Apply function signature
 */
export type ApplyFunction<TConfig = unknown> = (
  resourceUuid: string,
  configuration: TConfig
) => Promise<{
  success: boolean;
  error?: string;
  deployment?: DeploymentState;
  resource?: Resource<TConfig>;
}>;

/**
 * Confirm function signature (queries router for actual state)
 */
export type ConfirmFunction = (resourceUuid: string) => Promise<{
  deployment: DeploymentState;
  generatedFields: unknown;
}>;

/**
 * Options for useApplyConfirmDrift hook
 */
export interface UseApplyConfirmDriftOptions<TConfig = unknown> {
  /** Function to apply configuration to router */
  applyFn: ApplyFunction<TConfig>;
  /** Function to confirm state from router (optional, some backends do this internally) */
  confirmFn?: ConfirmFunction;
  /** Callback when drift status changes */
  onDriftChange?: (resourceUuid: string, result: DriftResult) => void;
  /** Callback when apply succeeds */
  onApplySuccess?: (resourceUuid: string, result: ApplyResult<TConfig>) => void;
  /** Callback when apply fails */
  onApplyError?: (resourceUuid: string, error: string) => void;
}

/**
 * Return type for useApplyConfirmDrift hook
 */
export interface UseApplyConfirmDriftReturn<TConfig = unknown> {
  /** Apply configuration following Apply-Confirm-Merge pattern */
  applyWithConfirm: (
    resource: Resource<TConfig>
  ) => Promise<ApplyResult<TConfig>>;
  /** Whether an apply operation is in progress */
  isApplying: boolean;
  /** Last apply result */
  lastResult: ApplyResult<TConfig> | null;
  /** Reset the hook state */
  reset: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for applying configuration changes with drift detection integration.
 *
 * Implements the Apply-Confirm-Merge pattern:
 * 1. Apply - Send configuration to router
 * 2. Confirm - Verify actual state from router
 * 3. Update - Store confirmed state in deployment layer
 * 4. Detect - Compute drift status
 *
 * @example
 * ```tsx
 * function ResourceEditor({ resource }) {
 *   const { applyWithConfirm, isApplying, lastResult } = useApplyConfirmDrift({
 *     applyFn: async (uuid, config) => {
 *       const result = await apolloClient.mutate({
 *         mutation: APPLY_RESOURCE,
 *         variables: { uuid, configuration: config },
 *       });
 *       return result.data.applyResource;
 *     },
 *     onDriftChange: (uuid, result) => {
 *       if (result.status === DriftStatus.DRIFTED) {
 *         toast.warning('Configuration drift detected after apply');
 *       }
 *     },
 *     onApplySuccess: (uuid, result) => {
 *       toast.success('Configuration applied successfully');
 *     },
 *   });
 *
 *   const handleSave = async (newConfig) => {
 *     const updatedResource = { ...resource, configuration: newConfig };
 *     const result = await applyWithConfirm(updatedResource);
 *     if (!result.success) {
 *       toast.error(result.error);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSave}>
 *       ...
 *       <Button disabled={isApplying}>
 *         {isApplying ? 'Applying...' : 'Apply Configuration'}
 *       </Button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useApplyConfirmDrift<TConfig = unknown>(
  options: UseApplyConfirmDriftOptions<TConfig>
): UseApplyConfirmDriftReturn<TConfig> {
  const { applyFn, confirmFn, onDriftChange, onApplySuccess, onApplyError } =
    options;

  const [isApplying, setIsApplying] = useState(false);
  const [lastResult, setLastResult] = useState<ApplyResult<TConfig> | null>(
    null
  );

  const applyWithConfirm = useCallback(
    async (resource: Resource<TConfig>): Promise<ApplyResult<TConfig>> => {
      setIsApplying(true);

      const timestamp = new Date();

      try {
        // Step 1: Apply configuration to router
        const applyResult = await applyFn(resource.uuid, resource.configuration);

        if (!applyResult.success) {
          const result: ApplyResult<TConfig> = {
            success: false,
            error: applyResult.error ?? 'Apply operation failed',
            timestamp,
          };
          setLastResult(result);
          onApplyError?.(resource.uuid, result.error!);
          return result;
        }

        // Step 2: Confirm state from router (if separate confirmFn provided)
        let deployment = applyResult.deployment;
        if (confirmFn && !deployment) {
          const confirmResult = await confirmFn(resource.uuid);
          deployment = confirmResult.deployment;
        }

        // Step 3: Build updated resource with deployment layer
        const updatedResource: Resource<TConfig> = {
          ...resource,
          ...(applyResult.resource ?? {}),
          deployment: deployment ?? {
            appliedAt: timestamp.toISOString(),
            isInSync: true,
            generatedFields: resource.configuration,
          },
        };

        // Step 4: Compute drift status (should be synced after successful apply)
        const driftResult = detectResourceDrift(updatedResource);

        // Notify of drift status change
        onDriftChange?.(resource.uuid, driftResult);

        const result: ApplyResult<TConfig> = {
          success: true,
          resource: updatedResource,
          driftResult,
          timestamp,
        };

        setLastResult(result);
        onApplySuccess?.(resource.uuid, result);

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during apply';

        const result: ApplyResult<TConfig> = {
          success: false,
          error: errorMessage,
          timestamp,
        };

        setLastResult(result);
        onApplyError?.(resource.uuid, errorMessage);

        return result;
      } finally {
        setIsApplying(false);
      }
    },
    [applyFn, confirmFn, onDriftChange, onApplySuccess, onApplyError]
  );

  const reset = useCallback(() => {
    setLastResult(null);
    setIsApplying(false);
  }, []);

  return {
    applyWithConfirm,
    isApplying,
    lastResult,
    reset,
  };
}

// =============================================================================
// Resolution Hooks
// =============================================================================

/**
 * Options for useDriftResolution hook
 */
export interface UseDriftResolutionOptions<TConfig = unknown> {
  /** Function to re-apply configuration to router */
  reapplyFn: (resourceUuid: string, configuration: TConfig) => Promise<void>;
  /** Function to accept router state (update configuration layer) */
  acceptFn: (resourceUuid: string, deployment: DeploymentState) => Promise<void>;
  /** Callback when resolution completes */
  onResolved?: (resourceUuid: string, action: 'REAPPLY' | 'ACCEPT') => void;
  /** Callback when resolution fails */
  onError?: (resourceUuid: string, error: string) => void;
}

/**
 * Return type for useDriftResolution hook
 */
export interface UseDriftResolutionReturn<TConfig = unknown> {
  /** Re-apply configuration to router */
  reapply: (resource: Resource<TConfig>) => Promise<boolean>;
  /** Accept router's state as new configuration */
  accept: (resource: Resource<TConfig>) => Promise<boolean>;
  /** Whether a resolution action is in progress */
  isResolving: boolean;
  /** Error message from last resolution attempt */
  error: string | null;
}

/**
 * Hook for resolving configuration drift.
 *
 * @example
 * ```tsx
 * function DriftResolver({ resource }) {
 *   const { reapply, accept, isResolving, error } = useDriftResolution({
 *     reapplyFn: async (uuid, config) => {
 *       await apolloClient.mutate({
 *         mutation: APPLY_RESOURCE,
 *         variables: { uuid, configuration: config },
 *       });
 *     },
 *     acceptFn: async (uuid, deployment) => {
 *       await apolloClient.mutate({
 *         mutation: UPDATE_CONFIGURATION,
 *         variables: { uuid, configuration: deployment.generatedFields },
 *       });
 *     },
 *     onResolved: (uuid, action) => {
 *       toast.success(`Drift resolved: ${action}`);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <Button onClick={() => reapply(resource)} disabled={isResolving}>
 *         Re-apply My Configuration
 *       </Button>
 *       <Button onClick={() => accept(resource)} disabled={isResolving}>
 *         Accept Router State
 *       </Button>
 *       {error && <Alert variant="destructive">{error}</Alert>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDriftResolution<TConfig = unknown>(
  options: UseDriftResolutionOptions<TConfig>
): UseDriftResolutionReturn<TConfig> {
  const { reapplyFn, acceptFn, onResolved, onError } = options;

  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reapply = useCallback(
    async (resource: Resource<TConfig>): Promise<boolean> => {
      setIsResolving(true);
      setError(null);

      try {
        await reapplyFn(resource.uuid, resource.configuration);
        onResolved?.(resource.uuid, 'REAPPLY');
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to re-apply configuration';
        setError(errorMessage);
        onError?.(resource.uuid, errorMessage);
        return false;
      } finally {
        setIsResolving(false);
      }
    },
    [reapplyFn, onResolved, onError]
  );

  const accept = useCallback(
    async (resource: Resource<TConfig>): Promise<boolean> => {
      setIsResolving(true);
      setError(null);

      if (!resource.deployment) {
        const errorMessage = 'No deployment state available to accept';
        setError(errorMessage);
        onError?.(resource.uuid, errorMessage);
        setIsResolving(false);
        return false;
      }

      try {
        await acceptFn(resource.uuid, resource.deployment);
        onResolved?.(resource.uuid, 'ACCEPT');
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to accept router state';
        setError(errorMessage);
        onError?.(resource.uuid, errorMessage);
        return false;
      } finally {
        setIsResolving(false);
      }
    },
    [acceptFn, onResolved, onError]
  );

  return {
    reapply,
    accept,
    isResolving,
    error,
  };
}
