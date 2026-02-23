/**
 * useMACInput Hook - Headless MAC Address Input Logic
 *
 * Contains all business logic for the MAC address input component:
 * - Multi-format parsing (colon, dash, dot, no separator)
 * - Auto-formatting with uppercase conversion
 * - OUI vendor lookup from embedded database
 * - Validation using the mac schema
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */
import type { UseMACInputConfig, UseMACInputReturn, MACFormat } from './mac-input.types';
/**
 * Validates if a string is a valid MAC address.
 * Supports colon, dash, dot, and no-separator formats.
 */
export declare function isValidMAC(mac: string): boolean;
/**
 * Normalizes a MAC address to the specified format.
 *
 * @param input - The raw MAC address input (any format)
 * @param format - Target format: 'colon', 'dash', or 'dot'
 * @returns Normalized MAC address string
 */
export declare function normalizeMAC(input: string, format: MACFormat): string;
/**
 * Extracts the OUI prefix from a MAC address (first 3 octets).
 *
 * @param mac - MAC address in any format
 * @returns OUI prefix in colon format (XX:XX:XX), or null if invalid
 */
export declare function extractOUI(mac: string): string | null;
/**
 * Looks up vendor name from OUI prefix.
 *
 * @param mac - MAC address in any format
 * @returns Vendor name or 'Unknown vendor' if not found
 */
export declare function lookupVendor(mac: string): string | null;
/**
 * Headless hook for MAC address input logic.
 *
 * @param config - Configuration options
 * @returns State and handlers for MAC input component
 *
 * @example
 * ```tsx
 * const { value, isValid, error, vendor, handleChange } = useMACInput({
 *   value: mac,
 *   onChange: setMac,
 *   format: 'colon',
 *   showVendor: true,
 * });
 * ```
 */
export declare function useMACInput(config?: UseMACInputConfig): UseMACInputReturn;
//# sourceMappingURL=use-mac-input.d.ts.map