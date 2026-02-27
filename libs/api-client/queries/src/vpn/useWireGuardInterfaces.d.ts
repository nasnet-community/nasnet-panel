/**
 * WireGuard Interfaces Query Hook
 * Fetches WireGuard interface list from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { WireGuardInterface } from '@nasnet/core/types';
/**
 * Hook to fetch WireGuard interfaces
 *
 * Configuration:
 * - staleTime: 10000ms (10 seconds) - VPN config changes infrequently
 * - refetchInterval: 5000ms (5 seconds) - Real-time connection status updates
 * - refetchOnWindowFocus: true - Immediate update when tab becomes visible
 * - refetchIntervalInBackground: false - Pause refetch when tab is hidden
 * - Error handling: Provides error state for graceful degradation
 *
 * @param routerIp - Target router IP address
 * @returns Query result with WireGuardInterface array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data, isLoading, error } = useWireGuardInterfaces(routerIp || '');
 * ```
 */
export declare function useWireGuardInterfaces(
  routerIp: string
): UseQueryResult<WireGuardInterface[], Error>;
//# sourceMappingURL=useWireGuardInterfaces.d.ts.map
