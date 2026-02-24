/**
 * Template Validation Schemas
 *
 * Zod validation schemas for firewall template variables, rules, and full templates.
 * Supports dynamic schema generation per variable type with comprehensive error messages.
 *
 * @module @nasnet/features/firewall/schemas
 */
import { z } from 'zod';
export type { VariableType, TemplateCategory, TemplateComplexity, FirewallTable, TemplateConflictType, TemplateVariable, TemplateRule, TemplateConflict, ImpactAnalysis, FirewallTemplate, TemplatePreviewResult, FirewallTemplateResult, } from '@nasnet/core/types';
export { VariableTypeSchema, TemplateCategorySchema, TemplateComplexitySchema, FirewallTableSchema, TemplateConflictTypeSchema, TemplateVariableSchema, TemplateRuleSchema, TemplateConflictSchema, ImpactAnalysisSchema, FirewallTemplateSchema, TemplatePreviewResultSchema, FirewallTemplateResultSchema, } from '@nasnet/core/types';
import type { TemplateVariable, FirewallTemplate } from '@nasnet/core/types';
/**
 * IPv4 address validation pattern
 * @description Matches valid IPv4 addresses (e.g., 192.168.1.1)
 */
export declare const IPV4_PATTERN: RegExp;
/**
 * CIDR notation validation pattern
 * @description Matches valid CIDR notation (e.g., 192.168.1.0/24)
 */
export declare const CIDR_PATTERN: RegExp;
/**
 * Port range validation pattern
 * @description Matches port ranges (e.g., 8000-9000)
 */
export declare const PORT_RANGE_PATTERN: RegExp;
/**
 * Interface name validation pattern
 * @description Matches valid interface names (e.g., ether1, bridge1, vlan10)
 */
export declare const INTERFACE_PATTERN: RegExp;
/**
 * Semver version validation pattern
 * @description Matches semantic version strings (e.g., 1.0.0, 2.3.1-beta)
 */
export declare const SEMVER_PATTERN: RegExp;
export declare const ipv4Pattern: RegExp;
export declare const cidrPattern: RegExp;
export declare const portRangePattern: RegExp;
export declare const interfacePattern: RegExp;
export declare const semverPattern: RegExp;
/**
 * Validates IPv4 address
 * @description Checks if a string is a valid IPv4 address
 * @param val - The string to validate
 * @returns True if valid IPv4 format
 */
export declare function validateIPv4(val: string): boolean;
/**
 * Validates CIDR notation
 * @description Checks if a string is valid CIDR notation
 * @param val - The string to validate
 * @returns True if valid CIDR format
 */
export declare function validateCIDR(val: string): boolean;
/**
 * Validates port number
 * @description Checks if a value is a valid port number (1-65535)
 * @param val - The port number to validate
 * @returns True if valid port range
 */
export declare function validatePort(val: string | number): boolean;
/**
 * Validates port range format
 * @description Checks if a string is a valid port range with start < end
 * @param val - The port range string to validate (e.g., "8000-9000")
 * @returns True if valid port range format
 */
export declare function validatePortRange(val: string): boolean;
/**
 * Validates VLAN ID
 * @description Checks if a value is a valid VLAN ID (1-4094)
 * @param val - The VLAN ID to validate
 * @returns True if valid VLAN range
 */
export declare function validateVlanId(val: string | number): boolean;
/**
 * Validates interface name
 * @description Checks if a string is a valid interface name (max 32 chars)
 * @param val - The interface name to validate
 * @returns True if valid interface name format
 */
export declare function validateInterface(val: string): boolean;
/**
 * Validates semantic version
 * @description Checks if a string is a valid semver version
 * @param val - The version string to validate
 * @returns True if valid semver format
 */
export declare function validateSemver(val: string): boolean;
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
export declare function createVariableValueSchema(variable: TemplateVariable): z.ZodTypeAny;
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
export declare function createTemplateVariablesSchema(template: FirewallTemplate): z.ZodObject<z.ZodRawShape>;
/**
 * Validate template variables and return detailed errors
 *
 * @param template - Firewall template
 * @param values - Variable values to validate
 * @returns Validation result with errors
 */
export declare function validateTemplateVariables(template: FirewallTemplate, values: Record<string, unknown>): {
    success: boolean;
    errors: Array<{
        field: string;
        message: string;
    }>;
};
//# sourceMappingURL=templateSchemas.d.ts.map