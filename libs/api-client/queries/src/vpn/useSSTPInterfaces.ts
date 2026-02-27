/**
 * TanStack Query Hook for SSTP Client Interfaces
 * Fetches list of SSTP VPN client interfaces from the router
 * Story 0-4-4: Other VPN Type Viewer
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { SSSTPInterface } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * RouterOS SSTP client interface response format
 */
interface RouterOSSSTPClientResponse {
  '.id': string;
  name: string;
  disabled?: boolean | string;
  running?: boolean | string;
  'connect-to'?: string;
  user?: string;
  'verify-server-certificate'?: boolean | string;
  comment?: string;
}

/**
 * Fetches SSTP client interfaces from RouterOS via rosproxy
 * Endpoint: GET /rest/interface/sstp-client
 */
async function fetchSSTPInterfaces(routerIp: string): Promise<SSSTPInterface[]> {
  const result = await makeRouterOSRequest<RouterOSSSTPClientResponse[]>(
    routerIp,
    'interface/sstp-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch SSTP interfaces');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  return data.map((iface) => ({
    id: iface['.id'],
    name: iface.name,
    type: 'sstp' as const,
    isDisabled: iface.disabled === 'true' || iface.disabled === true,
    isRunning: iface.running === 'true' || iface.running === true,
    connectTo: iface['connect-to'] || '',
    user: iface.user,
    shouldVerifyServerCertificate:
      iface['verify-server-certificate'] === 'true' || iface['verify-server-certificate'] === true,
    comment: iface.comment,
  }));
}

/**
 * Query hook to fetch SSTP client interfaces
 * Auto-refreshes every 5 seconds for real-time status
 * Pauses when tab is not visible to conserve resources
 *
 * @param routerIp - Target router IP address
 * @returns UseQueryResult containing SSTP interfaces array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data: sstpInterfaces, isLoading, isError } = useSSTPInterfaces(routerIp || '');
 * ```
 */
export function useSSTPInterfaces(routerIp: string): UseQueryResult<SSSTPInterface[], Error> {
  return useQuery({
    queryKey: vpnKeys.sstp(routerIp),
    queryFn: () => fetchSSTPInterfaces(routerIp),
    staleTime: 10000,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false, // Pause when tab hidden
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
