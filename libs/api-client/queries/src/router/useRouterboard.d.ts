/**
 * Routerboard Query Hook
 * TanStack Query hook for fetching routerboard hardware information
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { RouterboardInfo } from '@nasnet/core/types';
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
export declare function useRouterboard(
  routerIp: string
): UseQueryResult<RouterboardInfo | null, Error>;
//# sourceMappingURL=useRouterboard.d.ts.map
