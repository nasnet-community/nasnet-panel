/**
 * NAT Rule Builder Storybook Stories
 *
 * Visual regression testing and documentation for NAT rule builder component.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from '@storybook/addon-actions';

import { NATRuleBuilder } from './NATRuleBuilder';
import type { NATRuleBuilderProps } from './nat-rule-builder.types';
import type { NATRuleInput } from '@nasnet/core/types/firewall';

// Mock data
const mockInterfaces = ['ether1', 'ether2', 'bridge1', 'wlan1'];
const mockInterfaceLists = ['WAN', 'LAN', 'Guest'];
const mockAddressLists = ['trusted-ips', 'blocked-ips', 'vpn-clients'];

const meta: Meta<typeof NATRuleBuilder> = {
  title: 'Patterns/Security/NAT Rule Builder',
  component: NATRuleBuilder,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
NAT Rule Builder - Pattern component for creating and editing NAT rules.

**Features:**
- Headless + Platform Presenters architecture
- Action-specific field visibility
- Real-time CLI preview
- React Hook Form with Zod validation
- WCAG AAA accessibility (44px touch targets on mobile)

**Platform Presenters:**
- **Desktop/Tablet:** Dialog with inline form and preview panel
- **Mobile:** Sheet with collapsible sections and 44px touch targets
        `,
      },
    },
  },
  argTypes: {
    routerId: { control: 'text' },
    open: { control: 'boolean' },
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
    },
    isSaving: { control: 'boolean' },
    isDeleting: { control: 'boolean' },
    showChainDiagram: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof NATRuleBuilder>;

// ============================================================================
// Wrapper Component for Interactive Stories
// ============================================================================

function InteractiveWrapper(props: Omit<NATRuleBuilderProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full min-h-[600px]">
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Open NAT Rule Builder
      </button>
      <NATRuleBuilder {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Story 1: Create Masquerade Rule (Most Common)
 */
export const CreateMasquerade: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'create',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
    initialRule: {
      chain: 'srcnat',
      action: 'masquerade',
      outInterface: 'ether1',
      comment: 'Default masquerade rule',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Creating a masquerade rule for outgoing traffic (most common NAT use case).',
      },
    },
  },
};

/**
 * Story 2: Create Port Forward (dst-nat)
 */
export const CreatePortForward: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'create',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
    initialRule: {
      chain: 'dstnat',
      action: 'dst-nat',
      protocol: 'tcp',
      dstPort: '80',
      toAddresses: '192.168.1.100',
      toPorts: '8080',
      inInterface: 'ether1',
      comment: 'Forward HTTP to internal web server',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Port forwarding incoming traffic to an internal server (dst-nat).',
      },
    },
  },
};

/**
 * Story 3: Edit Existing Rule
 */
export const EditExistingRule: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'edit',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async () => {
      action('onDelete')();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
    initialRule: {
      id: 'nat-rule-1',
      chain: 'srcnat',
      action: 'src-nat',
      srcAddress: '192.168.10.0/24',
      toAddresses: '10.0.0.1',
      outInterface: 'ether2',
      comment: 'Source NAT for guest network',
      disabled: false,
      log: true,
      logPrefix: 'GUEST-NAT:',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Editing an existing NAT rule with delete option.',
      },
    },
  },
};

/**
 * Story 4: Redirect to Router
 */
export const CreateRedirect: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'create',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
    initialRule: {
      chain: 'dstnat',
      action: 'redirect',
      protocol: 'tcp',
      dstPort: '80',
      toPorts: '8080',
      comment: 'Redirect HTTP to captive portal',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Creating a redirect rule to send traffic to the router itself.',
      },
    },
  },
};

/**
 * Story 5: 1:1 NAT (netmap)
 */
export const CreateNetmap: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'create',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
    initialRule: {
      chain: 'srcnat',
      action: 'netmap',
      srcAddress: '192.168.1.0/24',
      toAddresses: '10.0.0.0/24',
      outInterface: 'ether1',
      comment: '1:1 NAT mapping',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Creating a 1:1 NAT mapping (netmap) for entire subnet.',
      },
    },
  },
};

/**
 * Story 6: Empty State (Create New)
 */
export const EmptyState: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'create',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with default values (srcnat + masquerade).',
      },
    },
  },
};

/**
 * Story 7: Loading States
 */
export const LoadingStates: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'edit',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    isSaving: true,
    onSave: action('onSave'),
    onDelete: action('onDelete'),
    onClose: action('onClose'),
    initialRule: {
      id: 'nat-rule-1',
      chain: 'srcnat',
      action: 'masquerade',
      outInterface: 'ether1',
      comment: 'Saving...',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state during save operation.',
      },
    },
  },
};

/**
 * Story 8: With Logging Enabled
 */
export const WithLogging: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    routerId: 'router-1',
    mode: 'create',
    interfaces: mockInterfaces,
    interfaceLists: mockInterfaceLists,
    addressLists: mockAddressLists,
    onSave: async (rule: NATRuleInput) => {
      action('onSave')(rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onClose: action('onClose'),
    initialRule: {
      chain: 'dstnat',
      action: 'dst-nat',
      protocol: 'tcp',
      dstPort: '22',
      toAddresses: '192.168.1.10',
      inInterface: 'ether1',
      log: true,
      logPrefix: 'SSH-FORWARD:',
      comment: 'SSH port forward with logging',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'NAT rule with logging enabled and custom log prefix.',
      },
    },
  },
};
