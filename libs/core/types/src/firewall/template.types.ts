/**
 * Firewall Template Types and Schemas
 *
 * Type definitions and Zod schemas for firewall templates, including
 * template variables, rules, conflicts, and preview results.
 *
 * @see NAS-7.6: Firewall Templates Feature
 */

import { z } from 'zod';

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * Variable types supported in templates
 * Different variable types for template parameterization
 */
export const VariableTypeSchema = z.enum([
  'INTERFACE',
  'SUBNET',
  'IP',
  'PORT',
  'PORT_RANGE',
  'VLAN_ID',
  'STRING',
  'NUMBER',
  'BOOLEAN',
]);

/**
 * Type for template variable types
 * @example
 * const varType: VariableType = 'IP';
 */
export type VariableType = z.infer<typeof VariableTypeSchema>;

/**
 * Template categories
 * Organizes templates by use case or network context
 */
export const TemplateCategorySchema = z.enum([
  'BASIC',
  'HOME',
  'GAMING',
  'IOT',
  'GUEST',
  'VPN',
  'SECURITY',
  'CUSTOM',
]);

/**
 * Type for template category
 * @example
 * const category: TemplateCategory = 'SECURITY';
 */
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

/**
 * Template complexity levels
 * Indicates the sophistication and difficulty of a template
 */
export const TemplateComplexitySchema = z.enum(['SIMPLE', 'MODERATE', 'ADVANCED', 'EXPERT']);

/**
 * Type for template complexity level
 * @example
 * const complexity: TemplateComplexity = 'ADVANCED';
 */
export type TemplateComplexity = z.infer<typeof TemplateComplexitySchema>;

/**
 * Firewall table types
 * Different MikroTik firewall tables where rules can be applied
 */
export const FirewallTableSchema = z.enum(['FILTER', 'NAT', 'MANGLE', 'RAW']);

/**
 * Type for firewall table
 * @example
 * const table: FirewallTable = 'FILTER';
 */
export type FirewallTable = z.infer<typeof FirewallTableSchema>;

/**
 * Template conflict types for template preview
 * Indicates what kind of conflict was detected with existing rules
 */
export const TemplateConflictTypeSchema = z.enum([
  'DUPLICATE_RULE',
  'IP_OVERLAP',
  'CHAIN_CONFLICT',
  'POSITION_CONFLICT',
  'PORT_CONFLICT',
]);

/**
 * Type for template conflict type
 * @example
 * const conflictType: TemplateConflictType = 'DUPLICATE_RULE';
 */
export type TemplateConflictType = z.infer<typeof TemplateConflictTypeSchema>;

// ============================================================================
// Template Variable Schema
// ============================================================================

/**
 * Template variable definition
 * Defines a parameterizable variable within a template that can be substituted
 * at template application time
 */
