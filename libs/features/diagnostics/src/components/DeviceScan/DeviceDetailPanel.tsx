// =============================================================================
// DeviceDetailPanel Component
// =============================================================================
// Display detailed information for a selected device with option to add to
// known devices list

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
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}

/**
 * Format lease expiration time
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

export function DeviceDetailPanel({
  device,
  onClose,
  routerId,
  className,
}: DeviceDetailPanelProps) {
  // TODO: Re-enable when KnownDeviceInput is added to schema
  // const [addKnownDevice, { loading: isAdding }] = useMutation(ADD_KNOWN_DEVICE);
  const isAdding = false; // Temporary placeholder

  const handleAddToKnownDevices = async () => {
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
  };

  return (
    <Card className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            {device.hostname || 'Unknown Device'}
          </h3>
          <p className="text-sm text-muted-foreground font-mono">{device.ip}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close device details"
        >
          ×
        </Button>
      </div>

      {/* Device Information */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">MAC Address</p>
          <p className="text-sm font-mono">{device.mac}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Vendor</p>
          <p className="text-sm">
            {device.vendor || (
              <span className="text-muted-foreground">Unknown vendor</span>
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Interface</p>
          <p className="text-sm font-mono">{device.interface}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Response Time</p>
          <p className="text-sm">{device.responseTime}ms</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">First Seen</p>
          <p className="text-sm">{formatDate(device.firstSeen)}</p>
        </div>
      </div>

      {/* DHCP Lease Information */}
      {device.dhcpLease && (
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">DHCP Lease</Badge>
            <Badge variant="secondary">
              {device.dhcpLease.status}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Expires In</p>
            <p className="text-sm">{formatLeaseExpires(device.dhcpLease.expires)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">DHCP Server</p>
            <p className="text-sm font-mono">{device.dhcpLease.server}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleAddToKnownDevices}
          disabled={!routerId || isAdding}
          className="w-full"
          size="sm"
        >
          {isAdding ? 'Adding...' : 'Add to Known Devices'}
        </Button>
      </div>
    </Card>
  );
}
