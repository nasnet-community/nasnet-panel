// =============================================================================
// ScanSummary Component
// =============================================================================
// Display scan statistics and provide export functionality (CSV/JSON)

import { Button, Card } from '@nasnet/ui/primitives';
import { Download } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { DiscoveredDevice, ScanStats } from './types';

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

export interface ScanSummaryProps {
  /** List of discovered devices */
  devices: DiscoveredDevice[];

  /** Scan statistics */
  stats: ScanStats;

  /** Subnet that was scanned */
  subnet: string;

  /** Optional CSS class name */
  className?: string;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format elapsed time for display
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
 */
function downloadAsFile(content: string, filename: string, mimeType: string) {
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
 */
function exportAsCSV(devices: DiscoveredDevice[], subnet: string) {
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
 */
function exportAsJSON(devices: DiscoveredDevice[], subnet: string, stats: ScanStats) {
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

export function ScanSummary({
  devices,
  stats,
  subnet,
  className,
}: ScanSummaryProps) {
  const dhcpCount = devices.filter((d) => d.dhcpLease).length;
  const staticCount = devices.length - dhcpCount;
  const uniqueVendors = new Set(
    devices.map((d) => d.vendor).filter((v) => v !== null)
  ).size;

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold mb-4">Scan Summary</h3>

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
          onClick={() => exportAsCSV(devices, subnet)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAsJSON(devices, subnet, stats)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
      </div>
    </Card>
  );
}
