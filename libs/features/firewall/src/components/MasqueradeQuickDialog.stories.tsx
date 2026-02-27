/**
 * Storybook stories for MasqueradeQuickDialog
 *
 * Demonstrates the simple one-step masquerade creation dialog:
 * WAN interface selection and optional comment, with various interface sets.
 */

import { useState } from 'react';

import { Button } from '@nasnet/ui/primitives';

import { MasqueradeQuickDialog } from './MasqueradeQuickDialog';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Wrapper for open/close control
// ============================================================================

function DialogWrapper(props: React.ComponentProps<typeof MasqueradeQuickDialog>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-center p-8">
      <Button onClick={() => setOpen(true)}>Quick Masquerade</Button>
      <MasqueradeQuickDialog
        {...props}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof MasqueradeQuickDialog> = {
  title: 'Features/Firewall/MasqueradeQuickDialog',
  component: MasqueradeQuickDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Simple one-step dialog for quickly creating a masquerade (source NAT) rule. ' +
          'The admin selects a WAN interface and optionally provides a comment. ' +
          "Masquerade translates all internal IPs to the router's WAN address for outbound traffic, " +
          'making it the standard solution for home and office internet sharing.',
      },
    },
  },
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
type Story = StoryObj<typeof MasqueradeQuickDialog>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['ether1', 'ether2'],
    onSuccess: () => console.info('Masquerade rule created'),
  },
};

export const SingleInterface: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['ether1'],
    onSuccess: () => console.info('Masquerade rule created'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When there is only one WAN interface it is pre-selected with no alternatives in the dropdown.',
      },
    },
  },
};

export const WithPppoeInterface: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['pppoe-out1', 'ether1-wan'],
    onSuccess: () => console.info('Masquerade rule created'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'PPPoE dialup interfaces are common on home routers. This story shows the dropdown pre-selecting "pppoe-out1".',
      },
    },
  },
};

export const ManyInterfaces: Story = {
  args: {
    routerIp: '10.0.0.1',
    wanInterfaces: ['ether1', 'ether2', 'sfp-sfpplus1', 'pppoe-out1', 'vlan100', 'lte1'],
    onSuccess: () => console.info('Masquerade rule created'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Larger interface list covering physical, PPPoE, VLAN, and LTE interface types.',
      },
    },
  },
};

export const WithSuccessCallback: Story = {
  args: {
    routerIp: '192.168.88.1',
    wanInterfaces: ['ether1', 'pppoe-out1'],
    onSuccess: () => {
      console.info('onSuccess fired — parent should refresh the NAT rules table');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies the `onSuccess` callback is called after the masquerade rule is created. ' +
          'The parent component typically uses this to re-query the NAT rules list.',
      },
    },
  },
};

export const AlternateRouter: Story = {
  args: {
    routerIp: '172.16.0.1',
    wanInterfaces: ['ether1', 'ether2'],
    onSuccess: () => console.info('Masquerade rule created on alternate router'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the dialog connected to a router at a different IP address.',
      },
    },
  },
};
