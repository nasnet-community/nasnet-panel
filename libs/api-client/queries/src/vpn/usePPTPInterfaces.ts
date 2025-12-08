/**
 * TanStack Query Hook for PPTP Client Interfaces
 * Fetches list of PPTP VPN client interfaces from the router
 * Story 0-4-4: Other VPN Type Viewer
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { PPTPInterface } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * RouterOS PPTP client interface response format
 */
interface RouterOSPPTPClientResponse {
  '.id': string;
  name: string;
  disabled?: boolean | string;
  running?: boolean | string;
  'connect-to'?: string;
  user?: string;
  comment?: string;
}

/**
 * Fetches PPTP client interfaces from RouterOS via rosproxy
 * Endpoint: GET /rest/interface/pptp-client
 */
async function fetchPPTPInterfaces(routerIp: string): Promise<PPTPInterface[]> {
  const result = await makeRouterOSRequest<RouterOSPPTPClientResponse[]>(
    routerIp,
    'interface/pptp-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch PPTP interfaces');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  return data.map((iface) => ({
    id: iface['.id'],
    name: iface.name,
    type: 'pptp' as const,
    disabled: iface.disabled === 'true' || iface.disabled === true,
    running: iface.running === 'true' || iface.running === true,
    connectTo: iface['connect-to'] || '',
    user: iface.user,
    comment: iface.comment,
  }));
}

/**
 * Query hook to fetch PPTP client interfaces
 * Auto-refreshes every 5 seconds for real-time status
 * Pauses when tab is not visible to conserve resources
 *
 * @param routerIp - Target router IP address
 * @returns UseQueryResult containing PPTP interfaces array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data: pptpInterfaces, isLoading, isError } = usePPTPInterfaces(routerIp || '');
 * ```
 */
export function usePPTPInterfaces(routerIp: string): UseQueryResult<PPTPInterface[], Error> {
  return useQuery({
    queryKey: vpnKeys.pptp(routerIp),
    queryFn: () => fetchPPTPInterfaces(routerIp),
    staleTime: 10000,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false, // Pause when tab hidden
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
