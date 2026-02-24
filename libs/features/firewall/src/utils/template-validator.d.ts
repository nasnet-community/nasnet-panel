/**
 * Template Validator Utility
 *
 * @description
 * Zod validation wrapper for firewall templates.
 * Provides detailed validation results with error reporting.
 *
 * @module @nasnet/features/firewall/utils
 */
import { type FirewallTemplate } from '../schemas/templateSchemas';
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
export declare function validateTemplate(template: unknown): TemplateValidationResult;
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
export declare function validateVariableValues(template: FirewallTemplate, values: Record<string, unknown>): VariableValuesValidationResult;
/**
 * Quick check if template is valid (no detailed errors)
 *
 * @param template - Template to validate
 * @returns True if valid, false otherwise
 */
export declare function isValidTemplate(template: unknown): template is FirewallTemplate;
/**
 * Extract required variables from a template
 *
 * @param template - Template to analyze
 * @returns Array of required variable names
 */
export declare function getRequiredVariables(template: FirewallTemplate): string[];
/**
 * Check if all required variables are provided
 *
 * @param template - Template with variable definitions
 * @param values - Provided variable values
 * @returns Object with missing required variables
 */
export declare function checkRequiredVariables(template: FirewallTemplate, values: Record<string, unknown>): {
    satisfied: boolean;
    missing: string[];
};
/**
 * Validate template name uniqueness
 *
 * @param name - Template name to check
 * @param existingNames - List of existing template names
 * @param currentId - Current template ID (for edit mode, to exclude self)
 * @returns Validation error if name exists, null otherwise
 */
export declare function validateTemplateNameUniqueness(name: string, existingNames: string[], currentId?: string): ValidationError | null;
/**
 * Sanitize template for export (remove internal fields)
 *
 * @param template - Template to sanitize
 * @returns Sanitized template safe for export
 */
export declare function sanitizeTemplateForExport(template: FirewallTemplate): FirewallTemplate;
/**
 * Validate template import format
 *
 * @param content - File content to validate
 * @returns Validation result
 */
export declare function validateImportFormat(content: string): {
    valid: boolean;
    format?: 'json' | 'yaml';
    error?: string;
};
//# sourceMappingURL=template-validator.d.ts.map