/**
 * Traceroute Form Validation Schema
 *
 * Zod schema for validating traceroute input form.
 * Validates target, maxHops, timeout, probeCount, and protocol.
 */

import { z } from 'zod';

/**
 * Validates IPv4 addresses
 */
const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

/**
 * Validates IPv6 addresses (simplified)
 */
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

/**
 * Validates hostnames
 */
const hostnameRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?|localhost)$/;

/**
 * Traceroute protocol enum for validation
 */
export const TracerouteProtocolEnum = z.enum(['ICMP', 'UDP', 'TCP']);

/**
 * Traceroute form validation schema
 */
export const tracerouteFormSchema = z.object({
  /**
   * Target hostname or IP address (required)
   * - Must be valid IPv4, IPv6, or hostname
   * - Examples: 8.8.8.8, google.com, 2001:4860:4860::8888
   */
  target: z
    .string()
    .min(1, 'Target is required')
    .max(255, 'Target must be less than 255 characters')
    .refine(
      (val) => {
        // Test if it's an IPv4, IPv6, or hostname
        return ipv4Regex.test(val) || ipv6Regex.test(val) || hostnameRegex.test(val);
      },
      {
        message: 'Target must be a valid IPv4, IPv6 address, or hostname',
      }
    ),

  /**
   * Maximum number of hops (optional, default: 30)
   * - Range: 1-64
   * - Lower values for faster results, higher for distant targets
   */
  maxHops: z
    .number()
    .int()
    .min(1, 'Max hops must be at least 1')
    .max(64, 'Max hops cannot exceed 64')
    .optional()
    .default(30),

  /**
   * Timeout per hop in milliseconds (optional, default: 3000)
   * - Range: 100-30000ms
   * - Lower values for faster results, higher for slow networks
   */
  timeout: z
    .number()
    .int()
    .min(100, 'Timeout must be at least 100ms')
    .max(30000, 'Timeout cannot exceed 30 seconds')
    .optional()
    .default(3000),

  /**
   * Number of probes per hop (optional, default: 3)
   * - Range: 1-5
   * - More probes = more accurate latency, but slower
   */
  probeCount: z
    .number()
    .int()
    .min(1, 'Probe count must be at least 1')
    .max(5, 'Probe count cannot exceed 5')
    .optional()
    .default(3),

  /**
   * Protocol to use for probes (optional, default: ICMP)
   * - ICMP: Most common, works on most networks
   * - UDP: Alternative if ICMP is blocked
   * - TCP: Useful for testing specific ports
   */
  protocol: TracerouteProtocolEnum.optional().default('ICMP'),
});

/**
 * Inferred type from schema
 */
export type TracerouteFormValues = z.infer<typeof tracerouteFormSchema>;
