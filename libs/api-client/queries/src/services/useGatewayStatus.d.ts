import { type QueryHookOptions } from '@apollo/client';
/**
 * Gateway state enumeration matching backend GatewayState enum
 */
export declare enum GatewayState {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  NOT_NEEDED = 'NOT_NEEDED',
}
/**
 * Gateway information including process state, TUN interface, and health status
 */
export interface GatewayInfo {
  /** Current gateway state */
  state: GatewayState;
  /** TUN interface name (e.g., tun-tor-usa) */
  tunName?: string | null;
  /** Process ID of gateway */
  pid?: number | null;
  /** Uptime duration in seconds */
  uptime?: number | null;
  /** Last health check timestamp */
  lastHealthCheck?: Date | null;
  /** Error message if in ERROR state */
  errorMessage?: string | null;
}
/**
 * Variables for gateway status query
 */
interface GatewayStatusVariables {
  instanceID: string;
}
/**
 * Response type for gateway status query
 */
interface GatewayStatusResponse {
  gatewayStatus: GatewayInfo;
}
/**
 * Options for useGatewayStatus hook
 */
export interface UseGatewayStatusOptions
  extends Omit<QueryHookOptions<GatewayStatusResponse, GatewayStatusVariables>, 'variables'> {
  /** Enable polling for real-time updates (default: true, 5s interval) */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 5000) */
  pollInterval?: number;
}
/**
 * Hook to fetch and monitor gateway status for a service instance
 *
 * @param instanceID - The service instance ID
 * @param options - Apollo query options and polling configuration
 * @returns Apollo query result with gateway information
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useGatewayStatus('tor-usa', {
 *   enablePolling: true,
 *   pollInterval: 5000,
 * });
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (data?.gatewayStatus.state === GatewayState.NOT_NEEDED) return null;
 *
 * return <GatewayStatusCard gateway={data.gatewayStatus} />;
 * ```
 */
export declare function useGatewayStatus(
  instanceID: string,
  options?: UseGatewayStatusOptions
): import('@apollo/client').InteropQueryResult<GatewayStatusResponse, GatewayStatusVariables>;
/**
 * Format uptime seconds into human-readable duration
 *
 * @param seconds - Uptime in seconds
 * @returns Formatted duration string (e.g., "1h 2m 3s")
 *
 * @example
 * formatUptime(3723) // "1h 2m 3s"
 * formatUptime(125) // "2m 5s"
 * formatUptime(45) // "45s"
 * formatUptime(0) // "0s"
 */
export declare function formatUptime(seconds: number | null | undefined): string;
export {};
//# sourceMappingURL=useGatewayStatus.d.ts.map
