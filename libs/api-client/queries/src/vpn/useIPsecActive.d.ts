/**
 * IPsec Active Connections Query Hook
 * Fetches active IPsec connections from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { IPsecActiveConnection } from '@nasnet/core/types';
/**
 * Hook to fetch IPsec active connections
 */
export declare function useIPsecActive(
  routerIp: string
): UseQueryResult<IPsecActiveConnection[], Error>;
//# sourceMappingURL=useIPsecActive.d.ts.map
