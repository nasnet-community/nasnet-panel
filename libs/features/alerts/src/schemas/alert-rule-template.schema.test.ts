/**
 * Alert Rule Template Schema Validation Tests
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Tests for Zod validation schemas used in alert rule template forms.
 */

import { describe, it, expect } from 'vitest';
import {
  alertRuleTemplateCategorySchema,
  alertRuleTemplateVariableTypeSchema,
  alertSeveritySchema,
  conditionOperatorSchema,
  alertRuleTemplateVariableSchema,
  templateVariableValuesSchema,
  alertConditionSchema,
  alertRuleTemplateSchema,
  customAlertRuleTemplateInputSchema,
} from './alert-rule-template.schema';

// =============================================================================
// Test Case 1: Category Schema Validation
// =============================================================================

describe('alertRuleTemplateCategorySchema', () => {
  it('should accept valid categories', () => {
    const validCategories = ['NETWORK', 'SECURITY', 'RESOURCES', 'VPN', 'DHCP', 'SYSTEM', 'CUSTOM'];

    validCategories.forEach((category) => {
      const result = alertRuleTemplateCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid categories', () => {
    const result = alertRuleTemplateCategorySchema.safeParse('INVALID_CATEGORY');
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 2: Variable Type Schema Validation
// =============================================================================

describe('alertRuleTemplateVariableTypeSchema', () => {
  it('should accept valid variable types', () => {
    const validTypes = ['STRING', 'INTEGER', 'DURATION', 'PERCENTAGE'];

    validTypes.forEach((type) => {
      const result = alertRuleTemplateVariableTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid variable types', () => {
    const result = alertRuleTemplateVariableTypeSchema.safeParse('BOOLEAN');
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 3: Severity Schema Validation
// =============================================================================

describe('alertSeveritySchema', () => {
  it('should accept valid severities', () => {
    const validSeverities = ['CRITICAL', 'WARNING', 'INFO'];

    validSeverities.forEach((severity) => {
      const result = alertSeveritySchema.safeParse(severity);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid severities', () => {
    const result = alertSeveritySchema.safeParse('DEBUG');
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 4: Condition Operator Schema Validation
// =============================================================================

describe('conditionOperatorSchema', () => {
  it('should accept valid operators', () => {
    const validOperators = [
      'EQUALS',
      'NOT_EQUALS',
      'GREATER_THAN',
      'LESS_THAN',
      'CONTAINS',
      'REGEX',
    ];

    validOperators.forEach((operator) => {
      const result = conditionOperatorSchema.safeParse(operator);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid operators', () => {
    const result = conditionOperatorSchema.safeParse('STARTS_WITH');
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 5: Variable Schema Validation
// =============================================================================

describe('alertRuleTemplateVariableSchema', () => {
  it('should validate a complete variable definition', () => {
    const variable = {
      name: 'CPU_THRESHOLD',
      label: 'CPU Threshold',
      type: 'INTEGER',
      required: true,
      defaultValue: '80',
      min: 0,
      max: 100,
      unit: 'percent',
      description: 'CPU usage threshold for alerting',
    };

    const result = alertRuleTemplateVariableSchema.safeParse(variable);
    expect(result.success).toBe(true);
  });

  it('should require uppercase variable names with underscores', () => {
    const invalidNames = ['cpuThreshold', 'cpu-threshold', 'cpu threshold', '123CPU'];

    invalidNames.forEach((name) => {
      const result = alertRuleTemplateVariableSchema.safeParse({
        name,
        label: 'Test',
        type: 'INTEGER',
        required: true,
      });
      expect(result.success).toBe(false);
    });
  });

  it('should accept valid uppercase variable names', () => {
    const validNames = ['CPU_THRESHOLD', 'OFFLINE_DURATION', 'MAX_CONNECTIONS', 'HTTP_PORT'];

    validNames.forEach((name) => {
      const result = alertRuleTemplateVariableSchema.safeParse({
        name,
        label: 'Test Label',
        type: 'INTEGER',
        required: true,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should validate min/max constraints', () => {
    const variable = {
      name: 'TEST_VAR',
      label: 'Test Variable',
      type: 'INTEGER',
      required: true,
      min: 0,
      max: 100,
    };

    const result = alertRuleTemplateVariableSchema.safeParse(variable);
    expect(result.success).toBe(true);
    expect(result.data?.min).toBe(0);
    expect(result.data?.max).toBe(100);
  });
});

// =============================================================================
// Test Case 6: Variable Values Schema Validation
// =============================================================================

describe('templateVariableValuesSchema', () => {
  it('should accept valid variable values', () => {
    const values = {
      CPU_THRESHOLD: 85,
      OFFLINE_DURATION: 120,
      INTERFACE_NAME: 'ether1',
    };

    const result = templateVariableValuesSchema.safeParse(values);
    expect(result.success).toBe(true);
  });

  it('should accept both string and number values', () => {
    const values = {
      STRING_VAR: 'test',
      NUMBER_VAR: 42,
    };

    const result = templateVariableValuesSchema.safeParse(values);
    expect(result.success).toBe(true);
  });

  it('should reject invalid variable names', () => {
    const values = {
      'invalid-name': 'test', // Invalid: contains hyphen
    };

    const result = templateVariableValuesSchema.safeParse(values);
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 7: Condition Schema Validation
// =============================================================================

describe('alertConditionSchema', () => {
  it('should validate a complete condition', () => {
    const condition = {
      field: 'cpu',
      operator: 'GREATER_THAN',
      value: '80',
    };

    const result = alertConditionSchema.safeParse(condition);
    expect(result.success).toBe(true);
  });

  it('should require all fields', () => {
    const incompleteCondition = {
      field: 'cpu',
      operator: 'GREATER_THAN',
      // Missing value
    };

    const result = alertConditionSchema.safeParse(incompleteCondition);
    expect(result.success).toBe(false);
  });

  it('should validate with variable reference', () => {
    const condition = {
      field: 'duration',
      operator: 'GREATER_THAN',
      value: '{{OFFLINE_DURATION}}',
    };

    const result = alertConditionSchema.safeParse(condition);
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Test Case 8: Complete Template Schema Validation
// =============================================================================

describe('alertRuleTemplateSchema', () => {
  it('should validate a complete template', () => {
    const template = {
      id: 'device-offline',
      name: 'Device Offline Alert',
      description: 'Alert when device goes offline',
      category: 'NETWORK',
      eventType: 'router.offline',
      severity: 'CRITICAL',
      conditions: [
        {
          field: 'status',
          operator: 'EQUALS',
          value: 'offline',
        },
        {
          field: 'duration',
          operator: 'GREATER_THAN',
          value: '{{OFFLINE_DURATION}}',
        },
      ],
      channels: ['email', 'inapp'],
      variables: [
        {
          name: 'OFFLINE_DURATION',
          label: 'Offline Duration',
          type: 'DURATION',
          required: true,
          defaultValue: '60',
          min: 30,
          max: 3600,
          unit: 'seconds',
        },
      ],
      isBuiltIn: true,
      version: '1.0.0',
    };

    const result = alertRuleTemplateSchema.safeParse(template);
    expect(result.success).toBe(true);
  });

  it('should require essential fields', () => {
    const incompleteTemplate = {
      name: 'Test Template',
      // Missing: id, description, category, eventType, severity, etc.
    };

    const result = alertRuleTemplateSchema.safeParse(incompleteTemplate);
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 9: Save Template Input Schema Validation
// =============================================================================

describe('customAlertRuleTemplateInputSchema', () => {
  it('should validate custom template input', () => {
    const input = {
      name: 'My Custom Template',
      description: 'A custom alert rule template',
      category: 'CUSTOM',
      severity: 'WARNING',
      eventType: 'custom.event',
      conditions: [
        {
          field: 'value',
          operator: 'GREATER_THAN',
          value: '{{THRESHOLD}}',
        },
      ],
      channels: ['email'],
      variables: [
        {
          name: 'THRESHOLD',
          label: 'Threshold Value',
          type: 'INTEGER',
          required: true,
          defaultValue: '100',
        },
      ],
    };

    const result = customAlertRuleTemplateInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should enforce name length constraints', () => {
    const shortName = {
      name: '',
      description: 'Test',
      category: 'CUSTOM',
      severity: 'INFO',
      eventType: 'test',
      conditions: [
        {
          field: 'test',
          operator: 'EQUALS',
          value: 'test',
        },
      ],
      channels: ['email'],
      variables: [],
    };

    const result = customAlertRuleTemplateInputSchema.safeParse(shortName);
    expect(result.success).toBe(false);
  });

  it('should enforce description length constraints', () => {
    const longDescription = 'a'.repeat(1001);

    const input = {
      name: 'Test',
      description: longDescription,
      category: 'CUSTOM',
      severity: 'INFO',
      eventType: 'test.event',
      conditions: [
        {
          field: 'test',
          operator: 'EQUALS',
          value: 'test',
        },
      ],
      channels: ['email'],
      variables: [],
    };

    const result = customAlertRuleTemplateInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Test Case 10: Edge Cases and Error Messages
// =============================================================================

describe('Schema Error Messages', () => {
  it('should provide clear error messages for invalid category', () => {
    const result = alertRuleTemplateCategorySchema.safeParse('INVALID');

    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid');
    }
  });

  it('should provide clear error messages for invalid variable name', () => {
    const result = alertRuleTemplateVariableSchema.safeParse({
      name: 'invalid-name',
      label: 'Test',
      type: 'INTEGER',
      required: true,
    });

    if (!result.success) {
      const nameError = result.error.issues.find((issue) => issue.path.includes('name'));
      expect(nameError?.message).toContain('uppercase');
    }
  });

  it('should provide clear error messages for required fields', () => {
    const result = alertConditionSchema.safeParse({
      field: 'test',
      operator: 'EQUALS',
      // Missing value
    });

    if (!result.success) {
      const valueError = result.error.issues.find((issue) => issue.path.includes('value'));
      expect(valueError?.message).toContain('required');
    }
  });
});
