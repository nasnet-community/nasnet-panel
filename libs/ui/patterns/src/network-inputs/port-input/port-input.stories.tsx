/**
 * Port Input Component Stories
 *
 * Storybook stories demonstrating all modes and features of the PortInput component.
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */

import { useState } from 'react';

import { PortInput } from './port-input';
import { PortInputDesktop } from './port-input-desktop';
import { PortInputMobile } from './port-input-mobile';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PortInput> = {
  title: 'Patterns/Network Inputs/PortInput',
  component: PortInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A specialized input component for entering port numbers with validation,
service name lookup, and suggestions.

## Features

- **Single Port Mode**: Validates port range (1-65535), shows service name for well-known ports
- **Range Mode**: Two inputs for start/end ports with validation (start ≤ end)
- **Multi Mode**: Tag-style chips for multiple ports with deduplication
- **Service Lookup**: Displays service name for ~100 well-known ports
- **Suggestions**: Dropdown with common ports grouped by category
- **Platform Responsive**: Mobile (44px touch targets) and desktop layouts
- **Accessibility**: Full WCAG AAA compliance with ARIA labels and keyboard navigation

## Usage

\`\`\`tsx
import { PortInput } from '@nasnet/ui/patterns';

// Single port
<PortInput value={port} onChange={setPort} showService />

// Port range for firewall rules
<PortInput mode="range" value="8080-8090" onChange={setRange} />

// Multiple ports with suggestions
<PortInput mode="multi" showSuggestions />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'range', 'multi'],
      description: 'Input mode for different use cases',
    },
    protocol: {
      control: 'select',
      options: ['tcp', 'udp', 'both'],
      description: 'Protocol context for service lookup',
    },
    showService: {
      control: 'boolean',
      description: 'Show service name for well-known ports',
    },
    showSuggestions: {
      control: 'boolean',
      description: 'Show suggestions dropdown on focus',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    label: {
      control: 'text',
      description: 'Input label',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    helpText: {
      control: 'text',
      description: 'Help text below input',
    },
    error: {
      control: 'text',
      description: 'External error message',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PortInput>;

// ============================================================================
// Interactive Wrapper for Controlled State
// ============================================================================

function PortInputInteractive(props: React.ComponentProps<typeof PortInput>) {
  const [value, setValue] = useState<number | string | null>(props.value ?? null);

  return (
    <div className="w-80">
      <PortInput
        {...props}
        value={value ?? undefined}
        onChange={(v) => setValue(v)}
      />
      <div className="mt-4 p-2 bg-muted rounded text-sm font-mono">
        Value: {JSON.stringify(value)}
      </div>
    </div>
  );
}

// ============================================================================
// Single Mode Stories
// ============================================================================

/**
 * Default single port input with empty state.
 */
export const Default: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Port',
    placeholder: 'Enter port (1-65535)',
    showService: true,
  },
};

/**
 * Single port with a valid well-known port showing service name.
 */
export const WithValidPort: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Port',
    value: 443,
    showService: true,
  },
};

/**
 * Shows service name for well-known ports.
 */
export const ServiceLookup: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <PortInputInteractive label="HTTP" value={80} showService />
      <PortInputInteractive label="HTTPS" value={443} showService />
      <PortInputInteractive label="SSH" value={22} showService />
      <PortInputInteractive label="MySQL" value={3306} showService />
      <PortInputInteractive label="WireGuard" value={51820} showService protocol="udp" />
      <PortInputInteractive label="Winbox" value={8291} showService />
    </div>
  ),
};

/**
 * Invalid port number showing error state.
 */
export const ErrorState: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <PortInputInteractive
        label="Too Large"
        value={70000 as unknown as number}
        showService
      />
      <PortInputInteractive
        label="With External Error"
        value={8080}
        error="Port 8080 is already in use"
      />
    </div>
  ),
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Port',
    value: 443,
    showService: true,
    disabled: true,
  },
};

// ============================================================================
// Range Mode Stories
// ============================================================================

/**
 * Port range mode for specifying start and end ports.
 */
export const RangeMode: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Port Range',
    mode: 'range',
    protocol: 'tcp',
    helpText: 'Specify a range of ports for firewall rules',
  },
};

/**
 * Range mode with a valid port range.
 */
export const RangeWithValue: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Port Range',
    mode: 'range',
    value: '8080-8090',
    protocol: 'tcp',
  },
};

/**
 * Range mode with validation error (start > end).
 */
export const RangeError: Story = {
  render: () => (
    <div className="w-80">
      <PortInput
        label="Invalid Range"
        mode="range"
        value="9000-8000"
        protocol="tcp"
        helpText="Start port must be <= end port"
      />
    </div>
  ),
};

// ============================================================================
// Multi Mode Stories
// ============================================================================

/**
 * Multi-port mode with tag-style chips.
 */
export const MultiMode: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Ports',
    mode: 'multi',
    protocol: 'tcp',
    helpText: 'Enter ports and press Enter to add',
  },
};

/**
 * Multi-port mode with existing ports.
 */
export const MultiWithPorts: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Allowed Ports',
    mode: 'multi',
    value: '80,443,8080',
    protocol: 'tcp',
  },
};

// ============================================================================
// Suggestions Stories
// ============================================================================

/**
 * Port input with suggestions dropdown enabled.
 */
export const WithSuggestions: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Port',
    showService: true,
    showSuggestions: true,
    helpText: 'Click or focus to see suggestions',
  },
};

/**
 * Multi-mode with suggestions for quick port selection.
 */
export const MultiWithSuggestions: Story = {
  render: (args) => <PortInputInteractive {...args} />,
  args: {
    label: 'Ports',
    mode: 'multi',
    showSuggestions: true,
    helpText: 'Select from suggestions or type custom ports',
  },
};

// ============================================================================
// Protocol Variants
// ============================================================================

/**
 * Different protocol badges.
 */
export const ProtocolVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <PortInputInteractive label="TCP Port" value={443} protocol="tcp" showService />
      <PortInputInteractive label="UDP Port" value={51820} protocol="udp" showService />
      <PortInputInteractive label="Any Protocol" value={53} protocol="both" showService />
    </div>
  ),
};

// ============================================================================
// MikroTik Specific
// ============================================================================

/**
 * Common MikroTik management ports.
 */
export const MikroTikPorts: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <PortInputInteractive label="Winbox" value={8291} showService />
      <PortInputInteractive label="RouterOS API" value={8728} showService />
      <PortInputInteractive label="RouterOS API SSL" value={8729} showService />
      <PortInputInteractive label="Bandwidth Test" value={2000} showService />
    </div>
  ),
};

// ============================================================================
// Platform-Specific Stories
// ============================================================================

/**
 * Desktop presenter directly.
 */
export const DesktopVariant: Story = {
  render: (args) => (
    <div className="w-96">
      <PortInputDesktop {...args} />
    </div>
  ),
  args: {
    label: 'Desktop Port Input',
    value: 443,
    showService: true,
    showSuggestions: true,
  },
};

/**
 * Mobile presenter in a narrow viewport.
 */
export const MobileVariant: Story = {
  render: (args) => (
    <div className="w-80 p-4 bg-background border rounded-lg">
      <PortInputMobile {...args} />
    </div>
  ),
  args: {
    label: 'Mobile Port Input',
    value: 443,
    showService: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile range mode with stacked inputs.
 */
export const MobileRangeMode: Story = {
  render: (args) => (
    <div className="w-80 p-4 bg-background border rounded-lg">
      <PortInputMobile {...args} />
    </div>
  ),
  args: {
    label: 'Port Range',
    mode: 'range',
    value: '8080-8090',
    protocol: 'tcp',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile multi-port mode with add button.
 */
export const MobileMultiMode: Story = {
  render: (args) => (
    <div className="w-80 p-4 bg-background border rounded-lg">
      <PortInputMobile {...args} />
    </div>
  ),
  args: {
    label: 'Ports',
    mode: 'multi',
    value: '80,443,8080',
    protocol: 'tcp',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

/**
 * Edge case: Minimum and maximum valid ports.
 */
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <PortInputInteractive label="Minimum (1)" value={1} showService />
      <PortInputInteractive label="Maximum (65535)" value={65535} showService />
      <PortInputInteractive
        label="Single Port Range"
        mode="range"
        value="8080-8080"
      />
    </div>
  ),
};

/**
 * All three modes side by side for comparison.
 */
export const AllModes: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 w-full max-w-3xl">
      <div className="space-y-2">
        <h3 className="font-medium">Single Mode</h3>
        <PortInputInteractive
          label="Destination Port"
          value={443}
          showService
          protocol="tcp"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Range Mode</h3>
        <PortInputInteractive
          label="Port Range"
          mode="range"
          value="8080-8090"
          protocol="tcp"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Multi Mode</h3>
        <PortInputInteractive
          label="Allowed Ports"
          mode="multi"
          value="80,443,8080,8443"
          protocol="tcp"
        />
      </div>
    </div>
  ),
};
