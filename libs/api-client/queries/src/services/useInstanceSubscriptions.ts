import { useSubscription } from '@apollo/client';
import { SUBSCRIBE_INSTALL_PROGRESS, SUBSCRIBE_INSTANCE_STATUS_CHANGED } from './services.graphql';

/**
 * Installation progress event from subscription
 */
export interface InstallProgress {
  routerID: string;
  featureID: string;
  instanceID: string;
  status: string;
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  errorMessage?: string | null;
}

/**
 * Instance status change event from subscription
 */
export interface InstanceStatusChanged {
  routerID: string;
  instanceID: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  message?: string;
}

/**
 * Hook to subscribe to real-time installation progress updates
 *
 * Provides live download progress, verification status, and installation phases.
 * Use this to show progress bars and status messages during service installation.
 *
 * @param routerId - Router ID to monitor installations for
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Installation progress data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useInstallProgress('router-1');
 *
 * if (data) {
 *   console.log(`${data.installProgress.phase}: ${data.installProgress.progress}%`);
 *   if (data.installProgress.bytesDownloaded) {
 *     console.log(`Downloaded: ${data.installProgress.bytesDownloaded} / ${data.installProgress.totalBytes}`);
 *   }
 * }
 * ```
 */
export function useInstallProgress(routerId: string, enabled: boolean = true) {
  const { data, loading, error } = useSubscription(SUBSCRIBE_INSTALL_PROGRESS, {
    variables: { routerID: routerId },
    skip: !enabled || !routerId,
    // Apollo Client will automatically update the cache when receiving subscription data
    onData: ({ client, data }) => {
      if (data.data?.installProgress) {
        const progress = data.data.installProgress;
        // Cache is updated automatically via normalized cache
        // Additional side effects can be added here if needed (e.g., notifications)
        if (progress.status === 'completed') {
          console.log(`Installation complete for ${progress.featureID}`);
        } else if (progress.status === 'failed') {
          console.error(`Installation failed: ${progress.errorMessage}`);
        }
      }
    },
  });

  return {
    progress: data?.installProgress as InstallProgress | undefined,
    loading,
    error,
  };
}

/**
 * Hook to subscribe to real-time instance status changes
 *
 * Monitors all service instances on a router for status transitions.
 * Use this to show live updates when instances start, stop, or fail.
 *
 * @param routerId - Router ID to monitor instances for
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Instance status change data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useInstanceStatusChanged('router-1');
 *
 * useEffect(() => {
 *   if (data?.instanceStatusChanged) {
 *     const change = data.instanceStatusChanged;
 *     toast.info(`Instance ${change.instanceID}: ${change.oldStatus} → ${change.newStatus}`);
 *   }
 * }, [data]);
 * ```
 */
export function useInstanceStatusChanged(routerId: string, enabled: boolean = true) {
  const { data, loading, error } = useSubscription(SUBSCRIBE_INSTANCE_STATUS_CHANGED, {
    variables: { routerID: routerId },
    skip: !enabled || !routerId,
    // Apollo Client automatically updates the normalized cache
    onData: ({ client, data }) => {
      if (data.data?.instanceStatusChanged) {
        const change = data.data.instanceStatusChanged;
        // Cache is updated automatically
        // Additional side effects can be added here (e.g., notifications, analytics)
        console.log(
          `Instance status changed: ${change.instanceID} (${change.oldStatus} → ${change.newStatus})`
        );
      }
    },
  });

  return {
    statusChange: data?.instanceStatusChanged as InstanceStatusChanged | undefined,
    loading,
    error,
  };
}

/**
 * Combined hook for monitoring both installation progress and status changes
 *
 * Useful for comprehensive monitoring of all service instance activity on a router.
 * Combines install progress tracking with ongoing status change notifications.
 *
 * @param routerId - Router ID to monitor
 * @param enabled - Whether to enable subscriptions (default: true)
 * @returns Combined subscription data
 *
 * @example
 * ```tsx
 * const {
 *   installProgress,
 *   statusChange,
 *   loading,
 *   error
 * } = useInstanceMonitoring('router-1');
 *
 * // Show install progress bar
 * if (installProgress) {
 *   <ProgressBar value={installProgress.progress} phase={installProgress.phase} />
 * }
 *
 * // Show status change notifications
 * if (statusChange) {
 *   <Toast>{statusChange.message}</Toast>
 * }
 * ```
 */
export function useInstanceMonitoring(routerId: string, enabled: boolean = true) {
  const {
    progress: installProgress,
    loading: installLoading,
    error: installError,
  } = useInstallProgress(routerId, enabled);

  const {
    statusChange,
    loading: statusLoading,
    error: statusError,
  } = useInstanceStatusChanged(routerId, enabled);

  return {
    installProgress,
    statusChange,
    loading: installLoading || statusLoading,
    error: installError || statusError,
  };
}
