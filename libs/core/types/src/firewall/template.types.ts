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

export type VariableType = z.infer<typeof VariableTypeSchema>;

/**
 * Template categories
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

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

/**
 * Template complexity levels
 */
export const TemplateComplexitySchema = z.enum(['SIMPLE', 'MODERATE', 'ADVANCED', 'EXPERT']);

export type TemplateComplexity = z.infer<typeof TemplateComplexitySchema>;

/**
 * Firewall table types
 */
export const FirewallTableSchema = z.enum(['FILTER', 'NAT', 'MANGLE', 'RAW']);

export type FirewallTable = z.infer<typeof FirewallTableSchema>;

/**
 * Template conflict types for template preview
 */
export const TemplateConflictTypeSchema = z.enum([
  'DUPLICATE_RULE',
  'IP_OVERLAP',
  'CHAIN_CONFLICT',
  'POSITION_CONFLICT',
  'PORT_CONFLICT',
]);

export type TemplateConflictType = z.infer<typeof TemplateConflictTypeSchema>;

// ============================================================================
// Template Variable Schema
// ============================================================================

/**
 * Template variable definition
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
  required: z.boolean(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  options: z.array(z.string()).optional(),
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

// ============================================================================
// Template Rule Schema
// ============================================================================

/**
 * Template rule definition
 */
export const TemplateRuleSchema = z.object({
  table: FirewallTableSchema,
  chain: z.string().min(1, 'Chain is required'),
  action: z.string().min(1, 'Action is required'),
  comment: z.string().max(200, 'Comment must be 200 characters or less').optional(),
  position: z.number().int().nonnegative().nullable(),
  properties: z.record(z.unknown()),
});

export type TemplateRule = z.infer<typeof TemplateRuleSchema>;

// ============================================================================
// Template Conflict Schema
// ============================================================================

/**
 * Template conflict detected during preview
 */
export const TemplateConflictSchema = z.object({
  type: TemplateConflictTypeSchema,
  message: z.string(),
  existingRuleId: z.string().optional(),
  proposedRule: TemplateRuleSchema.optional(),
});

export type TemplateConflict = z.infer<typeof TemplateConflictSchema>;

// ============================================================================
// Impact Analysis Schema
// ============================================================================

/**
 * Impact analysis for template application
 */
export const ImpactAnalysisSchema = z.object({
  newRulesCount: z.number().int().nonnegative(),
  affectedChains: z.array(z.string()),
  estimatedApplyTime: z.number().positive(),
  warnings: z.array(z.string()),
});

export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;

// ============================================================================
// Firewall Template Schema
// ============================================================================

/**
 * Firewall template with variables and rules
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
  variables: z.array(TemplateVariableSchema),
  rules: z.array(TemplateRuleSchema).min(1, 'At least one rule is required'),
  isBuiltIn: z.boolean(),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, 'Version must be in semver format (e.g., 1.0.0)'),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export type FirewallTemplate = z.infer<typeof FirewallTemplateSchema>;

// ============================================================================
// Template Preview Result Schema
// ============================================================================

/**
 * Result of template preview operation
 */
export const TemplatePreviewResultSchema = z.object({
  template: FirewallTemplateSchema,
  resolvedRules: z.array(TemplateRuleSchema),
  conflicts: z.array(TemplateConflictSchema),
  impactAnalysis: ImpactAnalysisSchema,
});

export type TemplatePreviewResult = z.infer<typeof TemplatePreviewResultSchema>;

// ============================================================================
// Template Apply Result Schema
// ============================================================================

/**
 * Result of template apply operation
 */
export const FirewallTemplateResultSchema = z.object({
  success: z.boolean(),
  appliedRulesCount: z.number().int().nonnegative(),
  rollbackId: z.string(),
  errors: z.array(z.string()),
});

export type FirewallTemplateResult = z.infer<typeof FirewallTemplateResultSchema>;
