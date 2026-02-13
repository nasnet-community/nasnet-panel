/**
 * FilterRuleEditor Storybook Stories
 *
 * Interactive stories for filter rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FilterRuleEditor } from './FilterRuleEditor';
import type { FilterRuleEditorProps } from './filter-rule-editor.types';

/**
 * FilterRuleEditor - Filter rule creation and editing dialog
 *
 * The FilterRuleEditor component provides a comprehensive form for creating and editing
 * MikroTik firewall filter rules. It automatically adapts to platform (mobile/tablet/desktop)
 * and shows/hides fields based on the selected action type.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live preview**: Human-readable rule description updates as you type
 * - **IP/Port validation**: Enforces valid IP addresses (CIDR) and port ranges
 * - **Connection state selector**: Filter by established, related, new, invalid, untracked
 * - **Chain-specific constraints**: Input chain disallows outInterface, output disallows inInterface
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **accept**: Allow packet through (terminal)
 * - **drop**: Silently discard packet (terminal)
 * - **reject**: Discard and send ICMP error (terminal)
 * - **log**: Log packet and continue processing
 * - **jump**: Jump to custom chain
 * - **tarpit**: Capture and hold connection (anti-DDoS)
 * - **passthrough**: Continue to next rule
 *
 * ## Chains
 *
 * - **input**: Packets destined for the router itself
 * - **forward**: Packets passing through the router
 * - **output**: Packets originating from the router
 *
 * ## Usage
 *
 * ```tsx
 * import { FilterRuleEditor } from '@nasnet/ui/patterns/filter-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <FilterRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createFilterRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/FilterRuleEditor',
  component: FilterRuleEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Filter rule creation and editing dialog with action-specific fields and live preview.',
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
      description: 'Editor mode (create new rule or edit existing)',
    },
    isSaving: {
      control: 'boolean',
      description: 'Is save operation in progress',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Is delete operation in progress (edit mode only)',
    },
    showChainDiagram: {
      control: 'boolean',
      description: 'Show visual chain diagram in chain selector',
    },
    onClose: { action: 'closed' },
    onSave: { action: 'saved' },
    onDelete: { action: 'deleted' },
  },
  args: {
    routerId: 'router-123',
    open: true,
    onClose: fn(),
    onSave: fn(),
    isSaving: false,
    mode: 'create',
    showChainDiagram: true,
    addressLists: ['lan_networks', 'wan_networks', 'vpn_clients'],
    interfaceLists: ['WAN', 'LAN', 'DMZ'],
  },
} satisfies Meta<typeof FilterRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Create Accept Rule
 *
 * Allow SSH connections from trusted network.
 * Useful for: Remote administration, trusted access.
 */
export const CreateAcceptRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'input',
      action: 'accept',
      protocol: 'tcp',
      dstPort: '22',
      srcAddress: '192.168.1.0/24',
      connectionState: ['new'],
      comment: 'Allow SSH from LAN',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create an accept rule to allow trusted traffic. Commonly used for allowing specific services.',
      },
    },
  },
};

/**
 * Create Drop Rule
 *
 * Silently drop all traffic from blacklisted IPs.
 * Useful for: Blocking attackers, blacklist enforcement.
 */
export const CreateDropRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'forward',
      action: 'drop',
      srcAddressList: 'blacklist',
      comment: 'Drop blacklisted IPs',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a drop rule to silently discard traffic. No ICMP error is sent back to the sender.',
      },
    },
  },
};

/**
 * Create Reject Rule
 *
 * Reject telnet connections with ICMP error.
 * Useful for: Blocking insecure protocols, policy enforcement.
 */
export const CreateRejectRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'input',
      action: 'reject',
      protocol: 'tcp',
      dstPort: '23',
      comment: 'Reject telnet (insecure)',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a reject rule that discards traffic and sends an ICMP error response to the sender.',
      },
    },
  },
};

/**
 * Create Log Rule
 *
 * Log all dropped packets for security analysis.
 * Useful for: Security auditing, intrusion detection, troubleshooting.
 */
export const CreateLogRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'forward',
      action: 'log',
      log: true,
      logPrefix: 'DROPPED-',
      connectionState: ['invalid'],
      comment: 'Log invalid packets before dropping',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a log rule to record packet details in system logs. Prefix helps identify log entries.',
      },
    },
  },
};

/**
 * Create Jump Rule
 *
 * Jump to custom chain for advanced filtering.
 * Useful for: Organizing complex rulesets, reusable rule groups.
 */
export const CreateJumpRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'forward',
      action: 'jump',
      jumpTarget: 'custom-filter',
      srcAddress: '10.0.0.0/8',
      comment: 'Jump to custom filter chain for internal traffic',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a jump rule to transfer processing to a custom chain. Useful for modular firewall organization.',
      },
    },
  },
};

/**
 * Create Tarpit Rule (Anti-DDoS)
 *
 * Capture and hold malicious connection attempts.
 * Useful for: DDoS mitigation, rate limiting, slowing down attackers.
 */
