/**
 * MangleRuleEditor Storybook Stories
 *
 * Interactive stories for mangle rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MangleRuleEditor } from './MangleRuleEditor';
import type { MangleRuleEditorProps } from './mangle-rule-editor.types';

/**
 * MangleRuleEditor - Mangle rule creation and editing dialog
 *
 * The MangleRuleEditor component provides a comprehensive form for creating and editing
 * MikroTik mangle rules. It automatically adapts to platform (mobile/tablet/desktop)
 * and shows/hides fields based on the selected action type.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live preview**: Human-readable rule description updates as you type
 * - **Mark name validation**: Enforces alphanumeric/underscore/hyphen, max 63 chars
 * - **DSCP selector**: QoS class descriptions for change-dscp action
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **mark-connection**: Mark all packets in a connection (for QoS queue trees)
 * - **mark-packet**: Mark individual packets (for per-packet queuing)
 * - **mark-routing**: Mark for routing decisions (policy routing, multi-WAN)
 * - **change-dscp**: Set DSCP QoS priority (VoIP, video, etc.)
 * - **change-ttl**: Modify Time To Live
 * - **change-mss**: Clamp Maximum Segment Size
 * - **jump**: Jump to another chain
 * - **log**: Log packet with prefix
 * - **accept**: Accept packet (terminal)
 * - **drop**: Drop packet (terminal)
 *
 * ## Usage
 *
 * ```tsx
 * import { MangleRuleEditor } from '@nasnet/ui/patterns/mangle-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <MangleRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createMangleRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/MangleRuleEditor',
  component: MangleRuleEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Mangle rule creation and editing dialog with action-specific fields and live preview.',
      },
    },
    // Enable accessibility testing
    a11y: {
      config: {
        rules: [
          {
            // Disable color contrast check for specific elements if needed
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
} satisfies Meta<typeof MangleRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Create Mark Connection Rule
 *
 * Mark all packets in a connection for QoS queue trees.
 * Useful for: Traffic shaping, bandwidth management, prioritization.
 */
export const CreateMarkConnection: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'prerouting',
      action: 'mark-connection',
      newConnectionMark: 'web_traffic',
      protocol: 'tcp',
      dstPort: '80,443',
      connectionState: ['new'],
      passthrough: true,
      comment: 'Mark HTTP/HTTPS traffic',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a new mark-connection rule. All packets in the connection will inherit this mark.',
      },
    },
  },
};

/**
 * Create Mark Packet Rule
 *
 * Mark individual packets for per-packet queue assignment.
 * Useful for: Per-packet traffic shaping, advanced QoS.
 */
export const CreateMarkPacket: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'forward',
      action: 'mark-packet',
      newPacketMark: 'voip_packets',
      protocol: 'udp',
      dstPort: '5060-5061',
      connectionMark: 'voip_traffic',
      passthrough: false,
      comment: 'Mark VoIP RTP packets',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a mark-packet rule. Each packet is marked individually, useful for granular QoS.',
      },
    },
  },
};

/**
 * Create Mark Routing Rule
 *
 * Mark packets for policy-based routing decisions.
 * Useful for: Multi-WAN failover, VRF, policy routing.
 */
export const CreateMarkRouting: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'prerouting',
      action: 'mark-routing',
      newRoutingMark: 'wan2_route',
      srcAddress: '192.168.1.0/24',
      passthrough: true,
      comment: 'Route specific subnet through WAN2',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a mark-routing rule for policy-based routing. Useful for multi-WAN and VRF scenarios.',
      },
    },
  },
};

/**
 * Create Change DSCP Rule
 *
 * Set DSCP (Differentiated Services Code Point) for QoS prioritization.
 * Shows DSCP selector with standard QoS classes (EF, AF, CS).
 */
export const CreateChangeDscp: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'prerouting',
      action: 'change-dscp',
      newDscp: 46, // EF (Expedited Forwarding) - VoIP priority
      protocol: 'udp',
      dstPort: '5060-5061',
      comment: 'Set EF class for VoIP signaling',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Create a change-dscp rule. DSCP selector shows standard QoS classes with descriptions (EF for VoIP, AF for video, etc.).',
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
      id: '*5',
      position: 4,
      chain: 'forward',
      action: 'mark-connection',
      newConnectionMark: 'gaming_traffic',
      protocol: 'tcp',
      dstPort: '27015-27030',
      connectionState: ['new'],
      passthrough: true,
      disabled: false,
      comment: 'Mark Steam gaming traffic',
      packets: 15420,
      bytes: 8234567,
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
 * Invalid mark name (contains spaces and special characters).
 */
export const WithErrors: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'prerouting',
      action: 'mark-connection',
      newConnectionMark: 'invalid mark!', // Contains space and special char
      protocol: 'tcp',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with validation errors. Invalid mark name shows inline error message. Save button is disabled.',
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
      chain: 'prerouting',
      action: 'mark-connection',
      newConnectionMark: 'mobile_test',
      protocol: 'tcp',
      dstPort: '80,443',
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
      // Mock usePlatform to return 'mobile'
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
      action: 'change-dscp',
      newDscp: 46,
      protocol: 'udp',
      srcAddress: '192.168.1.0/24',
      dstPort: '5060',
      comment: 'VoIP QoS prioritization',
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
      chain: 'prerouting',
      action: 'mark-connection',
      newConnectionMark: 'test_mark',
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
      action: 'mark-connection',
      newConnectionMark: 'complex_rule',
      protocol: 'tcp',
      srcAddress: '192.168.1.0/24',
      dstAddress: '10.0.0.0/8',
      srcPort: '1024-65535',
      dstPort: '80,443,8080',
      connectionState: ['new', 'established'],
      inInterface: 'ether1',
      outInterface: 'ether2',
      passthrough: true,
      disabled: false,
      log: true,
      logPrefix: 'COMPLEX: ',
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
