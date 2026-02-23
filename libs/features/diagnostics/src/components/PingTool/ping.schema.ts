/**
 * Zod Validation Schema for Ping Form
 *
 * Validates ping test parameters with proper ranges and formats.
 */

import { z } from 'zod';
import { isValidIPv4 } from '@nasnet/core/utils';
import { isValidIPv6, isValidHostname } from './ping.utils';

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
export const pingFormSchema = z.object({
  target: z
    .string()
    .min(1, 'Enter a target IP address or hostname (e.g., 8.8.8.8 or google.com)')
    .refine(
      (val) => isValidIPv4(val) || isValidIPv6(val) || isValidHostname(val),
      'Target must be a valid IPv4 address (e.g., 8.8.8.8), IPv6 address (e.g., 2001:4860::8888), or hostname (e.g., google.com)'
    ),
  count: z.coerce
    .number()
    .int('Ping count must be a whole number')
    .min(1, 'Send at least 1 ping')
    .max(100, 'Cannot send more than 100 pings (to avoid excessive traffic)')
    .default(10),
  size: z.coerce
    .number()
    .int('Packet size must be a whole number')
    .min(56, 'Minimum packet size is 56 bytes (standard ICMP)')
    .max(65500, 'Maximum packet size is 65500 bytes')
    .default(56),
  timeout: z.coerce
    .number()
    .int('Timeout must be a whole number')
    .min(100, 'Timeout must be at least 100ms')
    .max(30000, 'Timeout cannot exceed 30 seconds (30000ms)')
    .default(1000),
  sourceInterface: z.string().optional(),
});

/**
 * Inferred TypeScript type from schema
 */
export type PingFormValues = z.infer<typeof pingFormSchema>;
