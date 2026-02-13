/**
 * Alert Rule Template Validation Schemas
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Zod schemas for validating alert rule template data on the frontend.
 * Used with React Hook Form for form validation.
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

/**
 * Alert rule template categories
 */
export const alertRuleTemplateCategorySchema = z.enum(
  ['NETWORK', 'SECURITY', 'RESOURCES', 'VPN', 'DHCP', 'SYSTEM', 'CUSTOM'],
  {
    errorMap: () => ({ message: 'Invalid template category' }),
  }
);

/**
 * Template variable types
 */
export const alertRuleTemplateVariableTypeSchema = z.enum(
  ['STRING', 'INTEGER', 'DURATION', 'PERCENTAGE'],
  {
    errorMap: () => ({ message: 'Invalid variable type' }),
  }
);

/**
 * Alert severity levels
 */
export const alertSeveritySchema = z.enum(['CRITICAL', 'WARNING', 'INFO'], {
  errorMap: () => ({ message: 'Invalid severity level' }),
});

/**
 * Condition operators
 */
export const conditionOperatorSchema = z.enum(
  ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'REGEX'],
  {
    errorMap: () => ({ message: 'Invalid operator' }),
  }
);

// =============================================================================
// Variable Schemas
// =============================================================================

/**
 * Alert rule template variable schema
 * Defines a variable that can be customized when applying a template
 */
export const alertRuleTemplateVariableSchema = z.object({
  name: z
    .string()
    .min(1, 'Variable name is required')
    .max(50, 'Variable name must be 50 characters or less')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Variable name must be uppercase with underscores (e.g., CPU_THRESHOLD)'),
  label: z
    .string()
    .min(1, 'Variable label is required')
    .max(100, 'Variable label must be 100 characters or less'),
  type: alertRuleTemplateVariableTypeSchema,
  required: z.boolean().default(true),
  defaultValue: z.string().optional(),
  min: z.number().int().optional(),
  max: z.number().int().optional(),
  unit: z.string().max(20, 'Unit must be 20 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

/**
 * Variable values for template application
 * Maps variable names to their values
 */
export const templateVariableValuesSchema = z.record(
  z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  z.union([z.string(), z.number()])
);

// =============================================================================
// Condition Schemas
// =============================================================================

/**
 * Alert condition schema
 */
export const alertConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: conditionOperatorSchema,
  value: z.string().min(1, 'Value is required'),
});

/**
 * Throttle configuration schema
 */
export const throttleConfigSchema = z.object({
  maxAlerts: z.number().int().min(1, 'Max alerts must be at least 1'),
  periodSeconds: z.number().int().min(1, 'Period must be at least 1 second'),
  groupByField: z.string().optional(),
});

// =============================================================================
// Template Schemas
// =============================================================================

/**
 * Alert rule template schema
 * Core template structure with all fields
 */
export const alertRuleTemplateSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  category: alertRuleTemplateCategorySchema,
  eventType: z
    .string()
    .min(1, 'Event type is required')
    .regex(/^[a-z]+\.[a-z_]+$/, 'Event type must match pattern: category.event_name'),
  severity: alertSeveritySchema,
  conditions: z.array(alertConditionSchema).min(1, 'At least one condition is required'),
  channels: z
    .array(z.string().min(1))
    .min(1, 'At least one channel is required')
    .max(5, 'Maximum 5 channels allowed'),
  throttle: throttleConfigSchema.optional(),
  variables: z.array(alertRuleTemplateVariableSchema).default([]),
  isBuiltIn: z.boolean().default(false),
  version: z.string().default('1.0.0'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Validation info schema
 * Result of template validation
 */
export const validationInfoSchema = z.object({
  isValid: z.boolean(),
  missingVariables: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

/**
 * Template preview schema
 * Result of previewing a template with variable substitution
 */
export const alertRuleTemplatePreviewSchema = z.object({
  template: alertRuleTemplateSchema,
  resolvedConditions: z.array(alertConditionSchema),
  validationInfo: validationInfoSchema,
});

// =============================================================================
// Input Schemas (for mutations)
// =============================================================================

/**
 * Input for saving a custom template
 * Used with the saveCustomAlertRuleTemplate mutation
 */
export const customAlertRuleTemplateInputSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Template name is required')
      .max(100, 'Template name must be 100 characters or less'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(500, 'Description must be 500 characters or less'),
    category: alertRuleTemplateCategorySchema,
    severity: alertSeveritySchema,
    eventType: z
      .string()
      .min(1, 'Event type is required')
      .regex(/^[a-z]+\.[a-z_]+$/, 'Event type must match pattern: category.event_name'),
    conditions: z.array(alertConditionSchema).min(1, 'At least one condition is required'),
    channels: z
      .array(z.string().min(1))
      .min(1, 'At least one channel is required')
      .max(5, 'Maximum 5 channels allowed'),
    throttle: throttleConfigSchema.optional(),
    variables: z.array(alertRuleTemplateVariableSchema).default([]),
  })
  .refine(
    (data) => {
      // Validate that all variable names in conditions reference defined variables
      const variableNames = data.variables.map((v) => v.name);
      const conditionVariables = extractVariablesFromConditions(data.conditions);

      // Check for undefined variables in conditions
      const undefinedVars = conditionVariables.filter((v) => !variableNames.includes(v));

      return undefinedVars.length === 0;
    },
    {
      message: 'Conditions reference undefined variables',
      path: ['conditions'],
    }
  );

/**
 * Input for applying a template to create an alert rule
 */
export const applyAlertRuleTemplateInputSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  variables: templateVariableValuesSchema,
  customizations: z
    .object({
      name: z.string().min(1, 'Rule name is required').max(100).optional(),
      description: z.string().max(500).optional(),
      deviceId: z.string().optional(),
      enabled: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Template import schema
 * Validates imported JSON templates
 */
export const alertRuleTemplateImportSchema = alertRuleTemplateSchema.omit({
  id: true,
  isBuiltIn: true,
  createdAt: true,
  updatedAt: true,
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract variable names from alert conditions
 * Matches patterns like {{VARIABLE_NAME}}
 */
function extractVariablesFromConditions(conditions: z.infer<typeof alertConditionSchema>[]): string[] {
  const regex = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;
  const variables = new Set<string>();

  conditions.forEach((condition) => {
    const matches = Array.from(condition.value.matchAll(regex));
    matches.forEach((match) => variables.add(match[1]));
  });

  return Array.from(variables);
}

// =============================================================================
// Type Exports
// =============================================================================

export type AlertRuleTemplateCategory = z.infer<typeof alertRuleTemplateCategorySchema>;
export type AlertRuleTemplateVariableType = z.infer<typeof alertRuleTemplateVariableTypeSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;
export type AlertRuleTemplateVariable = z.infer<typeof alertRuleTemplateVariableSchema>;
export type AlertCondition = z.infer<typeof alertConditionSchema>;
export type ThrottleConfig = z.infer<typeof throttleConfigSchema>;
export type AlertRuleTemplate = z.infer<typeof alertRuleTemplateSchema>;
export type AlertRuleTemplatePreview = z.infer<typeof alertRuleTemplatePreviewSchema>;
export type CustomAlertRuleTemplateInput = z.infer<typeof customAlertRuleTemplateInputSchema>;
export type ApplyAlertRuleTemplateInput = z.infer<typeof applyAlertRuleTemplateInputSchema>;
export type AlertRuleTemplateImport = z.infer<typeof alertRuleTemplateImportSchema>;
export type ValidationInfo = z.infer<typeof validationInfoSchema>;
