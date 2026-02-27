/**
 * IPsec Policies Query Hook
 * Fetches IPsec policies (IKEv2) from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { IPsecPolicy } from '@nasnet/core/types';
/**
 * Hook to fetch IPsec policies
 */
export declare function useIPsecPolicies(routerIp: string): UseQueryResult<IPsecPolicy[], Error>;
//# sourceMappingURL=useIPsecPolicies.d.ts.map
