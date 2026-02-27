/**
 * TanStack Query hook for fetching IP services
 * Used to determine which protocols (API, SSH, Telnet) are enabled
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { ipKeys } from './queryKeys';

/**
 * IP Service entry from RouterOS
 */
export interface IPService {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Service name (api, api-ssl, ssh, telnet, ftp, www, www-ssl, winbox)
   */
  name: string;

  /**
   * Port number the service runs on
   */
  port: number;

  /**
   * Whether the service is disabled
   */
  disabled: boolean;

  /**
   * Allowed addresses (can be empty for all)
   */
  address?: string;

  /**
   * Certificate name (for SSL services)
   */
  certificate?: string;

  /**
   * VRF name
   */
  vrf?: string;
}

/**
 * RouterOS API response format for IP service
 */
interface RouterOSServiceEntry {
  '.id': string;
  name: string;
  port: string;
  disabled: string;
  address?: string;
  certificate?: string;
  vrf?: string;
}

/**
 * Supported protocols for batch job execution
 */
export type ExecutionProtocol = 'api' | 'ssh' | 'telnet';

/**
 * Map of protocol names to service names in RouterOS
 */
const PROTOCOL_SERVICE_MAP: Record<ExecutionProtocol, string> = {
  api: 'api',
  ssh: 'ssh',
  telnet: 'telnet',
};

/**
 * Fetches IP services from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/service
 */
async function fetchIPServices(routerIp: string): Promise<IPService[]> {
  const result = await makeRouterOSRequest<RouterOSServiceEntry[]>(routerIp, 'ip/service');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch IP services');
  }

  // Transform RouterOS response to our format
  return result.data.map((entry) => ({
    id: entry['.id'],
    name: entry.name,
    port: parseInt(entry.port, 10),
    disabled: entry.disabled === 'true',
    address: entry.address,
    certificate: entry.certificate,
    vrf: entry.vrf,
  }));
}

/**
 * React Query hook for IP services
 *
 * @param routerIp - Target router IP address
 * @returns Query result with IP services list
 *
 * @example
 * ```tsx
 * function ProtocolSelector() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: services, isLoading } = useIPServices(routerIp || '');
 *
 *   // Check which protocols are enabled
 *   const apiEnabled = services?.some(s => s.name === 'api' && !s.disabled);
 *   const sshEnabled = services?.some(s => s.name === 'ssh' && !s.disabled);
 *   const telnetEnabled = services?.some(s => s.name === 'telnet' && !s.disabled);
 * }
 * ```
 */
export function useIPServices(routerIp: string): UseQueryResult<IPService[], Error> {
  return useQuery({
    queryKey: ipKeys.services(routerIp),
    queryFn: () => fetchIPServices(routerIp),
    staleTime: 60_000, // 1 minute - services don't change often
    retry: 2,
    enabled: !!routerIp,
  });
}

/**
 * Helper hook to check if specific protocols are enabled
 *
 * @param routerIp - Target router IP address
 * @returns Object with enabled status for each protocol
 *
 * @example
 * ```tsx
 * const { api, ssh, telnet, isLoading } = useEnabledProtocols(routerIp);
 * ```
 */
export function useEnabledProtocols(routerIp: string): {
  api: boolean;
  ssh: boolean;
  telnet: boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: services, isLoading, error } = useIPServices(routerIp);

  const isProtocolEnabled = (protocol: ExecutionProtocol): boolean => {
    if (!services) return false;
    const serviceName = PROTOCOL_SERVICE_MAP[protocol];
    const service = services.find((s) => s.name === serviceName);
    return service ? !service.disabled : false;
  };

  return {
    api: isProtocolEnabled('api'),
    ssh: isProtocolEnabled('ssh'),
    telnet: isProtocolEnabled('telnet'),
    isLoading,
    error: error ?? null,
  };
}
