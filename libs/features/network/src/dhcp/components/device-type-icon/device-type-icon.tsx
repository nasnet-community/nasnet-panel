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
} from 'lucide-react';

import {
  cn,
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
 * Icon component mapping for all 22 FingerprintDeviceType values
 */
const DEVICE_TYPE_ICONS: Record<FingerprintDeviceType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
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
 * Uses semantic color tokens for category accents
 */
const CATEGORY_COLORS: Record<FingerprintDeviceCategory, string> = {
  mobile: 'text-info',         // Blue
  computer: 'text-success',    // Green
  iot: 'text-warning',         // Amber
  network: 'text-primary',     // Golden Amber
  entertainment: 'text-accent', // Cyan
  other: 'text-muted-foreground', // Gray
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

  /** Called when icon is clicked */
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
export const DeviceTypeIcon = React.memo(function DeviceTypeIcon({
  deviceType,
  deviceCategory,
  confidence,
  className,
  showTooltip = true,
  onClick,
}: DeviceTypeIconProps) {
  const IconComponent = DEVICE_TYPE_ICONS[deviceType] || HelpCircle;
  const colorClass = CATEGORY_COLORS[deviceCategory] || 'text-muted-foreground';

  const iconElement = onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded',
        'cursor-pointer hover:opacity-75 transition-opacity',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
      aria-label={`View ${formatDeviceType(deviceType)} details`}
    >
      <IconComponent
        className={cn('h-5 w-5', colorClass, className)}
        aria-hidden="true"
      />
    </button>
  ) : (
    <IconComponent
      className={cn('h-5 w-5', colorClass, className)}
      aria-hidden={showTooltip ? 'true' : undefined}
    />
  );

  if (!showTooltip) {
    return iconElement;
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
            {iconElement}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

DeviceTypeIcon.displayName = 'DeviceTypeIcon';

/**
 * Format device type for human-readable display
 *
 * Converts kebab-case device types to Title Case labels.
 * Handles special cases like iOS, macOS with proper capitalization.
 *
 * @param type - FingerprintDeviceType to format
 * @returns Human-readable label for display
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
  const DEVICE_TYPE_LABELS: Record<FingerprintDeviceType, string> = {
    ios: 'iOS',
    android: 'Android',
    'other-mobile': 'Other Mobile',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    chromeos: 'ChromeOS',
    'smart-speaker': 'Smart Speaker',
    camera: 'Camera',
    thermostat: 'Thermostat',
    'other-iot': 'Other IoT',
    printer: 'Printer',
    nas: 'NAS',
    router: 'Router',
    switch: 'Switch',
    'gaming-console': 'Gaming Console',
    'smart-tv': 'Smart TV',
    'streaming-device': 'Streaming Device',
    generic: 'Generic Device',
    server: 'Server',
    appliance: 'Appliance',
    unknown: 'Unknown Device',
  };

  return DEVICE_TYPE_LABELS[type] || type;
}
