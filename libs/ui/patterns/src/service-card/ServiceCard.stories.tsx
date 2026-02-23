import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { ServiceCard } from './ServiceCard';

import type { Service, ServiceAction } from './types';

const meta: Meta<typeof ServiceCard> = {
  title: 'Patterns/ServiceCard',
  component: ServiceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive service card displaying downloadable network services from the Feature Marketplace. Shows status, version, metrics, and available actions.',
      },
    },
  },
  argTypes: {
    showMetrics: { control: 'boolean' },
    onClick: { action: 'click' },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceCard>;

const torService: Service = {
  id: 'tor-01',
  name: 'Tor',
  description: 'Anonymity network for secure communication',
  category: 'privacy',
  status: 'running',
  version: '0.4.7',
  metrics: {
    cpu: 5.2,
    memory: 128,
    currentMemory: 112,
    memoryLimit: 256,
    network: {
      rx: 12582912,
      tx: 8388608,
    },
  },
  runtime: {
    installedAt: '2024-01-15',
    lastStarted: new Date(Date.now() - 3600000),
    uptime: 86400,
  },
};

const xrayCoreService: Service = {
  id: 'xray-01',
  name: 'Xray-core',
  description: 'Advanced proxy server with routing capabilities',
  category: 'proxy',
  status: 'stopped',
  version: '1.8.3',
};

const singBoxService: Service = {
  id: 'singbox-01',
  name: 'sing-box',
  description: 'Universal proxy platform with unified interface',
  category: 'proxy',
  status: 'installing',
  version: '1.7.0',
};

const adguardService: Service = {
  id: 'adguard-01',
  name: 'AdGuard Home',
  description: 'DNS-level ad blocker and privacy tool',
  category: 'dns',
  status: 'failed',
  version: '0.107.40',
};

const mtproxyService: Service = {
  id: 'mtproxy-01',
  name: 'MTProxy',
  description: 'Telegram proxy server',
  category: 'proxy',
  status: 'available',
  version: '1.0.14',
};

const actions: ServiceAction[] = [
  { id: 'start', label: 'Start', onClick: fn(), variant: 'default' },
  { id: 'stop', label: 'Stop', onClick: fn(), variant: 'secondary' },
  { id: 'configure', label: 'Configure', onClick: fn(), variant: 'outline' },
  { id: 'delete', label: 'Delete', onClick: fn(), variant: 'destructive' },
];

export const Running: Story = {
  name: 'Running',
  args: {
    service: torService,
    showMetrics: true,
  },
};

export const Stopped: Story = {
  name: 'Stopped',
  args: {
    service: xrayCoreService,
    showMetrics: false,
  },
};

export const Installing: Story = {
  name: 'Installing',
  args: {
    service: singBoxService,
    showMetrics: false,
  },
};

export const Failed: Story = {
  name: 'Failed',
  args: {
    service: adguardService,
    showMetrics: false,
  },
};

export const Available: Story = {
  name: 'Available (Not Installed)',
  args: {
    service: mtproxyService,
    showMetrics: false,
  },
};

export const WithActions: Story = {
  name: 'With Actions',
  args: {
    service: torService,
    actions,
    showMetrics: true,
  },
};

export const WithMetrics: Story = {
  name: 'With Metrics',
  args: {
    service: torService,
    showMetrics: true,
  },
};

export const Clickable: Story = {
  name: 'Clickable',
  args: {
    service: torService,
    onClick: fn(),
    showMetrics: true,
  },
};
