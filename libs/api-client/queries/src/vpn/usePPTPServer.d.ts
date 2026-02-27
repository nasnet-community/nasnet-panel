/**
 * PPTP Server Query Hook
 * Fetches PPTP server configuration from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { PPTPServer } from '@nasnet/core/types';
/**
 * Hook to fetch PPTP server configuration
 */
export declare function usePPTPServer(routerIp: string): UseQueryResult<PPTPServer, Error>;
//# sourceMappingURL=usePPTPServer.d.ts.map
