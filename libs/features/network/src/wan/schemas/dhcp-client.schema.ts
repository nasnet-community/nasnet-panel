/**
 * @description DHCP Client Configuration Validation Schema
 *
 * Zod schemas for validating DHCP WAN client configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 2: DHCP)
 */

import { z } from 'zod';

/**
 * @description Schema for DHCP client configuration form
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
   * Physical interface name for DHCP client (e.g. ether1, ether2, sfp1)
   */
  interface: z
    .string({
      required_error: 'Interface is required for DHCP configuration',
      invalid_type_error: 'Interface must be a valid string',
    })
    .min(1, 'Please select a physical interface')
    .max(64, 'Interface name exceeds maximum length of 64 characters'),

  /**
   * Whether to add default route via DHCP gateway (default: true)
   */
  shouldAddDefaultRoute: z.boolean().default(true),

  /**
   * Whether to use DNS servers provided by DHCP (default: true)
   */
  shouldUsePeerDNS: z.boolean().default(true),

  /**
   * Whether to use NTP servers provided by DHCP (default: false)
   */
  shouldUsePeerNTP: z.boolean().default(false),

  /**
   * Optional comment for identification (max 255 characters)
   */
  comment: z.string().max(255, 'Comment cannot exceed 255 characters').optional(),
});

/**
 * @description TypeScript type inferred from dhcpClientSchema
 */
export type DhcpClientFormValues = z.infer<typeof dhcpClientSchema>;

/**
 * @description Default values for DHCP client form
 */
export const DHCP_CLIENT_DEFAULT_VALUES: DhcpClientFormValues = {
  interface: '',
  shouldAddDefaultRoute: true,
  shouldUsePeerDNS: true,
  shouldUsePeerNTP: false,
  comment: '',
};
