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
 * CPU Resource Display
 * CPU load and status information
 */
export interface CPUResourceDisplay {
    /** CPU usage percentage (0-100) */
    percentage: number;
    /** Visual status indicator */
    status: ResourceStatus;
}
/**
 * Memory Resource Display
 * Memory usage and availability information
 */
export interface MemoryResourceDisplay {
    /** Used memory in bytes */
    usedBytes: number;
    /** Total memory in bytes */
    totalBytes: number;
    /** Memory usage percentage (0-100) */
    percentage: number;
    /** Visual status indicator */
    status: ResourceStatus;
}
/**
 * Disk Resource Display
 * Disk space usage and availability information
 */
export interface DiskResourceDisplay {
    /** Used disk space in bytes */
    usedBytes: number;
    /** Total disk space in bytes */
    totalBytes: number;
    /** Disk usage percentage (0-100) */
    percentage: number;
    /** Visual status indicator */
    status: ResourceStatus;
}
/**
 * Resource Display State
 * Computed display values with status thresholds
 */
export interface ResourceDisplay {
    /** CPU resource metrics */
    cpu: CPUResourceDisplay;
    /** Memory resource metrics */
    memory: MemoryResourceDisplay;
    /** Disk resource metrics */
    disk: DiskResourceDisplay;
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
    /** Current system resource metrics */
    systemResource: SystemResource | null;
    /** Current system information */
    systemInfo: SystemInfo | null;
    /** Whether data is currently being fetched */
    isLoading: boolean;
    /** Timestamp of last successful data update */
    lastUpdated: Date | null;
    /** Error message if loading failed */
    errorMessage: string | null;
}
//# sourceMappingURL=status.d.ts.map