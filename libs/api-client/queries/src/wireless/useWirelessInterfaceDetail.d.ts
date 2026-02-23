/**
 * TanStack Query hook for fetching detailed wireless interface configuration
 * Implements FR0-15: View wireless interface configuration details
 * Uses rosproxy backend for RouterOS API communication
 */
import { type UseQueryResult } from '@tanstack/react-query';
import { type WirelessInterfaceDetail } from '@nasnet/core/types';
/**
 * Hook to fetch detailed wireless interface configuration
 *
 * @param routerIp - Target router IP address
 * @param interfaceName - The interface name (e.g., "wlan1")
 * @returns Query result with detailed interface data
 *
 * @example
 * ```tsx
 * function InterfaceDetail({ interfaceName }) {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data, isLoading, error } = useWirelessInterfaceDetail(routerIp || '', interfaceName);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error />;
 *
 *   return <DetailView interface={data} />;
 * }
 * ```
 */
export declare function useWirelessInterfaceDetail(routerIp: string, interfaceName: string): UseQueryResult<WirelessInterfaceDetail, Error>;
//# sourceMappingURL=useWirelessInterfaceDetail.d.ts.map