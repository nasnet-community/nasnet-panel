/**
 * DeviceTypeIcon Component
 *
 * Displays device type icon with category-based coloring for DHCP fingerprinting.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 *
 * @module @nasnet/features/network/dhcp/components/device-type-icon
 */
import * as React from 'react';
import type { FingerprintDeviceType, FingerprintDeviceCategory } from '@nasnet/core/types';
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
export declare const DeviceTypeIcon: React.NamedExoticComponent<DeviceTypeIconProps>;
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
export declare function formatDeviceType(type: FingerprintDeviceType): string;
//# sourceMappingURL=device-type-icon.d.ts.map