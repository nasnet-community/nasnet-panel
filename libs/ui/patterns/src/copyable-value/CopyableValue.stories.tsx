/**
 * Storybook stories for CopyableValue component
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { CopyableValue } from './CopyableValue';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof CopyableValue> = {
  title: 'Patterns/Clipboard/CopyableValue',
  component: CopyableValue,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Displays a value with inline copy functionality. Copy icon appears on hover.

## Features
- Multiple value types: IP, MAC, hostname, API key, password, token, text
- Auto-masking for sensitive values (API keys, passwords, tokens)
- Reveal/hide toggle for masked values
- Monospace font for technical values
- Copy icon on hover (desktop) or always visible (mobile)
- Keyboard accessible

## Usage
\`\`\`tsx
import { CopyableValue } from '@nasnet/ui/patterns';

// IP address
<CopyableValue value="192.168.1.1" type="ip" />

// Masked API key
<CopyableValue value="sk_live_abc123xyz789" type="api-key" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['ip', 'mac', 'hostname', 'text', 'api-key', 'password', 'token'],
      description: 'Type of value (affects styling and masking)',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base'],
      description: 'Text size',
    },
    masked: {
      control: 'boolean',
      description: 'Whether to mask the value',
    },
    showIconOnHover: {
      control: 'boolean',
      description: 'Show copy icon only on hover',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CopyableValue>;

/**
 * IP address - standard display
 */
export const IPAddress: Story = {
  args: {
    value: '192.168.1.1',
    type: 'ip',
  },
};

/**
 * IP address with CIDR notation
 */
export const IPWithCIDR: Story = {
  args: {
    value: '192.168.1.0/24',
    type: 'ip',
  },
};

/**
 * MAC address
 */
export const MACAddress: Story = {
  args: {
    value: '00:1A:2B:3C:4D:5E',
    type: 'mac',
  },
};

/**
 * Hostname
 */
export const Hostname: Story = {
  args: {
    value: 'router.local',
    type: 'hostname',
  },
};

/**
 * Generic text
 */
export const GenericText: Story = {
  args: {
    value: 'some-config-value',
    type: 'text',
  },
};

/**
 * API Key (masked by default)
 */
export const APIKey: Story = {
  args: {
    value: 'sk_live_abc123xyz789def456',
    type: 'api-key',
  },
  parameters: {
    docs: {
      description: {
        story: 'API keys are masked by default. Click the eye icon to reveal.',
      },
    },
  },
};

/**
 * Password (masked)
 */
export const Password: Story = {
  args: {
    value: 'MySecretPassword123!',
    type: 'password',
  },
  parameters: {
    docs: {
      description: {
        story: 'Passwords are masked by default. Click the eye icon to reveal.',
      },
    },
  },
};

/**
 * Token (masked)
 */
export const Token: Story = {
  args: {
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    type: 'token',
  },
};

/**
 * Always show icons (no hover)
 */
export const AlwaysShowIcons: Story = {
  args: {
    value: '192.168.1.1',
    type: 'ip',
    showIconOnHover: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icons are always visible, not just on hover.',
      },
    },
  },
};

/**
 * Different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 w-12">XS:</span>
        <CopyableValue value="192.168.1.1" type="ip" size="xs" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 w-12">SM:</span>
        <CopyableValue value="192.168.1.1" type="ip" size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 w-12">Base:</span>
        <CopyableValue value="192.168.1.1" type="ip" size="base" />
      </div>
    </div>
  ),
};

/**
 * In table context
 */
export const InTableContext: Story = {
  render: () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 dark:border-slate-700">
          <th className="text-left py-2 px-4 font-medium text-slate-500">Device</th>
          <th className="text-left py-2 px-4 font-medium text-slate-500">IP Address</th>
          <th className="text-left py-2 px-4 font-medium text-slate-500">MAC Address</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-slate-100 dark:border-slate-800">
          <td className="py-2 px-4">Laptop</td>
          <td className="py-2 px-4">
            <CopyableValue value="192.168.1.100" type="ip" />
          </td>
          <td className="py-2 px-4">
            <CopyableValue value="00:1A:2B:3C:4D:5E" type="mac" />
          </td>
        </tr>
        <tr className="border-b border-slate-100 dark:border-slate-800">
          <td className="py-2 px-4">Phone</td>
          <td className="py-2 px-4">
            <CopyableValue value="192.168.1.101" type="ip" />
          </td>
          <td className="py-2 px-4">
            <CopyableValue value="AA:BB:CC:DD:EE:FF" type="mac" />
          </td>
        </tr>
      </tbody>
    </table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of CopyableValue used within a table.',
      },
    },
  },
};

/**
 * In detail view context
 */
export const InDetailView: Story = {
  render: () => (
    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg max-w-md">
      <h3 className="font-semibold text-slate-900 dark:text-slate-50">Router Details</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500">WAN IP</span>
          <CopyableValue value="203.0.113.45" type="ip" />
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500">LAN IP</span>
          <CopyableValue value="192.168.88.1" type="ip" />
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500">MAC</span>
          <CopyableValue value="00:1A:2B:3C:4D:5E" type="mac" />
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-slate-500">API Key</span>
          <CopyableValue value="sk_live_abc123xyz789" type="api-key" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of CopyableValue in a detail view with various value types.',
      },
    },
  },
};
