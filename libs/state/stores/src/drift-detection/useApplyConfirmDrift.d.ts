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
import type { Resource, DeploymentState } from '@nasnet/core/types';
import { type DriftResult } from './types';
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
export type ApplyFunction<TConfig = unknown> = (resourceUuid: string, configuration: TConfig) => Promise<{
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
    applyWithConfirm: (resource: Resource<TConfig>) => Promise<ApplyResult<TConfig>>;
    /** Whether an apply operation is in progress */
    isApplying: boolean;
    /** Last apply result */
    lastResult: ApplyResult<TConfig> | null;
    /** Reset the hook state */
    reset: () => void;
}
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
export declare function useApplyConfirmDrift<TConfig = unknown>(options: UseApplyConfirmDriftOptions<TConfig>): UseApplyConfirmDriftReturn<TConfig>;
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
export declare function useDriftResolution<TConfig = unknown>(options: UseDriftResolutionOptions<TConfig>): UseDriftResolutionReturn<TConfig>;
//# sourceMappingURL=useApplyConfirmDrift.d.ts.map