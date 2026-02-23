// =============================================================================
// DeviceDiscoveryTable Component
// =============================================================================
// Results table for discovered devices with virtualization support for large
// datasets (>50 devices)

import React, { useMemo, useCallback } from 'react';
import { Badge } from '@nasnet/ui/primitives';
import { VirtualizedTable, DataTable, VIRTUALIZATION_THRESHOLD } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
import type { DiscoveredDevice } from './types';
import type { ColumnDef } from '@tanstack/react-table';

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

/**
 * Props for DeviceDiscoveryTable component
 */
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
 * @param ms - Response time in milliseconds
 * @returns Formatted response time string
 */
function formatResponseTime(ms: number): string {
  return `${ms}ms`;
}

/**
 * Format hostname with fallback to 'Unknown'
 * @param hostname - Hostname string or null
 * @returns Formatted hostname or 'Unknown'
 */
function formatHostname(hostname: string | null): string {
  return hostname || 'Unknown';
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * DeviceDiscoveryTable
 * Displays discovered devices in a table with automatic virtualization for
 * large datasets (>50 devices). Supports row selection with visual highlighting.
 * Uses font-mono for IPs and MACs for technical accuracy.
 *
 * Features:
 * - Responsive virtualization (DataTable for <50, VirtualizedTable for ≥50)
 * - Row selection with click handlers
 * - Status badges (DHCP vs Static)
 * - Device count footer
 * - Semantic tokens for colors and spacing
 *
 * @example
 * ```tsx
 * <DeviceDiscoveryTable
 *   devices={discoveredDevices}
 *   selectedDevice={selected}
 *   onSelectDevice={setSelected}
 * />
 * ```
 *
 * @see {@link DiscoveredDevice} for device structure
 * @see {@link DeviceDetailPanel} for detail view
 */
export const DeviceDiscoveryTable = React.memo(function DeviceDiscoveryTable({
  devices,
  onSelectDevice,
  selectedDevice,
  className,
}: DeviceDiscoveryTableProps) {
  // Define table columns with memoization
  const columns = useMemo<ColumnDef<DiscoveredDevice>[]>(
    () => [
      {
        accessorKey: 'ip',
        header: 'IP Address',
        cell: ({ row }) => (
          <div className="font-mono text-sm text-foreground">{row.original.ip}</div>
        ),
      },
      {
        accessorKey: 'mac',
        header: 'MAC Address',
        cell: ({ row }) => (
          <div className="font-mono text-sm text-foreground">{row.original.mac}</div>
        ),
      },
      {
        accessorKey: 'vendor',
        header: 'Vendor',
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
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
          <div className="text-sm text-foreground">
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
          <div className="text-sm text-foreground">
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

  // Row click handler with stable reference
  const handleRowClick = useCallback((device: DiscoveredDevice) => {
    if (selectedDevice?.ip === device.ip) {
      onSelectDevice(null); // Deselect if same device
    } else {
      onSelectDevice(device);
    }
  }, [selectedDevice?.ip, onSelectDevice]);

  // Common table props with memoized values
  const tableProps = useMemo(() => ({
    data: devices,
    columns,
    enableSorting: true,
    onRowClick: handleRowClick,
    getRowClassName: (device: DiscoveredDevice) =>
      cn(
        'cursor-pointer transition-colors hover:bg-muted/50',
        selectedDevice?.ip === device.ip && 'bg-muted'
      ),
  }), [devices, columns, handleRowClick, selectedDevice?.ip]);

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
});

DeviceDiscoveryTable.displayName = 'DeviceDiscoveryTable';
