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

/**
 * IPv4 address pattern (e.g., 192.168.1.1)
 */
const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * CIDR notation pattern (e.g., 192.168.1.0/24)
 */
const cidrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

/**
 * IP range pattern (e.g., 192.168.1.1-192.168.1.100)
 */
const ipRangePattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)-(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Duration pattern for timeout (e.g., "1d", "12h", "30m", "60s")
 * Units: s (seconds), m (minutes), h (hours), d (days), w (weeks)
 */
const durationPattern = /^\d+[smhdw]$/;

/**
 * List name pattern - alphanumeric, underscores, and hyphens only
 */
const listNamePattern = /^[a-zA-Z0-9_-]+$/;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates IP address, CIDR notation, or IP range
 * @param val - Value to validate
 * @returns true if valid IP, CIDR, or range
 */
function validateIPOrCIDR(val: string): boolean {
  return ipv4Pattern.test(val) || cidrPattern.test(val) || ipRangePattern.test(val);
}

/**
 * Validates IP range format and ensures start < end
 * @param val - IP range string (e.g., "192.168.1.1-192.168.1.100")
 * @returns true if valid range with start < end
 */
function validateIPRange(val: string): boolean {
  if (!ipRangePattern.test(val)) {
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

/**
 * Address list entry creation schema
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
    .regex(listNamePattern, 'List name can only contain letters, numbers, underscores, and hyphens'),
  address: z
    .string()
    .min(1, 'Address is required')
    .refine(validateIPOrCIDR, {
      message: 'Must be a valid IPv4 address, CIDR notation (e.g., 192.168.1.0/24), or IP range (e.g., 192.168.1.1-192.168.1.100)'
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
        message: 'Invalid IP range - start address must be less than end address'
      }
    ),
  comment: z.string().max(200, 'Comment must be 200 characters or less').optional().or(z.literal('')),
  timeout: z
    .string()
    .regex(durationPattern, 'Timeout must be a valid duration (e.g., "1d", "12h", "30m")')
    .optional()
    .or(z.literal('')),
});

export type AddressListEntryFormData = z.infer<typeof addressListEntrySchema>;

/**
 * Bulk address input schema for import validation
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
    timeout: z.string().regex(durationPattern).optional(),
  })
);

export type BulkAddressImportData = z.infer<typeof bulkAddressImportSchema>;

// ============================================
// EXPORTS
// ============================================

export {
  ipv4Pattern,
  cidrPattern,
  ipRangePattern,
  durationPattern,
  listNamePattern,
  validateIPOrCIDR,
  validateIPRange,
};
