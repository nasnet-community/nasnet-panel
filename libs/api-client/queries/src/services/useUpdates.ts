import { useQuery, useMutation, useSubscription } from '@apollo/client';
import type { UpdateStage } from '@nasnet/core/types';
import {
  GET_AVAILABLE_UPDATES,
  CHECK_FOR_UPDATES,
  UPDATE_INSTANCE,
  UPDATE_ALL_INSTANCES,
  ROLLBACK_INSTANCE,
  UPDATE_PROGRESS,
} from './updates.graphql';

// Re-export UpdateStage from core types to avoid circular dependency
// and maintain backward compatibility for existing consumers
export type { UpdateStage } from '@nasnet/core/types';

// ============================================================================
// TypeScript Types - Service Update Management (NAS-8.7)
// ============================================================================

/**
 * Update severity levels based on changelog analysis
 */
export type UpdateSeverity = 'SECURITY' | 'MAJOR' | 'MINOR' | 'PATCH';

/**
 * Available update information for a service instance
 */
export interface AvailableUpdate {
  instanceId: string;
  instanceName: string;
  featureId: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  severity: UpdateSeverity;
  changelogUrl?: string;
  releaseDate?: string;
  binarySize: number;
  requiredDiskMB: number;
  requiresRestart: boolean;
  breakingChanges: boolean;
  securityFixes: boolean;
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  instanceId: string;
  updateAvailable: boolean;
  latestVersion: string;
}

/**
 * Update progress event
 */
export interface UpdateProgressEvent {
  instanceId: string;
  stage: UpdateStage;
  progress: number;
  message: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  rolledBack: boolean;
  previousVersion?: string;
  newVersion?: string;
}

/**
 * Update result for bulk operations
 */
export interface UpdateResult {
  instanceId: string;
  success: boolean;
  error?: string;
}

/**
 * Mutation error
 */
export interface MutationError {
  field?: string;
  message: string;
}

// ============================================================================
// Query/Mutation Variables and Results
// ============================================================================

export interface GetAvailableUpdatesVariables {
  routerId: string;
}

export interface GetAvailableUpdatesResult {
  availableUpdates: AvailableUpdate[];
}

export interface CheckForUpdatesVariables {
  routerId: string;
}

export interface CheckForUpdatesResult {
  checkForUpdates: {
    success: boolean;
    checkTime: string;
    updates: UpdateCheckResult[];
    errors?: MutationError[];
  };
}

export interface UpdateInstanceVariables {
  routerId: string;
  instanceId: string;
}

export interface UpdateInstanceResult {
  updateInstance: {
    success: boolean;
    instance?: {
      id: string;
      binaryVersion: string;
      updatedAt: string;
    };
    errors?: MutationError[];
  };
}

export interface UpdateAllInstancesVariables {
  routerId: string;
}

export interface UpdateAllInstancesResult {
  updateAllInstances: {
    success: boolean;
    updatedCount: number;
    failedCount: number;
    results: UpdateResult[];
    errors?: MutationError[];
  };
}

export interface RollbackInstanceVariables {
  routerId: string;
  instanceId: string;
}

export interface RollbackInstanceResult {
  rollbackInstance: {
    success: boolean;
    instance?: {
      id: string;
      binaryVersion: string;
      updatedAt: string;
    };
    previousVersion?: string;
    errors?: MutationError[];
  };
}

export interface UpdateProgressVariables {
  routerId: string;
  instanceId: string;
}

