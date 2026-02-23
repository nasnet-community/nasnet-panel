/**
 * Risk-Based Validation Strategy Configuration
 *
 * Defines validation behavior based on operation risk level.
 * Higher risk operations require more validation stages.
 *
 * @module @nasnet/core/forms/validation-strategy
 */

import type {
  ValidationStrategy,
  ValidationConfig,
  ValidationStage,
} from './types';

/**
 * Configuration for each validation strategy.
 *
 * Maps validation strategy levels to their respective configurations,
 * including validation stages, confirmation requirements, and risk profiles.
 *
 * @example
 * const config = VALIDATION_CONFIGS.high;
 * // Returns full validation pipeline with dry-run for WAN changes
 */
export const VALIDATION_CONFIGS: Record<ValidationStrategy, ValidationConfig> =
  {
    /**
     * Low-risk: Client-side Zod only.
     * Use for: WiFi password, display name, comment fields.
     */
    low: {
      stages: ['schema', 'syntax'],
      clientOnly: true,
      requiresConfirmation: false,
    },

    /**
     * Medium-risk: Zod + Backend API validation.
     * Use for: Firewall rules, DHCP settings, VPN peer config.
     */
    medium: {
      stages: ['schema', 'syntax', 'cross-resource', 'dependencies'],
      clientOnly: false,
      requiresConfirmation: false,
    },

    /**
     * High-risk: Full validation pipeline with dry-run.
     * Use for: WAN link changes, routing tables, VPN deletion, factory reset.
     */
    high: {
      stages: [
        'schema',
        'syntax',
        'cross-resource',
        'dependencies',
        'network',
        'platform',
        'dry-run',
      ],
      clientOnly: false,
      requiresConfirmation: true,
      confirmationSteps: ['preview', 'countdown'],
    },
  };

/**
 * Human-readable stage names for UI display.
 */
export const STAGE_LABELS: Record<ValidationStage, string> = {
  schema: 'Schema Validation',
  syntax: 'Format Check',
  'cross-resource': 'Conflict Detection',
  dependencies: 'Dependencies',
  network: 'Network Availability',
  platform: 'Router Compatibility',
  'dry-run': 'Simulation',
};

/**
 * Stage descriptions for help text.
 */
export const STAGE_DESCRIPTIONS: Record<ValidationStage, string> = {
  schema: 'Validating data types and structure',
  syntax: 'Checking IP addresses, MAC addresses, and formats',
  'cross-resource': 'Checking for IP and resource conflicts',
  dependencies: 'Verifying required resources exist',
  network: 'Checking IP, port, and VLAN availability',
  platform: 'Verifying router capability support',
  'dry-run': 'Simulating changes on router',
};

/**
 * Get the validation config for a given strategy.
 */
export function getValidationConfig(
  strategy: ValidationStrategy
): ValidationConfig {
  return VALIDATION_CONFIGS[strategy];
}

/**
 * Check if a stage should run for a given strategy.
 */
export function shouldRunStage(
  strategy: ValidationStrategy,
  stage: ValidationStage
): boolean {
  return VALIDATION_CONFIGS[strategy].stages.includes(stage);
}

/**
 * Get ordered stages for a strategy.
 */
export function getOrderedStages(
  strategy: ValidationStrategy
): ValidationStage[] {
  return VALIDATION_CONFIGS[strategy].stages;
}
