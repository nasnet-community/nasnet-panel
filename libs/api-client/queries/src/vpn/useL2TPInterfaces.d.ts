/**
 * TanStack Query Hook for L2TP Client Interfaces
 * Fetches list of L2TP VPN client interfaces from the router
 * Story 0-4-4: Other VPN Type Viewer
 * Uses rosproxy backend for RouterOS API communication
 */
import { type UseQueryResult } from '@tanstack/react-query';
import type { L2TPInterface } from '@nasnet/core/types';
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
export declare function useL2TPInterfaces(routerIp: string): UseQueryResult<L2TPInterface[], Error>;
//# sourceMappingURL=useL2TPInterfaces.d.ts.map