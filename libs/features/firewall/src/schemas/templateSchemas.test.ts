/**
 * Template Schemas Unit Tests
 *
 * Comprehensive tests for Zod validation schemas including:
 * - Variable type validation (INTERFACE, SUBNET, IP, PORT, etc.)
 * - Dynamic schema generation
 * - Template validation
 * - Error message generation
 */

import { describe, it, expect } from 'vitest';
import {
  TemplateVariableSchema,
  TemplateRuleSchema,
  FirewallTemplateSchema,
  TemplatePreviewResultSchema,
  FirewallTemplateResultSchema,
  createVariableValueSchema,
  createTemplateVariablesSchema,
  validateTemplateVariables,
  validateIPv4,
  validateCIDR,
  validatePort,
  validatePortRange,
  validateVlanId,
  validateInterface,
  validateSemver,
  type TemplateVariable,
  type FirewallTemplate,
} from './templateSchemas';

// ============================================
// VALIDATION FUNCTION TESTS
// ============================================

describe('Validation Functions', () => {
  describe('validateIPv4', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(validateIPv4('192.168.1.1')).toBe(true);
      expect(validateIPv4('10.0.0.1')).toBe(true);
      expect(validateIPv4('255.255.255.255')).toBe(true);
      expect(validateIPv4('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(validateIPv4('256.1.1.1')).toBe(false);
      expect(validateIPv4('192.168.1')).toBe(false);
      expect(validateIPv4('192.168.1.1.1')).toBe(false);
      expect(validateIPv4('192.168.a.1')).toBe(false);
      expect(validateIPv4('')).toBe(false);
    });
  });

  describe('validateCIDR', () => {
    it('should validate correct CIDR notation', () => {
      expect(validateCIDR('192.168.1.0/24')).toBe(true);
      expect(validateCIDR('10.0.0.0/8')).toBe(true);
      expect(validateCIDR('172.16.0.0/12')).toBe(true);
      expect(validateCIDR('192.168.1.1/32')).toBe(true);
      expect(validateCIDR('0.0.0.0/0')).toBe(true);
    });

    it('should reject invalid CIDR notation', () => {
      expect(validateCIDR('192.168.1.0/33')).toBe(false);
      expect(validateCIDR('192.168.1.0')).toBe(false);
      expect(validateCIDR('192.168.1.0/-1')).toBe(false);
      expect(validateCIDR('192.168.1.256/24')).toBe(false);
      expect(validateCIDR('')).toBe(false);
    });
  });

  describe('validatePort', () => {
    it('should validate correct port numbers', () => {
      expect(validatePort(80)).toBe(true);
      expect(validatePort(443)).toBe(true);
      expect(validatePort(1)).toBe(true);
      expect(validatePort(65535)).toBe(true);
      expect(validatePort('8080')).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(validatePort(0)).toBe(false);
      expect(validatePort(65536)).toBe(false);
      expect(validatePort(-1)).toBe(false);
      expect(validatePort('abc')).toBe(false);
    });
  });

  describe('validatePortRange', () => {
    it('should validate correct port ranges', () => {
      expect(validatePortRange('8000-9000')).toBe(true);
      expect(validatePortRange('1-65535')).toBe(true);
      expect(validatePortRange('80-443')).toBe(true);
    });

    it('should reject invalid port ranges', () => {
      expect(validatePortRange('9000-8000')).toBe(false); // Start > end
      expect(validatePortRange('8000')).toBe(false); // Not a range
      expect(validatePortRange('8000-65536')).toBe(false); // Invalid port
      expect(validatePortRange('0-100')).toBe(false); // Invalid port
      expect(validatePortRange('abc-def')).toBe(false);
    });
  });

  describe('validateVlanId', () => {
    it('should validate correct VLAN IDs', () => {
      expect(validateVlanId(1)).toBe(true);
      expect(validateVlanId(10)).toBe(true);
      expect(validateVlanId(4094)).toBe(true);
      expect(validateVlanId('100')).toBe(true);
    });

    it('should reject invalid VLAN IDs', () => {
      expect(validateVlanId(0)).toBe(false);
      expect(validateVlanId(4095)).toBe(false);
      expect(validateVlanId(-1)).toBe(false);
      expect(validateVlanId('abc')).toBe(false);
    });
  });

  describe('validateInterface', () => {
    it('should validate correct interface names', () => {
      expect(validateInterface('ether1')).toBe(true);
      expect(validateInterface('bridge1')).toBe(true);
      expect(validateInterface('wlan1')).toBe(true);
      expect(validateInterface('vlan10')).toBe(true);
      expect(validateInterface('pppoe-out1')).toBe(true);
    });

    it('should reject invalid interface names', () => {
      expect(validateInterface('1ether')).toBe(false); // Starts with number
      expect(validateInterface('ether@1')).toBe(false); // Invalid character
      expect(validateInterface('a'.repeat(33))).toBe(false); // Too long
      expect(validateInterface('')).toBe(false);
    });
  });

  describe('validateSemver', () => {
    it('should validate correct semver versions', () => {
      expect(validateSemver('1.0.0')).toBe(true);
      expect(validateSemver('2.3.1')).toBe(true);
      expect(validateSemver('1.0.0-beta')).toBe(true);
      expect(validateSemver('1.0.0-beta.1')).toBe(true);
    });

    it('should reject invalid semver versions', () => {
      expect(validateSemver('1.0')).toBe(false);
      expect(validateSemver('v1.0.0')).toBe(false);
      expect(validateSemver('1.0.0.0')).toBe(false);
      expect(validateSemver('abc')).toBe(false);
    });
  });
});

