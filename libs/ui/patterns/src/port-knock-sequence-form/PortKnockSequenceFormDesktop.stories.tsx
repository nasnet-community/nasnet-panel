/**
 * PortKnockSequenceFormDesktop Stories
 *
 * Storybook stories for the Desktop platform presenter of the port knock sequence form.
 * Demonstrates two-column layout, drag-drop reordering, SSH lockout warnings,
 * and all operational states.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 * @module @nasnet/ui/patterns/port-knock-sequence-form
 */

import type { PortKnockSequenceInput } from '@nasnet/core/types';

import { PortKnockSequenceFormDesktop } from './PortKnockSequenceFormDesktop';
import { usePortKnockSequenceForm } from './use-port-knock-sequence-form';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Wrapper that wires up the headless hook before rendering the desktop presenter.
 *
 * PortKnockSequenceFormDesktop expects a pre-built `formState` from
 * `usePortKnockSequenceForm`, so we need a thin wrapper to satisfy that
 * contract in stories.
 */
function DesktopStoryWrapper({
  initialValues,
  isEditMode = false,
  isSubmitting = false,
}: {
  initialValues?: PortKnockSequenceInput;
  isEditMode?: boolean;
  isSubmitting?: boolean;
}) {
  const formState = usePortKnockSequenceForm({
    initialValues,
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    isEditMode,
  });

  return (
    <PortKnockSequenceFormDesktop
      formState={formState}
      isEditMode={isEditMode}
      isSubmitting={isSubmitting}
    />
  );
}

/**
 * PortKnockSequenceFormDesktop
 *
 * Desktop layout for configuring a port knocking sequence. Renders a two-column
 * grid: the left column contains the form (sequence name, drag-drop knock ports
 * table, protected service, and timeouts) while the right column shows a live
 * `PortKnockVisualizer` preview and the generated firewall rules.
 *
 * - **Drag and drop**: Knock ports can be reordered with pointer or keyboard
 * - **SSH lockout detection**: Shows a destructive alert when port 22 is protected
 * - **Max 8 ports**: Add button is disabled when the maximum is reached
 * - **Min 2 ports**: Remove button is disabled when only two ports remain
 */
const meta: Meta<typeof DesktopStoryWrapper> = {
  title: 'Patterns/Firewall/PortKnockSequenceFormDesktop',
  component: DesktopStoryWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Desktop platform presenter for the port knock sequence form. Two-column layout with a drag-drop table on the left and a live visualizer on the right.',
      },
    },
  },
  argTypes: {
    isEditMode: {
      control: 'boolean',
      description: 'Whether the form is pre-populated for editing an existing sequence',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether the form is currently awaiting a save response',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DesktopStoryWrapper>;

/**
 * Default - empty create form
 *
 * Empty desktop form ready for a brand-new knock sequence. The visualizer on the
 * right starts empty until the user adds at least two knock ports.
 */
export const Default: Story = {
  args: {
    isEditMode: false,
    isSubmitting: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty form for creating a new port knock sequence. The right-hand visualizer updates as ports are added.',
      },
    },
  },
};

/**
 * Edit Existing Sequence - SSH Protection
 *
 * Pre-populated form for editing an existing three-knock SSH protection sequence.
 * The SSH lockout warning is visible because the protected port is 22.
 */
export const EditSSHProtection: Story = {
  args: {
    isEditMode: true,
    isSubmitting: false,
    initialValues: {
      name: 'ssh-protection',
      knockPorts: [
        { port: 1234, protocol: 'tcp', order: 1 },
        { port: 5678, protocol: 'tcp', order: 2 },
        { port: 9012, protocol: 'udp', order: 3 },
      ],
      protectedPort: 22,
      protectedProtocol: 'tcp',
      accessTimeout: '1h',
      knockTimeout: '10s',
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode for an SSH protection sequence. The SSH lockout warning banner is displayed because port 22 is the protected service.',
      },
    },
  },
};

/**
 * RDP Protection - No Lockout Warning
 *
 * A four-knock sequence protecting Remote Desktop (port 3389).
 * No SSH lockout warning is shown because port 22 is not involved.
 */
export const RDPProtection: Story = {
  args: {
    isEditMode: false,
    isSubmitting: false,
    initialValues: {
      name: 'rdp-protection',
      knockPorts: [
        { port: 7001, protocol: 'tcp', order: 1 },
        { port: 8002, protocol: 'tcp', order: 2 },
        { port: 9003, protocol: 'udp', order: 3 },
        { port: 6004, protocol: 'tcp', order: 4 },
      ],
      protectedPort: 3389,
      protectedProtocol: 'tcp',
      accessTimeout: '2h',
      knockTimeout: '15s',
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Four-knock sequence for RDP protection. No SSH lockout warning appears. The visualizer renders all four stages.',
      },
    },
  },
};

/**
 * Maximum Knock Ports (8)
 *
 * A high-security sequence with the maximum of eight knock ports configured.
 * The Add button in the table header is disabled.
 */
export const MaximumPorts: Story = {
  args: {
    isEditMode: false,
    isSubmitting: false,
    initialValues: {
      name: 'max-security-https',
      knockPorts: [
        { port: 1111, protocol: 'tcp', order: 1 },
        { port: 2222, protocol: 'udp', order: 2 },
        { port: 3333, protocol: 'tcp', order: 3 },
        { port: 4444, protocol: 'tcp', order: 4 },
        { port: 5555, protocol: 'udp', order: 5 },
        { port: 6666, protocol: 'tcp', order: 6 },
        { port: 7777, protocol: 'tcp', order: 7 },
        { port: 8888, protocol: 'udp', order: 8 },
      ],
      protectedPort: 443,
      protectedProtocol: 'tcp',
      accessTimeout: '4h',
      knockTimeout: '20s',
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Eight-knock sequence demonstrating the maximum port limit. The Add button is disabled and the visualizer shows the full sequence chain.',
      },
    },
  },
};

/**
 * Mixed Protocols
 *
 * Demonstrates a sequence that alternates between TCP and UDP knock ports.
 * This is a common pattern for adding extra complexity to the sequence.
 */
export const MixedProtocols: Story = {
  args: {
    isEditMode: false,
    isSubmitting: false,
    initialValues: {
      name: 'mixed-protocol-vnc',
      knockPorts: [
        { port: 3001, protocol: 'tcp', order: 1 },
        { port: 4001, protocol: 'udp', order: 2 },
        { port: 5001, protocol: 'tcp', order: 3 },
        { port: 6001, protocol: 'udp', order: 4 },
      ],
      protectedPort: 5900,
      protectedProtocol: 'tcp',
      accessTimeout: '30m',
      knockTimeout: '8s',
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sequence that alternates between TCP and UDP knock ports. Mixed protocols add entropy to the knock pattern and are harder to replay.',
      },
    },
  },
};

/**
 * Submitting State
 *
 * The Save button shows a "Saving..." label and is disabled while a submission
 * is in progress. All other inputs remain interactive.
 */
export const SubmittingState: Story = {
  args: {
    isEditMode: false,
    isSubmitting: true,
    initialValues: {
      name: 'web-admin',
      knockPorts: [
        { port: 7000, protocol: 'tcp', order: 1 },
        { port: 8000, protocol: 'tcp', order: 2 },
      ],
      protectedPort: 8080,
      protectedProtocol: 'tcp',
      accessTimeout: '1h',
      knockTimeout: '10s',
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'isSubmitting=true replaces the submit button label with "Saving..." and disables it until the async operation resolves.',
      },
    },
  },
};
