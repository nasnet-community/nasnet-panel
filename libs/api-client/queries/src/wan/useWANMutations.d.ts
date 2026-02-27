/**
 * Hook for configuring DHCP client on a WAN interface
 * Includes cache invalidation to refetch the WAN interface list
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [configureDhcpWAN, { loading, error }] = useConfigureDhcpWAN();
 *
 * await configureDhcpWAN({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       interface: 'ether1',
 *       addDefaultRoute: true,
 *       usePeerDNS: true,
 *       usePeerNTP: false,
 *       comment: 'Primary WAN',
 *     },
 *   },
 * });
 * ```
 */
export declare function useConfigureDhcpWAN(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for configuring PPPoE client on a WAN interface
 * Includes cache invalidation to refetch the WAN interface list
 *
 * IMPORTANT: Never log the password field!
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [configurePppoeWAN, { loading, error }] = useConfigurePppoeWAN();
 *
 * await configurePppoeWAN({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       name: 'pppoe-wan',
 *       interface: 'ether1',
 *       username: 'user@isp.com',
 *       password: 'secret', // NEVER LOG THIS
 *       addDefaultRoute: true,
 *       usePeerDNS: true,
 *       mtu: 1492,
 *       comment: 'PPPoE WAN',
 *     },
 *   },
 * });
 * ```
 */
export declare function useConfigurePppoeWAN(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for configuring static IP on a WAN interface
 * Includes cache invalidation and IP conflict validation
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [configureStaticWAN, { loading, error }] = useConfigureStaticWAN();
 *
 * await configureStaticWAN({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       interface: 'ether1',
 *       address: '203.0.113.10/30',
 *       gateway: '203.0.113.9',
 *       primaryDNS: '1.1.1.1',
 *       secondaryDNS: '8.8.8.8',
 *       comment: 'Static WAN',
 *     },
 *   },
 * });
 * ```
 */
export declare function useConfigureStaticWAN(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for configuring LTE modem
 * Includes cache invalidation to refetch the WAN interface list
 *
 * IMPORTANT: Never log the PIN field!
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [configureLteWAN, { loading, error }] = useConfigureLteWAN();
 *
 * await configureLteWAN({
 *   variables: {
 *     routerId: 'router-1',
 *     input: {
 *       name: 'lte1',
 *       apn: 'internet',
 *       pin: '1234', // NEVER LOG THIS
 *       comment: 'LTE backup WAN',
 *     },
 *   },
 * });
 * ```
 */
export declare function useConfigureLteWAN(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for configuring health check for a WAN interface
 * Includes cache update for the specific WAN interface
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [configureHealthCheck, { loading, error }] = useConfigureWANHealthCheck();
 *
 * await configureHealthCheck({
 *   variables: {
 *     routerId: 'router-1',
 *     wanInterfaceId: 'wan-dhcp-ether1',
 *     input: {
 *       target: '8.8.8.8',
 *       interval: 30,
 *       enabled: true,
 *     },
 *   },
 * });
 * ```
 */
export declare function useConfigureWANHealthCheck(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Hook for deleting WAN configuration (reverts interface to unconfigured)
 * Includes cache invalidation and automatic removal from cache
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [deleteWANConfig, { loading, error }] = useDeleteWANConfiguration();
 *
 * await deleteWANConfig({
 *   variables: {
 *     routerId: 'router-1',
 *     wanInterfaceId: 'wan-dhcp-ether1',
 *   },
 * });
 * ```
 */
export declare function useDeleteWANConfiguration(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=useWANMutations.d.ts.map
