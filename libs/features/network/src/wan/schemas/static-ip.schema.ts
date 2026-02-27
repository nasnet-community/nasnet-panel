/**
 * @description Static IP WAN Configuration Validation Schema
 *
 * Zod schemas for validating static IP WAN configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 4: Static IP)
 */

import { z } from 'zod';

/**
 * @description Helper regex to validate CIDR notation (e.g. 203.0.113.10/30)
 */
const CIDR_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

/**
 * @description Helper regex to validate IPv4 address (e.g. 203.0.113.1)
 */
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * @description Schema for static IP WAN configuration form
 *
 * Validates complete static IP configuration including:
 * - Interface selection (required)
 * - IP address in CIDR notation (required)
 * - Gateway IP address (required)
 * - DNS servers (optional but recommended)
 * - Comment (optional)
 */
export const staticIPSchema = z
  .object({
    /**
     * Physical interface name for static IP (e.g. ether1, ether2, sfp1)
     */
    interface: z
      .string({
        required_error: 'Interface is required',
        invalid_type_error: 'Interface must be a valid string',
      })
      .min(1, 'Please select a physical interface')
      .max(64, 'Interface name exceeds maximum length of 64 characters'),

    /**
     * IP address in CIDR notation (e.g. 203.0.113.10/30 or 192.168.1.100/24)
     */
    address: z
      .string({
        required_error: 'IP address is required',
        invalid_type_error: 'IP address must be a valid string',
      })
      .min(1, 'Please enter an IP address with subnet mask')
      .regex(CIDR_REGEX, 'IP must be in CIDR notation (e.g. 203.0.113.10/30)'),

    /**
     * Gateway IP address in IPv4 format (e.g. 203.0.113.9 or 192.168.1.1)
     */
    gateway: z
      .string({
        required_error: 'Gateway is required',
        invalid_type_error: 'Gateway must be a valid string',
      })
      .min(1, 'Please enter the gateway IP address')
      .regex(IPV4_REGEX, 'Gateway must be a valid IPv4 address'),

    /**
     * Primary DNS server in IPv4 format (optional, e.g. 1.1.1.1 or 8.8.8.8)
     */
    primaryDNS: z.string().regex(IPV4_REGEX, 'Primary DNS must be a valid IPv4 address').optional(),

    /**
     * Secondary DNS server in IPv4 format (optional)
     */
    secondaryDNS: z
      .string()
      .regex(IPV4_REGEX, 'Secondary DNS must be a valid IPv4 address')
      .optional(),

    /**
     * Optional comment for identification (max 255 characters)
     */
    comment: z.string().max(255, 'Comment cannot exceed 255 characters').optional(),
  })
  .refine(
    (data) => {
      // Validate that gateway is in the same subnet as the IP address
      if (!data.address || !data.gateway) return true;

      try {
        const [ip, mask] = data.address.split('/');
        const ipParts = ip.split('.').map(Number);
        const gatewayParts = data.gateway.split('.').map(Number);
        const maskBits = parseInt(mask, 10);

        // For point-to-point links (/30, /31), gateway can differ
        if (maskBits >= 30) return true;

        // For larger subnets, verify first 3 octets match
        if (maskBits >= 24) {
          return (
            ipParts[0] === gatewayParts[0] &&
            ipParts[1] === gatewayParts[1] &&
            ipParts[2] === gatewayParts[2]
          );
        }

        return true;
      } catch {
        return true;
      }
    },
    {
      message:
        'Gateway may not be reachable from this IP address. Verify the gateway is in the same subnet.',
      path: ['gateway'],
    }
  );

/**
 * @description TypeScript type inferred from staticIPSchema
 */
export type StaticIPFormValues = z.infer<typeof staticIPSchema>;

/**
 * @description Default values for static IP form
 */
export const STATIC_IP_DEFAULT_VALUES: Partial<StaticIPFormValues> = {
  interface: '',
  address: '',
  gateway: '',
  primaryDNS: '1.1.1.1', // Cloudflare DNS
  secondaryDNS: '1.0.0.1', // Cloudflare DNS secondary
  comment: '',
};

/**
 * @description Common DNS server presets for static IP configuration
 */
export const DNS_PRESETS = {
  CLOUDFLARE: {
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
    label: 'Cloudflare',
  },
  GOOGLE: {
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
    label: 'Google',
  },
  QUAD9: {
    primary: '9.9.9.9',
    secondary: '9.9.9.10',
    label: 'Quad9',
  },
  OPENDNS: {
    primary: '208.67.222.222',
    secondary: '208.67.220.220',
    label: 'OpenDNS',
  },
} as const;

/**
 * @description Common subnet mask presets for WAN connections
 */
export const SUBNET_PRESETS = {
  POINT_TO_POINT: { mask: '/30', label: 'Point-to-Point (/30 - 2 hosts)' },
  SMALL_SUBNET: { mask: '/29', label: 'Small Subnet (/29 - 6 hosts)' },
  MEDIUM_SUBNET: { mask: '/28', label: 'Medium Subnet (/28 - 14 hosts)' },
  STANDARD: { mask: '/24', label: 'Standard (/24 - 254 hosts)' },
} as const;
