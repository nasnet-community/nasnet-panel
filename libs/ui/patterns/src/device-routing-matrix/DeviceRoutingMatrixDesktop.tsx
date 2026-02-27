/**
 * DeviceRoutingMatrixDesktop Component
 *
 * Desktop presenter (>1024px) for the DeviceRoutingMatrix pattern.
 * Features virtualized table, keyboard navigation, and bulk operations.
 */

import { memo, useMemo } from 'react';

import {
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives';

import { VirtualizedTable } from '../virtualization';
import { useDeviceRoutingMatrix } from './useDeviceRoutingMatrix';

import type { DeviceRoutingMatrixProps, NetworkDevice } from './types';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Desktop presenter for DeviceRoutingMatrix
 *
 * Displays devices in a virtualized table with:
 * - Checkbox column for selection
 * - Device info (name, IP, MAC, source)
 * - Service dropdown for assignment
 * - Actions (remove routing)
 * - Bulk action bar when devices selected
 */
function DeviceRoutingMatrixDesktopComponent(props: DeviceRoutingMatrixProps) {
  const {
    routerId,
    matrix,
    actions,
    loading = false,
    error,
    className,
    emptyMessage = 'No devices discovered',
    showSummary = true,
  } = props;

  const hook = useDeviceRoutingMatrix(matrix, actions, loading);

  // Table columns definition
  const columns = useMemo<ColumnDef<NetworkDevice>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(checked) => {
              if (checked) {
                hook.selectAll();
              } else {
                hook.clearSelection();
              }
            }}
            aria-label="Select all devices"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={hook.isDeviceSelected(row.original.deviceID)}
            onCheckedChange={() => {
              hook.toggleSelection(row.original.deviceID, false);
            }}
            aria-label={`Select device ${row.original.hostname ?? row.original.macAddress}`}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: 'hostname',
        header: 'Device Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.original.hostname ?? 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.ipAddress ?? 'No IP'}
            </span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'macAddress',
        header: 'MAC Address',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.macAddress}
          </span>
        ),
        size: 150,
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => {
          const device = row.original;
          const sourceLabel =
            device.dhcpLease && device.arpEntry
              ? 'DHCP+ARP'
              : device.dhcpLease
              ? 'DHCP'
              : 'ARP';
          return (
            <Badge variant="outline" className="font-mono text-xs">
              {sourceLabel}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'isRouted',
        header: 'Status',
        cell: ({ row }) => {
          const device = row.original;
          const routing = hook.getDeviceRouting(device.deviceID);

          if (!device.isRouted || !routing) {
            return (
              <Badge variant="secondary" className="gap-1">
                <XMarkIcon className="h-3 w-3" />
                Unrouted
              </Badge>
            );
          }

          return (
            <Badge variant="success" className="gap-1">
              <CheckIcon className="h-3 w-3" />
              {hook.getInterfaceName(routing.interfaceID)}
            </Badge>
          );
        },
        size: 150,
      },
      {
        id: 'service',
        header: 'Assign to Service',
        cell: ({ row }) => {
          const device = row.original;
          const routing = hook.getDeviceRouting(device.deviceID);
          const currentInterfaceID = routing?.interfaceID;

          return (
            <Select
              value={currentInterfaceID ?? ''}
              onValueChange={(value) => {
                if (value && value !== currentInterfaceID) {
                  hook.handleAssign(device.deviceID, value);
                }
              }}
              disabled={hook.availableInterfaces.length === 0 || loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {hook.availableInterfaces.map((iface) => (
                  <SelectItem key={iface.id} value={iface.id}>
                    {iface.instanceName}
                  </SelectItem>
                ))}
                {hook.availableInterfaces.length === 0 && (
                  <SelectItem value="" disabled>
                    No services available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          );
        },
        size: 200,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const device = row.original;
          const routing = hook.getDeviceRouting(device.deviceID);

          if (!routing) {
            return null;
          }

          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hook.handleRemove(routing.id)}
              disabled={loading}
              className="gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              Remove
            </Button>
          );
        },
        size: 100,
        enableSorting: false,
      },
    ],
    [hook, loading]
  );

  return (
    <div className={className}>
      {/* Summary Stats */}
      {showSummary && (
        <div className="mb-6 grid grid-cols-4 gap-component-md">
          <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-4 sm:p-6 shadow-[var(--semantic-shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matrix.summary.totalDevices}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-4 sm:p-6 shadow-[var(--semantic-shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Routed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {matrix.summary.routedDevices}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-4 sm:p-6 shadow-[var(--semantic-shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Unrouted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {matrix.summary.unroutedDevices}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-4 sm:p-6 shadow-[var(--semantic-shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Active Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {matrix.summary.activeInterfaces}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <Input
          type="search"
          placeholder="Search devices (name, IP, MAC)..."
          value={hook.filters.search}
          onChange={(e) => hook.setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={hook.filters.routingStatus}
          onValueChange={(value) =>
            hook.setRoutingStatus(value as 'all' | 'routed' | 'unrouted')
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="routed">Routed Only</SelectItem>
            <SelectItem value="unrouted">Unrouted Only</SelectItem>
          </SelectContent>
        </Select>
        {hook.filters.serviceFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => hook.setServiceFilter(undefined)}
          >
            Clear Service Filter
          </Button>
        )}
        {(hook.filters.search || hook.filters.routingStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={hook.clearFilters}
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {hook.selectionCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-[var(--semantic-radius-card)] border border-border bg-muted p-3">
          <span className="text-sm font-medium">
            {hook.selectionCount} device(s) selected
          </span>
          <Select
            onValueChange={(value) => {
              if (value) {
                hook.handleBulkAssign(value);
              }
            }}
            disabled={!hook.canBulkAssign || loading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Bulk assign to service" />
            </SelectTrigger>
            <SelectContent>
              {hook.availableInterfaces.map((iface) => (
                <SelectItem key={iface.id} value={iface.id}>
                  {iface.instanceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={hook.clearSelection}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-[var(--semantic-radius-card)] border border-error bg-error/10 p-3 text-sm text-error">
          {error.message}
        </div>
      )}

      {/* Virtualized Table */}
      <VirtualizedTable
        data={hook.filteredDevices}
        columns={columns}
        height="calc(100vh - 400px)"
        estimateRowHeight={48}
        enableSorting
        loading={loading}
        emptyContent={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        }
        getRowId={(row) => row.deviceID}
        stickyHeader
        headerHeight={48}
        className="rounded-[var(--semantic-radius-card)] border border-border"
      />
    </div>
  );
}

export const DeviceRoutingMatrixDesktop = memo(DeviceRoutingMatrixDesktopComponent);
DeviceRoutingMatrixDesktop.displayName = 'DeviceRoutingMatrixDesktop';
