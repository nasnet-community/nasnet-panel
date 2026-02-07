// =============================================================================
// DeviceScanDesktop Component
// =============================================================================
// Desktop presenter for device scanning with full table and inline detail panel

import { useState } from 'react';
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

export interface DeviceScanDesktopProps {
  // State from hook
  status: ScanStatus;
  progress: number;
  devices: DiscoveredDevice[];
  error: string | null;
  stats: ScanStats;
  isScanning: boolean;
  isComplete: boolean;
  isCancelled: boolean;
  isIdle: boolean;
  hasError: boolean;

  // Actions from hook
  startScan: (subnet: string, interfaceName?: string) => Promise<void>;
  stopScan: () => Promise<void>;
  reset: () => void;

  // Router context
  routerId?: string | null;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function DeviceScanDesktop({
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

  // Handlers
  const handleStartScan = () => {
    startScan(selectedSubnet, selectedInterface);
  };

  return (
    <Card className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Device Scan</h2>
        <p className="text-sm text-muted-foreground">
          Discover all devices on your network using ARP scanning
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-end gap-4">
        <div className="flex-1 max-w-xs">
          <InterfaceSelector
            routerId={routerId || ''}
            value={selectedInterface}
            onChange={setSelectedInterface}
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
        <div className="flex gap-2">
          {isScanning ? (
            <Button variant="destructive" onClick={stopScan}>
              Stop Scan
            </Button>
          ) : (
            <Button onClick={handleStartScan} disabled={!routerId}>
              Start Scan
            </Button>
          )}
          {isComplete && (
            <Button variant="outline" onClick={reset}>
              New Scan
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {isScanning && (
        <div className="space-y-2">
          <Progress
            value={progress}
            className="h-2"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Device scan progress: ${progress}% complete, ${stats.scannedCount} of ${stats.totalCount} IPs scanned`}
          />
          <p className="text-sm text-muted-foreground">
            Scanning {stats.scannedCount} of {stats.totalCount} IPs ({progress}%)
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Scan failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results with Inline Detail Panel */}
      {devices.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <DeviceDiscoveryTable
              devices={devices}
              onSelectDevice={setSelectedDevice}
              selectedDevice={selectedDevice}
            />
          </div>
          <div>
            {selectedDevice ? (
              <DeviceDetailPanel
                device={selectedDevice}
                onClose={() => setSelectedDevice(null)}
                routerId={routerId}
              />
            ) : (
              <Card className="p-4 text-center text-muted-foreground">
                Select a device to view details
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
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No devices found on this subnet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a different subnet or check your network connection
          </p>
        </Card>
      )}

      {/* Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {isScanning && `Scanning ${stats.scannedCount} of ${stats.totalCount} IPs`}
        {isComplete && `Scan complete. Found ${devices.length} devices.`}
      </div>
    </Card>
  );
}
