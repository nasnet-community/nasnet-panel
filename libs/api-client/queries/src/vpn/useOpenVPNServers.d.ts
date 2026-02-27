/**
 * OpenVPN Server Query Hook
 * Fetches OpenVPN server interfaces from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { OpenVPNServer } from '@nasnet/core/types';
/**
 * Hook to fetch OpenVPN servers
 */
export declare function useOpenVPNServers(routerIp: string): UseQueryResult<OpenVPNServer[], Error>;
//# sourceMappingURL=useOpenVPNServers.d.ts.map
