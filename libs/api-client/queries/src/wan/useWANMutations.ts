import { useMutation } from '@apollo/client';
import {
  CONFIGURE_DHCP_WAN,
  CONFIGURE_PPPOE_WAN,
  CONFIGURE_STATIC_WAN,
  CONFIGURE_LTE_WAN,
  CONFIGURE_WAN_HEALTH_CHECK,
  DELETE_WAN_CONFIGURATION,
  GET_WAN_INTERFACES,
  GET_WAN_INTERFACE,
} from './wan-queries.graphql';

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
export function useConfigureDhcpWAN() {
  return useMutation(CONFIGURE_DHCP_WAN, {
    // Refetch WAN interfaces after configuration
    refetchQueries: [{ query: GET_WAN_INTERFACES }],
    // Update cache
    update(cache, { data }) {
      if (data?.configureDhcpWAN?.success) {
        // Evict and refetch all WAN interface list queries
        cache.evict({ fieldName: 'wanInterfaces' });
        cache.gc();
      }
    },
    // Note: Toast notifications should be handled by the calling component
  });
}

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
export function useConfigurePppoeWAN() {
  return useMutation(CONFIGURE_PPPOE_WAN, {
    // Refetch WAN interfaces after configuration
    refetchQueries: [{ query: GET_WAN_INTERFACES }],
    // Update cache
    update(cache, { data }) {
      if (data?.configurePppoeWAN?.success) {
        // Evict and refetch all WAN interface list queries
        cache.evict({ fieldName: 'wanInterfaces' });
        cache.gc();
      }
    },
    // Note: Toast notifications should be handled by the calling component
  });
}

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
export function useConfigureStaticWAN() {
  return useMutation(CONFIGURE_STATIC_WAN, {
    // Refetch WAN interfaces after configuration
    refetchQueries: [{ query: GET_WAN_INTERFACES }],
    // Update cache
    update(cache, { data }) {
      if (data?.configureStaticWAN?.success) {
        // Evict and refetch all WAN interface list queries
        cache.evict({ fieldName: 'wanInterfaces' });
        cache.gc();
      }
    },
    // Note: Toast notifications should be handled by the calling component
  });
}

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
export function useConfigureLteWAN() {
  return useMutation(CONFIGURE_LTE_WAN, {
    // Refetch WAN interfaces after configuration
    refetchQueries: [{ query: GET_WAN_INTERFACES }],
    // Update cache
    update(cache, { data }) {
      if (data?.configureLteWAN?.success) {
        // Evict and refetch all WAN interface list queries
        cache.evict({ fieldName: 'wanInterfaces' });
        cache.gc();
      }
    },
    // Note: Toast notifications should be handled by the calling component
  });
}

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
export function useConfigureWANHealthCheck() {
  return useMutation(CONFIGURE_WAN_HEALTH_CHECK, {
    // Refetch specific WAN interface after health check configuration
    refetchQueries: [{ query: GET_WAN_INTERFACE }],
    // Update cache
    update(cache, { data }) {
      if (data?.configureWANHealthCheck?.success) {
        // Evict specific WAN interface to force refetch
        cache.evict({ fieldName: 'wanInterface' });
        cache.gc();
      }
    },
    // Note: Toast notifications should be handled by the calling component
  });
}

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
export function useDeleteWANConfiguration() {
  return useMutation(DELETE_WAN_CONFIGURATION, {
    // Refetch WAN interfaces after deletion
    refetchQueries: [{ query: GET_WAN_INTERFACES }],
    // Update cache to remove deleted WAN configuration
    update(cache, { data }) {
      if (data?.deleteWANConfiguration?.success && data?.deleteWANConfiguration?.deletedId) {
        // Remove the deleted WAN interface from cache
        cache.evict({
          id: cache.identify({
            __typename: 'WANInterface',
            id: data.deleteWANConfiguration.deletedId,
          }),
        });
        // Evict and refetch all WAN interface list queries
        cache.evict({ fieldName: 'wanInterfaces' });
        cache.gc();
      }
    },
    // Optimistic response for immediate UI update
    optimisticResponse: (vars: any) => ({
      deleteWANConfiguration: {
        success: true,
        message: 'WAN configuration deleted successfully',
        deletedId: vars.wanInterfaceId,
        __typename: 'DeleteResult',
      },
    }),
    // Note: Toast notifications should be handled by the calling component
  });
}
