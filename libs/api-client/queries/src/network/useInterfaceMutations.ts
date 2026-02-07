import { useMutation } from '@apollo/client';
import {
  UPDATE_INTERFACE,
  ENABLE_INTERFACE,
  DISABLE_INTERFACE,
  BATCH_INTERFACE_OPERATION,
  GET_INTERFACES,
} from './queries.graphql';

/**
 * Hook for updating interface settings (MTU, comment, enabled state)
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useUpdateInterface() {
  return useMutation(UPDATE_INTERFACE, {
    // Refetch the interface list after update to ensure consistency
    refetchQueries: [{ query: GET_INTERFACES }],
    // Note: Toast notifications should be handled by the calling component
  });
}

/**
 * Hook for enabling a disabled interface
 * Includes optimistic response for immediate UI feedback
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useEnableInterface() {
  return useMutation(ENABLE_INTERFACE, {
    refetchQueries: [{ query: GET_INTERFACES }],
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      enableInterface: {
        interface: {
          id: vars.interfaceId,
          name: '', // Will be filled by actual response
          enabled: true,
          running: true,
          status: 'UP',
          __typename: 'Interface',
        },
        errors: [],
        __typename: 'UpdateInterfacePayload',
      },
    }),
  });
}

/**
 * Hook for disabling an active interface
 * Includes optimistic response for immediate UI feedback
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useDisableInterface() {
  return useMutation(DISABLE_INTERFACE, {
    refetchQueries: [{ query: GET_INTERFACES }],
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      disableInterface: {
        interface: {
          id: vars.interfaceId,
          name: '', // Will be filled by actual response
          enabled: false,
          running: false,
          status: 'DISABLED',
          __typename: 'Interface',
        },
        errors: [],
        __typename: 'UpdateInterfacePayload',
      },
    }),
  });
}

/**
 * Hook for performing batch operations on multiple interfaces
 * Supports ENABLE, DISABLE, and UPDATE actions
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [batchOperation, { loading }] = useBatchInterfaceOperation();
 *
 * // Enable multiple interfaces
 * await batchOperation({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       interfaceIds: ['*1', '*2', '*3'],
 *       action: 'ENABLE',
 *     },
 *   },
 * });
 * ```
 */
export function useBatchInterfaceOperation() {
  return useMutation(BATCH_INTERFACE_OPERATION, {
    refetchQueries: [{ query: GET_INTERFACES }],
    // Note: Toast notifications for partial success should be handled by calling component
  });
}
