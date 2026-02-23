/**
 * @description PPPoE Client Configuration Validation Schemas
 *
 * Zod schemas for validating PPPoE WAN client wizard (5 steps).
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */
import { z } from 'zod';
/**
 * @description Schema for Step 1: Interface Selection
 *
 * Validates physical interface selection for PPPoE client.
 * Only Ethernet interfaces are valid for PPPoE.
 */
export declare const pppoeInterfaceStepSchema: z.ZodObject<{
    /**
     * Name for the PPPoE interface (e.g. pppoe-wan, pppoe-isp)
     */
    name: z.ZodString;
    /**
     * Physical interface to bind PPPoE to (e.g. ether1, ether2, sfp1)
     */
    interface: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    interface: string;
}, {
    name: string;
    interface: string;
}>;
export type PppoeInterfaceStepFormValues = z.infer<typeof pppoeInterfaceStepSchema>;
/**
 * @description Schema for Step 2: Authentication Credentials
 *
 * Validates PPPoE username and password.
 * IMPORTANT: Password is never logged or cached.
 */
export declare const pppoeCredentialsStepSchema: z.ZodObject<{
    /**
     * PPPoE username provided by ISP (e.g. user@isp.com)
     */
    username: z.ZodString;
    /**
     * PPPoE password provided by ISP (NEVER logged or cached)
     */
    password: z.ZodString;
    /**
     * Optional service name specific to your ISP
     */
    serviceName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    serviceName?: string | undefined;
}, {
    password: string;
    username: string;
    serviceName?: string | undefined;
}>;
export type PppoeCredentialsStepFormValues = z.infer<typeof pppoeCredentialsStepSchema>;
/**
 * @description Schema for Step 3: Advanced Options
 *
 * Validates PPPoE advanced settings (MTU, MRU, DNS, routing).
 * RouterOS constraints:
 * - MTU: 512-65535 (typical: 1492 for PPPoE)
 * - MRU: 512-65535 (typically same as MTU)
 */
export declare const pppoeOptionsStepSchema: z.ZodObject<{
    /**
     * Maximum Transmission Unit in bytes (default: 1492 for PPPoE)
     */
    mtu: z.ZodOptional<z.ZodNumber>;
    /**
     * Maximum Receive Unit in bytes (typically same as MTU)
     */
    mru: z.ZodOptional<z.ZodNumber>;
    /**
     * Whether to add default route via PPPoE gateway (default: true)
     */
    shouldAddDefaultRoute: z.ZodDefault<z.ZodBoolean>;
    /**
     * Whether to use DNS servers provided by ISP (default: true)
     */
    shouldUsePeerDNS: z.ZodDefault<z.ZodBoolean>;
    /**
     * Optional comment for identification (max 255 characters)
     */
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shouldAddDefaultRoute: boolean;
    shouldUsePeerDNS: boolean;
    comment?: string | undefined;
    mtu?: number | undefined;
    mru?: number | undefined;
}, {
    comment?: string | undefined;
    mtu?: number | undefined;
    shouldAddDefaultRoute?: boolean | undefined;
    shouldUsePeerDNS?: boolean | undefined;
    mru?: number | undefined;
}>;
export type PppoeOptionsStepFormValues = z.infer<typeof pppoeOptionsStepSchema>;
/**
 * @description Complete PPPoE client configuration schema
 * Combines all wizard steps into a single schema for submission
 */
export declare const pppoeClientSchema: z.ZodObject<{
    name: z.ZodString;
    interface: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    serviceName: z.ZodOptional<z.ZodString>;
    mtu: z.ZodOptional<z.ZodNumber>;
    mru: z.ZodOptional<z.ZodNumber>;
    shouldAddDefaultRoute: z.ZodDefault<z.ZodBoolean>;
    shouldUsePeerDNS: z.ZodDefault<z.ZodBoolean>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    interface: string;
    password: string;
    username: string;
    shouldAddDefaultRoute: boolean;
    shouldUsePeerDNS: boolean;
    comment?: string | undefined;
    mtu?: number | undefined;
    serviceName?: string | undefined;
    mru?: number | undefined;
}, {
    name: string;
    interface: string;
    password: string;
    username: string;
    comment?: string | undefined;
    mtu?: number | undefined;
    serviceName?: string | undefined;
    shouldAddDefaultRoute?: boolean | undefined;
    shouldUsePeerDNS?: boolean | undefined;
    mru?: number | undefined;
}>;
/**
 * @description TypeScript type inferred from complete pppoeClientSchema
 */
export type PppoeClientFormValues = z.infer<typeof pppoeClientSchema>;
/**
 * @description Default values for PPPoE client wizard
 */
export declare const PPPOE_CLIENT_DEFAULT_VALUES: Partial<PppoeClientFormValues>;
/**
 * @description MTU Presets for common scenarios
 */
export declare const MTU_PRESETS: {
    readonly PPPOE_STANDARD: {
        readonly value: 1492;
        readonly label: "Standard PPPoE (1492)";
    };
    readonly PPPOE_CONSERVATIVE: {
        readonly value: 1480;
        readonly label: "Conservative PPPoE (1480)";
    };
    readonly ETHERNET_MAX: {
        readonly value: 1500;
        readonly label: "Ethernet Max (1500)";
    };
    readonly JUMBO_FRAMES: {
        readonly value: 9000;
        readonly label: "Jumbo Frames (9000)";
    };
};
//# sourceMappingURL=pppoe-client.schema.d.ts.map