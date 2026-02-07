/**
 * DNS Static Entry Validation Schema
 *
 * Zod schemas for validating DNS static hostname-to-IP mappings.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { z } from 'zod';

/**
 * RFC 1123 Hostname Pattern
 *
 * Valid hostnames must:
 * - Start and end with alphanumeric character
 * - Contain only letters, digits, hyphens, and dots
 * - Not start or end with hyphen or dot
 * - Each label (part between dots) max 63 chars
 * - Total hostname max 253 chars
 *
 * Examples:
 * - Valid: "nas.local", "my-server.lan", "printer.office.local", "webserver"
 * - Invalid: "-invalid", "has space", ".starts-with-dot", "ends-with-dot.", "bad..double"
 */
const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

/**
 * Schema for DNS static entry form
 *
 * Validates hostname-to-IP mapping configuration including:
 * - Hostname (RFC 1123 compliant)
 * - IP address (IPv4)
 * - TTL (Time-to-live in seconds, 0-7 days)
 * - Optional comment
 */
export const dnsStaticEntrySchema = z.object({
  /**
   * Hostname in RFC 1123 format
   * Must be 1-253 characters, alphanumeric with hyphens and dots
   */
  name: z
    .string({
      required_error: 'Hostname is required',
    })
    .min(1, 'Hostname is required')
    .max(253, 'Hostname too long (max 253 characters)')
    .regex(
      hostnamePattern,
      'Invalid hostname format (use letters, digits, hyphens, dots)'
    ),

  /**
   * IPv4 address this hostname resolves to
   * Must be valid IPv4 dotted decimal notation
   */
  address: z.string().ip({
    version: 'v4',
    message: 'Invalid IPv4 address',
  }),

  /**
   * Time-to-live in seconds
   * How long DNS clients should cache this entry
   *
   * Range: 0 to 604800 seconds (0 to 7 days)
   * Default: 86400 seconds (1 day)
   *
   * Common values:
   * - 60 = 1 minute (very dynamic)
   * - 3600 = 1 hour
   * - 86400 = 1 day (recommended)
   * - 604800 = 7 days (very stable)
   */
  ttl: z
    .number({
      required_error: 'TTL is required',
      invalid_type_error: 'TTL must be a number',
    })
    .min(0, 'TTL must be positive')
    .max(604800, 'TTL cannot exceed 7 days (604800 seconds)')
    .default(86400), // Default to 1 day

  /**
   * Optional comment/description for this entry
   * Max 255 characters
   *
   * Example: "Network storage", "Office printer", "Development server"
   */
  comment: z
    .string()
    .max(255, 'Comment too long (max 255 characters)')
    .optional(),
});

/**
 * TypeScript type inferred from dnsStaticEntrySchema
 * Use this for form values and component props
 */
export type DNSStaticEntryFormValues = z.infer<typeof dnsStaticEntrySchema>;
