/**
 * @description Health Check Schema
 *
 * Zod validation for WAN health check configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 */
import { z } from 'zod';
/**
 * @description Health check target presets for common services
 */
export declare const HEALTH_CHECK_TARGETS: {
    readonly CLOUDFLARE: {
        readonly label: "Cloudflare DNS";
        readonly value: "1.1.1.1";
        readonly description: "Fast and privacy-focused DNS service";
    };
    readonly GOOGLE: {
        readonly label: "Google DNS";
        readonly value: "8.8.8.8";
        readonly description: "Reliable global DNS service";
    };
    readonly QUAD9: {
        readonly label: "Quad9 DNS";
        readonly value: "9.9.9.9";
        readonly description: "Security-focused DNS with threat blocking";
    };
    readonly GATEWAY: {
        readonly label: "Gateway";
        readonly value: "gateway";
        readonly description: "Your WAN gateway (usually ISP router)";
    };
};
/**
 * @description Interval presets in seconds for health checks
 */
export declare const INTERVAL_PRESETS: {
    readonly FAST: {
        readonly label: "Fast (5s)";
        readonly value: 5;
        readonly description: "Check every 5 seconds - higher overhead";
    };
    readonly NORMAL: {
        readonly label: "Normal (10s)";
        readonly value: 10;
        readonly description: "Check every 10 seconds - recommended";
    };
    readonly SLOW: {
        readonly label: "Slow (30s)";
        readonly value: 30;
        readonly description: "Check every 30 seconds - lower overhead";
    };
    readonly MINIMAL: {
        readonly label: "Minimal (60s)";
        readonly value: 60;
        readonly description: "Check every 60 seconds - minimal overhead";
    };
};
/**
 * @description Validation schema for health check form
 */
export declare const healthCheckSchema: z.ZodObject<{
    isEnabled: z.ZodBoolean;
    target: z.ZodEffects<z.ZodString, string, string>;
    intervalSeconds: z.ZodNumber;
    timeoutSeconds: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    failureThreshold: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    target: string;
    isEnabled: boolean;
    timeoutSeconds: number;
    failureThreshold: number;
    intervalSeconds: number;
    comment?: string | undefined;
}, {
    target: string;
    isEnabled: boolean;
    intervalSeconds: number;
    comment?: string | undefined;
    timeoutSeconds?: number | undefined;
    failureThreshold?: number | undefined;
}>;
/**
 * @description TypeScript type inferred from healthCheckSchema
 */
export type HealthCheckFormValues = z.infer<typeof healthCheckSchema>;
/**
 * @description Default form values for health check configuration
 */
export declare const HEALTH_CHECK_DEFAULT_VALUES: HealthCheckFormValues;
/**
 * @description Validates that timeout is less than interval
 * @param data Health check form values to validate
 * @returns Object with valid flag and optional error message
 */
export declare const validateTimeoutInterval: (data: HealthCheckFormValues) => {
    isValid: boolean;
    error?: string;
};
/**
 * @description Checks if a target matches one of the common presets
 * @param target The target IP or hostname to check
 * @returns True if target is a known common preset
 */
export declare const isCommonTarget: (target: string) => boolean;
//# sourceMappingURL=health-check.schema.d.ts.map