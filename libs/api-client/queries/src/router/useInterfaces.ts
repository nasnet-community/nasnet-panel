/**
 * Network Interface Query Hooks
 * Fetches network interface data from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { NetworkInterface, TrafficStatistics, ARPEntry, IPAddress } from '@nasnet/core/types';

/**
 * Query keys for network interface queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const interfaceKeys = {
  all: ['interfaces'] as const,
  lists: (routerIp: string) => [...interfaceKeys.all, 'list', routerIp] as const,
  list: (routerIp: string) => [...interfaceKeys.lists(routerIp)] as const,
  traffic: (routerIp: string, interfaceId: string) => [...interfaceKeys.all, 'traffic', routerIp, interfaceId] as const,
  arp: (routerIp: string) => ['arp', routerIp] as const,
  ipAddresses: (routerIp: string) => ['ip', 'addresses', routerIp] as const,
};

/**
 * Response format from RouterOS /rest/interface endpoint
 */
interface RouterOSInterfaceResponse {
  '.id': string;
  name: string;
  type: string;
  'mac-address': string;
  running?: boolean;
  disabled?: boolean;
  mtu?: number;
  comment?: string;
}

/**
 * Fetch all network interfaces from RouterOS via rosproxy
 * Endpoint: GET /rest/interface
 *
 * @param routerIp - Target router IP address
 * @returns Array of network interfaces
 */
async function fetchInterfaces(routerIp: string): Promise<NetworkInterface[]> {
  const result = await makeRouterOSRequest<RouterOSInterfaceResponse[]>(routerIp, 'interface');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch interfaces');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  // Transform RouterOS format to our NetworkInterface type
  return data.map((iface: RouterOSInterfaceResponse) => ({
    id: iface['.id'],
    name: iface.name,
    type: normalizeInterfaceType(iface.type),
    status: iface.disabled ? 'disabled' : 'running',
    macAddress: iface['mac-address'] || '',
    linkStatus: iface.running ? 'up' : 'down',
    mtu: iface.mtu,
    comment: iface.comment,
  }));
}

/**
 * Normalize RouterOS interface type to our InterfaceType enum
 */
function normalizeInterfaceType(type: string): NetworkInterface['type'] {
  const normalized = type.toLowerCase();

  if (normalized.includes('ether')) return 'ether';
  if (normalized.includes('bridge')) return 'bridge';
  if (normalized.includes('vlan')) return 'vlan';
  if (normalized.includes('wlan') || normalized.includes('wireless')) return 'wireless';
  if (normalized.includes('pppoe')) return 'pppoe';
  if (normalized.includes('wireguard')) return 'wireguard';
  if (normalized.includes('vrrp')) return 'vrrp';
  if (normalized.includes('bond')) return 'bonding';
  if (normalized.includes('loopback')) return 'loopback';
  if (normalized.includes('lte')) return 'lte';

  return 'other';
}

/**
 * Hook to fetch all network interfaces
 * Auto-refreshes every 5 seconds for real-time status updates
 *
 * Configuration:
 * - refetchInterval: 5000ms (5 seconds) - per FR0-13 requirement
 * - refetchIntervalInBackground: false - pause when tab inactive
 * - staleTime: 5000ms - matches refetch interval
 *
 * @param routerIp - Target router IP address
 * @returns Query result with NetworkInterface array
 */
