import { fn } from '@storybook/test';

import { StatusPills } from './StatusPills';

import type { StatusPill } from './StatusPills';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StatusPills> = {
  title: 'Patterns/StatusPills',
  component: StatusPills,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A horizontally-scrollable row of pill-shaped status badges. Each pill maps to a semantic variant (success, warning, error, info, neutral, loading) with its own icon and colour scheme. Pills are optionally clickable for drill-down navigation.',
      },
    },
  },
  argTypes: {
    pills: {
      description: 'Array of StatusPill objects to render',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the wrapper',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusPills>;

// ─── Mock pill data ────────────────────────────────────────────────────────

const successPill: StatusPill = {
  id: 'vpn',
  label: 'VPN Active',
  variant: 'success',
};

const warningPill: StatusPill = {
  id: 'cpu',
  label: 'CPU 82%',
  variant: 'warning',
};

const errorPill: StatusPill = {
  id: 'wan',
  label: 'WAN Down',
  variant: 'error',
};

const infoPill: StatusPill = {
  id: 'update',
  label: 'Update Available',
  variant: 'info',
};

const neutralPill: StatusPill = {
  id: 'dhcp',
  label: 'DHCP',
  variant: 'neutral',
};

const loadingPill: StatusPill = {
  id: 'sync',
  label: 'Syncing…',
  variant: 'loading',
};

// ─── Stories ──────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    pills: [successPill, warningPill, errorPill, infoPill],
  },
  parameters: {
    docs: {
      description: {
        story: 'A representative mix of success, warning, error, and info pills.',
      },
    },
  },
};

export const AllVariants: Story = {
  args: {
    pills: [
      successPill,
      warningPill,
      errorPill,
      infoPill,
      neutralPill,
      loadingPill,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'All six status pill variants rendered together. The loading pill shows an animated spinner.',
      },
    },
  },
};

export const ClickablePills: Story = {
  args: {
    pills: [
      { id: 'firewall', label: 'Firewall', variant: 'success', onClick: fn() },
      { id: 'dns',      label: 'DNS Issue', variant: 'warning', onClick: fn() },
      { id: 'vpn-err',  label: 'VPN Error',  variant: 'error',   onClick: fn() },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Pills become interactive buttons when an `onClick` handler is provided. They lift slightly on hover and shrink on press.',
      },
    },
  },
};

export const RouterHealthDashboard: Story = {
  render: () => (
    <div className="w-[360px] rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Router Status</h3>
      <StatusPills
        pills={[
          { id: 'internet', label: 'Internet OK',   variant: 'success' },
          { id: 'firewall', label: 'Firewall',       variant: 'success' },
          { id: 'cpu',      label: 'CPU High',       variant: 'warning' },
          { id: 'updates',  label: '3 Updates',      variant: 'info'    },
          { id: 'backup',   label: 'No Backup',      variant: 'error'   },
        ]}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world example: a router health summary card embedding StatusPills for a quick-glance overview.',
      },
    },
  },
};

export const SinglePill: Story = {
  args: {
    pills: [{ id: 'connected', label: 'Connected', variant: 'success' }],
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with a single pill — renders correctly without scrolling.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    pills: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'When `pills` is empty the component renders nothing (returns null). This story demonstrates that behaviour.',
      },
    },
  },
};
