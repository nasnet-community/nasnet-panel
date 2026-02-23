/**
 * Firewall Template Test Fixtures
 *
 * Mock data and utilities for comprehensive testing of the Firewall Templates feature (NAS-7.6).
 * This file provides complete mock data for templates, variables, rules, and API responses.
 *
 * @see libs/features/firewall/src/components/TemplatesPage.tsx
 * @see libs/ui/patterns/src/template-gallery/
 * @see libs/ui/patterns/src/template-preview/
 */

import type {
  FirewallTemplate,
  TemplateVariable,
  TemplateRule,
  TemplatePreviewResult,
  TemplateConflict,
  ImpactAnalysis,
  FirewallTemplateResult,
  TemplateCategory,
  TemplateComplexity,
  VariableType,
  FirewallTable,
  TemplateConflictType,
} from '@nasnet/core/types';

// Re-export types for consumers that import from this fixture
export type {
  FirewallTemplate,
  TemplateVariable,
  TemplateRule,
  TemplatePreviewResult,
  TemplateConflict,
  ImpactAnalysis,
  FirewallTemplateResult,
  TemplateCategory,
  TemplateComplexity,
  VariableType,
  FirewallTable,
  TemplateConflictType,
};

// ============================================
// MOCK TEMPLATE VARIABLES
// ============================================

export const mockInterfaceVariable: TemplateVariable = {
  name: 'LAN_INTERFACE',
  label: 'LAN Interface',
  type: 'INTERFACE' as VariableType,
  defaultValue: 'bridge1',
  isRequired: true,
  description: 'The interface connected to your local network',
  options: ['bridge1', 'ether2', 'ether3', 'ether4', 'wlan1'],
};

export const mockWanInterfaceVariable: TemplateVariable = {
  name: 'WAN_INTERFACE',
  label: 'WAN Interface',
  type: 'INTERFACE' as VariableType,
  defaultValue: 'ether1',
  isRequired: true,
  description: 'The interface connected to the internet',
  options: ['ether1', 'pppoe-out1', 'lte1'],
};

export const mockSubnetVariable: TemplateVariable = {
  name: 'LAN_SUBNET',
  label: 'LAN Subnet',
  type: 'SUBNET' as VariableType,
  defaultValue: '192.168.88.0/24',
  isRequired: true,
  description: 'Your local network subnet in CIDR notation',
  options: undefined,
};

export const mockVlanIdVariable: TemplateVariable = {
  name: 'VLAN_ID',
  label: 'VLAN ID',
  type: 'VLAN_ID' as VariableType,
  defaultValue: '10',
  isRequired: true,
  description: 'VLAN ID for isolated network',
  options: undefined,
};

// ============================================
// MOCK TEMPLATE RULES
// ============================================

export const mockFilterRule: TemplateRule = {
  table: 'FILTER' as FirewallTable,
  chain: 'input',
  action: 'accept',
  comment: 'Allow established connections',
  position: 0,
  properties: {
    connectionState: ['established', 'related'],
  },
};

export const mockNatRule: TemplateRule = {
  table: 'NAT' as FirewallTable,
  chain: 'srcnat',
  action: 'masquerade',
  comment: 'NAT for {{LAN_SUBNET}}',
  position: null,
  properties: {
    outInterface: '{{WAN_INTERFACE}}',
    srcAddress: '{{LAN_SUBNET}}',
  },
};

export const mockMangleRule: TemplateRule = {
  table: 'MANGLE' as FirewallTable,
  chain: 'prerouting',
  action: 'mark-connection',
  comment: 'Mark web traffic',
  position: null,
  properties: {
    protocol: 'tcp',
    dstPort: '80,443',
    newConnectionMark: 'web_traffic',
    passthrough: true,
  },
};

export const mockDropRule: TemplateRule = {
  table: 'FILTER' as FirewallTable,
  chain: 'input',
  action: 'drop',
  comment: 'Drop invalid packets',
  position: 1,
  properties: {
    connectionState: ['invalid'],
  },
};

// ============================================
// MOCK BUILT-IN TEMPLATES
// ============================================

