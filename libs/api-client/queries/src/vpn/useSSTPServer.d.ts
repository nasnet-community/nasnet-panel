/**
 * SSTP Server Query Hook
 * Fetches SSTP server configuration from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { SSTPServer } from '@nasnet/core/types';
/**
 * Hook to fetch SSTP server configuration
 */
export declare function useSSTPServer(routerIp: string): UseQueryResult<SSTPServer, Error>;
//# sourceMappingURL=useSSTPServer.d.ts.map