/**
 * MAC Vendor Lookup Utility
 *
 * Provides vendor name lookup from MAC addresses using IEEE OUI database.
 * Includes validation, formatting, and lookup functions for MAC addresses.
 *
 * @module @nasnet/core/utils/mac-vendor/macVendorLookup
 */
/**
 * Lookup vendor name from MAC address using OUI database
 *
 * Supports multiple MAC address formats:
 * - Colon-separated: AA:BB:CC:DD:EE:FF
 * - Dash-separated: aa-bb-cc-dd-ee-ff
 * - No separator: aabbccddeeff
 *
 * @param mac - MAC address in any format
 * @returns Vendor name or null if not found
 *
 * @example
 * ```ts
 * lookupVendor('00:0F:E2:12:34:56') // => 'MikroTik'
 * lookupVendor('AC-DE-48-12-34-56') // => 'Apple Inc.'
 * lookupVendor('aabbccddeeff')      // => null (unknown vendor)
 * ```
 */
export declare function lookupVendor(mac: string): string | null;
/**
 * Validate MAC address format
 *
 * Accepts MAC addresses in the following formats:
 * - AA:BB:CC:DD:EE:FF (colon-separated)
 * - aa-bb-cc-dd-ee-ff (dash-separated)
 * - aabbccddeeff (no separator)
 *
 * @param mac - MAC address to validate
 * @returns True if valid MAC address format
 *
 * @example
 * ```ts
 * isValidMac('00:0F:E2:12:34:56') // => true
 * isValidMac('00-0F-E2-12-34-56') // => true
 * isValidMac('000FE2123456')      // => true
 * isValidMac('invalid')           // => false
 * ```
 */
export declare function isValidMac(mac: string): boolean;
/**
 * Format MAC address to standard colon-separated uppercase format
 *
 * @param mac - MAC address in any format
 * @returns Formatted MAC address (XX:XX:XX:XX:XX:XX) or null if invalid
 *
 * @example
 * ```ts
 * formatMac('aabbccddeeff')      // => 'AA:BB:CC:DD:EE:FF'
 * formatMac('aa-bb-cc-dd-ee-ff') // => 'AA:BB:CC:DD:EE:FF'
 * formatMac('invalid')           // => null
 * ```
 */
export declare function formatMac(mac: string): string | null;
//# sourceMappingURL=macVendorLookup.d.ts.map