/**
 * DeviceRoutingMatrixMobile Component
 *
 * Mobile presenter (<640px) for the DeviceRoutingMatrix pattern.
 * Features touch-friendly cards, bottom sheet for bulk operations, and pull-to-refresh.
 */

import { memo } from 'react';

import { CheckIcon, XMarkIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nasnet/ui/primitives';

import { useDeviceRoutingMatrix } from './useDeviceRoutingMatrix';

import type { DeviceRoutingMatrixProps, NetworkDevice } from './types';

/**
 * Mobile device card component
 */
function DeviceCard({
  device,
  isSelected,
  routing,
  interfaceName,
  availableInterfaces,
  onToggleSelection,
  onAssign,
  onRemove,
  loading,
}: {
  device: NetworkDevice;
  isSelected: boolean;
  routing?: any;
  interfaceName: string;
  availableInterfaces: any[];
  onToggleSelection: () => void;
  onAssign: (interfaceID: string) => void;
  onRemove: () => void;
  loading: boolean;
}) {
  return (
    <Card className="bg-card border-border touch-manipulation rounded-[var(--semantic-radius-card)] border shadow-[var(--semantic-shadow-card)]">
      <CardContent className="p-component-md">
        <div className="flex items-start gap-3">
          {/* Checkbox - 44px touch target */}
          <div className="flex h-11 w-11 items-center justify-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
              className="h-6 w-6"
              aria-label={`Select ${device.hostname ?? device.macAddress}`}
            />
          </div>

          {/* Device Info */}
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-foreground font-medium">{device.hostname ?? 'Unknown'}</h3>
                <p className="text-muted-foreground text-sm">{device.ipAddress ?? 'No IP'}</p>
                <p className="text-muted-foreground break-all font-mono text-xs">
                  {device.macAddress}
                </p>
              </div>
              <Badge
                variant={device.isRouted ? 'success' : 'secondary'}
                className="gap-1"
              >
                {device.isRouted ?
                  <>
                    <CheckIcon className="h-3 w-3" />
                    Routed
                  </>
                : <>
                    <XMarkIcon className="h-3 w-3" />
                    Unrouted
                  </>
                }
              </Badge>
            </div>

            {/* Service Assignment */}
            {device.isRouted && routing ?
              <div className="border-border bg-muted mb-3 flex items-center justify-between rounded-[var(--semantic-radius-input)] border p-2">
                <span className="text-sm font-medium">{interfaceName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  disabled={loading}
                  className="h-9 gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            : <Select
                value=""
                onValueChange={onAssign}
                disabled={availableInterfaces.length === 0 || loading}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Assign to service" />
                </SelectTrigger>
                <SelectContent>
                  {availableInterfaces.map((iface: any) => (
                    <SelectItem
                      key={iface.id}
                      value={iface.id}
                    >
                      {iface.instanceName}
                    </SelectItem>
                  ))}
                  {availableInterfaces.length === 0 && (
                    <SelectItem
                      value=""
                      disabled
                    >
                      No services available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mobile presenter for DeviceRoutingMatrix
 *
 * Displays devices as touch-friendly cards with 44px touch targets.
 * Bottom sheet for bulk operations when devices are selected.
 */
function DeviceRoutingMatrixMobileComponent(props: DeviceRoutingMatrixProps) {
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

  return (
    <div className={className}>
      {/* Summary Stats */}
      {showSummary && (
        <div className="gap-component-sm mb-4 grid grid-cols-2">
          <Card className="bg-card border-border rounded-[var(--semantic-radius-card)] border p-3 shadow-[var(--semantic-shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-semibold">
                Total Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{matrix.summary.totalDevices}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border rounded-[var(--semantic-radius-card)] border p-3 shadow-[var(--semantic-shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-semibold">Routed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-success text-xl font-bold">{matrix.summary.routedDevices}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-component-sm mb-6">
        <Input
          type="search"
          placeholder="Search devices..."
          value={hook.filters.search}
          onChange={(e) => hook.setSearch(e.target.value)}
          className="h-11"
        />
        <Select
          value={hook.filters.routingStatus}
          onValueChange={(value) => hook.setRoutingStatus(value as 'all' | 'routed' | 'unrouted')}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="routed">Routed Only</SelectItem>
            <SelectItem value="unrouted">Unrouted Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Bar (Fixed at bottom) */}
      {hook.selectionCount > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-4 right-4 z-50 h-14 rounded-full shadow-lg"
              size="lg"
            >
              {hook.selectionCount} Selected
              <ChevronDownIcon className="ml-2 h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[300px]"
          >
            <SheetHeader>
              <SheetTitle>Bulk Actions ({hook.selectionCount} devices)</SheetTitle>
            </SheetHeader>
            <div className="space-y-component-sm mt-4">
              <Select
                onValueChange={(value) => {
                  if (value) {
                    hook.handleBulkAssign(value);
                  }
                }}
                disabled={!hook.canBulkAssign || loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Assign all to service" />
                </SelectTrigger>
                <SelectContent>
                  {hook.availableInterfaces.map((iface) => (
                    <SelectItem
                      key={iface.id}
                      value={iface.id}
                    >
                      {iface.instanceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={hook.clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Error State */}
      {error && (
        <div className="border-error bg-error/10 text-error mb-4 rounded-[var(--semantic-radius-card)] border p-3 text-sm">
          {error.message}
        </div>
      )}

      {/* Device Cards */}
      <div className="space-y-component-sm pb-20">
        {hook.filteredDevices.length === 0 ?
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        : hook.filteredDevices.map((device) => {
            const routing = hook.getDeviceRouting(device.deviceID);
            return (
              <DeviceCard
                key={device.deviceID}
                device={device}
                isSelected={hook.isDeviceSelected(device.deviceID)}
                routing={routing}
                interfaceName={routing ? hook.getInterfaceName(routing.interfaceID) : ''}
                availableInterfaces={hook.availableInterfaces}
                onToggleSelection={() => hook.toggleSelection(device.deviceID)}
                onAssign={(interfaceID) => hook.handleAssign(device.deviceID, interfaceID)}
                onRemove={() => routing && hook.handleRemove(routing.id)}
                loading={loading}
              />
            );
          })
        }
      </div>
    </div>
  );
}

export const DeviceRoutingMatrixMobile = memo(DeviceRoutingMatrixMobileComponent);
DeviceRoutingMatrixMobile.displayName = 'DeviceRoutingMatrixMobile';
