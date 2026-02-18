/**
 * Drift Detection Hook
 *
 * React hook for detecting configuration drift between desired state (configuration layer)
 * and actual state (deployment layer) in the Universal State v2 resource model.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#8-layer-resource-model
 */

import { useMemo, useCallback } from 'react';

import type { Resource, DeploymentState } from '@nasnet/core/types';

import {
  computeConfigHash,
  omitExcludedFields,
  findDriftedFields,
  hasQuickDrift,
  isDeploymentStale,
} from './driftUtils';
import {
  DriftStatus,
  type DriftResult,
  type DriftDetectionOptions,
  DEFAULT_DRIFT_OPTIONS,
} from './types';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Core Detection Function
// =============================================================================

/**
 * Detect drift between configuration and deployment layers
 *
 * @param input - Resource configuration and deployment data
 * @param options - Detection options
 * @returns Drift result
 */
export function detectDrift(
  input: DriftDetectionInput,
  options: DriftDetectionOptions = DEFAULT_DRIFT_OPTIONS
): DriftResult {
  const { configuration, deployment } = input;
  const now = new Date();

  // Handle missing deployment layer
  if (!deployment) {
    return {
      hasDrift: false,
      status: DriftStatus.PENDING,
      driftedFields: [],
      configurationHash: computeConfigHash(configuration),
      deploymentHash: '',
      lastChecked: now,
      errorMessage: 'Deployment layer not available - resource not yet applied',
    };
  }

  try {
    // Check if deployment is stale
    const staleThreshold =
      options.staleThreshold ?? DEFAULT_DRIFT_OPTIONS.staleThreshold;
    const isStale = isDeploymentStale(deployment.appliedAt, staleThreshold);

    // Get generated fields from deployment (this is what was actually applied)
    const deployedConfig = deployment.generatedFields ?? {};

    // Filter out runtime-only fields
    const excludeFields = options.excludeFields ?? [];
    const filteredConfig = omitExcludedFields(configuration, excludeFields);
    const filteredDeploy = omitExcludedFields(deployedConfig, excludeFields);

    // Compute hashes for quick comparison
    const configHash = computeConfigHash(filteredConfig);
    const deployHash = computeConfigHash(filteredDeploy);

    // Quick hash comparison first
    if (configHash === deployHash) {
      return {
        hasDrift: false,
        status: DriftStatus.SYNCED,
        driftedFields: [],
        configurationHash: configHash,
        deploymentHash: deployHash,
        lastChecked: now,
        isStale,
      };
    }

    // Detailed field-level diff for UI
    const driftedFields = findDriftedFields(
      filteredConfig,
      filteredDeploy,
      options
    );

    return {
      hasDrift: driftedFields.length > 0,
      status: driftedFields.length > 0 ? DriftStatus.DRIFTED : DriftStatus.SYNCED,
      driftedFields,
      configurationHash: configHash,
      deploymentHash: deployHash,
      lastChecked: now,
      isStale,
    };
  } catch (error) {
    // Handle detection errors
    return {
      hasDrift: false,
      status: DriftStatus.ERROR,
      driftedFields: [],
      configurationHash: '',
      deploymentHash: '',
      lastChecked: now,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Unknown error during drift detection',
    };
  }
}

/**
 * Detect drift for a full Resource object
 *
 * @param resource - Universal State v2 resource
 * @param options - Detection options
 * @returns Drift result
 */
export function detectResourceDrift<T = unknown>(
  resource: Resource<T>,
  options: DriftDetectionOptions = DEFAULT_DRIFT_OPTIONS
): DriftResult {
  return detectDrift(
    {
      configuration: resource.configuration,
      deployment: resource.deployment,
      resourceType: resource.type,
    },
    options
  );
}

// =============================================================================
// React Hook
// =============================================================================

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
export function useDriftDetection(
  input: DriftDetectionInput,
  options: DriftDetectionOptions = DEFAULT_DRIFT_OPTIONS
): UseDriftDetectionResult {
  // Memoize options to prevent unnecessary recomputation
  const memoizedOptions = useMemo(
    () => ({
      ...DEFAULT_DRIFT_OPTIONS,
      ...options,
    }),
    [options]
  );

  // Compute drift result
  const result = useMemo(() => {
    return detectDrift(input, memoizedOptions);
  }, [input, memoizedOptions]);

  // Callback to manually recompute
  const recompute = useCallback(() => {
    return detectDrift(input, memoizedOptions);
  }, [input, memoizedOptions]);

  return {
    result,
    hasDrift: result.hasDrift,
    status: result.status,
    driftCount: result.driftedFields.length,
    recompute,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook for quick drift check (hash-based, no field-level diff)
 *
 * Use this for performance-critical scenarios like list views
 * where you only need to know IF drift exists, not WHAT drifted.
 */
export function useQuickDriftCheck(
  configuration: unknown,
  deployment: DeploymentState | null | undefined
): { hasDrift: boolean; status: DriftStatus } {
  return useMemo(() => {
    if (!deployment) {
      return { hasDrift: false, status: DriftStatus.PENDING };
    }

    const deployedConfig = deployment.generatedFields ?? {};
    const hasDrift = hasQuickDrift(configuration, deployedConfig);

    return {
      hasDrift,
      status: hasDrift ? DriftStatus.DRIFTED : DriftStatus.SYNCED,
    };
  }, [configuration, deployment]);
}

/**
 * Hook to check drift status for multiple resources at once
 *
 * @param resources - Array of resources to check
 * @returns Map of resource UUID to drift status
 */
export function useBatchDriftStatus(
  resources: Resource[]
): Map<string, DriftStatus> {
  return useMemo(() => {
    const statusMap = new Map<string, DriftStatus>();

    for (const resource of resources) {
      if (!resource.deployment) {
        statusMap.set(resource.uuid, DriftStatus.PENDING);
        continue;
      }

      const deployedConfig = resource.deployment.generatedFields ?? {};
      const hasDrift = hasQuickDrift(
        resource.configuration,
        deployedConfig
      );
      statusMap.set(
        resource.uuid,
        hasDrift ? DriftStatus.DRIFTED : DriftStatus.SYNCED
      );
    }

    return statusMap;
  }, [resources]);
}
