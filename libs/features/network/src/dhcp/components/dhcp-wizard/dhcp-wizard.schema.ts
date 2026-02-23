/**
 * DHCP Wizard Validation Schemas
 * Zod schemas for validating each wizard step
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { z } from 'zod';

/**
 * IPv4 address validation regex
 * Matches: 0.0.0.0 to 255.255.255.255
 */
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * MAC address validation regex
 * Matches: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX format
 */
const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

/**
 * Network CIDR notation validation regex
 */
const NETWORK_CIDR_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

/**
 * Server name validation regex
 * Allows letters, numbers, hyphens, and underscores
 */
const SERVER_NAME_REGEX = /^[a-zA-Z0-9-_]+$/;

/**
 * IPv4 address schema
 */
export const ipv4Schema = z
  .string()
  .regex(IPV4_REGEX, 'Invalid IP address format');

/**
 * Step 1: Interface Selection
 */
export const interfaceStepSchema = z.object({
  interface: z.string().min(1, 'Please select an interface'),
  interfaceIP: z.string().optional(), // Auto-filled from selected interface
});

export type InterfaceStepFormData = z.infer<typeof interfaceStepSchema>;

/**
 * Step 2: Address Pool Configuration
 */
export const poolStepSchema = z
  .object({
    poolStart: ipv4Schema,
    poolEnd: ipv4Schema,
  })
  .refine(
    (data) => {
      // Validate poolEnd >= poolStart
      const start = data.poolStart.split('.').map(Number);
      const end = data.poolEnd.split('.').map(Number);

      for (let i = 0; i < 4; i++) {
        if (end[i] < start[i]) return false;
        if (end[i] > start[i]) return true;
      }
      return true; // Equal is ok (single IP pool)
    },
    {
      message: 'Pool end must be greater than or equal to pool start',
      path: ['poolEnd'],
    }
  );

export type PoolStepFormData = z.infer<typeof poolStepSchema>;

/**
 * Step 3: Network Settings
 */
export const networkStepSchema = z.object({
  gateway: ipv4Schema,
  dnsServers: z
    .array(ipv4Schema)
    .min(1, 'At least one DNS server is required')
    .max(3, 'Maximum 3 DNS servers allowed'),
  leaseTime: z.enum(['1h', '6h', '12h', '1d', '3d', '7d', '30d'], {
    errorMap: () => ({ message: 'Please select a valid lease time' }),
  }),
  domain: z.string().optional(),
  ntpServer: z
    .union([z.string().regex(IPV4_REGEX), z.string().length(0)])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

export type NetworkStepFormData = z.infer<typeof networkStepSchema>;

/**
 * Combined wizard schema (all steps)
 */
export const dhcpWizardSchema = interfaceStepSchema
  .merge(z.object({ poolStart: ipv4Schema, poolEnd: ipv4Schema }))
  .merge(networkStepSchema)
  .merge(
    z.object({
      name: z
        .string()
        .min(1, 'Server name is required')
        .max(64, 'Server name too long')
        .regex(
          SERVER_NAME_REGEX,
          'Server name can only contain letters, numbers, hyphens, and underscores'
        ),
      network: z.string().regex(NETWORK_CIDR_REGEX, {
        message: 'Invalid network CIDR notation',
      }),
    })
  );

export type DHCPWizardFormData = z.infer<typeof dhcpWizardSchema>;

/**
 * Static binding form schema
 */
export const staticBindingSchema = z.object({
  macAddress: z
    .string()
    .regex(
      MAC_ADDRESS_REGEX,
      'Invalid MAC address format (use XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)'
    ),
  ipAddress: ipv4Schema,
  hostname: z.string().max(255, 'Hostname too long').optional(),
  comment: z.string().max(255, 'Comment too long').optional(),
});

export type StaticBindingFormData = z.infer<typeof staticBindingSchema>;

/**
 * Server edit form schema
 */
export const serverEditSchema = z.object({
  leaseTime: z.enum(['1h', '6h', '12h', '1d', '3d', '7d', '30d']),
  disabled: z.boolean().optional(),
  authoritative: z.boolean().optional(),
});

export type ServerEditFormData = z.infer<typeof serverEditSchema>;

/**
 * Lease time options for select inputs
 */
export const LEASE_TIME_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '1d', label: '1 day' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '1 week' },
  { value: '30d', label: '30 days' },
] as const;

/**
 * Default form values for wizard
 */
export const DEFAULT_WIZARD_VALUES: Partial<DHCPWizardFormData> = {
  leaseTime: '1d',
  dnsServers: [],
};
