/**
 * Network-Specific Zod Validators
 *
 * Custom Zod validators for network-specific types that go beyond simple regex.
 * These are used by codegen and can be imported directly in form schemas.
 *
 * @module @nasnet/core/forms/network-validators
 */

import { z } from 'zod';

/**
 * IPv4 address validator with proper octet range checking.
 * Validates format and ensures each octet is 0-255.
 * Rejects leading zeros in octets (e.g., "192.168.001.1" is invalid).
 *
 * @example
 * ```typescript
 * ipv4.parse('192.168.1.1');   // Valid
 * ipv4.parse('10.0.0.1');      // Valid
 * ipv4.parse('192.168.1');     // Invalid - missing octet
 * ipv4.parse('256.1.1.1');     // Invalid - octet > 255
 * ipv4.parse('192.168.001.1'); // Invalid - leading zero
 * ```
 */
export const ipv4 = z.string().refine(
  (val) => {
    if (!val || val.trim() === '') return false;
    const parts = val.split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      const num = parseInt(part, 10);
      // Ensure no leading zeros (except for "0" itself) and valid range
      return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
    });
  },
  { message: 'Invalid IPv4 address (format: 192.168.1.1)' }
);

/**
 * IPv6 address validator using Zod's built-in IP validation.
 *
 * @example
 * ```typescript
 * ipv6.parse('2001:db8::1');          // Valid
 * ipv6.parse('::1');                  // Valid (loopback)
 * ipv6.parse('2001:0db8:0000:0000:0000:ff00:0042:8329'); // Valid (expanded)
 * ipv6.parse('192.168.1.1');          // Invalid - IPv4 address
 * ```
 */
export const ipv6 = z.string().ip({ version: 'v6' });

/**
 * IP address validator that accepts both IPv4 and IPv6.
 */
export const ipAddress = z.union([ipv4, ipv6]);

/**
 * MAC address validator.
 * Supports both colon (:) and hyphen (-) separators.
 * Format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
 *
 * @example
 * ```typescript
 * mac.parse('00:1A:2B:3C:4D:5E');  // Valid (colon)
 * mac.parse('00-1A-2B-3C-4D-5E');  // Valid (hyphen)
 * mac.parse('001A2B3C4D5E');       // Invalid - no separators
 * mac.parse('00:1A:2B:3C:4D');     // Invalid - only 5 octets
 * ```
 */
export const mac = z
  .string()
  .refine((val) => /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(val), {
    message: 'Invalid MAC address (format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)',
  });

/**
 * CIDR notation validator with proper network validation.
 * Format: 192.168.1.0/24
 * Validates both the IPv4 address and prefix length (0-32).
 *
 * @example
 * ```typescript
 * cidr.parse('192.168.1.0/24');      // Valid
 * cidr.parse('10.0.0.0/8');          // Valid
 * cidr.parse('192.168.1.1/32');      // Valid
 * cidr.parse('192.168.1.0');         // Invalid - missing prefix
 * cidr.parse('192.168.1.0/33');      // Invalid - prefix > 32
 * cidr.parse('256.1.1.1/24');        // Invalid - octet out of range
 * ```
 */
export const cidr = z.string().refine(
  (val) => {
    const [ip, prefix] = val.split('/');
    if (!ip || !prefix) return false;

    // Validate IP part
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    const validIp = parts.every((part) => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
    });
    if (!validIp) return false;

    // Validate prefix
    const prefixNum = parseInt(prefix, 10);
    return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32;
  },
  { message: 'Invalid CIDR notation (format: 192.168.1.0/24, prefix: 0-32)' }
);

/**
 * IPv6 CIDR notation validator.
 * Format: 2001:db8::/32
 * Validates both the IPv6 address and prefix length (0-128).
 *
 * @example
 * ```typescript
 * cidr6.parse('2001:db8::/32');      // Valid
 * cidr6.parse('::1/128');            // Valid
 * cidr6.parse('fe80::/10');          // Valid
 * cidr6.parse('2001:db8::');         // Invalid - missing prefix
 * cidr6.parse('2001:db8::/129');     // Invalid - prefix > 128
 * cidr6.parse('192.168.1.0/24');     // Invalid - IPv4, not IPv6
 * ```
 */
export const cidr6 = z.string().refine(
  (val) => {
    const [ip, prefix] = val.split('/');
    if (!ip || !prefix) return false;

    // Basic IPv6 format check
    const validIp = z.string().ip({ version: 'v6' }).safeParse(ip).success;
    if (!validIp) return false;

    // Validate prefix (0-128 for IPv6)
    const prefixNum = parseInt(prefix, 10);
    return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 128;
  },
  { message: 'Invalid IPv6 CIDR notation (format: 2001:db8::/32, prefix: 0-128)' }
);

