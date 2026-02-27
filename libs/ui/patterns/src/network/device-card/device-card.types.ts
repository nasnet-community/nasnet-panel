/**
 * Device Card Types
 *
 * TypeScript interfaces for the DeviceCard pattern component.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Device type classification
 * Used for icon selection and vendor-based inference
 */
export type DeviceType = 'computer' | 'phone' | 'tablet' | 'iot' | 'printer' | 'gaming' | 'unknown';

/**
 * Connection type for network devices
 */
export type ConnectionType = 'wired' | 'wireless';

/**
 * Device status for UI rendering
 */
export type DeviceStatus = 'online' | 'offline' | 'pending';

/**
 * Discovered device data structure
 * Represents a network device found via DHCP, ARP, or manual entry
 */
export interface DiscoveredDevice {
  /** Unique identifier for the device */
  id: string;
  /** MAC address (primary identifier) */
  mac: string;
  /** IP address (may be undefined for offline devices) */
  ip?: string;
  /** Hostname from DHCP or mDNS */
  hostname?: string;
  /** Vendor name from OUI lookup */
  vendor?: string;
  /** Inferred device type */
  deviceType: DeviceType;
  /** Confidence percentage for auto-detected type (0-100) */
  deviceTypeConfidence?: number;
  /** Wired or wireless connection */
  connectionType: ConnectionType;
  /** Current online status */
  online: boolean;
  /** First discovery timestamp */
  firstSeen: Date;
  /** Last seen timestamp */
  lastSeen: Date;
  /** User-assigned friendly name */
  customName?: string;
  /** Assigned static IP (if configured) */
  staticIp?: string;
  /** Signal strength in dBm (wireless only) */
  signalStrength?: number;
}

/**
 * Props for the DeviceCard component
 */
export interface DeviceCardProps {
  /** The device to display */
  device: DiscoveredDevice;
  /** Callback when device configuration is requested */
  onConfigure?: (device: DiscoveredDevice) => void;
  /** Callback when device block is requested */
  onBlock?: (device: DiscoveredDevice) => void;
  /** Callback when device is renamed */
  onRename?: (device: DiscoveredDevice, newName: string) => void;
  /** Callback when static IP is assigned */
  onAssignStaticIp?: (device: DiscoveredDevice, ip: string) => void;
  /** Enable compact mode for sidebar/widget usage */
  compact?: boolean;
  /** Show action buttons (default: true) */
  showActions?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Unique ID for accessibility */
  id?: string;
  /** Whether the card is selected/active */
  isSelected?: boolean;
  /** Click handler for card selection */
  onClick?: (device: DiscoveredDevice) => void;
}

/**
 * Configuration for the useDeviceCard headless hook
 */
export interface UseDeviceCardConfig {
  /** The device to process */
  device: DiscoveredDevice;
  /** Callback when device configuration is requested */
  onConfigure?: (device: DiscoveredDevice) => void;
  /** Callback when device block is requested */
  onBlock?: (device: DiscoveredDevice) => void;
  /** Callback when device is renamed */
  onRename?: (device: DiscoveredDevice, newName: string) => void;
  /** Callback when static IP is assigned */
  onAssignStaticIp?: (device: DiscoveredDevice, ip: string) => void;
}

/**
 * Return value from the useDeviceCard headless hook
 * Contains all computed state for presenters
 */
export interface UseDeviceCardReturn {
  /** Display name (customName > hostname > formatted MAC) */
  displayName: string;
  /** Lucide icon component for device type */
  deviceIcon: LucideIcon;
  /** Semantic status color name */
  statusColor: 'success' | 'muted' | 'warning';
  /** Whether device is currently online */
  isOnline: boolean;
  /** Vendor name from OUI lookup */
  vendorName: string | undefined;
  /** Device type confidence percentage */
  deviceTypeConfidence: number | undefined;
  /** Whether to show confidence indicator (confidence < 90%) */
  showConfidenceIndicator: boolean;
  /** Lucide icon component for connection type */
  connectionIcon: LucideIcon;
  /** Handler for configure action */
  handleConfigure: () => void;
  /** Handler for block action */
  handleBlock: () => void;
  /** Handler for rename action */
  handleRename: (newName: string) => void;
  /** Handler for static IP assignment */
  handleAssignStaticIp: (ip: string) => void;
  /** Accessible ARIA label */
  ariaLabel: string;
  /** Formatted MAC address for display */
  formattedMac: string;
  /** Status text (Online/Offline/Pending) */
  statusText: string;
  /** Connection type text (Wired/Wireless) */
  connectionText: string;
  /** Device type label for display */
  deviceTypeLabel: string;
}

/**
 * Props for platform-specific presenters
 */
export interface DeviceCardPresenterProps {
  /** Computed state from useDeviceCard hook */
  state: UseDeviceCardReturn;
  /** The device data */
  device: DiscoveredDevice;
  /** Enable compact mode */
  compact?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Unique ID for accessibility */
  id?: string;
  /** Whether the card is selected/active */
  isSelected?: boolean;
  /** Click handler for card */
  onClick?: () => void;
  /** Callback when device is renamed */
  onRename?: (newName: string) => void;
  /** Callback when static IP is assigned */
  onAssignStaticIp?: (ip: string) => void;
}

/**
 * Props for the base visual component (shared by all presenters)
 */
export interface DeviceCardBaseProps {
  /** Device icon component */
  icon: LucideIcon;
  /** Display name */
  name: string;
  /** IP address (optional) */
  ip?: string;
  /** Vendor name (optional) */
  vendor?: string;
  /** MAC address (formatted) */
  mac: string;
  /** Online status */
  isOnline: boolean;
  /** Status color */
  statusColor: 'success' | 'muted' | 'warning';
  /** Connection type icon */
  connectionIcon: LucideIcon;
  /** Connection type text */
  connectionText: string;
  /** Show confidence indicator */
  showConfidenceIndicator?: boolean;
  /** Device type confidence */
  confidence?: number;
  /** Enable compact mode */
  compact?: boolean;
  /** ARIA label */
  ariaLabel: string;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Children for additional content */
  children?: React.ReactNode;
}
