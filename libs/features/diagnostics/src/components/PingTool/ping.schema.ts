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
 * Validates:
 * - target: IPv4, IPv6, or hostname
 * - count: 1-100 pings (default 10)
 * - size: 56-65500 bytes (default 56)
 * - timeout: 100-30000 ms (default 1000)
 * - sourceInterface: optional interface name
 */
export const pingFormSchema = z.object({
  target: z
    .string()
    .min(1, 'Target is required')
    .refine(
      (val) => isValidIPv4(val) || isValidIPv6(val) || isValidHostname(val),
      'Must be a valid IPv4, IPv6 address, or hostname'
    ),
  count: z.coerce.number().int().min(1).max(100).default(10),
  size: z.coerce.number().int().min(56).max(65500).default(56),
  timeout: z.coerce.number().int().min(100).max(30000).default(1000),
  sourceInterface: z.string().optional(),
});

/**
 * Inferred TypeScript type from schema
 */
export type PingFormValues = z.infer<typeof pingFormSchema>;
