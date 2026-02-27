# Core Utils Library Reference

Complete reference for all utility functions exported from `@nasnet/core/utils`. This library
provides network validation, data formatting, React hooks, dependency graph algorithms, log export,
and device detection utilities.

**Import Pattern:**

```typescript
import {
  formatBytes,
  isValidIPv4,
  calculateStatus,
  useAutoScroll,
  topologicalSort,
  detectDeviceType,
  lookupVendor,
} from '@nasnet/core/utils';
```

## Table of Contents

1. [Formatters](#formatters) - Date, time, duration, bandwidth, and text formatting
2. [Network Utilities](#network-utilities) - IPv4, CIDR, MAC address validation and manipulation
3. [Status Utilities](#status-utilities) - Resource status calculation and color theming
4. [React Hooks](#react-hooks) - useRelativeTime, useAutoScroll, useReducedMotion
5. [Dependency Graph](#dependency-graph) - Topological sorting, cycle detection, dependency analysis
6. [Device Detection](#device-detection) - Device type inference, icons, and labels
7. [MAC Vendor Lookup](#mac-vendor-lookup) - IEEE OUI database lookup and MAC formatting
8. [Firewall Log Parsing](#firewall-log-parsing) - RouterOS firewall log parsing
9. [Log Export](#log-export) - CSV/JSON export utilities

---

## Formatters

Format various data types into human-readable strings.

### Date & Time Functions

#### `formatDate(date, locale)`

Formats a date to locale-specific readable string.

**Signature:**

```typescript
function formatDate(date: Date | string, locale?: string): string;
```

**Parameters:**

- `date`: Date object or ISO string
- `locale`: Locale string (default: `'en-US'`)

**Returns:** Formatted date string (e.g., `"12/4/2025"`)

**Examples:**

```typescript
formatDate(new Date()); // "12/4/2025"
formatDate('2025-12-04T12:34:56Z'); // "12/4/2025"
formatDate(new Date(), 'de-DE'); // "4.12.2025"
```

**Edge Cases:**

- Invalid dates return `"Invalid Date"`
- Respects locale formatting rules

---

#### `formatDateTime(date, locale)`

Formats a date and time to locale-specific readable string.

**Signature:**

```typescript
function formatDateTime(date: Date | string, locale?: string): string;
```

**Parameters:**

- `date`: Date object or ISO string
- `locale`: Locale string (default: `'en-US'`)

**Returns:** Formatted date and time string (e.g., `"12/4/2025, 12:34:56 PM"`)

**Examples:**

```typescript
formatDateTime(new Date()); // "12/4/2025, 12:34:56 PM"
formatDateTime('2025-12-04T12:34:56Z'); // "12/4/2025, 12:34:56 PM"
formatDateTime(new Date(), 'de-DE'); // "4.12.2025, 12:34:56"
```

---

#### `formatTimestamp(timestamp, showDate)`

Formats a timestamp for log display (12-hour format with seconds).

**Signature:**

```typescript
function formatTimestamp(timestamp: Date | string, showDate?: boolean): string;
```

**Parameters:**

- `timestamp`: Date object or ISO string
- `showDate`: Whether to include date (default: `false`)

**Returns:** Formatted timestamp string

**Examples:**

```typescript
formatTimestamp(new Date()); // "12:34:56 PM"
formatTimestamp(new Date(), true); // "12/04/2025, 12:34:56 PM"
formatTimestamp('2025-12-04T12:34:56Z'); // "12:34:56 PM"
```

---

### Duration & Uptime Functions

#### `formatDuration(ms)`

Formats milliseconds as a duration string (e.g., "1d 2h 30m 45s").

**Signature:**

```typescript
function formatDuration(ms: number): string;
```

**Parameters:**

- `ms`: Duration in milliseconds

**Returns:** Formatted duration string

**Examples:**

```typescript
formatDuration(90061000); // "1d 1h 1m 1s"
formatDuration(3661000); // "1h 1m 1s"
formatDuration(60000); // "1m"
formatDuration(5000); // "5s"
formatDuration(0); // "0s"
```

---

#### `formatUptime(seconds)`

Formats uptime from seconds to a readable string (internal call to `formatDuration`).

**Signature:**

```typescript
function formatUptime(seconds: number): string;
```

**Parameters:**

- `seconds`: Uptime in seconds

**Returns:** Formatted uptime string

**Examples:**

```typescript
formatUptime(90061); // "1d 1h 1m 1s"
formatUptime(3661); // "1h 1m 1s"
formatUptime(86400); // "1d"
```

---

#### `parseRouterOSUptime(uptimeStr)`

Parses RouterOS uptime format and converts to human-readable string.

**Signature:**

```typescript
function parseRouterOSUptime(uptimeStr: string): string;
```

**Parameters:**

- `uptimeStr`: RouterOS uptime string (e.g., `"3d4h25m12s"`, `"4h25m"`, `"25m12s"`)

**Returns:** Human-readable uptime string

**Examples:**

```typescript
parseRouterOSUptime('3d4h25m12s'); // "3d 4h 25m 12s"
parseRouterOSUptime('0s'); // "0s"
parseRouterOSUptime('365d12h30m'); // "365d 12h 30m"
parseRouterOSUptime(''); // "0s" (fallback)
parseRouterOSUptime(null); // "0s" (fallback)
```

**Edge Cases:**

- Empty or invalid strings return `"0s"`
- Regex pattern matching handles all RouterOS time component combinations

---

#### `formatLeaseTime(leaseTime)`

Formats DHCP lease time from RouterOS format to human-readable format.

**Signature:**

```typescript
function formatLeaseTime(leaseTime: string): string;
```

**Parameters:**

- `leaseTime`: RouterOS lease time string (e.g., `"10m"`, `"1h"`, `"1d"`, `"1d12h30m"`)

**Returns:** Human-readable lease time string

**Examples:**

```typescript
formatLeaseTime('10m'); // "10 minutes"
formatLeaseTime('1h'); // "1 hour"
formatLeaseTime('1d'); // "1 day"
formatLeaseTime('1d12h'); // "1 day 12 hours"
formatLeaseTime('2d'); // "2 days"
formatLeaseTime(''); // "0 seconds"
```

**Pluralization:** Automatically handles singular/plural forms

---

#### `formatExpirationTime(expiresAfter)`

Formats DHCP lease expiration time. Returns `"Never"` for static leases.

**Signature:**

```typescript
function formatExpirationTime(expiresAfter?: string): string;
```

**Parameters:**

- `expiresAfter`: RouterOS expiration string or undefined for static leases

**Returns:** Human-readable expiration time or `"Never"`

**Examples:**

```typescript
formatExpirationTime('5m30s'); // "5 minutes"
formatExpirationTime('2h15m'); // "2 hours 15 minutes"
formatExpirationTime(undefined); // "Never"
formatExpirationTime(''); // "Never"
```

---

### Data Size Functions

#### `formatBytes(bytes, decimals)`

Formats bytes to a human-readable size string.

**Signature:**

```typescript
function formatBytes(bytes: number, decimals?: number): string;
```

**Parameters:**

- `bytes`: Size in bytes
- `decimals`: Number of decimal places (default: `2`)

**Returns:** Formatted size string (e.g., `"1.23 MB"`)

**Examples:**

```typescript
formatBytes(0); // "0 B"
formatBytes(1024); // "1.00 KB"
formatBytes(1048576); // "1.00 MB"
formatBytes(1536, 1); // "1.5 KB"
formatBytes(1073741824); // "1.00 GB"
formatBytes(1099511627776); // "1.00 TB"
```

**Scales:** B, KB, MB, GB, TB, PB

---

#### `formatBandwidth(bytesPerSecond, decimals)`

Formats bytes per second as bandwidth (converts to bits and scales).

**Signature:**

```typescript
function formatBandwidth(bytesPerSecond: number, decimals?: number): string;
```

**Parameters:**

- `bytesPerSecond`: Bandwidth in bytes per second
- `decimals`: Number of decimal places (default: `2`)

**Returns:** Formatted bandwidth string (e.g., `"1.23 Mbps"`)

**Examples:**

```typescript
formatBandwidth(131072); // "1.05 Mbps" (131072 bytes/s = 1.048576 Mbps)
formatBandwidth(1024, 1); // "8.2 Kbps"
formatBandwidth(1024000); // "8.19 Mbps"
```

**Calculation:** `bytesPerSecond * 8 = bits per second`

---

#### `formatPercent(value, decimals)`

Formats a percentage value.

**Signature:**

```typescript
function formatPercent(value: number, decimals?: number): string;
```

**Parameters:**

- `value`: Value (0-100, but accepts any number)
- `decimals`: Number of decimal places (default: `1`)

**Returns:** Formatted percentage string

**Examples:**

```typescript
formatPercent(45.5); // "45.5%"
formatPercent(33.333, 2); // "33.33%"
formatPercent(100); // "100.0%"
formatPercent(0); // "0.0%"
```

---

#### `formatNumber(value, locale)`

Formats a number with thousand separators.

**Signature:**

```typescript
function formatNumber(value: number, locale?: string): string;
```

**Parameters:**

- `value`: Number to format
- `locale`: Locale string (default: `'en-US'`)

**Returns:** Formatted number string

**Examples:**

```typescript
formatNumber(1000000); // "1,000,000"
formatNumber(1000000, 'de-DE'); // "1.000.000"
formatNumber(1000000, 'fr-FR'); // "1 000 000"
```

---

### MAC & Text Functions

#### `formatMAC(mac, separator)`

Formats MAC address to a consistent format.

**Signature:**

```typescript
function formatMAC(mac: string | undefined | null, separator?: string): string;
```

**Parameters:**

- `mac`: MAC address string (any format: `XX:XX:XX:XX:XX:XX`, `XX-XX-XX-XX-XX-XX`, or
  `XXXXXXXXXXXX`)
- `separator`: Separator character (default: `':'`)

**Returns:** Formatted MAC address, or empty string if undefined/null

**Examples:**

```typescript
formatMAC('aabbccddee00'); // "AA:BB:CC:DD:EE:00"
formatMAC('aa-bb-cc-dd-ee-00', '-'); // "AA-BB-CC-DD-EE-00"
formatMAC('aa:bb:cc:dd:ee:00'); // "AA:BB:CC:DD:EE:00"
formatMAC(null); // ""
formatMAC(undefined); // ""
```

**Note:** Also exported as `formatMACAddress` (alias)

---

#### `formatMACAddress(mac)`

Alias for `formatMAC` with colon separator (for DHCP-specific context).

**Signature:**

```typescript
function formatMACAddress(mac: string): string;
```

**Examples:**

```typescript
formatMACAddress('aabbccddee00'); // "AA:BB:CC:DD:EE:00"
```

---

#### `truncateText(text, maxLength, ellipsis)`

Truncates text to a maximum length with ellipsis.

**Signature:**

```typescript
function truncateText(text: string, maxLength: number, ellipsis?: string): string;
```

**Parameters:**

- `text`: Text to truncate
- `maxLength`: Maximum length including ellipsis
- `ellipsis`: Ellipsis string (default: `'...'`)

**Returns:** Truncated text with ellipsis if exceeded

**Examples:**

```typescript
truncateText('Hello World', 8); // "Hello..."
truncateText('Hi', 10); // "Hi"
truncateText('This is a long string', 15, '...'); // "This is a..."
truncateText('Test', 10, '...'); // "Test"
```

---

#### `formatBoolean(value, trueText, falseText)`

Formats a boolean value as a human-readable string.

**Signature:**

```typescript
function formatBoolean(value: boolean, trueText?: string, falseText?: string): string;
```

**Parameters:**

- `value`: Boolean value
- `trueText`: Text for true (default: `'Yes'`)
- `falseText`: Text for false (default: `'No'`)

**Returns:** Formatted boolean string

**Examples:**

```typescript
formatBoolean(true); // "Yes"
formatBoolean(false); // "No"
formatBoolean(true, 'Enabled', 'Disabled'); // "Enabled"
formatBoolean(false, 'Online', 'Offline'); // "Offline"
```

---

### Cryptographic & Special Formats

#### `formatPublicKey(publicKey)`

Formats WireGuard public key to truncated display format.

**Signature:**

```typescript
function formatPublicKey(publicKey: string): string;
```

**Parameters:**

- `publicKey`: Base64 encoded WireGuard public key

**Returns:** Truncated public key (first 8 + "..." + last 4 chars), or as-is if ≤12 chars

**Examples:**

```typescript
formatPublicKey('ABC123XYZ789DEFGHI456'); // "ABC123XY...I456"
formatPublicKey('SHORT'); // "SHORT"
formatPublicKey(''); // ""
```

**Format:** Shows first 8 chars + `"..."` + last 4 chars for keys > 12 chars

---

#### `formatLastHandshake(lastHandshake)`

Formats WireGuard last handshake time to relative time string.

**Signature:**

```typescript
function formatLastHandshake(lastHandshake?: Date | null): string;
```

**Parameters:**

- `lastHandshake`: Date object representing the last handshake time

**Returns:** Relative time string (e.g., `"2 minutes ago"`) or `"Never"`

**Examples:**

```typescript
formatLastHandshake(new Date(Date.now() - 120000)); // "2 minutes ago"
formatLastHandshake(new Date(Date.now() - 3600000)); // "about 1 hour ago"
formatLastHandshake(undefined); // "Never"
formatLastHandshake(null); // "Never"
```

**Library:** Uses `date-fns` `formatDistanceToNow` internally

---

## Network Utilities

IP address, subnet, and MAC address validation and manipulation functions.

### IPv4 Address Functions

#### `isValidIPv4(ip)`

Validates if a string is a valid IPv4 address.

**Signature:**

```typescript
function isValidIPv4(ip: string): boolean;
```

**Parameters:**

- `ip`: IP address string to validate

**Returns:** `true` if valid IPv4, `false` otherwise

**Examples:**

```typescript
isValidIPv4('192.168.1.1'); // true
isValidIPv4('256.0.0.1'); // false (256 exceeds max)
isValidIPv4('not an ip'); // false
isValidIPv4('192.168.1'); // false (incomplete)
isValidIPv4('0.0.0.0'); // true
isValidIPv4('255.255.255.255'); // true
```

**Validation:** Regex:
`/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/`

---

#### `isValidSubnet(cidr)`

Validates if a string is valid CIDR subnet notation.

**Signature:**

```typescript
function isValidSubnet(cidr: string): boolean;
```

**Parameters:**

- `cidr`: CIDR notation (e.g., `"192.168.1.0/24"`)

**Returns:** `true` if valid CIDR, `false` otherwise

**Examples:**

```typescript
isValidSubnet('192.168.1.0/24'); // true
isValidSubnet('192.168.1.0/33'); // false (prefix > 32)
isValidSubnet('192.168.1.0'); // false (no prefix)
isValidSubnet('10.0.0.0/8'); // true
```

---

#### `ipToNumber(ip)`

Converts an IPv4 address to a 32-bit unsigned integer.

**Signature:**

```typescript
function ipToNumber(ip: string): number;
```

**Parameters:**

- `ip`: IPv4 address string

**Returns:** Numerical representation (0 if invalid)

**Examples:**

```typescript
ipToNumber('192.168.1.1'); // 3232235777
ipToNumber('0.0.0.0'); // 0
ipToNumber('255.255.255.255'); // 4294967295
ipToNumber('invalid'); // 0
```

**Algorithm:** Bitwise shift left by 8 for each octet

---

#### `numberToIP(num)`

Converts a 32-bit unsigned integer back to IPv4 address format.

**Signature:**

```typescript
function numberToIP(num: number): string;
```

**Parameters:**

- `num`: Numerical representation

**Returns:** IPv4 address string

**Examples:**

```typescript
numberToIP(3232235777); // '192.168.1.1'
numberToIP(0); // '0.0.0.0'
numberToIP(4294967295); // '255.255.255.255'
```

**Inverse of:** `ipToNumber`

---

#### `compareIPv4(ip1, ip2)`

Compares two IPv4 addresses numerically.

**Signature:**

```typescript
function compareIPv4(ip1: string, ip2: string): number;
```

**Parameters:**

- `ip1`: First IP address
- `ip2`: Second IP address

**Returns:** Negative if ip1 < ip2, positive if ip1 > ip2, 0 if equal

**Examples:**

```typescript
compareIPv4('192.168.1.1', '192.168.1.2'); // negative number
compareIPv4('10.0.0.1', '10.0.0.1'); // 0
compareIPv4('192.168.2.1', '192.168.1.1'); // positive number
```

**Use Case:** Sorting IP address arrays

---

### CIDR & Subnet Functions

#### `parseCIDR(cidr)`

Parses CIDR notation and returns network, netmask, and broadcast addresses.

**Signature:**

```typescript
function parseCIDR(cidr: string): {
  network: string;
  netmask: string;
  broadcast: string;
  prefix: number;
} | null;
```

**Parameters:**

- `cidr`: CIDR notation (e.g., `"192.168.1.0/24"`)

**Returns:** Object with subnet info or `null` if invalid

**Examples:**

```typescript
parseCIDR('192.168.1.0/24');
// {
//   network: '192.168.1.0',
//   netmask: '255.255.255.0',
//   broadcast: '192.168.1.255',
//   prefix: 24
// }

parseCIDR('10.0.0.0/8');
// {
//   network: '10.0.0.0',
//   netmask: '255.0.0.0',
//   broadcast: '10.255.255.255',
//   prefix: 8
// }

parseCIDR('invalid'); // null
```

---

#### `getSubnetInfo(cidr)`

Gets detailed subnet information (comprehensive analysis).

**Signature:**

```typescript
function getSubnetInfo(cidr: string): {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  prefix: number;
  netmask: string;
  hostCount: number;
  totalAddresses: number;
} | null;
```

**Parameters:**

- `cidr`: CIDR subnet notation

**Returns:** Detailed subnet information or `null` if invalid

**Examples:**

```typescript
getSubnetInfo('192.168.1.0/24');
// {
//   network: '192.168.1.0',
//   broadcast: '192.168.1.255',
//   firstHost: '192.168.1.1',
//   lastHost: '192.168.1.254',
//   prefix: 24,
//   netmask: '255.255.255.0',
//   hostCount: 254,
//   totalAddresses: 256
// }
```

---

#### `isIPInSubnet(ip, cidr)`

Checks if an IP address is within a given subnet.

**Signature:**

```typescript
function isIPInSubnet(ip: string, cidr: string): boolean;
```

**Parameters:**

- `ip`: IP address to check
- `cidr`: CIDR subnet notation

**Returns:** `true` if IP is within the subnet

**Examples:**

```typescript
isIPInSubnet('192.168.1.100', '192.168.1.0/24'); // true
isIPInSubnet('192.168.2.100', '192.168.1.0/24'); // false
isIPInSubnet('10.0.0.50', '10.0.0.0/8'); // true
```

---

#### `getHostCount(prefix)`

Gets the number of usable hosts in a subnet.

**Signature:**

```typescript
function getHostCount(cidr: string): number;
```

**Parameters:**

- `prefix`: CIDR prefix length or subnet notation

**Returns:** Number of usable hosts (0 if invalid)

**Examples:**

```typescript
getHostCount('192.168.1.0/24'); // 254 (256 - 2)
getHostCount('192.168.1.0/25'); // 126 (128 - 2)
getHostCount('192.168.1.0/32'); // 1 (single host)
getHostCount('192.168.1.0/31'); // 2 (point-to-point, RFC 3021)
```

**Special Cases:**

- `/31`: Point-to-point link (RFC 3021) = 2
- `/32`: Single host = 1

---

#### `getFirstHost(cidr)`

Gets the first usable host IP in a subnet.

**Signature:**

```typescript
function getFirstHost(cidr: string): string;
```

**Parameters:**

- `cidr`: CIDR subnet notation

**Returns:** First usable IP address, or empty string if invalid

**Examples:**

```typescript
getFirstHost('192.168.1.0/24'); // '192.168.1.1'
getFirstHost('10.0.0.0/8'); // '10.0.0.1'
getFirstHost('192.168.1.0/31'); // '192.168.1.0' (no separate first host)
```

---

#### `getLastHost(cidr)`

Gets the last usable host IP in a subnet.

**Signature:**

```typescript
function getLastHost(cidr: string): string;
```

**Parameters:**

- `cidr`: CIDR subnet notation

**Returns:** Last usable IP address, or empty string if invalid

**Examples:**

```typescript
getLastHost('192.168.1.0/24'); // '192.168.1.254'
getLastHost('10.0.0.0/8'); // '10.255.255.254'
getLastHost('192.168.1.0/31'); // '192.168.1.1' (broadcast)
```

---

### Subnet Mask Functions

#### `getPrefixMask(prefix)`

Converts a prefix length to a netmask.

**Signature:**

```typescript
function getPrefixMask(prefix: number): string;
```

**Parameters:**

- `prefix`: Prefix length (0-32)

**Returns:** Netmask in dotted decimal notation

**Examples:**

```typescript
getPrefixMask(24); // '255.255.255.0'
getPrefixMask(16); // '255.255.0.0'
getPrefixMask(8); // '255.0.0.0'
getPrefixMask(0); // '0.0.0.0'
getPrefixMask(32); // '255.255.255.255'
```

---

#### `getMaskPrefix(mask)`

Converts a netmask to a prefix length.

**Signature:**

```typescript
function getMaskPrefix(mask: string): number;
```

**Parameters:**

- `mask`: Netmask in dotted decimal notation

**Returns:** Prefix length (0-32), or -1 if invalid

**Examples:**

```typescript
getMaskPrefix('255.255.255.0'); // 24
getMaskPrefix('255.255.0.0'); // 16
getMaskPrefix('255.0.0.0'); // 8
getMaskPrefix('invalid'); // -1
getMaskPrefix('255.255.128.255'); // -1 (non-contiguous mask)
```

**Validation:** Ensures continuous 1s followed by continuous 0s

---

#### `isValidMask(mask)`

Validates if a string is a valid netmask.

**Signature:**

```typescript
function isValidMask(mask: string): boolean;
```

**Parameters:**

- `mask`: Netmask in dotted decimal notation

**Returns:** `true` if valid netmask

**Examples:**

```typescript
isValidMask('255.255.255.0'); // true
isValidMask('255.255.254.0'); // true
isValidMask('255.255.255.1'); // false (non-contiguous)
isValidMask('256.255.255.0'); // false (invalid octet)
```

---

### MAC Address Functions

#### `isValidMACAddress(mac)`

Validates if a string is a valid MAC address.

**Signature:**

```typescript
function isValidMACAddress(mac: string): boolean;
```

**Parameters:**

- `mac`: MAC address string to validate

**Returns:** `true` if valid MAC address

**Formats Accepted:**

- `XX:XX:XX:XX:XX:XX` (colon-separated)
- `XX-XX-XX-XX-XX-XX` (dash-separated)
- `XXXXXXXXXXXX` (no separator)

**Examples:**

```typescript
isValidMACAddress('00:1A:2B:3C:4D:5E'); // true
isValidMACAddress('00-1A-2B-3C-4D-5E'); // true
isValidMACAddress('001A2B3C4D5E'); // true
isValidMACAddress('invalid'); // false
```

---

## Status Utilities

Calculate resource status and get color theming.

### `calculateStatus(percentage)`

Calculate resource status based on usage percentage.

**Signature:**

```typescript
function calculateStatus(percentage: number): ResourceStatus;
```

**Parameters:**

- `percentage`: Usage percentage (0-100)

**Returns:** Resource status level: `'healthy'` | `'warning'` | `'critical'`

**Thresholds:**

- `0-50%`: `'healthy'`
- `50-80%`: `'warning'`
- `>80%`: `'critical'`

**Examples:**

```typescript
calculateStatus(25); // 'healthy'
calculateStatus(65); // 'warning'
calculateStatus(95); // 'critical'
calculateStatus(50); // 'warning' (boundary: ≤80)
```

---

### `getStatusColor(status)`

Get Tailwind CSS color classes based on resource status.

**Signature:**

```typescript
function getStatusColor(status: ResourceStatus): {
  readonly text: string;
  readonly bg: string;
  readonly border: string;
};
```

**Parameters:**

- `status`: Resource status level

**Returns:** Object with Tailwind color classes

**Examples:**

```typescript
getStatusColor('healthy');
// {
//   text: 'text-green-500',
//   bg: 'bg-green-500',
//   border: 'border-green-500'
// }

getStatusColor('warning');
// {
//   text: 'text-amber-500',
//   bg: 'bg-amber-500',
//   border: 'border-amber-500'
// }

getStatusColor('critical');
// {
//   text: 'text-red-500',
//   bg: 'bg-red-500',
//   border: 'border-red-500'
// }
```

**Color Mapping:**

- `healthy` → Green (success)
- `warning` → Amber (caution)
- `critical` → Red (danger)

---

## React Hooks

React hooks for common UI patterns and accessibility.

### `useRelativeTime(timestamp)`

Hook to display relative time that updates every second.

**Signature:**

```typescript
function useRelativeTime(timestamp: Date | null | undefined): string;
```

**Parameters:**

- `timestamp`: Date object to display relative to now

**Returns:** Formatted relative time string (e.g., `"Updated 5 seconds ago"`)

**Update Interval:** Every 1 second

**Examples:**

```typescript
function Component({ lastUpdated }: { lastUpdated: Date }) {
  const relativeTime = useRelativeTime(lastUpdated);
  return <span>{relativeTime}</span>;
  // Result: "Updated 5 seconds ago"
}
```

**Formatting:**

- `< 5 seconds`: `"Updated just now"`
- `< 60 seconds`: `"Updated X seconds ago"`
- `< 60 minutes`: `"Updated X minutes ago"`
- `>= 60 minutes`: `"Updated X hours ago"`

**Dependencies:** `[timestamp]`

---

### `useAutoScroll(options)`

Manages automatic scrolling behavior for scrollable containers (e.g., log viewers).

**Signature:**

```typescript
interface UseAutoScrollOptions {
  scrollRef: RefObject<HTMLElement>;
  data: unknown[];
  enabled?: boolean; // default: true
  threshold?: number; // default: 100
}

function useAutoScroll(options: UseAutoScrollOptions): UseAutoScrollReturn;
```

**Options:**

- `scrollRef`: Ref to the scrollable container
- `data`: Data array to watch for changes
- `enabled`: Enable/disable auto-scroll (default: `true`)
- `threshold`: Scroll threshold in pixels (default: `100`)

**Return Type:**

```typescript
interface UseAutoScrollReturn {
  isAtBottom: boolean; // Whether user is at bottom
  newEntriesCount: number; // Count of new entries since scroll paused
  scrollToBottom: () => void; // Manual scroll to bottom function
}
```

**Behavior:**

- Auto-scrolls to bottom when new data arrives AND user is at bottom
- Pauses auto-scroll when user manually scrolls up
- Tracks count of new entries while paused
- Uses `requestAnimationFrame` for performance

**Example:**

```typescript
function LogViewer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { logs } = useSystemLogs();
  const { isAtBottom, newEntriesCount, scrollToBottom } = useAutoScroll({
    scrollRef,
    data: logs || [],
  });

  return (
    <div ref={scrollRef} className="overflow-auto h-96">
      {logs?.map(log => <LogEntry key={log.id} entry={log} />)}
      {!isAtBottom && newEntriesCount > 0 && (
        <button onClick={scrollToBottom}>
          {newEntriesCount} new entries - Jump to bottom
        </button>
      )}
    </div>
  );
}
```

**Dependencies:** `[scrollRef, data.length, enabled, threshold]`

---

### `useReducedMotion()`

Hook to detect if user prefers reduced motion from system settings.

**Signature:**

```typescript
function useReducedMotion(): boolean;
```

**Returns:** `true` if user prefers reduced motion, `false` otherwise

**Media Query:** `(prefers-reduced-motion: reduce)`

**Reactivity:** Updates when system preference changes

**Example:**

```typescript
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={prefersReducedMotion ? '' : 'animate-pulse'}>
      Content
    </div>
  );
}
```

**WCAG Compliance:** Respects user accessibility preferences (WCAG 2.1 SC 2.3.3)

---

### `getReducedMotionPreference()`

Static check for reduced motion preference (non-reactive).

**Signature:**

```typescript
function getReducedMotionPreference(): boolean;
```

**Returns:** `true` if user prefers reduced motion, `false` otherwise

**Use Case:** One-time checks outside React components or at module level

**Example:**

```typescript
// At module level
const prefersReduced = getReducedMotionPreference();
const animationDuration = prefersReduced ? 0 : 300;
```

---

## Dependency Graph

Topological sorting, cycle detection, and dependency analysis for change sets.

### Core Types

```typescript
interface DependencyNode {
  id: string;
  dependencies: readonly string[];
}

interface TopologicalSortResult {
  success: boolean;
  sortedIds: string[];
  cycle: string[] | null;
  error: string | null;
}

interface DependencyAnalysis {
  roots: string[];
  leaves: string[];
  maxDepth: number;
  levels: string[][];
  missingDependencies: Array<{ nodeId: string; missingDepId: string }>;
}
```

---

### `topologicalSort(nodes)`

Perform topological sort using Kahn's algorithm.

**Signature:**

```typescript
function topologicalSort(nodes: ReadonlyArray<DependencyNode>): TopologicalSortResult;
```

**Parameters:**

- `nodes`: Array of nodes with their dependencies

**Returns:** Sorted result with cycle information if applicable

**Algorithm:** Kahn's algorithm (queue-based)

**Complexity:** O(V + E) where V = nodes, E = dependencies

**Example:**

```typescript
const nodes = [
  { id: 'bridge', dependencies: [] },
  { id: 'dhcp', dependencies: ['bridge'] },
  { id: 'firewall', dependencies: ['bridge'] },
];

const result = topologicalSort(nodes);
// result.success = true
// result.sortedIds = ['bridge', 'dhcp', 'firewall'] (or bridge, firewall, dhcp)
// result.cycle = null
```

**Cycle Detection:** If `success === false`, `cycle` array shows nodes in cycle

---

### `detectCycles(nodes)`

Detect all cycles in the dependency graph.

**Signature:**

```typescript
function detectCycles(nodes: ReadonlyArray<DependencyNode>): CycleDetectionResult;
```

**Parameters:**

- `nodes`: Array of nodes with dependencies

**Returns:** Detection result with `hasCycle` flag and all cycles found

**Example:**

```typescript
const nodes = [
  { id: 'a', dependencies: ['b'] },
  { id: 'b', dependencies: ['a'] },
];

const result = detectCycles(nodes);
// result.hasCycle = true
// result.cycles = [['a', 'b']]
```

**Algorithm:** Depth-first search with recursion stack

---

### `analyzeDependencies(nodes)`

Analyze the dependency graph structure.

**Signature:**

```typescript
function analyzeDependencies(nodes: ReadonlyArray<DependencyNode>): DependencyAnalysis;
```

**Parameters:**

- `nodes`: Array of nodes with dependencies

**Returns:** Analysis object with graph structure information

**Example:**

```typescript
const nodes = [
  { id: 'bridge', dependencies: [] },
  { id: 'dhcp', dependencies: ['bridge'] },
  { id: 'firewall', dependencies: ['bridge'] },
];

const analysis = analyzeDependencies(nodes);
// analysis.roots = ['bridge']
// analysis.leaves = ['dhcp', 'firewall']
// analysis.maxDepth = 1
// analysis.levels = [['bridge'], ['dhcp', 'firewall']]
// analysis.missingDependencies = []
```

**Metrics Computed:**

- **roots**: Nodes with no dependencies
- **leaves**: Nodes with no dependents
- **maxDepth**: Maximum distance from root to leaf
- **levels**: Nodes grouped by depth (for parallel processing)
- **missingDependencies**: References to nodes not in graph

---

### `getParallelApplicableNodes(nodes, appliedIds)`

Get nodes that can be applied in parallel.

**Signature:**

```typescript
function getParallelApplicableNodes(
  nodes: ReadonlyArray<DependencyNode>,
  appliedIds: Set<string>
): string[];
```

**Parameters:**

- `nodes`: All nodes in the dependency graph
- `appliedIds`: Set of already applied node IDs

**Returns:** Node IDs that can be applied next (all dependencies satisfied)

**Example:**

```typescript
const nodes = [
  { id: 'a', dependencies: [] },
  { id: 'b', dependencies: ['a'] },
  { id: 'c', dependencies: ['a'] },
];

const applicable = getParallelApplicableNodes(nodes, new Set(['a']));
// applicable = ['b', 'c']
```

---

### `validateDependencyGraph(nodes)`

Validate that a dependency graph is valid for application.

**Signature:**

```typescript
interface DependencyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateDependencyGraph(nodes: ReadonlyArray<DependencyNode>): DependencyValidationResult;
```

**Parameters:**

- `nodes`: Array of nodes with dependencies

**Returns:** Validation result with errors and warnings

**Checks:**

- Duplicate node IDs
- Self-references
- Circular dependencies (critical errors)
- Missing dependencies (warnings)

**Example:**

```typescript
const nodes = [
  { id: 'a', dependencies: [] },
  { id: 'b', dependencies: ['a'] },
];

const result = validateDependencyGraph(nodes);
// result.valid = true
// result.errors = []
// result.warnings = []
```

---

### `buildDependencyGraph(items)`

Build a dependency graph from change set items.

**Signature:**

```typescript
function buildDependencyGraph<T extends { id: string; dependencies: readonly string[] }>(
  items: T[]
): DependencyNode[];
```

**Parameters:**

- `items`: Items with `id` and `dependencies` properties

**Returns:** Array of dependency nodes

**Example:**

```typescript
const items = [
  { id: 'bridge', dependencies: [], config: {} },
  { id: 'dhcp', dependencies: ['bridge'], config: {} },
];

const graph = buildDependencyGraph(items);
// graph = [
//   { id: 'bridge', dependencies: [] },
//   { id: 'dhcp', dependencies: ['bridge'] }
// ]
```

---

### `computeApplyOrder(nodes)`

Compute apply order for each item based on topological sort.

**Signature:**

```typescript
function computeApplyOrder(nodes: ReadonlyArray<DependencyNode>): Map<string, number>;
```

**Parameters:**

- `nodes`: Nodes to compute order for

**Returns:** Map of node ID to apply order (0-indexed)

**Example:**

```typescript
const nodes = [
  { id: 'bridge', dependencies: [] },
  { id: 'dhcp', dependencies: ['bridge'] },
];

const orderMap = computeApplyOrder(nodes);
// orderMap.get('bridge') = 0
// orderMap.get('dhcp') = 1
```

---

### `reverseOrder(sortedIds)`

Reverse the order of sorted IDs (for rollback).

**Signature:**

```typescript
function reverseOrder(sortedIds: string[]): string[];
```

**Parameters:**

- `sortedIds`: IDs in apply order

**Returns:** IDs in reverse order (for rollback)

**Example:**

```typescript
const applyOrder = ['bridge', 'dhcp', 'firewall'];
const rollbackOrder = reverseOrder(applyOrder);
// rollbackOrder = ['firewall', 'dhcp', 'bridge']
```

---

## Device Detection

Infer device type from hostname and MAC vendor information.

### `detectDeviceType(hostname, vendor)`

Detect device type from hostname and vendor information.

**Signature:**

```typescript
function detectDeviceType(
  hostname: string | null | undefined,
  vendor: string | null | undefined
): DeviceType;
```

**Parameters:**

- `hostname`: Device hostname (from DHCP)
- `vendor`: MAC vendor name (from OUI lookup)

**Returns:** Detected DeviceType

**Algorithm:**

1. Try hostname pattern matching (most reliable)
2. Fall back to vendor hints
3. Return `DeviceType.UNKNOWN` if no match

**Examples:**

```typescript
detectDeviceType('Johns-iPhone', 'Apple'); // DeviceType.SMARTPHONE
detectDeviceType('printer-hp-laserjet', null); // DeviceType.PRINTER
detectDeviceType(null, 'Raspberry Pi'); // DeviceType.IOT
detectDeviceType('unknown-device', null); // DeviceType.UNKNOWN
```

**Device Types:**

- `SMARTPHONE`
- `TABLET`
- `LAPTOP`
- `DESKTOP`
- `ROUTER`
- `IOT`
- `PRINTER`
- `TV`
- `GAMING_CONSOLE`
- `UNKNOWN`

**Hostname Patterns:** ~54 regex patterns covering devices from 14 categories

**Vendor Hints:** ~20 vendor names mapped to device types

---

### `DEVICE_TYPE_ICONS`

Map device types to Lucide React icon names.

**Type:**

```typescript
const DEVICE_TYPE_ICONS: Record<DeviceType, string>;
```

**Mapping:**

```typescript
{
  SMARTPHONE: 'Smartphone',
  TABLET: 'Tablet',
  LAPTOP: 'Laptop',
  DESKTOP: 'Monitor',
  ROUTER: 'Router',
  IOT: 'Cpu',
  PRINTER: 'Printer',
  TV: 'Tv',
  GAMING_CONSOLE: 'Gamepad2',
  UNKNOWN: 'HelpCircle'
}
```

**Example:**

```typescript
import { DEVICE_TYPE_ICONS } from '@nasnet/core/utils';
import { Smartphone as SmartphoneIcon } from 'lucide-react';

const iconName = DEVICE_TYPE_ICONS[DeviceType.SMARTPHONE]; // 'Smartphone'
// Use with: <SmartphoneIcon />
```

---

### `DEVICE_TYPE_LABELS`

Human-readable labels for device types.

**Type:**

```typescript
const DEVICE_TYPE_LABELS: Record<DeviceType, string>;
```

**Mapping:**

```typescript
{
  SMARTPHONE: 'Smartphone',
  TABLET: 'Tablet',
  LAPTOP: 'Laptop',
  DESKTOP: 'Desktop',
  ROUTER: 'Router',
  IOT: 'IoT Device',
  PRINTER: 'Printer',
  TV: 'TV / Media',
  GAMING_CONSOLE: 'Gaming Console',
  UNKNOWN: 'Unknown'
}
```

**Use Case:** Display in UI tooltips, labels, status indicators

**Example:**

```typescript
import { DEVICE_TYPE_LABELS } from '@nasnet/core/utils';

const label = DEVICE_TYPE_LABELS[DeviceType.LAPTOP]; // 'Laptop'
```

---

## MAC Vendor Lookup

IEEE OUI database lookup for MAC address vendor names.

### `lookupVendor(mac)`

Lookup vendor name from MAC address using OUI database.

**Signature:**

```typescript
function lookupVendor(mac: string): string | null;
```

**Parameters:**

- `mac`: MAC address in any format

**Returns:** Vendor name or `null` if not found

**Supported Formats:**

- `AA:BB:CC:DD:EE:FF` (colon-separated)
- `AA-BB-CC-DD-EE-FF` (dash-separated)
- `AABBCCDDEEFF` (no separator)

**Examples:**

```typescript
lookupVendor('00:0F:E2:12:34:56'); // 'MikroTik'
lookupVendor('AC-DE-48-12-34-56'); // 'Apple Inc.'
lookupVendor('aabbccddeeff'); // null (unknown vendor)
```

**Database:** IEEE OUI database (~350 entries)

---

### `isValidMac(mac)`

Validate MAC address format.

**Signature:**

```typescript
function isValidMac(mac: string): boolean;
```

**Parameters:**

- `mac`: MAC address to validate

**Returns:** `true` if valid format

**Formats Accepted:**

- `AA:BB:CC:DD:EE:FF` (colon-separated)
- `AA-BB-CC-DD-EE-FF` (dash-separated)
- `AABBCCDDEEFF` (no separator)

**Examples:**

```typescript
isValidMac('00:0F:E2:12:34:56'); // true
isValidMac('00-0F-E2-12-34-56'); // true
isValidMac('000FE2123456'); // true
isValidMac('invalid'); // false
```

---

### `formatMac(mac)`

Format MAC address to standard colon-separated uppercase format.

**Signature:**

```typescript
function formatMac(mac: string): string | null;
```

**Parameters:**

- `mac`: MAC address in any format

**Returns:** Formatted MAC address (`XX:XX:XX:XX:XX:XX`) or `null` if invalid

**Examples:**

```typescript
formatMac('aabbccddeeff'); // 'AA:BB:CC:DD:EE:FF'
formatMac('aa-bb-cc-dd-ee-ff'); // 'AA:BB:CC:DD:EE:FF'
formatMac('AA:BB:CC:DD:EE:FF'); // 'AA:BB:CC:DD:EE:FF'
formatMac('invalid'); // null
```

---

### `OUI_DATABASE`

IEEE OUI (Organizationally Unique Identifier) database.

**Type:**

```typescript
const OUI_DATABASE: Record<string, string>;
```

**Format:** Keys are `XX:YY:ZZ` (first 3 octets), values are vendor names

**Example:**

```typescript
import { OUI_DATABASE } from '@nasnet/core/utils';

OUI_DATABASE['00:0F:E2']; // 'MikroTik'
OUI_DATABASE['AC:DE:48']; // 'Apple Inc.'
```

**Size:** ~350 vendor entries

**Use Case:** Direct OUI lookup when you only have the first 3 octets

---

## Firewall Log Parsing

Parse RouterOS firewall log messages into structured data.

### `parseFirewallLogMessage(message)`

Parse a RouterOS firewall log message into structured data.

**Signature:**

```typescript
function parseFirewallLogMessage(message: string): ParsedFirewallLog;
```

**Parameters:**

- `message`: Raw log message from RouterOS

**Returns:** Parsed firewall log data

**Return Type:**

```typescript
interface ParsedFirewallLog {
  chain: FirewallLogChain; // 'input' | 'forward' | 'output'
  action: InferredAction; // 'drop' | 'reject' | 'accept' | 'unknown'
  protocol: FirewallLogProtocol; // 'TCP' | 'UDP' | 'ICMP' | 'IPv6-ICMP' | etc.
  prefix?: string; // Log prefix if present
  interfaceIn?: string; // Input interface
  interfaceOut?: string; // Output interface
  length?: number; // Packet length
  srcIp?: string; // Source IP
  srcPort?: number; // Source port (TCP/UDP only)
  dstIp?: string; // Destination IP
  dstPort?: number; // Destination port (TCP/UDP only)
}
```

**Supported Formats:**

- Format 1 (No prefix): `"forward: in:ether1 out:bridge1, proto TCP (SYN)..."`
- Format 2 (With prefix): `"DROPPED-WAN forward: in:ether1..."`
- Format 3 (ICMP): `"input: in:ether1 out:(unknown 0), proto ICMP (type 8, code 0)..."`

**Examples:**

```typescript
parseFirewallLogMessage(
  'forward: in:ether1 out:bridge1, proto TCP, 192.168.1.100:54321->10.0.0.1:443, len 52'
);
// {
//   chain: 'forward',
//   action: 'unknown',
//   protocol: 'TCP',
//   srcIp: '192.168.1.100',
//   srcPort: 54321,
//   dstIp: '10.0.0.1',
//   dstPort: 443,
//   length: 52
// }

parseFirewallLogMessage('DROPPED-WAN input: in:ether1, proto ICMP, 8.8.8.8->192.168.1.1');
// {
//   chain: 'input',
//   action: 'drop',
//   prefix: 'DROPPED-WAN',
//   protocol: 'ICMP',
//   srcIp: '8.8.8.8',
//   dstIp: '192.168.1.1'
// }
```

**Error Handling:** Graceful fallback on parsing errors returns minimal valid object

---

### `inferActionFromPrefix(prefix)`

Infer the firewall action from a log prefix.

**Signature:**

```typescript
function inferActionFromPrefix(prefix: string): InferredAction;
```

**Parameters:**

- `prefix`: The log prefix (e.g., `"DROPPED-WAN"`, `"ACCEPT"`, `"BLOCKED"`)

**Returns:** Inferred action: `'drop'` | `'reject'` | `'accept'` | `'unknown'`

**Examples:**

```typescript
inferActionFromPrefix('DROPPED-WAN'); // 'drop'
inferActionFromPrefix('ACCEPT'); // 'accept'
inferActionFromPrefix('REJECT'); // 'reject'
inferActionFromPrefix('Custom-Log'); // 'unknown'
```

**Pattern Matching:**

- **drop**: `DROP`, `DROPPED`, `BLOCK`, `BLOCKED`, `DENY` (with optional `-` or `_`)
- **accept**: `ACCEPT`, `ACCEPTED`, `ALLOW`, `ALLOWED`, `PERMIT`
- **reject**: `REJECT`, `REJECTED`

---

### `isValidParsedLog(parsed)`

Validate if a parsed log has minimum required fields.

**Signature:**

```typescript
function isValidParsedLog(parsed: ParsedFirewallLog): boolean;
```

**Parameters:**

- `parsed`: The parsed log data

**Returns:** `true` if valid, `false` otherwise

**Validation:** Checks for required fields:

- `chain` is defined
- `action` is defined
- `protocol` is defined

**Examples:**

```typescript
const valid = { chain: 'input', action: 'unknown', protocol: 'TCP' };
isValidParsedLog(valid); // true

const invalid = { chain: 'input' };
isValidParsedLog(invalid); // false
```

---

## Log Export

CSV and JSON export utilities for log entries.

### `logsToCSV(logs)`

Format log entries as CSV string.

**Signature:**

```typescript
function logsToCSV(logs: LogEntry[]): string;
```

**Parameters:**

- `logs`: Array of log entries to format

**Returns:** CSV-formatted string with headers and rows

**CSV Format:**

- Headers: `Timestamp,Topic,Severity,Message`
- Timestamps: ISO format
- Messages: Quoted with escaped internal quotes

**Example:**

```typescript
const logs = [
  {
    timestamp: new Date('2024-01-01').getTime(),
    topic: 'system',
    severity: 'info',
    message: 'System started',
  },
];

const csv = logsToCSV(logs);
// "Timestamp,Topic,Severity,Message\n2024-01-01T00:00:00.000Z,system,info,\"System started\""
```

---

### `logsToJSON(logs)`

Format log entries as JSON string.

**Signature:**

```typescript
function logsToJSON(logs: LogEntry[]): string;
```

**Parameters:**

- `logs`: Array of log entries to format

**Returns:** JSON-formatted string with 2-space indentation

**Example:**

```typescript
const logs = [
  {
    timestamp: new Date('2024-01-01').getTime(),
    topic: 'system',
    severity: 'info',
    message: 'System started',
  },
];

const json = logsToJSON(logs);
// "[\n  {\n    \"timestamp\": \"2024-01-01T00:00:00.000Z\",\n    ...\n  }\n]"
```

---

### `downloadFile(content, filename, mimeType)`

Download content as file (browser only).

**Signature:**

```typescript
function downloadFile(content: string, filename: string, mimeType: string): void;
```

**Parameters:**

- `content`: String content to download
- `filename`: Name for the downloaded file
- `mimeType`: MIME type (e.g., `'text/csv'`, `'application/json'`)

**Example:**

```typescript
downloadFile('a,b,c\n1,2,3', 'data.csv', 'text/csv');
// Browser downloads: data.csv
```

**Browser API:** Uses Blob + URL.createObjectURL for download

---

### `exportLogsToCSV(logs, routerIp)`

Export logs to CSV file with timestamped filename.

**Signature:**

```typescript
function exportLogsToCSV(logs: LogEntry[], routerIp?: string): void;
```

**Parameters:**

- `logs`: Array of log entries to export
- `routerIp`: IP address or identifier for router (default: `'router'`)

**Filename Format:** `logs-{routerIp}-{YYYY-MM-DD}.csv`

**Example:**

```typescript
const logs = [{ timestamp, topic, severity, message }];
exportLogsToCSV(logs, '192.168.1.1');
// Downloads: logs-192.168.1.1-2024-01-01.csv
```

---

### `exportLogsToJSON(logs, routerIp)`

Export logs to JSON file with timestamped filename.

**Signature:**

```typescript
function exportLogsToJSON(logs: LogEntry[], routerIp?: string): void;
```

**Parameters:**

- `logs`: Array of log entries to export
- `routerIp`: IP address or identifier for router (default: `'router'`)

**Filename Format:** `logs-{routerIp}-{YYYY-MM-DD}.json`

**Example:**

```typescript
const logs = [{ timestamp, topic, severity, message }];
exportLogsToJSON(logs, '192.168.1.1');
// Downloads: logs-192.168.1.1-2024-01-01.json
```

---

## Validation Schemas

The library exports Zod validation schemas for runtime validation. These are located in
`libs/core/utils/src/validation/index.d.ts` and include:

```typescript
ipAddressSchema; // IPv4 address validation
cidrSchema; // CIDR notation validation
portSchema; // Port number validation (0-65535)
macAddressSchema; // MAC address validation
routerConnectionConfigSchema;
wanConfigSchema;
lanConfigSchema;
vpnConfigSchema;
firewallRuleSchema;
routerStatusRequestSchema;
routerStatusResponseSchema;
appConfigSchema;
userPreferencesSchema;
```

---

## Import Guide

### Import all utilities:

```typescript
import * as Utils from '@nasnet/core/utils';
```

### Import specific categories:

```typescript
// Formatters
import { formatBytes, formatDuration, formatMAC, parseRouterOSUptime } from '@nasnet/core/utils';

// Network
import { isValidIPv4, parseCIDR, getSubnetInfo, isIPInSubnet } from '@nasnet/core/utils';

// React Hooks
import { useRelativeTime, useAutoScroll, useReducedMotion } from '@nasnet/core/utils';

// Dependency Graph
import { topologicalSort, detectCycles, analyzeDependencies } from '@nasnet/core/utils';

// Device Detection
import { detectDeviceType, DEVICE_TYPE_ICONS, DEVICE_TYPE_LABELS } from '@nasnet/core/utils';

// MAC Lookup
import { lookupVendor, formatMac, OUI_DATABASE } from '@nasnet/core/utils';

// Log Operations
import { logsToCSV, logsToJSON, exportLogsToCSV, exportLogsToJSON } from '@nasnet/core/utils';
```

---

## Testing

All utilities have test files:

- Formatters: `formatters/formatters.test.ts`, `formatters/leaseTime.test.ts`,
  `formatters/timestamp.test.ts`
- Network: `network/ip.test.ts`, `network/subnet.test.ts`
- Hooks: `hooks/useRelativeTime.test.ts`, `hooks/useAutoScroll.test.ts`,
  `hooks/useReducedMotion.test.ts`
- Device Detection: `device/deviceTypeDetection.test.ts`
- MAC Vendor: `mac-vendor/macVendorLookup.test.ts`
- Firewall Parsing: `firewall/parse-firewall-log.test.ts`
- Graph: `graph/dependency-graph.test.ts`
- Status: `status/calculateStatus.test.ts`

Run tests with:

```bash
npm run test -- libs/core/utils
# or specific module
npm run test -- libs/core/utils -- network/ip.test.ts
```

---

## Performance Notes

**Dependency Graph Functions:**

- `topologicalSort`: O(V + E) - optimal for DAGs
- `detectCycles`: O(V + E) - depth-first search
- `analyzeDependencies`: O(V + E) - breadth-first search

**Network Functions:**

- IP validation: O(1) - regex patterns
- Subnet calculations: O(1) - bitwise operations
- IP-in-subnet checks: O(1) - bitwise operations

**Device Detection:**

- Hostname pattern matching: O(n) - where n = ~54 patterns
- Vendor lookup: O(1) - object property access
- Overall: O(n) - typically < 1ms

**MAC Vendor Lookup:**

- OUI lookup: O(1) - hash table access
- MAC validation: O(1) - regex pattern

**React Hooks:**

- `useRelativeTime`: Updates every 1s via `setInterval`
- `useAutoScroll`: Uses `requestAnimationFrame` for scroll detection
- `useReducedMotion`: `MediaQueryList` listener, minimal overhead

---

## Version & Compatibility

- **TypeScript**: 5.x+
- **React**: 18.0+
- **Node**: 16+
- **Browser Support**: All modern browsers supporting ES2020

---

## Related Documentation

- **Types**: `libs/core/types/src` - TypeScript type definitions
- **Design Tokens**: `Docs/design/DESIGN_TOKENS.md` - Tailwind color classes
- **Architecture**: `Docs/architecture` - Backend/frontend patterns
