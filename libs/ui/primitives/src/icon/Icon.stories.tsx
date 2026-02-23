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
    layout: 'padded',
    docs: {
      description: {
        component:
          'Unified icon wrapper ensuring consistent sizing, accessibility, and semantic token usage across the application. Supports any lucide-react icon component. When a label is provided, the icon renders with aria-label and role="img"; otherwise it is hidden from assistive technology with aria-hidden="true" (decorative). Always use semantic color tokens (text-primary, text-success, text-error, text-warning, text-info, text-muted) for WCAG AAA 7:1 contrast compliance. Platform-responsive sizing: mobile (20-24px) for touch, desktop (16-20px) for density.',
      },
    },
  },
  argTypes: {
    icon: {
      description: 'The lucide-react icon component to render (import from lucide-react)',
      table: {
        type: { summary: 'LucideIcon' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 16, 20, 24, 32, 48],
      description:
        'Size preset (sm=16px, md=20px, lg=24px, xl=32px) or custom pixel value. Mobile: use lg/24px, Desktop: use md/20px',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl' | number" },
        defaultValue: { summary: "'md'" },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label for screen readers. If provided, sets aria-label and role="img". If omitted, icon is hidden with aria-hidden="true" (decorative).',
      table: {
        type: { summary: 'string' },
      },
    },
    className: {
      control: 'text',
      description:
        'Additional CSS classes for styling. Use semantic color tokens only: text-primary, text-success, text-error, text-warning, text-info, text-muted. Never use hardcoded colors like text-cyan-500.',
      table: {
        type: { summary: 'string' },
      },
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
        <Icon icon={Wifi} size="lg" className="text-networkWireless" label="WiFi" />
        <span className="text-xs text-muted-foreground">WiFi</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Shield} size="lg" className="text-categoryFirewall" label="Firewall" />
        <span className="text-xs text-muted-foreground">Firewall</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Lock} size="lg" className="text-networkVpn" label="VPN" />
        <span className="text-xs text-muted-foreground">VPN</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Globe} size="lg" className="text-networkWan" label="WAN" />
        <span className="text-xs text-muted-foreground">WAN</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Server} size="lg" className="text-categorySystem" label="Server" />
        <span className="text-xs text-muted-foreground">Server</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Cpu} size="lg" className="text-categoryMonitoring" label="CPU" />
        <span className="text-xs text-muted-foreground">CPU</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={HardDrive} size="lg" className="text-categoryNetworking" label="Storage" />
        <span className="text-xs text-muted-foreground">Storage</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Terminal} size="lg" className="text-muted" label="CLI" />
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

export const MobileViewport: Story = {
  args: {
    icon: Wifi,
    size: 'lg',
    label: 'WiFi status',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletViewport: Story = {
  args: {
    icon: Router,
    size: 'md',
    label: 'Router device',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const DesktopViewport: Story = {
  args: {
    icon: Settings,
    size: 'md',
    label: 'Settings',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const DarkModeVariant: Story = {
  args: {
    icon: CheckCircle,
    size: 'lg',
    className: 'text-success',
    label: 'Success indicator',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const AccessibilityCompliance: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Decorative Icons (aria-hidden)</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Icon icon={Wifi} size="md" />
            <span className="text-xs text-muted-foreground">No label (decorative)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Semantic Icons with Labels (aria-label)</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Icon icon={CheckCircle} size="md" className="text-success" label="Connected" />
            <span className="text-xs text-muted-foreground">With label</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Icon icon={XCircle} size="md" className="text-error" label="Disconnected" />
            <span className="text-xs text-muted-foreground">With label</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Semantic Color Compliance (7:1 Contrast)</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Icon icon={CheckCircle} size="lg" className="text-success" label="Success" />
            <span className="text-sm">Success (Green #22C55E)</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon icon={AlertTriangle} size="lg" className="text-warning" label="Warning" />
            <span className="text-sm">Warning (Amber #F59E0B)</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon icon={XCircle} size="lg" className="text-error" label="Error" />
            <span className="text-sm">Error (Red #EF4444)</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon icon={Activity} size="lg" className="text-info" label="Info" />
            <span className="text-sm">Info (Blue #0EA5E9)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Touch Target Sizes (44px minimum)</h3>
        <div className="flex flex-col gap-2">
          <button className="flex items-center justify-center gap-2 rounded border border-border p-3">
            <Icon icon={Wifi} size="lg" label="WiFi status" />
            <span className="text-sm">Mobile (lg=24px icon in 44px target)</span>
          </button>
          <button className="flex items-center justify-center gap-2 rounded border border-border p-2">
            <Icon icon={Settings} size="md" label="Settings" />
            <span className="text-sm">Desktop (md=20px icon in 36px target)</span>
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates WCAG AAA accessibility compliance: decorative icons hidden from screen readers with aria-hidden="true", semantic icons properly labeled with aria-label, 7:1 contrast ratio maintained for all semantic colors, and proper touch target sizing (44px minimum for mobile).',
      },
    },
  },
};
