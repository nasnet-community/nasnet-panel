/**
 * Storybook stories for StatusBadge component
 * Covers: running/disabled states, size variants, label visibility, and grid comparison
 */

import { StatusBadge } from './StatusBadge';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof StatusBadge> = {
  title: 'App/Network/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays the running or disabled status of a network interface. The running state shows a pulsing green dot; disabled uses a muted style. Supports sm and md sizes and an optional text label.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['running', 'disabled'],
      description: 'Interface status to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Badge size variant',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show the text label alongside the dot',
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Running: Story = {
  args: {
    status: 'running',
    size: 'md',
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Running state: green pill with pulsing animation dot and "Running" label.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    status: 'disabled',
    size: 'md',
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state: muted pill with static dot and "Disabled" label.',
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    status: 'running',
    size: 'sm',
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size variant — reduced padding and dot diameter, used in dense table rows.',
      },
    },
  },
};

export const WithoutLabel: Story = {
  args: {
    status: 'running',
    size: 'md',
    showLabel: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only mode (no text label) — useful when space is constrained or the context makes the status self-evident.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <StatusBadge status="running" size="md" showLabel />
        <StatusBadge status="disabled" size="md" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status="running" size="sm" showLabel />
        <StatusBadge status="disabled" size="sm" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status="running" size="md" showLabel={false} />
        <StatusBadge status="disabled" size="md" showLabel={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison of all status + size + label combinations to verify visual consistency.',
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-2 w-64 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">ether1</span>
        <StatusBadge status="running" size="sm" showLabel />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">ether2</span>
        <StatusBadge status="disabled" size="sm" showLabel />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">bridge1</span>
        <StatusBadge status="running" size="sm" showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'StatusBadge rendered inside a realistic interface-list card to verify alignment and spacing.',
      },
    },
  },
};
