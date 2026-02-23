/**
 * CSV Export Utility for DHCP Leases
 * NAS-6.11 DHCP Lease Management
 *
 * Exports DHCP lease data to CSV format, respecting active filters
 */

import type { DHCPLease } from '@nasnet/core/types';
import { formatExpirationTime } from '@nasnet/core/utils';

/**
 * Filter criteria for CSV export
 */
export interface CSVExportFilters {
  /** Search term for IP, MAC, or hostname */
  search: string;
  /** Status filter (all, bound, waiting, static) */
  status: string;
  /** Server filter (all, or specific server name) */
  server: string;
}

/**
 * Checks if a lease matches the search term
 * @description Performs case-insensitive matching against IP, MAC, and hostname fields
 * @param lease - DHCP lease to check
 * @param search - Search term (IP, MAC, or hostname)
 * @returns True if lease matches search
 */
function matchesSearch(lease: DHCPLease, search: string): boolean {
  if (!search) return true;

  const searchLower = search.toLowerCase();
  const hostname = lease.hostname?.toLowerCase() || '';

  return (
    lease.address.toLowerCase().includes(searchLower) ||
    lease.macAddress.toLowerCase().includes(searchLower) ||
    hostname.includes(searchLower)
  );
}

/**
 * Escapes CSV cell value and wraps in quotes
 * @description Handles special characters and internal quotes per RFC 4180
 * @param value - Cell value to escape
 * @returns Escaped CSV cell value
 */
function escapeCsvCell(value: string): string {
  // Escape internal quotes by doubling them
  const escaped = value.replace(/"/g, '""');
  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Exports DHCP leases to CSV file with active filters applied
 * @description Filters leases based on provided criteria and triggers browser download.
 * Downloads file with ISO date: dhcp-leases-YYYY-MM-DD.csv. Properly cleans up resources.
 *
 * @param leases - Array of DHCP leases to export
 * @param filters - Active filter criteria
 * @example
 * exportLeasesToCSV(leases, {
 *   search: '192.168',
 *   status: 'bound',
 *   server: 'all'
 * });
 */
export function exportLeasesToCSV(
  leases: DHCPLease[],
  filters: CSVExportFilters
): void {
  // Filter leases based on provided filters (respect active filters)
  const filtered = leases.filter((lease) => {
    // Apply search filter
    if (filters.search && !matchesSearch(lease, filters.search)) {
      return false;
    }

    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'static' && lease.dynamic) {
        return false;
      }
      if (filters.status !== 'static' && lease.status !== filters.status) {
        return false;
      }
    }

    // Apply server filter
    if (filters.server !== 'all' && lease.server !== filters.server) {
      return false;
    }

    return true;
  });

  // Generate CSV headers
  const CSV_HEADERS = ['IP Address', 'MAC Address', 'Hostname', 'Server', 'Status', 'Expires'];

  // Generate CSV rows
  const rows = filtered.map((lease) => [
    lease.address,
    lease.macAddress,
    lease.hostname || 'Unknown',
    lease.server,
    lease.dynamic ? lease.status : 'static',
    formatExpirationTime(lease.expiresAfter),
  ]);

  // Convert to CSV format (escape special characters)
  const csvContent = [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  // Create Blob and download file with ISO date
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    // Generate filename with ISO date (YYYY-MM-DD)
    const isoDate = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `dhcp-leases-${isoDate}.csv`;

    // Trigger download
    link.click();
  } finally {
    // Ensure cleanup happens even if download fails
    URL.revokeObjectURL(url);
  }
}
