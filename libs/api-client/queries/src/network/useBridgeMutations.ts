import { useMutation } from '@apollo/client';
import {
  CREATE_BRIDGE,
  UPDATE_BRIDGE,
  DELETE_BRIDGE,
  UNDO_BRIDGE_OPERATION,
  ADD_BRIDGE_PORT,
  UPDATE_BRIDGE_PORT,
  REMOVE_BRIDGE_PORT,
  CREATE_BRIDGE_VLAN,
  DELETE_BRIDGE_VLAN,
  GET_BRIDGES,
  GET_BRIDGE,
  GET_BRIDGE_PORTS,
  GET_BRIDGE_VLANS,
  GET_AVAILABLE_INTERFACES,
} from './bridge-queries.graphql';

/**
 * Hook for creating a new bridge
 * Returns operation ID for 10-second undo window
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [createBridge, { loading, error, data }] = useCreateBridge();
 *
 * await createBridge({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       name: 'bridge1',
 *       protocol: 'RSTP',
 *       vlanFiltering: false,
 *     },
 *   },
 * });
 *
 * // Access operation ID for undo
 * const operationId = data?.createBridge?.operationId;
 * ```
 */
export function useCreateBridge() {
  return useMutation(CREATE_BRIDGE, {
    refetchQueries: [{ query: GET_BRIDGES }],
    // Note: Toast notification with undo button should be handled by calling component
  });
}

/**
 * Hook for updating an existing bridge
 * Returns operation ID for 10-second undo window
 * Includes optimistic response for immediate UI feedback
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [updateBridge, { loading, error, data }] = useUpdateBridge();
 *
 * await updateBridge({
 *   variables: {
 *     uuid: 'bridge-uuid',
 *     input: {
 *       vlanFiltering: true,
 *       pvid: 100,
 *     },
 *   },
 * });
 * ```
 */
export function useUpdateBridge() {
  return useMutation(UPDATE_BRIDGE, {
    refetchQueries: [{ query: GET_BRIDGES }, { query: GET_BRIDGE }],
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      updateBridge: {
        success: true,
        bridge: {
          uuid: vars.uuid,
          ...vars.input,
          __typename: 'Bridge',
        },
        errors: [],
        previousState: null,
        operationId: null,
        __typename: 'BridgeMutationResult',
      },
    }),
  });
}

/**
 * Hook for deleting a bridge
 * Returns operation ID for 10-second undo window
 * Requires confirmation with impact analysis before calling
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [deleteBridge, { loading, error, data }] = useDeleteBridge();
 *
 * // Show impact analysis confirmation first, then:
 * await deleteBridge({
 *   variables: { uuid: 'bridge-uuid' },
 * });
 * ```
 */
export function useDeleteBridge() {
  return useMutation(DELETE_BRIDGE, {
    refetchQueries: [{ query: GET_BRIDGES }, { query: GET_AVAILABLE_INTERFACES }],
    // Remove from cache optimistically
    update(cache, { data }) {
      if (data?.deleteBridge?.success) {
        cache.evict({
          id: cache.identify({ __typename: 'Bridge', uuid: data.deleteBridge.operationId }),
        });
        cache.gc();
      }
    },
  });
}

/**
 * Hook for undoing a bridge operation within 10-second window
 * Restores bridge to previous state
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [undoBridgeOperation, { loading }] = useUndoBridgeOperation();
 *
 * // Call within 10 seconds of operation
 * await undoBridgeOperation({
 *   variables: { operationId: 'operation-uuid' },
 * });
 * ```
 */
export function useUndoBridgeOperation() {
  return useMutation(UNDO_BRIDGE_OPERATION, {
    refetchQueries: [{ query: GET_BRIDGES }, { query: GET_BRIDGE }],
  });
}

/**
 * Hook for adding a port to a bridge
 * Returns operation ID for 10-second undo window
 * Includes optimistic response for drag-and-drop feedback
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [addBridgePort, { loading, error }] = useAddBridgePort();
 *
 * await addBridgePort({
 *   variables: {
 *     bridgeId: 'bridge-uuid',
 *     input: {
 *       interfaceId: 'ether4',
 *       pvid: 1,
 *       frameTypes: 'ADMIT_ALL',
 *       ingressFiltering: false,
 *     },
 *   },
 * });
 * ```
 */