export const TemplateVariableSchema = z.object({
  name: z
    .string()
    .min(1, 'Variable name is required')
    .max(64, 'Variable name must be 64 characters or less')
    .regex(/^[A-Z_][A-Z0-9_]*$/, 'Variable name must be uppercase with underscores (e.g., LAN_INTERFACE)'),
  label: z.string().min(1, 'Label is required').max(100, 'Label must be 100 characters or less'),
  type: VariableTypeSchema,
  defaultValue: z.string().optional(),
  isRequired: z.boolean(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  options: z.array(z.string()).optional(),
});

/**
 * Type for a template variable definition
 * @example
 * const variable: TemplateVariable = { name: 'LAN_INTERFACE', label: 'LAN Interface', ... };
 */
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

// ============================================================================
// Template Rule Schema
// ============================================================================

/**
 * Template rule definition
 * Represents a single firewall rule within a template with optional variable substitution
 * Properties field stores rule-specific MikroTik attributes (e.g., src-address, dst-port)
 */
export const TemplateRuleSchema = z.object({
  table: FirewallTableSchema,
  chain: z.string().min(1, 'Chain is required'),
  action: z.string().min(1, 'Action is required'),
  comment: z.string().max(200, 'Comment must be 200 characters or less').optional(),
  position: z.number().int().nonnegative().nullable(),
  properties: z.record(z.string(), z.unknown()),
});

/**
 * Type for a template rule definition
 * @example
 * const rule: TemplateRule = { table: 'FILTER', chain: 'forward', action: 'accept', ... };
 */
export type TemplateRule = z.infer<typeof TemplateRuleSchema>;

// ============================================================================
// Template Conflict Schema
// ============================================================================

/**
 * Template conflict detected during preview
 * Identifies conflicts between proposed template rules and existing configuration
 */
export const TemplateConflictSchema = z.object({
  type: TemplateConflictTypeSchema,
  message: z.string(),
  existingRuleId: z.string().optional(),
  proposedRule: TemplateRuleSchema.optional(),
});

/**
 * Type for a template conflict detected during preview
 * @example
 * const conflict: TemplateConflict = { type: 'DUPLICATE_RULE', message: '...', ... };
 */
export type TemplateConflict = z.infer<typeof TemplateConflictSchema>;

// ============================================================================
// Impact Analysis Schema
// ============================================================================

/**
 * Impact analysis for template application
 * Provides metrics on the consequences of applying a template to the firewall configuration
 */
export const ImpactAnalysisSchema = z.object({
  newRulesCount: z.number().int().nonnegative(),
  affectedChains: z.array(z.string()).readonly(),
  estimatedApplyTime: z.number().positive(),
  warnings: z.array(z.string()).readonly(),
});

/**
 * Type for template impact analysis results
 * @example
 * const analysis: ImpactAnalysis = { newRulesCount: 5, affectedChains: ['forward'], ... };
 */
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;

// ============================================================================
// Firewall Template Schema
// ============================================================================

/**
 * Firewall template with variables and rules
 * Complete template definition including all metadata, variables, and rules needed for deployment
 */
export const FirewallTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Template name is required').max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be 1000 characters or less'),
  category: TemplateCategorySchema,
  complexity: TemplateComplexitySchema,
  ruleCount: z.number().int().nonnegative(),
  variables: z.array(TemplateVariableSchema).readonly(),
  rules: z.array(TemplateRuleSchema).min(1, 'At least one rule is required').readonly(),
  isBuiltIn: z.boolean(),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, 'Version must be in semver format (e.g., 1.0.0)'),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

/**
 * Type for a complete firewall template
 * @example
 * const template: FirewallTemplate = { id: 'tpl-1', name: 'Web Server', ... };
 */
export type FirewallTemplate = z.infer<typeof FirewallTemplateSchema>;

// ============================================================================
// Template Preview Result Schema
// ============================================================================

/**
 * Result of template preview operation
 * Contains the template with resolved rules, any detected conflicts, and impact analysis
 * without actually applying the template to the firewall
 */
export const TemplatePreviewResultSchema = z.object({
  template: FirewallTemplateSchema,
  resolvedRules: z.array(TemplateRuleSchema).readonly(),
  conflicts: z.array(TemplateConflictSchema).readonly(),
  impactAnalysis: ImpactAnalysisSchema,
});

/**
 * Type for template preview result
 * @example
 * const preview: TemplatePreviewResult = { template: {...}, resolvedRules: [...], ... };
 */
export type TemplatePreviewResult = z.infer<typeof TemplatePreviewResultSchema>;

// ============================================================================
// Template Apply Result Schema
// ============================================================================

/**
 * Result of template apply operation
 * Reports the outcome of applying a template to the firewall including success status and rollback info
 */
export const FirewallTemplateResultSchema = z.object({
  isSuccessful: z.boolean(),
  appliedRulesCount: z.number().int().nonnegative(),
  rollbackId: z.string(),
  errors: z.array(z.string()).readonly(),
});

/**
 * Type for firewall template application result
 * @example
 * const result: FirewallTemplateResult = { isSuccessful: true, appliedRulesCount: 5, rollbackId: '...', errors: [] };
 */
export type FirewallTemplateResult = z.infer<typeof FirewallTemplateResultSchema>;
