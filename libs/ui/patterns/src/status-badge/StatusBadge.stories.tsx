import * as React from 'react';

import { StatusBadge } from './StatusBadge';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof StatusBadge> = {
  title: 'Patterns/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A color-coded status badge component for displaying DHCP lease statuses, client statuses, and other status indicators. Uses semantic colors from the design system.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['bound', 'waiting', 'offered', 'busy', 'searching', 'requesting', 'stopped', 'static'],
      description: 'Status type that determines the badge color',
    },
    label: {
      control: 'text',
      description: 'Custom label (overrides default status label)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  args: {
    status: 'bound',
  },
};

export const LeaseStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="bound" />
      <StatusBadge status="waiting" />
      <StatusBadge status="offered" />
      <StatusBadge status="busy" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'DHCP lease statuses: bound (active), waiting (pending), offered (in negotiation), busy (address conflict).',
      },
    },
  },
};

export const ClientStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="searching" />
      <StatusBadge status="requesting" />
      <StatusBadge status="stopped" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'DHCP client statuses: searching (looking for server), requesting (getting lease), stopped (inactive).',
      },
    },
  },
};

export const StaticEntry: Story = {
  render: () => (
    <div className="flex gap-3">
      <StatusBadge status="static" />
      <StatusBadge variant="default" label="Unknown" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Static DHCP reservation and default variant for unknown statuses.',
      },
    },
  },
};

export const CustomLabels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="bound" label="Active" />
      <StatusBadge status="waiting" label="Pending" />
      <StatusBadge status="busy" label="Conflict" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom labels can be provided to override the default status labels.',
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <div className="w-80 p-4 rounded-lg border bg-card">
      <h3 className="text-sm font-medium mb-3">DHCP Leases</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono">192.168.1.100</span>
          <StatusBadge status="bound" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono">192.168.1.101</span>
          <StatusBadge status="waiting" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono">192.168.1.102</span>
          <StatusBadge status="static" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono">192.168.1.103</span>
          <StatusBadge status="busy" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatusBadge used in a DHCP lease list context.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Lease Statuses</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="bound" />
          <StatusBadge status="waiting" />
          <StatusBadge status="offered" />
          <StatusBadge status="busy" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Client Statuses</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="searching" />
          <StatusBadge status="requesting" />
          <StatusBadge status="stopped" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Other</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="static" />
          <StatusBadge variant="default" label="Default" />
        </div>
      </div>
    </div>
  ),
};
