/**
 * DNS Static Entry Validation Schema
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * @description Zod schemas for validating DNS static hostname-to-IP mappings.
 * Includes RFC 1123 hostname validation, IPv4 validation, and TTL constraints.
 */
import { z } from 'zod';
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
export declare const dnsStaticEntrySchema: z.ZodObject<{
    /**
     * Hostname in RFC 1123 format
     * Length: 1-253 characters
     * Characters: alphanumeric, hyphens (-), dots (.)
     * Must start and end with alphanumeric character
     *
     * Used for DNS resolution: "nas.local" resolves to the specified IPv4 address
     */
    name: z.ZodString;
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
    address: z.ZodString;
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
    ttl: z.ZodDefault<z.ZodNumber>;
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
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    address: string;
    ttl: number;
    comment?: string | undefined;
}, {
    name: string;
    address: string;
    comment?: string | undefined;
    ttl?: number | undefined;
}>;
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
//# sourceMappingURL=dns-static-entry.schema.d.ts.map