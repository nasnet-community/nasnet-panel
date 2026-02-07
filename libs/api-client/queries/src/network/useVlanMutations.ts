import { useMutation } from '@apollo/client';
import {
  CREATE_VLAN,
  UPDATE_VLAN,
  DELETE_VLAN,
  CONFIGURE_VLAN_PORT,
  GET_VLANS,
} from './vlan-queries.graphql';

/**
 * Hook to create a new VLAN interface
 * Includes optimistic updates and cache invalidation
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useCreateVlan(routerId: string) {
  const [createVlan, { loading, error, data }] = useMutation(CREATE_VLAN, {
    // Refetch VLAN list after creation
    refetchQueries: [
      {
        query: GET_VLANS,
        variables: { routerId },
      },
    ],
    // Invalidate cache to ensure fresh data
    awaitRefetchQueries: true,
    // Show optimistic response during mutation
    optimisticResponse: (variables) => ({
      __typename: 'Mutation',
      createVlan: {
        __typename: 'VlanPayload',
        vlan: {
          __typename: 'Vlan',
          id: 'temp-' + Date.now(),
          name: variables.input.name,
          vlanId: variables.input.vlanId,
          interface: {
            __typename: 'Interface',
            id: variables.input.interface,
            name: variables.input.interface,
            type: 'vlan',
          },
          mtu: variables.input.mtu || null,
          comment: variables.input.comment || null,
          disabled: variables.input.disabled || false,
          running: false, // Won't know until server responds
        },
        errors: null,
      },
    }),
  });

  return {
    createVlan: (input: {
      name: string;
      vlanId: number;
      interface: string;
      mtu?: number;
      comment?: string;
      disabled?: boolean;
    }) =>
      createVlan({
        variables: { routerId, input },
      }),
    loading,
    error,
    data: data?.createVlan,
  };
}

/**
 * Hook to update an existing VLAN interface
 * Includes cache invalidation for affected queries
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useUpdateVlan(routerId: string) {
  const [updateVlan, { loading, error, data }] = useMutation(UPDATE_VLAN, {
    // Refetch VLAN list after update
    refetchQueries: [
      {
        query: GET_VLANS,
        variables: { routerId },
      },
    ],
    awaitRefetchQueries: true,
  });

  return {
    updateVlan: (
      id: string,
      input: {
        name: string;
        vlanId: number;
        interface: string;
        mtu?: number;
        comment?: string;
        disabled?: boolean;
      }
    ) =>
      updateVlan({
        variables: { routerId, id, input },
      }),
    loading,
    error,
    data: data?.updateVlan,
  };
}

/**
 * Hook to delete a VLAN interface
 * Includes optimistic cache update and confirmation handling
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useDeleteVlan(routerId: string) {
  const [deleteVlan, { loading, error, data }] = useMutation(DELETE_VLAN, {
    // Update cache immediately on optimistic response
    update(cache, { data: mutationData }) {
      if (mutationData?.deleteVlan?.success) {
        // Remove deleted VLAN from cache
        cache.evict({ id: cache.identify({ __typename: 'Vlan', id: mutationData.deleteVlan.deletedId }) });
        cache.gc(); // Garbage collect orphaned objects
      }
    },
    // Refetch VLAN list after deletion
    refetchQueries: [
      {
        query: GET_VLANS,
        variables: { routerId },
      },
    ],
    awaitRefetchQueries: true,
  });

  return {
    deleteVlan: (id: string) =>
      deleteVlan({
        variables: { routerId, id },
      }),
    loading,
    error,
    data: data?.deleteVlan,
  };
}

/**
 * Hook to configure a bridge port for VLAN access or trunk mode
 * Supports both access mode (single untagged VLAN) and trunk mode (multiple tagged VLANs)
 *
 * @returns Mutation function, loading state, error, and data
 */
export function useConfigureVlanPort(routerId: string) {
  const [configureVlanPort, { loading, error, data }] = useMutation(CONFIGURE_VLAN_PORT, {
    // Invalidate related queries after configuration
    refetchQueries: [
      {
        query: GET_VLANS,
        variables: { routerId },
      },
    ],
  });

  return {
    configureVlanPort: (
      portId: string,
      config: {
        mode: 'access' | 'trunk';
        pvid?: number;
        taggedVlanIds?: number[];
      }
    ) =>
      configureVlanPort({
        variables: { routerId, portId, config },
      }),
    loading,
    error,
    data: data?.configureVlanPort,
  };
}
