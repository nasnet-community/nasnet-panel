import * as React from 'react';

import { Separator } from './separator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Separator> = {
  title: 'Primitives/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A visual divider built on Radix UI Separator. Renders as a thin 1px line in the `border` color and supports both horizontal (default) and vertical orientations. Use the `decorative` prop (default: true) when the separator is purely visual — set it to false when it carries semantic meaning for screen readers.',
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator line.',
    },
    decorative: {
      control: 'boolean',
      description:
        'When true, the separator is purely visual and hidden from assistive technologies.',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class names for custom styling.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Vertical: Story = {
  render: () => (
    <div className="text-foreground flex h-10 items-center gap-4 text-sm">
      <span>Dashboard</span>
      <Separator orientation="vertical" />
      <span>Network</span>
      <Separator orientation="vertical" />
      <span>Firewall</span>
      <Separator orientation="vertical" />
      <span>Services</span>
    </div>
  ),
};

export const BetweenSections: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div>
        <h3 className="text-foreground text-sm font-semibold">WAN Interface</h3>
        <p className="text-muted-foreground mt-1 text-sm">ether1 — 203.0.113.45/24</p>
      </div>
      <Separator />
      <div>
        <h3 className="text-foreground text-sm font-semibold">LAN Interface</h3>
        <p className="text-muted-foreground mt-1 text-sm">bridge1 — 192.168.1.1/24</p>
      </div>
      <Separator />
      <div>
        <h3 className="text-foreground text-sm font-semibold">DNS Servers</h3>
        <p className="text-muted-foreground mt-1 text-sm">1.1.1.1, 8.8.8.8</p>
      </div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="border-border bg-card flex w-72 flex-col gap-3 rounded-xl border-2 p-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className="text-success font-medium">Online</span>
      </div>
      <Separator />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Uptime</span>
        <span className="text-foreground font-mono">14d 3h 22m</span>
      </div>
      <Separator />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">CPU Load</span>
        <span className="text-foreground font-mono">12%</span>
      </div>
      <Separator />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Free Memory</span>
        <span className="text-foreground font-mono">34 MB</span>
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-80 items-center gap-4">
      <Separator
        className="flex-1"
        decorative={false}
      />
      <span className="text-muted-foreground whitespace-nowrap text-xs">Advanced Options</span>
      <Separator
        className="flex-1"
        decorative={false}
      />
    </div>
  ),
};

export const NonDecorativeSeparator: Story = {
  args: {
    orientation: 'horizontal',
    decorative: false,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div className="w-80">
      <h3 className="text-foreground mb-2 text-sm font-semibold">Section 1</h3>
      <p className="text-muted-foreground mb-4 text-sm">Content for the first section</p>
      <Separator {...args} />
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Section 2</h3>
      <p className="text-muted-foreground text-sm">Content for the second section</p>
    </div>
  ),
};
