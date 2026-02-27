/**
 * Address List Validation Schemas
 *
 * Zod schemas for address list entry creation and bulk import validation.
 * Supports IP addresses, CIDR notation, and IP ranges.
 *
 * @module @nasnet/features/firewall/schemas
 */

import { z } from 'zod';

// ============================================
// VALIDATION PATTERNS
// ============================================

// ============================================
// VALIDATION PATTERNS
// ============================================

/**
 * IPv4 address pattern
 * @description Matches IPv4 addresses (e.g., 192.168.1.1)
 */
const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * CIDR notation pattern
 * @description Matches CIDR notation (e.g., 192.168.1.0/24)
 */
const CIDR_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

/**
 * IP range pattern
 * @description Matches IP ranges (e.g., 192.168.1.1-192.168.1.100)
 */
const IP_RANGE_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)-(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Duration pattern for timeout
 * @description Matches duration format with units: s (seconds), m (minutes), h (hours), d (days), w (weeks)
 * Examples: "1d", "12h", "30m", "60s"
 */
const DURATION_PATTERN = /^\d+[smhdw]$/;

/**
 * List name pattern
 * @description Matches alphanumeric names with underscores and hyphens (no spaces or special chars)
 */
const LIST_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates IP address, CIDR notation, or IP range
 * @param val - Value to validate
 * @returns true if valid IP, CIDR, or range format
 */
function validateIPOrCIDR(val: string): boolean {
  return IPV4_PATTERN.test(val) || CIDR_PATTERN.test(val) || IP_RANGE_PATTERN.test(val);
}

/**
 * Validates IP range format and ensures start < end
 * @param val - IP range string (e.g., "192.168.1.1-192.168.1.100")
 * @returns true if valid range with start address less than end address
 */
function validateIPRange(val: string): boolean {
  if (!IP_RANGE_PATTERN.test(val)) {
    return false;
  }

  const [start, end] = val.split('-');
  const startOctets = start.split('.').map(Number);
  const endOctets = end.split('.').map(Number);

  // Compare octets to ensure start < end
  for (let i = 0; i < 4; i++) {
    if (startOctets[i] < endOctets[i]) {
      return true;
    }
    if (startOctets[i] > endOctets[i]) {
      return false;
    }
  }

  // All octets are equal, invalid range
  return false;
}

// ============================================
// SCHEMAS
// ============================================

// ============================================
// SCHEMAS
// ============================================

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
export const addressListEntrySchema = z.object({
  list: z
    .string()
    .min(1, 'List name is required')
    .max(64, 'List name must be 64 characters or less')
    .regex(
      LIST_NAME_PATTERN,
      'List name can only contain letters, numbers, underscores, and hyphens'
    ),
  address: z
    .string()
    .min(1, 'Address is required')
    .refine(validateIPOrCIDR, {
      message:
        'Must be a valid IPv4 address, CIDR notation (e.g., 192.168.1.0/24), or IP range (e.g., 192.168.1.1-192.168.1.100)',
    })
    .refine(
      (val) => {
        // If it looks like a range, validate it properly
        if (val.includes('-')) {
          return validateIPRange(val);
        }
        return true;
      },
      {
        message: 'Invalid IP range - start address must be less than end address',
      }
    ),
  comment: z
    .string()
    .max(200, 'Comment must be 200 characters or less')
    .optional()
    .or(z.literal('')),
  timeout: z
    .string()
    .regex(DURATION_PATTERN, 'Timeout must be a valid duration (e.g., "1d", "12h", "30m")')
    .optional()
    .or(z.literal('')),
});

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
export const bulkAddressImportSchema = z.array(
  z.object({
    address: z.string().refine(validateIPOrCIDR, 'Invalid IP format'),
    comment: z.string().max(200).optional(),
    timeout: z.string().regex(DURATION_PATTERN).optional(),
  })
);

export type BulkAddressImportData = z.infer<typeof bulkAddressImportSchema>;

// ============================================
// EXPORTS
// ============================================

// ============================================
// PATTERN EXPORTS
// ============================================

export {
  IPV4_PATTERN as ipv4Pattern,
  CIDR_PATTERN as cidrPattern,
  IP_RANGE_PATTERN as ipRangePattern,
  DURATION_PATTERN as durationPattern,
  LIST_NAME_PATTERN as listNamePattern,
  validateIPOrCIDR,
  validateIPRange,
};

// Also export with new naming convention for new code
export { IPV4_PATTERN, CIDR_PATTERN, IP_RANGE_PATTERN, DURATION_PATTERN, LIST_NAME_PATTERN };
