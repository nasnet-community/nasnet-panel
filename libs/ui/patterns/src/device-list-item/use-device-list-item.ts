/**
 * useDeviceListItem Hook
 *
 * Headless hook for DeviceListItem pattern component.
 * Computes display state and provides action handlers.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */

import { useState, useMemo, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

import { DEVICE_TYPE_ICONS, DEVICE_TYPE_LABELS } from '@nasnet/core/utils';

import type {
  UseDeviceListItemConfig,
  UseDeviceListItemReturn,
} from './device-list-item.types';

/**
 * Headless hook for DeviceListItem component
 *
 * Computes all display state and UI logic without rendering anything.
 * Presenters consume this state to render platform-specific UI.
 *
 * @param config - Hook configuration
 * @returns Computed state and handlers
 */
export function useDeviceListItem(
  config: UseDeviceListItemConfig
): UseDeviceListItemReturn {
  const { device, showHostname = true } = config;

  // Expanded state for detail panel
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Compute display name
  const displayName = useMemo(() => {
    if (!showHostname) {
      // Privacy mode: mask hostname with Device-XXXX (last 4 MAC chars)
      const macSuffix = device.macAddress.replace(/:/g, '').slice(-4).toUpperCase();
      return `Device-${macSuffix}`;
    }
    return device.hostname;
  }, [device.hostname, device.macAddress, showHostname]);

  // Get device icon
  const deviceIcon = useMemo(() => {
    const iconName = DEVICE_TYPE_ICONS[device.deviceType];
    return (Icons[iconName as keyof typeof Icons] as LucideIcon) || Icons.HelpCircle;
  }, [device.deviceType]);

  // Get device type label
  const deviceTypeLabel = useMemo(() => {
    return DEVICE_TYPE_LABELS[device.deviceType];
  }, [device.deviceType]);

  // Construct accessible ARIA label
  const ariaLabel = useMemo(() => {
    const parts = [
      displayName,
      device.ipAddress,
      deviceTypeLabel,
      device.statusLabel,
    ];
    if (device.isNew) {
      parts.push('New device');
    }
    return parts.join(', ');
  }, [displayName, device.ipAddress, deviceTypeLabel, device.statusLabel, device.isNew]);

  return {
    displayName,
    deviceIcon,
    deviceTypeLabel,
    isNew: device.isNew,
    connectionDuration: device.connectionDuration,
    ipAddress: device.ipAddress,
    macAddress: device.macAddress,
    vendor: device.vendor,
    statusLabel: device.statusLabel,
    expiration: device.expiration,
    isStatic: device.isStatic,
    server: device._lease.server,
    isExpanded,
    toggleExpanded,
    ariaLabel,
  };
}
