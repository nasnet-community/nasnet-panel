/**
 * AlertRuleForm Storybook Stories
 *
 * Covers create mode, edit mode, error state, and variant configurations
 * of the AlertRuleForm component.
 *
 * Note: This component calls useCreateAlertRule / useUpdateAlertRule which
 * use Apollo mutations. We wrap stories with MockedProvider and provide
 * no-op callbacks for onSuccess / onCancel.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { AlertRuleForm } from './AlertRuleForm';

import type { AlertRuleFormData } from '../schemas/alert-rule.schema';
import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertRuleForm> = {
  title: 'Features/Alerts/AlertRuleForm',
  component: AlertRuleForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**AlertRuleForm** provides a full create/edit form for alert rules.

**Fields:**
- Rule name (required)
- Description (optional)
- Event type (required, e.g. \`device.cpu.high\`)
- Severity — radio group: Critical / Warning / Info
- Conditions — dynamic rows with field / operator / value
- Notification channels — multi-select checkboxes
- Enabled toggle

**Modes:**
- **Create** (no \`ruleId\`): heading "Create Alert Rule", submit "Create Rule"
- **Edit** (with \`ruleId\`): heading "Edit Alert Rule", submit "Update Rule"

Validation uses Zod. The submit button is disabled until the form is dirty.
        `,
      },
    },
  },
  argTypes: {
    ruleId: { control: 'text' },
    onSuccess: { action: 'onSuccess' },
    onCancel: { action: 'onCancel' },
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[]}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AlertRuleForm>;

// =============================================================================
// Inline mock data
// =============================================================================

const cpuAlertData: Partial<AlertRuleFormData> = {
  name: 'High CPU Alert',
  description: 'Triggers when router CPU usage exceeds 90% for 5+ minutes.',
  eventType: 'device.cpu.high',
  severity: 'CRITICAL',
  conditions: [{ field: 'cpu_percent', operator: 'GREATER_THAN', value: '90' }],
  channels: ['inapp', 'email'],
  enabled: true,
};

const vpnAlertData: Partial<AlertRuleFormData> = {
  name: 'VPN Tunnel Down',
  description: 'Alert when a WireGuard tunnel goes offline.',
  eventType: 'vpn.tunnel.down',
  severity: 'WARNING',
  conditions: [
    { field: 'tunnel_status', operator: 'EQUALS', value: 'down' },
    { field: 'duration_seconds', operator: 'GREATER_THAN', value: '120' },
  ],
  channels: ['inapp'],
  enabled: true,
};

const multiChannelAlertData: Partial<AlertRuleFormData> = {
  name: 'Firewall Attack Detected',
  description: 'Sends notifications to multiple channels on firewall events.',
  eventType: 'firewall.attack.detected',
  severity: 'CRITICAL',
  conditions: [{ field: 'attack_type', operator: 'CONTAINS', value: 'port_scan' }],
  channels: ['inapp', 'email', 'webhook'],
  enabled: true,
};

// =============================================================================
// Stories
// =============================================================================

/**
 * Create mode — blank form ready for a new alert rule.
 */
export const CreateMode: Story = {
  args: {
    onSuccess: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Blank form in create mode. The submit button is disabled until the form is dirty and valid.',
      },
    },
  },
};

/**
 * Pre-filled CPU alert — edit mode with existing rule data.
 */
export const EditMode: Story = {
  args: {
    ruleId: 'rule-cpu-001',
    initialData: cpuAlertData,
    onSuccess: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode pre-populated with a Critical CPU alert. Heading reads "Edit Alert Rule" and submit reads "Update Rule".',
      },
    },
  },
};

/**
 * VPN tunnel rule — warning severity with two conditions.
 */
export const VpnTunnelRule: Story = {
  args: {
    initialData: vpnAlertData,
    onSuccess: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Create mode pre-filled with a VPN tunnel alert featuring two conditions and Warning severity.',
      },
    },
  },
};

/**
 * Multi-channel alert — Critical alert delivering across 3 notification channels.
 */
export const MultipleChannels: Story = {
  args: {
    initialData: multiChannelAlertData,
    onSuccess: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the channel selection UI with three channels checked: In-App, Email, and Webhook.',
      },
    },
  },
};

/**
 * Without cancel button — used in contexts where cancellation is handled externally.
 */
export const NoCancelButton: Story = {
  args: {
    initialData: cpuAlertData,
    onSuccess: fn(),
    // onCancel intentionally omitted
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no onCancel handler is provided the Cancel button is hidden, leaving only the submit action.',
      },
    },
  },
};

/**
 * Info severity — lower urgency alert for informational notifications.
 */
export const InfoSeverity: Story = {
  args: {
    initialData: {
      name: 'DHCP Lease Renewal',
      description: 'Informational alert for DHCP lease events.',
      eventType: 'dhcp.lease.renewed',
      severity: 'INFO',
      conditions: [{ field: 'lease_count', operator: 'GREATER_THAN', value: '50' }],
      channels: ['inapp'],
      enabled: true,
    },
    onSuccess: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with Info severity selected — the mildest alert level.',
      },
    },
  },
};
