/**
 * VLAN Validation Schema
 *
 * Zod schemas for validating VLAN (802.1Q) interface configuration.
 * Story: NAS-6.7 - Implement VLAN Management
 */

import { z } from 'zod';

/**
 * VLAN naming pattern
 *
 * Valid VLAN names must:
 * - Be 1-100 characters long
 * - Contain only letters, digits, hyphens, and underscores
 * - Not contain spaces
 *
 * Examples:
 * - Valid: "vlan-10", "guest_network", "iot-devices", "VLAN100"
 * - Invalid: "vlan 10" (space), "test@vlan" (special char), "" (empty)
 */
const vlanNamePattern = /^[a-zA-Z0-9_-]+$/;

/**
 * Schema for VLAN form
 *
 * Validates VLAN interface configuration including:
 * - Name (alphanumeric with hyphens/underscores)
 * - VLAN ID (1-4094, per IEEE 802.1Q standard)
 * - Parent interface (ethernet or bridge)
 * - MTU (68-65535 bytes, optional)
 * - Comment (optional description)
 * - Disabled flag (optional, default false)
 */
export const vlanSchema = z.object({
  /**
   * VLAN interface name
   * Must be unique across all interfaces on the router
   *
   * Restrictions:
   * - 1-100 characters
   * - Letters, digits, hyphens, underscores only
   * - No spaces or special characters
   */
  name: z
    .string({
      required_error: 'VLAN name is required',
    })
    .min(1, 'VLAN name is required')
    .max(100, 'Name too long (max 100 characters)')
    .regex(
      vlanNamePattern,
      'Name must contain only letters, digits, hyphens, and underscores'
    ),

  /**
   * VLAN ID (IEEE 802.1Q tag)
   *
   * Range: 1-4094
   * - VLAN 1: Default/native VLAN (allowed but shows warning)
   * - VLAN 4095: Reserved (allowed but shows warning)
   * - VLAN 0: Not allowed (reserved for priority tagging)
   *
   * Must be unique per parent interface.
   */
  vlanId: z
    .number({
      required_error: 'VLAN ID is required',
      invalid_type_error: 'VLAN ID must be a number',
    })
    .int('VLAN ID must be an integer')
    .min(1, 'VLAN ID must be between 1 and 4094')
    .max(4094, 'VLAN ID must be between 1 and 4094'),

  /**
   * Parent interface ID
   *
   * The physical interface or bridge that this VLAN is created on.
   * Valid parent types:
   * - Ethernet interfaces (e.g., ether1, ether2)
   * - Bridge interfaces (e.g., bridge1)
   *
   * Not valid:
   * - VLAN interfaces (no double tagging)
   * - Virtual interfaces
   */
  interface: z
    .string({
      required_error: 'Parent interface is required',
    })
    .min(1, 'Parent interface is required'),

  /**
   * MTU (Maximum Transmission Unit) in bytes
   *
   * Range: 68-65535
   * - Default: inherits from parent interface (typically 1500)
   * - For VLAN: usually parent MTU - 4 bytes (for VLAN tag)
   * - Jumbo frames: 9000 bytes
   *
   * Optional: if not set, inherits from parent
   */
  mtu: z
    .number({
      invalid_type_error: 'MTU must be a number',
    })
    .int('MTU must be an integer')
    .min(68, 'MTU must be at least 68 bytes')
    .max(65535, 'MTU cannot exceed 65535 bytes')
    .optional()
    .nullable(),

  /**
   * Optional comment/description for this VLAN
   * Max 255 characters
   *
   * Example: "Guest network", "IoT devices", "Security cameras"
   */
  comment: z
    .string()
    .max(255, 'Comment too long (max 255 characters)')
    .optional()
    .nullable(),

  /**
   * Disabled flag
   * If true, VLAN interface exists but is administratively down
   * Default: false (enabled)
   */
  disabled: z.boolean().default(false).optional(),
});

/**
 * TypeScript type inferred from vlanSchema
 * Use this for form values and component props
 */
export type VlanFormValues = z.infer<typeof vlanSchema>;

/**
 * Validation warnings (non-blocking)
 *
 * These don't prevent form submission but should show warnings to the user.
 */
export function getVlanWarnings(values: VlanFormValues): string[] {
  const warnings: string[] = [];

  // VLAN 1 is the default VLAN
  if (values.vlanId === 1) {
    warnings.push(
      'VLAN 1 is the default/native VLAN. Using it for tagged traffic may cause unexpected behavior.'
    );
  }

  // VLAN 4095 is reserved
  if (values.vlanId === 4095) {
    warnings.push(
      'VLAN 4095 is reserved by IEEE 802.1Q. Use with caution.'
    );
  }

  // MTU larger than typical Ethernet may not work on all hardware
  if (values.mtu && values.mtu > 9000) {
    warnings.push(
      'MTU larger than 9000 bytes may not be supported by all network hardware.'
    );
  }

  return warnings;
}
