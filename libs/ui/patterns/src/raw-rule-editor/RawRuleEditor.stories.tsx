/**
 * RawRuleEditor Storybook Stories
 *
 * Interactive stories for RAW rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */

import type { Meta, StoryObj } from '@storybook/react';

import { fn } from 'storybook/test';

import { RawRuleEditor } from './RawRuleEditor';

/**
 * RawRuleEditor - RAW rule creation and editing dialog
 *
 * The RawRuleEditor component provides a comprehensive form for creating and editing
 * MikroTik RAW firewall rules. RAW rules execute BEFORE connection tracking for
 * performance optimization and early packet dropping.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live preview**: Human-readable rule description updates as you type
 * - **Performance tips**: Shows optimization hints for notrack action
 * - **IP/Port validation**: Enforces valid IP addresses (CIDR) and port ranges
 * - **Chain-specific constraints**: Prerouting allows inInterface, output allows outInterface
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **accept**: Allow packet (continue to filter rules)
 * - **drop**: Silently discard packet (terminal)
 * - **notrack**: Disable connection tracking (performance optimization)
 * - **log**: Log packet and continue processing
 * - **jump**: Jump to custom chain
 *
 * ## Chains
 *
 * - **prerouting**: Before routing decision (allows inInterface)
 * - **output**: Packets originating from router (allows outInterface)
 *
 * ## Usage
 *
 * ```tsx
 * import { RawRuleEditor } from '@nasnet/ui/patterns/raw-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <RawRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createRawRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/RawRuleEditor',
  component: RawRuleEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'RAW rule creation and editing dialog with performance tips and action-specific fields.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID for fetching address lists and interfaces',
    },
    open: {
      control: 'boolean',
      description: 'Is editor dialog open',
    },
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: 'Editor mode (create or edit)',
    },
    showPerformanceTips: {
      control: 'boolean',
      description: 'Show performance optimization tips',
    },
    isSaving: {
      control: 'boolean',
      description: 'Is save operation in progress',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Is delete operation in progress',
    },
  },
  args: {
    routerId: 'router-123',
    open: true,
    onClose: fn(),
    onSave: fn(),
    onDelete: fn(),
    showPerformanceTips: true,
  },
} satisfies Meta<typeof RawRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default create mode with notrack action.
 * Shows performance tip about bypassing connection tracking.
 */
export const Default: Story = {
  args: {
    mode: 'create',
  },
};

/**
 * Edit mode with existing rule.
 * Shows all fields populated with current rule values.
 */
export const EditMode: Story = {
  args: {
    mode: 'edit',
    initialRule: {
      id: 'rule-1',
      chain: 'prerouting',
      action: 'drop',
      protocol: 'tcp',
      srcAddress: '192.168.1.0/24',
      dstPort: '22',
      comment: 'Block SSH from LAN',
      disabled: false,
    },
  },
};

/**
 * Drop action for early packet dropping.
 * Used for DDoS mitigation and bogon filtering.
 */
export const DropAction: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'drop',
      srcAddress: '10.0.0.0/8',
      comment: 'Drop bogon traffic',
    },
  },
};

/**
 * Notrack action for performance optimization.
 * Shows performance tip explaining connection tracking bypass.
 */
export const NotrackAction: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'notrack',
      srcAddress: '192.168.1.0/24',
      dstAddress: '192.168.1.0/24',
      comment: 'Skip tracking for LAN-to-LAN traffic',
    },
  },
};

/**
 * Log action with log prefix field.
 * Shows suggested log prefixes for quick selection.
 */
export const LogAction: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'log',
      logPrefix: 'RAW-DROP-',
      srcAddress: '0.0.0.0/8',
      comment: 'Log bogon traffic before dropping',
    },
  },
};

/**
 * Jump action with custom chain target.
 * Shows jumpTarget field for chain name.
 */
export const JumpAction: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'jump',
      jumpTarget: 'custom-ddos-protection',
      protocol: 'tcp',
      comment: 'Jump to DDoS protection chain',
    },
  },
};

/**
 * Accept action to allow packet through.
 * Packet continues to filter rules for further processing.
 */
export const AcceptAction: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'accept',
      srcAddress: '192.168.1.100',
      comment: 'Allow traffic from trusted host',
    },
  },
};

/**
 * Complex rule with multiple matchers.
 * Shows protocol, addresses, ports, and interface.
 */
export const ComplexRule: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'notrack',
      protocol: 'udp',
      srcAddress: '192.168.1.0/24',
      dstAddress: '192.168.1.254',
      srcPort: '1024-65535',
      dstPort: '53',
      inInterface: 'bridge-lan',
      comment: 'Skip tracking for DNS queries from LAN',
    },
  },
};

/**
 * Saving state with disabled interactions.
 * All buttons disabled during save operation.
 */
export const SavingState: Story = {
  args: {
    isSaving: true,
    initialRule: {
      chain: 'prerouting',
      action: 'drop',
      comment: 'Test rule',
    },
  },
};

/**
 * Deleting state with disabled interactions.
 * All buttons disabled during delete operation.
 */
export const DeletingState: Story = {
  args: {
    mode: 'edit',
    isDeleting: true,
    initialRule: {
      id: 'rule-1',
      chain: 'prerouting',
      action: 'drop',
      comment: 'Test rule',
    },
  },
};

/**
 * Validation errors state.
 * Shows inline validation errors for invalid fields.
 */
export const ValidationErrors: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'log',
      // Missing required logPrefix for log action
      logPrefix: '',
      srcAddress: '999.999.999.999', // Invalid IP
      dstPort: '99999', // Invalid port
    },
  },
};

/**
 * Mobile view (Sheet presentation).
 * Card-based layout with 44px touch targets.
 */
export const MobileView: Story = {
  args: {
    initialRule: {
      chain: 'prerouting',
      action: 'notrack',
      srcAddress: '192.168.1.0/24',
      comment: 'LAN traffic optimization',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
