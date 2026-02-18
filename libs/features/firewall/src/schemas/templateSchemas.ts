/**
 * Template Validation Schemas
 *
 * Zod validation schemas for firewall template variables, rules, and full templates.
 * Supports dynamic schema generation per variable type with comprehensive error messages.
 *
 * @module @nasnet/features/firewall/schemas
 */

import { z } from 'zod';

// Re-export types and schemas from core/types
export type {
  VariableType,
  TemplateCategory,
  TemplateComplexity,
  FirewallTable,
  TemplateConflictType,
  TemplateVariable,
  TemplateRule,
  TemplateConflict,
  ImpactAnalysis,
  FirewallTemplate,
  TemplatePreviewResult,
  FirewallTemplateResult,
} from '@nasnet/core/types';

export {
  VariableTypeSchema,
  TemplateCategorySchema,
  TemplateComplexitySchema,
  FirewallTableSchema,
  TemplateConflictTypeSchema,
  TemplateVariableSchema,
  TemplateRuleSchema,
  TemplateConflictSchema,
  ImpactAnalysisSchema,
  FirewallTemplateSchema,
  TemplatePreviewResultSchema,
  FirewallTemplateResultSchema,
} from '@nasnet/core/types';

// Import types for use in validation functions
import type { TemplateVariable, FirewallTemplate } from '@nasnet/core/types';

// ============================================
// VALIDATION PATTERNS
// ============================================

/**
 * IPv4 address pattern (e.g., 192.168.1.1)
 */
export const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * CIDR notation pattern (e.g., 192.168.1.0/24)
 */
export const cidrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

/**
 * Port range pattern (e.g., 8000-9000)
 */
export const portRangePattern = /^(\d{1,5})-(\d{1,5})$/;

/**
 * Interface name pattern (e.g., ether1, bridge1, vlan10)
 */
export const interfacePattern = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * Semver version pattern (e.g., 1.0.0, 2.3.1-beta)
 */
export const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates IPv4 address
 */
export function validateIPv4(val: string): boolean {
  return ipv4Pattern.test(val);
}

/**
 * Validates CIDR notation
 */
export function validateCIDR(val: string): boolean {
  return cidrPattern.test(val);
}

/**
 * Validates port number (1-65535)
 */
export function validatePort(val: string | number): boolean {
  const port = typeof val === 'string' ? parseInt(val, 10) : val;
  return !isNaN(port) && port >= 1 && port <= 65535;
}

/**
 * Validates port range format and ensures start < end
 */
export function validatePortRange(val: string): boolean {
  const match = val.match(portRangePattern);
  if (!match) return false;

  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);

  return validatePort(start) && validatePort(end) && start < end;
}

/**
 * Validates VLAN ID (1-4094)
 */
export function validateVlanId(val: string | number): boolean {
  const vlanId = typeof val === 'string' ? parseInt(val, 10) : val;
  return !isNaN(vlanId) && vlanId >= 1 && vlanId <= 4094;
}

/**
 * Validates interface name
 */
export function validateInterface(val: string): boolean {
  return interfacePattern.test(val) && val.length <= 32;
}

/**
 * Validates semver version
 */
export function validateSemver(val: string): boolean {
  return semverPattern.test(val);
}

// ============================================
// DYNAMIC SCHEMA GENERATION
// ============================================

/**
 * Generate Zod schema for a variable based on its type
 *
 * @param variable - Template variable configuration
 * @returns Zod schema for validating the variable value
 *
 * @example
 * ```ts
 * const interfaceVar = { name: 'LAN_INTERFACE', type: 'INTERFACE', required: true };
 * const schema = createVariableValueSchema(interfaceVar);
 * schema.parse('bridge1'); // Valid
 * schema.parse(''); // Throws if required
 * ```
 */
export function createVariableValueSchema(variable: TemplateVariable): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (variable.type) {
    case 'INTERFACE':
      schema = z.string().refine(validateInterface, {
        message: `${variable.label} must be a valid interface name (e.g., ether1, bridge1)`,
      });

      if (variable.options && variable.options.length > 0) {
        schema = z.enum(variable.options as [string, ...string[]]);
      }
      break;

    case 'SUBNET':
      schema = z.string().refine(validateCIDR, {
        message: `${variable.label} must be in CIDR notation (e.g., 192.168.1.0/24)`,
      });
      break;

    case 'IP':
      schema = z.string().refine(validateIPv4, {
        message: `${variable.label} must be a valid IPv4 address (e.g., 192.168.1.1)`,
      });
      break;

    case 'PORT':
      schema = z.string().refine((val) => validatePort(val), {
        message: `${variable.label} must be a valid port number (1-65535)`,
      });
      break;

    case 'PORT_RANGE':
      schema = z.string().refine(validatePortRange, {
        message: `${variable.label} must be a valid port range (e.g., 8000-9000)`,
      });
      break;

    case 'VLAN_ID':
      schema = z.string().refine((val) => validateVlanId(val), {
        message: `${variable.label} must be a valid VLAN ID (1-4094)`,
      });
      break;

    case 'STRING':
      schema = z.string().min(1, `${variable.label} cannot be empty`).max(255);
      break;

    case 'NUMBER':
      return z.number().int();

    case 'BOOLEAN':
      return z.boolean();

    default:
      schema = z.string();
  }

  // Handle required vs optional
  if (!variable.required && ((variable.type as string) !== 'NUMBER' && (variable.type as string) !== 'BOOLEAN')) {
    return schema.optional();
  }

  return schema;
}

/**
 * Create complete variables validation schema for a template
 *
 * @param template - Firewall template
 * @returns Zod schema for validating all template variables
 *
 * @example
 * ```ts
 * const template = mockBasicSecurityTemplate;
 * const schema = createTemplateVariablesSchema(template);
 * const result = schema.parse({
 *   LAN_INTERFACE: 'bridge1',
 *   LAN_SUBNET: '192.168.88.0/24',
 * });
 * ```
 */
export function createTemplateVariablesSchema(template: FirewallTemplate): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  template.variables.forEach((variable) => {
    shape[variable.name] = createVariableValueSchema(variable);
  });

  return z.object(shape);
}

/**
 * Validate template variables and return detailed errors
 *
 * @param template - Firewall template
 * @param values - Variable values to validate
 * @returns Validation result with errors
 */
export function validateTemplateVariables(
  template: FirewallTemplate,
  values: Record<string, unknown>
): { success: boolean; errors: Array<{ field: string; message: string }> } {
  const schema = createTemplateVariablesSchema(template);
  const result = schema.safeParse(values);

  if (result.success) {
    return { success: true, errors: [] };
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, errors };
}
