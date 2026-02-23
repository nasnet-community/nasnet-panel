/**
 * TemplateApplyFlow Storybook Stories
 *
 * Interactive stories for the XState-driven firewall template application flow.
 * Demonstrates all machine states: configuring, previewing, reviewing,
 * confirming (safety pipeline), applying, success, rolling back, rolled back, and error.
 *
 * @module @nasnet/features/firewall
 */

import { fn } from 'storybook/test';

import { TemplateApplyFlow } from './TemplateApplyFlow';

import type { FirewallTemplate } from '../schemas/templateSchemas';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock Data
// ============================================================================

/** A simple home network security template with two variables */
const mockBasicTemplate: FirewallTemplate = {
  id: 'tpl-basic-security',
  name: 'Basic Home Security',
  description: 'Essential firewall rules for a home network. Allows established connections, SSH from LAN, and drops everything else.',
  category: 'HOME',
  complexity: 'SIMPLE',
  ruleCount: 5,
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: null,
  updatedAt: null,
  variables: [
    {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      isRequired: true,
      description: 'The bridge or Ethernet interface facing your local network',
      defaultValue: 'bridge1',
    },
    {
      name: 'LAN_SUBNET',
      label: 'LAN Subnet (CIDR)',
      type: 'SUBNET',
      isRequired: true,
      description: 'Your local network address range',
      defaultValue: '192.168.88.0/24',
    },
  ],
  rules: [
    { table: 'FILTER' as const, chain: 'input', action: 'accept', position: 0, comment: 'Accept established', properties: { connectionState: ['established', 'related'] } },
    { table: 'FILTER' as const, chain: 'input', action: 'accept', position: 1, comment: 'Accept SSH from LAN', properties: { protocol: 'tcp', dstPort: '22', srcAddress: '{{LAN_SUBNET}}' } },
    { table: 'FILTER' as const, chain: 'input', action: 'drop', position: 2, comment: 'Drop all other input', properties: {} },
    { table: 'FILTER' as const, chain: 'forward', action: 'accept', position: 3, comment: 'Accept established forwards', properties: { connectionState: ['established', 'related'] } },
    { table: 'FILTER' as const, chain: 'forward', action: 'drop', position: 4, comment: 'Drop other forwards', properties: {} },
  ],
};

/** An advanced template with many rules to trigger the high-risk confirming state */
const mockAdvancedTemplate: FirewallTemplate = {
  id: 'tpl-advanced-vpn',
  name: 'Advanced VPN Security Suite',
  description: 'Comprehensive firewall ruleset for VPN-protected networks with IDS integration, QoS mangle, and NAT rules.',
  category: 'VPN',
  complexity: 'EXPERT',
  ruleCount: 18,
  isBuiltIn: true,
  version: '2.1.0',
  createdAt: null,
  updatedAt: null,
  variables: [
    { name: 'WAN_INTERFACE', label: 'WAN Interface', type: 'INTERFACE', isRequired: true, defaultValue: 'ether1' },
    { name: 'LAN_INTERFACE', label: 'LAN Interface', type: 'INTERFACE', isRequired: true, defaultValue: 'bridge1' },
    { name: 'VPN_SUBNET', label: 'VPN Subnet', type: 'SUBNET', isRequired: true, defaultValue: '10.0.0.0/24' },
    { name: 'DNS_SERVER', label: 'DNS Server IP', type: 'IP', isRequired: false, defaultValue: '1.1.1.1' },
    { name: 'SSH_PORT', label: 'SSH Port', type: 'PORT', isRequired: false, defaultValue: '22' },
  ],
  rules: Array.from({ length: 18 }, (_, i) => ({
    table: 'FILTER' as const,
    chain: i % 3 === 0 ? 'input' : i % 3 === 1 ? 'forward' : 'output',
    action: 'accept',
    position: i,
    comment: `Rule ${i + 1}`,
    properties: {},
  })),
};

/** Mock preview result for a clean (no conflicts) application */
const mockCleanPreviewResult = {
  template: mockBasicTemplate,
  resolvedRules: mockBasicTemplate.rules,
  conflicts: [],
  impactAnalysis: {
    newRulesCount: 5,
    affectedChains: ['input', 'forward'],
    estimatedApplyTime: 2,
    warnings: [],
  },
};

