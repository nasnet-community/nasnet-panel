/**
 * L2TP Clients Query Hook
 * Fetches L2TP client interfaces from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { L2TPClient } from '@nasnet/core/types';
/**
 * Hook to fetch L2TP clients
 */
export declare function useL2TPClients(routerIp: string): UseQueryResult<L2TPClient[], Error>;
//# sourceMappingURL=useL2TPClients.d.ts.map
