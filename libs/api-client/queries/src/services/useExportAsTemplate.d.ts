/**
 * useExportAsTemplate Hook
 *
 * Mutation hook for exporting service instances as a reusable template.
 */
import type { ServiceTemplate, ExportAsTemplateInput } from '@nasnet/api-client/generated';
/**
 * Options for useExportAsTemplate hook
 */
export interface UseExportAsTemplateOptions {
  /**
   * Callback invoked on successful export
   */
  onCompleted?: (template: ServiceTemplate) => void;
  /**
   * Callback invoked on error
   */
  onError?: (error: Error) => void;
}
/**
 * Return type for useExportAsTemplate hook
 */
export interface UseExportAsTemplateReturn {
  /**
   * Mutation function to export instances as a template
   */
  exportAsTemplate: (input: ExportAsTemplateInput) => Promise<ServiceTemplate>;
  /**
   * Loading state
   */
  loading: boolean;
  /**
   * Error object if mutation failed
   */
  error: Error | undefined;
  /**
   * Exported template data
   */
  template: ServiceTemplate | undefined;
  /**
   * Reset mutation state
   */
  reset: () => void;
}
/**
 * Hook to export existing service instances as a reusable template
 *
 * Creates a new custom template from running services, preserving their
 * configuration and dependencies.
 *
 * @example
 * ```tsx
 * const { exportAsTemplate, loading, template } = useExportAsTemplate({
 *   onCompleted: (template) => {
 *     toast.success(`Template "${template.name}" created`);
 *   },
 * });
 *
 * await exportAsTemplate({
 *   routerID: 'router-1',
 *   instanceIDs: ['instance-1', 'instance-2'],
 *   name: 'My Privacy Stack',
 *   description: 'Tor + Xray proxy chain',
 *   category: 'PRIVACY',
 *   scope: 'CHAIN',
 * });
 * ```
 */
export declare function useExportAsTemplate(
  options?: UseExportAsTemplateOptions
): UseExportAsTemplateReturn;
//# sourceMappingURL=useExportAsTemplate.d.ts.map
