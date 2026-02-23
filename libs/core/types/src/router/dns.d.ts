/**
 * DNS Configuration Types for RouterOS
 *
 * This module contains TypeScript interfaces for DNS configuration and management.
 * Supports DNS server configuration, static DNS entries, and cache settings.
 *
 * @module @nasnet/core/types/router/dns
 */
/**
 * Raw DNS settings from RouterOS /ip/dns
 *
 * Represents the complete DNS configuration from the router, including both
 * static (user-configured) and dynamic (ISP-provided via DHCP/PPPoE) servers.
 */
export interface DNSSettings {
    /** Allow devices on any network to use this router as DNS server */
    'allow-remote-requests': boolean;
    /** Maximum time-to-live for cached entries (e.g., "1w" = 1 week) */
    'cache-max-ttl': string;
    /** DNS cache size in kilobytes (range: 512-10240 KB) */
    'cache-size': number;
    /** Current cache usage in kilobytes */
    'cache-used': number;
    /** Maximum concurrent DNS queries allowed */
    'max-concurrent-queries': number;
    /** Maximum concurrent TCP sessions for DNS */
    'max-concurrent-tcp-sessions': number;
    /** Maximum UDP packet size for DNS queries */
    'max-udp-packet-size': number;
    /** Comma-separated list of static DNS servers (user-configured) */
    servers: string;
    /** Comma-separated list of dynamic DNS servers from DHCP/PPPoE (read-only) */
    'dynamic-servers': string;
}
/**
 * Raw DNS static entry from RouterOS /ip/dns/static
 *
 * Represents a local hostname-to-IP mapping configured on the router.
 * Used for local network device name resolution.
 */
export interface DNSStaticEntry {
    /** RouterOS unique identifier (required for update/delete operations) */
    '.id': string;
    /** Hostname in RFC 1123 format (e.g., "nas.local", "printer.lan") */
    name: string;
    /** IPv4 address this hostname resolves to */
    address: string;
    /** Time-to-live in seconds (string representation) */
    ttl: string;
    /** DNS record type (A, AAAA, CNAME, etc.) */
    type?: string;
    /** Regular expression pattern for dynamic hostname matching */
    regexp?: string;
    /** User-provided comment/description */
    comment?: string;
    /** Whether this entry is disabled */
    disabled: boolean;
}
/**
 * Input type for updating DNS settings
 *
 * Used when modifying DNS configuration via API mutations.
 * Only includes user-modifiable fields (excludes dynamic-servers).
 */
export interface DNSSettingsInput {
    /** Array of static DNS server IP addresses */
    servers: string[];
    /** Whether to allow remote DNS requests */
    allowRemoteRequests: boolean;
    /** DNS cache size in kilobytes (512-10240) */
    cacheSize: number;
}
/**
 * Input type for creating/updating static DNS entry
 *
 * Used for Add/Edit operations on static DNS entries.
 * The .id field is omitted for create operations and required for updates.
 */
export interface DNSStaticEntryInput {
    /** Hostname (RFC 1123: letters, digits, hyphens, dots; max 253 chars) */
    name: string;
    /** IPv4 address in dotted decimal notation */
    address: string;
    /** Time-to-live in seconds (0-604800 = 0-7 days) */
    ttl: number;
    /** Optional comment/description (max 255 characters) */
    comment?: string;
}
/**
 * Parsed DNS settings for UI consumption
 *
 * Transforms raw RouterOS DNS settings into UI-friendly format.
 * Separates static and dynamic servers, calculates cache usage percentage.
 */
export interface ParsedDNSSettings {
    /** Dynamic DNS servers obtained from ISP via DHCP/PPPoE (read-only) */
    dynamicServers: string[];
    /** Static DNS servers configured by user (editable) */
    staticServers: string[];
    /** DNS cache size in kilobytes */
    cacheSize: number;
    /** Current DNS cache usage in kilobytes */
    cacheUsed: number;
    /** Cache usage as percentage (0-100) */
    cacheUsedPercent: number;
    /** Whether remote DNS requests are allowed */
    allowRemoteRequests: boolean;
}
//# sourceMappingURL=dns.d.ts.map