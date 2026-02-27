/**
 * WireGuard Peers Query Hook
 * Fetches WireGuard peers from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { WireGuardPeer } from '@nasnet/core/types';
/**
 * Hook to fetch WireGuard peers
 *
 * @param routerIp - Target router IP address
 * @param interfaceName - Optional interface name to filter peers
 * @returns Query result with WireGuardPeer array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data, isLoading, error } = useWireGuardPeers(routerIp || '', 'wg0');
 * ```
 */
export declare function useWireGuardPeers(
  routerIp: string,
  interfaceName?: string
): UseQueryResult<WireGuardPeer[], Error>;
//# sourceMappingURL=useWireGuardPeers.d.ts.map
