/**
 * useInstallTemplate Hook
 *
 * Mutation hook for installing service templates with optimistic updates.
 */
import type {
  TemplateInstallResult,
  InstallServiceTemplateInput,
} from '@nasnet/api-client/generated';
/**
 * Options for useInstallTemplate hook
 */
export interface UseInstallTemplateOptions {
  /**
   * Callback invoked on successful installation
   */
  onCompleted?: (result: TemplateInstallResult) => void;
  /**
   * Callback invoked on error
   */
  onError?: (error: Error) => void;
  /**
   * Whether to refetch service instances after install (default: true)
   */
  refetchInstances?: boolean;
}
/**
 * Return type for useInstallTemplate hook
 */
export interface UseInstallTemplateReturn {
  /**
   * Mutation function to install a template
   */
  installTemplate: (input: InstallServiceTemplateInput) => Promise<TemplateInstallResult>;
  /**
   * Loading state
   */
  loading: boolean;
  /**
   * Error object if mutation failed
   */
  error: Error | undefined;
  /**
   * Result from the last mutation
   */
  data: TemplateInstallResult | undefined;
  /**
   * Reset mutation state
   */
  reset: () => void;
}
/**
 * Hook to install a service template
 *
 * Features:
 * - Optimistic updates: Adds placeholder instances to cache immediately
 * - Auto-refetch: Refreshes service instances list after installation
 * - Error handling: Retries on network errors (max 2 retries)
 *
 * @example
 * ```tsx
 * const { installTemplate, loading, error } = useInstallTemplate({
 *   onCompleted: (result) => {
 *     if (result.success) {
 *       toast.success(`Installed ${result.instanceIDs.length} services`);
 *     }
 *   },
 * });
 *
 * await installTemplate({
 *   routerID: 'router-1',
 *   templateID: 'template-123',
 *   variables: {
 *     TOR_NAME: 'Tor Exit Node',
 *     XRAY_PORT: 1080,
 *   },
 *   dryRun: false,
 * });
 * ```
 */
export declare function useInstallTemplate(
  options?: UseInstallTemplateOptions
): UseInstallTemplateReturn;
//# sourceMappingURL=useInstallTemplate.d.ts.map
