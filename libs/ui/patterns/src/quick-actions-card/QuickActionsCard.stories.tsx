import {
  Shield,
  Wifi,
  BarChart2,
  Settings,
  Download,
  RefreshCw,
  Power,
  Globe,
} from 'lucide-react';

import { QuickActionsCard } from './QuickActionsCard';

import type { QuickAction } from './QuickActionsCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof QuickActionsCard> = {
  title: 'Patterns/QuickActionsCard',
  component: QuickActionsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A floating card displaying a 2×2 grid of large-touch-target action buttons. Supports primary (highlighted) and default variants per action, with optional sublabels. Designed for the Action-First dashboard UX pattern.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof QuickActionsCard>;

const defaultActions: QuickAction[] = [
  {
    id: 'connect',
    icon: Power,
    label: 'Connect',
    sublabel: 'Start session',
    onClick: () => alert('Connect'),
    variant: 'primary',
  },
  {
    id: 'network',
    icon: Wifi,
    label: 'Network',
    sublabel: 'Interfaces',
    onClick: () => alert('Network'),
  },
  {
    id: 'firewall',
    icon: Shield,
    label: 'Firewall',
    sublabel: 'Rules & NAT',
    onClick: () => alert('Firewall'),
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    sublabel: 'Configure',
    onClick: () => alert('Settings'),
  },
];

export const Default: Story = {
  args: {
    actions: defaultActions,
    title: 'Quick Actions',
  },
};

export const NoTitle: Story = {
  args: {
    actions: defaultActions,
    title: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'The title prop is optional — passing an empty string hides the header.',
      },
    },
  },
};

export const AllPrimary: Story = {
  args: {
    title: 'Priority Actions',
    actions: [
      { id: 'restart', icon: RefreshCw, label: 'Restart', sublabel: 'Router reboot', onClick: () => {}, variant: 'primary' },
      { id: 'update', icon: Download, label: 'Update', sublabel: 'Firmware', onClick: () => {}, variant: 'primary' },
      { id: 'dns', icon: Globe, label: 'DNS', sublabel: 'Resolve test', onClick: () => {}, variant: 'primary' },
      { id: 'stats', icon: BarChart2, label: 'Stats', sublabel: 'Live data', onClick: () => {}, variant: 'primary' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'All four actions using the primary (green) variant to emphasise high-priority actions.',
      },
    },
  },
};

export const WithDisabledAction: Story = {
  args: {
    title: 'Quick Actions',
    actions: [
      { id: 'connect', icon: Power, label: 'Connect', sublabel: 'Start session', onClick: () => {}, variant: 'primary' },
      { id: 'network', icon: Wifi, label: 'Network', sublabel: 'Offline', onClick: () => {}, disabled: true },
      { id: 'firewall', icon: Shield, label: 'Firewall', onClick: () => {} },
      { id: 'settings', icon: Settings, label: 'Settings', onClick: () => {} },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'A single disabled action rendered at reduced opacity with click blocked.',
      },
    },
  },
};

export const WithoutSublabels: Story = {
  args: {
    title: 'Actions',
    actions: [
      { id: 'wifi', icon: Wifi, label: 'Network', onClick: () => {} },
      { id: 'shield', icon: Shield, label: 'Firewall', onClick: () => {} },
      { id: 'chart', icon: BarChart2, label: 'Stats', onClick: () => {} },
      { id: 'settings', icon: Settings, label: 'Settings', onClick: () => {} },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Cards without sublabels for a compact, icon-plus-label presentation.',
      },
    },
  },
};

export const TwoActions: Story = {
  args: {
    title: 'Quick Actions',
    actions: [
      { id: 'connect', icon: Power, label: 'Connect', sublabel: 'Start session', onClick: () => {}, variant: 'primary' },
      { id: 'settings', icon: Settings, label: 'Settings', sublabel: 'Configure', onClick: () => {} },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'The grid adapts to fewer than four actions — two items span the full row.',
      },
    },
  },
};
