// =============================================================================
// DeviceScanMobile Component
// =============================================================================
// Mobile presenter for device scanning with bottom sheet detail view

import { memo, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Progress,
  Card,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@nasnet/ui/primitives';
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
 * Props for DeviceScanMobile component
 *
 * Combines scan state, actions, and presentation options for mobile layout.
 * All state properties are derived from {@link useDeviceScan} hook.
 */
export interface DeviceScanMobileProps {
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
 * Mobile presenter for device scan tool
 *
 * Displays ARP scan UI optimized for touch:
 * - Single-column card layout
 * - Bottom sheet detail view (not inline)
 * - Large touch targets (44px minimum)
 * - Simplified controls (stacked vertically)
 *
 * Detail panel opens in a bottom sheet when device is selected.
 *
 * @see {@link DeviceScanTool} for auto-detecting wrapper
 * @see {@link DeviceScanDesktop} for desktop layout
 */
export const DeviceScanMobile = memo(function DeviceScanMobile({
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
}: DeviceScanMobileProps) {
  // Local state
  const [selectedSubnet, setSelectedSubnet] = useState('192.168.88.0/24');
  const [selectedInterface, setSelectedInterface] = useState<string | undefined>();
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    setIsDetailOpen(device !== null);
  }, []);

  // Memoized progress label for accessibility
  const progressLabel = useMemo(() => `Device scan progress: ${progress}% complete`, [progress]);

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="font-display text-category-networking text-xl font-semibold">Device Scan</h2>
        <p className="text-muted-foreground text-sm">Discover devices on your network</p>
      </div>

      {/* Controls */}
      <div className="space-y-component-md">
        <InterfaceSelector
          routerId={routerId || ''}
          value={selectedInterface}
          onChange={handleInterfaceChange}
          disabled={isScanning || !routerId}
          label="Interface (optional)"
        />

        <SubnetInput
          value={selectedSubnet}
          onChange={setSelectedSubnet}
          disabled={isScanning}
          label="Subnet to scan"
        />

        <div className="gap-component-sm flex">
          {isScanning ?
            <Button
              variant="destructive"
              onClick={stopScan}
              className="focus-visible:ring-ring flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              size="lg"
              aria-label="Stop the currently running device scan"
            >
              Stop Scan
            </Button>
          : <Button
              onClick={handleStartScan}
              disabled={!routerId}
              className="focus-visible:ring-ring flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              size="lg"
              aria-label="Start ARP device scan on the selected subnet"
            >
              Start Scan
            </Button>
          }
          {isComplete && (
            <Button
              variant="outline"
              onClick={reset}
              size="lg"
              aria-label="Reset and start a new device scan"
              className="focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              New Scan
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {isScanning && (
        <Card className="p-component-md space-y-component-sm">
          <Progress
            value={progress}
            className="h-3"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={progressLabel}
          />
          <p className="text-muted-foreground text-center text-sm">
            <span className="font-mono">{stats.scannedCount}</span> of{' '}
            <span className="font-mono">{stats.totalCount}</span> IPs ({progress}%)
          </p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card
          className="p-component-md bg-error/10 border-error/30 border"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-error font-medium">Scan failed</p>
          <p className="text-error mt-component-sm text-sm">{error}</p>
        </Card>
      )}

      {/* Results */}
      {devices.length > 0 && (
        <DeviceDiscoveryTable
          devices={devices}
          onSelectDevice={handleSelectDevice}
          selectedDevice={selectedDevice}
        />
      )}

      {/* Scan Summary */}
      {isComplete && devices.length > 0 && (
        <ScanSummary
          devices={devices}
          stats={stats}
          subnet={selectedSubnet}
        />
      )}

      {/* Empty State */}
      {isComplete && devices.length === 0 && (
        <Card className="p-component-lg border-dashed text-center">
          <p className="text-muted-foreground font-medium">No devices found</p>
          <p className="text-muted-foreground mt-component-sm text-sm">Try a different subnet</p>
        </Card>
      )}

      {/* Device Detail Bottom Sheet */}
      <Sheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      >
        <SheetContent
          side="bottom"
          className="h-[80vh]"
        >
          <SheetHeader>
            <SheetTitle>Device Details</SheetTitle>
          </SheetHeader>
          {selectedDevice && (
            <DeviceDetailPanel
              device={selectedDevice}
              onClose={() => {
                setIsDetailOpen(false);
                setSelectedDevice(null);
              }}
              routerId={routerId}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {isScanning && `Scanning ${stats.scannedCount} of ${stats.totalCount} IPs`}
        {isComplete && `Scan complete. Found ${devices.length} devices.`}
      </div>
    </div>
  );
});

DeviceScanMobile.displayName = 'DeviceScanMobile';
