// =============================================================================
// DeviceScanMobile Component
// =============================================================================
// Mobile presenter for device scanning with bottom sheet detail view

import { useState } from 'react';
import { Button, Progress, Card, Sheet, SheetContent, SheetHeader, SheetTitle } from '@nasnet/ui/primitives';
import { InterfaceSelector, SubnetInput } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
import { DeviceDiscoveryTable } from './DeviceDiscoveryTable';
import { DeviceDetailPanel } from './DeviceDetailPanel';
import { ScanSummary } from './ScanSummary';
import type { DiscoveredDevice, ScanStats, ScanStatus } from './types';

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

export interface DeviceScanMobileProps {
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

export function DeviceScanMobile({
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

  // Handlers
  const handleStartScan = () => {
    startScan(selectedSubnet, selectedInterface);
  };

  const handleSelectDevice = (device: DiscoveredDevice | null) => {
    setSelectedDevice(device);
    setIsDetailOpen(device !== null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Device Scan</h2>
        <p className="text-sm text-muted-foreground">
          Discover devices on your network
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <InterfaceSelector
          routerId={routerId || ''}
          value={selectedInterface}
          onChange={(value: string | string[]) => setSelectedInterface(Array.isArray(value) ? value[0] : value)}
          disabled={isScanning || !routerId}
          label="Interface (optional)"
        />

        <SubnetInput
          value={selectedSubnet}
          onChange={setSelectedSubnet}
          disabled={isScanning}
          label="Subnet to scan"
        />

        <div className="flex gap-2">
          {isScanning ? (
            <Button
              variant="destructive"
              onClick={stopScan}
              className="flex-1"
              size="lg"
            >
              Stop Scan
            </Button>
          ) : (
            <Button
              onClick={handleStartScan}
              disabled={!routerId}
              className="flex-1"
              size="lg"
            >
              Start Scan
            </Button>
          )}
          {isComplete && (
            <Button variant="outline" onClick={reset} size="lg">
              New Scan
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {isScanning && (
        <Card className="p-4 space-y-2">
          <Progress
            value={progress}
            className="h-3"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Device scan progress: ${progress}% complete`}
          />
          <p className="text-sm text-muted-foreground text-center">
            {stats.scannedCount} of {stats.totalCount} IPs ({progress}%)
          </p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-destructive/10">
          <p className="font-medium text-destructive">Scan failed</p>
          <p className="text-sm text-destructive">{error}</p>
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
        <ScanSummary devices={devices} stats={stats} subnet={selectedSubnet} />
      )}

      {/* Empty State */}
      {isComplete && devices.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No devices found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a different subnet
          </p>
        </Card>
      )}

      {/* Device Detail Bottom Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
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
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {isScanning && `Scanning ${stats.scannedCount} of ${stats.totalCount} IPs`}
        {isComplete && `Scan complete. Found ${devices.length} devices.`}
      </div>
    </div>
  );
}
