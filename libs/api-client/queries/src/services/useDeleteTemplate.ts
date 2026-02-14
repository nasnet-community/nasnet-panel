/**
 * useDeleteTemplate Hook
 *
 * Mutation hook for deleting user-created service templates.
 */

import { useMutation } from '@apollo/client';
import type { MutationDeleteServiceTemplateArgs } from '@nasnet/api-client/generated';

import { DELETE_SERVICE_TEMPLATE, GET_SERVICE_TEMPLATES } from './templates.graphql';

/**
 * Input for deleting a template
 */
export interface DeleteTemplateInput {
  /**
   * Router ID
   */
  routerID: string;

  /**
   * Template ID to delete
   */
  templateID: string;
}

/**
 * Options for useDeleteTemplate hook
 */
export interface UseDeleteTemplateOptions {
  /**
   * Callback invoked on successful deletion
   */
  onCompleted?: () => void;

  /**
   * Callback invoked on error
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useDeleteTemplate hook
 */
export interface UseDeleteTemplateReturn {
  /**
   * Mutation function to delete a template
   */
  deleteTemplate: (input: DeleteTemplateInput) => Promise<boolean>;

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error object if mutation failed
   */
  error: Error | undefined;

  /**
   * Reset mutation state
   */
  reset: () => void;
}

/**
 * Hook to delete a user-created service template
 *
 * Note: Built-in templates cannot be deleted and will return an error.
 *
 * @example
 * ```tsx
 * const { deleteTemplate, loading } = useDeleteTemplate({
 *   onCompleted: () => {
 *     toast.success('Template deleted');
 *   },
 *   onError: (error) => {
 *     toast.error(`Delete failed: ${error.message}`);
 *   },
 * });
 *
 * await deleteTemplate({
 *   routerID: 'router-1',
 *   templateID: 'template-123',
 * });
 * ```
 */
export function useDeleteTemplate(
  options: UseDeleteTemplateOptions = {}
): UseDeleteTemplateReturn {
  const { onCompleted, onError } = options;

  const [deleteMutation, { loading, error, reset }] = useMutation<
    { deleteServiceTemplate: boolean },
    MutationDeleteServiceTemplateArgs
  >(DELETE_SERVICE_TEMPLATE, {
    onCompleted: () => {
      if (onCompleted) {
        onCompleted();
      }
    },
    onError: (err) => {
      if (onError) {
        onError(new Error(err.message));
      }
    },
    // Refetch templates list after deletion
    refetchQueries: [
      {
        query: GET_SERVICE_TEMPLATES,
        variables: { routerID: null },
      },
    ],
    // Also update cache to remove deleted template
    update: (cache, { data }, { variables }) => {
      if (data?.deleteServiceTemplate && variables) {
        cache.evict({
          id: cache.identify({
            __typename: 'ServiceTemplate',
            id: variables.templateID,
          }),
        });
        cache.gc(); // Garbage collect evicted items
      }
    },
  });

  const deleteTemplate = async (input: DeleteTemplateInput): Promise<boolean> => {
    const result = await deleteMutation({
      variables: {
        routerID: input.routerID,
        templateID: input.templateID,
      },
    });

    return result.data?.deleteServiceTemplate || false;
  };

  return {
    deleteTemplate,
    loading,
    error: error ? new Error(error.message) : undefined,
    reset,
  };
}
