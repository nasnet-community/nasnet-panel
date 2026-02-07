/**
 * Device Type Detection Utility
 * Infers device type from hostname and MAC vendor information
 *
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 * @module @nasnet/core/utils/device/deviceTypeDetection
 */

import { DeviceType } from '@nasnet/core/types';

/**
 * Hostname pattern matching for device type detection
 * Ordered by specificity (most specific patterns first)
 */
const HOSTNAME_PATTERNS: [RegExp, DeviceType][] = [
  // Smartphones
  [/iphone/i, DeviceType.SMARTPHONE],
  [/android|galaxy|pixel|oneplus|huawei|xiaomi|redmi|oppo|vivo/i, DeviceType.SMARTPHONE],

  // Tablets
  [/ipad/i, DeviceType.TABLET],
  [/tablet|tab-|kindle/i, DeviceType.TABLET],

  // Laptops
  [/macbook|mbp|mba|mac-?book/i, DeviceType.LAPTOP],
  [/surface|thinkpad|xps|latitude|ideapad|zenbook|pavilion|inspiron|elitebook/i, DeviceType.LAPTOP],
  [/laptop/i, DeviceType.LAPTOP],

  // Desktops
  [/imac|mac-?mini|mac-?pro|mac-?studio/i, DeviceType.DESKTOP],
  [/desktop|pc-|workstation|optiplex/i, DeviceType.DESKTOP],

  // Printers
  [/printer|epson|hp-|canon|brother|xerox|laserjet/i, DeviceType.PRINTER],

  // Smart TVs and Media Devices
  [/roku|fire-?tv|apple-?tv|chromecast|shield|smart-?tv|lg-tv|samsung-tv/i, DeviceType.TV],

  // Gaming Consoles
  [/playstation|ps[3456]|xbox|nintendo|switch|steam-?deck/i, DeviceType.GAMING_CONSOLE],

  // IoT Devices
  [/esp|tasmota|shelly|sonoff|tuya|smart-?plug|nest|ring|hue|philips-hue|wemo/i, DeviceType.IOT],
  [/iot|sensor|smart-?home|alexa|echo|google-?home/i, DeviceType.IOT],

  // Routers and Network Equipment
  [/mikrotik|router|gateway|ubiquiti|unifi|netgear|asus-rt|tp-?link|linksys/i, DeviceType.ROUTER],
  [/access-?point|ap-|switch/i, DeviceType.ROUTER],
];

/**
 * Vendor hints for device type classification
 * Used as fallback when hostname doesn't match patterns
 */
const VENDOR_HINTS: Record<string, DeviceType> = {
  // Smartphones (most common)
  'Apple': DeviceType.SMARTPHONE,
  'Samsung Electronics': DeviceType.SMARTPHONE,
  'Google': DeviceType.SMARTPHONE,
  'Xiaomi': DeviceType.SMARTPHONE,
  'OnePlus': DeviceType.SMARTPHONE,
  'Huawei': DeviceType.SMARTPHONE,
  'OPPO': DeviceType.SMARTPHONE,

  // IoT Devices
  'Espressif': DeviceType.IOT,
  'Raspberry Pi': DeviceType.IOT,
  'Shelly': DeviceType.IOT,

  // Computers
  'Microsoft': DeviceType.DESKTOP,
  'Dell': DeviceType.LAPTOP,
  'Lenovo': DeviceType.LAPTOP,
  'HP': DeviceType.LAPTOP,
  'Asus': DeviceType.LAPTOP,

  // TVs
  'Sony': DeviceType.TV,
  'LG Electronics': DeviceType.TV,
  'Samsung': DeviceType.TV,
  'TCL': DeviceType.TV,
  'Vizio': DeviceType.TV,

  // Printers
  'Hewlett Packard': DeviceType.PRINTER,
  'Canon': DeviceType.PRINTER,
  'Epson': DeviceType.PRINTER,
  'Brother': DeviceType.PRINTER,
  'Xerox': DeviceType.PRINTER,

  // Routers
  'Ubiquiti': DeviceType.ROUTER,
  'MikroTik': DeviceType.ROUTER,
  'TP-Link': DeviceType.ROUTER,
  'Netgear': DeviceType.ROUTER,
  'D-Link': DeviceType.ROUTER,
};

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
export function detectDeviceType(
  hostname: string | null | undefined,
  vendor: string | null | undefined
): DeviceType {
  // 1. Try hostname pattern match (most reliable)
  if (hostname) {
    for (const [pattern, type] of HOSTNAME_PATTERNS) {
      if (pattern.test(hostname)) {
        return type;
      }
    }
  }

  // 2. Fall back to vendor hint
  if (vendor) {
    for (const [vendorName, type] of Object.entries(VENDOR_HINTS)) {
      if (vendor.includes(vendorName)) {
        return type;
      }
    }
  }

  // 3. No match found
  return DeviceType.UNKNOWN;
}

/**
 * Map device types to Lucide React icon names
 * Icons must be imported from lucide-react package
 */
export const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  [DeviceType.SMARTPHONE]: 'Smartphone',
  [DeviceType.TABLET]: 'Tablet',
  [DeviceType.LAPTOP]: 'Laptop',
  [DeviceType.DESKTOP]: 'Monitor',
  [DeviceType.ROUTER]: 'Router',
  [DeviceType.IOT]: 'Cpu',
  [DeviceType.PRINTER]: 'Printer',
  [DeviceType.TV]: 'Tv',
  [DeviceType.GAMING_CONSOLE]: 'Gamepad2',
  [DeviceType.UNKNOWN]: 'HelpCircle',
};

/**
 * Human-readable labels for device types
 * Used in UI tooltips and labels
 */
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  [DeviceType.SMARTPHONE]: 'Smartphone',
  [DeviceType.TABLET]: 'Tablet',
  [DeviceType.LAPTOP]: 'Laptop',
  [DeviceType.DESKTOP]: 'Desktop',
  [DeviceType.ROUTER]: 'Router',
  [DeviceType.IOT]: 'IoT Device',
  [DeviceType.PRINTER]: 'Printer',
  [DeviceType.TV]: 'TV / Media',
  [DeviceType.GAMING_CONSOLE]: 'Gaming Console',
  [DeviceType.UNKNOWN]: 'Unknown',
};
