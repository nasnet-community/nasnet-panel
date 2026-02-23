// =============================================================================
// ScanSummary Component
// =============================================================================
// Display scan statistics and provide export functionality (CSV/JSON)

import { memo, useCallback, useMemo } from 'react';
import { Button, Card } from '@nasnet/ui/primitives';
import { Download } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { DiscoveredDevice, ScanStats } from './types';

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

/**
 * Props for ScanSummary component
 *
 * Displays aggregated statistics and provides export options.
 */
export interface ScanSummaryProps {
  /** List of discovered devices from scan results */
  devices: DiscoveredDevice[];

  /** Scan statistics (duration, counts, timing) */
  stats: ScanStats;

  /** Subnet that was scanned (e.g., "192.168.1.0/24") */
  subnet: string;

  /** Optional CSS class name for root container */
  className?: string;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format elapsed time for display
 *
 * Converts milliseconds to human-readable duration string.
 * Examples: "45s", "2m 15s"
 *
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted duration string
 *
 * @internal
 */
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Download data as a file
 *
 * Creates a blob, generates a download URL, and triggers browser download.
 * Cleans up resources after download initiation.
 *
 * @param content - Text content to download
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type (e.g., "text/csv", "application/json")
 *
 * @internal
 */
function downloadAsFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export devices as CSV
 *
 * Generates CSV with headers: IP, MAC, Vendor, Hostname, Interface, RTT, DHCP Status.
 * Filename includes subnet and date: device-scan-192-168-1-0-24-2026-02-21.csv
 *
 * @param devices - Array of discovered devices
 * @param subnet - Subnet that was scanned (for filename)
 *
 * @internal
 */
function exportAsCSV(devices: DiscoveredDevice[], subnet: string): void {
  const headers = ['IP Address', 'MAC Address', 'Vendor', 'Hostname', 'Interface', 'Response Time (ms)', 'DHCP Status'];
  const rows = devices.map((device) => [
    device.ip,
    device.mac,
    device.vendor || 'Unknown',
    device.hostname || '',
    device.interface,
    device.responseTime.toString(),
    device.dhcpLease ? 'DHCP' : 'Static',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `device-scan-${subnet.replace(/\//g, '-')}-${timestamp}.csv`;

  downloadAsFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export devices as JSON
 *
 * Generates structured JSON with scan metadata and device array.
 * Filename includes subnet and date: device-scan-192-168-1-0-24-2026-02-21.json
 *
 * @param devices - Array of discovered devices
 * @param subnet - Subnet that was scanned (for filename)
 * @param stats - Scan statistics
 *
 * @internal
 */
function exportAsJSON(devices: DiscoveredDevice[], subnet: string, stats: ScanStats): void {
  const data = {
    scan: {
      subnet,
      timestamp: new Date().toISOString(),
      duration: formatElapsedTime(stats.elapsedTime),
      totalDevices: devices.length,
    },
    devices,
  };

  const jsonContent = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `device-scan-${subnet.replace(/\//g, '-')}-${timestamp}.json`;

  downloadAsFile(jsonContent, filename, 'application/json');
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Scan Summary Component
 *
 * Displays statistics from completed device scan:
 * - Total devices found
 * - Scan duration
 * - DHCP vs static device split
 * - Unique vendor count
 * - CSV/JSON export actions
 *
 * Shows subnet in monospace font (technical data).
 *
 * @example
 * ```tsx
 * <ScanSummary
 *   devices={discoveredDevices}
 *   stats={scanStats}
 *   subnet="192.168.1.0/24"
 * />
 * ```
 */
export const ScanSummary = memo(function ScanSummary({
  devices,
  stats,
  subnet,
  className,
}: ScanSummaryProps) {
  // Memoized counts for statistics
  const dhcpCount = useMemo(() => devices.filter((d) => d.dhcpLease).length, [devices]);
  const staticCount = useMemo(() => devices.length - dhcpCount, [devices.length, dhcpCount]);
  const uniqueVendors = useMemo(
    () => new Set(devices.map((d) => d.vendor).filter((v) => v !== null)).size,
    [devices]
  );

  // Stable callbacks for export actions
  const handleExportCSV = useCallback(() => {
    exportAsCSV(devices, subnet);
  }, [devices, subnet]);

  const handleExportJSON = useCallback(() => {
    exportAsJSON(devices, subnet, stats);
  }, [devices, subnet, stats]);

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold mb-4">Scan Summary</h3>
      {/* Note: This component is memoized to prevent unnecessary re-renders */}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Total Devices</p>
          <p className="text-2xl font-bold">{devices.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Scan Duration</p>
          <p className="text-2xl font-bold">{formatElapsedTime(stats.elapsedTime)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">DHCP / Static</p>
          <p className="text-2xl font-bold">
            {dhcpCount} / {staticCount}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Unique Vendors</p>
          <p className="text-2xl font-bold">{uniqueVendors}</p>
        </div>
      </div>

      {/* Subnet Information */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Subnet Scanned</p>
        <p className="text-sm font-mono">{subnet}</p>
      </div>

      {/* Export Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-2"
          aria-label="Export scan results as CSV file"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJSON}
          className="flex items-center gap-2"
          aria-label="Export scan results as JSON file"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export JSON
        </Button>
      </div>
    </Card>
  );
});

ScanSummary.displayName = 'ScanSummary';
