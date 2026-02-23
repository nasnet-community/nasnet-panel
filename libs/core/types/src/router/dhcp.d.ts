/**
 * DHCP Server, Pool, Lease, and Client Type Definitions
 * For NasNetConnect Phase 0 - Epic 0.5: DHCP Management
 *
 * @module @nasnet/core/types/router/dhcp
 */
/**
 * DHCP Server configuration
 * Represents a DHCP server instance configured on the router
 */
export interface DHCPServer {
    /** Unique identifier for the DHCP server */
    id: string;
    /** Server name (e.g., "dhcp1", "default") */
    name: string;
    /** Interface or bridge name this server is bound to */
    interface: string;
    /** Reference to address pool name */
    addressPool: string;
    /** Lease time in RouterOS format (e.g., "10m", "1h", "1d") */
    leaseTime: string;
    /** Whether the server is disabled */
    disabled: boolean;
    /** Whether server operates in authoritative mode */
    authoritative: boolean;
    /** Whether to use RADIUS for client authentication */
    useRadius: boolean;
}
/**
 * DHCP Address Pool configuration
 * Defines IP address ranges for DHCP allocation
 */
export interface DHCPPool {
    /** Unique identifier for the pool */
    id: string;
    /** Pool name referenced by DHCP servers */
    name: string;
    /** Array of IP ranges (e.g., ["192.168.88.100-192.168.88.200"]) */
    ranges: string[];
    /** Optional next pool to chain when this pool is exhausted */
    nextPool?: string;
}
/**
 * Lease status types from RouterOS DHCP server
 *
 * @remarks
 * Represents the current state of a DHCP lease allocation:
 * - `bound` - Active lease in use by the client
 * - `waiting` - Waiting for client confirmation
 * - `busy` - IP address is in use by another device
 * - `offered` - DHCP offer has been sent to the client
 */
export type LeaseStatus = 'bound' | 'waiting' | 'busy' | 'offered';
/**
 * DHCP Lease information
 * Represents an IP address allocation to a client device
 */
export interface DHCPLease {
    /** Unique identifier for the lease */
    id: string;
    /** Assigned IP address */
    address: string;
    /** Client MAC address */
    macAddress: string;
    /** DHCP client identifier (optional) */
    clientId?: string;
    /** Client-provided hostname (optional) */
    hostname?: string;
    /** Current lease status */
    status: LeaseStatus;
    /** Time until lease expiration (RouterOS format like "5m30s") */
    expiresAfter?: string;
    /** Last time client was seen */
    lastSeen?: Date;
    /** Name of DHCP server that assigned this lease */
    server: string;
    /** Whether lease is dynamic (true) or static (false) */
    dynamic: boolean;
    /** Whether client is blocked from network */
    blocked: boolean;
}
/**
 * Display row for lease table rendering
 * Transformed version of DHCPLease for UI consumption
 */
export interface LeaseDisplayRow {
    /** Lease identifier */
    id: string;
    /** IP address */
    ipAddress: string;
    /** Formatted MAC address (XX:XX:XX:XX:XX:XX) */
    macAddress: string;
    /** Hostname or "Unknown" if not provided */
    hostname: string;
    /** Lease status */
    status: LeaseStatus;
    /** Human-readable status label */
    statusLabel: string;
    /** Human-readable expiration ("5 minutes" or "Never" for static) */
    expiration: string;
    /** Whether this is a static lease */
    isStatic: boolean;
}
/**
 * DHCP Client status types
 *
 * Represents the current state of a DHCP client on WAN interfaces:
 * - `bound` - Successfully obtained a lease from DHCP server
 * - `searching` - Actively searching for a DHCP server
 * - `requesting` - Requesting a lease from the server
 * - `stopped` - DHCP client is stopped or disabled
 */
export type DHCPClientStatus = 'bound' | 'searching' | 'requesting' | 'stopped';
/**
 * DHCP Client configuration and status
 * Represents DHCP client on WAN interfaces obtaining IP from ISP
 */
export interface DHCPClient {
    /** Unique identifier */
    id: string;
    /** WAN interface name */
    interface: string;
    /** Current DHCP client status */
    status: DHCPClientStatus;
    /** Obtained IP address (when bound) */
    address?: string;
    /** Default gateway address */
    gateway?: string;
    /** Primary DNS server */
    primaryDns?: string;
    /** Secondary DNS server (optional) */
    secondaryDns?: string;
    /** DHCP server that assigned the lease */
    dhcpServer?: string;
    /** Time until lease expiration */
    expiresAfter?: string;
    /** Whether DHCP client is disabled */
    disabled: boolean;
}
/**
 * Extended DHCP Lease with DHCP options for fingerprinting
 * Includes DHCP options used for device identification
 */
export interface DHCPLeaseWithOptions extends DHCPLease {
    /**
     * DHCP options sent by the client
     */
    options?: {
        /**
         * DHCP option 55 - Parameter Request List
         * Array of requested DHCP option codes or comma-separated string
         */
        '55'?: number[] | string;
        /**
         * DHCP option 60 - Vendor Class Identifier
         * Vendor-specific identifier string
         */
        '60'?: string;
        /**
         * DHCP option 61 - Client Identifier
         * Unique client identifier
         */
        '61'?: string;
    };
}
//# sourceMappingURL=dhcp.d.ts.map