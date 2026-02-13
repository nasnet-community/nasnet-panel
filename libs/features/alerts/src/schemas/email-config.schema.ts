/**
 * Zod validation schema for email notification configuration
 * Per Task 6 (NAS-18.3): Email settings with Platform Presenters
 *
 * Matches backend EmailConfigInput type from GraphQL schema.
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
export const emailConfigSchema = z.object({
  enabled: z.boolean().default(false),

  // SMTP Server Settings
  host: z
    .string()
    .min(1, 'SMTP host is required')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Invalid hostname format'
    ),

  port: z
    .number()
    .int()
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be at most 65535')
    .default(587),

  // Authentication
  username: z
    .string()
    .min(1, 'Username is required'),

  password: z
    .string()
    .min(1, 'Password is required'),

  // Email Addresses
  fromAddress: z
    .string()
    .min(1, 'From address is required')
    .email('Invalid email address'),

  fromName: z
    .string()
    .optional(),

  toAddresses: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one recipient is required')
    .max(10, 'Maximum 10 recipients allowed'),

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
 * Common SMTP port presets
 */
export const SMTP_PORT_PRESETS = [
  { port: 25, label: 'Port 25 (SMTP - Plain)', tls: false },
  { port: 587, label: 'Port 587 (SMTP - STARTTLS)', tls: true },
  { port: 465, label: 'Port 465 (SMTPS - TLS/SSL)', tls: true },
] as const;

/**
 * Validate a single email address
 */
export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

/**
 * Transform form data to GraphQL input
 * Maps field names to match backend expectations
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
