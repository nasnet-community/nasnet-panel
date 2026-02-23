/**
 * IPsec Peers Query Hook
 * Fetches IPsec peers (IKEv2) from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { IPsecPeer } from '@nasnet/core/types';
/**
 * Hook to fetch IPsec peers
 */
export declare function useIPsecPeers(routerIp: string): UseQueryResult<IPsecPeer[], Error>;
//# sourceMappingURL=useIPsecPeers.d.ts.map