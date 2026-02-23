/**
 * TanStack Query Hook for L2TP Client Interfaces
 * Fetches list of L2TP VPN client interfaces from the router
 * Story 0-4-4: Other VPN Type Viewer
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { L2TPInterface } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * RouterOS L2TP client interface response format
 */
interface RouterOSL2TPClientResponse {
  '.id': string;
  name: string;
  disabled?: boolean | string;
  running?: boolean | string;
  'connect-to'?: string;
  user?: string;
  comment?: string;
}

/**
 * Fetches L2TP client interfaces from RouterOS via rosproxy
 * Endpoint: GET /rest/interface/l2tp-client
 */
async function fetchL2TPInterfaces(routerIp: string): Promise<L2TPInterface[]> {
  const result = await makeRouterOSRequest<RouterOSL2TPClientResponse[]>(
    routerIp,
    'interface/l2tp-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch L2TP interfaces');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  return data.map((iface) => ({
    id: iface['.id'],
    name: iface.name,
    type: 'l2tp' as const,
    isDisabled: iface.disabled === 'true' || iface.disabled === true,
    isRunning: iface.running === 'true' || iface.running === true,
    connectTo: iface['connect-to'] || '',
    user: iface.user,
    comment: iface.comment,
  }));
}

/**
 * Query hook to fetch L2TP client interfaces
 * Auto-refreshes every 5 seconds for real-time status
 * Pauses when tab is not visible to conserve resources
 *
 * @param routerIp - Target router IP address
 * @returns UseQueryResult containing L2TP interfaces array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data: l2tpInterfaces, isLoading, isError } = useL2TPInterfaces(routerIp || '');
 * ```
 */
export function useL2TPInterfaces(routerIp: string): UseQueryResult<L2TPInterface[], Error> {
  return useQuery({
    queryKey: vpnKeys.l2tp(routerIp),
    queryFn: () => fetchL2TPInterfaces(routerIp),
    staleTime: 10000,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false, // Pause when tab hidden
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
