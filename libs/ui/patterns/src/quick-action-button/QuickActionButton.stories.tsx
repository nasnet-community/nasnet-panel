import {
  Shield,
  Wifi,
  BarChart2,
  Settings,
  Bell,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';

import { QuickActionButton } from './QuickActionButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof QuickActionButton> = {
  title: 'Patterns/QuickActionButton',
  component: QuickActionButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An icon-based action button with an optional badge. Used in dashboard grids for quick access to common features. Supports hover/active animations, disabled state, and several badge variants.',
      },
    },
  },
  argTypes: {
    badgeVariant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'outline',
        'connected',
        'warning',
        'error',
        'info',
        'offline',
      ],
    },
    disabled: { control: 'boolean' },
    badge: { control: 'text' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof QuickActionButton>;

export const Default: Story = {
  args: {
    icon: Wifi,
    label: 'Network',
    onClick: () => alert('Network clicked'),
  },
};

export const WithNumericBadge: Story = {
  args: {
    icon: Bell,
    label: 'Alerts',
    badge: 3,
    badgeVariant: 'error',
    onClick: () => alert('Alerts clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a numeric badge in the top-right corner indicating pending alerts.',
      },
    },
  },
};

export const WithTextBadge: Story = {
  args: {
    icon: RefreshCw,
    label: 'Updates',
    badge: 'New',
    badgeVariant: 'info',
    onClick: () => alert('Updates clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a text badge, useful for labeling new or updated features.',
      },
    },
  },
};

export const WithWarningBadge: Story = {
  args: {
    icon: Shield,
    label: 'Firewall',
    badge: '!',
    badgeVariant: 'warning',
    onClick: () => alert('Firewall clicked'),
  },
};

export const Disabled: Story = {
  args: {
    icon: Lock,
    label: 'Locked',
    onClick: () => alert('Should not fire'),
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state renders the button at reduced opacity and blocks click interactions.',
      },
    },
  },
};

export const GridOfFour: Story = {
  render: () => (
    <div className="grid w-64 grid-cols-2 gap-4">
      <QuickActionButton
        icon={Wifi}
        label="Network"
        onClick={() => {}}
      />
      <QuickActionButton
        icon={Shield}
        label="Firewall"
        badge={2}
        badgeVariant="error"
        onClick={() => {}}
      />
      <QuickActionButton
        icon={BarChart2}
        label="Stats"
        onClick={() => {}}
      />
      <QuickActionButton
        icon={Settings}
        label="Settings"
        badge="New"
        badgeVariant="info"
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Typical dashboard 2x2 grid layout showing how multiple QuickActionButtons compose together.',
      },
    },
  },
};

export const WithAlertIcon: Story = {
  args: {
    icon: AlertTriangle,
    label: 'Warnings',
    badge: 7,
    badgeVariant: 'warning',
    onClick: () => alert('Warnings clicked'),
  },
};