export const CreateTarpitRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'input',
      action: 'tarpit',
      protocol: 'tcp',
      connectionState: ['new'],
      srcAddressList: 'suspicious_ips',
      comment: 'Tarpit suspicious connection attempts',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a tarpit rule to capture and hold connections, slowing down attackers and wasting their resources.',
      },
    },
  },
};

/**
 * Edit Existing Rule
 *
 * Edit mode with pre-populated form data.
 * Shows delete button and rule ID.
 */
export const EditExisting: Story = {
  args: {
    mode: 'edit',
    onDelete: fn(),
    initialRule: {
      id: '*7',
      order: 6,
      chain: 'input',
      action: 'accept',
      protocol: 'tcp',
      dstPort: '80,443',
      connectionState: ['established', 'related'],
      disabled: false,
      comment: 'Allow established HTTP/HTTPS',
      packets: 524288,
      bytes: 734003200,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit an existing rule. Form is pre-populated with current values. Delete button is available.',
      },
    },
  },
};

/**
 * With Validation Errors
 *
 * Shows form validation feedback for invalid inputs.
 * Missing required log prefix for log action.
 */
export const WithErrors: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'input',
      action: 'log',
      log: true,
      // Missing logPrefix - validation error
      protocol: 'tcp',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with validation errors. Missing log prefix shows inline error message. Save button is disabled.',
      },
    },
  },
};

/**
 * Mobile Variant
 *
 * Forces mobile presenter (Sheet instead of Dialog).
 * Card-based form sections, 44px touch targets, bottom action buttons.
 */
export const MobileVariant: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'input',
      action: 'accept',
      protocol: 'tcp',
      dstPort: '22',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile presenter with Sheet UI. Optimized for touch: 44px targets, card sections, bottom buttons.',
      },
    },
  },
  decorators: [
    (Story) => {
      const originalModule = require('@nasnet/ui/layouts');
      const mockedModule = {
        ...originalModule,
        usePlatform: () => 'mobile',
      };
      require.cache[require.resolve('@nasnet/ui/layouts')].exports = mockedModule;

      return <Story />;
    },
  ],
};

/**
 * Desktop Variant
 *
 * Forces desktop presenter (Dialog).
 * Inline form layout, live preview panel, dense data entry.
 */
export const DesktopVariant: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'forward',
      action: 'drop',
      protocol: 'tcp',
      srcAddress: '0.0.0.0/0',
      dstPort: '445',
      comment: 'Block SMB from WAN',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop presenter with Dialog UI. Optimized for keyboard: inline layout, live preview, dense form.',
      },
    },
  },
};

/**
 * Saving State
 *
 * Shows loading state when save operation is in progress.
 * Save button is disabled and shows loading spinner.
 */
export const SavingState: Story = {
  args: {
    mode: 'create',
    isSaving: true,
    initialRule: {
      chain: 'input',
      action: 'accept',
      protocol: 'tcp',
      dstPort: '22',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Save operation in progress. Button shows loading state and is disabled.',
      },
    },
  },
};

/**
 * Deleting State
 *
 * Shows loading state when delete operation is in progress.
 * Delete button is disabled and shows loading spinner.
 */
export const DeletingState: Story = {
  args: {
    mode: 'edit',
    isDeleting: true,
    onDelete: fn(),
    initialRule: {
      id: '*3',
      chain: 'forward',
      action: 'drop',
      protocol: 'tcp',
      comment: 'Block unwanted traffic',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete operation in progress. Delete button shows loading state and is disabled.',
      },
    },
  },
};

/**
 * Complex Rule with All Matchers
 *
 * Shows a rule with many matchers configured.
 * Demonstrates comprehensive matching capabilities.
 */
export const ComplexRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'forward',
      action: 'accept',
      protocol: 'tcp',
      srcAddress: '192.168.1.0/24',
      dstAddress: '10.0.0.0/8',
      srcPort: '1024-65535',
      dstPort: '80,443,8080',
      connectionState: ['established', 'related'],
      inInterface: 'ether1',
      outInterface: 'ether2',
      disabled: false,
      log: true,
      logPrefix: 'COMPLEX-',
      comment: 'Complex rule with multiple matchers for demonstration',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex rule with many matchers. Preview shows human-readable description of all conditions.',
      },
    },
  },
};

/**
 * Chain-Specific Constraint: Input Chain
 *
 * Input chain disallows outInterface (no routing decision yet).
 * Only inInterface is allowed.
 */
export const InputChainConstraint: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'input',
      action: 'accept',
      protocol: 'tcp',
      dstPort: '22',
      inInterface: 'ether1',
      comment: 'Input chain can only use inInterface',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Input chain rules can only use inInterface (not outInterface) because routing decision hasn\'t been made yet.',
      },
    },
  },
};

/**
 * Chain-Specific Constraint: Output Chain
 *
 * Output chain disallows inInterface (packets originate from router).
 * Only outInterface is allowed.
 */
export const OutputChainConstraint: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'output',
      action: 'accept',
      protocol: 'tcp',
      dstPort: '53',
      outInterface: 'ether1',
      comment: 'Output chain can only use outInterface',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Output chain rules can only use outInterface (not inInterface) because packets originate from the router.',
      },
    },
  },
};