/**
 * Port number validator (1-65535).
 *
 * @example
 * ```typescript
 * port.parse(8080);      // Valid
 * port.parse(443);       // Valid
 * port.parse(0);         // Invalid - port < 1
 * port.parse(65536);     // Invalid - port > 65535
 * port.parse(8080.5);    // Invalid - must be integer
 * ```
 */
export const port = z
  .number()
  .int()
  .min(1, 'Port must be between 1 and 65535')
  .max(65535, 'Port must be between 1 and 65535');

/**
 * Port number as string validator.
 * Accepts string input and validates it as a valid port number.
 *
 * @example
 * ```typescript
 * portString.parse('8080');    // Valid
 * portString.parse('443');     // Valid
 * portString.parse('0');       // Invalid - port < 1
 * portString.parse('65536');   // Invalid - port > 65535
 * portString.parse('abc');     // Invalid - not a number
 * ```
 */
export const portString = z.string().refine(
  (val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 65535 && val === String(num);
  },
  { message: 'Port must be a valid integer between 1 and 65535' }
);

/**
 * Port range validator.
 * Accepts single port ("8080") or range ("80-443").
 * Validates that start port <= end port and both are in valid range (1-65535).
 *
 * @example
 * ```typescript
 * portRange.parse('8080');     // Valid - single port
 * portRange.parse('80-443');   // Valid - port range
 * portRange.parse('443-80');   // Invalid - start > end
 * portRange.parse('0-100');    // Invalid - port < 1
 * portRange.parse('65535-65536'); // Invalid - port > 65535
 * ```
 */
export const portRange = z.string().refine(
  (val) => {
    if (val.includes('-')) {
      const [startStr, endStr] = val.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      return !isNaN(start) && !isNaN(end) && start >= 1 && end <= 65535 && start <= end;
    }
    const port = parseInt(val, 10);
    return !isNaN(port) && port >= 1 && port <= 65535 && val === String(port);
  },
  { message: 'Invalid port range (format: 8080 or 80-443, range: 1-65535)' }
);

/**
 * VLAN ID validator (1-4094).
 * Valid VLAN IDs per IEEE 802.1Q standard (excluding reserved 0 and 4095).
 *
 * @example
 * ```typescript
 * vlanId.parse(100);     // Valid
 * vlanId.parse(4094);    // Valid (highest VLAN ID)
 * vlanId.parse(0);       // Invalid - reserved
 * vlanId.parse(4095);    // Invalid - reserved
 * vlanId.parse(4096);    // Invalid - out of range
 * ```
 */
export const vlanId = z
  .number()
  .int()
  .min(1, 'VLAN ID must be between 1 and 4094')
  .max(4094, 'VLAN ID must be between 1 and 4094');

/**
 * VLAN ID as string validator.
 * Accepts string input and validates it as a valid VLAN ID (1-4094).
 *
 * @example
 * ```typescript
 * vlanIdString.parse('100');    // Valid
 * vlanIdString.parse('4094');   // Valid
 * vlanIdString.parse('0');      // Invalid - reserved
 * vlanIdString.parse('4095');   // Invalid - reserved
 * vlanIdString.parse('abc');    // Invalid - not a number
 * ```
 */
export const vlanIdString = z.string().refine(
  (val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 4094 && val === String(num);
  },
  { message: 'VLAN ID must be a valid integer between 1 and 4094' }
);

/**
 * WireGuard public/private key validator.
 * Base64 encoded, exactly 44 characters ending in '='.
 *
 * @example
 * ```typescript
 * wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE='); // Valid
 * wgKey.parse('AAAA');                                         // Invalid - too short
 * wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE');  // Invalid - missing =
 * ```
 */
export const wgKey = z
  .string()
  .refine((val) => /^[A-Za-z0-9+/]{43}=$/.test(val), {
    message: 'Invalid WireGuard key (must be 44 characters ending with =)',
  });

/**
 * Hostname validator (RFC 1123).
 * Allows letters, digits, hyphens, and dots. Each label must start and end with alphanumeric.
 * Max length: 253 characters.
 *
 * @example
 * ```typescript
 * hostname.parse('router');              // Valid
 * hostname.parse('my-router.local');     // Valid
 * hostname.parse('router-01');           // Valid
 * hostname.parse('-invalid');            // Invalid - starts with hyphen
 * hostname.parse('invalid-');            // Invalid - ends with hyphen
 * hostname.parse('a'.repeat(254));       // Invalid - too long (>253)
 * ```
 */
