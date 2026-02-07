/**
 * Static IP WAN Configuration Validation Schema
 *
 * Zod schemas for validating static IP WAN configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 4: Static IP)
 */

import { z } from 'zod';

/**
 * Helper function to validate CIDR notation
 * Examples: "203.0.113.10/30", "192.168.1.1/24"
 */
const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

/**
 * Helper function to validate IPv4 address
 * Examples: "203.0.113.1", "8.8.8.8", "192.168.1.1"
 */
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Schema for static IP WAN configuration form
 *
 * Validates complete static IP configuration including:
 * - Interface selection (required)
 * - IP address in CIDR notation (required)
 * - Gateway IP address (required)
 * - DNS servers (optional but recommended)
 * - Comment (optional)
 *
 * Validation constraints:
 * - Address must be in CIDR notation (e.g., "203.0.113.10/30")
 * - Gateway must be a valid IPv4 address
 * - DNS servers must be valid IPv4 addresses
 * - Gateway should be reachable from the configured address
 */
export const staticIPSchema = z
  .object({
    /**
     * Physical interface name for static IP
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
     * IP address in CIDR notation
     * Examples: "203.0.113.10/30", "192.168.1.100/24"
     * IMPORTANT: Must include subnet mask (e.g., /30, /24)
     */
    address: z
      .string({
        required_error: 'IP address is required',
        invalid_type_error: 'IP address must be a valid string',
      })
      .min(1, 'IP address cannot be empty')
      .regex(cidrRegex, 'IP address must be in CIDR notation (e.g., 203.0.113.10/30)'),

    /**
     * Gateway IP address
     * Examples: "203.0.113.9", "192.168.1.1"
     * IMPORTANT: Must be reachable from the configured IP address
     */
    gateway: z
      .string({
        required_error: 'Gateway is required',
        invalid_type_error: 'Gateway must be a valid string',
      })
      .min(1, 'Gateway cannot be empty')
      .regex(ipv4Regex, 'Gateway must be a valid IPv4 address'),

    /**
     * Primary DNS server (optional but recommended)
     * Examples: "1.1.1.1", "8.8.8.8", "9.9.9.9"
     */
    primaryDNS: z
      .string()
      .regex(ipv4Regex, 'Primary DNS must be a valid IPv4 address')
      .optional(),

    /**
     * Secondary DNS server (optional)
     * Examples: "1.0.0.1", "8.8.4.4", "9.9.9.10"
     */
    secondaryDNS: z
      .string()
      .regex(ipv4Regex, 'Secondary DNS must be a valid IPv4 address')
      .optional(),

    /**
     * Optional comment for identification
     * RouterOS limit: 255 characters
     */
    comment: z
      .string()
      .max(255, 'Comment cannot exceed 255 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // Validate that gateway is in the same subnet as the IP address
      // This is a basic check - more sophisticated subnet validation could be added
      if (!data.address || !data.gateway) return true;

      try {
        // Extract IP and subnet mask
        const [ip, mask] = data.address.split('/');
        const ipParts = ip.split('.').map(Number);
        const gatewayParts = data.gateway.split('.').map(Number);
        const maskBits = parseInt(mask, 10);

        // For point-to-point links (/30, /31), gateway can be different
        if (maskBits >= 30) return true;

        // For larger subnets, check first 3 octets match
        // This is a simplified check - more precise subnet math could be added
        if (maskBits >= 24) {
          return (
            ipParts[0] === gatewayParts[0] &&
            ipParts[1] === gatewayParts[1] &&
            ipParts[2] === gatewayParts[2]
          );
        }

        return true; // Allow other subnet sizes for now
      } catch {
        return true; // Skip validation if parsing fails
      }
    },
    {
      message:
        'Gateway may not be reachable from this IP address. Verify the gateway is in the same subnet.',
      path: ['gateway'],
    }
  );

/**
 * TypeScript type inferred from staticIPSchema
 * Use this for form values and component props
 */
export type StaticIPFormValues = z.infer<typeof staticIPSchema>;

/**
 * Default values for static IP form
 * Used to initialize React Hook Form
 */
export const staticIPDefaultValues: Partial<StaticIPFormValues> = {
  interface: '',
  address: '',
  gateway: '',
  primaryDNS: '1.1.1.1', // Cloudflare DNS
  secondaryDNS: '1.0.0.1', // Cloudflare DNS secondary
  comment: '',
};

/**
 * Common DNS server presets
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
 * Common subnet mask presets for WAN connections
 */
export const SUBNET_PRESETS = {
  POINT_TO_POINT: { mask: '/30', label: 'Point-to-Point (/30 - 2 hosts)' },
  SMALL_SUBNET: { mask: '/29', label: 'Small Subnet (/29 - 6 hosts)' },
  MEDIUM_SUBNET: { mask: '/28', label: 'Medium Subnet (/28 - 14 hosts)' },
  STANDARD: { mask: '/24', label: 'Standard (/24 - 254 hosts)' },
} as const;
