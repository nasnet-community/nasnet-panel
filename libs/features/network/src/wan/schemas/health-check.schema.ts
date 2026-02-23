/**
 * @description Health Check Schema
 *
 * Zod validation for WAN health check configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 */

import { z } from 'zod';

/**
 * @description Regex to validate IPv4 address or hostname
 */
const IPV4_OR_HOSTNAME_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/**
 * @description Health check target presets for common services
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
 * @description Interval presets in seconds for health checks
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
 * @description Validation schema for health check form
 */
export const healthCheckSchema = z.object({
  isEnabled: z.boolean(),

  target: z
    .string()
    .min(1, 'Please specify a target IP or hostname to check')
    .regex(IPV4_OR_HOSTNAME_REGEX, 'Target must be a valid IP address or hostname')
    .refine(
      (val) => val !== '0.0.0.0' && val !== '255.255.255.255',
      'Target IP address is invalid (cannot be 0.0.0.0 or 255.255.255.255)'
    ),

  intervalSeconds: z
    .number()
    .int('Interval must be a whole number')
    .min(5, 'Interval must be at least 5 seconds')
    .max(300, 'Interval cannot exceed 300 seconds (5 minutes)'),

  timeoutSeconds: z
    .number()
    .int('Timeout must be a whole number')
    .min(1, 'Timeout must be at least 1 second')
    .max(30, 'Timeout cannot exceed 30 seconds')
    .optional()
    .default(2),

  failureThreshold: z
    .number()
    .int('Failure threshold must be a whole number')
    .min(1, 'Failure threshold must be at least 1')
    .max(10, 'Failure threshold cannot exceed 10')
    .optional()
    .default(3),

  comment: z.string().max(255, 'Comment cannot exceed 255 characters').optional(),
});

/**
 * @description TypeScript type inferred from healthCheckSchema
 */
export type HealthCheckFormValues = z.infer<typeof healthCheckSchema>;

/**
 * @description Default form values for health check configuration
 */
export const HEALTH_CHECK_DEFAULT_VALUES: HealthCheckFormValues = {
  isEnabled: true,
  target: '1.1.1.1', // Cloudflare DNS
  intervalSeconds: 10, // 10 seconds
  timeoutSeconds: 2, // 2 seconds
  failureThreshold: 3, // 3 consecutive failures
  comment: '',
};

/**
 * @description Validates that timeout is less than interval
 * @param data Health check form values to validate
 * @returns Object with valid flag and optional error message
 */
export const validateTimeoutInterval = (
  data: HealthCheckFormValues
): { isValid: boolean; error?: string } => {
  if (data.timeoutSeconds && data.timeoutSeconds >= data.intervalSeconds) {
    return {
      isValid: false,
      error: 'Timeout must be less than the check interval',
    };
  }
  return { isValid: true };
};

/**
 * @description Checks if a target matches one of the common presets
 * @param target The target IP or hostname to check
 * @returns True if target is a known common preset
 */
export const isCommonTarget = (target: string): boolean => {
  return Object.values(HEALTH_CHECK_TARGETS).some((t) => t.value === target);
};
