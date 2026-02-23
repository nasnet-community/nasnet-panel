/**
 * @description Static IP WAN Configuration Validation Schema
 *
 * Zod schemas for validating static IP WAN configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 4: Static IP)
 */
import { z } from 'zod';
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
export declare const staticIPSchema: z.ZodEffects<z.ZodObject<{
    /**
     * Physical interface name for static IP (e.g. ether1, ether2, sfp1)
     */
    interface: z.ZodString;
    /**
     * IP address in CIDR notation (e.g. 203.0.113.10/30 or 192.168.1.100/24)
     */
    address: z.ZodString;
    /**
     * Gateway IP address in IPv4 format (e.g. 203.0.113.9 or 192.168.1.1)
     */
    gateway: z.ZodString;
    /**
     * Primary DNS server in IPv4 format (optional, e.g. 1.1.1.1 or 8.8.8.8)
     */
    primaryDNS: z.ZodOptional<z.ZodString>;
    /**
     * Secondary DNS server in IPv4 format (optional)
     */
    secondaryDNS: z.ZodOptional<z.ZodString>;
    /**
     * Optional comment for identification (max 255 characters)
     */
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    interface: string;
    gateway: string;
    address: string;
    comment?: string | undefined;
    primaryDNS?: string | undefined;
    secondaryDNS?: string | undefined;
}, {
    interface: string;
    gateway: string;
    address: string;
    comment?: string | undefined;
    primaryDNS?: string | undefined;
    secondaryDNS?: string | undefined;
}>, {
    interface: string;
    gateway: string;
    address: string;
    comment?: string | undefined;
    primaryDNS?: string | undefined;
    secondaryDNS?: string | undefined;
}, {
    interface: string;
    gateway: string;
    address: string;
    comment?: string | undefined;
    primaryDNS?: string | undefined;
    secondaryDNS?: string | undefined;
}>;
/**
 * @description TypeScript type inferred from staticIPSchema
 */
export type StaticIPFormValues = z.infer<typeof staticIPSchema>;
/**
 * @description Default values for static IP form
 */
export declare const STATIC_IP_DEFAULT_VALUES: Partial<StaticIPFormValues>;
/**
 * @description Common DNS server presets for static IP configuration
 */
export declare const DNS_PRESETS: {
    readonly CLOUDFLARE: {
        readonly primary: "1.1.1.1";
        readonly secondary: "1.0.0.1";
        readonly label: "Cloudflare";
    };
    readonly GOOGLE: {
        readonly primary: "8.8.8.8";
        readonly secondary: "8.8.4.4";
        readonly label: "Google";
    };
    readonly QUAD9: {
        readonly primary: "9.9.9.9";
        readonly secondary: "9.9.9.10";
        readonly label: "Quad9";
    };
    readonly OPENDNS: {
        readonly primary: "208.67.222.222";
        readonly secondary: "208.67.220.220";
        readonly label: "OpenDNS";
    };
};
/**
 * @description Common subnet mask presets for WAN connections
 */
export declare const SUBNET_PRESETS: {
    readonly POINT_TO_POINT: {
        readonly mask: "/30";
        readonly label: "Point-to-Point (/30 - 2 hosts)";
    };
    readonly SMALL_SUBNET: {
        readonly mask: "/29";
        readonly label: "Small Subnet (/29 - 6 hosts)";
    };
    readonly MEDIUM_SUBNET: {
        readonly mask: "/28";
        readonly label: "Medium Subnet (/28 - 14 hosts)";
    };
    readonly STANDARD: {
        readonly mask: "/24";
        readonly label: "Standard (/24 - 254 hosts)";
    };
};
//# sourceMappingURL=static-ip.schema.d.ts.map