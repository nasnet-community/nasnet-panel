/**
 * Routerboard Query Hook
 * TanStack Query hook for fetching routerboard hardware information
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { RouterboardInfo } from '@nasnet/core/types';
import { routerKeys } from './useRouterInfo';

/**
 * RouterOS routerboard response format
 */
interface RouterOSRouterboardResponse {
  'serial-number'?: string;
  'current-firmware'?: string;
  'factory-firmware'?: string;
  model?: string;
  revision?: string;
}

/**
 * Fetch routerboard hardware information from RouterOS via rosproxy
 * Endpoint: GET /rest/system/routerboard
 * @param routerIp - Target router IP address
 * @returns Routerboard information
 * @throws Error if request fails
 */
async function fetchRouterboard(routerIp: string): Promise<RouterboardInfo | null> {
  const result = await makeRouterOSRequest<RouterOSRouterboardResponse>(
    routerIp,
    'system/routerboard'
  );

  // Some devices (x86, CHR) don't have routerboard info
  // Return null for 404 errors
  if (!result.success) {
    if (result.error?.includes('404') || result.error?.includes('not found')) {
      return null;
    }
    throw new Error(result.error || 'Failed to fetch routerboard info');
  }

  if (!result.data) {
    return null;
  }

  return {
    serialNumber: result.data['serial-number'] || 'N/A',
    currentFirmware: result.data['current-firmware'] || 'N/A',
    factoryFirmware: result.data['factory-firmware'] || 'N/A',
    model: result.data.model || 'N/A',
    revision: result.data.revision || 'N/A',
  };
}

/**
 * Query hook for routerboard hardware information
 * @param routerIp - Target router IP address
 * @returns TanStack Query result with routerboard data
 *
 * @example
 * ```tsx
 * function HardwareCard() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data, isLoading, error } = useRouterboard(routerIp || '');
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error || !data) return <FallbackMessage />;
 *
 *   return <div>{data.serialNumber}</div>;
 * }
 * ```
 */
export function useRouterboard(routerIp: string): UseQueryResult<RouterboardInfo | null, Error> {
  return useQuery({
    queryKey: routerKeys.routerboard(routerIp),
    queryFn: () => fetchRouterboard(routerIp),
    staleTime: 300000, // 5 minutes - hardware info rarely changes
    retry: false, // Don't retry on 404 (unsupported devices)
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