export const mockBasicSecurityTemplate: FirewallTemplate = {
  id: 'basic-security',
  name: 'Basic Security',
  description: 'Essential firewall rules to secure your network. Blocks invalid packets, allows established connections, and drops unwanted traffic.',
  category: 'BASIC' as TemplateCategory,
  complexity: 'SIMPLE' as TemplateComplexity,
  ruleCount: 5,
  variables: [mockInterfaceVariable, mockSubnetVariable],
  rules: [
    mockFilterRule,
    mockDropRule,
    {
      table: 'FILTER' as FirewallTable,
      chain: 'input',
      action: 'accept',
      comment: 'Allow ICMP',
      position: 2,
      properties: { protocol: 'icmp' },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'input',
      action: 'accept',
      comment: 'Allow from LAN',
      position: 3,
      properties: { inInterface: '{{LAN_INTERFACE}}' },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'input',
      action: 'drop',
      comment: 'Drop all other input',
      position: null,
      properties: {},
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
};

export const mockHomeNetworkTemplate: FirewallTemplate = {
  id: 'home-network',
  name: 'Home Network',
  description: 'Complete home network setup with NAT, basic protection, and LAN access. Suitable for most home users.',
  category: 'HOME' as TemplateCategory,
  complexity: 'MODERATE' as TemplateComplexity,
  ruleCount: 8,
  variables: [mockInterfaceVariable, mockWanInterfaceVariable, mockSubnetVariable],
  rules: [
    mockNatRule,
    mockFilterRule,
    mockDropRule,
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'accept',
      comment: 'Allow LAN to WAN',
      position: null,
      properties: {
        inInterface: '{{LAN_INTERFACE}}',
        outInterface: '{{WAN_INTERFACE}}',
      },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'accept',
      comment: 'Allow established/related',
      position: null,
      properties: {
        connectionState: ['established', 'related'],
      },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'drop',
      comment: 'Drop invalid',
      position: null,
      properties: {
        connectionState: ['invalid'],
      },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'drop',
      comment: 'Drop all other forward',
      position: null,
      properties: {},
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'input',
      action: 'accept',
      comment: 'Allow from LAN',
      position: null,
      properties: { inInterface: '{{LAN_INTERFACE}}' },
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
};

export const mockGamingOptimizedTemplate: FirewallTemplate = {
  id: 'gaming-optimized',
  name: 'Gaming Optimized',
  description: 'Low-latency firewall rules for gaming. Prioritizes gaming traffic and enables UPnP for seamless multiplayer.',
  category: 'GAMING' as TemplateCategory,
  complexity: 'ADVANCED' as TemplateComplexity,
  ruleCount: 12,
  variables: [mockInterfaceVariable, mockWanInterfaceVariable, mockSubnetVariable],
  rules: [
    mockNatRule,
    mockMangleRule,
    // Gaming-specific rules would go here
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
};

export const mockIotIsolationTemplate: FirewallTemplate = {
  id: 'iot-isolation',
  name: 'IoT Isolation',
  description: 'Isolate IoT devices on a separate VLAN with restricted access. Allows internet but blocks LAN access.',
  category: 'IOT' as TemplateCategory,
  complexity: 'ADVANCED' as TemplateComplexity,
  ruleCount: 10,
  variables: [mockInterfaceVariable, mockWanInterfaceVariable, mockSubnetVariable, mockVlanIdVariable],
  rules: [
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'drop',
      comment: 'Block IoT to LAN',
      position: 0,
      properties: {
        inInterface: 'vlan{{VLAN_ID}}',
        outInterface: '{{LAN_INTERFACE}}',
      },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'accept',
      comment: 'Allow IoT to internet',
      position: 1,
      properties: {
        inInterface: 'vlan{{VLAN_ID}}',
        outInterface: '{{WAN_INTERFACE}}',
      },
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
};

export const mockGuestNetworkTemplate: FirewallTemplate = {
  id: 'guest-network',
  name: 'Guest Network',
  description: 'Isolated guest network with internet-only access. No access to your local network or devices.',
  category: 'GUEST' as TemplateCategory,
  complexity: 'MODERATE' as TemplateComplexity,
  ruleCount: 7,
  variables: [mockInterfaceVariable, mockWanInterfaceVariable, mockSubnetVariable],
  rules: [
    {
      table: 'FILTER' as FirewallTable,
      chain: 'forward',
      action: 'drop',
      comment: 'Block guest to LAN',
      position: 0,
      properties: {
        srcAddress: '{{LAN_SUBNET}}',
        dstAddress: '192.168.88.0/24',
      },
    },
  ],
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
};

// ============================================
// MOCK CUSTOM TEMPLATE
// ============================================

export const mockCustomTemplate: FirewallTemplate = {
  id: 'custom-vpn-rules',
  name: 'VPN Server Rules',
  description: 'Custom rules for OpenVPN server with port forwarding',
  category: 'CUSTOM' as TemplateCategory,
  complexity: 'MODERATE' as TemplateComplexity,
  ruleCount: 4,
  variables: [mockWanInterfaceVariable],
  rules: [
    {
      table: 'NAT' as FirewallTable,
      chain: 'dstnat',
      action: 'dst-nat',
      comment: 'Port forward OpenVPN',
      position: null,
      properties: {
        protocol: 'udp',
        dstPort: '1194',
        toAddresses: '192.168.88.10',
        toPorts: '1194',
      },
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'input',
      action: 'accept',
      comment: 'Allow OpenVPN',
      position: null,
      properties: {
        protocol: 'udp',
        dstPort: '1194',
      },
    },
  ],
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: new Date('2026-01-15T10:30:00Z'),
  updatedAt: new Date('2026-01-20T14:45:00Z'),
};

// ============================================
// MOCK TEMPLATE ARRAYS
// ============================================

export const mockBuiltInTemplates: FirewallTemplate[] = [
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
  mockGamingOptimizedTemplate,
  mockIotIsolationTemplate,
  mockGuestNetworkTemplate,
];

export const mockCustomTemplates: FirewallTemplate[] = [mockCustomTemplate];

export const mockAllTemplates: FirewallTemplate[] = [...mockBuiltInTemplates, ...mockCustomTemplates];

// ============================================
// MOCK CONFLICTS
// ============================================

export const mockDuplicateRuleConflict: TemplateConflict = {
  type: 'DUPLICATE_RULE' as TemplateConflictType,
  message: 'A similar rule already exists in the input chain',
  existingRuleId: '*10',
  proposedRule: mockFilterRule,
};

export const mockIpOverlapConflict: TemplateConflict = {
  type: 'IP_OVERLAP' as TemplateConflictType,
  message: 'Subnet 192.168.88.0/24 overlaps with existing rule',
  existingRuleId: '*5',
  proposedRule: mockNatRule,
};

export const mockChainConflict: TemplateConflict = {
  type: 'CHAIN_CONFLICT' as TemplateConflictType,
  message: 'Chain "forward" already has a default drop rule',
  existingRuleId: '*15',
  proposedRule: mockDropRule,
};

export const mockPositionConflict: TemplateConflict = {
  type: 'POSITION_CONFLICT' as TemplateConflictType,
  message: 'Position 0 is already occupied',
  existingRuleId: '*1',
  proposedRule: mockFilterRule,
};

export const mockConflicts: TemplateConflict[] = [
  mockDuplicateRuleConflict,
  mockIpOverlapConflict,
];

// ============================================
// MOCK IMPACT ANALYSIS
// ============================================

export const mockImpactAnalysis: ImpactAnalysis = {
  newRulesCount: 5,
  affectedChains: ['input', 'forward', 'srcnat'],
  estimatedApplyTime: 3,
  warnings: [
    'Existing drop rule in input chain may conflict',
    'NAT rule will be added to the end of srcnat chain',
  ],
};

export const mockSafeImpactAnalysis: ImpactAnalysis = {
  newRulesCount: 5,
  affectedChains: ['input', 'forward'],
  estimatedApplyTime: 2,
  warnings: [],
};

export const mockHighImpactAnalysis: ImpactAnalysis = {
  newRulesCount: 15,
  affectedChains: ['input', 'forward', 'output', 'prerouting', 'postrouting', 'srcnat', 'dstnat'],
  estimatedApplyTime: 8,
  warnings: [
    'Large number of rules may impact router performance',
    'Multiple chain modifications require careful review',
    'Existing rules may be affected',
  ],
};

// ============================================
// MOCK PREVIEW RESULTS
// ============================================

export const mockPreviewResult: TemplatePreviewResult = {
  template: mockBasicSecurityTemplate,
  resolvedRules: [
    {
      ...mockFilterRule,
      comment: 'Allow established connections',
    },
    {
      ...mockDropRule,
      comment: 'Drop invalid packets',
    },
    {
      table: 'FILTER' as FirewallTable,
      chain: 'input',
      action: 'accept',
      comment: 'Allow from LAN',
      position: 3,
      properties: { inInterface: 'bridge1' }, // Variable resolved
    },
  ],
  conflicts: [],
  impactAnalysis: mockSafeImpactAnalysis,
};

export const mockPreviewResultWithConflicts: TemplatePreviewResult = {
  template: mockHomeNetworkTemplate,
  resolvedRules: [
    {
      ...mockNatRule,
      comment: 'NAT for 192.168.88.0/24',
      properties: {
        outInterface: 'ether1',
        srcAddress: '192.168.88.0/24',
      },
    },
  ],
  conflicts: mockConflicts,
  impactAnalysis: mockImpactAnalysis,
};

// ============================================
// MOCK TEMPLATE RESULTS
// ============================================

export const mockSuccessfulApplyResult: FirewallTemplateResult = {
  isSuccessful: true,
  appliedRulesCount: 5,
  rollbackId: 'rollback-123456',
  errors: [],
};

export const mockPartialFailureResult: FirewallTemplateResult = {
  isSuccessful: false,
  appliedRulesCount: 3,
  rollbackId: 'rollback-123457',
  errors: [
    'Failed to create rule in position 4: invalid chain',
    'Failed to create rule in position 5: syntax error',
  ],
};

export const mockCompleteFailureResult: FirewallTemplateResult = {
  isSuccessful: false,
  appliedRulesCount: 0,
  rollbackId: '',
  errors: ['Connection to router lost during application'],
};

// ============================================
// MOCK GRAPHQL RESPONSES
// ============================================

export const mockFirewallTemplatesResponse = {
  data: {
    firewallTemplates: mockAllTemplates,
  },
};

export const mockFirewallTemplatesByCategory = (category: TemplateCategory) => ({
  data: {
    firewallTemplates: mockAllTemplates.filter((t) => t.category === category),
  },
});

export const mockPreviewTemplateResponse = {
  data: {
    previewTemplate: mockPreviewResult,
  },
};

export const mockPreviewTemplateWithConflictsResponse = {
  data: {
    previewTemplate: mockPreviewResultWithConflicts,
  },
};

export const mockApplyTemplateResponse = {
  data: {
    applyFirewallTemplate: mockSuccessfulApplyResult,
  },
};

export const mockApplyTemplateErrorResponse = {
  data: {
    applyFirewallTemplate: mockPartialFailureResult,
  },
};

export const mockRollbackTemplateResponse = {
  data: {
    rollbackFirewallTemplate: true,
  },
};

export const mockSaveTemplateResponse = {
  data: {
    saveFirewallTemplate: mockCustomTemplate,
  },
};

export const mockDeleteTemplateResponse = {
  data: {
    deleteFirewallTemplate: true,
  },
};

export const mockRouterInterfacesResponse = {
  data: {
    routerInterfaces: ['bridge1', 'ether1', 'ether2', 'ether3', 'ether4', 'wlan1', 'vlan10'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Resolve template variables in a string.
 * Replaces {{VARIABLE_NAME}} with actual values.
 */
export function resolveVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });
}

/**
 * Resolve all variables in template rules.
 */
export function resolveTemplateRules(
  rules: TemplateRule[],
  variables: Record<string, string>
): TemplateRule[] {
  return rules.map((rule) => ({
    ...rule,
    comment: rule.comment ? resolveVariables(rule.comment, variables) : rule.comment,
    properties: Object.entries(rule.properties).reduce(
      (acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = resolveVariables(value, variables);
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    ),
  }));
}

/**
 * Validate template variables against requirements.
 */
export function validateTemplateVariables(
  template: FirewallTemplate,
  providedVariables: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  template.variables.forEach((variable) => {
    if (variable.isRequired && !providedVariables[variable.name]) {
      errors.push(`Required variable "${variable.name}" is missing`);
    }

    const value = providedVariables[variable.name];
    if (value) {
      // Type-specific validation
      switch (variable.type) {
        case 'INTERFACE': {
          if (variable.options && !variable.options.includes(value)) {
            errors.push(`Invalid interface "${value}" for variable "${variable.name}"`);
          }
          break;
        }
        case 'SUBNET': {
          if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(value)) {
            errors.push(`Invalid subnet format for variable "${variable.name}"`);
          }
          break;
        }
        case 'IP': {
          if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
            errors.push(`Invalid IP address format for variable "${variable.name}"`);
          }
          break;
        }
        case 'PORT': {
          const port = parseInt(value, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            errors.push(`Invalid port number for variable "${variable.name}"`);
          }
          break;
        }
        case 'VLAN_ID': {
          const vlanId = parseInt(value, 10);
          if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
            errors.push(`Invalid VLAN ID for variable "${variable.name}"`);
          }
          break;
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate mock template variables for testing.
 */
export function generateMockVariables(): Record<string, string> {
  return {
    LAN_INTERFACE: 'bridge1',
    WAN_INTERFACE: 'ether1',
    LAN_SUBNET: '192.168.88.0/24',
    VLAN_ID: '10',
  };
}

/**
 * Filter templates by category.
 */
export function filterTemplatesByCategory(
  templates: FirewallTemplate[],
  category?: TemplateCategory
): FirewallTemplate[] {
  if (!category) return templates;
  return templates.filter((t) => t.category === category);
}

/**
 * Filter templates by complexity.
 */
export function filterTemplatesByComplexity(
  templates: FirewallTemplate[],
  complexity?: TemplateComplexity
): FirewallTemplate[] {
  if (!complexity) return templates;
  return templates.filter((t) => t.complexity === complexity);
}

/**
 * Search templates by name or description.
 */
export function searchTemplates(templates: FirewallTemplate[], query: string): FirewallTemplate[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
  );
}
