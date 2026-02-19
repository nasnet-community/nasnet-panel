import {
  Wifi,
  Shield,
  Router,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Network,
  Lock,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Terminal,
} from 'lucide-react';

import { Icon } from './Icon';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Icon> = {
  title: 'Primitives/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Unified icon wrapper ensuring consistent sizing, accessibility, and semantic token usage. Accepts any lucide-react icon component via the icon prop. When a label is provided, the icon renders with aria-label and role="img"; otherwise it is hidden from assistive technology with aria-hidden="true".',
      },
    },
  },
  argTypes: {
    icon: {
      description: 'The lucide-react icon component to render',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 16, 20, 24, 32, 48],
      description: 'Size preset or custom pixel value',
    },
    label: {
      control: 'text',
      description: 'Accessible label. When provided, sets aria-label and role="img".',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for color and styling',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    icon: Wifi,
    size: 'md',
  },
};

export const WithLabel: Story = {
  args: {
    icon: Shield,
    size: 'md',
    label: 'Security shield',
  },
};

export const SizePresets: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Router} size="sm" />
        <span className="text-xs text-muted-foreground">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Router} size="md" />
        <span className="text-xs text-muted-foreground">md (20px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Router} size="lg" />
        <span className="text-xs text-muted-foreground">lg (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Router} size="xl" />
        <span className="text-xs text-muted-foreground">xl (32px)</span>
      </div>
    </div>
  ),
};

export const CustomPixelSize: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Network} size={12} />
        <span className="text-xs text-muted-foreground">12px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Network} size={18} />
        <span className="text-xs text-muted-foreground">18px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Network} size={36} />
        <span className="text-xs text-muted-foreground">36px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Network} size={48} />
        <span className="text-xs text-muted-foreground">48px</span>
      </div>
    </div>
  ),
};

export const SemanticColors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={CheckCircle} size="lg" className="text-success" label="Online" />
        <span className="text-xs text-muted-foreground">success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={AlertTriangle} size="lg" className="text-warning" label="Warning" />
        <span className="text-xs text-muted-foreground">warning</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={XCircle} size="lg" className="text-error" label="Error" />
        <span className="text-xs text-muted-foreground">error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Activity} size="lg" className="text-info" label="Info" />
        <span className="text-xs text-muted-foreground">info</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Settings} size="lg" className="text-primary" label="Settings" />
        <span className="text-xs text-muted-foreground">primary</span>
      </div>
    </div>
  ),
};

export const NetworkContextIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Wifi} size="lg" className="text-cyan-500" />
        <span className="text-xs text-muted-foreground">WiFi</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Shield} size="lg" className="text-orange-500" />
        <span className="text-xs text-muted-foreground">Firewall</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Lock} size="lg" className="text-green-500" />
        <span className="text-xs text-muted-foreground">VPN</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Globe} size="lg" className="text-blue-500" />
        <span className="text-xs text-muted-foreground">WAN</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Server} size="lg" className="text-gray-500" />
        <span className="text-xs text-muted-foreground">Server</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Cpu} size="lg" className="text-purple-500" />
        <span className="text-xs text-muted-foreground">CPU</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={HardDrive} size="lg" className="text-indigo-500" />
        <span className="text-xs text-muted-foreground">Storage</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Terminal} size="lg" className="text-gray-700" />
        <span className="text-xs text-muted-foreground">CLI</span>
      </div>
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Icon icon={CheckCircle} size="sm" className="text-success" label="Connected" />
        <span>Router is online and reachable</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Icon icon={AlertTriangle} size="sm" className="text-warning" label="Warning" />
        <span>High CPU usage detected (87%)</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Icon icon={XCircle} size="sm" className="text-error" label="Disconnected" />
        <span>VPN tunnel is down</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Icon icon={Activity} size="sm" className="text-info" label="Info" />
        <span>Firmware update available (v7.14)</span>
      </div>
    </div>
  ),
};
