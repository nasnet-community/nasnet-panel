/**
 * L2TP Server Query Hook
 * Fetches L2TP server configuration from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { L2TPServer } from '@nasnet/core/types';
/**
 * Hook to fetch L2TP server configuration
 */
export declare function useL2TPServer(routerIp: string): UseQueryResult<L2TPServer, Error>;
//# sourceMappingURL=useL2TPServer.d.ts.map
