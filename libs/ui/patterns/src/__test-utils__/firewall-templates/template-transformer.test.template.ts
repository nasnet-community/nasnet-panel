/**
 * Unit Tests for Template Transformation Logic (NAS-7.6 Task 7.1)
 *
 * Tests variable substitution in template rules.
 * This is a TEMPLATE file - uncomment and move to the appropriate location once
 * the template-transformer utility is implemented.
 *
 * MOVE TO: libs/features/firewall/src/utils/template-transformer.test.ts
 *
 * Test Coverage:
 * - `resolveVariables()`: Single/multiple/nested variable replacement in strings
 * - `resolveTemplateRules()`: Variable substitution across rule comments and properties
 * - Edge cases: unmatched variables, empty maps, special characters, non-string properties
 *
 * @see libs/features/firewall/src/utils/template-transformer.ts
 * @see libs/core/types/src/firewall/template.types.ts for type definitions
 */

import { describe, it, expect } from 'vitest';

// TODO: Uncomment once implementation exists
// import { resolveTemplateVariables, transformTemplate } from '../utils/template-transformer';
import {
  mockBasicSecurityTemplate,
  mockNatRule,
  mockFilterRule,
  generateMockVariables,
  resolveVariables,
  resolveTemplateRules,
} from './template-fixtures';

describe('resolveVariables', () => {
  it('replaces single variable in string', () => {
    const text = 'Allow traffic from {{LAN_INTERFACE}}';
    const variables = { LAN_INTERFACE: 'bridge1' };

    const result = resolveVariables(text, variables);

    expect(result).toBe('Allow traffic from bridge1');
  });

  it('replaces multiple variables in string', () => {
    const text = 'NAT {{LAN_SUBNET}} to {{WAN_INTERFACE}}';
    const variables = {
      LAN_SUBNET: '192.168.88.0/24',
      WAN_INTERFACE: 'ether1',
    };

    const result = resolveVariables(text, variables);

    expect(result).toBe('NAT 192.168.88.0/24 to ether1');
  });

  it('leaves unmatched variables unchanged', () => {
    const text = 'Allow {{UNKNOWN_VAR}}';
    const variables = { LAN_INTERFACE: 'bridge1' };

    const result = resolveVariables(text, variables);

    expect(result).toBe('Allow {{UNKNOWN_VAR}}');
  });

  it('handles strings without variables', () => {
    const text = 'Allow all traffic';
    const variables = { LAN_INTERFACE: 'bridge1' };

    const result = resolveVariables(text, variables);

    expect(result).toBe('Allow all traffic');
  });

  it('handles empty variable map', () => {
    const text = 'Allow traffic from {{LAN_INTERFACE}}';
    const variables = {};

    const result = resolveVariables(text, variables);

    expect(result).toBe('Allow traffic from {{LAN_INTERFACE}}');
  });

  it('handles special characters in variable values', () => {
    const text = 'Subnet: {{LAN_SUBNET}}';
    const variables = { LAN_SUBNET: '192.168.1.0/24' };

    const result = resolveVariables(text, variables);

    expect(result).toBe('Subnet: 192.168.1.0/24');
  });

  it('replaces variables in property values', () => {
    const text = 'vlan{{VLAN_ID}}';
    const variables = { VLAN_ID: '10' };

    const result = resolveVariables(text, variables);

    expect(result).toBe('vlan10');
  });
});

