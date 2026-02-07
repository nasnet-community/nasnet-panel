/**
 * DNS Lookup Tool - Validation Schema
 *
 * Zod schema for DNS lookup form validation including hostname validation
 * (RFC 1123), IPv4/IPv6 validation for reverse lookups, and form field constraints.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.2
 */

import { z } from 'zod';
import { DNS_RECORD_TYPES } from './DnsLookupTool.types';

/**
 * Validate hostname according to RFC 1123
 * Maximum 253 characters, labels max 63 characters each
 * Labels can contain alphanumeric and hyphens, cannot start/end with hyphen
 */
function isValidHostname(value: string): boolean {
  if (value.length > 253) return false;
  const labels = value.split('.');
  return labels.every((label) => {
    if (label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    return /^[a-zA-Z0-9-]+$/.test(label);
  });
}

/**
 * Validate IPv4 address for reverse PTR lookups
 */
function isValidIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Validate IPv6 address for reverse PTR lookups
 */
function isValidIPv6(value: string): boolean {
  const addr = value.replace(/^\[|\]$/g, '');
  if (addr.includes('.')) return false; // Skip IPv4-mapped
  const parts = addr.split('::');
  if (parts.length > 2) return false;
  const segments = parts.flatMap((part) => (part === '' ? [] : part.split(':')));
  if (parts.length === 1 && segments.length !== 8) return false;
  if (parts.length === 2 && segments.length > 7) return false;
  return segments.every((seg) => /^[0-9a-fA-F]{1,4}$/.test(seg));
}

export const dnsLookupFormSchema = z.object({
  hostname: z
    .string()
    .min(1, 'Hostname is required')
    .max(253, 'Hostname too long (max 253 characters)')
    .refine(
      (val) => {
        // If it looks like it might be an IPv4 (all parts are digits),
        // validate it strictly as IPv4 (must be exactly 4 octets)
        const parts = val.split('.');
        const allDigits = parts.every((p) => /^\d+$/.test(p));
        if (allDigits && parts.length >= 3) {
          // Looks like an IP attempt - must be valid IPv4
          return isValidIPv4(val);
        }
        // Otherwise, allow hostname or IPv6
        return isValidHostname(val) || isValidIPv6(val);
      },
      'Must be a valid domain name or IP address'
    ),
  recordType: z.enum(DNS_RECORD_TYPES).default('A'),
  server: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === 'all' || isValidIPv4(val) || isValidIPv6(val),
      'Must be a valid IPv4 or IPv6 address'
    ),
  timeout: z.coerce.number().int().min(100).max(30000).default(2000),
});

export type DnsLookupFormValues = z.infer<typeof dnsLookupFormSchema>;