// ============================================
// SCHEMA TESTS
// ============================================

describe('TemplateVariableSchema', () => {
  it('should validate correct variable', () => {
    const variable = {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE' as const,
      required: true,
      description: 'The interface connected to your local network',
      options: ['bridge1', 'ether2'],
    };

    const result = TemplateVariableSchema.safeParse(variable);
    expect(result.success).toBe(true);
  });

  it('should reject variable with invalid name', () => {
    const variable = {
      name: 'lan-interface', // Should be uppercase
      label: 'LAN Interface',
      type: 'INTERFACE' as const,
      required: true,
    };

    const result = TemplateVariableSchema.safeParse(variable);
    expect(result.success).toBe(false);
  });

  it('should reject variable without required fields', () => {
    const variable = {
      name: 'LAN_INTERFACE',
      // Missing label, type, required
    };

    const result = TemplateVariableSchema.safeParse(variable);
    expect(result.success).toBe(false);
  });

  it('should allow optional fields to be omitted', () => {
    const variable = {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE' as const,
      required: true,
      // description and options are optional
    };

    const result = TemplateVariableSchema.safeParse(variable);
    expect(result.success).toBe(true);
  });
});

describe('TemplateRuleSchema', () => {
  it('should validate correct rule', () => {
    const rule = {
      table: 'FILTER' as const,
      chain: 'input',
      action: 'accept',
      comment: 'Allow established connections',
      position: 0,
      properties: {
        connectionState: ['established', 'related'],
      },
    };

    const result = TemplateRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
  });

  it('should allow null position', () => {
    const rule = {
      table: 'FILTER' as const,
      chain: 'input',
      action: 'drop',
      position: null,
      properties: {},
    };

    const result = TemplateRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
  });
});

