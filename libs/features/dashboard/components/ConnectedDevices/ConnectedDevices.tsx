/**
 * ConnectedDevices Dashboard Widget
 *
 * Displays DHCP leases as connected devices with device type detection.
 * Part of Dashboard Monitoring (Epic 5, Story 5.4).
 *
 * @module @nasnet/features/dashboard/components/ConnectedDevices
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */

import * as React from 'react';
import { useState } from 'react';

import {
  cn,
  Card,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@nasnet/ui/primitives';
import { EmptyState, DeviceListItem, StaleIndicator } from '@nasnet/ui/patterns';
import { AlertTriangle, Laptop, WifiOff, MoreVertical, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useUIStore } from '@nasnet/state/stores';

import { useConnectedDevices } from '../../hooks/useConnectedDevices';

/**
 * Props for ConnectedDevices widget
 */
export interface ConnectedDevicesProps {
  /** Router IP address */
  routerIp: string;

  /** Sort order */
  sortBy?: 'hostname' | 'ip' | 'duration' | 'recent';

  /** Custom className */
  className?: string;
}

/**
 * ConnectedDevices Widget Component
 *
 * Features:
 * - Real-time DHCP lease monitoring
 * - Device type detection with icons
 * - "New" device indicators
 * - Privacy mode with hostname masking
 * - Empty state handling
 * - DHCP disabled warning
 * - Offline/stale state indicator
 * - Platform-responsive (mobile/tablet/desktop)
 *
 * @example
 * ```tsx
 * <ConnectedDevices
 *   routerIp="192.168.88.1"
 *   sortBy="recent"
 * />
 * ```
 */
export function ConnectedDevices({
  routerIp,
  sortBy = 'recent',
  className,
}: ConnectedDevicesProps) {
  const { devices, totalCount, isLoading, error, isDhcpEnabled, isEmpty, lastUpdated } =
    useConnectedDevices(routerIp, { sortBy });

  // Get privacy mode from store
  const hideHostnames = useUIStore((state) => state.hideHostnames);
  const toggleHideHostnames = useUIStore((state) => state.toggleHideHostnames);

  // Local state for manual refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // In a real implementation, this would trigger a refetch
    // For now, just simulate a refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('p-component-lg', className)}>
        <div className="space-y-component-lg">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-component-md">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="gap-component-md flex items-center"
              >
                <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
                <div className="space-y-component-sm flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('p-component-lg', className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load connected devices</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  // DHCP disabled state
  if (!isDhcpEnabled) {
    return (
      <Card className={cn('p-component-lg', className)}>
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>DHCP server is disabled</AlertTitle>
          <AlertDescription>Enable DHCP server to see connected devices.</AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <Card className={cn('p-component-lg', className)}>
        <EmptyState
          icon={Laptop}
          title="No devices connected"
          description="Devices will appear here when they connect to your network"
        />
      </Card>
    );
  }

  // Determine if data is stale (>2 minutes old)
  const isStale = lastUpdated ? Date.now() - lastUpdated.getTime() > 2 * 60 * 1000 : false;

  // Device list
  return (
    <Card className={cn('p-component-lg', className)}>
      {/* Header with actions */}
      <div className="mb-component-md flex items-center justify-between">
        <div className="flex-1">
          <div className="gap-component-sm flex items-center">
            <h2 className="font-display text-lg font-semibold">Connected Devices</h2>
            {hideHostnames && (
              <span className="bg-muted px-component-sm py-component-xs rounded-card-sm text-foreground text-xs">
                Privacy Mode
              </span>
            )}
          </div>
          <div className="gap-component-sm mt-component-xs flex items-center">
            <p className="text-muted-foreground text-sm">
              {totalCount} {totalCount === 1 ? 'device' : 'devices'} online
            </p>
            {lastUpdated && isStale && (
              <>
                <span className="text-muted-foreground">·</span>
                <StaleIndicator
                  isStale={isStale}
                  lastUpdated={lastUpdated}
                />
              </>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={toggleHideHostnames}>
              {hideHostnames ?
                <>
                  <Eye className="mr-component-sm h-4 w-4" />
                  Show Hostnames
                </>
              : <>
                  <EyeOff className="mr-component-sm h-4 w-4" />
                  Hide Hostnames
                </>
              }
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn('mr-component-sm h-4 w-4', isRefreshing && 'animate-spin')}
              />
              Refresh
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Device list */}
      <div className="space-y-component-sm">
        {devices.map((device) => (
          <DeviceListItem
            key={device.id}
            device={device}
            showHostname={!hideHostnames}
          />
        ))}
      </div>
    </Card>
  );
}
