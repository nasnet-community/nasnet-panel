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
export declare function useCreateBridge(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useUpdateBridge(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useDeleteBridge(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useUndoBridgeOperation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useAddBridgePort(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useUpdateBridgePort(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useRemoveBridgePort(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useCreateBridgeVlan(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
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
export declare function useDeleteBridgeVlan(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
//# sourceMappingURL=useBridgeMutations.d.ts.map