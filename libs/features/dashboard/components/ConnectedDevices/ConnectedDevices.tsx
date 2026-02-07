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
  const {
    devices,
    totalCount,
    isLoading,
    error,
    isDhcpEnabled,
    isEmpty,
    lastUpdated,
  } = useConnectedDevices(routerIp, { sortBy });

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
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
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
      <Card className={cn('p-6', className)}>
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
      <Card className={cn('p-6', className)}>
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>DHCP server is disabled</AlertTitle>
          <AlertDescription>
            Enable DHCP server to see connected devices.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <Card className={cn('p-6', className)}>
        <EmptyState
          icon={Laptop}
          title="No devices connected"
          description="Devices will appear here when they connect to your network"
        />
      </Card>
    );
  }

  // Determine if data is stale (>2 minutes old)
  const isStale = lastUpdated
    ? Date.now() - lastUpdated.getTime() > 2 * 60 * 1000
    : false;

  // Device list
  return (
    <Card className={cn('p-6', className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Connected Devices</h2>
            {hideHostnames && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                Privacy Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'device' : 'devices'} online
            </p>
            {lastUpdated && isStale && (
              <>
                <span className="text-muted-foreground">·</span>
                <StaleIndicator lastUpdated={lastUpdated} />
              </>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={toggleHideHostnames}>
              {hideHostnames ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Hostnames
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Hostnames
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw
                className={cn(
                  'h-4 w-4 mr-2',
                  isRefreshing && 'animate-spin'
                )}
              />
              Refresh
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Device list */}
      <div className="space-y-0">
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
