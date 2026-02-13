/**
 * Template Validator Utility
 *
 * Zod validation wrapper for firewall templates.
 * Provides detailed validation results with error reporting.
 *
 * @module @nasnet/features/firewall/utils
 */

import { z } from 'zod';
import {
  FirewallTemplateSchema,
  type FirewallTemplate,
  type TemplateVariable,
  validateTemplateVariables,
  createTemplateVariablesSchema,
} from '../schemas/templateSchemas';

// ============================================
// VALIDATION RESULT TYPES
// ============================================

/**
 * Validation error detail
 */
export interface ValidationError {
  /** Field path (e.g., "name", "variables.0.name") */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether validation passed */
  success: boolean;
  /** Validated template (only if success is true) */
  data?: FirewallTemplate;
  /** Validation errors (only if success is false) */
  errors: ValidationError[];
  /** Warning messages (non-blocking) */
  warnings: string[];
}

/**
 * Variable values validation result
 */
export interface VariableValuesValidationResult {
  /** Whether validation passed */
  success: boolean;
  /** Validated values (only if success is true) */
  data?: Record<string, unknown>;
  /** Validation errors (only if success is false) */
  errors: ValidationError[];
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a firewall template structure
 *
 * @param template - Template object to validate
 * @returns Validation result with errors or validated data
 *
 * @example
 * ```ts
 * const result = validateTemplate(importedTemplate);
 * if (result.success) {
 *   console.log('Valid template:', result.data);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateTemplate(template: unknown): TemplateValidationResult {
  const warnings: string[] = [];

  try {
    // Parse with Zod schema
    const parsed = FirewallTemplateSchema.parse(template);

    // Additional business logic validations

    // Check for duplicate variable names
    const variableNames = new Set<string>();
    for (const variable of parsed.variables) {
      if (variableNames.has(variable.name)) {
        warnings.push(`Duplicate variable name: ${variable.name}`);
      }
      variableNames.add(variable.name);
    }

    // Check if rules reference undefined variables
    const referencedVariables = new Set<string>();
    for (const rule of parsed.rules) {
      const propsJson = JSON.stringify(rule.properties);
      const matches = propsJson.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/g);
      if (matches) {
        for (const match of matches) {
          const varName = match.replace(/\{\{|\}\}/g, '');
          referencedVariables.add(varName);
          if (!variableNames.has(varName)) {
            warnings.push(`Rule references undefined variable: ${varName}`);
          }
        }
      }
    }

    // Check for unused variables
    for (const varName of variableNames) {
      if (!referencedVariables.has(varName)) {
        warnings.push(`Variable "${varName}" is defined but never used in rules`);
      }
    }

    // Check for potential conflicts in rule positions
    const positionCounts = new Map<number, number>();
    for (const rule of parsed.rules) {
      if (rule.position !== null) {
        const count = positionCounts.get(rule.position) || 0;
        positionCounts.set(rule.position, count + 1);
      }
    }
    for (const [position, count] of positionCounts) {
      if (count > 1) {
        warnings.push(`Multiple rules (${count}) assigned to position ${position}`);
      }
    }

    return {
      success: true,
      data: parsed,
      errors: [],
      warnings,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return {
        success: false,
        errors,
        warnings,
      };
    }

    // Unexpected error
    return {
      success: false,
      errors: [
        {
          field: '',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
      ],
      warnings,
    };
  }
}

/**
 * Validate template variable values
 *
 * @param template - Template with variable definitions
 * @param values - Variable values to validate
 * @returns Validation result with errors or validated data
 *
 * @example
 * ```ts
 * const result = validateVariableValues(template, {
 *   LAN_INTERFACE: 'bridge1',
 *   LAN_SUBNET: '192.168.88.0/24',
 * });
 * if (!result.success) {
 *   console.error('Invalid values:', result.errors);
 * }
 * ```
 */
export function validateVariableValues(
  template: FirewallTemplate,
  values: Record<string, unknown>
): VariableValuesValidationResult {
  try {
    const schema = createTemplateVariablesSchema(template);
    const parsed = schema.parse(values);

    return {
      success: true,
      data: parsed,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: [
        {
          field: '',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
      ],
    };
  }
}

/**
 * Quick check if template is valid (no detailed errors)
 *
 * @param template - Template to validate
 * @returns True if valid, false otherwise
 */
export function isValidTemplate(template: unknown): template is FirewallTemplate {
  return FirewallTemplateSchema.safeParse(template).success;
}

/**
 * Extract required variables from a template
 *
 * @param template - Template to analyze
 * @returns Array of required variable names
 */
export function getRequiredVariables(template: FirewallTemplate): string[] {
  return template.variables
    .filter((v) => v.required)
    .map((v) => v.name);
}

/**
 * Check if all required variables are provided
 *
 * @param template - Template with variable definitions
 * @param values - Provided variable values
 * @returns Object with missing required variables
 */
export function checkRequiredVariables(
  template: FirewallTemplate,
  values: Record<string, unknown>
): { satisfied: boolean; missing: string[] } {
  const required = getRequiredVariables(template);
  const missing = required.filter((name) => {
    const value = values[name];
    return value === undefined || value === null || value === '';
  });

  return {
    satisfied: missing.length === 0,
    missing,
  };
}

/**
 * Validate template name uniqueness
 *
 * @param name - Template name to check
 * @param existingNames - List of existing template names
 * @param currentId - Current template ID (for edit mode, to exclude self)
 * @returns Validation error if name exists, null otherwise
 */
export function validateTemplateNameUniqueness(
  name: string,
  existingNames: string[],
  currentId?: string
): ValidationError | null {
  // Normalize for comparison
  const normalizedName = name.trim().toLowerCase();

  const isDuplicate = existingNames.some((existing) => {
    return existing.toLowerCase() === normalizedName;
  });

  if (isDuplicate) {
    return {
      field: 'name',
      message: `A template named "${name}" already exists`,
      code: 'duplicate_name',
    };
  }

  return null;
}

/**
 * Sanitize template for export (remove internal fields)
 *
 * @param template - Template to sanitize
 * @returns Sanitized template safe for export
 */
export function sanitizeTemplateForExport(template: FirewallTemplate): FirewallTemplate {
  return {
    ...template,
    // Remove timestamps for clean export
    createdAt: null,
    updatedAt: null,
    // Always mark as custom on export
    isBuiltIn: false,
  };
}

/**
 * Validate template import format
 *
 * @param content - File content to validate
 * @returns Validation result
 */
export function validateImportFormat(content: string): {
  valid: boolean;
  format?: 'json' | 'yaml';
  error?: string;
} {
  // Try JSON first
  try {
    JSON.parse(content);
    return { valid: true, format: 'json' };
  } catch {
    // Not JSON
  }

  // Check if it looks like YAML (basic heuristic)
  if (content.includes('---') || /^[a-zA-Z_]+:\s/.test(content)) {
    return { valid: true, format: 'yaml' };
  }

  return {
    valid: false,
    error: 'Content is neither valid JSON nor YAML',
  };
}
