/**
 * DNS Lookup Tool - Validation Schema
 *
 * Zod schema for DNS lookup form validation including hostname validation
 * (RFC 1123), IPv4/IPv6 validation for reverse lookups, and form field constraints.
 *
 * @description Provides actionable validation rules for DNS lookup inputs:
 * - Hostname: RFC 1123 compliant (max 253 chars, labels max 63)
 * - IPv4: Standard dotted-quad notation (0.0.0.0 to 255.255.255.255)
 * - IPv6: Full and compressed notation support
 * - Record Type: Limited to supported DNS record types (A, AAAA, MX, etc.)
 * - Timeout: 100-30000ms range for query timeout
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.2
 * @see RFC 1123 - Requirements for Internet Hosts
 */
import { z } from 'zod';
/**
 * Zod schema for DNS lookup form validation.
 *
 * Validates:
 * - hostname: Domain name (RFC 1123) or IP address (IPv4/IPv6)
 * - recordType: DNS record type (A, AAAA, MX, TXT, etc.)
 * - server: Optional DNS server IP (IPv4/IPv6) or "all" for comparison
 * - timeout: Query timeout (100-30000ms)
 */
export declare const dnsLookupFormSchema: z.ZodObject<{
    hostname: z.ZodEffects<z.ZodString, string, string>;
    recordType: z.ZodDefault<z.ZodEnum<["A", "AAAA", "MX", "TXT", "CNAME", "NS", "PTR", "SOA", "SRV"]>>;
    server: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    hostname: string;
    recordType: "A" | "AAAA" | "CNAME" | "MX" | "NS" | "PTR" | "SOA" | "SRV" | "TXT";
    server?: string | undefined;
}, {
    hostname: string;
    server?: string | undefined;
    timeout?: number | undefined;
    recordType?: "A" | "AAAA" | "CNAME" | "MX" | "NS" | "PTR" | "SOA" | "SRV" | "TXT" | undefined;
}>;
export type DnsLookupFormValues = z.infer<typeof dnsLookupFormSchema>;
//# sourceMappingURL=dnsLookup.schema.d.ts.map