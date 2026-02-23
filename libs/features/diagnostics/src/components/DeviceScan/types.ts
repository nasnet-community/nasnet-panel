// =============================================================================
// Device Scan Types
// =============================================================================
// Shared type definitions for the Device Scan feature

/**
 * Current status of a device scan operation
 * @enum {string}
 */
export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'cancelled' | 'error';

/**
 * Configuration options for a device scan
 *
 * Defines the scope and behavior of network scanning operations including
 * target subnet, network interface, and performance parameters.
 */
export interface ScanConfig {
  /**
   * Network interface to scan on (optional, auto-detect if not set)
   * Examples: "bridge1", "ether1", "wlan0"
   */
  interface?: string;

  /**
   * Target subnet in CIDR notation
   * Examples: "192.168.88.0/24", "10.0.0.0/16"
   */
  subnet: string;

  /**
   * Timeout per host in milliseconds
   * @default 500
   */
  timeout?: number;

  /**
   * Number of parallel ping operations
   * @default 10
   */
  concurrency?: number;
}

/**
 * A device discovered on the network
 *
 * Represents a networked device with its network identifiers, location,
 * and response characteristics. Technical identifiers (IP, MAC) use
 * monospace font rendering for accuracy.
 */
export interface DiscoveredDevice {
  /** IPv4 address (technical data, monospace rendering) */
  ip: string;

  /** MAC address in standard format (technical data, monospace rendering) */
  mac: string;

  /** Vendor name from OUI lookup (performed on frontend) */
  vendor: string | null;

  /** Hostname from ARP/neighbor table or reverse DNS lookup */
  hostname: string | null;

  /** Network interface where device was discovered */
  interface: string;

  /** Response time in milliseconds for the ping/probe */
  responseTime: number;

  /** ISO 8601 timestamp of first discovery during scan */
  firstSeen: string;

  /** Associated DHCP lease information if device obtained IP via DHCP */
  dhcpLease?: {
    /** ISO 8601 timestamp when lease expires */
    expires: string;
    /** IP address of DHCP server that issued lease */
    server: string;
    /** Current lease status (active, expired, etc.) */
    status: string;
  };
}

/**
 * Scan progress statistics
 *
 * Real-time metrics about an ongoing or completed device scan operation.
 * Updated via GraphQL subscription as scan progresses.
 */
export interface ScanStats {
  /** Number of IP addresses scanned so far */
  scannedCount: number;

  /** Total number of IP addresses to scan in configured subnet */
  totalCount: number;

  /** Elapsed time in milliseconds since scan started */
  elapsedTime: number;
}
