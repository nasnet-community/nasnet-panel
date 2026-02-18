// =============================================================================
// DeviceDiscoveryTable Component
// =============================================================================
// Results table for discovered devices with virtualization support for large
// datasets (>50 devices)

import { useMemo } from 'react';
import { Badge } from '@nasnet/ui/primitives';
import { VirtualizedTable, DataTable, VIRTUALIZATION_THRESHOLD, createTextColumn } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
import type { DiscoveredDevice } from './types';
import type { ColumnDef } from '@tanstack/react-table';

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

export interface DeviceDiscoveryTableProps {
  /** List of discovered devices */
  devices: DiscoveredDevice[];

  /** Callback when device is selected */
  onSelectDevice: (device: DiscoveredDevice | null) => void;

  /** Currently selected device */
  selectedDevice: DiscoveredDevice | null;

  /** Optional CSS class name */
  className?: string;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format response time for display
 */
function formatResponseTime(ms: number): string {
  return `${ms}ms`;
}

/**
 * Format hostname with fallback
 */
function formatHostname(hostname: string | null): string {
  return hostname || 'Unknown';
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function DeviceDiscoveryTable({
  devices,
  onSelectDevice,
  selectedDevice,
  className,
}: DeviceDiscoveryTableProps) {
  // Define table columns
  const columns = useMemo<ColumnDef<DiscoveredDevice>[]>(
    () => [
      {
        accessorKey: 'ip',
        header: 'IP Address',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.ip}</div>
        ),
      },
      {
        accessorKey: 'mac',
        header: 'MAC Address',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.mac}</div>
        ),
      },
      {
        accessorKey: 'vendor',
        header: 'Vendor',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.vendor || (
              <span className="text-muted-foreground">Unknown</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'hostname',
        header: 'Hostname',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.hostname || (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'responseTime',
        header: 'Response',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatResponseTime(row.original.responseTime)}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const hasLease = !!row.original.dhcpLease;
          return (
            <Badge variant={hasLease ? 'default' : 'secondary'}>
              {hasLease ? 'DHCP' : 'Static'}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // Determine if we should use virtualization
  const useVirtualization = devices.length > VIRTUALIZATION_THRESHOLD;

  // Row click handler
  const handleRowClick = (device: DiscoveredDevice) => {
    if (selectedDevice?.ip === device.ip) {
      onSelectDevice(null); // Deselect if same device
    } else {
      onSelectDevice(device);
    }
  };

  // Common table props
  const tableProps = {
    data: devices,
    columns,
    enableSorting: true,
    onRowClick: handleRowClick,
    getRowClassName: (device: DiscoveredDevice) =>
      cn(
        'cursor-pointer transition-colors hover:bg-muted/50',
        selectedDevice?.ip === device.ip && 'bg-muted'
      ),
  };

  return (
    <div className={cn('rounded-md border', className)}>
      {useVirtualization ? (
        <VirtualizedTable
          {...tableProps as any}
          height={600}
        />
      ) : (
        <DataTable {...tableProps as any} />
      )}

      {/* Device count footer */}
      <div className="border-t px-4 py-2 text-sm text-muted-foreground">
        {devices.length} {devices.length === 1 ? 'device' : 'devices'} found
        {useVirtualization && ' (virtualized for performance)'}
      </div>
    </div>
  );
}
