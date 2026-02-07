/**
 * PPPoE Client Configuration Validation Schemas
 *
 * Zod schemas for validating PPPoE WAN client wizard (5 steps).
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { z } from 'zod';

// =============================================================================
// Step 1: Interface Selection
// =============================================================================

/**
 * Schema for Step 1: Interface Selection
 *
 * Validates physical interface selection for PPPoE client.
 * Only Ethernet interfaces are valid for PPPoE.
 */
export const pppoeInterfaceStepSchema = z.object({
  /**
   * Name for the PPPoE interface (virtual interface created by RouterOS)
   * Examples: "pppoe-wan", "pppoe-wan1", "pppoe-isp"
   */
  name: z
    .string({
      required_error: 'PPPoE interface name is required',
      invalid_type_error: 'Name must be a valid string',
    })
    .min(1, 'Name cannot be empty')
    .max(64, 'Name too long (max 64 characters)')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Name can only contain letters, numbers, hyphens, and underscores'
    ),

  /**
   * Physical interface to bind PPPoE to
   * Examples: "ether1", "ether2", "sfp1"
   */
  interface: z
    .string({
      required_error: 'Physical interface is required',
      invalid_type_error: 'Interface must be a valid string',
    })
    .min(1, 'Interface cannot be empty')
    .max(64, 'Interface name too long'),
});

export type PppoeInterfaceStepFormValues = z.infer<
  typeof pppoeInterfaceStepSchema
>;

// =============================================================================
// Step 2: Credentials
// =============================================================================

/**
 * Schema for Step 2: Authentication Credentials
 *
 * Validates PPPoE username and password.
 * IMPORTANT: Password is never logged or cached.
 */
export const pppoeCredentialsStepSchema = z.object({
  /**
   * PPPoE username (provided by ISP)
   * Examples: "user@isp.com", "username", "subscriber123"
   */
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a valid string',
    })
    .min(1, 'Username cannot be empty')
    .max(255, 'Username too long (max 255 characters)'),

  /**
   * PPPoE password (provided by ISP)
   * SECURITY: This value is NEVER logged or cached
   */
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a valid string',
    })
    .min(1, 'Password cannot be empty')
    .max(255, 'Password too long (max 255 characters)'),

  /**
   * Optional service name (ISP-specific)
   * Leave empty if not required by your ISP
   */
  serviceName: z.string().max(255, 'Service name too long').optional(),
});

export type PppoeCredentialsStepFormValues = z.infer<
  typeof pppoeCredentialsStepSchema
>;

// =============================================================================
// Step 3: Advanced Options
// =============================================================================

/**
 * Schema for Step 3: Advanced Options
 *
 * Validates PPPoE advanced settings (MTU, MRU, DNS, routing).
 * RouterOS constraints:
 * - MTU: 512-65535 (typical: 1492 for PPPoE)
 * - MRU: 512-65535 (typically same as MTU)
 */
export const pppoeOptionsStepSchema = z.object({
  /**
   * Maximum Transmission Unit (bytes)
   * Default: 1492 (Ethernet 1500 - 8 bytes PPPoE overhead)
   * Range: 512-65535
   */
  mtu: z
    .number({
      invalid_type_error: 'MTU must be a number',
    })
    .min(512, 'MTU must be at least 512 bytes')
    .max(65535, 'MTU cannot exceed 65535 bytes')
    .optional(),

  /**
   * Maximum Receive Unit (bytes)
   * Default: Same as MTU
   * Range: 512-65535
   */
  mru: z
    .number({
      invalid_type_error: 'MRU must be a number',
    })
    .min(512, 'MRU must be at least 512 bytes')
    .max(65535, 'MRU cannot exceed 65535 bytes')
    .optional(),

  /**
   * Whether to add default route via PPPoE gateway
   * Default: true
   * Warning: Disabling may cause connectivity issues for WAN
   */
  addDefaultRoute: z.boolean().default(true),

  /**
   * Whether to use DNS servers provided by ISP via PPPoE
   * Default: true
   * If disabled, static DNS configuration will be used
   */
  usePeerDNS: z.boolean().default(true),

  /**
   * Optional comment for identification
   * RouterOS limit: 255 characters
   */
  comment: z
    .string()
    .max(255, 'Comment cannot exceed 255 characters')
    .optional(),
});

export type PppoeOptionsStepFormValues = z.infer<
  typeof pppoeOptionsStepSchema
>;

// =============================================================================
// Complete PPPoE Configuration
// =============================================================================

/**
 * Complete PPPoE client configuration schema
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
  addDefaultRoute: pppoeOptionsStepSchema.shape.addDefaultRoute,
  usePeerDNS: pppoeOptionsStepSchema.shape.usePeerDNS,
  comment: pppoeOptionsStepSchema.shape.comment,
});

/**
 * TypeScript type inferred from complete pppoeClientSchema
 * Use this for final form submission
 */
export type PppoeClientFormValues = z.infer<typeof pppoeClientSchema>;

/**
 * Default values for PPPoE client wizard
 * Used to initialize React Hook Form
 */
export const pppoeClientDefaultValues: Partial<PppoeClientFormValues> = {
  name: '',
  interface: '',
  username: '',
  password: '',
  serviceName: '',
  mtu: 1492, // Standard PPPoE MTU (1500 - 8 bytes overhead)
  mru: 1492,
  addDefaultRoute: true,
  usePeerDNS: true,
  comment: '',
};

/**
 * MTU Presets for common scenarios
 */
export const MTU_PRESETS = {
  PPPOE_STANDARD: { value: 1492, label: 'Standard PPPoE (1492)' },
  PPPOE_CONSERVATIVE: { value: 1480, label: 'Conservative PPPoE (1480)' },
  ETHERNET_MAX: { value: 1500, label: 'Ethernet Max (1500)' },
  JUMBO_FRAMES: { value: 9000, label: 'Jumbo Frames (9000)' },
} as const;
