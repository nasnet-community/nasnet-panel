/**
 * Route Lookup Tool - Validation Schema
 *
 * Zod schema for route lookup form validation including IPv4 address validation
 * for destination (required) and source (optional) fields.
 *
 * @see Story NAS-6.10 - Implement Route Lookup Diagnostic - Task 8
 */

import { z } from 'zod';

/**
 * Validate IPv4 address
 * Ensures exactly 4 octets, each 0-255, no leading zeros
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
 * Route lookup form validation schema
 *
 * Fields:
 * - destination: Required IPv4 address for route lookup
 * - source: Optional IPv4 address for policy routing testing
 */
export const routeLookupFormSchema = z.object({
  destination: z
    .string()
    .min(1, 'Destination IP address is required')
    .refine(isValidIPv4, 'Must be a valid IPv4 address (e.g., 192.168.1.1)'),
  source: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidIPv4(val),
      'Must be a valid IPv4 address (e.g., 10.0.0.1)'
    ),
});

/**
 * Type inference from Zod schema
 */
export type RouteLookupFormValues = z.infer<typeof routeLookupFormSchema>;
