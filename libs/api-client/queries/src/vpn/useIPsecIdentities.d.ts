/**
 * IPsec Identities Query Hook
 * Fetches IPsec identities (IKEv2 authentication) from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { IPsecIdentity } from '@nasnet/core/types';
/**
 * Hook to fetch IPsec identities
 */
export declare function useIPsecIdentities(
  routerIp: string
): UseQueryResult<IPsecIdentity[], Error>;
//# sourceMappingURL=useIPsecIdentities.d.ts.map
