/**
 * OpenVPN Client Query Hook
 * Fetches OpenVPN client interfaces from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { OpenVPNClient } from '@nasnet/core/types';
/**
 * Hook to fetch OpenVPN clients
 */
export declare function useOpenVPNClients(routerIp: string): UseQueryResult<OpenVPNClient[], Error>;
//# sourceMappingURL=useOpenVPNClients.d.ts.map