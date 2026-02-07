/**
 * DNS Settings Validation Schema
 *
 * Zod schemas for validating DNS server configuration and cache settings.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { z } from 'zod';

/**
 * Schema for validating a single DNS server IP address
 *
 * Validates IPv4 format only (IPv6 not supported by RouterOS in current implementation).
 *
 * Examples:
 * - Valid: "1.1.1.1", "8.8.8.8", "192.168.1.1"
 * - Invalid: "256.1.1.1", "abc", "2001:db8::1"
 */
export const dnsServerSchema = z.string().ip({
  version: 'v4',
  message: 'Invalid IPv4 address',
});

/**
 * Schema for DNS settings form
 *
 * Validates complete DNS configuration including:
 * - Static servers list (array of IPv4 addresses)
 * - Remote requests setting (boolean)
 * - Cache size (RouterOS limit: 512-10240 KB)
 */
export const dnsSettingsSchema = z.object({
  /** Array of static DNS server IPv4 addresses */
  servers: z.array(dnsServerSchema),

  /** Whether to allow remote DNS requests (security consideration) */
  allowRemoteRequests: z.boolean(),

  /**
   * DNS cache size in kilobytes
   * RouterOS enforces limits: min 512 KB, max 10240 KB (10 MB)
   */
  cacheSize: z
    .number({
      required_error: 'Cache size is required',
      invalid_type_error: 'Cache size must be a number',
    })
    .min(512, 'Cache size must be at least 512 KB')
    .max(10240, 'Cache size cannot exceed 10240 KB'),
});

/**
 * TypeScript type inferred from dnsSettingsSchema
 * Use this for form values and component props
 */
export type DNSSettingsFormValues = z.infer<typeof dnsSettingsSchema>;