export const hostname = z.string().refine(
  (val) => {
    if (val.length > 253) return false;
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
      val
    );
  },
  { message: 'Invalid hostname (RFC 1123: must be alphanumeric, hyphens, and dots; max 253 chars)' }
);

/**
 * Domain name validator.
 * Requires at least one dot and a TLD of 2+ alphabetic characters.
 * Max length: 253 characters.
 *
 * @example
 * ```typescript
 * domain.parse('example.com');           // Valid
 * domain.parse('sub.example.co.uk');     // Valid
 * domain.parse('my-domain.org');         // Valid
 * domain.parse('localhost');             // Invalid - no TLD
 * domain.parse('example.c');             // Invalid - TLD too short
 * domain.parse('192.168.1.1');           // Invalid - numeric TLD
 * ```
 */
export const domain = z.string().refine(
  (val) => {
    if (val.length > 253) return false;
    return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(val);
  },
  { message: 'Invalid domain name (must have at least one dot and TLD of 2+ letters)' }
);

/**
 * MikroTik interface name validator.
 * Valid characters: a-z, A-Z, 0-9, -, _, .
 * Must start with alphanumeric. Max length: 64 characters.
 *
 * @example
 * ```typescript
 * interfaceName.parse('ether1');         // Valid
 * interfaceName.parse('vlan.100');       // Valid
 * interfaceName.parse('bridge-1');       // Valid
 * interfaceName.parse('_invalid');       // Invalid - starts with underscore
 * interfaceName.parse('-invalid');       // Invalid - starts with hyphen
 * interfaceName.parse('a'.repeat(65));   // Invalid - too long (>64)
 * ```
 */
export const interfaceName = z
  .string()
  .refine((val) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(val) && val.length <= 64, {
    message: 'Invalid interface name (start with alphanumeric, use [a-zA-Z0-9._-], max 64 chars)',
  });

/**
 * MikroTik comment validator.
 * Max 255 characters, no control characters (ASCII 0-31 and 127).
 *
 * @example
 * ```typescript
 * comment.parse('This is a valid comment');      // Valid
 * comment.parse('Comment with émoji 🚀');       // Valid (UTF-8)
 * comment.parse('a'.repeat(255));                // Valid
 * comment.parse('a'.repeat(256));                // Invalid - too long
 * comment.parse('Comment\nwith newline');       // Invalid - contains control char
 * ```
 */
export const comment = z
  .string()
  .max(255, 'Comment must be 255 characters or less')
  .refine(
    (val) => {
      // eslint-disable-next-line no-control-regex
      return !/[\x00-\x1F\x7F]/.test(val);
    },
    { message: 'Comment cannot contain control characters (ASCII 0-31 and 127)' }
  );

/**
 * Duration string validator.
 * Supports: seconds (s), minutes (m), hours (h), days (d).
 *
 * @example
 * ```typescript
 * duration.parse('30s');     // Valid - 30 seconds
 * duration.parse('5m');      // Valid - 5 minutes
 * duration.parse('2h');      // Valid - 2 hours
 * duration.parse('7d');      // Valid - 7 days
 * duration.parse('30');      // Invalid - missing unit
 * duration.parse('30x');     // Invalid - unknown unit
 * ```
 */
export const duration = z
  .string()
  .refine((val) => /^\d+[smhd]$/.test(val), {
    message: 'Invalid duration (format: 30s|5m|1h|7d, numeric followed by s/m/h/d)',
  });

/**
 * Bandwidth string validator.
 * Supports optional unit suffixes: k (kilobits), m (megabits), g (gigabits).
 *
 * @example
 * ```typescript
 * bandwidth.parse('100');        // Valid - 100 bps
 * bandwidth.parse('100k');       // Valid - 100 Kbps
 * bandwidth.parse('1.5m');       // Valid - 1.5 Mbps
 * bandwidth.parse('1G');         // Valid - 1 Gbps
 * bandwidth.parse('100x');       // Invalid - unknown unit
 * bandwidth.parse('k100');       // Invalid - unit after number
 * ```
 */
export const bandwidth = z
  .string()
  .refine((val) => /^\d+(\.\d+)?[kKmMgG]?$/.test(val), {
    message: 'Invalid bandwidth (format: 100, 100k, 1.5m, 1g; units: k/m/g optional)',
  });

// ============================================================================
// Extended Network Validators (NAS-4A.3)
// ============================================================================

