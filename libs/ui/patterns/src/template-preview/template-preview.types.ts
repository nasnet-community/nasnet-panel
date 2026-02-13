/**
 * Template Preview Types
 *
 * Types for the TemplatePreview pattern component.
 * Provides template variable editing and rule preview.
 */

import { z } from 'zod';

// Import template types from fixtures (temporary until in core)
export type {
  FirewallTemplate,
  TemplateVariable,
  TemplateRule,
  TemplatePreviewResult,
  TemplateConflict,
  ImpactAnalysis,
  VariableType,
} from '../__test-utils__/firewall-templates/template-fixtures';

// Re-export for local use
import type {
  FirewallTemplate,
  TemplateVariable,
  TemplateRule,
  TemplatePreviewResult,
  VariableType,
} from '../__test-utils__/firewall-templates/template-fixtures';

/**
 * Template variable values (key-value pairs)
 */
export type TemplateVariableValues = Record<string, string>;

/**
 * Variable validation error
 */
export interface VariableValidationError {
  variableName: string;
  message: string;
}

/**
 * Preview mode
 */
export type PreviewMode = 'variables' | 'rules' | 'conflicts' | 'impact';

/**
 * Preview tab configuration
 */
export interface PreviewTab {
  id: PreviewMode;
  label: string;
  icon?: string;
  disabled?: boolean;
}

// ============================================================================
// Zod Schemas for Variable Validation
// ============================================================================

/**
 * Validate IPv4 address format
 */
export function isValidIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Validate CIDR subnet format
 */
export function isValidCIDR(value: string): boolean {
  const [ip, mask] = value.split('/');
  if (!ip || !mask) return false;

  const maskNum = parseInt(mask, 10);
  if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;

  return isValidIPv4(ip);
}

/**
 * Validate port number
 */
export function isValidPort(value: number | string): boolean {
  const port = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(port) && port >= 1 && port <= 65535;
}

/**
 * Validate VLAN ID
 */
export function isValidVLAN(value: number | string): boolean {
  const vlan = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(vlan) && vlan >= 1 && vlan <= 4094;
}

/**
 * Zod schema for STRING variable type
 */
export const StringVariableSchema = z
  .string()
  .min(1, 'Value is required')
  .max(64, 'Value must be 64 characters or less');

/**
 * Zod schema for INTERFACE variable type
 */
export const InterfaceVariableSchema = z
  .string()
  .min(1, 'Interface is required')
  .max(32, 'Interface name too long');

/**
 * Zod schema for SUBNET variable type
 */
export const SubnetVariableSchema = z.string().refine(
  (value) => isValidCIDR(value),
  {
    message: 'Invalid subnet format (use CIDR notation, e.g., 192.168.1.0/24)',
  }
);

/**
 * Zod schema for IP variable type
 */
export const IPVariableSchema = z.string().refine((value) => isValidIPv4(value), {
  message: 'Invalid IPv4 address format',
});

/**
 * Zod schema for PORT variable type
 */
export const PortVariableSchema = z.string().refine(
  (value) => {
    const port = parseInt(value, 10);
    return isValidPort(port);
  },
  {
    message: 'Port must be between 1 and 65535',
  }
);

/**
 * Zod schema for VLAN_ID variable type
 */
export const VLANVariableSchema = z.string().refine(
  (value) => {
    const vlan = parseInt(value, 10);
    return isValidVLAN(vlan);
  },
  {
    message: 'VLAN ID must be between 1 and 4094',
  }
);

/**
 * Get Zod schema for a variable type
 */
export function getVariableSchema(variableType: VariableType): z.ZodSchema {
  switch (variableType) {
    case 'STRING':
      return StringVariableSchema;
    case 'INTERFACE':
      return InterfaceVariableSchema;
    case 'SUBNET':
      return SubnetVariableSchema;
    case 'IP':
      return IPVariableSchema;
    case 'PORT':
      return PortVariableSchema;
    case 'VLAN_ID':
      return VLANVariableSchema;
    default:
      return StringVariableSchema;
  }
}

/**
 * Create a dynamic Zod schema for template variables
 */
export function createTemplateVariablesSchema(
  variables: TemplateVariable[]
): z.ZodObject<Record<string, z.ZodSchema>> {
  const shape: Record<string, z.ZodSchema> = {};

  variables.forEach((variable) => {
    const baseSchema = getVariableSchema(variable.type);

    // Make optional if not required
    shape[variable.name] = variable.required
      ? baseSchema
      : baseSchema.optional();
  });

  return z.object(shape);
}
