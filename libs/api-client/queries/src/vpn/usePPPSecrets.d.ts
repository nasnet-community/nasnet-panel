/**
 * PPP Secrets Query Hook
 * Fetches PPP secrets (VPN users) from RouterOS REST API
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { PPPSecret } from '@nasnet/core/types';
/**
 * Hook to fetch PPP secrets
 */
export declare function usePPPSecrets(routerIp: string): UseQueryResult<PPPSecret[], Error>;
//# sourceMappingURL=usePPPSecrets.d.ts.map