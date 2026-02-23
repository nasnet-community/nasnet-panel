/**
 * Zod validation schema for webhook notification configuration
 * @description Per Task 9 (NAS-18.4): Webhook configuration form with HTTPS enforcement
 *
 * Matches backend CreateWebhookInput/UpdateWebhookInput types from GraphQL schema.
 */
import { z } from 'zod';

/**
 * Webhook configuration schema
 * @description Validates webhook endpoints with authentication, templates, and delivery options
 *
 * Field names match backend exactly from CreateWebhookInput
 */
export const webhookConfigSchema = z.object({
  // Basic Configuration
  name: z
    .string()
    .min(1, 'Webhook name is required (must be provided)')
    .max(100, 'Webhook name must not exceed 100 characters'),

  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),

  url: z
    .string()
    .min(1, 'Webhook URL is required (must be provided)')
    .url('Invalid URL format - must be a valid web address')
    .refine((url) => url.startsWith('https://'), {
      message: 'Only HTTPS URLs are allowed (no HTTP) for security',
    }),

  // Authentication
  authType: z.enum(['NONE', 'BASIC', 'BEARER']).default('NONE'),

  username: z.string().optional(),
  password: z.string().optional(),
  bearerToken: z.string().optional(),

  // Template Configuration
  template: z
    .enum(['GENERIC', 'SLACK', 'DISCORD', 'TEAMS', 'CUSTOM'])
    .default('GENERIC'),

  customTemplate: z.string().optional(),

  // Custom Headers
  headers: z.record(z.string(), z.string()).optional(),

  // Advanced Options
  method: z.enum(['POST', 'PUT']).default('POST').optional(),

  signingSecret: z.string().optional(),

  timeoutSeconds: z
    .number()
    .int()
    .min(1, 'Timeout must be at least 1 second')
    .max(60, 'Timeout must not exceed 60 seconds')
    .default(10)
    .optional(),

  retryEnabled: z.boolean().default(true).optional(),

  maxRetries: z
    .number()
    .int()
    .min(0, 'Maximum retries must be at least 0')
    .max(5, 'Maximum retries must not exceed 5')
    .default(3)
    .optional(),

  enabled: z.boolean().default(true),
}).refine(
  (data) => {
    // If BASIC auth is selected, username and password are required
    if (data.authType === 'BASIC') {
      return !!data.username && !!data.password;
    }
    return true;
  },
  {
    message: 'Username and password are both required when using Basic authentication',
    path: ['authType'],
  }
).refine(
  (data) => {
    // If BEARER auth is selected, bearerToken is required
    if (data.authType === 'BEARER') {
      return !!data.bearerToken;
    }
    return true;
  },
  {
    message: 'Bearer token must be provided when using Bearer token authentication',
    path: ['authType'],
  }
).refine(
  (data) => {
    // If CUSTOM template is selected, customTemplate is required
    if (data.template === 'CUSTOM') {
      return !!data.customTemplate;
    }
    return true;
  },
  {
    message: 'Custom JSON template is required when using Custom template type',
    path: ['template'],
  }
);

/**
 * Type inference from schema
 * @description Exported type representing validated webhook configuration
 */
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

/**
 * Default values for new webhook configuration
 * @description Pre-populated defaults for new webhook forms
 */
export const DEFAULT_WEBHOOK_CONFIG: Partial<WebhookConfig> = {
  name: '',
  description: '',
  url: '',
  authType: 'NONE',
  username: '',
  password: '',
  bearerToken: '',
  template: 'GENERIC',
  customTemplate: '',
  headers: {},
  method: 'POST',
  signingSecret: '',
  timeoutSeconds: 10,
  retryEnabled: true,
  maxRetries: 3,
  enabled: true,
};

/**
 * Template presets with descriptions
 * @description Available webhook payload templates for different services
 */
export const WEBHOOK_TEMPLATE_PRESETS = [
  { value: 'GENERIC', label: 'Generic JSON', description: 'Standard JSON payload' },
  { value: 'SLACK', label: 'Slack', description: 'Slack-compatible webhook format' },
  { value: 'DISCORD', label: 'Discord', description: 'Discord webhook format' },
  { value: 'TEAMS', label: 'Microsoft Teams', description: 'Teams connector format' },
  { value: 'CUSTOM', label: 'Custom Template', description: 'Define your own JSON template' },
] as const;

/**
 * Auth type options
 * @description Available authentication methods for webhook endpoints
 */
export const AUTH_TYPE_OPTIONS = [
  { value: 'NONE', label: 'No Authentication', description: 'Public webhook endpoint' },
  { value: 'BASIC', label: 'Basic Auth', description: 'Username and password' },
  { value: 'BEARER', label: 'Bearer Token', description: 'Authorization header token' },
] as const;

/**
 * Transform form data to GraphQL CreateWebhookInput
 * @description Converts validated webhook configuration to GraphQL mutation input, removing undefined values
 * @param config Validated webhook configuration object
 * @returns GraphQL CreateWebhookInput object
 */
export function toWebhookInput(config: WebhookConfig) {
  return {
    name: config.name,
    description: config.description || undefined,
    url: config.url,
    method: config.method || 'POST',
    authType: config.authType,
    username: config.authType === 'BASIC' ? config.username : undefined,
    password: config.authType === 'BASIC' ? config.password : undefined,
    bearerToken: config.authType === 'BEARER' ? config.bearerToken : undefined,
    headers: config.headers && Object.keys(config.headers).length > 0 ? config.headers : undefined,
    template: config.template,
    customTemplate: config.template === 'CUSTOM' ? config.customTemplate : undefined,
    signingSecret: config.signingSecret || undefined,
    timeoutSeconds: config.timeoutSeconds,
    retryEnabled: config.retryEnabled,
    maxRetries: config.maxRetries,
    enabled: config.enabled,
  };
}
