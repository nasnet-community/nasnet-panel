/**
 * PPP Active Connections Query Hook
 * Fetches active PPP connections (L2TP, PPTP, SSTP, OpenVPN server clients) from RouterOS
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { PPPActiveConnection } from '@nasnet/core/types';
/**
 * Hook to fetch PPP active connections
 */
export declare function usePPPActive(
  routerIp: string
): UseQueryResult<PPPActiveConnection[], Error>;
//# sourceMappingURL=usePPPActive.d.ts.map
