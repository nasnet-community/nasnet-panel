/**
 * Hook for flushing DNS cache
 * Clears all cached DNS entries and returns before/after statistics
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [flushCache, { loading, data, error }] = useFlushDnsCache();
 *
 * // Flush cache with confirmation
 * const handleFlush = async () => {
 *   await flushCache({
 *     variables: {
 *       deviceId: 'router-1',
 *     },
 *   });
 *   // Show toast notification in calling component
 * };
 * ```
 */
export declare function useFlushDnsCache(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=useFlushDnsCache.d.ts.map
