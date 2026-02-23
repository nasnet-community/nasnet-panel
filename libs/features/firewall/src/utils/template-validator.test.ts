/**
 * Template Validator Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  validateTemplate,
  validateVariableValues,
  isValidTemplate,
  getRequiredVariables,
  checkRequiredVariables,
  validateTemplateNameUniqueness,
  sanitizeTemplateForExport,
  validateImportFormat,
} from './template-validator';
import type { FirewallTemplate } from '../schemas/templateSchemas';

// ============================================
// TEST FIXTURES
// ============================================

const validTemplate: FirewallTemplate = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template for unit testing',
  category: 'CUSTOM',
  complexity: 'SIMPLE',
  ruleCount: 2,
  variables: [
    {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      defaultValue: 'bridge1',
      isRequired: true,
      description: 'LAN network interface',
    },
    {
      name: 'LAN_SUBNET',
      label: 'LAN Subnet',
      type: 'SUBNET',
      defaultValue: '192.168.88.0/24',
      isRequired: true,
    },
    {
      name: 'OPTIONAL_PORT',
      label: 'Optional Port',
      type: 'PORT',
      isRequired: false,
    },
  ],
  rules: [
    {
      table: 'FILTER',
      chain: 'input',
      action: 'accept',
      comment: 'Allow LAN',
      position: 0,
      properties: {
        inInterface: '{{LAN_INTERFACE}}',
        srcAddress: '{{LAN_SUBNET}}',
      },
    },
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'accept',
      position: 1,
      properties: {
        srcAddress: '{{LAN_SUBNET}}',
      },
    },
  ],
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

// ============================================
// VALIDATE TEMPLATE TESTS
// ============================================

describe('validateTemplate', () => {
  it('should validate a correct template', () => {
    const result = validateTemplate(validTemplate);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toBeDefined();
  });

  it('should fail validation for missing required fields', () => {
    const invalidTemplate = {
      id: 'test',
      name: 'Test',
      // Missing description
      category: 'CUSTOM',
      complexity: 'SIMPLE',
      ruleCount: 0,
      variables: [],
      rules: [],
      isBuiltIn: false,
      version: '1.0.0',
    };

    const result = validateTemplate(invalidTemplate);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toContain('description');
  });

  it('should warn about duplicate variable names', () => {
    const templateWithDuplicates = {
      ...validTemplate,
      variables: [
        { name: 'VAR1', label: 'Var 1', type: 'STRING', isRequired: false },
        { name: 'VAR1', label: 'Var 1 Duplicate', type: 'STRING', isRequired: false },
      ],
    };

    const result = validateTemplate(templateWithDuplicates);

    expect(result.success).toBe(true);
    expect(result.warnings).toContain('Duplicate variable name: VAR1');
  });

  it('should warn about undefined variables in rules', () => {
    const templateWithUndefinedVar = {
      ...validTemplate,
      variables: [],
      rules: [
        {
          table: 'FILTER' as const,
          chain: 'input',
          action: 'accept',
          position: 0,
          properties: {
            inInterface: '{{UNDEFINED_VAR}}',
          },
        },
      ],
    };

    const result = validateTemplate(templateWithUndefinedVar);

    expect(result.success).toBe(true);
    expect(result.warnings.some((w) => w.includes('UNDEFINED_VAR'))).toBe(true);
  });

  it('should warn about unused variables', () => {
    const templateWithUnusedVar = {
      ...validTemplate,
      variables: [
        { name: 'UNUSED_VAR', label: 'Unused', type: 'STRING', isRequired: false },
      ],
      rules: [
        {
          table: 'FILTER' as const,
          chain: 'input',
          action: 'accept',
          position: 0,
          properties: {},
        },
      ],
    };

    const result = validateTemplate(templateWithUnusedVar);

    expect(result.success).toBe(true);
    expect(result.warnings.some((w) => w.includes('UNUSED_VAR'))).toBe(true);
  });

  it('should warn about position conflicts', () => {
    const templateWithConflicts = {
      ...validTemplate,
      rules: [
        {
          table: 'FILTER' as const,
          chain: 'input',
          action: 'accept',
          position: 0,
          properties: {},
        },
        {
          table: 'FILTER' as const,
          chain: 'input',
          action: 'drop',
          position: 0,
          properties: {},
        },
      ],
    };

    const result = validateTemplate(templateWithConflicts);

    expect(result.success).toBe(true);
    expect(result.warnings.some((w) => w.includes('position 0'))).toBe(true);
  });

  it('should fail validation for invalid version format', () => {
    const invalidTemplate = {
      ...validTemplate,
      version: 'invalid-version',
    };

    const result = validateTemplate(invalidTemplate);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === 'version')).toBe(true);
  });

  it('should fail validation for empty rules array', () => {
    const invalidTemplate = {
      ...validTemplate,
      rules: [],
    };

    const result = validateTemplate(invalidTemplate);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === 'rules')).toBe(true);
  });
});

// ============================================
// VALIDATE VARIABLE VALUES TESTS
// ============================================

describe('validateVariableValues', () => {
  it('should validate correct variable values', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.88.0/24',
    };

    const result = validateVariableValues(validTemplate, values);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toEqual(values);
  });

  it('should fail validation for invalid IP format', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: 'invalid-subnet',
    };

    const result = validateVariableValues(validTemplate, values);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === 'LAN_SUBNET')).toBe(true);
  });

  it('should fail validation for missing required variable', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      // Missing LAN_SUBNET (required)
    };

    const result = validateVariableValues(validTemplate, values);

    expect(result.success).toBe(false);
  });

  it('should allow optional variables to be missing', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.88.0/24',
      // OPTIONAL_PORT is optional, so it's fine to omit
    };

    const result = validateVariableValues(validTemplate, values);

    expect(result.success).toBe(true);
  });

  it('should validate port number range', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.88.0/24',
      OPTIONAL_PORT: '99999', // Invalid port (> 65535)
    };

    const result = validateVariableValues(validTemplate, values);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === 'OPTIONAL_PORT')).toBe(true);
  });
});

// ============================================
// IS VALID TEMPLATE TESTS
// ============================================

describe('isValidTemplate', () => {
  it('should return true for valid template', () => {
    expect(isValidTemplate(validTemplate)).toBe(true);
  });

  it('should return false for invalid template', () => {
    const invalidTemplate = {
      id: 'test',
      name: 'Test',
      // Missing required fields
    };

    expect(isValidTemplate(invalidTemplate)).toBe(false);
  });

  it('should narrow type when true', () => {
    const unknown: unknown = validTemplate;

    if (isValidTemplate(unknown)) {
      // TypeScript should know this is a FirewallTemplate
      expect(unknown.name).toBe('Test Template');
    }
  });
});

// ============================================
// GET REQUIRED VARIABLES TESTS
// ============================================

describe('getRequiredVariables', () => {
  it('should return only required variable names', () => {
    const required = getRequiredVariables(validTemplate);

    expect(required).toEqual(['LAN_INTERFACE', 'LAN_SUBNET']);
    expect(required).not.toContain('OPTIONAL_PORT');
  });

  it('should return empty array for template with no required variables', () => {
    const templateNoRequired = {
      ...validTemplate,
      variables: [
        { name: 'OPT1', label: 'Optional 1', type: 'STRING' as const, isRequired: false },
        { name: 'OPT2', label: 'Optional 2', type: 'STRING' as const, isRequired: false },
      ],
    };

    const required = getRequiredVariables(templateNoRequired);

    expect(required).toEqual([]);
  });
});

// ============================================
// CHECK REQUIRED VARIABLES TESTS
// ============================================

describe('checkRequiredVariables', () => {
  it('should return satisfied when all required variables provided', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.88.0/24',
    };

    const result = checkRequiredVariables(validTemplate, values);

    expect(result.satisfied).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should return missing required variables', () => {
    const values = {
      LAN_INTERFACE: 'bridge1',
      // Missing LAN_SUBNET
    };

    const result = checkRequiredVariables(validTemplate, values);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toContain('LAN_SUBNET');
  });

  it('should treat empty string as missing', () => {
    const values = {
      LAN_INTERFACE: '',
      LAN_SUBNET: '192.168.88.0/24',
    };

    const result = checkRequiredVariables(validTemplate, values);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toContain('LAN_INTERFACE');
  });

  it('should treat null as missing', () => {
    const values = {
      LAN_INTERFACE: null,
      LAN_SUBNET: '192.168.88.0/24',
    };

    const result = checkRequiredVariables(validTemplate, values);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toContain('LAN_INTERFACE');
  });
});

// ============================================
// VALIDATE NAME UNIQUENESS TESTS
// ============================================

describe('validateTemplateNameUniqueness', () => {
  const existingNames = ['Existing Template', 'Another Template'];

  it('should return null for unique name', () => {
    const error = validateTemplateNameUniqueness('New Template', existingNames);

    expect(error).toBeNull();
  });

  it('should return error for duplicate name', () => {
    const error = validateTemplateNameUniqueness('Existing Template', existingNames);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('duplicate_name');
    expect(error?.message).toContain('already exists');
  });

  it('should be case-insensitive', () => {
    const error = validateTemplateNameUniqueness('EXISTING TEMPLATE', existingNames);

    expect(error).not.toBeNull();
  });

  it('should trim whitespace', () => {
    const error = validateTemplateNameUniqueness('  Existing Template  ', existingNames);

    expect(error).not.toBeNull();
  });
});

// ============================================
// SANITIZE TEMPLATE FOR EXPORT TESTS
// ============================================

describe('sanitizeTemplateForExport', () => {
  it('should remove timestamps', () => {
    const sanitized = sanitizeTemplateForExport(validTemplate);

    expect(sanitized.createdAt).toBeNull();
    expect(sanitized.updatedAt).toBeNull();
  });

  it('should mark as not built-in', () => {
    const builtInTemplate = { ...validTemplate, isBuiltIn: true };
    const sanitized = sanitizeTemplateForExport(builtInTemplate);

    expect(sanitized.isBuiltIn).toBe(false);
  });

  it('should preserve other fields', () => {
    const sanitized = sanitizeTemplateForExport(validTemplate);

    expect(sanitized.id).toBe(validTemplate.id);
    expect(sanitized.name).toBe(validTemplate.name);
    expect(sanitized.description).toBe(validTemplate.description);
    expect(sanitized.variables).toEqual(validTemplate.variables);
    expect(sanitized.rules).toEqual(validTemplate.rules);
  });
});

// ============================================
// VALIDATE IMPORT FORMAT TESTS
// ============================================

describe('validateImportFormat', () => {
  it('should detect valid JSON', () => {
    const json = JSON.stringify(validTemplate);
    const result = validateImportFormat(json);

    expect(result.valid).toBe(true);
    expect(result.format).toBe('json');
  });

  it('should detect YAML with document separator', () => {
    const yaml = '---\nname: Test\ndescription: Test template\n';
    const result = validateImportFormat(yaml);

    expect(result.valid).toBe(true);
    expect(result.format).toBe('yaml');
  });

  it('should detect YAML with key-value pairs', () => {
    const yaml = 'name: Test\ndescription: Test template\n';
    const result = validateImportFormat(yaml);

    expect(result.valid).toBe(true);
    expect(result.format).toBe('yaml');
  });

  it('should reject invalid content', () => {
    const invalid = 'This is not JSON or YAML';
    const result = validateImportFormat(invalid);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
