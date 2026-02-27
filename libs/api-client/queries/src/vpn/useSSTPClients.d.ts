/**
 * SSTP Clients Query Hook
 * Fetches SSTP client interfaces from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { SSTPClient } from '@nasnet/core/types';
/**
 * Hook to fetch SSTP clients
 */
export declare function useSSTPClients(routerIp: string): UseQueryResult<SSTPClient[], Error>;
//# sourceMappingURL=useSSTPClients.d.ts.map
