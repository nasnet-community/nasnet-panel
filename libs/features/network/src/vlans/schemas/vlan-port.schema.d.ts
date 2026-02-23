/**
 * VLAN Port Configuration Validation Schema
 *
 * Zod schemas for validating VLAN port configuration (trunk/access modes).
 * Story: NAS-6.7 - Implement VLAN Management
 */
import { z } from 'zod';
/**
 * Schema for VLAN port configuration
 *
 * Supports two modes:
 * 1. Access Mode: Port belongs to a single untagged VLAN (PVID only)
 * 2. Trunk Mode: Port carries multiple tagged VLANs + optional native VLAN (PVID)
 */
export declare const vlanPortConfigSchema: z.ZodEffects<z.ZodObject<{
    /**
     * Port operation mode
     * - access: Single untagged VLAN (typical for end devices)
     * - trunk: Multiple tagged VLANs (typical for inter-switch links)
     */
    mode: z.ZodEnum<["access", "trunk"]>;
    /**
     * PVID (Port VLAN ID)
     *
     * The VLAN ID for untagged traffic entering this port.
     * - Access mode: Required, this is the only VLAN
     * - Trunk mode: Optional, this is the native/untagged VLAN
     *
     * Range: 1-4094
     */
    pvid: z.ZodOptional<z.ZodNumber>;
    /**
     * Tagged VLAN IDs (trunk mode only)
     *
     * List of VLAN IDs that are allowed tagged on this trunk port.
     * Not used in access mode.
     *
     * Each VLAN ID must be 1-4094.
     * Maximum recommended: 128 VLANs per port (hardware dependent)
     */
    taggedVlanIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
}, "strip", z.ZodTypeAny, {
    mode: "access" | "trunk";
    taggedVlanIds: number[];
    pvid?: number | undefined;
}, {
    mode: "access" | "trunk";
    pvid?: number | undefined;
    taggedVlanIds?: number[] | undefined;
}>, {
    mode: "access" | "trunk";
    taggedVlanIds: number[];
    pvid?: number | undefined;
}, {
    mode: "access" | "trunk";
    pvid?: number | undefined;
    taggedVlanIds?: number[] | undefined;
}>;
/**
 * TypeScript type inferred from vlanPortConfigSchema
 */
export type VlanPortConfigFormValues = z.infer<typeof vlanPortConfigSchema>;
//# sourceMappingURL=vlan-port.schema.d.ts.map