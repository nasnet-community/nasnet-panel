/**
 * DNS Static Entry Validation Schema
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * @description Zod schemas for validating DNS static hostname-to-IP mappings.
 * Includes RFC 1123 hostname validation, IPv4 validation, and TTL constraints.
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * RFC 1123 Hostname Validation Pattern
 *
 * Valid hostnames must comply with RFC 1123 standard:
 * - Start and end with alphanumeric character
 * - Contain only letters (A-Z, a-z), digits (0-9), hyphens (-), and dots (.)
 * - Not start or end with hyphen or dot
 * - Each label (part between dots) maximum 63 characters
 * - Total hostname maximum 253 characters
 *
 * @example Valid hostnames:
 * - "nas.local" (simple subdomain)
 * - "my-server.lan" (hyphenated)
 * - "printer.office.local" (multi-level)
 * - "webserver" (single label)
 *
 * @example Invalid hostnames:
 * - "-invalid" (starts with hyphen)
 * - "has space" (contains space)
 * - ".starts-with-dot" (starts with dot)
 * - "ends-with-dot." (ends with dot)
 * - "bad..double" (consecutive dots)
 */
const HOSTNAME_PATTERN =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

/** Minimum TTL value in seconds (0 seconds) */
const TTL_MIN_SECONDS = 0;

/** Maximum TTL value in seconds (7 days) */
const TTL_MAX_SECONDS = 604800;

/** Default TTL value in seconds (1 day) */
const TTL_DEFAULT_SECONDS = 86400;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Zod schema for DNS static entry form validation
 *
 * Validates hostname-to-IP mapping configuration including:
 * - Hostname (RFC 1123 compliant)
 * - IP address (IPv4)
 * - TTL (Time-to-live in seconds, 0-7 days)
 * - Optional comment
 *
 * @example
 * ```typescript
 * const validEntry = {
 *   name: 'nas.local',
 *   address: '192.168.1.50',
 *   ttl: 86400,
 *   comment: 'Network storage'
 * };
 *
 * dnsStaticEntrySchema.parse(validEntry) // ✓ Valid
 *
 * const invalidEntry = {
 *   name: '-invalid.local',  // Invalid hostname format
 *   address: '256.1.1.1',    // Invalid IP (octet > 255)
 *   ttl: 999999,             // Exceeds maximum (7 days)
 * };
 *
 * dnsStaticEntrySchema.parse(invalidEntry) // ✗ Throws validation error
 * ```
 */
export const dnsStaticEntrySchema = z.object({
  /**
   * Hostname in RFC 1123 format
   * Length: 1-253 characters
   * Characters: alphanumeric, hyphens (-), dots (.)
   * Must start and end with alphanumeric character
   *
   * Used for DNS resolution: "nas.local" resolves to the specified IPv4 address
   */
  name: z
    .string({
      required_error: 'Hostname is required',
    })
    .min(1, 'Hostname is required')
    .max(253, 'Hostname too long (max 253 characters)')
    .regex(HOSTNAME_PATTERN, 'Invalid hostname format. Use letters, digits, hyphens, and dots.'),

  /**
   * IPv4 address this hostname resolves to
   * Format: IPv4 dotted decimal notation (e.g., 192.168.1.50)
   * Validation: standard IPv4 format check
   *
   * Common examples:
   * - "192.168.1.50" (private network)
   * - "10.0.0.100" (private network)
   * - "8.8.8.8" (public DNS)
   */
  address: z.string().ip({
    version: 'v4',
    message: 'Must be a valid IPv4 address',
  }),

  /**
   * Time-to-live in seconds
   * How long DNS clients should cache this static entry
   *
   * Range: 0 to 604800 seconds (0 to 7 days)
   * Default: 86400 seconds (1 day)
   *
   * Recommendations by use case:
   * - 60 seconds = 1 minute (very dynamic content, dev/test environments)
   * - 3600 seconds = 1 hour (moderately dynamic)
   * - 86400 seconds = 1 day (stable, production recommended)
   * - 604800 seconds = 7 days (very stable, rarely changes)
   *
   * Lower TTL = faster updates after IP change, more DNS queries
   * Higher TTL = better performance, slower updates after IP change
   */
  ttl: z
    .number({
      required_error: 'TTL is required',
      invalid_type_error: 'TTL must be a number',
    })
    .min(TTL_MIN_SECONDS, `TTL must be at least ${TTL_MIN_SECONDS} seconds`)
    .max(TTL_MAX_SECONDS, `TTL cannot exceed ${TTL_MAX_SECONDS} seconds (7 days)`)
    .default(TTL_DEFAULT_SECONDS),

  /**
   * Optional comment/description for this DNS entry
   * Maximum: 255 characters
   * Purpose: helps document why this entry exists and what service it points to
   *
   * Examples:
   * - "Network storage device"
   * - "Office laser printer"
   * - "Development API server"
   * - "Mail server (backup)"
   */
  comment: z.string().max(255, 'Comment too long (max 255 characters)').optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

/**
 * TypeScript type inferred from dnsStaticEntrySchema
 * Use this for form values, component props, and API payloads.
 *
 * @typedef {Object} DNSStaticEntryFormValues
 * @property {string} name - RFC 1123 compliant hostname (1-253 chars)
 * @property {string} address - IPv4 address in dotted decimal notation
 * @property {number} ttl - Time-to-live in seconds (0-604800)
 * @property {string} [comment] - Optional description (max 255 chars)
 *
 * @example
 * ```typescript
 * const entry: DNSStaticEntryFormValues = {
 *   name: 'nas.local',
 *   address: '192.168.1.50',
 *   ttl: 86400,
 *   comment: 'Network storage'
 * };
 * ```
 */
export type DNSStaticEntryFormValues = z.infer<typeof dnsStaticEntrySchema>;
