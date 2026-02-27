/**
 * useExportAsTemplate Hook
 *
 * Mutation hook for exporting service instances as a reusable template.
 */

import { useMutation } from '@apollo/client';
import type {
  MutationExportAsTemplateArgs,
  ServiceTemplate,
  ExportAsTemplateInput,
} from '@nasnet/api-client/generated';

import { EXPORT_AS_TEMPLATE, GET_SERVICE_TEMPLATES } from './templates.graphql';

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
export function useExportAsTemplate(
  options: UseExportAsTemplateOptions = {}
): UseExportAsTemplateReturn {
  const { onCompleted, onError } = options;

  const [exportMutation, { data, loading, error, reset }] = useMutation<
    { exportAsTemplate: ServiceTemplate },
    MutationExportAsTemplateArgs
  >(EXPORT_AS_TEMPLATE, {
    onCompleted: (result) => {
      if (onCompleted) {
        onCompleted(result.exportAsTemplate);
      }
    },
    onError: (err) => {
      if (onError) {
        onError(new Error(err.message));
      }
    },
    // Refetch templates list after export
    refetchQueries: [
      {
        query: GET_SERVICE_TEMPLATES,
        variables: { routerID: null }, // Will include both built-in and custom
      },
    ],
  });

  const exportAsTemplate = async (input: ExportAsTemplateInput): Promise<ServiceTemplate> => {
    const result = await exportMutation({
      variables: { input },
    });

    if (!result.data?.exportAsTemplate) {
      throw new Error('Export template mutation returned no data');
    }

    return result.data.exportAsTemplate;
  };

  return {
    exportAsTemplate,
    loading,
    error: error ? new Error(error.message) : undefined,
    template: data?.exportAsTemplate,
    reset,
  };
}
