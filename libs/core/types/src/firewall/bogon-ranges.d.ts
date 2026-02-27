/**
 * Bogon Ranges - Non-routable IP Address Ranges
 *
 * Bogon addresses are IP addresses that should not appear on the public internet.
 * These ranges are typically blocked at network edges for security.
 *
 * Categories:
 * 1. Private: RFC 1918 private address space
 * 2. Loopback: RFC 5735 loopback addresses
 * 3. Reserved: IETF reserved ranges (TEST-NET, documentation, etc.)
 * 4. Link-Local: RFC 3927 autoconfiguration addresses
 * 5. Multicast: RFC 1112 multicast addresses
 * 6. Future Use: Reserved for future use
 *
 * @see https://en.wikipedia.org/wiki/Bogon_filtering
 * @see RFC 1918 - Private Address Space
 * @see RFC 5735 - Special-Use IPv4 Addresses
 * @see RFC 3927 - Link-Local Addresses
 */
export interface BogonRanges {
  private: string[];
  loopback: string[];
  reserved: string[];
  linkLocal: string[];
  multicast: string[];
  futureUse: string[];
}
export type BogonCategory = keyof BogonRanges;
/**
 * Comprehensive list of Bogon (non-routable) IP ranges
 */
export declare const BOGON_RANGES: {
  /**
   * RFC 1918 - Private Address Space
   * Should never appear as source on public internet
   */
  readonly private: readonly ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
  /**
   * RFC 5735 - Loopback
   * Local machine addresses
   */
  readonly loopback: readonly ['127.0.0.0/8'];
  /**
   * RFC 5735 - Reserved/Special-Use
   * Documentation, benchmarking, protocol assignments
   */
  readonly reserved: readonly [
    '0.0.0.0/8',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '100.64.0.0/10',
  ];
  /**
   * RFC 3927 - Link-Local Addresses
   * Autoconfiguration when DHCP fails
   */
  readonly linkLocal: readonly ['169.254.0.0/16'];
  /**
   * RFC 1112 - Multicast
   * One-to-many communication
   */
  readonly multicast: readonly ['224.0.0.0/4'];
  /**
   * Reserved for Future Use
   * Class E space
   */
  readonly futureUse: readonly ['240.0.0.0/4'];
};
/**
 * Get all bogon ranges as a flat array
 *
 * Flattens the nested BOGON_RANGES object into a single array of all
 * CIDR ranges. Useful for generating comprehensive firewall rules.
 *
 * @returns Array of all bogon IP CIDR ranges
 * @example
 * ```typescript
 * const ranges = getAllBogonRanges();
 * // Returns ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', ...]
 * ```
 */
export declare function getAllBogonRanges(): readonly string[];
/**
 * Check if an IP address falls within any bogon range
 *
 * Determines whether a given IP address is non-routable (bogon) by
 * testing it against all known bogon ranges. Supports both single IPs
 * and CIDR notation.
 *
 * @param address - IP address with optional CIDR (e.g., "10.0.0.1" or "10.0.0.0/8")
 * @returns true if address is within any bogon range, false otherwise
 * @example
 * ```typescript
 * isBogonAddress('192.168.1.1');    // true (private)
 * isBogonAddress('8.8.8.8');        // false (public)
 * isBogonAddress('10.0.0.0/8');     // true (private CIDR)
 * ```
 */
export declare function isBogonAddress(address: string): boolean;
/**
 * Get the bogon category for an IP address
 *
 * Identifies which bogon category an IP address falls into, useful for
 * displaying category-specific security recommendations or filter rules.
 *
 * @param address - IP address with optional CIDR notation
 * @returns Category name if address is a bogon, null otherwise
 * @example
 * ```typescript
 * getBogonCategory('192.168.1.1');   // 'private'
 * getBogonCategory('127.0.0.1');     // 'loopback'
 * getBogonCategory('8.8.8.8');       // null (not a bogon)
 * ```
 */
export declare function getBogonCategory(address: string): BogonCategory | null;
/**
 * Get human-readable description for a bogon category
 *
 * Returns a user-friendly explanation of what a bogon category represents.
 * Useful for UI tooltips and documentation.
 *
 * @param category - Bogon category name
 * @returns Human-readable description of the category
 * @example
 * ```typescript
 * getBogonCategoryDescription('private');    // 'RFC 1918 Private Address Space'
 * getBogonCategoryDescription('multicast');  // 'Multicast (one-to-many communication)'
 * ```
 */
export declare function getBogonCategoryDescription(category: BogonCategory): string;
/**
 * Get security recommendation for a bogon category
 *
 * Returns a specific security recommendation for blocking or handling
 * a particular bogon category in firewall rules.
 *
 * @param category - Bogon category name
 * @returns Security recommendation for the category
 * @example
 * ```typescript
 * getBogonSecurityRec('private');
 * // 'Block at WAN interface to prevent IP spoofing'
 * ```
 */
export declare function getBogonSecurityRec(category: BogonCategory): string;
//# sourceMappingURL=bogon-ranges.d.ts.map