describe('resolveTemplateRules', () => {
  it('resolves variables in rule comments', () => {
    const rules = [
      {
        ...mockNatRule,
        comment: 'NAT for {{LAN_SUBNET}}',
      },
    ];
    const variables = { LAN_SUBNET: '192.168.88.0/24' };

    const result = resolveTemplateRules(rules, variables);

    expect(result[0].comment).toBe('NAT for 192.168.88.0/24');
  });

  it('resolves variables in rule properties', () => {
    const rules = [
      {
        ...mockNatRule,
        properties: {
          outInterface: '{{WAN_INTERFACE}}',
          srcAddress: '{{LAN_SUBNET}}',
        },
      },
    ];
    const variables = {
      WAN_INTERFACE: 'ether1',
      LAN_SUBNET: '192.168.88.0/24',
    };

    const result = resolveTemplateRules(rules, variables);

    expect(result[0].properties.outInterface).toBe('ether1');
    expect(result[0].properties.srcAddress).toBe('192.168.88.0/24');
  });

  it('preserves non-string property values', () => {
    const rules = [
      {
        ...mockFilterRule,
        properties: {
          connectionState: ['established', 'related'],
          passthrough: true,
          position: 0,
        },
      },
    ];
    const variables = {};

    const result = resolveTemplateRules(rules, variables);

    expect(result[0].properties.connectionState).toEqual(['established', 'related']);
    expect(result[0].properties.passthrough).toBe(true);
    expect(result[0].properties.position).toBe(0);
  });

  it('resolves multiple rules correctly', () => {
    const rules = [
      {
        ...mockNatRule,
        comment: 'NAT for {{LAN_SUBNET}}',
        properties: { outInterface: '{{WAN_INTERFACE}}' },
      },
      {
        ...mockFilterRule,
        comment: 'Allow from {{LAN_INTERFACE}}',
        properties: { inInterface: '{{LAN_INTERFACE}}' },
      },
    ];
    const variables = generateMockVariables();

    const result = resolveTemplateRules(rules, variables);

    expect(result).toHaveLength(2);
    expect(result[0].comment).toBe('NAT for 192.168.88.0/24');
    expect(result[0].properties.outInterface).toBe('ether1');
    expect(result[1].comment).toBe('Allow from bridge1');
    expect(result[1].properties.inInterface).toBe('bridge1');
  });

  it('handles rules without comments', () => {
    const rules = [
      {
        ...mockFilterRule,
        comment: undefined,
        properties: { inInterface: '{{LAN_INTERFACE}}' },
      },
    ];
    const variables = { LAN_INTERFACE: 'bridge1' };

    const result = resolveTemplateRules(rules, variables);

    expect(result[0].comment).toBeUndefined();
    expect(result[0].properties.inInterface).toBe('bridge1');
  });

  it('handles nested variable syntax in properties', () => {
    const rules = [
      {
        ...mockFilterRule,
        properties: {
          inInterface: 'vlan{{VLAN_ID}}',
          comment: 'VLAN {{VLAN_ID}} traffic',
        },
      },
    ];
    const variables = { VLAN_ID: '10' };

    const result = resolveTemplateRules(rules, variables);

    expect(result[0].properties.inInterface).toBe('vlan10');
    expect(result[0].properties.comment).toBe('VLAN 10 traffic');
  });
});

// TODO: Uncomment once transformTemplate is implemented
/*
describe('transformTemplate', () => {
  it('transforms complete template with all rules', () => {
    const variables = generateMockVariables();

    const result = transformTemplate(mockBasicSecurityTemplate, variables);

    expect(result.rules).toHaveLength(mockBasicSecurityTemplate.rules.length);
    expect(result.rules[0].comment).not.toContain('{{');
    expect(result.rules[0].properties.inInterface).toBe('bridge1');
  });

  it('preserves template metadata', () => {
    const variables = generateMockVariables();

    const result = transformTemplate(mockBasicSecurityTemplate, variables);

    expect(result.id).toBe(mockBasicSecurityTemplate.id);
    expect(result.name).toBe(mockBasicSecurityTemplate.name);
    expect(result.description).toBe(mockBasicSecurityTemplate.description);
    expect(result.category).toBe(mockBasicSecurityTemplate.category);
  });

  it('throws error for missing required variables', () => {
    const variables = {}; // Empty - missing required variables

    expect(() => transformTemplate(mockBasicSecurityTemplate, variables)).toThrow(
      'Required variable'
    );
  });

  it('uses default values for optional variables', () => {
    const templateWithOptionalVar = {
      ...mockBasicSecurityTemplate,
      variables: [
        ...mockBasicSecurityTemplate.variables,
        {
          name: 'OPTIONAL_VAR',
          label: 'Optional',
          type: 'STRING' as const,
          defaultValue: 'default-value',
          required: false,
          description: 'Optional variable',
          options: undefined,
        },
      ],
      rules: [
        {
          ...mockFilterRule,
          comment: 'Use {{OPTIONAL_VAR}}',
        },
      ],
    };

    const result = transformTemplate(templateWithOptionalVar, {
      LAN_INTERFACE: 'bridge1',
      LAN_SUBNET: '192.168.88.0/24',
    });

    expect(result.rules[0].comment).toBe('Use default-value');
  });

  it('handles templates with no variables', () => {
    const simpleTemplate = {
      ...mockBasicSecurityTemplate,
      variables: [],
      rules: [
        {
          ...mockFilterRule,
          comment: 'Static rule',
          properties: { protocol: 'icmp' },
        },
      ],
    };

    const result = transformTemplate(simpleTemplate, {});

    expect(result.rules[0].comment).toBe('Static rule');
    expect(result.rules[0].properties.protocol).toBe('icmp');
  });
});
*/

// TODO: Add tests for edge cases once implementation exists:
// - Very long variable values
// - Variable names with underscores and numbers
// - Circular variable references (if supported)
// - Variable case sensitivity
// - Unicode in variable values
// - Empty string variable values
