/**
 * Drift Detection Hook
 *
 * React hook for detecting configuration drift between desired state (configuration layer)
 * and actual state (deployment layer) in the Universal State v2 resource model.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#8-layer-resource-model
 */
import type { Resource, DeploymentState } from '@nasnet/core/types';
import { DriftStatus, type DriftResult, type DriftDetectionOptions } from './types';
/**
 * Input for drift detection - minimal resource data needed
 */
export interface DriftDetectionInput {
  /** Configuration layer data (user's desired state) */
  configuration: unknown;
  /** Deployment layer data (router's actual state) */
  deployment?: DeploymentState | null;
  /** Resource type for priority classification */
  resourceType?: string;
}
/**
 * Return type for useDriftDetection hook
 */
export interface UseDriftDetectionResult {
  /** Current drift result */
  result: DriftResult;
  /** Whether drift exists */
  hasDrift: boolean;
  /** Current drift status */
  status: DriftStatus;
  /** Number of drifted fields */
  driftCount: number;
  /** Recompute drift (useful after manual updates) */
  recompute: () => DriftResult;
}
/**
 * Detect drift between configuration and deployment layers
 *
 * @param input - Resource configuration and deployment data
 * @param options - Detection options
 * @returns Drift result
 */
export declare function detectDrift(
  input: DriftDetectionInput,
  options?: DriftDetectionOptions
): DriftResult;
/**
 * Detect drift for a full Resource object
 *
 * @param resource - Universal State v2 resource
 * @param options - Detection options
 * @returns Drift result
 */
export declare function detectResourceDrift<T = unknown>(
  resource: Resource<T>,
  options?: DriftDetectionOptions
): DriftResult;
/**
 * React hook for drift detection
 *
 * Computes drift status between configuration and deployment layers.
 * Memoized to only recompute when inputs change.
 *
 * @example
 * ```tsx
 * const { hasDrift, status, driftCount, result } = useDriftDetection({
 *   configuration: resource.configuration,
 *   deployment: resource.deployment,
 * });
 *
 * if (hasDrift) {
 *   console.log(`${driftCount} fields have drifted`);
 * }
 * ```
 */
export declare function useDriftDetection(
  input: DriftDetectionInput,
  options?: DriftDetectionOptions
): UseDriftDetectionResult;
/**
 * Hook for quick drift check (hash-based, no field-level diff)
 *
 * Use this for performance-critical scenarios like list views
 * where you only need to know IF drift exists, not WHAT drifted.
 */
export declare function useQuickDriftCheck(
  configuration: unknown,
  deployment: DeploymentState | null | undefined
): {
  hasDrift: boolean;
  status: DriftStatus;
};
/**
 * Hook to check drift status for multiple resources at once
 *
 * @param resources - Array of resources to check
 * @returns Map of resource UUID to drift status
 */
export declare function useBatchDriftStatus(resources: Resource[]): Map<string, DriftStatus>;
//# sourceMappingURL=useDriftDetection.d.ts.map
