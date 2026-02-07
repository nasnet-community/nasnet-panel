import { useMutation } from '@apollo/client';
import {
  CREATE_IP_ADDRESS,
  UPDATE_IP_ADDRESS,
  DELETE_IP_ADDRESS,
  GET_IP_ADDRESSES,
} from './ip-address-queries.graphql';

/**
 * Hook for creating a new IP address
 * Includes cache invalidation to refetch the IP address list
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [createIpAddress, { loading, error }] = useCreateIPAddress();
 *
 * await createIpAddress({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       address: '192.168.1.1/24',
 *       interfaceId: 'ether1',
 *       comment: 'Management IP',
 *       disabled: false,
 *     },
 *   },
 * });
 * ```
 */
export function useCreateIPAddress() {
  return useMutation(CREATE_IP_ADDRESS, {
    // Refetch the IP address list after creation to ensure consistency
    refetchQueries: [{ query: GET_IP_ADDRESSES }],
    // Update cache optimistically for immediate UI feedback
    update(cache, { data }) {
      if (data?.createIpAddress?.ipAddress) {
        // Evict and refetch all IP address list queries
        cache.evict({ fieldName: 'ipAddresses' });
        cache.gc();
      }
    },
    // Note: Toast notifications should be handled by the calling component
  });
}

/**
 * Hook for updating an existing IP address
 * Includes cache invalidation and optimistic response
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [updateIpAddress, { loading, error }] = useUpdateIPAddress();
 *
 * await updateIpAddress({
 *   variables: {
 *     routerId: 'router-1',
 *     id: '*1',
 *     input: {
 *       address: '192.168.1.2/24',
 *       interfaceId: 'ether1',
 *       comment: 'Updated management IP',
 *       disabled: false,
 *     },
 *   },
 * });
 * ```
 */
export function useUpdateIPAddress() {
  return useMutation(UPDATE_IP_ADDRESS, {
    // Refetch the IP address list after update to ensure consistency
    refetchQueries: [{ query: GET_IP_ADDRESSES }],
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      updateIpAddress: {
        ipAddress: {
          id: vars.id,
          address: vars.input.address,
          network: '', // Will be calculated by backend
          broadcast: '', // Will be calculated by backend
          interface: {
            id: vars.input.interfaceId,
            name: '', // Will be filled by actual response
            type: 'ether', // Default assumption
            __typename: 'Interface',
          },
          disabled: vars.input.disabled ?? false,
          dynamic: false,
          invalid: false,
          comment: vars.input.comment ?? '',
          __typename: 'IpAddress',
        },
        errors: [],
        validationWarnings: [],
        impactAnalysis: null,
        __typename: 'IpAddressMutationResult',
      },
    }),
    // Note: Toast notifications should be handled by the calling component
  });
}

/**
 * Hook for deleting an IP address
 * Includes cache invalidation and automatic removal from cache
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [deleteIpAddress, { loading, error }] = useDeleteIPAddress();
 *
 * await deleteIpAddress({
 *   variables: {
 *     routerId: 'router-1',
 *     id: '*1',
 *   },
 * });
 * ```
 */
export function useDeleteIPAddress() {
  return useMutation(DELETE_IP_ADDRESS, {
    // Refetch the IP address list after deletion to ensure consistency
    refetchQueries: [{ query: GET_IP_ADDRESSES }],
    // Update cache to remove deleted IP address
    update(cache, { data }) {
      if (data?.deleteIpAddress?.success && data?.deleteIpAddress?.deletedId) {
        // Remove the deleted IP address from cache
        cache.evict({
          id: cache.identify({
            __typename: 'IpAddress',
            id: data.deleteIpAddress.deletedId,
          }),
        });
        // Evict and refetch all IP address list queries
        cache.evict({ fieldName: 'ipAddresses' });
        cache.gc();
      }
    },
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      deleteIpAddress: {
        success: true,
        deletedId: vars.id,
        errors: [],
        dependencies: null,
        __typename: 'IpAddressDeleteResult',
      },
    }),
    // Note: Toast notifications should be handled by the calling component
  });
}
