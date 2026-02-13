/**
 * DeviceTypeIcon Component
 *
 * Displays device type icon with category-based coloring for DHCP fingerprinting.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 *
 * @module @nasnet/features/network/dhcp/components/device-type-icon
 */

import * as React from 'react';
import {
  Smartphone,
  Monitor,
  Laptop,
  Speaker,
  Camera,
  Thermometer,
  Box,
  Printer,
  HardDrive,
  Router,
  Gamepad2,
  Tv,
  Server,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@nasnet/ui/primitives';

import type {
  FingerprintDeviceType,
  FingerprintDeviceCategory,
} from '@nasnet/core/types';

/**
 * Icon mapping for all 22 FingerprintDeviceType values
 */
const DEVICE_TYPE_ICONS: Record<FingerprintDeviceType, LucideIcon> = {
  // Phone/Tablet (3)
  ios: Smartphone,
  android: Smartphone,
  'other-mobile': Smartphone,

  // Computer (4)
  windows: Monitor,
  macos: Laptop,
  linux: Monitor,
  chromeos: Laptop,

  // IoT (4)
  'smart-speaker': Speaker,
  camera: Camera,
  thermostat: Thermometer,
  'other-iot': Box,

  // Network (4)
  printer: Printer,
  nas: HardDrive,
  router: Router,
  switch: Router,

  // Entertainment (3)
  'gaming-console': Gamepad2,
  'smart-tv': Tv,
  'streaming-device': Tv,

  // Other (3)
  generic: Box,
  server: Server,
  appliance: Box,
  unknown: HelpCircle,
};

/**
 * Category color mapping (6 categories)
 * Uses Tailwind color classes for text colors
 */
const CATEGORY_COLORS: Record<FingerprintDeviceCategory, string> = {
  mobile: 'text-blue-500',
  computer: 'text-green-500',
  iot: 'text-orange-500',
  network: 'text-purple-500',
  entertainment: 'text-pink-500',
  other: 'text-gray-500',
};

/**
 * Props for DeviceTypeIcon component
 */
export interface DeviceTypeIconProps {
  /** Device type from fingerprinting */
  deviceType: FingerprintDeviceType;

  /** Device category for color coding */
  deviceCategory: FingerprintDeviceCategory;

  /** Confidence percentage (0-100), shown in tooltip if provided */
  confidence?: number;

  /** Additional CSS classes */
  className?: string;

  /** Show tooltip with device type and confidence */
  showTooltip?: boolean;

  /** Click handler */
  onClick?: () => void;
}

/**
 * DeviceTypeIcon Component
 *
 * Displays the appropriate icon for a fingerprinted device type with
 * category-based color coding.
 *
 * @example
 * ```tsx
 * <DeviceTypeIcon
 *   deviceType="ios"
 *   deviceCategory="mobile"
 *   confidence={95}
 *   showTooltip
 * />
 * ```
 */
export function DeviceTypeIcon({
  deviceType,
  deviceCategory,
  confidence,
  className,
  showTooltip = true,
  onClick,
}: DeviceTypeIconProps) {
  const Icon = DEVICE_TYPE_ICONS[deviceType] || HelpCircle;
  const colorClass = CATEGORY_COLORS[deviceCategory] || 'text-gray-500';

  const icon = (
    <Icon
      className={cn(
        'h-5 w-5',
        colorClass,
        onClick && 'cursor-pointer hover:opacity-75 transition-opacity',
        className
      )}
      onClick={onClick}
      aria-hidden={showTooltip ? 'true' : undefined}
    />
  );

  if (!showTooltip) {
    return icon;
  }

  const label = formatDeviceType(deviceType);
  const tooltipContent = confidence !== undefined
    ? `${label} (${confidence}% confidence)`
    : label;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center" role="img" aria-label={tooltipContent}>
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Format device type for human-readable display
 *
 * Converts kebab-case device types to Title Case labels.
 *
 * @param type - FingerprintDeviceType to format
 * @returns Human-readable label
 *
 * @example
 * ```typescript
 * formatDeviceType('smart-speaker') // Returns "Smart Speaker"
 * formatDeviceType('ios') // Returns "iOS"
 * formatDeviceType('macos') // Returns "macOS"
 * ```
 */
export function formatDeviceType(type: FingerprintDeviceType): string {
  // Special cases for proper capitalization
  const specialCases: Record<string, string> = {
    ios: 'iOS',
    macos: 'macOS',
    chromeos: 'ChromeOS',
    nas: 'NAS',
  };

  if (specialCases[type]) {
    return specialCases[type];
  }

  // Convert kebab-case to Title Case
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
