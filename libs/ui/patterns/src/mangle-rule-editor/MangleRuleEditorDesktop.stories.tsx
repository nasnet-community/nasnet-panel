/**
 * MangleRuleEditorDesktop Stories
 *
 * Storybook stories for the Desktop platform presenter of the MangleRuleEditor.
 * Demonstrates dialog-based form layout, action-specific field groups,
 * live preview panel, and all operational states.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */

import { fn } from '@storybook/test';

import { MangleRuleEditorDesktop } from './MangleRuleEditorDesktop';

import type { MangleRuleEditorProps } from './mangle-rule-editor.types';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * MangleRuleEditorDesktop - Dialog-based mangle rule editor for Desktop
 *
 * The desktop presenter renders a wide Dialog with an inline two-column form and
 * a live preview panel. It is optimised for keyboard navigation and dense data entry.
 *
 * ## Features
 *
 * - **Live preview**: Human-readable rule description regenerated on every keystroke
 * - **Action-specific fields**: Shows only the fields relevant to the chosen action
 * - **DSCP selector**: Annotated QoS class list for `change-dscp` action
 * - **Traffic matchers**: Protocol, connection state, src/dst address, src/dst port
 * - **Dangerous-action guard**: Delete button is only shown in edit mode
 * - **Accessibility**: WCAG AAA, full keyboard navigation, aria-busy on submit
 *
 * ## Action Types
 *
 * | Action | Extra fields |
 * |--------|-------------|
 * | `mark-connection` | newConnectionMark, passthrough |
 * | `mark-packet`     | newPacketMark, passthrough |
 * | `mark-routing`    | newRoutingMark, passthrough |
 * | `change-dscp`     | newDscp |
 * | `accept` / `drop` | (none) |
 */
const meta: Meta<typeof MangleRuleEditorDesktop> = {
  title: 'Patterns/Firewall/MangleRuleEditorDesktop',
  component: MangleRuleEditorDesktop,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Desktop platform presenter for the mangle rule editor. Renders a wide Dialog with inline form layout and live preview panel. Optimised for keyboard navigation and dense data entry.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls dialog visibility',
    },
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: 'Create a new rule or edit an existing one',
    },
    isSaving: {
      control: 'boolean',
      description: 'Shows loading state on the Save button',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Shows loading state on the Delete button (edit mode only)',
    },
    showChainDiagram: {
      control: 'boolean',
      description: 'Show the visual chain diagram in the chain selector',
    },
    onClose: { action: 'closed' },
    onSave: { action: 'saved' },
    onDelete: { action: 'deleted' },
  },
  args: {
    routerId: 'router-123',
    open: true,
    mode: 'create',
    isSaving: false,
    isDeleting: false,
    showChainDiagram: true,
    addressLists: ['lan_networks', 'wan_networks', 'vpn_clients', 'blocked_ips'],
    interfaceLists: ['WAN', 'LAN', 'DMZ', 'VPN'],
    onClose: fn(),
    onSave: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof MangleRuleEditorDesktop>;

/**
 * Default - empty create form
 *
 * Empty form ready for a new mangle rule. Chain and action selectors are unset;
 * the live preview displays a placeholder until the user makes a selection.
 */
export const Default: Story = {
  args: {
    mode: 'create',
    initialRule: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default empty form for creating a new mangle rule. No fields are pre-populated.',
      },
    },
  },
};

/**
 * Mark Connection Rule
 *
 * Pre-populated rule that marks all packets belonging to a TCP connection.
 * Shows newConnectionMark and passthrough fields specific to mark-connection action.
 */
export const MarkConnectionRule: Story = {
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
      comment: 'Mark HTTP/HTTPS traffic for QoS shaping',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'mark-connection rule with connection mark, protocol filter, and passthrough enabled. Used for queue-tree based traffic shaping.',
      },
    },
  },
};

/**
 * Mark Routing Rule
 *
 * Policy routing rule that directs a source subnet through a secondary WAN interface.
 * Shows newRoutingMark field and source address matcher.
 */
export const MarkRoutingRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'prerouting',
      action: 'mark-routing',
      newRoutingMark: 'wan2_route',
      srcAddress: '192.168.10.0/24',
      passthrough: false,
      comment: 'Route guest subnet through WAN2',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'mark-routing rule for policy-based routing. Packets from the guest VLAN are routed via WAN2. passthrough is off so the rule is terminal.',
      },
    },
  },
};

/**
 * Change DSCP Rule
 *
 * Sets the Differentiated Services Code Point for VoIP signalling traffic.
 * Shows the annotated DSCP class selector with QoS descriptions.
 */
export const ChangeDscpRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      chain: 'prerouting',
      action: 'change-dscp',
      newDscp: 46, // EF - Expedited Forwarding
      protocol: 'udp',
      dstPort: '5060-5061',
      comment: 'EF class for SIP/VoIP signalling',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'change-dscp rule showing the DSCP class selector. DSCP value 46 (EF) is selected, which prioritises VoIP traffic end-to-end.',
      },
    },
  },
};

/**
 * Edit Existing Rule
 *
 * Editor opened against an existing rule (id present). The Delete button appears
 * in the footer and all fields are pre-populated with current values.
 */
export const EditExistingRule: Story = {
  args: {
    mode: 'edit',
    onDelete: fn(),
    initialRule: {
      id: '*7',
      position: 3,
      chain: 'forward',
      action: 'mark-connection',
      newConnectionMark: 'gaming_traffic',
      protocol: 'tcp',
      dstPort: '27015-27030',
      connectionState: ['new'],
      passthrough: true,
      disabled: false,
      log: false,
      comment: 'Mark Steam gaming traffic',
      packets: 38420,
      bytes: 12345678,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode with a fully pre-populated form. The Delete button is rendered in the footer alongside the Cancel and Save buttons.',
      },
    },
  },
};

/**
 * Saving State
 *
 * The Save button shows a loading indicator and is disabled while isSaving is true.
 * The Cancel and Delete buttons are also disabled to prevent concurrent actions.
 */
export const SavingState: Story = {
  args: {
    mode: 'create',
    isSaving: true,
    initialRule: {
      chain: 'prerouting',
      action: 'mark-connection',
      newConnectionMark: 'bulk_traffic',
      protocol: 'tcp',
      passthrough: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'isSaving=true shows a spinner on the Save button and disables all footer actions. aria-busy is set on the button for screen reader support.',
      },
    },
  },
};

/**
 * Deleting State
 *
 * The Delete button shows a loading indicator. Applies only in edit mode when
 * a deletion request is in flight.
 */
export const DeletingState: Story = {
  args: {
    mode: 'edit',
    isDeleting: true,
    onDelete: fn(),
    initialRule: {
      id: '*2',
      chain: 'forward',
      action: 'drop',
      protocol: 'tcp',
      srcAddress: '10.0.0.0/8',
      comment: 'Drop inbound from RFC-1918',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'isDeleting=true locks all footer buttons and shows a spinner on the Delete button. Used while the deletion request is awaiting a response from the router.',
      },
    },
  },
};
