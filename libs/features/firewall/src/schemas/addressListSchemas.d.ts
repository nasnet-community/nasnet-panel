/**
 * Address List Validation Schemas
 *
 * Zod schemas for address list entry creation and bulk import validation.
 * Supports IP addresses, CIDR notation, and IP ranges.
 *
 * @module @nasnet/features/firewall/schemas
 */
import { z } from 'zod';
/**
 * IPv4 address pattern
 * @description Matches IPv4 addresses (e.g., 192.168.1.1)
 */
declare const IPV4_PATTERN: RegExp;
/**
 * CIDR notation pattern
 * @description Matches CIDR notation (e.g., 192.168.1.0/24)
 */
declare const CIDR_PATTERN: RegExp;
/**
 * IP range pattern
 * @description Matches IP ranges (e.g., 192.168.1.1-192.168.1.100)
 */
declare const IP_RANGE_PATTERN: RegExp;
/**
 * Duration pattern for timeout
 * @description Matches duration format with units: s (seconds), m (minutes), h (hours), d (days), w (weeks)
 * Examples: "1d", "12h", "30m", "60s"
 */
declare const DURATION_PATTERN: RegExp;
/**
 * List name pattern
 * @description Matches alphanumeric names with underscores and hyphens (no spaces or special chars)
 */
declare const LIST_NAME_PATTERN: RegExp;
/**
 * Validates IP address, CIDR notation, or IP range
 * @param val - Value to validate
 * @returns true if valid IP, CIDR, or range format
 */
declare function validateIPOrCIDR(val: string): boolean;
/**
 * Validates IP range format and ensures start < end
 * @param val - IP range string (e.g., "192.168.1.1-192.168.1.100")
 * @returns true if valid range with start address less than end address
 */
declare function validateIPRange(val: string): boolean;
/**
 * Address list entry creation schema
 * @description Validates individual address list entry with optional comment and timeout
 *
 * @example
 * ```ts
 * const data = addressListEntrySchema.parse({
 *   list: 'blocklist',
 *   address: '192.168.1.100',
 *   comment: 'Test entry',
 *   timeout: '1d',
 * });
 * ```
 */
export declare const addressListEntrySchema: z.ZodObject<{
    list: z.ZodString;
    address: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    comment: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    timeout: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    address: string;
    list: string;
    comment?: string | undefined;
    timeout?: string | undefined;
}, {
    address: string;
    list: string;
    comment?: string | undefined;
    timeout?: string | undefined;
}>;
export type AddressListEntryFormData = z.infer<typeof addressListEntrySchema>;
/**
 * Bulk address input schema for import validation
 * @description Validates array of address entries for batch import operations
 *
 * @example
 * ```ts
 * const entries = bulkAddressImportSchema.parse([
 *   { address: '192.168.1.100', comment: 'Entry 1' },
 *   { address: '192.168.1.0/24', comment: 'Subnet' },
 * ]);
 * ```
 */
export declare const bulkAddressImportSchema: z.ZodArray<z.ZodObject<{
    address: z.ZodEffects<z.ZodString, string, string>;
    comment: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    address: string;
    comment?: string | undefined;
    timeout?: string | undefined;
}, {
    address: string;
    comment?: string | undefined;
    timeout?: string | undefined;
}>, "many">;
export type BulkAddressImportData = z.infer<typeof bulkAddressImportSchema>;
export { IPV4_PATTERN as ipv4Pattern, CIDR_PATTERN as cidrPattern, IP_RANGE_PATTERN as ipRangePattern, DURATION_PATTERN as durationPattern, LIST_NAME_PATTERN as listNamePattern, validateIPOrCIDR, validateIPRange, };
export { IPV4_PATTERN, CIDR_PATTERN, IP_RANGE_PATTERN, DURATION_PATTERN, LIST_NAME_PATTERN, };
//# sourceMappingURL=addressListSchemas.d.ts.map