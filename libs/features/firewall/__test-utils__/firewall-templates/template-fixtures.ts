/**
 * Firewall Template Test Fixtures
 *
 * Mock data for template-related tests including templates, preview results,
 * impact analysis, and helper functions for generating test data.
 *
 * @module @nasnet/features/firewall/__test-utils__
 */

import type {
  FirewallTemplate,
  TemplatePreviewResult,
  FirewallTemplateResult,
  ImpactAnalysis,
  TemplateConflict,
  TemplateRule,
} from '@nasnet/core/types';

// ============================================================
// Mock Templates
// ============================================================

/**
 * Basic security template for testing
 * A simple firewall template with core security rules
 */
export const mockBasicSecurityTemplate: FirewallTemplate = {
  id: 'tpl-basic-security',
  name: 'Basic Security Template',
  description: 'A basic firewall security template with essential protection rules',
  category: 'SECURITY',
  complexity: 'SIMPLE',
  ruleCount: 3,
  variables: [
    {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      isRequired: true,
      defaultValue: 'bridge1',
      description: 'The local area network interface',
    },
    {
      name: 'LAN_SUBNET',
      label: 'LAN Subnet',
      type: 'SUBNET',
      isRequired: true,
      defaultValue: '192.168.88.0/24',
      description: 'The LAN subnet in CIDR notation',
    },
  ],
  rules: [
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'accept',
      comment: 'Allow established connections',
      position: null,
      properties: {
        'connection-state': 'established,related',
      },
    },
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'drop',
      comment: 'Drop invalid connections',
      position: null,
      properties: {
        'connection-state': 'invalid',
      },
    },
    {
      table: 'NAT',
      chain: 'srcnat',
      action: 'masquerade',
      comment: 'Masquerade from LAN',
      position: null,
      properties: {
        'out-interface': '${LAN_INTERFACE}',
      },
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Home network template for testing
 * A template designed for home network scenarios
 */
export const mockHomeNetworkTemplate: FirewallTemplate = {
  id: 'tpl-home-network',
  name: 'Home Network Template',
  description: 'A template optimized for home network configurations',
  category: 'HOME',
  complexity: 'MODERATE',
  ruleCount: 5,
  variables: [
    {
      name: 'GUEST_INTERFACE',
      label: 'Guest Network Interface',
      type: 'INTERFACE',
      isRequired: true,
      description: 'The guest network interface',
    },
    {
      name: 'IOT_SUBNET',
      label: 'IoT Device Subnet',
      type: 'SUBNET',
      isRequired: false,
      description: 'Optional subnet for IoT devices',
    },
  ],
  rules: [
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'accept',
      comment: 'Allow guest to LAN',
      position: null,
      properties: {
        'in-interface': '${GUEST_INTERFACE}',
        'connection-state': 'established,related,new',
      },
    },
    {
      table: 'FILTER',
      chain: 'forward',
      action: 'drop',
      comment: 'Block guest inter-vlan',
      position: null,
      properties: {
        'in-interface': '${GUEST_INTERFACE}',
        'out-interface': '!${GUEST_INTERFACE}',
      },
    },
    {
      table: 'NAT',
      chain: 'srcnat',
      action: 'masquerade',
      comment: 'NAT guest network',
      position: null,
      properties: {
        'out-interface': 'ether1',
      },
    },
    {
      table: 'MANGLE',
      chain: 'forward',
      action: 'mark-packet',
      comment: 'Mark guest traffic',
      position: null,
      properties: {
        'in-interface': '${GUEST_INTERFACE}',
        'new-packet-mark': 'guest',
      },
    },
    {
      table: 'RAW',
      chain: 'prerouting',
      action: 'accept',
      comment: 'Raw prerouting rule',
      position: null,
      properties: {
        'dst-address': '192.168.1.1',
      },
    },
  ],
  isBuiltIn: true,
  version: '1.1.0',
};

// ============================================================
// Mock Impact Analysis
// ============================================================

/**
 * Standard impact analysis for low-risk template
 */
export const mockStandardImpactAnalysis: ImpactAnalysis = {
  newRulesCount: 3,
  affectedChains: ['forward', 'srcnat'],
  estimatedApplyTime: 500,
  warnings: ['Some rules may affect existing traffic'],
};

/**
 * High-impact analysis for high-risk template
 */
export const mockHighImpactAnalysis: ImpactAnalysis = {
  newRulesCount: 20,
  affectedChains: ['input', 'forward', 'output', 'prerouting', 'postrouting'],
  estimatedApplyTime: 2000,
  warnings: [
    'This template will significantly modify your firewall configuration',
    'Existing rules may be affected',
    'Rollback may be required if issues occur',
  ],
};

// ============================================================
// Mock Conflicts
// ============================================================

/**
 * Sample template conflict for testing
 */
