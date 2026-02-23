/**
 * VLAN Validation Schema
 *
 * Zod schemas for validating VLAN (802.1Q) interface configuration.
 * Story: NAS-6.7 - Implement VLAN Management
 */
import { z } from 'zod';
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
export declare const vlanSchema: z.ZodObject<{
    /**
     * VLAN interface name
     * Must be unique across all interfaces on the router
     *
     * Restrictions:
     * - 1-100 characters
     * - Letters, digits, hyphens, underscores only
     * - No spaces or special characters
     */
    name: z.ZodString;
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
    vlanId: z.ZodNumber;
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
    interface: z.ZodString;
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
    mtu: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    /**
     * Optional comment/description for this VLAN
     * Max 255 characters
     *
     * Example: "Guest network", "IoT devices", "Security cameras"
     */
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    /**
     * Disabled flag
     * If true, VLAN interface exists but is administratively down
     * Default: false (enabled)
     */
    disabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    interface: string;
    vlanId: number;
    disabled?: boolean | undefined;
    comment?: string | null | undefined;
    mtu?: number | null | undefined;
}, {
    name: string;
    interface: string;
    vlanId: number;
    disabled?: boolean | undefined;
    comment?: string | null | undefined;
    mtu?: number | null | undefined;
}>;
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
export declare function getVlanWarnings(values: VlanFormValues): string[];
//# sourceMappingURL=vlan.schema.d.ts.map