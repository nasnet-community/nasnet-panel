/**
 * useDeviceCard Hook
 *
 * Headless hook for device card logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import { useMemo, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Cpu,
  Printer,
  Gamepad2,
  HelpCircle,
  Wifi,
  Cable,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type {
  UseDeviceCardConfig,
  UseDeviceCardReturn,
  DeviceType,
  ConnectionType,
} from './device-card.types';

/**
 * Confidence threshold for showing indicator
 * Show indicator when confidence is below this value
 */
const CONFIDENCE_THRESHOLD = 90;

/**
 * Device type to icon mapping
 */
const DEVICE_ICON_MAP: Record<DeviceType, LucideIcon> = {
  computer: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  iot: Cpu,
  printer: Printer,
  gaming: Gamepad2,
  unknown: HelpCircle,
};

/**
 * Connection type to icon mapping
 */
const CONNECTION_ICON_MAP: Record<ConnectionType, LucideIcon> = {
  wired: Cable,
  wireless: Wifi,
};

/**
 * Device type to human-readable label mapping
 */
const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  computer: 'Computer',
  phone: 'Phone',
  tablet: 'Tablet',
  iot: 'IoT Device',
  printer: 'Printer',
  gaming: 'Gaming Console',
  unknown: 'Unknown Device',
};

/**
 * Connection type to human-readable label mapping
 */
const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  wired: 'Wired',
  wireless: 'Wireless',
};

/**
 * Format MAC address for display
 * Ensures consistent formatting with colons
 */
function formatMacAddress(mac: string): string {
  // Normalize: remove separators, uppercase
  const normalized = mac.replace(/[:-]/g, '').toUpperCase();

  // Split into pairs and join with colons
  const pairs = normalized.match(/.{1,2}/g) || [];
  return pairs.join(':');
}

/**
 * Headless hook for device card component.
 *
 * Encapsulates all logic for:
 * - Display name resolution (customName > hostname > MAC)
 * - Device type icon selection
 * - Status color determination
 * - Connection type handling
 * - Action handlers
 * - ARIA label generation
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useDeviceCard({
 *   device: discoveredDevice,
 *   onConfigure: (device) => openConfigDialog(device),
 *   onBlock: (device) => blockDevice(device),
 *   onRename: (device, name) => renameDevice(device, name),
 * });
 *
 * // state.displayName === 'iPhone-John' (or hostname or MAC)
 * // state.deviceIcon === Smartphone
 * // state.isOnline === true
 * // state.statusColor === 'success'
 * ```
 */
export function useDeviceCard(
  config: UseDeviceCardConfig
): UseDeviceCardReturn {
  const { device, onConfigure, onBlock, onRename, onAssignStaticIp } = config;

  // Compute display name: customName > hostname > formatted MAC
  const displayName = useMemo(() => {
    if (device.customName) return device.customName;
    if (device.hostname) return device.hostname;
    return formatMacAddress(device.mac);
  }, [device.customName, device.hostname, device.mac]);

  // Format MAC address
  const formattedMac = useMemo(
    () => formatMacAddress(device.mac),
    [device.mac]
  );

  // Select device type icon
  const deviceIcon = useMemo(
    () => DEVICE_ICON_MAP[device.deviceType] || HelpCircle,
    [device.deviceType]
  );

  // Select connection type icon
  const connectionIcon = useMemo(
    () => CONNECTION_ICON_MAP[device.connectionType],
    [device.connectionType]
  );

  // Determine status color using semantic tokens
  const statusColor = useMemo<'success' | 'muted' | 'warning'>(() => {
    if (device.online) return 'success';
    return 'muted';
  }, [device.online]);

  // Status text
  const statusText = useMemo(
    () => (device.online ? 'Online' : 'Offline'),
    [device.online]
  );

  // Connection type text
  const connectionText = useMemo(
    () => CONNECTION_TYPE_LABELS[device.connectionType],
    [device.connectionType]
  );

  // Device type label
  const deviceTypeLabel = useMemo(
    () => DEVICE_TYPE_LABELS[device.deviceType],
    [device.deviceType]
  );

  // Determine if confidence indicator should be shown
  const showConfidenceIndicator = useMemo(() => {
    if (device.deviceTypeConfidence === undefined) return false;
    return device.deviceTypeConfidence < CONFIDENCE_THRESHOLD;
  }, [device.deviceTypeConfidence]);

  // Build accessible ARIA label
  const ariaLabel = useMemo(() => {
    const parts: string[] = [`Device ${displayName}`];
    parts.push(device.online ? 'online' : 'offline');
    parts.push(device.connectionType);

    if (device.ip) {
      parts.push(`IP ${device.ip}`);
    }

    if (device.vendor) {
      parts.push(device.vendor);
    }

    return parts.join(', ');
  }, [displayName, device.online, device.connectionType, device.ip, device.vendor]);

  // Action handlers
  const handleConfigure = useCallback(() => {
    onConfigure?.(device);
  }, [onConfigure, device]);

  const handleBlock = useCallback(() => {
    onBlock?.(device);
  }, [onBlock, device]);

  const handleRename = useCallback(
    (newName: string) => {
      onRename?.(device, newName);
    },
    [onRename, device]
  );

  const handleAssignStaticIp = useCallback(
    (ip: string) => {
      onAssignStaticIp?.(device, ip);
    },
    [onAssignStaticIp, device]
  );

  return {
    displayName,
    deviceIcon,
    statusColor,
    isOnline: device.online,
    vendorName: device.vendor,
    deviceTypeConfidence: device.deviceTypeConfidence,
    showConfidenceIndicator,
    connectionIcon,
    handleConfigure,
    handleBlock,
    handleRename,
    handleAssignStaticIp,
    ariaLabel,
    formattedMac,
    statusText,
    connectionText,
    deviceTypeLabel,
  };
}

/**
 * Export constants for testing and documentation
 */
export {
  DEVICE_ICON_MAP,
  CONNECTION_ICON_MAP,
  DEVICE_TYPE_LABELS,
  CONNECTION_TYPE_LABELS,
  CONFIDENCE_THRESHOLD,
  formatMacAddress,
};
