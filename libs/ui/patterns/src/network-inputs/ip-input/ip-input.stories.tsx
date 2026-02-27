/**
 * IPInput Storybook Stories
 *
 * Comprehensive stories demonstrating the IP address input component
 * across different states, configurations, and platforms.
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

import { useState } from 'react';

import { IPInput } from './ip-input';
import { IPInputDesktop } from './ip-input-desktop';
import { IPInputMobile } from './ip-input-mobile';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof IPInput> = {
  title: 'Patterns/Network Inputs/IPInput',
  component: IPInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A specialized input component for entering IPv4/IPv6 addresses with:
- Segmented input with auto-advance (desktop)
- Smart parsing single input (mobile)
- Visual validation feedback
- IP type classification (Private, Public, Loopback, etc.)
- CIDR suffix support
- Full keyboard navigation
- WCAG AAA accessibility compliance

## Usage

\`\`\`tsx
import { IPInput } from '@nasnet/ui/patterns';

// Basic usage
<IPInput value={ip} onChange={setIp} />

// With type badge and CIDR support
<IPInput
  value={ip}
  onChange={setIp}
  showType
  allowCIDR
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Current IP address value',
    },
    version: {
      control: 'select',
      options: ['v4', 'v6', 'both'],
      description: 'IP version to accept',
    },
    showType: {
      control: 'boolean',
      description: 'Show IP type classification badge',
    },
    allowCIDR: {
      control: 'boolean',
      description: 'Allow CIDR notation',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    error: {
      control: 'text',
      description: 'External error message',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IPInput>;

// ============================================================================
// Interactive Wrapper for Controlled Stories
// ============================================================================

function ControlledIPInput(props: React.ComponentProps<typeof IPInput>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <div className="space-y-4">
      <IPInput
        {...props}
        value={value}
        onChange={setValue}
      />
      <div className="text-muted-foreground text-sm">
        Current value: <code className="font-mono">{value || '(empty)'}</code>
      </div>
    </div>
  );
}

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default empty IP input.
 */
export const Default: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {},
};

/**
 * Pre-filled with a valid IPv4 address.
 */
export const WithValidIPv4: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '192.168.1.1',
  },
};

/**
 * Private IP address with type badge displayed.
 */
export const PrivateIPWithType: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '10.0.0.1',
    showType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the "Private" badge for RFC 1918 private addresses.',
      },
    },
  },
};

/**
 * Public IP address with type badge displayed.
 */
export const PublicIPWithType: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '8.8.8.8',
    showType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the "Public" badge for routable internet addresses.',
      },
    },
  },
};

/**
 * Loopback address with type badge.
 */
export const LoopbackIP: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '127.0.0.1',
    showType: true,
  },
};

/**
 * Link-local address with type badge.
 */
export const LinkLocalIP: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '169.254.1.1',
    showType: true,
  },
};

/**
 * Multicast address with type badge.
 */
export const MulticastIP: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '224.0.0.1',
    showType: true,
  },
};

// ============================================================================
// CIDR Stories
// ============================================================================

/**
 * IP with CIDR suffix support enabled.
 */
export const WithCIDRSuffix: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '192.168.1.0/24',
    allowCIDR: true,
    showType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Enables an additional input for the CIDR prefix length (0-32 for IPv4).',
      },
    },
  },
};

/**
 * Empty CIDR input for entering subnet.
 */
export const EmptyCIDR: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    allowCIDR: true,
    placeholder: '192.168.1.0',
  },
};

// ============================================================================
// State Stories
// ============================================================================

/**
 * IP input with an external error message.
 */
export const ErrorState: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '256.1.1.1',
    error: 'Invalid IP address: octet exceeds 255',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error styling and message for invalid input.',
      },
    },
  },
};

/**
 * Disabled IP input.
 */
export const Disabled: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    value: '192.168.1.1',
    disabled: true,
  },
};

/**
 * Required field indicator.
 */
export const Required: Story = {
  render: (args) => <ControlledIPInput {...args} />,
  args: {
    required: true,
    placeholder: '0.0.0.0',
  },
};

// ============================================================================
// Platform-Specific Controlled Wrappers
// ============================================================================

function ControlledDesktopIPInput(props: React.ComponentProps<typeof IPInputDesktop>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <div className="space-y-4">
      <IPInputDesktop
        {...props}
        value={value}
        onChange={setValue}
      />
      <div className="text-muted-foreground text-sm">
        Current value: <code className="font-mono">{value || '(empty)'}</code>
      </div>
    </div>
  );
}

function ControlledMobileIPInput(props: React.ComponentProps<typeof IPInputMobile>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <div className="w-80 space-y-4">
      <IPInputMobile
        {...props}
        value={value}
        onChange={setValue}
      />
      <div className="text-muted-foreground text-sm">
        Current value: <code className="font-mono">{value || '(empty)'}</code>
      </div>
    </div>
  );
}

// ============================================================================
// Platform-Specific Stories
// ============================================================================

/**
 * Desktop presenter directly (4-segment input).
 */
export const DesktopPresenter: Story = {
  render: (args) => <ControlledDesktopIPInput {...args} />,
  args: {
    showType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop presenter with 4-segment input and auto-advance.',
      },
    },
  },
};

/**
 * Mobile presenter directly (single input with 44px touch target).
 */
export const MobilePresenter: Story = {
  render: (args) => <ControlledMobileIPInput {...args} />,

  args: {
    showType: true,
    placeholder: '192.168.1.1',
  },

  parameters: {
    docs: {
      description: {
        story: 'Mobile presenter with single input, smart parsing, and 44px touch targets.',
      },
    },
  },

  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false,
    },
  },
};

// ============================================================================
// Accessibility Story
// ============================================================================

/**
 * Accessibility test story with a11y addon enabled.
 */
export const Accessibility: Story = {
  render: (args) => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Desktop (4-segment)</h3>
        <IPInputDesktop {...args} />
      </div>
      <div className="w-80">
        <h3 className="mb-2 text-lg font-semibold">Mobile (single input)</h3>
        <IPInputMobile {...args} />
      </div>
    </div>
  ),
  args: {
    value: '192.168.1.1',
    showType: true,
    'aria-describedby': 'ip-help-text',
  },
  parameters: {
    a11y: {
      // Enable axe-core accessibility testing
      config: {
        rules: [
          // Ensure all rules are enabled
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        story: `
Accessibility features:
- All segment inputs have proper ARIA labels ("IP address octet 1 of 4")
- Validation errors use \`aria-invalid\` and \`role="alert"\`
- Focus indicators are visible (3px ring)
- Keyboard navigation works between segments
- Touch targets are 44px minimum on mobile
        `,
      },
    },
  },
};

// ============================================================================
// All IP Types Story
// ============================================================================

/**
 * All IP type classifications displayed.
 */
export const AllIPTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm">Private:</span>
        <IPInputDesktop
          value="192.168.1.1"
          showType
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm">Public:</span>
        <IPInputDesktop
          value="8.8.8.8"
          showType
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm">Loopback:</span>
        <IPInputDesktop
          value="127.0.0.1"
          showType
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm">Link-local:</span>
        <IPInputDesktop
          value="169.254.1.1"
          showType
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm">Multicast:</span>
        <IPInputDesktop
          value="224.0.0.1"
          showType
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm">Broadcast:</span>
        <IPInputDesktop
          value="255.255.255.255"
          showType
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all IP type classifications with their badges.',
      },
    },
  },
};
