/**
 * Interface Grid Utilities
 *
 * This module provides utility functions for formatting traffic rates,
 * link speeds, and sorting interfaces by priority.
 */
import type { InterfaceType } from './types';
/**
 * Format traffic rate from bits per second to human-readable string.
 * @param bitsPerSecond - Traffic rate in bits per second (must be >= 0)
 * @returns Formatted string (e.g., "15.2 Mbps", "0", "1.1 Gbps")
 *
 * @example
 * formatTrafficRate(0) // "0"
 * formatTrafficRate(1500) // "1.5 Kbps"
 * formatTrafficRate(15234567) // "15.2 Mbps"
 * formatTrafficRate(1073741824) // "1.1 Gbps"
 */
export declare function formatTrafficRate(bitsPerSecond: number): string;
/**
 * Format link speed for compact display.
 * @param speed - Raw link speed (e.g., "1Gbps", "100Mbps", undefined)
 * @returns Compact format (e.g., "1G", "100M") or empty string if undefined
 *
 * @example
 * formatLinkSpeed("1Gbps") // "1G"
 * formatLinkSpeed("100Mbps") // "100M"
 * formatLinkSpeed(undefined) // ""
 */
export declare function formatLinkSpeed(speed: string | undefined): string;
/**
 * Priority order for interface types (lower index = higher priority).
 *
 * @description
 * Determines sort order in interface lists.
 * Used to display Ethernet interfaces first (most common),
 * followed by bridges, wireless, VPN tunnels, etc.
 *
 * @example
 * Ethernet (1) > Bridge (2) > Wireless (3) > VPN (4) > Tunnel (5) > VLAN (6) > Loopback (7)
 */
export declare const INTERFACE_TYPE_PRIORITY: Record<InterfaceType, number>;
/**
 * Sort interfaces by type priority, then by name alphabetically.
 * @param interfaces - Array of interfaces to sort
 * @returns New sorted array (does not mutate input)
 *
 * @example
 * const interfaces = [
 *   { type: 'vpn', name: 'wg1' },
 *   { type: 'ethernet', name: 'ether2' },
 *   { type: 'ethernet', name: 'ether1' },
 * ];
 * sortInterfacesByPriority(interfaces);
 * // [
 * //   { type: 'ethernet', name: 'ether1' },
 * //   { type: 'ethernet', name: 'ether2' },
 * //   { type: 'vpn', name: 'wg1' },
 * // ]
 */
export declare function sortInterfacesByPriority<T extends {
    type: InterfaceType;
    name: string;
}>(interfaces: T[]): T[];
//# sourceMappingURL=utils.d.ts.map