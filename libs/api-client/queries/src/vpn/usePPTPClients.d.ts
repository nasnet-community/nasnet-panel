/**
 * PPTP Clients Query Hook
 * Fetches PPTP client interfaces from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { PPTPClient } from '@nasnet/core/types';
/**
 * Hook to fetch PPTP clients
 */
export declare function usePPTPClients(routerIp: string): UseQueryResult<PPTPClient[], Error>;
//# sourceMappingURL=usePPTPClients.d.ts.map