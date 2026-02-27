/**
 * useTemplateInstallProgress Hook
 *
 * Subscription hook for monitoring template installation progress with polling fallback.
 */
import type { TemplateInstallProgress } from '@nasnet/api-client/generated';
/**
 * Options for useTemplateInstallProgress hook
 */
export interface UseTemplateInstallProgressOptions {
  /**
   * Router ID to monitor
   */
  routerID: string;
  /**
   * Whether to enable subscription (default: true)
   */
  enabled?: boolean;
  /**
   * Callback invoked when installation completes
   */
  onCompleted?: (progress: TemplateInstallProgress) => void;
  /**
   * Callback invoked when installation fails
   */
  onFailed?: (progress: TemplateInstallProgress) => void;
  /**
   * Polling interval in milliseconds if WebSocket fails (default: 10000ms = 10s)
   */
  pollingInterval?: number;
}
/**
 * Return type for useTemplateInstallProgress hook
 */
export interface UseTemplateInstallProgressReturn {
  /**
   * Current installation progress data
   */
  progress: TemplateInstallProgress | null;
  /**
   * Loading state (initial subscription setup)
   */
  loading: boolean;
  /**
   * Error object if subscription failed
   */
  error: Error | undefined;
  /**
   * Whether using polling fallback (WebSocket unavailable)
   */
  isPolling: boolean;
}
/**
 * Hook to monitor template installation progress
 *
 * Features:
 * - Real-time updates via GraphQL subscription (WebSocket)
 * - Automatic fallback to polling if WebSocket unavailable
 * - Auto-refetch service instances when installation completes
 * - Completion/failure callbacks
 *
 * @example
 * ```tsx
 * const { progress, loading, isPolling } = useTemplateInstallProgress({
 *   routerID: 'router-1',
 *   onCompleted: (progress) => {
 *     toast.success(`Installed ${progress.installedCount} services`);
 *   },
 *   onFailed: (progress) => {
 *     toast.error(`Installation failed: ${progress.errorMessage}`);
 *   },
 * });
 *
 * if (progress) {
 *   const percent = (progress.installedCount / progress.totalServices) * 100;
 *   return <ProgressBar value={percent} />;
 * }
 * ```
 */
export declare function useTemplateInstallProgress(
  options: UseTemplateInstallProgressOptions
): UseTemplateInstallProgressReturn;
//# sourceMappingURL=useTemplateInstallProgress.d.ts.map
