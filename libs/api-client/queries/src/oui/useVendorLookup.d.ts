/**
 * MAC Vendor Lookup Hook
 * Looks up vendor name from MAC address OUI (first 6 hex digits)
 *
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 * @module @nasnet/api-client/queries/oui/useVendorLookup
 *
 * Backend implementation: apps/backend/oui/
 * - lookup.go - OUI database service with embedded database
 * - handler.go - REST API endpoints
 * - oui-database.txt - Embedded OUI data (sample)
 */
/**
 * Query keys for OUI lookups
 */
export declare const ouiKeys: {
    all: readonly ["oui"];
    vendor: (mac: string) => readonly ["oui", "vendor", string];
    batch: (macs: string[]) => readonly ["oui", "batch", ...string[]];
};
/**
 * Hook to lookup MAC vendor name from OUI
 *
 * Uses TanStack Query with:
 * - Infinite staleTime (vendor data never changes)
 * - 24-hour garbage collection
 * - Automatic caching per MAC address
 *
 * @param macAddress - MAC address (format: AA:BB:CC:DD:EE:FF)
 * @returns Vendor name or null if not found
 *
 * @example
 * ```tsx
 * const vendor = useVendorLookup('A4:83:E7:12:34:56');
 * // Returns "Apple, Inc."
 * ```
 */
export declare function useVendorLookup(macAddress: string): string | null;
/**
 * Hook to lookup vendors for multiple MAC addresses (batch)
 *
 * More efficient than individual lookups when you need many vendors at once.
 * Uses single API call for all addresses.
 *
 * @param macAddresses - Array of MAC addresses
 * @returns Map of MAC address to vendor name
 *
 * @example
 * ```tsx
 * const vendors = useBatchVendorLookup(['AA:BB:CC:...', 'DD:EE:FF:...']);
 * // Returns: { 'AA:BB:CC:...': 'Apple Inc.', 'DD:EE:FF:...': 'Samsung' }
 * ```
 */
export declare function useBatchVendorLookup(macAddresses: string[]): Record<string, string>;
//# sourceMappingURL=useVendorLookup.d.ts.map