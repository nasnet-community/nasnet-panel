/**
 * Health Check Schema
 *
 * Zod validation for WAN health check configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 */

import { z } from 'zod';

// IPv4 address or hostname regex
const ipv4OrHostnameRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/**
 * Health check target presets for common services
 */
export const HEALTH_CHECK_TARGETS = {
  CLOUDFLARE: {
    label: 'Cloudflare DNS',
    value: '1.1.1.1',
    description: 'Fast and privacy-focused DNS service',
  },
  GOOGLE: {
    label: 'Google DNS',
    value: '8.8.8.8',
    description: 'Reliable global DNS service',
  },
  QUAD9: {
    label: 'Quad9 DNS',
    value: '9.9.9.9',
    description: 'Security-focused DNS with threat blocking',
  },
  GATEWAY: {
    label: 'Gateway',
    value: 'gateway', // Placeholder, will be replaced with actual gateway
    description: 'Your WAN gateway (usually ISP router)',
  },
} as const;

/**
 * Interval presets (in seconds)
 */
export const INTERVAL_PRESETS = {
  FAST: {
    label: 'Fast (5s)',
    value: 5,
    description: 'Check every 5 seconds - higher overhead',
  },
  NORMAL: {
    label: 'Normal (10s)',
    value: 10,
    description: 'Check every 10 seconds - recommended',
  },
  SLOW: {
    label: 'Slow (30s)',
    value: 30,
    description: 'Check every 30 seconds - lower overhead',
  },
  MINIMAL: {
    label: 'Minimal (60s)',
    value: 60,
    description: 'Check every 60 seconds - minimal overhead',
  },
} as const;

/**
 * Validation schema for health check form
 */
export const healthCheckSchema = z.object({
  enabled: z.boolean(),

  target: z
    .string()
    .min(1, 'Target is required')
    .regex(ipv4OrHostnameRegex, 'Invalid IP address or hostname')
    .refine(
      (val) => val !== '0.0.0.0' && val !== '255.255.255.255',
      'Invalid target IP address'
    ),

  interval: z
    .number()
    .int('Interval must be an integer')
    .min(5, 'Interval must be at least 5 seconds')
    .max(300, 'Interval must not exceed 300 seconds (5 minutes)'),

  timeout: z
    .number()
    .int('Timeout must be an integer')
    .min(1, 'Timeout must be at least 1 second')
    .max(30, 'Timeout must not exceed 30 seconds')
    .optional()
    .default(2),

  failureThreshold: z
    .number()
    .int('Failure threshold must be an integer')
    .min(1, 'Failure threshold must be at least 1')
    .max(10, 'Failure threshold must not exceed 10')
    .optional()
    .default(3),

  comment: z.string().max(255, 'Comment must not exceed 255 characters').optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type HealthCheckFormValues = z.infer<typeof healthCheckSchema>;

/**
 * Default form values
 */
export const healthCheckDefaultValues: HealthCheckFormValues = {
  enabled: true,
  target: '1.1.1.1', // Cloudflare DNS
  interval: 10, // 10 seconds
  timeout: 2, // 2 seconds
  failureThreshold: 3, // 3 consecutive failures
  comment: '',
};

/**
 * Validation helper for timeout vs interval
 */
export const validateTimeoutInterval = (
  data: HealthCheckFormValues
): { valid: boolean; error?: string } => {
  if (data.timeout && data.timeout >= data.interval) {
    return {
      valid: false,
      error: 'Timeout must be less than interval',
    };
  }
  return { valid: true };
};

/**
 * Helper to check if target is reachable (for preview)
 */
export const isCommonTarget = (target: string): boolean => {
  return Object.values(HEALTH_CHECK_TARGETS).some((t) => t.value === target);
};
