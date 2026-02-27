import { useState } from 'react';

import { BatchInterfaceAction } from '@nasnet/api-client/generated';
import { Button } from '@nasnet/ui/primitives';

import { BatchConfirmDialog } from './BatchConfirmDialog';

import type { Meta, StoryObj } from '@storybook/react';

const mockInterfaces = [
  {
    id: '*1',
    name: 'ether1',
    type: 'ETHERNET',
    usedBy: ['gateway'],
  },
  {
    id: '*2',
    name: 'ether2',
    type: 'ETHERNET',
    usedBy: [],
  },
  {
    id: '*3',
    name: 'bridge1',
    type: 'BRIDGE',
    usedBy: ['dhcp-server'],
  },
];

// Wrapper component for interactive stories
function BatchConfirmDialogWrapper({
  action,
  interfaces,
}: {
  action: BatchInterfaceAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interfaces: any[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-component-xl">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <BatchConfirmDialog
        open={open}
        action={action}
        interfaces={interfaces}
        onConfirm={() => {
          console.log('Confirmed');
          setOpen(false);
        }}
        onCancel={() => {
          console.log('Cancelled');
          setOpen(false);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof BatchConfirmDialog> = {
  title: 'Features/Network/BatchConfirmDialog',
  component: BatchConfirmDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BatchConfirmDialog>;

export const EnableAction: Story = {
  render: () => (
    <BatchConfirmDialogWrapper
      action={BatchInterfaceAction.Enable}
      interfaces={mockInterfaces}
    />
  ),
};

export const DisableAction: Story = {
  render: () => (
    <BatchConfirmDialogWrapper
      action={BatchInterfaceAction.Disable}
      interfaces={mockInterfaces.filter((iface) => !iface.usedBy.includes('gateway'))}
    />
  ),
};

export const DisableWithGatewayWarning: Story = {
  render: () => (
    <BatchConfirmDialogWrapper
      action={BatchInterfaceAction.Disable}
      interfaces={mockInterfaces}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows a critical warning with 3-second countdown when attempting to disable interfaces used by the gateway.',
      },
    },
  },
};

export const SingleInterface: Story = {
  render: () => (
    <BatchConfirmDialogWrapper
      action={BatchInterfaceAction.Enable}
      interfaces={[mockInterfaces[1]]}
    />
  ),
};

export const ManyInterfaces: Story = {
  render: () => {
    const manyInterfaces = Array.from({ length: 10 }, (_, i) => ({
      id: `*${i + 1}`,
      name: `ether${i + 1}`,
      type: 'ETHERNET',
      usedBy: i === 0 ? ['gateway'] : [],
    }));

    return (
      <BatchConfirmDialogWrapper
        action={BatchInterfaceAction.Disable}
        interfaces={manyInterfaces}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests scrollable interface list with many interfaces.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <BatchConfirmDialogWrapper
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
      />
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  render: () => (
    <BatchConfirmDialogWrapper
      action={BatchInterfaceAction.Disable}
      interfaces={mockInterfaces}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const CountdownDemo: Story = {
  render: () => (
    <BatchConfirmDialogWrapper
      action={BatchInterfaceAction.Disable}
      interfaces={mockInterfaces}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the 3-second countdown safety mechanism for critical operations. The confirm button will be disabled for 3 seconds.',
      },
    },
  },
  play: async ({ _canvasElement }) => {
    // The countdown will automatically start when the dialog opens
    // This demonstrates the safety feature
  },
};
