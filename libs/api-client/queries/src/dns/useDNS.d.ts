/**
 * DNS Query Hooks
 * Fetches DNS settings and static entries using Apollo Client + GraphQL
 *
 * Per ADR-011: Unified GraphQL Architecture
 * Story: NAS-6.4 - Implement DNS Configuration
 */
/**
 * Hook to fetch DNS settings from router
 *
 * Configuration:
 * - pollInterval: 60000ms (1 minute) - DNS settings are relatively stable
 * - skip: true if deviceId is not provided
 *
 * @param deviceId - Target router device ID
 * @returns Query result with DNSSettings data
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useDNSSettings(routerId);
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 * const settings = data.device.dnsSettings;
 * ```
 */
export declare function useDNSSettings(deviceId: string): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
/**
 * Hook to fetch DNS static entries from router
 *
 * Configuration:
 * - pollInterval: 30000ms (30 seconds) - entries may change more frequently
 * - skip: true if deviceId is not provided
 *
 * @param deviceId - Target router device ID
 * @returns Query result with DNSStaticEntry[] data
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useDNSStaticEntries(routerId);
 * const entries = data?.device.dnsStaticEntries || [];
 * ```
 */
export declare function useDNSStaticEntries(deviceId: string): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
//# sourceMappingURL=useDNS.d.ts.map