/**
 * Subnet mask validator in dotted decimal format (e.g., 255.255.255.0).
 * Validates that the mask has contiguous 1s followed by contiguous 0s.
 *
 * @example
 * subnetMask.parse('255.255.255.0'); // Valid
 * subnetMask.parse('255.255.0.0');   // Valid
 * subnetMask.parse('255.255.128.0'); // Valid (/17)
 * subnetMask.parse('255.0.255.0');   // Invalid - non-contiguous
 */
export const subnetMask = z.string().refine(
  (val) => {
    const parts = val.split('.');
    if (parts.length !== 4) return false;

    // Validate each octet is a valid number 0-255
    const octets = parts.map((p) => parseInt(p, 10));
    if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;

    // Convert to binary and check for contiguous 1s followed by 0s
    const binary = octets.map((o) => o.toString(2).padStart(8, '0')).join('');

    // Valid masks are all 1s followed by all 0s (e.g., 11111111111111111111111100000000)
    return /^1*0*$/.test(binary);
  },
  { message: 'Invalid subnet mask (must have contiguous bits, e.g., 255.255.255.0)' }
);

/**
 * IP address with port validator (e.g., 192.168.1.1:8080).
 *
 * @example
 * ipWithPort.parse('192.168.1.1:8080'); // Valid
 * ipWithPort.parse('10.0.0.1:443');     // Valid
 * ipWithPort.parse('192.168.1.1');      // Invalid - missing port
 */
export const ipWithPort = z.string().refine(
  (val) => {
    const match = val.match(/^(.+):(\d+)$/);
    if (!match) return false;

    const [, ip, portStr] = match;

    // Validate IP part using ipv4 logic
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    const validIp = parts.every((part) => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
    });
    if (!validIp) return false;

    // Validate port part
    const portNum = parseInt(portStr, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  },
  { message: 'Invalid IP:port format (e.g., 192.168.1.1:8080)' }
);

/**
 * IP range validator (e.g., 192.168.1.1-192.168.1.100).
 * Validates that start IP is less than or equal to end IP.
 *
 * @example
 * ipRange.parse('192.168.1.1-192.168.1.100'); // Valid
 * ipRange.parse('10.0.0.1-10.0.0.254');       // Valid
 * ipRange.parse('192.168.1.100-192.168.1.1'); // Invalid - start > end
 */
export const ipRange = z.string().refine(
  (val) => {
    const [startIp, endIp] = val.split('-');
    if (!startIp || !endIp) return false;

    // Helper to validate and convert IPv4 to number
    const ipToNumber = (ip: string): number | null => {
      const parts = ip.split('.');
      if (parts.length !== 4) return null;

      const octets = parts.map((p) => parseInt(p, 10));
      if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null;
      if (parts.some((p, i) => p !== String(octets[i]))) return null; // No leading zeros

      return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    };

    const startNum = ipToNumber(startIp.trim());
    const endNum = ipToNumber(endIp.trim());

    if (startNum === null || endNum === null) return false;
    return startNum <= endNum;
  },
  { message: 'Invalid IP range (format: 192.168.1.1-192.168.1.100, start must be <= end)' }
);

/**
 * Private IP address validator (RFC 1918).
 * Validates that the IP is in one of the private ranges:
 * - 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
 * - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * - 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
 *
 * @example
 * privateIp.parse('192.168.1.1'); // Valid
 * privateIp.parse('10.0.0.1');    // Valid
 * privateIp.parse('172.16.0.1');  // Valid
 * privateIp.parse('8.8.8.8');     // Invalid - public IP
 */
export const privateIp = z.string().refine(
  (val) => {
    const parts = val.split('.');
    if (parts.length !== 4) return false;

    const octets = parts.map((p) => parseInt(p, 10));
    if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;
    if (parts.some((p, i) => p !== String(octets[i]))) return false; // No leading zeros

    const [a, b] = octets;

    // 10.0.0.0/8
    if (a === 10) return true;

    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    return false;
  },
  { message: 'Must be a private IP address (10.x.x.x, 172.16-31.x.x, or 192.168.x.x)' }
);

/**
 * Public IP address validator.
 * Validates that the IP is NOT in private, loopback, link-local, or reserved ranges.
 *
 * @example
 * publicIp.parse('8.8.8.8');      // Valid
 * publicIp.parse('1.1.1.1');      // Valid
 * publicIp.parse('192.168.1.1');  // Invalid - private
 * publicIp.parse('127.0.0.1');    // Invalid - loopback
 */
