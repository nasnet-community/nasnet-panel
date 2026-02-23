/**
 * Zod validation schema for email notification configuration
 *
 * @description Comprehensive validation for SMTP email configuration including host,
 * port, authentication, sender/recipient addresses, and TLS settings. All error messages
 * are actionable, not generic. Matches backend EmailConfigInput type from GraphQL schema.
 *
 * @module @nasnet/features/alerts/schemas
 * @see NAS-18.3: Email notification configuration with Platform Presenters
 */
import { z } from 'zod';
/**
 * Email configuration schema
 *
 * Field names match backend exactly:
 * - host (smtp_host in backend)
 * - port (smtp_port in backend)
 * - fromAddress (from_address in backend)
 * - fromName (from_name in backend)
 * - toAddresses (to_addresses in backend - array!)
 * - useTLS (use_tls in backend)
 * - skipVerify (skip_verify in backend)
 * - username
 * - password
 */
/**
 * Email configuration schema with actionable validation messages
 */
export declare const emailConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    host: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
    password: z.ZodString;
    fromAddress: z.ZodString;
    fromName: z.ZodOptional<z.ZodString>;
    toAddresses: z.ZodArray<z.ZodString, "many">;
    useTLS: z.ZodDefault<z.ZodBoolean>;
    skipVerify: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    enabled: boolean;
    host: string;
    port: number;
    fromAddress: string;
    toAddresses: string[];
    useTLS: boolean;
    skipVerify: boolean;
    fromName?: string | undefined;
}, {
    password: string;
    username: string;
    host: string;
    fromAddress: string;
    toAddresses: string[];
    enabled?: boolean | undefined;
    port?: number | undefined;
    fromName?: string | undefined;
    useTLS?: boolean | undefined;
    skipVerify?: boolean | undefined;
}>;
/**
 * Type inference from schema
 */
export type EmailConfig = z.infer<typeof emailConfigSchema>;
/**
 * Default values for new email configuration
 */
export declare const defaultEmailConfig: Partial<EmailConfig>;
/**
 * Common SMTP port presets for quick configuration
 * Provides standard email service port options with TLS settings
 */
export declare const SMTP_PORT_PRESETS: readonly [{
    readonly port: 25;
    readonly label: "Port 25 (SMTP - Plain, unencrypted)";
    readonly tls: false;
}, {
    readonly port: 587;
    readonly label: "Port 587 (SMTP - STARTTLS, recommended)";
    readonly tls: true;
}, {
    readonly port: 465;
    readonly label: "Port 465 (SMTPS - TLS/SSL, legacy)";
    readonly tls: true;
}];
/**
 * Validate a single email address
 *
 * @param email - Email address to validate
 * @returns true if valid email format, false otherwise
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Transform email config form data to GraphQL input type
 * Maps field names to match backend API expectations
 *
 * @param config - Email configuration from form
 * @returns Formatted input for GraphQL mutation
 */
export declare function toEmailConfigInput(config: EmailConfig): {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password: string;
    fromAddress: string;
    fromName: string | undefined;
    toAddresses: string[];
    useTLS: boolean;
    skipVerify: boolean;
};
//# sourceMappingURL=email-config.schema.d.ts.map