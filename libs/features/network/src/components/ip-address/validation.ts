/**
 * IP Address Form Validation Schema
 * NAS-6.2: IP Address Management
 *
 * Provides Zod validation schemas for IP address forms with CIDR notation,
 * interface selection, and comment validation.
 */

import { z } from 'zod';
import { cidr, comment } from '@nasnet/core/forms';

/**
 * IP Address form input schema with CIDR validation.
 *
 * Validates:
 * - address: CIDR notation (e.g., "192.168.1.1/24")
 * - interfaceId: Non-empty interface identifier
 * - comment: Optional comment (max 255 chars, no control characters)
 * - disabled: Boolean flag for interface disable state
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(ipAddressFormSchema),
 *   defaultValues: {
 *     address: '',
 *     interfaceId: '',
 *     comment: '',
 *     disabled: false,
 *   },
 * });
 * ```
 */
export const ipAddressFormSchema = z.object({
  /**
   * IP address in CIDR notation.
   * Format: 192.168.1.1/24
   * Uses the existing cidr validator from @nasnet/core/forms
   */
  address: cidr.refine(
    (val) => {
      // Additional validation: ensure the address is parseable
      const [ip, prefix] = val.split('/');
      if (!ip || !prefix) return false;

      // Validate IP has 4 octets
      const octets = ip.split('.');
      if (octets.length !== 4) return false;

      // Validate each octet is a number 0-255
      const validOctets = octets.every((octet) => {
        const num = parseInt(octet, 10);
        return !isNaN(num) && num >= 0 && num <= 255 && octet === String(num);
      });

      if (!validOctets) return false;

      // Validate prefix length is 0-32
      const prefixNum = parseInt(prefix, 10);
      return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32;
    },
    { message: 'Invalid CIDR notation. Format: 192.168.1.1/24' }
  ),

  /**
   * Interface ID where the IP address will be assigned.
   * Must be a non-empty string (RouterOS interface name or ID).
   */
  interfaceId: z.string().min(1, 'Interface is required'),

  /**
   * Optional comment for the IP address.
   * Max 255 characters, no control characters.
   * Uses the existing comment validator from @nasnet/core/forms.
   */
  comment: comment.optional(),

  /**
   * Disabled state for the IP address.
   * If true, the IP address will be present in RouterOS but not active.
   */
  disabled: z.boolean().default(false),
});

/**
 * Inferred TypeScript type from the schema.
 * Use this type for form state and submission handlers.
 *
 * @example
 * ```tsx
 * const handleSubmit = async (data: IpAddressFormData) => {
 *   await createIpAddress({
 *     variables: {
 *       routerId: router.id,
 *       input: data,
 *     },
 *   });
 * };
 * ```
 */
export type IpAddressFormData = z.infer<typeof ipAddressFormSchema>;

/**
 * Default values for IP address form.
 * Use this to initialize the form or reset after submission.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: zodResolver(ipAddressFormSchema),
 *   defaultValues: ipAddressFormDefaults,
 * });
 * ```
 */
export const ipAddressFormDefaults: IpAddressFormData = {
  address: '',
  interfaceId: '',
  comment: '',
  disabled: false,
};
