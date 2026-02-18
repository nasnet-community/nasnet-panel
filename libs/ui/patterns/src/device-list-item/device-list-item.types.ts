/**
 * Device List Item Types
 *
 * TypeScript interfaces for the DeviceListItem pattern component.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */

import type { ConnectedDeviceEnriched } from '@nasnet/core/types';

import type { LucideIcon } from 'lucide-react';

/**
 * Props for the DeviceListItem component
 */
export interface DeviceListItemProps {
  /** The connected device to display */
  device: ConnectedDeviceEnriched;

  /** Whether to show hostname (false for privacy mode) */
  showHostname?: boolean;

  /** Click handler for list item */
  onClick?: (device: ConnectedDeviceEnriched) => void;

  /** Additional CSS classes */
  className?: string;

  /** Unique ID for accessibility */
  id?: string;
}

/**
 * Configuration for the useDeviceListItem headless hook
 */
export interface UseDeviceListItemConfig {
  /** The device to process */
  device: ConnectedDeviceEnriched;

  /** Whether to show hostname */
  showHostname?: boolean;
}

/**
 * Return value from the useDeviceListItem headless hook
 * Contains all computed state for presenters
 */
export interface UseDeviceListItemReturn {
  /** Display name (hostname or masked) */
  displayName: string;

  /** Lucide icon component for device type */
  deviceIcon: LucideIcon;

  /** Device type label for display */
  deviceTypeLabel: string;

  /** Whether device is newly connected */
  isNew: boolean;

  /** Connection duration text (e.g., "2h 15m") */
  connectionDuration: string;

  /** IP address */
  ipAddress: string;

  /** MAC address */
  macAddress: string;

  /** Vendor name from OUI lookup */
  vendor: string | null;

  /** Status label (e.g., "Connected") */
  statusLabel: string;

  /** Expiration text (e.g., "in 23h") */
  expiration: string;

  /** Whether this is a static lease */
  isStatic: boolean;

  /** Server name */
  server: string;

  /** Expanded state */
  isExpanded: boolean;

  /** Toggle expanded state */
  toggleExpanded: () => void;

  /** Accessible ARIA label */
  ariaLabel: string;
}

/**
 * Props for platform-specific presenters (Mobile, Tablet, Desktop)
 */
export interface DeviceListItemPresenterProps {
  /** Computed state from useDeviceListItem hook */
  state: UseDeviceListItemReturn;

  /** The device data */
  device: ConnectedDeviceEnriched;

  /** Click handler for list item */
  onClick?: () => void;

  /** Additional CSS classes */
  className?: string;

  /** Unique ID for accessibility */
  id?: string;
}
