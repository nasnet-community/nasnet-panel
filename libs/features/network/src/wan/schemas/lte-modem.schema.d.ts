/**
 * LTE Modem Configuration Schema
 *
 * Zod validation schema for LTE/4G modem configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */
import { z } from 'zod';
/**
 * LTE Modem Configuration Schema
 */
export declare const lteModemSchema: z.ZodObject<{
    /**
     * LTE interface name (e.g., 'lte1', 'lte2')
     */
    interface: z.ZodString;
    /**
     * Access Point Name (APN) provided by carrier
     */
    apn: z.ZodString;
    /**
     * SIM PIN (optional)
     * - Leave empty if SIM has no PIN
     * - 4-8 digits
     */
    pin: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    /**
     * Username for APN authentication (optional)
     */
    username: z.ZodOptional<z.ZodString>;
    /**
     * Password for APN authentication (optional)
     */
    password: z.ZodOptional<z.ZodString>;
    /**
     * Authentication protocol
     */
    authProtocol: z.ZodDefault<z.ZodEnum<["none", "pap", "chap"]>>;
    /**
     * Set as default route
     */
    isDefaultRoute: z.ZodDefault<z.ZodBoolean>;
    /**
     * Enable/disable interface
     */
    enabled: z.ZodDefault<z.ZodBoolean>;
    /**
     * MTU (Maximum Transmission Unit)
     * - Default: 1500
     * - Range: 576-1500
     */
    mtu: z.ZodDefault<z.ZodNumber>;
    /**
     * APN profile number (1-10)
     * - Some modems support multiple profiles
     */
    profileNumber: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    interface: string;
    mtu: number;
    apn: string;
    authProtocol: "none" | "chap" | "pap";
    isDefaultRoute: boolean;
    profileNumber: number;
    password?: string | undefined;
    username?: string | undefined;
    pin?: string | undefined;
}, {
    interface: string;
    apn: string;
    enabled?: boolean | undefined;
    password?: string | undefined;
    username?: string | undefined;
    mtu?: number | undefined;
    pin?: string | undefined;
    authProtocol?: "none" | "chap" | "pap" | undefined;
    isDefaultRoute?: boolean | undefined;
    profileNumber?: number | undefined;
}>;
/**
 * TypeScript type inferred from schema
 */
export type LteModemFormValues = z.infer<typeof lteModemSchema>;
/**
 * Default form values
 */
export declare const LTE_MODEM_DEFAULT_VALUES: Partial<LteModemFormValues>;
/**
 * Common APN presets for popular carriers
 */
export declare const APN_PRESETS: {
    readonly 'T-Mobile (US)': {
        readonly apn: "fast.t-mobile.com";
        readonly authProtocol: "none";
    };
    readonly 'AT&T (US)': {
        readonly apn: "broadband";
        readonly authProtocol: "none";
    };
    readonly 'Verizon (US)': {
        readonly apn: "vzwinternet";
        readonly authProtocol: "none";
    };
    readonly 'Vodafone (EU)': {
        readonly apn: "internet.vodafone.net";
        readonly authProtocol: "none";
    };
    readonly 'Orange (EU)': {
        readonly apn: "internet";
        readonly authProtocol: "none";
    };
    readonly 'O2 (UK)': {
        readonly apn: "mobile.o2.co.uk";
        readonly authProtocol: "none";
    };
    readonly 'China Mobile': {
        readonly apn: "cmnet";
        readonly authProtocol: "none";
    };
    readonly 'NTT DoCoMo (JP)': {
        readonly apn: "mopera.net";
        readonly authProtocol: "pap";
    };
    readonly Custom: {
        readonly apn: "";
        readonly authProtocol: "none";
    };
};
/**
 * Signal strength interpretation
 * @description RSSI (Received Signal Strength Indicator) ranges in dBm with semantic color tokens
 */
export declare const SIGNAL_STRENGTH_RANGES: {
    readonly EXCELLENT: {
        readonly min: -70;
        readonly max: 0;
        readonly label: "Excellent";
        readonly color: "success";
    };
    readonly GOOD: {
        readonly min: -85;
        readonly max: -70;
        readonly label: "Good";
        readonly color: "success";
    };
    readonly FAIR: {
        readonly min: -100;
        readonly max: -85;
        readonly label: "Fair";
        readonly color: "warning";
    };
    readonly POOR: {
        readonly min: -120;
        readonly max: -100;
        readonly label: "Poor";
        readonly color: "destructive";
    };
    readonly NO_SIGNAL: {
        readonly min: number;
        readonly max: -120;
        readonly label: "No Signal";
        readonly color: "destructive";
    };
};
/**
 * Determine signal strength category from RSSI value (dBm)
 */
export declare function getSignalStrength(rssi: number): {
    readonly min: -70;
    readonly max: 0;
    readonly label: "Excellent";
    readonly color: "success";
} | {
    readonly min: -85;
    readonly max: -70;
    readonly label: "Good";
    readonly color: "success";
} | {
    readonly min: -100;
    readonly max: -85;
    readonly label: "Fair";
    readonly color: "warning";
} | {
    readonly min: -120;
    readonly max: -100;
    readonly label: "Poor";
    readonly color: "destructive";
} | {
    readonly min: number;
    readonly max: -120;
    readonly label: "No Signal";
    readonly color: "destructive";
};
/**
 * LTE Network Modes
 * @description Available network mode options for LTE modem configuration
 */
export declare const LTE_NETWORK_MODES: readonly [{
    readonly value: "auto";
    readonly label: "Auto (4G/3G/2G)";
}, {
    readonly value: "lte";
    readonly label: "4G LTE Only";
}, {
    readonly value: "3g";
    readonly label: "3G Only";
}, {
    readonly value: "gsm";
    readonly label: "2G GSM Only";
}];
/**
 * Validate APN format
 * @description Client-side helper for APN validation before submission
 * @returns true if APN is valid, false otherwise
 */
export declare function validateAPN(apn: string): boolean;
/**
 * Validate PIN format
 * @description Client-side helper for PIN validation (optional field)
 * @returns true if PIN is empty or valid, false otherwise
 */
export declare function validatePIN(pin: string): boolean;
//# sourceMappingURL=lte-modem.schema.d.ts.map