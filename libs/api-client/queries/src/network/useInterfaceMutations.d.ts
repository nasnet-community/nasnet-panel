/**
 * Hook for updating interface settings (MTU, comment, enabled state)
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useUpdateInterface(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for enabling a disabled interface
 * Includes optimistic response for immediate UI feedback
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useEnableInterface(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for disabling an active interface
 * Includes optimistic response for immediate UI feedback
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useDisableInterface(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
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
export declare function useBatchInterfaceOperation(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=useInterfaceMutations.d.ts.map
