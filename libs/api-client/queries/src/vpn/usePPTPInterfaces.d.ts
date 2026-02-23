/**
 * TanStack Query Hook for PPTP Client Interfaces
 * Fetches list of PPTP VPN client interfaces from the router
 * Story 0-4-4: Other VPN Type Viewer
 * Uses rosproxy backend for RouterOS API communication
 */
import { type UseQueryResult } from '@tanstack/react-query';
import type { PPTPInterface } from '@nasnet/core/types';
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
export declare function usePPTPInterfaces(routerIp: string): UseQueryResult<PPTPInterface[], Error>;
//# sourceMappingURL=usePPTPInterfaces.d.ts.map