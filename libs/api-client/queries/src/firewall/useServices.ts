/**
 * Router Services Query Hook
 * Fetches router services (API, SSH, Winbox, etc.) from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { RouterService } from '@nasnet/core/types';

/**
 * Query keys for services queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const servicesKeys = {
  all: ['services'] as const,
  list: (routerIp: string) => [...servicesKeys.all, 'list', routerIp] as const,
};

/**
 * Raw API response structure from MikroTik RouterOS
 * Endpoint: GET /rest/ip/service
 */
interface RawService {
  '.id': string;
  name: string;
  port: string; // Returns as string
  disabled: string; // "true" or "false" as string
  address?: string;
  certificate?: string;
  invalid?: string;
}

/**
 * Transform raw API response to RouterService type
 * Maps hyphenated keys to camelCase and converts string types
 */
function transformService(raw: RawService): RouterService {
  return {
    id: raw['.id'],
    name: raw.name,
    port: parseInt(raw.port, 10),
    disabled: raw.disabled === 'true',
    address: raw.address,
    certificate: raw.certificate,
  };
}

/**
 * Fetch router services from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/service
 *
 * @param routerIp - Target router IP address
 * @returns Array of router services
 */
async function fetchServices(routerIp: string): Promise<RouterService[]> {
  const result = await makeRouterOSRequest<RawService[]>(routerIp, 'ip/service');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch router services');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  return data.map(transformService);
}

/**
 * Hook to fetch router services
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - services rarely change
 * - Auto-refresh disabled - user must manually refresh
 * - Read-only data - no mutations in Phase 0
 *
 * @param routerIp - Target router IP address
 * @param options - Query options
 * @returns Query result with RouterService[] data
 */
interface UseServicesOptions {
  enabled?: boolean;
}

export function useServices(
  routerIp: string,
  options?: UseServicesOptions
): UseQueryResult<RouterService[], Error> {
  return useQuery({
    queryKey: servicesKeys.list(routerIp),
    queryFn: () => fetchServices(routerIp),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerIp && (options?.enabled ?? true),
  });
}