export interface UpdateProgressResult {
  updateProgress: UpdateProgressEvent;
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to fetch available updates for all service instances on a router
 *
 * Provides a list of instances with update information including version,
 * severity, and changelog details. Use this to display the update UI.
 *
 * @param variables - Query variables including routerId
 * @param options - Apollo Client query options
 * @returns Available updates data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { updates, loading, error, refetch } = useAvailableUpdates({
 *   routerId: 'router-123',
 * });
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * const securityUpdates = updates?.filter(u => u.severity === 'SECURITY');
 * return (
 *   <UpdatesList
 *     updates={updates}
 *     securityCount={securityUpdates.length}
 *     onRefresh={refetch}
 *   />
 * );
 * ```
 */
export function useAvailableUpdates(
  variables: GetAvailableUpdatesVariables,
  options?: {
    pollInterval?: number;
    skip?: boolean;
  }
) {
  const { data, loading, error, refetch } = useQuery<
    GetAvailableUpdatesResult,
    GetAvailableUpdatesVariables
  >(GET_AVAILABLE_UPDATES, {
    variables,
    skip: !variables.routerId || options?.skip,
    pollInterval: options?.pollInterval,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  return {
    updates: data?.availableUpdates,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to manually check for updates across all instances
 *
 * Triggers a backend check for new versions from upstream registries.
 * Use this when user clicks "Check for Updates" button.
 *
 * @returns Mutation function, loading state, error, and result data
 *
 * @example
 * ```tsx
 * const [checkForUpdates, { loading, error }] = useCheckForUpdates();
 *
 * const handleCheckUpdates = async () => {
 *   const result = await checkForUpdates({
 *     variables: { routerId: 'router-123' },
 *   });
 *
 *   if (result.data?.checkForUpdates.success) {
 *     const updateCount = result.data.checkForUpdates.updates.filter(
 *       u => u.updateAvailable
 *     ).length;
 *     toast.success(`Found ${updateCount} updates`);
 *   } else if (result.data?.checkForUpdates.errors) {
 *     toast.error(result.data.checkForUpdates.errors[0].message);
 *   }
 * };
 * ```
 */
export function useCheckForUpdates() {
  const [checkForUpdates, { data, loading, error }] = useMutation<
    CheckForUpdatesResult,
    CheckForUpdatesVariables
  >(CHECK_FOR_UPDATES, {
    refetchQueries: ['GetAvailableUpdates'],
    awaitRefetchQueries: true,
  });

  return [
    checkForUpdates,
    {
      data,
      loading,
      error,
    },
  ] as const;
}

/**
 * Hook to update a single service instance
 *
 * Triggers an update for the specified instance. Progress can be monitored
 * via the UpdateProgress subscription.
 *
 * @returns Mutation function, loading state, error, and result data
 *
 * @example
 * ```tsx
 * const [updateInstance, { loading, error }] = useUpdateInstance();
 *
 * const handleUpdate = async (instanceId: string) => {
 *   const result = await updateInstance({
 *     variables: { routerId: 'router-123', instanceId },
 *   });
 *
 *   if (result.data?.updateInstance.success) {
 *     toast.success('Update started');
 *   } else if (result.data?.updateInstance.errors) {
 *     toast.error(result.data.updateInstance.errors[0].message);
 *   }
 * };
 * ```
 */
export function useUpdateInstance() {
  const [updateInstance, { data, loading, error }] = useMutation<
    UpdateInstanceResult,
    UpdateInstanceVariables
  >(UPDATE_INSTANCE, {
    refetchQueries: ['GetAvailableUpdates', 'GetServiceInstances'],
    awaitRefetchQueries: false,
  });

  return [
    updateInstance,
    {
      data,
      loading,
      error,
    },
  ] as const;
}

/**
 * Hook to update all instances with available updates
 *
 * Triggers bulk update for all instances. Use with caution - this can
 * cause service disruption if multiple instances restart simultaneously.
 *
 * @returns Mutation function, loading state, error, and result data
 *
 * @example
 * ```tsx
 * const [updateAll, { loading, error }] = useUpdateAllInstances();
 *
 * const handleUpdateAll = async () => {
 *   const confirmed = await confirmDialog({
 *     title: 'Update All Services',
 *     message: 'This will restart all services. Continue?',
 *   });
 *
 *   if (!confirmed) return;
 *
 *   const result = await updateAll({
 *     variables: { routerId: 'router-123' },
 *   });
 *
 *   if (result.data?.updateAllInstances) {
 *     const { updatedCount, failedCount } = result.data.updateAllInstances;
 *     toast.success(`Updated ${updatedCount} services, ${failedCount} failed`);
 *   }
 * };
 * ```
 */
export function useUpdateAllInstances() {
  const [updateAll, { data, loading, error }] = useMutation<
    UpdateAllInstancesResult,
    UpdateAllInstancesVariables
  >(UPDATE_ALL_INSTANCES, {
    refetchQueries: ['GetAvailableUpdates', 'GetServiceInstances'],
    awaitRefetchQueries: false,
  });

  return [
    updateAll,
    {
      data,
      loading,
      error,
    },
  ] as const;
}

/**
 * Hook to rollback an instance to previous version
 *
 * Reverts to the last known working version. Used when an update
 * causes issues or fails health checks.
 *
 * @returns Mutation function, loading state, error, and result data
 *
 * @example
 * ```tsx
 * const [rollback, { loading, error }] = useRollbackInstance();
 *
 * const handleRollback = async (instanceId: string) => {
 *   const result = await rollback({
 *     variables: { routerId: 'router-123', instanceId },
 *   });
 *
 *   if (result.data?.rollbackInstance.success) {
 *     const prev = result.data.rollbackInstance.previousVersion;
 *     toast.success(`Rolled back to version ${prev}`);
 *   } else if (result.data?.rollbackInstance.errors) {
 *     toast.error(result.data.rollbackInstance.errors[0].message);
 *   }
 * };
 * ```
 */
export function useRollbackInstance() {
  const [rollback, { data, loading, error }] = useMutation<
    RollbackInstanceResult,
    RollbackInstanceVariables
  >(ROLLBACK_INSTANCE, {
    refetchQueries: ['GetAvailableUpdates', 'GetServiceInstances'],
    awaitRefetchQueries: false,
  });

  return [
    rollback,
    {
      data,
      loading,
      error,
    },
  ] as const;
}

/**
 * Hook to subscribe to real-time update progress
 *
 * Monitors update progress for a specific instance. Emits progress updates
 * as the update proceeds through stages (download, verify, install, etc.).
 *
 * @param variables - Subscription variables (routerId, instanceId)
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Update progress event data, loading state, and error
 *
 * @example
 * ```tsx
 * const { progressEvent, loading, error } = useUpdateProgress({
 *   routerId: 'router-123',
 *   instanceId: 'instance-456',
 * });
 *
 * useEffect(() => {
 *   if (progressEvent) {
 *     const { stage, progress, message } = progressEvent;
 *
 *     if (stage === 'COMPLETE') {
 *       toast.success('Update complete!');
 *     } else if (stage === 'FAILED') {
 *       toast.error(`Update failed: ${progressEvent.error}`);
 *     } else if (stage === 'ROLLED_BACK') {
 *       toast.warning('Update rolled back due to health check failure');
 *     }
 *   }
 * }, [progressEvent]);
 * ```
 */
export function useUpdateProgress(variables: UpdateProgressVariables, enabled: boolean = true) {
  const { data, loading, error } = useSubscription<UpdateProgressResult, UpdateProgressVariables>(
    UPDATE_PROGRESS,
    {
      variables,
      skip: !enabled || !variables.routerId || !variables.instanceId,
      onData: ({ client, data }) => {
        if (data.data?.updateProgress) {
          const event = data.data.updateProgress;
          // Cache is updated automatically via normalized cache
          // Log event for debugging
          console.log(
            `Update progress: ${event.instanceId} - ${event.stage} (${event.progress}%): ${event.message}`
          );
        }
      },
    }
  );

  return {
    progressEvent: data?.updateProgress,
    loading,
    error,
  };
}
