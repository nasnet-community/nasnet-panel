/**
 * DHCP Client Configuration Validation Schema
 *
 * Zod schemas for validating DHCP WAN client configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 2: DHCP)
 */

import { z } from 'zod';

/**
 * Schema for DHCP client configuration form
 *
 * Validates WAN interface DHCP client settings including:
 * - Interface selection (required)
 * - Default route configuration
 * - DNS and NTP peer settings
 * - Optional comment field
 *
 * RouterOS constraints:
 * - Interface must exist and be valid
 * - Only one DHCP client allowed per interface
 * - Comment max length: 255 characters
 */
export const dhcpClientSchema = z.object({
  /**
   * Physical interface name for DHCP client
   * Examples: "ether1", "ether2", "sfp1"
   */
  interface: z
    .string({
      required_error: 'Interface is required',
      invalid_type_error: 'Interface must be a valid string',
    })
    .min(1, 'Interface cannot be empty')
    .max(64, 'Interface name too long'),

  /**
   * Whether to add default route via DHCP gateway
   * Default: true
   * Warning: Disabling may cause connectivity issues
   */
  addDefaultRoute: z.boolean().default(true),

  /**
   * Whether to use DNS servers provided by DHCP
   * Default: true
   * If disabled, static DNS configuration will be used
   */
  usePeerDNS: z.boolean().default(true),

  /**
   * Whether to use NTP servers provided by DHCP
   * Default: false
   * If enabled, time sync will use DHCP-provided NTP servers
   */
  usePeerNTP: z.boolean().default(false),

  /**
   * Optional comment for identification
   * RouterOS limit: 255 characters
   */
  comment: z
    .string()
    .max(255, 'Comment cannot exceed 255 characters')
    .optional(),
});

/**
 * TypeScript type inferred from dhcpClientSchema
 * Use this for form values and component props
 */
export type DhcpClientFormValues = z.infer<typeof dhcpClientSchema>;

/**
 * Default values for DHCP client form
 * Used to initialize React Hook Form
 */
export const dhcpClientDefaultValues: DhcpClientFormValues = {
  interface: '',
  addDefaultRoute: true,
  usePeerDNS: true,
  usePeerNTP: false,
  comment: '',
};
