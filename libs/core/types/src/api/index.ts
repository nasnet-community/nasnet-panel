/**
 * API request/response types
 * Used for type-safe API communication with the backend
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Router Status Response
 */
export interface RouterStatusResponse {
  online: boolean;
  uptime: number; // seconds
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  timestamp: Date;
}

/**
 * Router Info Response
 */
export interface RouterInfoResponse {
  model: string;
  routerOSVersion: string;
  architecture: string;
  serialNumber?: string;
  firmwareVersion?: string;
  hardwareRevision?: string;
}

/**
 * Configuration Apply Request/Response
 */
export interface ConfigApplyRequest {
  config: Record<string, unknown>;
  dryRun?: boolean;
}

export interface ConfigApplyResponse {
  success: boolean;
  appliedAt: Date;
  snapshotId?: string;
  changes: string[];
}

/**
 * Configuration Rollback Request/Response
 */
export interface ConfigRollbackRequest {
  snapshotId: string;
}

export interface ConfigRollbackResponse {
  success: boolean;
  rolledBackAt: Date;
  previousConfig?: Record<string, unknown>;
}

/**
 * Configuration History Entry
 */
export interface ConfigHistoryEntry {
  id: string;
  timestamp: Date;
  action: 'apply' | 'rollback';
  status: 'success' | 'failed' | 'rolled_back';
  changes?: string[];
  errorMessage?: string;
  snapshotId?: string;
}

/**
 * VPN Connection Request/Response
 */
export interface VPNConnectRequest {
  connectionId: string;
}

export interface VPNConnectResponse {
  connectionId: string;
  status: 'connected' | 'connecting' | 'error';
  connectedAt?: Date;
  error?: string;
}

/**
 * VPN List Response
 */
export interface VPNListResponse {
  connections: Array<{
    id: string;
    name: string;
    protocol: string;
    status: 'connected' | 'disconnected' | 'connecting';
    lastConnectedAt?: Date;
  }>;
}
