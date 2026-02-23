/**
 * DNS Lookup Tool - Validation Schema
 *
 * Zod schema for DNS lookup form validation including hostname validation
 * (RFC 1123), IPv4/IPv6 validation for reverse lookups, and form field constraints.
 *
 * @description Provides actionable validation rules for DNS lookup inputs:
 * - Hostname: RFC 1123 compliant (max 253 chars, labels max 63)
 * - IPv4: Standard dotted-quad notation (0.0.0.0 to 255.255.255.255)
 * - IPv6: Full and compressed notation support
 * - Record Type: Limited to supported DNS record types (A, AAAA, MX, etc.)
 * - Timeout: 100-30000ms range for query timeout
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.2
 * @see RFC 1123 - Requirements for Internet Hosts
 */

import { z } from 'zod';
import { DNS_RECORD_TYPES } from './DnsLookupTool.types';

/** Maximum length for DNS hostnames per RFC 1123 */
const MAX_HOSTNAME_LENGTH = 253;

/** Maximum length for individual DNS labels (parts between dots) */
const MAX_LABEL_LENGTH = 63;

/** Minimum timeout for DNS queries in milliseconds */
const MIN_DNS_TIMEOUT_MS = 100;

/** Maximum timeout for DNS queries in milliseconds */
const MAX_DNS_TIMEOUT_MS = 30000;

/** Default timeout for DNS queries in milliseconds */
const DEFAULT_DNS_TIMEOUT_MS = 2000;

/**
 * Validate hostname according to RFC 1123.
 *
 * Rules:
 * - Max 253 characters total
 * - Each label (part between dots) max 63 characters
 * - Labels contain alphanumeric and hyphens only
 * - Labels cannot start or end with hyphen
 *
 * @param value - Hostname to validate
 * @returns true if hostname is valid per RFC 1123
 */
function isValidHostname(value: string): boolean {
  if (value.length > MAX_HOSTNAME_LENGTH) return false;
  const labels = value.split('.');
  return labels.every((label) => {
    if (label.length === 0 || label.length > MAX_LABEL_LENGTH) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    return /^[a-zA-Z0-9-]+$/.test(label);
  });
}

/**
 * Validate IPv4 address (standard dotted-quad notation).
 *
 * Rules:
 * - Must have exactly 4 octets
 * - Each octet must be 0-255
 * - No leading zeros (part must match num.toString() to catch "01")
 *
 * @param value - IPv4 address to validate
 * @returns true if IPv4 is valid
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
 * Validate IPv6 address (full and compressed notation).
 *
 * Rules:
 * - Supports full notation (8 groups) and compressed (::) notation
 * - Groups are 1-4 hex digits
 * - At most one :: (double colon) compression
 * - Strips optional bracket notation [::1]
 *
 * @param value - IPv6 address to validate
 * @returns true if IPv6 is valid
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

/**
 * Zod schema for DNS lookup form validation.
 *
 * Validates:
 * - hostname: Domain name (RFC 1123) or IP address (IPv4/IPv6)
 * - recordType: DNS record type (A, AAAA, MX, TXT, etc.)
 * - server: Optional DNS server IP (IPv4/IPv6) or "all" for comparison
 * - timeout: Query timeout (100-30000ms)
 */
export const dnsLookupFormSchema = z.object({
  hostname: z
    .string()
    .min(1, 'Hostname is required. Enter a domain name like "example.com" or an IP address.')
    .max(253, `Hostname too long (max ${MAX_HOSTNAME_LENGTH} characters).`)
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
      'Enter a valid domain name (e.g., "example.com") or IP address (e.g., "8.8.8.8" or "2001:4860:4860::8888").'
    ),
  recordType: z.enum(DNS_RECORD_TYPES).default('A'),
  server: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === 'all' || isValidIPv4(val) || isValidIPv6(val),
      'DNS server must be a valid IPv4 (e.g., "8.8.8.8") or IPv6 address, or "all" to query all configured servers.'
    ),
  timeout: z
    .coerce
    .number()
    .int()
    .min(MIN_DNS_TIMEOUT_MS, `Timeout must be at least ${MIN_DNS_TIMEOUT_MS}ms.`)
    .max(MAX_DNS_TIMEOUT_MS, `Timeout must be at most ${MAX_DNS_TIMEOUT_MS}ms.`)
    .default(DEFAULT_DNS_TIMEOUT_MS),
});

export type DnsLookupFormValues = z.infer<typeof dnsLookupFormSchema>;