export function useInterfaces(routerIp: string): UseQueryResult<NetworkInterface[], Error> {
  return useQuery({
    queryKey: interfaceKeys.list(routerIp),
    queryFn: () => fetchInterfaces(routerIp),
    refetchInterval: 5000, // 5 second polling per PRD FR0-13
    refetchIntervalInBackground: false, // Pause when tab not visible
    staleTime: 5000,
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}

/**
 * Response format from RouterOS /rest/interface/{type}
 */
interface RouterOSTrafficResponse {
  '.id': string;
  'tx-byte': number;
  'rx-byte': number;
  'tx-packet': number;
  'rx-packet': number;
  'tx-error': number;
  'rx-error': number;
  'tx-drop': number;
  'rx-drop': number;
}

/**
 * Fetch traffic statistics for a specific interface via rosproxy
 * Endpoint: GET /rest/interface/{interfaceId}
 *
 * @param routerIp - Target router IP address
 * @param interfaceId - RouterOS interface ID
 * @returns Traffic statistics
 */
async function fetchTrafficStats(routerIp: string, interfaceId: string): Promise<TrafficStatistics> {
  const result = await makeRouterOSRequest<RouterOSTrafficResponse>(
    routerIp,
    `interface/${interfaceId}`
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch traffic stats');
  }

  const data = result.data;

  return {
    interfaceId,
    txBytes: data['tx-byte'] || 0,
    rxBytes: data['rx-byte'] || 0,
    txPackets: data['tx-packet'] || 0,
    rxPackets: data['rx-packet'] || 0,
    txErrors: data['tx-error'] || 0,
    rxErrors: data['rx-error'] || 0,
    txDrops: data['tx-drop'] || 0,
    rxDrops: data['rx-drop'] || 0,
  };
}

/**
 * Hook to fetch traffic statistics for a specific interface
 * Lazy-loaded when interface details are expanded
 *
 * @param routerIp - Target router IP address
 * @param interfaceId - RouterOS interface ID
 * @returns Query result with TrafficStatistics
 */
export function useInterfaceTraffic(
  routerIp: string,
  interfaceId: string
): UseQueryResult<TrafficStatistics, Error> {
  return useQuery({
    queryKey: interfaceKeys.traffic(routerIp, interfaceId),
    queryFn: () => fetchTrafficStats(routerIp, interfaceId),
    enabled: !!routerIp && !!interfaceId, // Only fetch if both are provided
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });
}

/**
 * Response format from RouterOS /rest/ip/arp endpoint
 */
interface RouterOSARPResponse {
  '.id': string;
  'address': string;
  'mac-address': string;
  'interface': string;
  'complete'?: boolean;
  'invalid'?: boolean;
  'dynamic'?: boolean;
}

/**
 * Fetch ARP table entries from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/arp
 *
 * @param routerIp - Target router IP address
 * @returns Array of ARP entries
 */
async function fetchARPTable(routerIp: string): Promise<ARPEntry[]> {
  const result = await makeRouterOSRequest<RouterOSARPResponse[]>(routerIp, 'ip/arp');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch ARP table');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  return data.map((entry: RouterOSARPResponse) => ({
    id: entry['.id'],
    ipAddress: entry.address,
    macAddress: entry['mac-address'],
    interface: entry.interface,
    status: entry.invalid ? 'failed' : entry.complete ? 'complete' : 'incomplete',
    isDynamic: entry.dynamic ?? true,
  }));
}

/**
 * Hook to fetch ARP table entries
 * Auto-refreshes every 10 seconds
 *
 * @param routerIp - Target router IP address
 * @returns Query result with ARPEntry array
 */
export function useARPTable(routerIp: string): UseQueryResult<ARPEntry[], Error> {
  return useQuery({
    queryKey: interfaceKeys.arp(routerIp),
    queryFn: () => fetchARPTable(routerIp),
    refetchInterval: 10000, // 10 second polling - ARP changes less frequently
    refetchIntervalInBackground: false,
    staleTime: 10000,
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}

/**
 * Response format from RouterOS /rest/ip/address endpoint
 */
interface RouterOSIPAddressResponse {
  '.id': string;
  'address': string;
  'network': string;
  'interface': string;
  'dynamic'?: boolean;
  'disabled'?: boolean;
}

/**
 * Fetch IP addresses from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/address
 *
 * @param routerIp - Target router IP address
 * @returns Array of IP addresses
 */
async function fetchIPAddresses(routerIp: string): Promise<IPAddress[]> {
  const result = await makeRouterOSRequest<RouterOSIPAddressResponse[]>(routerIp, 'ip/address');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch IP addresses');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  return data.map((addr: RouterOSIPAddressResponse) => ({
    id: addr['.id'],
    address: addr.address,
    network: addr.network,
    interface: addr.interface,
    isDynamic: addr.dynamic ?? false,
    isDisabled: addr.disabled ?? false,
  }));
}

/**
 * Hook to fetch IP addresses
 * Auto-refreshes every 10 seconds
 *
 * @param routerIp - Target router IP address
 * @returns Query result with IPAddress array
 */
export function useIPAddresses(routerIp: string): UseQueryResult<IPAddress[], Error> {
  return useQuery({
    queryKey: interfaceKeys.ipAddresses(routerIp),
    queryFn: () => fetchIPAddresses(routerIp),
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    staleTime: 10000,
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
