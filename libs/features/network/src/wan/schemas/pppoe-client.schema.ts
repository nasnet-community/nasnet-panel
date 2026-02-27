/**
 * @description PPPoE Client Configuration Validation Schemas
 *
 * Zod schemas for validating PPPoE WAN client wizard (5 steps).
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { z } from 'zod';

// =============================================================================
// Step 1: Interface Selection
// =============================================================================

/**
 * @description Schema for Step 1: Interface Selection
 *
 * Validates physical interface selection for PPPoE client.
 * Only Ethernet interfaces are valid for PPPoE.
 */
export const pppoeInterfaceStepSchema = z.object({
  /**
   * Name for the PPPoE interface (e.g. pppoe-wan, pppoe-isp)
   */
  name: z
    .string({
      required_error: 'PPPoE interface name is required',
      invalid_type_error: 'Name must be a valid string',
    })
    .min(1, 'Please provide a name for the PPPoE interface')
    .max(64, 'Interface name exceeds maximum length of 64 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, hyphens, and underscores'),

  /**
   * Physical interface to bind PPPoE to (e.g. ether1, ether2, sfp1)
   */
  interface: z
    .string({
      required_error: 'Physical interface is required',
      invalid_type_error: 'Interface must be a valid string',
    })
    .min(1, 'Please select a physical interface')
    .max(64, 'Interface name exceeds maximum length of 64 characters'),
});

export type PppoeInterfaceStepFormValues = z.infer<typeof pppoeInterfaceStepSchema>;

// =============================================================================
// Step 2: Credentials
// =============================================================================

/**
 * @description Schema for Step 2: Authentication Credentials
 *
 * Validates PPPoE username and password.
 * IMPORTANT: Password is never logged or cached.
 */
export const pppoeCredentialsStepSchema = z.object({
  /**
   * PPPoE username provided by ISP (e.g. user@isp.com)
   */
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a valid string',
    })
    .min(1, 'Please enter your PPPoE username')
    .max(255, 'Username exceeds maximum length of 255 characters'),

  /**
   * PPPoE password provided by ISP (NEVER logged or cached)
   */
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a valid string',
    })
    .min(1, 'Please enter your PPPoE password')
    .max(255, 'Password exceeds maximum length of 255 characters'),

  /**
   * Optional service name specific to your ISP
   */
  serviceName: z
    .string()
    .max(255, 'Service name exceeds maximum length of 255 characters')
    .optional(),
});

export type PppoeCredentialsStepFormValues = z.infer<typeof pppoeCredentialsStepSchema>;

// =============================================================================
// Step 3: Advanced Options
// =============================================================================

/**
 * @description Schema for Step 3: Advanced Options
 *
 * Validates PPPoE advanced settings (MTU, MRU, DNS, routing).
 * RouterOS constraints:
 * - MTU: 512-65535 (typical: 1492 for PPPoE)
 * - MRU: 512-65535 (typically same as MTU)
 */
export const pppoeOptionsStepSchema = z.object({
  /**
   * Maximum Transmission Unit in bytes (default: 1492 for PPPoE)
   */
  mtu: z
    .number({
      invalid_type_error: 'MTU must be a number',
    })
    .min(512, 'MTU must be at least 512 bytes')
    .max(65535, 'MTU cannot exceed 65535 bytes')
    .optional(),

  /**
   * Maximum Receive Unit in bytes (typically same as MTU)
   */
  mru: z
    .number({
      invalid_type_error: 'MRU must be a number',
    })
    .min(512, 'MRU must be at least 512 bytes')
    .max(65535, 'MRU cannot exceed 65535 bytes')
    .optional(),

  /**
   * Whether to add default route via PPPoE gateway (default: true)
   */
  shouldAddDefaultRoute: z.boolean().default(true),

  /**
   * Whether to use DNS servers provided by ISP (default: true)
   */
  shouldUsePeerDNS: z.boolean().default(true),

  /**
   * Optional comment for identification (max 255 characters)
   */
  comment: z.string().max(255, 'Comment cannot exceed 255 characters').optional(),
});

export type PppoeOptionsStepFormValues = z.infer<typeof pppoeOptionsStepSchema>;

// =============================================================================
// Complete PPPoE Configuration
// =============================================================================

/**
 * @description Complete PPPoE client configuration schema
 * Combines all wizard steps into a single schema for submission
 */
export const pppoeClientSchema = z.object({
  // Step 1: Interface
  name: pppoeInterfaceStepSchema.shape.name,
  interface: pppoeInterfaceStepSchema.shape.interface,

  // Step 2: Credentials
  username: pppoeCredentialsStepSchema.shape.username,
  password: pppoeCredentialsStepSchema.shape.password,
  serviceName: pppoeCredentialsStepSchema.shape.serviceName,

  // Step 3: Options
  mtu: pppoeOptionsStepSchema.shape.mtu,
  mru: pppoeOptionsStepSchema.shape.mru,
  shouldAddDefaultRoute: pppoeOptionsStepSchema.shape.shouldAddDefaultRoute,
  shouldUsePeerDNS: pppoeOptionsStepSchema.shape.shouldUsePeerDNS,
  comment: pppoeOptionsStepSchema.shape.comment,
});

/**
 * @description TypeScript type inferred from complete pppoeClientSchema
 */
export type PppoeClientFormValues = z.infer<typeof pppoeClientSchema>;

/**
 * @description Default values for PPPoE client wizard
 */
export const PPPOE_CLIENT_DEFAULT_VALUES: Partial<PppoeClientFormValues> = {
  name: '',
  interface: '',
  username: '',
  password: '',
  serviceName: '',
  mtu: 1492, // Standard PPPoE MTU (1500 - 8 bytes overhead)
  mru: 1492,
  shouldAddDefaultRoute: true,
  shouldUsePeerDNS: true,
  comment: '',
};

/**
 * @description MTU Presets for common scenarios
 */
export const MTU_PRESETS = {
  PPPOE_STANDARD: { value: 1492, label: 'Standard PPPoE (1492)' },
  PPPOE_CONSERVATIVE: { value: 1480, label: 'Conservative PPPoE (1480)' },
  ETHERNET_MAX: { value: 1500, label: 'Ethernet Max (1500)' },
  JUMBO_FRAMES: { value: 9000, label: 'Jumbo Frames (9000)' },
} as const;