export function useAddBridgePort() {
  return useMutation(ADD_BRIDGE_PORT, {
    refetchQueries: [{ query: GET_BRIDGE_PORTS }, { query: GET_AVAILABLE_INTERFACES }],
    // Optimistic response for immediate UI update (drag-and-drop feedback)
    optimisticResponse: (vars: any) => ({
      addBridgePort: {
        success: true,
        port: {
          uuid: `temp-${Date.now()}`,
          pvid: vars.input.pvid || 1,
          frameTypes: vars.input.frameTypes || 'ADMIT_ALL',
          ingressFiltering: vars.input.ingressFiltering || false,
          taggedVlans: [],
          untaggedVlans: [],
          role: 'DESIGNATED',
          state: 'FORWARDING',
          pathCost: 10,
          edge: false,
          __typename: 'BridgePort',
        },
        errors: [],
        previousState: null,
        operationId: null,
        __typename: 'BridgePortMutationResult',
      },
    }),
  });
}

/**
 * Hook for updating bridge port settings
 * Returns operation ID for 10-second undo window
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [updateBridgePort, { loading }] = useUpdateBridgePort();
 *
 * await updateBridgePort({
 *   variables: {
 *     portId: 'port-uuid',
 *     input: {
 *       pvid: 10,
 *       taggedVlans: [10, 20],
 *       ingressFiltering: true,
 *     },
 *   },
 * });
 * ```
 */
export function useUpdateBridgePort() {
  return useMutation(UPDATE_BRIDGE_PORT, {
    refetchQueries: [{ query: GET_BRIDGE_PORTS }],
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      updateBridgePort: {
        success: true,
        port: {
          uuid: vars.portId,
          ...vars.input,
          __typename: 'BridgePort',
        },
        errors: [],
        previousState: null,
        operationId: null,
        __typename: 'BridgePortMutationResult',
      },
    }),
  });
}

/**
 * Hook for removing a port from a bridge
 * Returns operation ID for 10-second undo window
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [removeBridgePort, { loading }] = useRemoveBridgePort();
 *
 * await removeBridgePort({
 *   variables: { portId: 'port-uuid' },
 * });
 * ```
 */
export function useRemoveBridgePort() {
  return useMutation(REMOVE_BRIDGE_PORT, {
    refetchQueries: [{ query: GET_BRIDGE_PORTS }, { query: GET_AVAILABLE_INTERFACES }],
    // Remove from cache optimistically
    update(cache, { data }) {
      if (data?.removeBridgePort?.success) {
        cache.evict({
          id: cache.identify({ __typename: 'BridgePort', uuid: data.removeBridgePort.operationId }),
        });
        cache.gc();
      }
    },
  });
}

/**
 * Hook for creating a bridge VLAN entry
 * Configures VLAN ID with tagged and untagged ports
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [createBridgeVlan, { loading }] = useCreateBridgeVlan();
 *
 * await createBridgeVlan({
 *   variables: {
 *     bridgeId: 'bridge-uuid',
 *     input: {
 *       vlanId: 10,
 *       taggedPortIds: ['port1', 'port2'],
 *       untaggedPortIds: ['port3'],
 *     },
 *   },
 * });
 * ```
 */
export function useCreateBridgeVlan() {
  return useMutation(CREATE_BRIDGE_VLAN, {
    refetchQueries: [{ query: GET_BRIDGE_VLANS }],
  });
}

/**
 * Hook for deleting a bridge VLAN entry
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [deleteBridgeVlan, { loading }] = useDeleteBridgeVlan();
 *
 * await deleteBridgeVlan({
 *   variables: { uuid: 'vlan-uuid' },
 * });
 * ```
 */
export function useDeleteBridgeVlan() {
  return useMutation(DELETE_BRIDGE_VLAN, {
    refetchQueries: [{ query: GET_BRIDGE_VLANS }],
    // Remove from cache optimistically
    update(cache, { data }, { variables }) {
      if (data?.deleteBridgeVlan?.success && variables) {
        cache.evict({ id: cache.identify({ __typename: 'BridgeVlan', uuid: variables.uuid }) });
        cache.gc();
      }
    },
  });
}
