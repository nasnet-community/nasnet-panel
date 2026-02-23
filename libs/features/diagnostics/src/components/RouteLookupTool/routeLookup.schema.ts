/**
 * Route Lookup Tool - Validation Schema
 *
 * Zod schema for route lookup form validation including IPv4 address validation
 * for destination (required) and source (optional) fields.
 *
 * Error messages are specific and actionable, guiding users to correct input
 * format. All validation is performed client-side via Zod refinements.
 *
 * @see Story NAS-6.10 - Implement Route Lookup Diagnostic - Task 8
 */

import { z } from 'zod';

/**
 * Validate IPv4 address format
 *
 * Ensures exactly 4 octets in range 0-255, no leading zeros, and no
 * invalid characters. Provides strict validation to catch user input errors
 * early before sending to backend.
 *
 * @param value - String to validate
 * @returns true if valid IPv4, false otherwise
 *
 * @example
 * ```
 * isValidIPv4('192.168.1.1')    // true
 * isValidIPv4('192.168.01.1')   // false (leading zero)
 * isValidIPv4('192.168.1.256')  // false (256 > 255)
 * isValidIPv4('192.168.1')      // false (3 octets)
 * ```
 */
function isValidIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    // Ensure: valid number, in range, no leading zeros
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Route lookup form validation schema
 *
 * Validates form input for the route lookup diagnostic tool. Provides
 * actionable error messages to guide user input correction.
 *
 * Fields:
 * - `destination`: Required IPv4 address for route lookup (destination IP)
 * - `source`: Optional IPv4 address for policy routing testing (source IP)
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(routeLookupFormSchema),
 *   defaultValues: { destination: '', source: '' }
 * });
 *
 * // Schema validates:
 * // - destination: required, valid IPv4
 * // - source: optional, valid IPv4 if provided
 * ```
 */
export const routeLookupFormSchema = z.object({
  destination: z
    .string()
    .min(1, 'Destination IP address is required')
    .refine(isValidIPv4, {
      message: 'Must be a valid IPv4 address (e.g., 192.168.1.1)',
    }),
  source: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidIPv4(val),
      {
        message: 'Must be a valid IPv4 address (e.g., 10.0.0.1)',
      }
    ),
});

/**
 * Type-safe form values inferred from Zod schema
 *
 * Use this type for form state, props, and function parameters to ensure
 * type safety across the route lookup feature.
 */
export type RouteLookupFormValues = z.infer<typeof routeLookupFormSchema>;
