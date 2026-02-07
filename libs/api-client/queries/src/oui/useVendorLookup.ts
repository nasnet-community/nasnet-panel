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

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Vendor lookup response from backend
 */
interface VendorResponse {
  mac: string;
  vendor?: string;
  found: boolean;
}

/**
 * Batch vendor lookup response from backend
 */
interface BatchVendorResponse {
  results: Record<string, string>;
  count: number;
}

/**
 * Query keys for OUI lookups
 */
export const ouiKeys = {
  all: ['oui'] as const,
  vendor: (mac: string) => [...ouiKeys.all, 'vendor', mac] as const,
  batch: (macs: string[]) => [...ouiKeys.all, 'batch', ...macs] as const,
};

/**
 * Fetch vendor name for a MAC address
 */
async function fetchVendorLookup(macAddress: string): Promise<string | null> {
  const response = await fetch(`/api/oui/${encodeURIComponent(macAddress)}`);

  if (!response.ok) {
    // 404 means vendor not found, which is valid (unknown vendor)
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch vendor lookup');
  }

  const data: VendorResponse = await response.json();
  return data.found ? data.vendor || null : null;
}

/**
 * Fetch vendors for multiple MAC addresses (batch)
 */
async function fetchBatchVendorLookup(
  macAddresses: string[]
): Promise<Record<string, string>> {
  const response = await fetch('/api/oui/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ macAddresses }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch batch vendor lookup');
  }

  const data: BatchVendorResponse = await response.json();
  return data.results;
}

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
export function useVendorLookup(macAddress: string): string | null {
  const { data } = useQuery({
    queryKey: ouiKeys.vendor(macAddress),
    queryFn: () => fetchVendorLookup(macAddress),
    staleTime: Infinity, // Vendor data never changes
    gcTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    enabled: !!macAddress && macAddress.length >= 17, // AA:BB:CC:DD:EE:FF
  });

  return data ?? null;
}

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
export function useBatchVendorLookup(
  macAddresses: string[]
): Record<string, string> {
  const { data } = useQuery({
    queryKey: ouiKeys.batch(macAddresses),
    queryFn: () => fetchBatchVendorLookup(macAddresses),
    staleTime: Infinity, // Vendor data never changes
    gcTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    enabled: macAddresses.length > 0,
  });

  return data ?? {};
}

/**
 * Extract OUI (first 6 hex digits) from MAC address
 * Internal utility function
 */
function extractOUI(macAddress: string): string {
  return macAddress.replace(/[:-]/g, '').substring(0, 6).toUpperCase();
}
