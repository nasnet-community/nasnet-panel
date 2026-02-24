// =============================================================================
// DeviceScanDesktop Component
// =============================================================================
// Desktop presenter for device scanning with full table and inline detail panel

import { useState, memo, useCallback, useMemo } from 'react';
import { Button, Progress, Card } from '@nasnet/ui/primitives';
import { InterfaceSelector, SubnetInput } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
import { DeviceDiscoveryTable } from './DeviceDiscoveryTable';
import { DeviceDetailPanel } from './DeviceDetailPanel';
import { ScanSummary } from './ScanSummary';
import type { DiscoveredDevice, ScanStats, ScanStatus } from './types';

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

/**
 * Props for DeviceScanDesktop component
 *
 * Combines scan state, actions, and presentation options for desktop layout.
 * All state properties are derived from {@link useDeviceScan} hook.
 */
export interface DeviceScanDesktopProps {
  // State from hook
  /** Current scan state (idle|scanning|complete|error|cancelled) */
  status: ScanStatus;
  /** Progress percentage (0-100) for current scan */
  progress: number;
  /** Array of discovered devices */
  devices: DiscoveredDevice[];
  /** Error message if scan failed (null if no error) */
  error: string | null;
  /** Scan statistics (duration, counts, etc) */
  stats: ScanStats;
  /** True when scan is actively running */
  isScanning: boolean;
  /** True when scan completed normally */
  isComplete: boolean;
  /** True when user cancelled the scan */
  isCancelled: boolean;
  /** True when no scan has started yet */
  isIdle: boolean;
  /** True when scan failed with error */
  hasError: boolean;

  // Actions from hook
  /** Start a new scan on given subnet (optional interface filter) */
  startScan: (subnet: string, interfaceName?: string) => Promise<void>;
  /** Stop the currently running scan */
  stopScan: () => Promise<void>;
  /** Reset to idle state for new scan */
  reset: () => void;

  // Router context
  /** Router ID for API context (required for interface selector) */
  routerId?: string | null;
  /** Optional CSS class name for root container */
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Desktop presenter for device scan tool
 *
 * Displays ARP scan UI with:
 * - Subnet input and interface selector
 * - Full-width device discovery table
 * - Inline detail panel (right sidebar)
 * - Scan summary with export options
 *
 * Uses 3-column layout: controls (full) + table (2/3) + detail panel (1/3)
 *
 * @see {@link DeviceScanTool} for auto-detecting wrapper
 * @see {@link DeviceScanMobile} for mobile layout
 */
export const DeviceScanDesktop = memo(function DeviceScanDesktop({
  status,
  progress,
  devices,
  error,
  stats,
  isScanning,
  isComplete,
  routerId,
  className,
  startScan,
  stopScan,
  reset,
}: DeviceScanDesktopProps) {
  // Local state
  const [selectedSubnet, setSelectedSubnet] = useState('192.168.88.0/24');
  const [selectedInterface, setSelectedInterface] = useState<string | undefined>();
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);

  // Stable callback for interface selector change
  const handleInterfaceChange = useCallback((value: string | string[]) => {
    setSelectedInterface(Array.isArray(value) ? value[0] : value);
  }, []);

  // Stable callback for starting scan
  const handleStartScan = useCallback(() => {
    startScan(selectedSubnet, selectedInterface);
  }, [selectedSubnet, selectedInterface, startScan]);

  // Stable callback for selecting device
  const handleSelectDevice = useCallback((device: DiscoveredDevice | null) => {
    setSelectedDevice(device);
  }, []);

  // Memoized progress label for accessibility (changes with progress value)
  const progressLabel = useMemo(
    () =>
      `Device scan progress: ${progress}% complete, ${stats.scannedCount} of ${stats.totalCount} IPs scanned`,
    [progress, stats.scannedCount, stats.totalCount]
  );

  return (
    <Card className={cn('p-component-lg space-y-component-lg', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold font-display">Device Scan</h2>
        <p className="text-sm text-muted-foreground">
          Discover all devices on your network using ARP scanning
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-end gap-component-md">
        <div className="flex-1 max-w-xs">
          <InterfaceSelector
            routerId={routerId || ''}
            value={selectedInterface}
            onChange={handleInterfaceChange}
            disabled={isScanning || !routerId}
            label="Interface (optional)"
          />
        </div>
        <div className="flex-1 max-w-xs">
          <SubnetInput
            value={selectedSubnet}
            onChange={setSelectedSubnet}
            disabled={isScanning}
            label="Subnet to scan"
          />
        </div>
        <div className="flex gap-component-sm">
          {isScanning ? (
            <Button
              variant="destructive"
              onClick={stopScan}
              aria-label="Stop the currently running device scan"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Stop Scan
            </Button>
          ) : (
            <Button
              onClick={handleStartScan}
              disabled={!routerId}
              aria-label="Start ARP device scan on the selected subnet"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start Scan
            </Button>
          )}
          {isComplete && (
            <Button
              variant="outline"
              onClick={reset}
              aria-label="Reset and start a new device scan"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              New Scan
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {isScanning && (
        <div className="space-y-component-sm">
          <Progress
            value={progress}
            className="h-2"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={progressLabel}
          />
          <p className="text-sm text-muted-foreground">
            Scanning <span className="font-mono">{stats.scannedCount}</span> of{' '}
            <span className="font-mono">{stats.totalCount}</span> IPs ({progress}%)
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="rounded-md bg-error/10 p-component-md text-error border border-error/30"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium">Scan failed</p>
          <p className="text-sm mt-component-sm">{error}</p>
        </div>
      )}

      {/* Results with Inline Detail Panel */}
      {devices.length > 0 && (
        <div className="grid grid-cols-3 gap-component-md">
          <div className="col-span-2">
            <DeviceDiscoveryTable
              devices={devices}
              onSelectDevice={handleSelectDevice}
              selectedDevice={selectedDevice}
            />
          </div>
          <div>
            {selectedDevice ? (
              <DeviceDetailPanel
                device={selectedDevice}
                onClose={() => handleSelectDevice(null)}
                routerId={routerId}
              />
            ) : (
              <Card className="p-component-md text-center text-muted-foreground border-dashed">
                <p>Select a device from the table to view details</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Scan Summary */}
      {isComplete && devices.length > 0 && (
        <ScanSummary devices={devices} stats={stats} subnet={selectedSubnet} />
      )}

      {/* Empty State */}
      {isComplete && devices.length === 0 && (
        <Card className="p-component-lg text-center border-dashed">
          <p className="text-muted-foreground font-medium">No devices found on this subnet</p>
          <p className="text-sm text-muted-foreground mt-component-sm">
            Try a different subnet or check your network connection
          </p>
        </Card>
      )}

      {/* Screen Reader Announcements (live region) */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {isScanning && `Scanning ${stats.scannedCount} of ${stats.totalCount} IPs`}
        {isComplete && `Scan complete. Found ${devices.length} devices.`}
      </div>
    </Card>
  );
});

DeviceScanDesktop.displayName = 'DeviceScanDesktop';