export const mockTemplateConflict: TemplateConflict = {
  type: 'DUPLICATE_RULE',
  message: 'A similar rule already exists in the forward chain',
  existingRuleId: 'rule-existing-1',
  proposedRule: {
    table: 'FILTER',
    chain: 'forward',
    action: 'accept',
    comment: 'Duplicate rule',
    position: null,
    properties: {
      'connection-state': 'established,related',
    },
  },
};

// ============================================================
// Mock Preview Results
// ============================================================

/**
 * Successful preview result with no conflicts
 */
export const mockPreviewResult: TemplatePreviewResult = {
  template: mockBasicSecurityTemplate,
  resolvedRules: mockBasicSecurityTemplate.rules,
  conflicts: [],
  impactAnalysis: mockStandardImpactAnalysis,
};

/**
 * Preview result with detected conflicts
 */
export const mockPreviewResultWithConflicts: TemplatePreviewResult = {
  template: mockHomeNetworkTemplate,
  resolvedRules: mockHomeNetworkTemplate.rules,
  conflicts: [mockTemplateConflict],
  impactAnalysis: {
    newRulesCount: 4,
    affectedChains: ['forward', 'srcnat', 'mangle'],
    estimatedApplyTime: 800,
    warnings: ['Conflict detected: duplicate rule exists', 'Review conflicts before applying'],
  },
};

// ============================================================
// Mock Apply Results
// ============================================================

/**
 * Successful template application result
 */
export const mockSuccessfulApplyResult: FirewallTemplateResult = {
  isSuccessful: true,
  appliedRulesCount: 3,
  rollbackId: 'rollback-success-001',
  errors: [],
};

/**
 * Partial failure result (some rules applied, some failed)
 */
export const mockPartialFailureResult: FirewallTemplateResult = {
  isSuccessful: false,
  appliedRulesCount: 2,
  rollbackId: 'rollback-partial-001',
  errors: [
    'Failed to apply rule 3: Invalid interface name',
    'Failed to apply rule 5: Conflicting chain configuration',
  ],
};

/**
 * Complete failure result
 */
export const mockCompleteFailureResult: FirewallTemplateResult = {
  isSuccessful: false,
  appliedRulesCount: 0,
  rollbackId: 'rollback-failed-001',
  errors: ['Template preview validation failed', 'Unable to connect to router'],
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate mock template variables for testing
 * Returns variables with sample values for basic security template
 *
 * @returns Variables object with default values
 *
 * @example
 * ```ts
 * const variables = generateMockVariables();
 * expect(variables.LAN_INTERFACE).toBe('bridge1');
 * ```
 */
export function generateMockVariables(): Record<string, string> {
  return {
    LAN_INTERFACE: 'bridge1',
    LAN_SUBNET: '192.168.88.0/24',
  };
}

/**
 * Generate mock home network variables
 * Returns variables with sample values for home network template
 *
 * @returns Variables object for home network template
 */
export function generateMockHomeNetworkVariables(): Record<string, string> {
  return {
    GUEST_INTERFACE: 'vlan-guest',
    IOT_SUBNET: '192.168.100.0/24',
  };
}

/**
 * Create a custom firewall rule for testing
 *
 * @param overrides Partial rule properties to override defaults
 * @returns A complete template rule object
 *
 * @example
 * ```ts
 * const rule = createMockRule({ chain: 'input', action: 'drop' });
 * ```
 */
export function createMockRule(overrides: Partial<TemplateRule> = {}): TemplateRule {
  return {
    table: 'FILTER',
    chain: 'forward',
    action: 'accept',
    comment: 'Mock rule',
    position: null,
    properties: {},
    ...overrides,
  };
}

/**
 * Create a custom firewall template for testing
 *
 * @param overrides Partial template properties to override defaults
 * @returns A complete firewall template object
 *
 * @example
 * ```ts
 * const template = createMockTemplate({
 *   name: 'Custom Template',
 *   complexity: 'ADVANCED'
 * });
 * ```
 */
export function createMockTemplate(overrides: Partial<FirewallTemplate> = {}): FirewallTemplate {
  return {
    id: 'tpl-custom',
    name: 'Custom Template',
    description: 'A custom template for testing',
    category: 'CUSTOM',
    complexity: 'MODERATE',
    ruleCount: 1,
    variables: [],
    rules: [createMockRule()],
    isBuiltIn: false,
    version: '1.0.0',
    ...overrides,
  };
}

/**
 * Create a custom template preview result for testing
 *
 * @param template The template to preview
 * @param overrides Partial preview result properties to override
 * @returns A complete template preview result object
 *
 * @example
 * ```ts
 * const preview = createMockPreviewResult(mockBasicSecurityTemplate, {
 *   impactAnalysis: mockHighImpactAnalysis
 * });
 * ```
 */
export function createMockPreviewResult(
  template: FirewallTemplate,
  overrides: Partial<TemplatePreviewResult> = {}
): TemplatePreviewResult {
  return {
    template,
    resolvedRules: template.rules,
    conflicts: [],
    impactAnalysis: mockStandardImpactAnalysis,
    ...overrides,
  };
}
