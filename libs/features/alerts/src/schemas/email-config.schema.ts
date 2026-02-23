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
export const emailConfigSchema = z.object({
  enabled: z.boolean().default(false),

  // SMTP Server Settings
  host: z
    .string()
    .min(1, 'Enter your SMTP server hostname (e.g., "smtp.gmail.com" or "mail.example.com")')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Hostname must be valid (use format: smtp.gmail.com or mail.example.com)'
    ),

  port: z
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535')
    .default(587),

  // Authentication
  username: z
    .string()
    .min(1, 'Enter your SMTP username (usually your email address)'),

  password: z
    .string()
    .min(1, 'Enter your SMTP password or app password'),

  // Email Addresses
  fromAddress: z
    .string()
    .min(1, 'Specify the sender email address (e.g., "alerts@example.com")')
    .email('From address must be a valid email (e.g., alerts@example.com)'),

  fromName: z
    .string()
    .optional(),

  toAddresses: z
    .array(z.string().email('Each recipient must be a valid email address'))
    .min(1, 'Add at least one recipient email address')
    .max(10, 'Maximum 10 recipient email addresses allowed'),

  // TLS Settings (Advanced)
  useTLS: z
    .boolean()
    .default(true),

  skipVerify: z
    .boolean()
    .default(false),
});

/**
 * Type inference from schema
 */
export type EmailConfig = z.infer<typeof emailConfigSchema>;

/**
 * Default values for new email configuration
 */
export const defaultEmailConfig: Partial<EmailConfig> = {
  enabled: false,
  host: '',
  port: 587,
  username: '',
  password: '',
  fromAddress: '',
  fromName: '',
  toAddresses: [],
  useTLS: true,
  skipVerify: false,
};

/**
 * Common SMTP port presets for quick configuration
 * Provides standard email service port options with TLS settings
 */
export const SMTP_PORT_PRESETS = [
  { port: 25, label: 'Port 25 (SMTP - Plain, unencrypted)', tls: false },
  { port: 587, label: 'Port 587 (SMTP - STARTTLS, recommended)', tls: true },
  { port: 465, label: 'Port 465 (SMTPS - TLS/SSL, legacy)', tls: true },
] as const;

/**
 * Validate a single email address
 *
 * @param email - Email address to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

/**
 * Transform email config form data to GraphQL input type
 * Maps field names to match backend API expectations
 *
 * @param config - Email configuration from form
 * @returns Formatted input for GraphQL mutation
 */
export function toEmailConfigInput(config: EmailConfig) {
  return {
    enabled: config.enabled,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    fromAddress: config.fromAddress,
    fromName: config.fromName || undefined,
    toAddresses: config.toAddresses,
    useTLS: config.useTLS,
    skipVerify: config.skipVerify,
  };
}