export const publicIp = z.string().refine(
  (val) => {
    const parts = val.split('.');
    if (parts.length !== 4) return false;

    const octets = parts.map((p) => parseInt(p, 10));
    if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;
    if (parts.some((p, i) => p !== String(octets[i]))) return false; // No leading zeros

    const [a, b] = octets;

    // Reject private ranges (RFC 1918)
    if (a === 10) return false; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
    if (a === 192 && b === 168) return false; // 192.168.0.0/16

    // Reject loopback (127.0.0.0/8)
    if (a === 127) return false;

    // Reject link-local (169.254.0.0/16)
    if (a === 169 && b === 254) return false;

    // Reject multicast (224.0.0.0/4)
    if (a >= 224 && a <= 239) return false;

    // Reject reserved/broadcast (240.0.0.0/4 and 255.255.255.255)
    if (a >= 240) return false;

    // Reject 0.0.0.0/8
    if (a === 0) return false;

    return true;
  },
  { message: 'Must be a public IP address (not private, loopback, or reserved)' }
);

/**
 * Multicast IP address validator (224.0.0.0/4).
 * Validates that the IP is in the multicast range: 224.0.0.0 - 239.255.255.255
 *
 * @example
 * multicastIp.parse('224.0.0.1');   // Valid
 * multicastIp.parse('239.255.255.255'); // Valid
 * multicastIp.parse('192.168.1.1'); // Invalid - not multicast
 */
export const multicastIp = z.string().refine(
  (val) => {
    const parts = val.split('.');
    if (parts.length !== 4) return false;

    const octets = parts.map((p) => parseInt(p, 10));
    if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;
    if (parts.some((p, i) => p !== String(octets[i]))) return false; // No leading zeros

    // Multicast range: 224.0.0.0 - 239.255.255.255 (first octet 224-239)
    return octets[0] >= 224 && octets[0] <= 239;
  },
  { message: 'Must be a multicast IP address (224.0.0.0 - 239.255.255.255)' }
);

/**
 * Loopback IP address validator (127.0.0.0/8).
 * Validates that the IP is in the loopback range: 127.0.0.0 - 127.255.255.255
 *
 * @example
 * loopbackIp.parse('127.0.0.1');     // Valid
 * loopbackIp.parse('127.255.255.255'); // Valid
 * loopbackIp.parse('192.168.1.1');  // Invalid - not loopback
 */
export const loopbackIp = z.string().refine(
  (val) => {
    const parts = val.split('.');
    if (parts.length !== 4) return false;

    const octets = parts.map((p) => parseInt(p, 10));
    if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;
    if (parts.some((p, i) => p !== String(octets[i]))) return false; // No leading zeros

    // Loopback range: 127.0.0.0/8 (first octet must be 127)
    return octets[0] === 127;
  },
  { message: 'Must be a loopback IP address (127.x.x.x)' }
);

/**
 * Multiple ports validator (comma-separated list of ports).
 * Accepts formats like "80,443,8080" or "22, 80, 443".
 *
 * @example
 * multiPort.parse('80,443');       // Valid
 * multiPort.parse('22, 80, 443');  // Valid
 * multiPort.parse('80');           // Valid (single port)
 * multiPort.parse('80,65536');     // Invalid - port out of range
 */
export const multiPort = z.string().refine(
  (val) => {
    const ports = val.split(',').map((p) => p.trim());
    if (ports.length === 0) return false;

    return ports.every((portStr) => {
      const portNum = parseInt(portStr, 10);
      return !isNaN(portNum) && portNum >= 1 && portNum <= 65535 && portStr === String(portNum);
    });
  },
  { message: 'Invalid port list (comma-separated ports between 1-65535)' }
);

/**
 * Collection of all network validators for convenient bulk import.
 *
 * @example
 * ```typescript
 * import { networkValidators } from '@nasnet/core/forms/network-validators';
 *
 * const schema = z.object({
 *   ipAddress: networkValidators.ipv4,
 *   port: networkValidators.port,
 *   vlan: networkValidators.vlanId
 * });
 * ```
 */
export const networkValidators = {
  ipv4,
  ipv6,
  ipAddress,
  mac,
  cidr,
  cidr6,
  port,
  portString,
  portRange,
  multiPort,
  vlanId,
  vlanIdString,
  wgKey,
  hostname,
  domain,
  interfaceName,
  comment,
  duration,
  bandwidth,
  // Extended validators (NAS-4A.3)
  subnetMask,
  ipWithPort,
  ipRange,
  privateIp,
  publicIp,
  multicastIp,
  loopbackIp,
};

export default networkValidators;
