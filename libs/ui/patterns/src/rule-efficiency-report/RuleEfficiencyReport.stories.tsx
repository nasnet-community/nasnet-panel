/**
 * Storybook stories for RuleEfficiencyReport component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RuleEfficiencyReport } from './RuleEfficiencyReport';
import type { FirewallRule } from '@nasnet/core/types';
import type { Suggestion } from './types';

const meta: Meta<typeof RuleEfficiencyReport> = {
  title: 'Patterns/RuleEfficiencyReport',
  component: RuleEfficiencyReport,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    rules: {
      description: 'Array of firewall rules to analyze',
      control: { type: 'object' },
    },
    onApplySuggestion: {
      description: 'Callback when a suggestion is applied',
      action: 'applied',
    },
    onPreview: {
      description: 'Callback when previewing a suggestion',
      action: 'preview',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RuleEfficiencyReport>;

// Mock firewall rules for stories
const createMockRule = (overrides: Partial<FirewallRule>): FirewallRule => ({
  id: `rule-${Math.random().toString(36).substr(2, 9)}`,
  disabled: false,
  chain: 'input',
  action: 'accept',
  order: 0,
  packets: 0,
  bytes: 0,
  ...overrides,
});

// Story 1: No suggestions (optimal rules)
const optimalRules: FirewallRule[] = [
  createMockRule({
    id: 'rule-1',
    order: 1,
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.0/24',
    dstPort: '443',
    protocol: 'tcp',
    comment: 'Allow HTTPS from LAN',
    packets: 15000,
    bytes: 45000000,
  }),
  createMockRule({
    id: 'rule-2',
    order: 2,
    chain: 'input',
    action: 'accept',
    srcAddress: '10.0.0.0/8',
    dstPort: '22',
    protocol: 'tcp',
    comment: 'Allow SSH from internal',
    packets: 8000,
    bytes: 24000000,
  }),
  createMockRule({
    id: 'rule-3',
    order: 3,
    chain: 'input',
    action: 'drop',
    comment: 'Drop all other input',
    packets: 500,
    bytes: 1500000,
  }),
];

export const NoSuggestions: Story = {
  args: {
    rules: optimalRules,
    onApplySuggestion: (suggestion: Suggestion) => {
      console.log('Apply suggestion:', suggestion);
    },
    onPreview: (suggestion: Suggestion) => {
      console.log('Preview suggestion:', suggestion);
    },
  },
};

// Story 2: Has redundant rules
const redundantRules: FirewallRule[] = [
  createMockRule({
    id: 'rule-1',
    order: 1,
    chain: 'input',
    action: 'accept',
    comment: 'Accept all from LAN',
    srcAddress: '192.168.1.0/24',
    packets: 25000,
    bytes: 75000000,
  }),
  createMockRule({
    id: 'rule-2',
    order: 2,
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.100',
    dstPort: '443',
    protocol: 'tcp',
    comment: 'Accept HTTPS from specific host (REDUNDANT)',
    packets: 0,
    bytes: 0,
  }),
  createMockRule({
    id: 'rule-3',
    order: 3,
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.0/24',
    dstPort: '22',
    protocol: 'tcp',
    comment: 'Accept SSH from LAN (REDUNDANT)',
    packets: 0,
    bytes: 0,
  }),
  createMockRule({
    id: 'rule-4',
    order: 4,
    chain: 'forward',
    action: 'drop',
    comment: 'Drop invalid connections',
    connectionState: ['invalid'],
    packets: 150,
    bytes: 450000,
  }),
  createMockRule({
    id: 'rule-5',
    order: 5,
    chain: 'forward',
    action: 'drop',
    comment: 'Drop invalid again (REDUNDANT)',
    connectionState: ['invalid'],
    packets: 0,
    bytes: 0,
    disabled: true,
  }),
];

export const HasRedundantRules: Story = {
  args: {
    rules: redundantRules,
    onApplySuggestion: (suggestion: Suggestion) => {
      console.log('Apply suggestion:', suggestion);
    },
    onPreview: (suggestion: Suggestion) => {
      console.log('Preview suggestion:', suggestion);
    },
  },
};

// Story 3: Has reorder suggestions
const inefficientRules: FirewallRule[] = [
  createMockRule({
    id: 'rule-1',
    order: 1,
    chain: 'input',
    action: 'accept',
    srcAddress: '10.0.0.1',
    dstPort: '8080',
    protocol: 'tcp',
    comment: 'Low traffic rule',
    packets: 50,
    bytes: 150000,
  }),
  createMockRule({
    id: 'rule-2',
    order: 2,
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.0/24',
    dstPort: '443',
    protocol: 'tcp',
    comment: 'High traffic HTTPS (should be first)',
    packets: 45000,
    bytes: 135000000,
  }),
  createMockRule({
    id: 'rule-3',
    order: 3,
    chain: 'input',
    action: 'accept',
    srcAddress: '10.0.0.2',
    dstPort: '3000',
    protocol: 'tcp',
    comment: 'Medium traffic rule',
    packets: 200,
    bytes: 600000,
  }),
  createMockRule({
    id: 'rule-4',
    order: 4,
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.0/24',
    dstPort: '80',
    protocol: 'tcp',
    comment: 'High traffic HTTP (should be second)',
    packets: 32000,
    bytes: 96000000,
  }),
  createMockRule({
    id: 'rule-5',
    order: 5,
    chain: 'input',
    action: 'drop',
    comment: 'Drop all other',
    packets: 1500,
    bytes: 4500000,
  }),
];

export const HasReorderSuggestions: Story = {
  args: {
    rules: inefficientRules,
    onApplySuggestion: (suggestion: Suggestion) => {
      console.log('Apply suggestion:', suggestion);
    },
    onPreview: (suggestion: Suggestion) => {
      console.log('Preview suggestion:', suggestion);
    },
  },
};

// Story 4: Mixed suggestions (both redundancy and reordering)
const mixedIssuesRules: FirewallRule[] = [
  createMockRule({
    id: 'rule-1',
    order: 1,
    chain: 'input',
    action: 'accept',
    comment: 'Accept all from LAN',
    srcAddress: '192.168.1.0/24',
    packets: 500,
    bytes: 1500000,
  }),
  createMockRule({
    id: 'rule-2',
    order: 2,
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.100',
    dstPort: '443',
    protocol: 'tcp',
    comment: 'Redundant HTTPS rule',
    packets: 0,
    bytes: 0,
  }),
  createMockRule({
    id: 'rule-3',
    order: 3,
    chain: 'input',
    action: 'accept',
    srcAddress: '10.0.0.0/8',
    dstPort: '22',
    protocol: 'tcp',
    comment: 'Low traffic SSH',
    packets: 100,
    bytes: 300000,
  }),
  createMockRule({
    id: 'rule-4',
    order: 4,
    chain: 'input',
    action: 'accept',
    protocol: 'tcp',
    dstPort: '80',
    comment: 'High traffic HTTP (should be earlier)',
    packets: 55000,
    bytes: 165000000,
  }),
  createMockRule({
    id: 'rule-5',
    order: 5,
    chain: 'input',
    action: 'drop',
    connectionState: ['invalid'],
    comment: 'Drop invalid',
    packets: 1200,
    bytes: 3600000,
  }),
  createMockRule({
    id: 'rule-6',
    order: 6,
    chain: 'input',
    action: 'drop',
    connectionState: ['invalid'],
    comment: 'Redundant drop invalid',
    packets: 0,
    bytes: 0,
    disabled: true,
  }),
];

export const MixedSuggestions: Story = {
  args: {
    rules: mixedIssuesRules,
    onApplySuggestion: (suggestion: Suggestion) => {
      console.log('Apply suggestion:', suggestion);
    },
    onPreview: (suggestion: Suggestion) => {
      console.log('Preview suggestion:', suggestion);
    },
  },
};

// Story 5: High severity issues
const highSeverityRules: FirewallRule[] = [
  createMockRule({
    id: 'rule-1',
    order: 1,
    chain: 'input',
    action: 'accept',
    comment: 'Accept all traffic (dangerous)',
    packets: 100000,
    bytes: 300000000,
  }),
  createMockRule({
    id: 'rule-2',
    order: 2,
    chain: 'input',
    action: 'accept',
    srcAddress: '0.0.0.0/0',
    dstPort: '22',
    protocol: 'tcp',
    comment: 'Redundant SSH accept (high severity)',
    packets: 0,
    bytes: 0,
  }),
  createMockRule({
    id: 'rule-3',
    order: 3,
    chain: 'input',
    action: 'accept',
    protocol: 'tcp',
    comment: 'Another redundant rule',
    packets: 0,
    bytes: 0,
  }),
];

export const HighSeverityIssues: Story = {
  args: {
    rules: highSeverityRules,
    onApplySuggestion: (suggestion: Suggestion) => {
      console.log('Apply suggestion:', suggestion);
    },
    onPreview: (suggestion: Suggestion) => {
      console.log('Preview suggestion:', suggestion);
    },
  },
};
