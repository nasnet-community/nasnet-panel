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
export declare const dhcpClientSchema: z.ZodObject<{
    /**
     * Physical interface name for DHCP client (e.g. ether1, ether2, sfp1)
     */
    interface: z.ZodString;
    /**
     * Whether to add default route via DHCP gateway (default: true)
     */
    shouldAddDefaultRoute: z.ZodDefault<z.ZodBoolean>;
    /**
     * Whether to use DNS servers provided by DHCP (default: true)
     */
    shouldUsePeerDNS: z.ZodDefault<z.ZodBoolean>;
    /**
     * Whether to use NTP servers provided by DHCP (default: false)
     */
    shouldUsePeerNTP: z.ZodDefault<z.ZodBoolean>;
    /**
     * Optional comment for identification (max 255 characters)
     */
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    interface: string;
    shouldAddDefaultRoute: boolean;
    shouldUsePeerDNS: boolean;
    shouldUsePeerNTP: boolean;
    comment?: string | undefined;
}, {
    interface: string;
    comment?: string | undefined;
    shouldAddDefaultRoute?: boolean | undefined;
    shouldUsePeerDNS?: boolean | undefined;
    shouldUsePeerNTP?: boolean | undefined;
}>;
/**
 * @description TypeScript type inferred from dhcpClientSchema
 */
export type DhcpClientFormValues = z.infer<typeof dhcpClientSchema>;
/**
 * @description Default values for DHCP client form
 */
export declare const DHCP_CLIENT_DEFAULT_VALUES: DhcpClientFormValues;
//# sourceMappingURL=dhcp-client.schema.d.ts.map