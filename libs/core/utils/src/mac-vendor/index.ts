/**
 * MAC Vendor Lookup utilities - Public API
 *
 * Provides vendor name lookup from MAC addresses using IEEE OUI (Organizationally
 * Unique Identifier) database. Supports multiple MAC address formats and includes
 * validation and formatting utilities.
 *
 * @example
 * ```ts
 * import { lookupVendor, isValidMac, formatMac } from '@nasnet/core/utils/mac-vendor';
 *
 * if (isValidMac('aa:bb:cc:dd:ee:ff')) {
 *   const formatted = formatMac('aabbccddeeff'); // 'AA:BB:CC:DD:EE:FF'
 *   const vendor = lookupVendor(formatted); // 'Apple Inc.' or null
 * }
 * ```
 *
 * @module @nasnet/core/utils/mac-vendor
 */

export { lookupVendor, isValidMac, formatMac } from './macVendorLookup';
export { OUI_DATABASE } from './oui-database';
