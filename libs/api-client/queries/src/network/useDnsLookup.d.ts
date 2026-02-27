/**
 * Hook for performing DNS lookups
 * Executes DNS resolution for a hostname using specified DNS server and record type
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [runLookup, { loading, data, error }] = useDnsLookup();
 *
 * // Perform A record lookup
 * await runLookup({
 *   variables: {
 *     input: {
 *       deviceId: 'router-1',
 *       hostname: 'google.com',
 *       recordType: 'A',
 *       server: '8.8.8.8', // Optional
 *       timeout: 5, // Optional, seconds
 *     },
 *   },
 * });
 * ```
 */
export declare function useDnsLookup(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=useDnsLookup.d.ts.map
