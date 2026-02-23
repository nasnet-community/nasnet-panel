/**
 * Traceroute Form Validation Schema
 *
 * Zod schema for validating traceroute input form.
 * Validates target (IPv4/IPv6/hostname), maxHops, timeout, probeCount, and protocol.
 *
 * Note: Error messages are currently hardcoded; future enhancement would localize
 * via i18n keys using the namespace 'diagnostics.traceroute'.
 *
 * @see tracerouteFormSchema for validation rules
 * @see TracerouteFormValues for inferred type
 */
import { z } from 'zod';
/**
 * Traceroute protocol enum for validation
 * Supports standard network protocols for traceroute probes
 */
export declare const TracerouteProtocolEnum: z.ZodEnum<["ICMP", "UDP", "TCP"]>;
/**
 * Traceroute form validation schema (Zod)
 *
 * Validates all input fields for the traceroute form:
 * - target: IPv4, IPv6, or hostname (required)
 * - maxHops: 1-64 hops (default 30)
 * - timeout: 100-30000ms per hop (default 3000ms)
 * - probeCount: 1-5 probes per hop (default 3)
 * - protocol: ICMP, UDP, or TCP (default ICMP)
 *
 * @example
 * ```tsx
 * const result = tracerouteFormSchema.parse({
 *   target: '8.8.8.8',
 *   maxHops: 30,
 *   timeout: 3000,
 *   probeCount: 3,
 *   protocol: 'ICMP',
 * });
 * ```
 */
export declare const tracerouteFormSchema: z.ZodObject<{
    /**
     * Target hostname or IP address (required)
     * - Must be valid IPv4, IPv6, or hostname
     * - Examples: 8.8.8.8, google.com, 2001:4860:4860::8888
     */
    target: z.ZodEffects<z.ZodString, string, string>;
    /**
     * Maximum number of hops (optional, default: 30)
     * - Range: 1-64
     * - Lower values for faster results, higher for distant targets
     */
    maxHops: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /**
     * Timeout per hop in milliseconds (optional, default: 3000)
     * - Range: 100-30000ms
     * - Lower values for faster results, higher for slow networks
     */
    timeout: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /**
     * Number of probes per hop (optional, default: 3)
     * - Range: 1-5
     * - More probes = more accurate latency, but slower
     */
    probeCount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /**
     * Protocol to use for probes (optional, default: ICMP)
     * - ICMP: Most common, works on most networks
     * - UDP: Alternative if ICMP is blocked
     * - TCP: Useful for testing specific ports
     */
    protocol: z.ZodDefault<z.ZodOptional<z.ZodEnum<["ICMP", "UDP", "TCP"]>>>;
}, "strip", z.ZodTypeAny, {
    target: string;
    timeout: number;
    protocol: "TCP" | "UDP" | "ICMP";
    maxHops: number;
    probeCount: number;
}, {
    target: string;
    timeout?: number | undefined;
    protocol?: "TCP" | "UDP" | "ICMP" | undefined;
    maxHops?: number | undefined;
    probeCount?: number | undefined;
}>;
/**
 * Inferred type from schema
 */
export type TracerouteFormValues = z.infer<typeof tracerouteFormSchema>;
//# sourceMappingURL=traceroute.schema.d.ts.map