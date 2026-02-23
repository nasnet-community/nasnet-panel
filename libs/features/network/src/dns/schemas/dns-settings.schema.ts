/**
 * DNS Settings Validation Schema
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * @description Zod schemas for validating DNS server configuration and cache settings.
 * Includes IPv4 validation, server list validation, and RouterOS-specific constraints
 * (cache size limits: 512-10240 KB).
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/** Minimum DNS cache size in kilobytes (RouterOS limit) */
const DNS_CACHE_SIZE_MIN_KB = 512;

/** Maximum DNS cache size in kilobytes (RouterOS limit) */
const DNS_CACHE_SIZE_MAX_KB = 10240;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Zod schema for validating a single DNS server IPv4 address
 *
 * Validates IPv4 format only (IPv6 not supported by RouterOS in current implementation).
 *
 * @example
 * ```typescript
 * dnsServerSchema.parse('1.1.1.1')        // ✓ Valid
 * dnsServerSchema.parse('8.8.8.8')        // ✓ Valid
 * dnsServerSchema.parse('256.1.1.1')      // ✗ Invalid (octet > 255)
 * dnsServerSchema.parse('2001:db8::1')    // ✗ Invalid (IPv6 not supported)
 * ```
 */
export const dnsServerSchema = z.string().ip({
  version: 'v4',
  message: 'Must be a valid IPv4 address',
});

/**
 * Zod schema for DNS settings form validation
 *
 * Validates complete DNS configuration including:
 * - Static servers list (array of IPv4 addresses)
 * - Remote requests setting (boolean for security)
 * - Cache size (RouterOS enforces limits)
 *
 * @example
 * ```typescript
 * const validConfig = {
 *   servers: ['1.1.1.1', '8.8.8.8'],
 *   allowRemoteRequests: false,
 *   cacheSize: 2048,
 * };
 *
 * dnsSettingsSchema.parse(validConfig) // ✓ Valid
 *
 * const invalidConfig = {
 *   servers: ['256.1.1.1'],  // Invalid IP
 *   allowRemoteRequests: false,
 *   cacheSize: 100,           // Below minimum
 * };
 *
 * dnsSettingsSchema.parse(invalidConfig) // ✗ Throws validation error
 * ```
 */
export const dnsSettingsSchema = z.object({
  /**
   * Array of static DNS server IPv4 addresses
   * Used for DNS queries when configured.
   */
  servers: z.array(dnsServerSchema),

  /**
   * Whether to allow remote DNS requests
   * Security consideration: when false, DNS resolves local queries only.
   */
  allowRemoteRequests: z.boolean(),

  /**
   * DNS cache size in kilobytes
   * RouterOS enforces limits: min 512 KB, max 10240 KB (10 MB)
   * Larger cache = more memory, better hit rate; smaller cache = lower memory usage
   */
  cacheSize: z
    .number({
      required_error: 'Cache size is required',
      invalid_type_error: 'Cache size must be a number',
    })
    .min(DNS_CACHE_SIZE_MIN_KB, `Cache size must be at least ${DNS_CACHE_SIZE_MIN_KB} KB`)
    .max(DNS_CACHE_SIZE_MAX_KB, `Cache size cannot exceed ${DNS_CACHE_SIZE_MAX_KB} KB`),
});

// ============================================================================
// Type Exports
// ============================================================================

/**
 * TypeScript type inferred from dnsSettingsSchema
 * Use this for form values, component props, and API payloads.
 *
 * @typedef {Object} DNSSettingsFormValues
 * @property {string[]} servers - Array of IPv4 DNS server addresses
 * @property {boolean} allowRemoteRequests - Allow remote DNS queries
 * @property {number} cacheSize - Cache size in kilobytes (512-10240)
 */
export type DNSSettingsFormValues = z.infer<typeof dnsSettingsSchema>;
