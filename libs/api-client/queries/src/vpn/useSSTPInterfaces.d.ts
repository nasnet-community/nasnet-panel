/**
 * TanStack Query Hook for SSTP Client Interfaces
 * Fetches list of SSTP VPN client interfaces from the router
 * Story 0-4-4: Other VPN Type Viewer
 * Uses rosproxy backend for RouterOS API communication
 */
import { type UseQueryResult } from '@tanstack/react-query';
import type { SSSTPInterface } from '@nasnet/core/types';
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
export declare function useSSTPInterfaces(routerIp: string): UseQueryResult<SSSTPInterface[], Error>;
//# sourceMappingURL=useSSTPInterfaces.d.ts.map