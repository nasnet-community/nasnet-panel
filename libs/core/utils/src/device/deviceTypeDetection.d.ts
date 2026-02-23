/**
 * Device Type Detection Utility
 * Infers device type from hostname and MAC vendor information
 *
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 * @module @nasnet/core/utils/device/deviceTypeDetection
 */
import { DeviceType } from '@nasnet/core/types';
/**
 * Detect device type from hostname and vendor information
 *
 * Algorithm:
 * 1. Try hostname pattern matching (most reliable)
 * 2. Fall back to vendor hints
 * 3. Return UNKNOWN if no match found
 *
 * @param hostname - Device hostname (from DHCP)
 * @param vendor - MAC vendor name (from OUI lookup)
 * @returns Detected DeviceType
 *
 * @example
 * detectDeviceType('Johns-iPhone', 'Apple') // Returns DeviceType.SMARTPHONE
 * detectDeviceType('printer-hp-laserjet', null) // Returns DeviceType.PRINTER
 * detectDeviceType(null, 'Raspberry Pi') // Returns DeviceType.IOT
 */
export declare function detectDeviceType(hostname: string | null | undefined, vendor: string | null | undefined): DeviceType;
/**
 * Map device types to Lucide React icon names
 *
 * Provides a lookup table for icon names from lucide-react that correspond
 * to each device type. Use these names with the Lucide icon component.
 *
 * @example
 * ```ts
 * import { DEVICE_TYPE_ICONS } from '@nasnet/core/utils/device';
 * import { LucideIcon } from 'lucide-react';
 *
 * const iconName = DEVICE_TYPE_ICONS[DeviceType.SMARTPHONE]; // 'Smartphone'
 * ```
 *
 * @readonly
 */
export declare const DEVICE_TYPE_ICONS: {
    smartphone: string;
    tablet: string;
    laptop: string;
    desktop: string;
    router: string;
    iot: string;
    printer: string;
    tv: string;
    gaming_console: string;
    unknown: string;
};
/**
 * Human-readable labels for device types
 *
 * Provides localization-ready labels for each device type, suitable for
 * display in UI tooltips, labels, and status indicators.
 *
 * @example
 * ```ts
 * import { DEVICE_TYPE_LABELS } from '@nasnet/core/utils/device';
 *
 * const label = DEVICE_TYPE_LABELS[DeviceType.LAPTOP]; // 'Laptop'
 * ```
 *
 * @readonly
 */
export declare const DEVICE_TYPE_LABELS: {
    smartphone: string;
    tablet: string;
    laptop: string;
    desktop: string;
    router: string;
    iot: string;
    printer: string;
    tv: string;
    gaming_console: string;
    unknown: string;
};
//# sourceMappingURL=deviceTypeDetection.d.ts.map