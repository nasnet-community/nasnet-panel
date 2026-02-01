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
 */
export const ipv4 = z.string().refine(
  (val) => {
    if (!val || val.trim() === '') return false;
    const parts = val.split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      const num = parseInt(part, 10);
      // Ensure no leading zeros (except for "0" itself) and valid range
      return (
        !isNaN(num) && num >= 0 && num <= 255 && part === String(num)
      );
    });
  },
  { message: 'Invalid IPv4 address' }
);

/**
 * IPv6 address validator using Zod's built-in IP validation.
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
 */
export const mac = z.string().refine(
  (val) => /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(val),
  { message: 'Invalid MAC address (format: XX:XX:XX:XX:XX:XX)' }
);

/**
 * CIDR notation validator with proper network validation.
 * Format: 192.168.1.0/24
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
  { message: 'Invalid CIDR notation (format: 192.168.1.0/24)' }
);

/**
 * IPv6 CIDR notation validator.
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
  { message: 'Invalid IPv6 CIDR notation' }
);

/**
 * Port number validator (1-65535).
 */
export const port = z.number().int().min(1).max(65535);

/**
 * Port number as string validator.
 */
export const portString = z.string().refine(
  (val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 65535;
  },
  { message: 'Port must be between 1 and 65535' }
);

/**
 * Port range validator.
 * Accepts single port ("8080") or range ("80-443").
 */
export const portRange = z.string().refine(
  (val) => {
    if (val.includes('-')) {
      const [startStr, endStr] = val.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      return (
        !isNaN(start) &&
        !isNaN(end) &&
        start >= 1 &&
        end <= 65535 &&
        start <= end
      );
    }
    const port = parseInt(val, 10);
    return !isNaN(port) && port >= 1 && port <= 65535;
  },
  { message: 'Invalid port range (1-65535)' }
);

/**
 * VLAN ID validator (1-4094).
 */
export const vlanId = z.number().int().min(1).max(4094);

/**
 * VLAN ID as string validator.
 */
export const vlanIdString = z.string().refine(
  (val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 4094;
  },
  { message: 'VLAN ID must be between 1 and 4094' }
);

/**
 * WireGuard public/private key validator.
 * Base64 encoded, 44 characters ending in =.
 */
export const wgKey = z.string().refine(
  (val) => /^[A-Za-z0-9+/]{43}=$/.test(val),
  { message: 'Invalid WireGuard key' }
);

/**
 * Hostname validator (RFC 1123).
 */
export const hostname = z.string().refine(
  (val) => {
    if (val.length > 253) return false;
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
      val
    );
  },
  { message: 'Invalid hostname' }
);

/**
 * Domain name validator (similar to hostname but stricter for domains).
 */
export const domain = z.string().refine(
  (val) => {
    if (val.length > 253) return false;
    return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(val);
  },
  { message: 'Invalid domain name' }
);

/**
 * MikroTik interface name validator.
 * Valid characters: a-z, A-Z, 0-9, -, _, .
 */
export const interfaceName = z.string().refine(
  (val) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(val) && val.length <= 64,
  { message: 'Invalid interface name' }
);

/**
 * MikroTik comment validator.
 * Max 255 characters, no control characters.
 */
export const comment = z
  .string()
  .max(255, 'Comment must be 255 characters or less')
  .refine(
    (val) => !/[\x00-\x1F\x7F]/.test(val),
    { message: 'Comment cannot contain control characters' }
  );

/**
 * Duration string validator (e.g., "30s", "5m", "1h", "1d").
 */
export const duration = z.string().refine(
  (val) => /^\d+[smhd]$/.test(val),
  { message: 'Invalid duration (format: 30s, 5m, 1h, 1d)' }
);

/**
 * Bandwidth string validator (e.g., "100M", "1G", "10k").
 */
export const bandwidth = z.string().refine(
  (val) => /^\d+(\.\d+)?[kKmMgG]?$/.test(val),
  { message: 'Invalid bandwidth (format: 100M, 1G, 10k)' }
);

/**
 * Network validators collection for easy import.
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
  vlanId,
  vlanIdString,
  wgKey,
  hostname,
  domain,
  interfaceName,
  comment,
  duration,
  bandwidth,
};

export default networkValidators;
