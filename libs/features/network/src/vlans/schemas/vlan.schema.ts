/**
 * VLAN Validation Schema
 *
 * Zod schemas for validating VLAN (802.1Q) interface configuration.
 * Story: NAS-6.7 - Implement VLAN Management
 */

import { z } from 'zod';

/**
 * VLAN naming pattern constant
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
const VLAN_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** VLAN ID minimum (IEEE 802.1Q range) */
const VLAN_ID_MIN = 1;

/** VLAN ID maximum (IEEE 802.1Q range) */
const VLAN_ID_MAX = 4094;

/** Maximum VLAN name length in characters */
const VLAN_NAME_MAX_LENGTH = 100;

/** Maximum comment/description length in characters */
const VLAN_COMMENT_MAX_LENGTH = 255;

/** MTU minimum in bytes */
const MTU_MIN_BYTES = 68;

/** MTU maximum in bytes */
const MTU_MAX_BYTES = 65535;

/** MTU jumbo frame standard in bytes */
const MTU_JUMBO_FRAMES = 9000;

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
    .max(VLAN_NAME_MAX_LENGTH, `Name too long (max ${VLAN_NAME_MAX_LENGTH} characters)`)
    .regex(
      VLAN_NAME_PATTERN,
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
    .min(VLAN_ID_MIN, `VLAN ID must be between ${VLAN_ID_MIN} and ${VLAN_ID_MAX}`)
    .max(VLAN_ID_MAX, `VLAN ID must be between ${VLAN_ID_MIN} and ${VLAN_ID_MAX}`),

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
    .min(MTU_MIN_BYTES, `MTU must be at least ${MTU_MIN_BYTES} bytes`)
    .max(MTU_MAX_BYTES, `MTU cannot exceed ${MTU_MAX_BYTES} bytes`)
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
    .max(VLAN_COMMENT_MAX_LENGTH, `Comment too long (max ${VLAN_COMMENT_MAX_LENGTH} characters)`)
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

  // MTU larger than jumbo frames may not work on all hardware
  if (values.mtu && values.mtu > MTU_JUMBO_FRAMES) {
    warnings.push(
      `MTU larger than ${MTU_JUMBO_FRAMES} bytes may not be supported by all network hardware.`
    );
  }

  return warnings;
}
