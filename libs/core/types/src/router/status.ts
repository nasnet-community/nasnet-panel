/**
 * System Status Types
 * Type definitions for router system status, resource monitoring, and information display
 */

/**
 * System Resource Data
 * Raw data from RouterOS /rest/system/resource endpoint
 */
export interface SystemResource {
  /** Uptime in RouterOS format (e.g., "3d4h25m12s") */
  uptime: string;

  /** CPU load percentage (0-100) */
  cpuLoad: number;

  /** Free memory in bytes */
  freeMemory: number;

  /** Total memory in bytes */
  totalMemory: number;

  /** Free HDD space in bytes */
  freeHddSpace: number;

  /** Total HDD space in bytes */
  totalHddSpace: number;

  /** CPU architecture (e.g., "arm", "arm64", "x86") */
  architecture: string;

  /** Board name (e.g., "RB4011iGS+5HacQ2HnD") */
  boardName: string;

  /** RouterOS version (e.g., "7.14.2") */
  version: string;

  /** Platform (e.g., "MikroTik") */
  platform: string;
}

/**
 * System Information
 * Combined system identity and information for display
 */
export interface SystemInfo {
  /** Router identity/name */
  identity: string;

  /** Hardware model */
  model: string;

  /** RouterOS version */
  routerOsVersion: string;

  /** CPU architecture */
  cpuArchitecture: string;

  /** System uptime in human-readable format (e.g., "3 days, 4 hours") */
  uptime?: string;
}

/**
 * Resource Display State
 * Computed display values with status thresholds
 */
export interface ResourceDisplay {
  cpu: {
    percentage: number;
    status: ResourceStatus;
  };
  memory: {
    usedBytes: number;
    totalBytes: number;
    percentage: number;
    status: ResourceStatus;
  };
  disk: {
    usedBytes: number;
    totalBytes: number;
    percentage: number;
    status: ResourceStatus;
  };
}

/**
 * Resource Status
 * Visual status indicators based on usage thresholds
 */
export type ResourceStatus = 'healthy' | 'warning' | 'critical';

/**
 * Dashboard State
 * Overall dashboard data and loading state
 */
export interface DashboardState {
  systemResource: SystemResource | null;
  systemInfo: SystemInfo | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}