/** Mock preview result with one conflict and a warning */
const mockConflictPreviewResult = {
  template: mockBasicTemplate,
  resolvedRules: mockBasicTemplate.rules,
  conflicts: [
    {
      type: 'DUPLICATE_RULE' as const,
      message: 'Rule #3 (Drop all other input) conflicts with existing rule *7 — both drop all input traffic.',
      existingRuleId: '*7',
    },
  ],
  impactAnalysis: {
    newRulesCount: 5,
    affectedChains: ['input', 'forward'],
    estimatedApplyTime: 3,
    warnings: ['Existing drop rule at position 7 will become unreachable after applying.'],
  },
};

/** Mock apply result with a rollback ID */
const mockApplyResult = {
  success: true,
  appliedRulesCount: 5,
  rollbackId: 'rb-20260219-001',
  errors: [],
};

// ============================================================================
// Shared callback stubs
// ============================================================================

const onPreviewClean = fn().mockResolvedValue(mockCleanPreviewResult);
const onPreviewConflict = fn().mockResolvedValue(mockConflictPreviewResult);
// Preview that hangs indefinitely — keeps the machine in 'previewing' state
const onPreviewHang = fn().mockImplementation(() => new Promise(() => {}));
// Apply that hangs indefinitely — keeps the machine in 'applying' state
const onApplyHang = fn().mockImplementation(() => new Promise(() => {}));
const onApplySuccess = fn().mockResolvedValue(mockApplyResult);
const onApplyError = fn().mockRejectedValue(new Error('Failed to write rules: router connection timeout'));
// Rollback that hangs indefinitely — keeps the machine in 'rollingBack' state
const _onRollbackHang = fn().mockImplementation(() => new Promise(() => {}));
const onRollback = fn().mockResolvedValue(undefined);

/**
 * TemplateApplyFlow - XState-driven firewall template application wizard
 *
 * A multi-state UI that guides the user from template configuration through
 * preview, risk confirmation (safety pipeline), application, and optional rollback.
 *
 * ## Machine States
 *
 * | State | UI Shown |
 * |-------|----------|
 * | `configuring` | TemplatePreview component — fill in variables |
 * | `previewing` | Loader with "Generating preview..." message |
 * | `reviewing` | Impact analysis panel — conflicts, warnings, new rules count |
 * | `confirming` | High-risk dialog with acknowledgment checkbox (Safety Pipeline) |
 * | `applying` | Loader with "Applying template..." message |
 * | `success` | CheckCircle2 + UndoFloatingButton (5-minute rollback window) |
 * | `rollingBack` | Loader with "Rolling back..." message |
 * | `rolledBack` | CheckCircle2 with "Changes Rolled Back" message |
 * | `error` | Destructive Alert with Retry / Rollback / Cancel actions |
 *
 * ## Safety Pipeline
 *
 * The `confirming` state activates when the preview result has any of:
 * - More than 10 new rules
 * - More than 3 affected chains
 * - Any detected conflicts
 *
 * The user must check the acknowledgment checkbox before the "Apply" button enables.
 *
 * ## Rollback Window
 *
 * After successful apply, an `UndoFloatingButton` appears with a 5-minute countdown.
 * Clicking it opens a confirmation dialog before executing rollback.
 *
 * ## Usage
 *
 * ```tsx
 * import { TemplateApplyFlow } from '@nasnet/features/firewall';
 *
 * <TemplateApplyFlow
 *   routerId="192.168.88.1"
 *   template={selectedTemplate}
 *   onPreview={handlePreview}
 *   onApply={handleApply}
 *   onRollback={handleRollback}
 *   onSuccess={() => router.push('/firewall')}
 *   onCancel={() => setSelectedTemplate(null)}
 * />
 * ```
 */
const meta = {
  title: 'Features/Firewall/TemplateApplyFlow',
  component: TemplateApplyFlow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'XState-powered template application wizard. Drives the user through configure → preview → review → confirm (safety pipeline) → apply → success states with a 5-minute rollback window.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router IP or ID to apply the template to.',
    },
    template: {
      control: false,
      description: 'The FirewallTemplate object to apply. Pass null to render nothing.',
    },
  },
} satisfies Meta<typeof TemplateApplyFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Configuring State (Simple Template)
 *
 * Initial machine state — user fills in template variables.
 * The TemplatePreview component renders variable input fields.
 * Click "Preview" to advance to the reviewing state.
 */
