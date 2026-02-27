# Device Detection Pipeline Guide

Cross-cutting guide for detecting connected device types from MAC addresses, hostnames, and vendor
information.

## Table of Contents

1. [Detection Flow Overview](#detection-flow-overview)
2. [Device Type Categories](#device-type-categories)
3. [OUI Database and MAC Vendor Lookup](#oui-database-and-mac-vendor-lookup)
4. [DHCP Fingerprinting](#dhcp-fingerprinting)
5. [Hostname Pattern Matching](#hostname-pattern-matching)
6. [Display Integration](#display-integration)
7. [Usage Examples](#usage-examples)

---

## Detection Flow Overview

The device detection pipeline identifies device types through a 3-tier algorithm:

```
┌─────────────────────────────────────────────────────────────┐
│                   DHCP Lease Received                       │
│         (hostname, MAC address, fingerprint)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  1. HOSTNAME PATTERN MATCHING    │
        │     (Most Reliable)              │
        │  • Check 50+ patterns            │
        │  • Return on first match         │
        └──────────────┬───────────────────┘
                       │
                  No Match?
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  2. MAC VENDOR LOOKUP            │
        │     (OUI Database)               │
        │  • Extract first 3 octets        │
        │  • Look up vendor in DB          │
        │  • Map vendor → device type      │
        └──────────────┬───────────────────┘
                       │
              No Vendor Match?
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  3. FALLBACK TO UNKNOWN          │
        │  • Used when nothing matched     │
        │  • Shows generic icon/label      │
        └──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │        DeviceType Result         │
        │  (SMARTPHONE, TV, PRINTER, etc.) │
        └──────────────────────────────────┘
```

**Key Principle:** Hostname patterns are most reliable (explicit user input), vendor hints are
fallback.

---

## Device Type Categories

### Complete Device Type Taxonomy

Located in `types/router/connected-device.ts`:

```typescript
export enum DeviceType {
  SMARTPHONE = 'smartphone', // Mobile phones
  TABLET = 'tablet', // iPads, Android tablets
  LAPTOP = 'laptop', // Laptops and ultrabooks
  DESKTOP = 'desktop', // Desktops and workstations
  PRINTER = 'printer', // Printers and scanners
  TV = 'tv', // Smart TVs and streaming devices
  GAMING_CONSOLE = 'gaming_console', // PS5, Xbox, Nintendo Switch
  IOT = 'iot', // IoT devices and sensors
  ROUTER = 'router', // Network equipment
  UNKNOWN = 'unknown', // Unidentified devices
}
```

### Device Type Characteristics

| Type               | Count    | Examples                 | Icon | Use Cases                        |
| ------------------ | -------- | ------------------------ | ---- | -------------------------------- |
| **Smartphone**     | 100-200+ | iPhone, Galaxy, Pixel    | 📱   | User devices, mobile access      |
| **Tablet**         | 5-20     | iPad, Tab S, Pixel Pad   | 📱   | Media consumption, sketching     |
| **Laptop**         | 5-50     | MacBook, ThinkPad, XPS   | 💻   | Work, development, remote access |
| **Desktop**        | 2-10     | iMac, Mac Mini, Optiplex | 🖥️   | Stationary workstations          |
| **Printer**        | 1-5      | HP LaserJet, Canon       | 🖨️   | Document handling                |
| **TV**             | 1-3      | Roku, Fire TV, Smart TV  | 📺   | Streaming and media              |
| **Gaming Console** | 1-5      | PS5, Xbox, Switch        | 🎮   | Gaming and streaming             |
| **IoT**            | 10-100+  | Shelly, Sonoff, Hue      | 🔌   | Home automation                  |
| **Router**         | 1-10     | MikroTik, UniFi, Netgear | 🌐   | Network infrastructure           |

---

## OUI Database and MAC Vendor Lookup

### OUI (Organizationally Unique Identifier)

Located in `utils/mac-vendor/oui-database.ts`:

```typescript
// OUI database contains ~350 common MAC prefixes
export const OUI_DATABASE = {
  '00:0F:E2': 'MikroTik',
  'AC:DE:48': 'Apple Inc.',
  '00:50:F2': 'Microsoft',
  '00:25:86': 'Apple Inc.',
  'F4:5E:AB': 'Samsung Electronics',
  // ... 350+ more entries
};
```

**Database Structure:**

- Keys: OUI in `XX:XX:XX` format (first 3 octets of MAC)
- Values: Vendor names
- Coverage: ~350 entries covering most common devices
- Format: Uppercase hex with colons

### MAC Address Formats Supported

```typescript
import { lookupVendor, isValidMac, formatMac } from '@nasnet/core/utils/mac-vendor';

// All these formats work:
lookupVendor('00:0F:E2:12:34:56'); // Colon-separated (standard)
lookupVendor('00-0F-E2-12-34-56'); // Dash-separated
lookupVendor('000FE2123456'); // No separator

// Validation
isValidMac('00:0F:E2:12:34:56'); // true
isValidMac('invalid'); // false

// Formatting to standard
formatMac('aabbccddeeff'); // => 'AA:BB:CC:DD:EE:FF'
formatMac('aa-bb-cc-dd-ee-ff'); // => 'AA:BB:CC:DD:EE:FF'
```

### Vendor Hint Mapping

Located in `utils/device/deviceTypeDetection.ts`:

```typescript
const VENDOR_HINTS = {
  // Smartphones (most common)
  Apple: DeviceType.SMARTPHONE,
  'Samsung Electronics': DeviceType.SMARTPHONE,
  Google: DeviceType.SMARTPHONE,
  Xiaomi: DeviceType.SMARTPHONE,
  OnePlus: DeviceType.SMARTPHONE,

  // Computers
  Microsoft: DeviceType.DESKTOP,
  Dell: DeviceType.LAPTOP,
  Lenovo: DeviceType.LAPTOP,

  // Network Equipment
  MikroTik: DeviceType.ROUTER,
  Ubiquiti: DeviceType.ROUTER,
  'TP-Link': DeviceType.ROUTER,
};
```

**Vendor Matching:** Case-insensitive substring match

```typescript
// "Samsung Electronics Co., Ltd." includes "Samsung" → SMARTPHONE
if (vendor.includes(vendorName)) {
  return type;
}
```

---

## DHCP Fingerprinting

### DHCP Fingerprint Types

Located in `types/router/connected-device.ts`:

```typescript
export interface ConnectedDevice {
  // ... other fields
  dhcpFingerprint?: string; // DHCP fingerprint from client
  hostname?: string; // DHCP hostname
}

// DHCP fingerprints help identify OS
// Examples:
// - "1,3,6,15,31,33,40,41,42,43,44,46,47,..."
// - Different for Windows vs macOS vs iOS vs Android
```

**Fingerprint Format:** Comma-separated DHCP option codes

- Unique per OS family (Windows, macOS, iOS, Android, Linux)
- Allows distinguishing device OS even without hostname
- Used as secondary detection method

---

## Hostname Pattern Matching

### Hostname Pattern Database

Located in `utils/device/deviceTypeDetection.ts`:

```typescript
const HOSTNAME_PATTERNS: Array<[RegExp, DeviceType]> = [
  // Smartphones (most specific first)
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

  // TVs and Media
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
```

**Pattern Characteristics:**

- Case-insensitive (`/i` flag)
- Ordered by specificity (most specific patterns first)
- Loose matching with wildcards (`|` for alternatives)
- Supports brand names and model identifiers

### Real Hostname Examples

```typescript
// Smartphones
"Johns-iPhone"           → SMARTPHONE
"samsung-galaxy-s24"     → SMARTPHONE
"google-pixel-8-pro"     → SMARTPHONE
"oneplus-12"             → SMARTPHONE

// Tablets
"iPad-Air"               → TABLET
"Samsung-Galaxy-Tab-S9"  → TABLET

// Laptops
"macbook-pro"            → LAPTOP
"ThinkPad-X1"            → LAPTOP
"Dell-XPS-15"            → LAPTOP

// Desktops
"iMac-Office"            → DESKTOP
"workstation-01"         → DESKTOP

// Printers
"HP-LaserJet-M404"       → PRINTER
"canon-pixma"            → PRINTER

// Smart Devices
"Shelly-Plug-1"          → IOT
"Philips-Hue-Bridge"     → IOT
"smart-thermostat"       → IOT

// Network Equipment
"MikroTik-Router-OS"     → ROUTER
"Ubiquiti-UniFi-AP"      → ROUTER

// Unrecognized
"unknown-device"         → UNKNOWN
"192-168-1-100"          → UNKNOWN
```

---

## Display Integration

### Icon Mapping

Located in `utils/device/deviceTypeDetection.ts`:

```typescript
export const DEVICE_TYPE_ICONS = {
  [DeviceType.SMARTPHONE]: 'Smartphone',      // Lucide icon name
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

// Usage in React component
import { LucideIcon, Smartphone, Router } from 'lucide-react';

function DeviceIcon({ type }: { type: DeviceType }) {
  const iconName = DEVICE_TYPE_ICONS[type];
  const IconComponent = lucideIcons[iconName] as LucideIcon;
  return <IconComponent className="w-5 h-5" />;
}
```

### Label Mapping

```typescript
export const DEVICE_TYPE_LABELS = {
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
```

### Component Usage

```tsx
import { DeviceType } from '@nasnet/core/types';
import { detectDeviceType, DEVICE_TYPE_ICONS, DEVICE_TYPE_LABELS } from '@nasnet/core/utils/device';

export function ConnectedDeviceCard({ hostname, macAddress, vendor }) {
  const deviceType = detectDeviceType(hostname, vendor);
  const icon = DEVICE_TYPE_ICONS[deviceType];
  const label = DEVICE_TYPE_LABELS[deviceType];

  return (
    <div className="flex items-center gap-2">
      <LucideIcon
        name={icon}
        className="h-5 w-5"
      />
      <div>
        <p className="font-semibold">{hostname || macAddress}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
```

---

## Usage Examples

### Example 1: Detecting Device Type from DHCP Lease

```typescript
import { detectDeviceType } from '@nasnet/core/utils/device';

// Scenario: New device connects to DHCP
const lease = {
  hostname: 'Johns-iPhone',
  macAddress: 'AC:DE:48:12:34:56',
  vendorClass: 'iPhone OS',
};

const vendor = lookupVendor(lease.macAddress); // "Apple Inc."
const deviceType = detectDeviceType(lease.hostname, vendor);
// => DeviceType.SMARTPHONE
```

### Example 2: Batch Device Detection

```typescript
import { detectDeviceType } from '@nasnet/core/utils/device';

const dhcpLeases = [
  { hostname: 'desktop-01', mac: 'AA:BB:CC:DD:EE:01' },
  { hostname: 'printer-hp', mac: 'AA:BB:CC:DD:EE:02' },
  { hostname: null, mac: 'AA:BB:CC:DD:EE:03' }, // Unknown
  { hostname: 'Samsung-Galaxy', mac: 'F4:5E:AB:12:34:56' },
];

const detectedDevices = dhcpLeases.map((lease) => {
  const vendor = lookupVendor(lease.mac);
  const type = detectDeviceType(lease.hostname, vendor);
  return {
    ...lease,
    deviceType: type,
    vendor: vendor,
  };
});

// Result:
// [
//   { ..., deviceType: 'desktop', vendor: null },
//   { ..., deviceType: 'printer', vendor: null },
//   { ..., deviceType: 'unknown', vendor: null },
//   { ..., deviceType: 'smartphone', vendor: 'Samsung Electronics' },
// ]
```

### Example 3: Building Device Group Reports

```typescript
import { detectDeviceType, DEVICE_TYPE_LABELS } from '@nasnet/core/utils/device';

function getDeviceStatistics(dhcpLeases) {
  const stats = new Map();

  for (const lease of dhcpLeases) {
    const vendor = lookupVendor(lease.macAddress);
    const type = detectDeviceType(lease.hostname, vendor);
    const label = DEVICE_TYPE_LABELS[type];

    if (!stats.has(label)) {
      stats.set(label, []);
    }
    stats.get(label).push(lease);
  }

  // Display:
  // Smartphone: 8 devices
  // Laptop: 3 devices
  // Printer: 1 device
  // Desktop: 1 device
  // Unknown: 2 devices

  return Array.from(stats.entries()).map(([label, devices]) => ({
    label,
    count: devices.length,
    devices,
  }));
}
```

### Example 4: Confidence Levels

```typescript
import { detectDeviceType } from '@nasnet/core/utils/device';

interface DetectionResult {
  type: DeviceType;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

function detectWithConfidence(hostname, vendor): DetectionResult {
  // Hostname match = high confidence
  if (hostname) {
    for (const [pattern, type] of HOSTNAME_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          type,
          confidence: 'high',
          sources: ['hostname pattern'],
        };
      }
    }
  }

  // Vendor match = medium confidence
  if (vendor) {
    for (const [vendorName, type] of Object.entries(VENDOR_HINTS)) {
      if (vendor.includes(vendorName)) {
        return {
          type,
          confidence: 'medium',
          sources: ['MAC vendor lookup'],
        };
      }
    }
  }

  // Unknown = low confidence
  return {
    type: DeviceType.UNKNOWN,
    confidence: 'low',
    sources: [],
  };
}
```

### Example 5: Device Sorting/Grouping

```typescript
// Sort devices by type (phones first, then everything else)
const sortedDevices = connectedDevices.sort((a, b) => {
  const typeOrder = {
    [DeviceType.SMARTPHONE]: 0,
    [DeviceType.TABLET]: 1,
    [DeviceType.LAPTOP]: 2,
    [DeviceType.DESKTOP]: 3,
    [DeviceType.PRINTER]: 4,
    [DeviceType.TV]: 5,
    [DeviceType.GAMING_CONSOLE]: 6,
    [DeviceType.IOT]: 7,
    [DeviceType.ROUTER]: 8,
    [DeviceType.UNKNOWN]: 9,
  };

  return (typeOrder[a.deviceType] ?? 9) - (typeOrder[b.deviceType] ?? 9);
});
```

---

## Troubleshooting

### Device Shows as UNKNOWN

**Causes (in order):**

1. Hostname doesn't match any pattern
2. MAC vendor not in database
3. MAC address is locally-administered (bit 1 of first octet set)

**Solutions:**

- Update hostname to include device model/brand
- Add custom vendor to OUI_DATABASE
- Check if MAC is valid (usually `XX:XX:XX:XX:XX:XX` where XX is hex)

### Incorrect Device Classification

**Example:** iPhone detected as generic smartphone instead of "iPhone"

**Solutions:**

1. Check hostname contains "iPhone" or "iphone"
2. Verify MAC starts with `AC:DE:48` (Apple OUI)
3. Add more specific pattern if needed

### Performance Optimization

For large device lists (100+ devices):

```typescript
// ❌ Don't: Re-detect for every render
devices.map((d) => detectDeviceType(d.hostname, d.vendor));

// ✅ Do: Memoize or cache results
const detectionCache = new Map();

function getCachedDeviceType(mac, hostname, vendor) {
  if (detectionCache.has(mac)) {
    return detectionCache.get(mac);
  }
  const type = detectDeviceType(hostname, vendor);
  detectionCache.set(mac, type);
  return type;
}
```

---

## Related Documentation

- **Connected Device Types:** `libs/core/types/src/router/connected-device.ts`
- **MAC Vendor Lookup:** `libs/core/utils/mac-vendor/`
- **Network Configuration:** `libs/core/docs/guides/network-configuration.md`
- **DHCP Types:** `libs/core/types/src/router/dhcp.ts`
