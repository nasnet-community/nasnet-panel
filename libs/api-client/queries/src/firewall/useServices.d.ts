/**
 * Router Services Query Hook
 * Fetches router services (API, SSH, Winbox, etc.) from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { RouterService } from '@nasnet/core/types';
/**
 * Query keys for services queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const servicesKeys: {
  all: readonly ['services'];
  list: (routerIp: string) => readonly ['services', 'list', string];
};
/**
 * Hook to fetch router services
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - services rarely change
 * - Auto-refresh disabled - user must manually refresh
 * - Read-only data - no mutations in Phase 0
 *
 * @param routerIp - Target router IP address
 * @param options - Query options
 * @returns Query result with RouterService[] data
 */
interface UseServicesOptions {
  enabled?: boolean;
}
export declare function useServices(
  routerIp: string,
  options?: UseServicesOptions
): UseQueryResult<RouterService[], Error>;
export {};
//# sourceMappingURL=useServices.d.ts.map
