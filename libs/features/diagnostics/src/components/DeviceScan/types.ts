// =============================================================================
// Device Scan Types
// =============================================================================
// Shared type definitions for the Device Scan feature

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'cancelled' | 'error';

export interface ScanConfig {
  /**
   * Interface to scan (optional, auto-detect if not set)
   * @example "bridge1"
   */
  interface?: string;

  /**
   * Subnet to scan in CIDR notation
   * @example "192.168.88.0/24"
   */
  subnet: string;

  /**
   * Timeout per host in milliseconds
   * @default 500
   */
  timeout?: number;

  /**
   * Number of parallel pings
   * @default 10
   */
  concurrency?: number;
}

export interface DiscoveredDevice {
  /** IP address */
  ip: string;

  /** MAC address */
  mac: string;

  /** Vendor name from OUI lookup (frontend-side) */
  vendor: string | null;

  /** Hostname from neighbor or reverse DNS */
  hostname: string | null;

  /** Interface where device was discovered */
  interface: string;

  /** Response time in milliseconds */
  responseTime: number;

  /** ISO timestamp of first discovery */
  firstSeen: string;

  /** Correlated DHCP lease information */
  dhcpLease?: {
    expires: string;
    server: string;
    status: string;
  };
}

export interface ScanStats {
  /** Number of IPs scanned so far */
  scannedCount: number;

  /** Total number of IPs to scan */
  totalCount: number;

  /** Elapsed time in milliseconds */
  elapsedTime: number;
}
