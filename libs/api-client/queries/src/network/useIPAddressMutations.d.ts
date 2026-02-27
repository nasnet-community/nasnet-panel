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
export declare function useCreateIPAddress(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
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
export declare function useUpdateIPAddress(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
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
export declare function useDeleteIPAddress(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=useIPAddressMutations.d.ts.map
