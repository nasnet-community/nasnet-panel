/**
 * TanStack Query hook for fetching wireless interfaces
 * Provides caching, auto-refresh, and optimistic updates for wireless data
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { WirelessInterface } from '@nasnet/core/types';
/**
 * Query key factory for wireless-related queries
 * Follows hierarchical pattern: ['domain', 'resource', ...params]
 */
export declare const wirelessKeys: {
    readonly all: readonly ["wireless"];
    readonly interfaces: (routerIp: string) => readonly ["wireless", "interfaces", string];
    readonly interface: (routerIp: string, id: string) => readonly ["wireless", "interfaces", string, string];
};
/**
 * React Query hook for wireless interfaces
 *
 * @param routerIp - Target router IP address
 * @returns Query result with wireless interfaces data, loading state, and error
 *
 * @example
 * ```tsx
 * function WirelessList() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: interfaces, isLoading, error } = useWirelessInterfaces(routerIp || '');
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return interfaces.map(iface => <WirelessCard key={iface.id} interface={iface} />);
 * }
 * ```
 */
export declare function useWirelessInterfaces(routerIp: string): UseQueryResult<WirelessInterface[], Error>;
//# sourceMappingURL=useWirelessInterfaces.d.ts.map