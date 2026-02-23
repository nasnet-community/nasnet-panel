/**
 * Router Discovery Types
 * Types for router discovery, connection, and management (Epic 0.1)
 */
/**
 * Router connection status
 * - online: Reachable and authenticated
 * - offline: Previously connected, now unreachable
 * - unknown: Never connected or untested
 * - connecting: Authentication in progress
 */
export type RouterConnectionStatus = 'online' | 'offline' | 'unknown' | 'connecting';
/**
 * How the router was discovered
 * - scan: Auto-discovered via network scan
 * - manual: Manually added by user
 */
export type RouterDiscoveryMethod = 'scan' | 'manual';
/**
 * Router instance representing a discovered or manually-added router
 */
export interface Router {
    /** Unique identifier (UUID) */
    id: string;
    /** Router IP address (e.g., "192.168.88.1") */
    ipAddress: string;
    /** User-defined name or auto-detected hostname */
    name?: string;
    /** Router model (e.g., "RB5009", "hEX S") */
    model?: string;
    /** RouterOS version (e.g., "7.16") */
    routerOsVersion?: string;
    /** Current connection status */
    connectionStatus: RouterConnectionStatus;
    /** Timestamp of last successful connection */
    lastConnected?: Date;
    /** How this router was discovered */
    discoveryMethod: RouterDiscoveryMethod;
    /** When this router was first added */
    createdAt: Date;
    /** MAC address if available */
    macAddress?: string;
}
/**
 * Router credentials for authentication
 */
export interface RouterCredentials {
    /** Username (default: "admin") */
    username: string;
    /** Password (can be empty for default) */
    password: string;
}
/**
 * Result from scanning a single IP address
 */
export interface ScanResult {
    /** IP address that was scanned */
    ipAddress: string;
    /** Whether the IP responded */
    isReachable: boolean;
    /** Response time in milliseconds */
    responseTime?: number;
    /** HTTP/HTTPS port if detected (80 or 443) */
    httpPort?: number;
    /** Router model if detected */
    model?: string;
    /** RouterOS version if detected */
    routerOsVersion?: string;
    /** MAC address if detected */
    macAddress?: string;
}
/**
 * Progress information during network scanning
 */
export interface ScanProgress {
    /** Total number of hosts to scan */
    totalHosts: number;
    /** Number of hosts scanned so far */
    scannedHosts: number;
    /** Number of routers found */
    foundRouters: number;
    /** Currently scanning this IP */
    currentIp: string;
    /** Whether a scan is currently running */
    isScanning: boolean;
}
//# sourceMappingURL=discovery.d.ts.map