describe('FirewallTemplateSchema', () => {
  const validTemplate: FirewallTemplate = {
    id: 'basic-security',
    name: 'Basic Security',
    description: 'Essential security rules for your network',
    category: 'BASIC',
    complexity: 'SIMPLE',
    ruleCount: 5,
    variables: [
      {
        name: 'LAN_INTERFACE',
        label: 'LAN Interface',
        type: 'INTERFACE',
        required: true,
      },
    ],
    rules: [
      {
        table: 'FILTER',
        chain: 'input',
        action: 'accept',
        position: null,
        properties: {},
      },
    ],
    isBuiltIn: true,
    version: '1.0.0',
  };

  it('should validate correct template', () => {
    const result = FirewallTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it('should reject template without rules', () => {
    const template = {
      ...validTemplate,
      rules: [],
    };

    const result = FirewallTemplateSchema.safeParse(template);
    expect(result.success).toBe(false);
  });

  it('should reject template with invalid version', () => {
    const template = {
      ...validTemplate,
      version: 'v1.0', // Invalid semver
    };

    const result = FirewallTemplateSchema.safeParse(template);
    expect(result.success).toBe(false);
  });
});

describe('TemplatePreviewResultSchema', () => {
  it('should validate correct preview result', () => {
    const previewResult = {
      template: {
        id: 'basic-security',
        name: 'Basic Security',
        description: 'Essential security rules',
        category: 'BASIC' as const,
        complexity: 'SIMPLE' as const,
        ruleCount: 1,
        variables: [],
        rules: [
          {
            table: 'FILTER' as const,
            chain: 'input',
            action: 'accept',
            position: null,
            properties: {},
          },
        ],
        isBuiltIn: true,
        version: '1.0.0',
      },
      resolvedRules: [],
      conflicts: [],
      impactAnalysis: {
        newRulesCount: 1,
        affectedChains: ['input'],
        estimatedApplyTime: 2,
        warnings: [],
      },
    };

    const result = TemplatePreviewResultSchema.safeParse(previewResult);
    expect(result.success).toBe(true);
  });
});

// ============================================
// DYNAMIC SCHEMA GENERATION TESTS
// ============================================

describe('createVariableValueSchema', () => {
  it('should create INTERFACE schema', () => {
    const variable: TemplateVariable = {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      required: true,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('bridge1').success).toBe(true);
    expect(schema.safeParse('ether1').success).toBe(true);
    expect(schema.safeParse('1invalid').success).toBe(false);
  });

  it('should create INTERFACE schema with options', () => {
    const variable: TemplateVariable = {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      required: true,
      options: ['bridge1', 'ether2'],
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('bridge1').success).toBe(true);
    expect(schema.safeParse('ether2').success).toBe(true);
    expect(schema.safeParse('ether1').success).toBe(false); // Not in options
  });

  it('should create SUBNET schema', () => {
    const variable: TemplateVariable = {
      name: 'LAN_SUBNET',
      label: 'LAN Subnet',
      type: 'SUBNET',
      required: true,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('192.168.1.0/24').success).toBe(true);
    expect(schema.safeParse('192.168.1.1').success).toBe(false); // Not CIDR
  });

  it('should create IP schema', () => {
    const variable: TemplateVariable = {
      name: 'SERVER_IP',
      label: 'Server IP',
      type: 'IP',
      required: true,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('192.168.1.1').success).toBe(true);
    expect(schema.safeParse('192.168.1.0/24').success).toBe(false); // Not IP
  });

  it('should create PORT schema', () => {
    const variable: TemplateVariable = {
      name: 'SSH_PORT',
      label: 'SSH Port',
      type: 'PORT',
      required: true,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('22').success).toBe(true);
    expect(schema.safeParse('8080').success).toBe(true);
    expect(schema.safeParse('0').success).toBe(false);
    expect(schema.safeParse('65536').success).toBe(false);
  });

  it('should create PORT_RANGE schema', () => {
    const variable: TemplateVariable = {
      name: 'PORT_RANGE',
      label: 'Port Range',
      type: 'PORT_RANGE',
      required: true,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('8000-9000').success).toBe(true);
    expect(schema.safeParse('9000-8000').success).toBe(false); // Start > end
  });

  it('should create VLAN_ID schema', () => {
    const variable: TemplateVariable = {
      name: 'VLAN_ID',
      label: 'VLAN ID',
      type: 'VLAN_ID',
      required: true,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse('10').success).toBe(true);
    expect(schema.safeParse('4094').success).toBe(true);
    expect(schema.safeParse('0').success).toBe(false);
    expect(schema.safeParse('4095').success).toBe(false);
  });

  it('should handle optional variables', () => {
    const variable: TemplateVariable = {
      name: 'OPTIONAL_VAR',
      label: 'Optional Variable',
      type: 'STRING',
      required: false,
    };

    const schema = createVariableValueSchema(variable);
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse('value').success).toBe(true);
  });
});

describe('createTemplateVariablesSchema', () => {
  const template: FirewallTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'Test',
    category: 'CUSTOM',
    complexity: 'SIMPLE',
    ruleCount: 1,
    variables: [
      {
        name: 'LAN_INTERFACE',
        label: 'LAN Interface',
        type: 'INTERFACE',
        required: true,
      },
      {
        name: 'LAN_SUBNET',
        label: 'LAN Subnet',
        type: 'SUBNET',
        required: true,
      },
      {
        name: 'OPTIONAL_VAR',
        label: 'Optional Variable',
        type: 'STRING',
        required: false,
      },
    ],
    rules: [
      {
        table: 'FILTER',
        chain: 'input',
        action: 'accept',
        position: null,
        properties: {},
      },
    ],
    isBuiltIn: false,
    version: '1.0.0',
  };

  it('should create combined schema for all variables', () => {
    const schema = createTemplateVariablesSchema(template);
    const result = schema.safeParse({
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.1.0/24',
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing required variables', () => {
    const schema = createTemplateVariablesSchema(template);
    const result = schema.safeParse({
      LAN_INTERFACE: 'bridge1',
      // Missing LAN_SUBNET
    });

    expect(result.success).toBe(false);
  });

  it('should allow optional variables to be omitted', () => {
    const schema = createTemplateVariablesSchema(template);
    const result = schema.safeParse({
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.1.0/24',
      // OPTIONAL_VAR omitted
    });

    expect(result.success).toBe(true);
  });
});

describe('validateTemplateVariables', () => {
  const template: FirewallTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'Test',
    category: 'CUSTOM',
    complexity: 'SIMPLE',
    ruleCount: 1,
    variables: [
      {
        name: 'LAN_INTERFACE',
        label: 'LAN Interface',
        type: 'INTERFACE',
        required: true,
      },
      {
        name: 'SSH_PORT',
        label: 'SSH Port',
        type: 'PORT',
        required: true,
      },
    ],
    rules: [
      {
        table: 'FILTER',
        chain: 'input',
        action: 'accept',
        position: null,
        properties: {},
      },
    ],
    isBuiltIn: false,
    version: '1.0.0',
  };

  it('should return success for valid variables', () => {
    const result = validateTemplateVariables(template, {
      LAN_INTERFACE: 'bridge1',
      SSH_PORT: '22',
    });

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return errors for invalid variables', () => {
    const result = validateTemplateVariables(template, {
      LAN_INTERFACE: '1invalid',
      SSH_PORT: '99999',
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toHaveProperty('field');
    expect(result.errors[0]).toHaveProperty('message');
  });

  it('should return errors for missing required variables', () => {
    const result = validateTemplateVariables(template, {
      LAN_INTERFACE: 'bridge1',
      // Missing SSH_PORT
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
