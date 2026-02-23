/**
 * Zod Validation Schema for Ping Form
 *
 * Validates ping test parameters with proper ranges and formats.
 */
import { z } from 'zod';
/**
 * Ping form validation schema
 *
 * Validates ping test parameters with actionable error messages:
 * - target: IPv4, IPv6, or hostname (e.g., 8.8.8.8, 2001:4860:4860::8888, google.com)
 * - count: 1-100 pings (default 10)
 * - size: 56-65500 bytes (default 56, standard is 56 for IPv4)
 * - timeout: 100-30000 milliseconds (default 1000ms = 1 second)
 * - sourceInterface: optional interface name to send pings from
 *
 * All error messages are specific and actionable for the user.
 */
export declare const pingFormSchema: z.ZodObject<{
    target: z.ZodEffects<z.ZodString, string, string>;
    count: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    sourceInterface: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    size: number;
    target: string;
    count: number;
    timeout: number;
    sourceInterface?: string | undefined;
}, {
    target: string;
    size?: number | undefined;
    count?: number | undefined;
    timeout?: number | undefined;
    sourceInterface?: string | undefined;
}>;
/**
 * Inferred TypeScript type from schema
 */
export type PingFormValues = z.infer<typeof pingFormSchema>;
//# sourceMappingURL=ping.schema.d.ts.map