// =============================================================================
// DeviceDetailPanel Component
// =============================================================================
// Display detailed information for a selected device with option to add to
// known devices list

import React, { useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Button, Card, Badge } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { DiscoveredDevice } from './types';

// -----------------------------------------------------------------------------
// GraphQL Mutation
// -----------------------------------------------------------------------------

// TODO: Re-enable when KnownDeviceInput is added to schema
// const ADD_KNOWN_DEVICE = gql`
//   mutation AddKnownDevice($input: KnownDeviceInput!) {
//     addKnownDevice(input: $input) {
//       id
//       name
//       mac
//       }
//   }
// `;

// -----------------------------------------------------------------------------
// Props Interface
// -----------------------------------------------------------------------------

/**
 * Props for DeviceDetailPanel component
 */
export interface DeviceDetailPanelProps {
  /** Device to display details for */
  device: DiscoveredDevice;

  /** Callback when panel should close */
  onClose: () => void;

  /** Router ID for adding to known devices */
  routerId?: string | null;

  /** Optional CSS class name */
  className?: string;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format ISO date string to readable format
 * @param isoString - ISO 8601 date string
 * @returns Localized date/time string
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}

/**
 * Format lease expiration time as human-readable countdown
 * @param expiresString - ISO 8601 expiration date string
 * @returns Human-readable time remaining (e.g., "2d 5h", "30m")
 */
function formatLeaseExpires(expiresString: string): string {
  const expires = new Date(expiresString);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) {
    return 'Expired';
  } else if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * DeviceDetailPanel
 * Displays detailed information for a discovered device including IP, MAC,
 * vendor, interface, response time, and DHCP lease details. Provides option
 * to add device to known devices list.
 *
 * @example
 * ```tsx
 * <DeviceDetailPanel
 *   device={selectedDevice}
 *   onClose={() => setSelected(null)}
 *   routerId={routerId}
 * />
 * ```
 *
 * @see {@link DiscoveredDevice} for device structure
 * @see {@link DeviceDiscoveryTable} for table of devices
 */
export const DeviceDetailPanel = React.memo(function DeviceDetailPanel({
  device,
  onClose,
  routerId,
  className,
}: DeviceDetailPanelProps) {
  // TODO: Re-enable when KnownDeviceInput is added to schema
  // const [addKnownDevice, { loading: isAdding }] = useMutation(ADD_KNOWN_DEVICE);
  const isAdding = false; // Temporary placeholder

  /**
   * Handle adding device to known devices list
   * Currently disabled pending schema updates
   */
  const handleAddToKnownDevices = useCallback(async () => {
    if (!routerId) return;

    try {
      // TODO: Re-enable when KnownDeviceInput is added to schema
      // await addKnownDevice({
      //   variables: {
      //     input: {
      //       deviceId: routerId,
      //       mac: device.mac,
      //       name: device.hostname || device.ip,
      //       notes: `Added from device scan on ${formatDate(device.firstSeen)}`,
      //     },
      //   },
      // });
      console.warn('addKnownDevice mutation temporarily disabled');

      // TODO: Show success toast
      console.log('Device added to known devices');
    } catch (error) {
      console.error('Failed to add device:', error);
      // TODO: Show error toast
    }
  }, [routerId, device.mac, device.firstSeen, device.hostname, device.ip]);

  return (
    <Card className={cn('p-component-md space-y-component-md', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg font-display text-category-networking">
            {device.hostname || 'Unknown Device'}
          </h3>
          <p className="text-sm text-muted-foreground font-mono">{device.ip}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close device details panel"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          ×
        </Button>
      </div>

      {/* Device Information */}
      <div className="space-y-component-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">MAC Address</p>
          <p className="text-sm font-mono text-foreground">{device.mac}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Vendor</p>
          <p className="text-sm text-foreground">
            {device.vendor || (
              <span className="text-muted-foreground">Unknown vendor</span>
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Interface</p>
          <p className="text-sm font-mono text-foreground">{device.interface}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Response Time</p>
          <p className="text-sm text-foreground">{device.responseTime}ms</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">First Seen</p>
          <p className="text-sm text-foreground">{formatDate(device.firstSeen)}</p>
        </div>
      </div>

      {/* DHCP Lease Information */}
      {device.dhcpLease && (
        <div className="pt-component-md border-t border-border space-y-component-sm">
          <div className="flex items-center gap-component-sm">
            <Badge variant="default">DHCP Lease</Badge>
            <Badge variant="secondary">
              {device.dhcpLease.status}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Expires In</p>
            <p className="text-sm text-foreground">{formatLeaseExpires(device.dhcpLease.expires)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">DHCP Server</p>
            <p className="text-sm font-mono text-foreground">{device.dhcpLease.server}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-component-md border-t border-border">
        <Button
          onClick={handleAddToKnownDevices}
          disabled={!routerId || isAdding}
          className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          size="sm"
        >
          {isAdding ? 'Adding...' : 'Add to Known Devices'}
        </Button>
      </div>
    </Card>
  );
});

DeviceDetailPanel.displayName = 'DeviceDetailPanel';
