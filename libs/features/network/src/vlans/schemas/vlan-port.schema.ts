/**
 * VLAN Port Configuration Validation Schema
 *
 * Zod schemas for validating VLAN port configuration (trunk/access modes).
 * Story: NAS-6.7 - Implement VLAN Management
 */

import { z } from 'zod';

/** VLAN ID minimum (IEEE 802.1Q range) */
const VLAN_ID_MIN = 1;

/** VLAN ID maximum (IEEE 802.1Q range) */
const VLAN_ID_MAX = 4094;

/** Maximum recommended VLANs per trunk port (hardware dependent) */
const MAX_VLANS_PER_PORT = 128;

/**
 * Schema for VLAN port configuration
 *
 * Supports two modes:
 * 1. Access Mode: Port belongs to a single untagged VLAN (PVID only)
 * 2. Trunk Mode: Port carries multiple tagged VLANs + optional native VLAN (PVID)
 */
export const vlanPortConfigSchema = z
  .object({
    /**
     * Port operation mode
     * - access: Single untagged VLAN (typical for end devices)
     * - trunk: Multiple tagged VLANs (typical for inter-switch links)
     */
    mode: z.enum(['access', 'trunk'], {
      required_error: 'Port mode is required',
    }),

    /**
     * PVID (Port VLAN ID)
     *
     * The VLAN ID for untagged traffic entering this port.
     * - Access mode: Required, this is the only VLAN
     * - Trunk mode: Optional, this is the native/untagged VLAN
     *
     * Range: 1-4094
     */
    pvid: z
      .number({
        invalid_type_error: 'PVID must be a number',
      })
      .int('PVID must be an integer')
      .min(VLAN_ID_MIN, `PVID must be between ${VLAN_ID_MIN} and ${VLAN_ID_MAX}`)
      .max(VLAN_ID_MAX, `PVID must be between ${VLAN_ID_MIN} and ${VLAN_ID_MAX}`)
      .optional(),

    /**
     * Tagged VLAN IDs (trunk mode only)
     *
     * List of VLAN IDs that are allowed tagged on this trunk port.
     * Not used in access mode.
     *
     * Each VLAN ID must be 1-4094.
     * Maximum recommended: 128 VLANs per port (hardware dependent)
     */
    taggedVlanIds: z
      .array(
        z
          .number()
          .int('VLAN ID must be an integer')
          .min(VLAN_ID_MIN, `VLAN ID must be between ${VLAN_ID_MIN} and ${VLAN_ID_MAX}`)
          .max(VLAN_ID_MAX, `VLAN ID must be between ${VLAN_ID_MIN} and ${VLAN_ID_MAX}`)
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    // Access mode: PVID is required
    if (data.mode === 'access' && !data.pvid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PVID is required for access mode',
        path: ['pvid'],
      });
    }

    // Trunk mode: At least one tagged VLAN is recommended
    if (
      data.mode === 'trunk' &&
      (!data.taggedVlanIds || data.taggedVlanIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'At least one tagged VLAN is recommended for trunk mode',
        path: ['taggedVlanIds'],
      });
    }

    // Trunk mode: No duplicate VLAN IDs in tagged list
    if (data.mode === 'trunk' && data.taggedVlanIds) {
      const uniqueVlans = new Set(data.taggedVlanIds);
      if (uniqueVlans.size !== data.taggedVlanIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate VLAN IDs in tagged list',
          path: ['taggedVlanIds'],
        });
      }
    }

    // Warn if too many VLANs (>MAX_VLANS_PER_PORT) - most hardware limits
    if (data.taggedVlanIds && data.taggedVlanIds.length > MAX_VLANS_PER_PORT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `More than ${MAX_VLANS_PER_PORT} VLANs may not be supported by all hardware`,
        path: ['taggedVlanIds'],
      });
    }
  });

/**
 * TypeScript type inferred from vlanPortConfigSchema
 */
export type VlanPortConfigFormValues = z.infer<typeof vlanPortConfigSchema>;
