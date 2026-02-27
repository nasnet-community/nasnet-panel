import { Shield, Globe, Lock, Radio } from 'lucide-react';

import { PluginCard } from './PluginCard';

import type { Plugin } from './PluginCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PluginCard> = {
  title: 'Patterns/PluginCard',
  component: PluginCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a feature-marketplace plugin with its current status, live traffic statistics (when running), action buttons (Install / Configure / Uninstall), and an expandable details section listing features and recent activity logs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PluginCard>;

const basePlugin: Plugin = {
  id: 'sing-box',
  name: 'sing-box',
  description:
    'Universal proxy platform supporting VLESS, VMess, Trojan, and more. Runs as a transparent proxy inside the router.',
  icon: Globe,
  version: '1.9.4',
  status: 'available',
  features: [
    'VLESS / VMess / Trojan / Shadowsocks support',
    'TUN mode for transparent proxying',
    'Route rules with DNS override',
    'Sub 5 MB Docker footprint',
  ],
};

const runningPlugin: Plugin = {
  ...basePlugin,
  id: 'sing-box-running',
  status: 'running',
  stats: {
    connections: 42,
    peersConnected: 8,
    bytesIn: 1_234_567_890,
    bytesOut: 456_789_012,
  },
  logs: [
    {
      timestamp: new Date('2026-02-19T09:15:00'),
      message: 'Peer 10.0.0.5 connected via VLESS',
      type: 'success',
    },
    {
      timestamp: new Date('2026-02-19T09:14:30'),
      message: 'Route rule matched: bypass CN',
      type: 'info',
    },
    {
      timestamp: new Date('2026-02-19T09:13:55'),
      message: 'DNS query timed out for api.example.com',
      type: 'warning',
    },
  ],
};

const installedPlugin: Plugin = {
  ...basePlugin,
  id: 'sing-box-installed',
  status: 'installed',
  logs: [
    {
      timestamp: new Date('2026-02-19T08:00:00'),
      message: 'Service started successfully',
      type: 'success',
    },
    {
      timestamp: new Date('2026-02-19T07:59:45'),
      message: 'Configuration loaded from /etc/sing-box/config.json',
      type: 'info',
    },
  ],
};

const errorPlugin: Plugin = {
  ...basePlugin,
  id: 'tor-error',
  name: 'Tor',
  description: 'Onion routing for anonymous browsing and .onion site access.',
  icon: Shield,
  version: '0.4.8.9',
  status: 'error',
  features: [
    'Anonymous TCP tunneling',
    'Hidden service (.onion) support',
    'Bridge relay support for censored regions',
  ],
};

const adguardPlugin: Plugin = {
  id: 'adguard-home',
  name: 'AdGuard Home',
  description:
    'Network-wide ad and tracker blocking with a built-in DNS server and statistics dashboard.',
  icon: Lock,
  version: '0.107.43',
  status: 'running',
  features: [
    'DNS-based ad & tracker blocking',
    '3000+ default filter lists',
    'Query log with per-client analytics',
    'Custom DNS rewrite rules',
    'DoH / DoT upstream support',
  ],
  stats: {
    connections: 1847,
    peersConnected: 14,
    bytesIn: 98_123_456,
    bytesOut: 12_345_678,
  },
  logs: [
    {
      timestamp: new Date('2026-02-19T09:20:00'),
      message: 'Blocked: ads.doubleclick.net',
      type: 'info',
    },
    {
      timestamp: new Date('2026-02-19T09:19:50'),
      message: 'Blocked: tracker.example.com',
      type: 'info',
    },
    {
      timestamp: new Date('2026-02-19T09:19:40'),
      message: 'DNS upstream timeout (8.8.8.8)',
      type: 'error',
    },
  ],
};

const psiphonPlugin: Plugin = {
  id: 'psiphon',
  name: 'Psiphon',
  description:
    'Censorship circumvention tool using a combination of SSH, VPN, and HTTP proxy technologies.',
  icon: Radio,
  version: '3.175',
  status: 'available',
  features: [
    'Automatic protocol selection',
    'SSH / L2TP / HTTP proxy modes',
    'Built-in split tunneling',
  ],
};

export const Available: Story = {
  args: {
    plugin: basePlugin,
    onInstall: (id) => alert(`Install: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state for a plugin that is not yet installed. Shows the Install button.',
      },
    },
  },
};

export const Running: Story = {
  args: {
    plugin: runningPlugin,
    onConfigure: (id) => alert(`Configure: ${id}`),
    onUninstall: (id) => alert(`Uninstall: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Active running state with live traffic statistics grid and green gradient background. The expandable Details section shows recent activity logs.',
      },
    },
  },
};

export const Installed: Story = {
  args: {
    plugin: installedPlugin,
    onConfigure: (id) => alert(`Configure: ${id}`),
    onUninstall: (id) => alert(`Uninstall: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Plugin is installed but not currently running. Shows Configure and Uninstall actions without stats.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    plugin: errorPlugin,
    onInstall: (id) => alert(`Retry install: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Plugin in an error state — status dot turns red and text shows "Error".',
      },
    },
  },
};

export const AdGuardHome: Story = {
  args: {
    plugin: adguardPlugin,
    onConfigure: (id) => alert(`Configure: ${id}`),
    onUninstall: (id) => alert(`Uninstall: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'AdGuard Home running with DNS query statistics and per-query activity log.',
      },
    },
  },
};

export const Psiphon: Story = {
  args: {
    plugin: psiphonPlugin,
    onInstall: (id) => alert(`Install: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A second available plugin demonstrating the marketplace card for a different service.',
      },
    },
  },
};
