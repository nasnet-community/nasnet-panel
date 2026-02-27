/**
 * API request/response types
 *
 * Provides type-safe API communication with the backend.
 * All requests and responses are strictly typed to ensure correctness.
 *
 * @packageDocumentation
 */
/**
 * Successful API response
 *
 * @template T - Type of response data payload
 * @example
 * ```typescript
 * const response: ApiResponse<User> = {
 *   success: true,
 *   data: { id: '1', name: 'John' },
 *   meta: { page: 1, total: 100 }
 * };
 * ```
 */
export interface ApiResponse<T> {
  /** Always true for successful responses */
  success: true;
  /** Response payload data */
  data: T;
  /** Optional pagination and metadata */
  meta?: {
    /** Current page number (1-indexed) */
    page?: number;
    /** Total number of items */
    total?: number;
    /** Items per page */
    pageSize?: number;
  };
}
/**
 * Failed API response
 *
 * Returned when an API request fails with error details.
 *
 * @example
 * ```typescript
 * const error: ApiError = {
 *   success: false,
 *   error: {
 *     code: 'NOT_FOUND',
 *     message: 'Router not found',
 *     details: { routerId: '123' }
 *   }
 * };
 * ```
 */
export interface ApiError {
  /** Always false for error responses */
  success: false;
  /** Error details */
  error: {
    /** Machine-readable error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error context */
    details?: Record<string, unknown>;
  };
}
/**
 * Union type for all possible API results
 *
 * @template T - Type of successful response data
 */
export type ApiResult<T> = ApiResponse<T> | ApiError;
/**
 * Router status and system metrics
 *
 * Contains real-time system health metrics from the router.
 *
 * @example
 * ```typescript
 * const status: RouterStatusResponse = {
 *   online: true,
 *   uptime: 86400,
 *   cpuUsage: 45,
 *   memoryUsage: 62,
 *   diskUsage: 78,
 *   timestamp: new Date()
 * };
 * ```
 */
export interface RouterStatusResponse {
  /** Whether router is online and reachable */
  isOnline: boolean;
  /** System uptime in seconds */
  uptime: number;
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory usage percentage (0-100) */
  memoryUsage: number;
  /** Disk usage percentage (0-100) */
  diskUsage: number;
  /** Timestamp of status measurement */
  timestamp: Date;
}
/**
 * Router device information and model details
 *
 * Static device information retrieved once during connection.
 *
 * @example
 * ```typescript
 * const info: RouterInfoResponse = {
 *   model: 'CCR2216-1G-12XS',
 *   routerOSVersion: '7.10.1',
 *   architecture: 'arm64',
 *   serialNumber: 'ABC123'
 * };
 * ```
 */
export interface RouterInfoResponse {
  /** Device model identifier */
  model: string;
  /** RouterOS version string */
  routerOSVersion: string;
  /** CPU architecture (arm64, x86, etc.) */
  architecture: string;
  /** Optional device serial number */
  serialNumber?: string;
  /** Optional firmware version */
  firmwareVersion?: string;
  /** Optional hardware revision */
  hardwareRevision?: string;
}
/**
 * Configuration apply request payload
 *
 * Sent to apply configuration changes to router.
 */
export interface ConfigApplyRequest {
  /** Configuration object to apply */
  config: Record<string, unknown>;
  /** If true, validate without applying changes */
  dryRun?: boolean;
}
/**
 * Configuration apply response
 *
 * Returned after successfully applying configuration.
 */
export interface ConfigApplyResponse {
  /** Whether apply operation succeeded */
  success: boolean;
  /** Timestamp when configuration was applied */
  appliedAt: Date;
  /** ID of configuration snapshot for rollback */
  snapshotId?: string;
  /** List of applied configuration changes */
  readonly changes: readonly string[];
}
/**
 * Configuration rollback request
 *
 * Requests rollback to a previous configuration snapshot.
 */
export interface ConfigRollbackRequest {
  /** ID of snapshot to rollback to */
  snapshotId: string;
}
/**
 * Configuration rollback response
 *
 * Returned after successfully rolling back configuration.
 */
export interface ConfigRollbackResponse {
  /** Whether rollback operation succeeded */
  success: boolean;
  /** Timestamp when rollback occurred */
  rolledBackAt: Date;
  /** Previous configuration that was restored */
  previousConfig?: Record<string, unknown>;
}
/**
 * Single configuration change history entry
 *
 * Tracks all configuration modifications over time.
 */
export interface ConfigHistoryEntry {
  /** Unique entry identifier */
  id: string;
  /** When this change occurred */
  timestamp: Date;
  /** Type of action performed (apply or rollback) */
  action: 'apply' | 'rollback';
  /** Final status of the action */
  status: 'success' | 'failed' | 'rolled_back';
  /** List of changes made (if successful) */
  readonly changes?: readonly string[];
  /** Error message if action failed */
  errorMessage?: string;
  /** Associated snapshot ID for rollback */
  snapshotId?: string;
}
/**
 * VPN connection request
 *
 * Initiates a VPN connection to a configured server.
 */
export interface VPNConnectRequest {
  /** ID of VPN connection to establish */
  connectionId: string;
}
/**
 * VPN connection response
 *
 * Reports current status of VPN connection attempt.
 */
export interface VPNConnectResponse {
  /** ID of the VPN connection */
  connectionId: string;
  /** Current connection status */
  status: 'connected' | 'connecting' | 'error';
  /** Timestamp when connection was established */
  connectedAt?: Date;
  /** Error message if status is 'error' */
  error?: string;
}
/**
 * VPN connection list response
 *
 * Returns all available VPN connections and their status.
 */
export interface VPNListResponse {
  /** Array of VPN connections */
  readonly connections: ReadonlyArray<{
    /** VPN connection identifier */
    id: string;
    /** User-friendly connection name */
    name: string;
    /** VPN protocol type (wireguard, openvpn, etc.) */
    protocol: string;
    /** Current connection status */
    status: 'connected' | 'disconnected' | 'connecting';
    /** When this connection was last active */
    lastConnectedAt?: Date;
  }>;
}
//# sourceMappingURL=index.d.ts.map
