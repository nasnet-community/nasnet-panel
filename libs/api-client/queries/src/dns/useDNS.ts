/**
 * DNS Query Hooks
 * Fetches DNS settings and static entries using Apollo Client + GraphQL
 *
 * Per ADR-011: Unified GraphQL Architecture
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useQuery, gql } from '@apollo/client';
import type { DNSSettings, DNSStaticEntry } from '@nasnet/core/types';

/**
 * GraphQL query to fetch DNS settings from router
 *
 * Retrieves complete DNS configuration including:
 * - Static servers (user-configured)
 * - Dynamic servers (from DHCP/PPPoE)
 * - Cache settings and usage
 * - Remote request setting
 */
const GET_DNS_SETTINGS = gql`
  query GetDNSSettings($deviceId: ID!) {
    device(id: $deviceId) {
      dnsSettings {
        allowRemoteRequests
        cacheMaxTtl
        cacheSize
        cacheUsed
        maxConcurrentQueries
        maxConcurrentTcpSessions
        maxUdpPacketSize
        servers
        dynamicServers
      }
    }
  }
`;

/**
 * GraphQL query to fetch DNS static entries from router
 *
 * Retrieves all static DNS hostname-to-IP mappings configured on the router.
 * Used for local network device name resolution.
 */
const GET_DNS_STATIC_ENTRIES = gql`
  query GetDNSStaticEntries($deviceId: ID!) {
    device(id: $deviceId) {
      dnsStaticEntries {
        id
        name
        address
        ttl
        type
        regexp
        comment
        disabled
      }
    }
  }
`;

/**
 * Hook to fetch DNS settings from router
 *
 * Configuration:
 * - pollInterval: 60000ms (1 minute) - DNS settings are relatively stable
 * - skip: true if deviceId is not provided
 *
 * @param deviceId - Target router device ID
 * @returns Query result with DNSSettings data
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useDNSSettings(routerId);
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 * const settings = data.device.dnsSettings;
 * ```
 */
export function useDNSSettings(deviceId: string) {
  return useQuery(GET_DNS_SETTINGS, {
    variables: { deviceId },
    skip: !deviceId,
    pollInterval: 60000, // Poll every 60s - relatively stable config
    fetchPolicy: 'cache-and-network', // Show cached data while fetching fresh data
  });
}

/**
 * Hook to fetch DNS static entries from router
 *
 * Configuration:
 * - pollInterval: 30000ms (30 seconds) - entries may change more frequently
 * - skip: true if deviceId is not provided
 *
 * @param deviceId - Target router device ID
 * @returns Query result with DNSStaticEntry[] data
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useDNSStaticEntries(routerId);
 * const entries = data?.device.dnsStaticEntries || [];
 * ```
 */
export function useDNSStaticEntries(deviceId: string) {
  return useQuery(GET_DNS_STATIC_ENTRIES, {
    variables: { deviceId },
    skip: !deviceId,
    pollInterval: 30000, // Poll every 30s - entries may change
    fetchPolicy: 'cache-and-network',
  });
}
