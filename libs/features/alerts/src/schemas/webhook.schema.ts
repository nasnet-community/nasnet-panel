/**
 * Zod validation schema for webhook notification configuration
 * Per Task 9 (NAS-18.4): Webhook configuration form with HTTPS enforcement
 *
 * Matches backend CreateWebhookInput/UpdateWebhookInput types from GraphQL schema.
 */
import { z } from 'zod';

/**
 * Webhook configuration schema
 *
 * Field names match backend exactly from CreateWebhookInput
 */
export const webhookConfigSchema = z.object({
  // Basic Configuration
  name: z
    .string()
    .min(1, 'Webhook name is required')
    .max(100, 'Name must be 100 characters or less'),

  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),

  url: z
    .string()
    .min(1, 'Webhook URL is required')
    .url('Invalid URL format')
    .refine((url) => url.startsWith('https://'), {
      message: 'Only HTTPS URLs are allowed for security',
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
    .max(60, 'Timeout must be at most 60 seconds')
    .default(10)
    .optional(),

  retryEnabled: z.boolean().default(true).optional(),

  maxRetries: z
    .number()
    .int()
    .min(0, 'Max retries must be at least 0')
    .max(5, 'Max retries must be at most 5')
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
    message: 'Username and password are required for Basic authentication',
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
    message: 'Bearer token is required for Bearer authentication',
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
    message: 'Custom template is required when template type is CUSTOM',
    path: ['template'],
  }
);

/**
 * Type inference from schema
 */
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

/**
 * Default values for new webhook configuration
 */
export const defaultWebhookConfig: Partial<WebhookConfig> = {
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
 */
export const AUTH_TYPE_OPTIONS = [
  { value: 'NONE', label: 'No Authentication', description: 'Public webhook endpoint' },
  { value: 'BASIC', label: 'Basic Auth', description: 'Username and password' },
  { value: 'BEARER', label: 'Bearer Token', description: 'Authorization header token' },
] as const;

/**
 * Transform form data to GraphQL CreateWebhookInput
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
