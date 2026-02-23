import { StatusDot } from './StatusDot';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StatusDot> = {
  title: 'Patterns/Common/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A simple circular dot indicator for status representation. Commonly used in tables, lists, and inline status displays. Color is controlled via className prop.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'CSS classes for styling (e.g., bg-success, bg-error, bg-warning)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const Default: Story = {
  args: {
    className: 'bg-success',
  },
};

export const Success: Story = {
  args: {
    className: 'bg-success',
  },
  parameters: {
    docs: {
      description: {
        story: 'Green dot indicating success, online, or connected status.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    className: 'bg-error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Red dot indicating error, offline, or failed status.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    className: 'bg-warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Amber dot indicating warning or degraded status.',
      },
    },
  },
};

export const Info: Story = {
  args: {
    className: 'bg-info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Blue dot for informational or neutral status.',
      },
    },
  },
};

export const Muted: Story = {
  args: {
    className: 'bg-muted',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gray dot for inactive, disabled, or muted status.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <StatusDot className="bg-success" />
        <span className="text-sm">Success</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot className="bg-warning" />
        <span className="text-sm">Warning</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot className="bg-error" />
        <span className="text-sm">Error</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot className="bg-info" />
        <span className="text-sm">Info</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot className="bg-muted" />
        <span className="text-sm">Muted</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All semantic status color variants.',
      },
    },
  },
};

export const InTable: Story = {
  render: () => (
    <div className="w-80 p-4 rounded-lg border bg-card">
      <h3 className="text-sm font-semibold mb-3">Service Status</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>WireGuard VPN</span>
          <StatusDot className="bg-success" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Firewall Rules</span>
          <StatusDot className="bg-success" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>DHCP Server</span>
          <StatusDot className="bg-warning" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Backup Service</span>
          <StatusDot className="bg-error" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Realistic example: status dots in a service list.',
      },
    },
  },
};
