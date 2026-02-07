// =============================================================================
// MAC Vendor Lookup Utility
// =============================================================================
// Provides vendor name lookup from MAC address using OUI (Organizationally
// Unique Identifier) database

import { OUI_DATABASE } from './oui-database';

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
export function lookupVendor(mac: string): string | null {
  // Normalize: remove separators, uppercase, take first 6 chars (OUI)
  const normalized = mac.toUpperCase().replace(/[:-]/g, '');

  if (normalized.length < 6) {
    return null;
  }

  // Format as XX:YY:ZZ to match database keys
  const oui = `${normalized.slice(0, 2)}:${normalized.slice(2, 4)}:${normalized.slice(4, 6)}`;

  return OUI_DATABASE[oui] ?? null;
}

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
export function isValidMac(mac: string): boolean {
  const normalized = mac.replace(/[:-]/g, '');
  return /^[0-9A-Fa-f]{12}$/.test(normalized);
}

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
export function formatMac(mac: string): string | null {
  if (!isValidMac(mac)) {
    return null;
  }

  const normalized = mac.toUpperCase().replace(/[:-]/g, '');

  return [
    normalized.slice(0, 2),
    normalized.slice(2, 4),
    normalized.slice(4, 6),
    normalized.slice(6, 8),
    normalized.slice(8, 10),
    normalized.slice(10, 12),
  ].join(':');
}
