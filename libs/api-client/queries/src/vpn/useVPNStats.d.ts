/**
 * VPN Stats Aggregation Hook
 * Aggregates statistics from all VPN protocols for the dashboard
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { VPNDashboardStats } from '@nasnet/core/types';
/**
 * Hook to aggregate VPN statistics from all protocols
 */
export declare function useVPNStats(routerIp: string): UseQueryResult<VPNDashboardStats, Error>;
//# sourceMappingURL=useVPNStats.d.ts.map