export const Configuring: Story = {
  args: {
    routerId: '192.168.88.1',
    template: mockBasicTemplate,
    onPreview: onPreviewClean,
    onApply: onApplySuccess,
    onRollback: onRollback,
    onSuccess: fn(),
    onCancel: fn(),
    onRollbackComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial state. The TemplatePreview component renders the template\'s variable inputs (LAN_INTERFACE, LAN_SUBNET). Click "Preview" to trigger the XState PREVIEW event and advance to reviewing.',
      },
    },
  },
};

/**
 * Configuring State (Advanced Template)
 *
 * Expert template with 5 variables. Shows how the configuring state
 * scales to more complex templates.
 */
export const ConfiguringAdvancedTemplate: Story = {
  args: {
    routerId: '192.168.88.1',
    template: mockAdvancedTemplate,
    onPreview: onPreviewClean,
    onApply: onApplySuccess,
    onRollback: onRollback,
    onSuccess: fn(),
    onCancel: fn(),
    onRollbackComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuring state with an EXPERT-complexity template (5 variables). Shows how the TemplatePreview adapts to more input fields.',
      },
    },
  },
};

/**
 * Previewing State (Loading)
 *
 * The `previewing` machine state is active while onPreview is pending.
 * A centered spinner with "Generating preview..." copy is shown.
 * onPreview here hangs indefinitely to keep the UI in this state.
 */
export const PreviewingState: Story = {
  args: {
    routerId: '192.168.88.1',
    template: mockBasicTemplate,
    onPreview: onPreviewHang,
    onApply: onApplySuccess,
    onRollback: onRollback,
    onSuccess: fn(),
    onCancel: fn(),
    onRollbackComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Previewing state — the machine has sent the PREVIEW event and is waiting for onPreview to resolve. A Loader2 spinner shows "Generating preview... / Analyzing template and detecting conflicts". onPreview hangs indefinitely to hold this state.',
      },
    },
  },
};

/**
 * Applying State (Loading)
 *
 * The `applying` machine state is active while onApply is pending.
 * A centered spinner with "Applying template..." copy is shown.
 * onApply here hangs indefinitely to keep the UI in this state.
 */
export const ApplyingState: Story = {
  args: {
    routerId: '192.168.88.1',
    template: mockBasicTemplate,
    onPreview: onPreviewClean,
    onApply: onApplyHang,
    onRollback: onRollback,
    onSuccess: fn(),
    onCancel: fn(),
    onRollbackComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Applying state — onApply has been called and is pending. "Applying template... / Creating 5 firewall rules" is shown. onApply hangs indefinitely to hold this state for visual inspection.',
      },
    },
  },
};

/**
 * Null Template (Hidden State)
 *
 * When template is null, the component renders nothing.
 * This is intentional — the parent controls visibility by passing a template.
 */
export const NullTemplate: Story = {
  args: {
    routerId: '192.168.88.1',
    template: null,
    onPreview: fn(),
    onApply: fn(),
    onRollback: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'template=null renders null. The parent page gates this component\'s visibility by passing a selected template object.',
      },
    },
  },
};

/**
 * With Conflict Preview Result
 *
 * After preview, the reviewing state shows the ImpactAnalysis.
 * This story simulates an onPreview that returns a conflict.
 * Click "Preview" in the configuring step to see the conflict alert.
 */
export const WithConflicts: Story = {
  args: {
    routerId: '192.168.88.1',
    template: mockBasicTemplate,
    onPreview: onPreviewConflict,
    onApply: onApplySuccess,
    onRollback: onRollback,
    onSuccess: fn(),
    onCancel: fn(),
    onRollbackComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Preview returns a DUPLICATE_RULE conflict. After previewing, the reviewing state shows a conflicts alert. The Apply button reads "Apply Anyway" when conflicts are present.',
      },
    },
  },
};

/**
 * Apply Error State
 *
 * Simulates an API failure during template application.
 * After configuring and previewing, clicking Apply will show the error state
 * with a destructive Alert and Retry / Cancel actions.
 */
export const ApplyError: Story = {
  args: {
    routerId: '192.168.88.1',
    template: mockBasicTemplate,
    onPreview: onPreviewClean,
    onApply: onApplyError,
    onRollback: onRollback,
    onSuccess: fn(),
    onCancel: fn(),
    onRollbackComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'onApply rejects with a connection timeout error. After previewing and clicking Apply, the error state renders with a destructive Alert containing the error message, and Retry / Cancel action buttons.',
      },
    },
  },
};
