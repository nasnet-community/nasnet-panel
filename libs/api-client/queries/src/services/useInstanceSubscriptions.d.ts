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
export declare function useInstallProgress(
  routerId: string,
  enabled?: boolean
): {
  progress: InstallProgress | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
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
export declare function useInstanceStatusChanged(
  routerId: string,
  enabled?: boolean
): {
  statusChange: InstanceStatusChanged | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
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
export declare function useInstanceMonitoring(
  routerId: string,
  enabled?: boolean
): {
  installProgress: InstallProgress | undefined;
  statusChange: InstanceStatusChanged | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
//# sourceMappingURL=useInstanceSubscriptions.d.ts.map
