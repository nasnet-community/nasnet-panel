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

// ============================================================================
// Bogon Range Definitions
// ============================================================================

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
export const BOGON_RANGES: BogonRanges = {
  /**
   * RFC 1918 - Private Address Space
   * Should never appear as source on public internet
   */
  private: [
    '10.0.0.0/8',       // Class A private
    '172.16.0.0/12',    // Class B private
    '192.168.0.0/16',   // Class C private
  ],

  /**
   * RFC 5735 - Loopback
   * Local machine addresses
   */
  loopback: [
    '127.0.0.0/8',      // Loopback
  ],

  /**
   * RFC 5735 - Reserved/Special-Use
   * Documentation, benchmarking, protocol assignments
   */
  reserved: [
    '0.0.0.0/8',        // Current network (only valid as source)
    '192.0.0.0/24',     // IETF Protocol Assignments
    '192.0.2.0/24',     // TEST-NET-1 (documentation)
    '198.18.0.0/15',    // Benchmarking
    '198.51.100.0/24',  // TEST-NET-2 (documentation)
    '203.0.113.0/24',   // TEST-NET-3 (documentation)
    '100.64.0.0/10',    // Carrier-grade NAT (RFC 6598)
  ],

  /**
   * RFC 3927 - Link-Local Addresses
   * Autoconfiguration when DHCP fails
   */
  linkLocal: [
    '169.254.0.0/16',   // Link-local (APIPA)
  ],

  /**
   * RFC 1112 - Multicast
   * One-to-many communication
   */
  multicast: [
    '224.0.0.0/4',      // Multicast (Class D)
  ],

  /**
   * Reserved for Future Use
   * Class E space
   */
  futureUse: [
    '240.0.0.0/4',      // Reserved (Class E)
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all bogon ranges as a flat array
 * Useful for generating firewall rules
 */
export function getAllBogonRanges(): string[] {
  return [
    ...BOGON_RANGES.private,
    ...BOGON_RANGES.loopback,
    ...BOGON_RANGES.reserved,
    ...BOGON_RANGES.linkLocal,
    ...BOGON_RANGES.multicast,
    ...BOGON_RANGES.futureUse,
  ];
}

/**
 * Check if an IP address falls within any bogon range
 * @param address - IP address with optional CIDR (e.g., "10.0.0.1" or "10.0.0.0/8")
 * @returns true if address is a bogon
 */
export function isBogonAddress(address: string): boolean {
  // Extract IP without CIDR for simple matching
  const ip = address.split('/')[0];
  const octets = ip.split('.').map(Number);

  if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
    return false;
  }

  // Check each category
  return getAllBogonRanges().some((range: string) => {
    return isIPInRange(ip, range);
  });
}

/**
 * Get the bogon category for an IP address
 * @param address - IP address with optional CIDR
 * @returns Category name or null if not a bogon
 */
export function getBogonCategory(address: string): BogonCategory | null {
  const ip = address.split('/')[0];

  for (const [category, ranges] of Object.entries(BOGON_RANGES)) {
    if (ranges.some((range: string) => isIPInRange(ip, range))) {
      return category as BogonCategory;
    }
  }

  return null;
}

/**
 * Check if an IP address falls within a CIDR range
 * @param ip - IP address (e.g., "192.168.1.5")
 * @param cidr - CIDR range (e.g., "192.168.0.0/16")
 * @returns true if IP is within range
 */
function isIPInRange(ip: string, cidr: string): boolean {
  const [rangeIP, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(rangeIP);
  const mask = ~((1 << (32 - prefix)) - 1);

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert IP address string to 32-bit number
 * @param ip - IP address (e.g., "192.168.1.1")
 * @returns 32-bit number representation
 */
function ipToNumber(ip: string): number {
  const octets = ip.split('.').map(Number);
  return (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];
}

// ============================================================================
// Category Descriptions
// ============================================================================

/**
 * Get human-readable description for bogon category
 */
export function getBogonCategoryDescription(category: BogonCategory): string {
  switch (category) {
    case 'private':
      return 'RFC 1918 Private Address Space';
    case 'loopback':
      return 'Loopback Addresses (localhost)';
    case 'reserved':
      return 'Reserved/Special-Use (documentation, testing)';
    case 'linkLocal':
      return 'Link-Local (APIPA autoconfiguration)';
    case 'multicast':
      return 'Multicast (one-to-many communication)';
    case 'futureUse':
      return 'Reserved for Future Use (Class E)';
    default:
      return 'Unknown';
  }
}

/**
 * Get security recommendation for bogon category
 */
export function getBogonSecurityRec(category: BogonCategory): string {
  switch (category) {
    case 'private':
      return 'Block at WAN interface to prevent IP spoofing';
    case 'loopback':
      return 'Never allow from external interfaces';
    case 'reserved':
      return 'Block to prevent documentation/test traffic';
    case 'linkLocal':
      return 'Block at router edge (autoconfiguration only)';
    case 'multicast':
      return 'Allow only if multicast routing is enabled';
    case 'futureUse':
      return 'Always block (reserved for future use)';
    default:
      return '';
  }
}
