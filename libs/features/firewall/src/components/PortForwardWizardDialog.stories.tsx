/**
 * Storybook stories for PortForwardWizardDialog
 *
 * Demonstrates the 3-step wizard: External Settings → Internal Settings → Review & Confirm,
 * with SafetyConfirmation on the final step before the rule is created.
 */

import { useState } from 'react';

import { Button } from '@nasnet/ui/primitives';

import { PortForwardWizardDialog } from './PortForwardWizardDialog';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Wrapper for open/close control
// ============================================================================

function DialogWrapper(props: React.ComponentProps<typeof PortForwardWizardDialog>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-center p-8">
      <Button onClick={() => setOpen(true)}>Open Port Forward Wizard</Button>
      <PortForwardWizardDialog {...props} open={open} onOpenChange={setOpen} />
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof PortForwardWizardDialog> = {
  title: 'Features/Firewall/PortForwardWizardDialog',
  component: PortForwardWizardDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Three-step wizard dialog for creating a port-forwarding (DNAT) rule on a MikroTik router. ' +
          'Step 1 captures the external protocol, port, and WAN interface. ' +
          'Step 2 captures the internal IP and destination port. ' +
          'Step 3 presents a review summary and triggers a SafetyConfirmation before committing the change.',
      },
    },
  },
  // Use the wrapper so stories have their own open/close state
  render: (args) => <DialogWrapper {...args} />,
  argTypes: {
    open: { control: false },
    onOpenChange: { action: 'onOpenChange' },
    onSuccess: { action: 'onSuccess' },
    routerIp: { control: 'text' },
    wanInterfaces: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof PortForwardWizardDialog>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['ether1', 'ether2'],
    onSuccess: () => console.info('Port forward created successfully'),
  },
};

export const SingleWanInterface: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['ether1'],
    onSuccess: () => console.info('Port forward created successfully'),
  },
  parameters: {
    docs: {
      description: {
        story: 'When only one WAN interface is available it is pre-selected and the dropdown has a single option.',
      },
    },
  },
};

export const ManyWanInterfaces: Story = {
  args: {
    routerIp: '10.0.0.1',
    wanInterfaces: ['ether1', 'ether2', 'ether3', 'sfp-sfpplus1', 'vlan100', 'pppoe-out1'],
    onSuccess: () => console.info('Port forward created successfully'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the interface dropdown with a larger set of WAN interfaces including PPPoE and VLAN types.',
      },
    },
  },
};

export const DifferentRouterIp: Story = {
  args: {
    routerIp: '172.16.0.1',
    wanInterfaces: ['ether1', 'pppoe-out1'],
    onSuccess: () => console.info('Port forward created successfully'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Same wizard with a different router IP, showing the router IP is passed through to the mutation hook.',
      },
    },
  },
};

export const WithSuccessCallback: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['ether1', 'ether2'],
    onSuccess: () => {
      console.info('onSuccess fired — parent should refresh the NAT rule list');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `onSuccess` callback is invoked after SafetyConfirmation is accepted and the mutation completes. ' +
          'Typically used to refresh the parent NAT rules table.',
      },
    },
  },
};
