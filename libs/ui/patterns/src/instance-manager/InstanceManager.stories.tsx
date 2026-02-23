import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { InstanceManager } from './InstanceManager';

import type { Service } from '../service-card/types';

const meta: Meta<typeof InstanceManager> = {
  title: 'Patterns/InstanceManager',
  component: InstanceManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive service instance manager with filtering, search, bulk operations, and view mode switching. Displays installed network services with status and resource metrics.',
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    error: { control: 'text' },
    showMetrics: { control: 'boolean' },
    viewMode: { control: { type: 'select', options: ['grid', 'list'] } },
    onSelectionChange: { action: 'selectionChange' },
    onInstanceClick: { action: 'instanceClick' },
    onBulkOperation: { action: 'bulkOperation' },
    onFiltersChange: { action: 'filtersChange' },
    onSortChange: { action: 'sortChange' },
    onViewModeChange: { action: 'viewModeChange' },
  },
};

export default meta;
type Story = StoryObj<typeof InstanceManager>;

const mockInstances: Service[] = [
  {
    id: 'tor-01',
    name: 'Tor (USA)',
    description: 'Anonymity network - USA exit node',
    category: 'privacy',
    status: 'running',
    version: '0.4.7',
    metrics: {
      cpu: 5.2,
      memory: 128,
      currentMemory: 112,
      memoryLimit: 256,
      network: { rx: 12582912, tx: 8388608 },
    },
  },
  {
    id: 'tor-02',
    name: 'Tor (EU)',
    description: 'Anonymity network - EU exit node',
    category: 'privacy',
    status: 'running',
    version: '0.4.7',
    metrics: {
      cpu: 3.8,
      memory: 135,
      currentMemory: 128,
      memoryLimit: 256,
      network: { rx: 9437184, tx: 5242880 },
    },
  },
  {
    id: 'xray-01',
    name: 'Xray-core',
    description: 'Advanced proxy server',
    category: 'proxy',
    status: 'stopped',
    version: '1.8.3',
  },
  {
    id: 'adguard-01',
    name: 'AdGuard Home',
    description: 'DNS-level ad blocker',
    category: 'dns',
    status: 'failed',
    version: '0.107.40',
  },
  {
    id: 'singbox-01',
    name: 'sing-box',
    description: 'Universal proxy platform',
    category: 'proxy',
    status: 'installing',
    version: '1.7.0',
  },
];

export const Default: Story = {
  name: 'Default',
  args: {
    instances: mockInstances,
    loading: false,
    error: null,
    viewMode: 'grid',
    showMetrics: true,
  },
};

export const Empty: Story = {
  name: 'Empty',
  args: {
    instances: [],
    loading: false,
    error: null,
    emptyState: (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No service instances found.</p>
        <p className="text-sm text-muted-foreground">Install services to get started.</p>
      </div>
    ),
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    instances: [],
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  name: 'Error',
  args: {
    instances: [],
    loading: false,
    error: 'Failed to load service instances',
  },
};

export const WithSelection: Story = {
  name: 'With Selection (2 of 5)',
  args: {
    instances: mockInstances,
    selectedIds: ['tor-01', 'xray-01'],
    onSelectionChange: fn(),
    loading: false,
    error: null,
    viewMode: 'grid',
  },
};

export const ListView: Story = {
  name: 'List View',
  args: {
    instances: mockInstances,
    loading: false,
    error: null,
    viewMode: 'list',
    showMetrics: true,
  },
};

export const WithMetrics: Story = {
  name: 'With Metrics',
  args: {
    instances: mockInstances,
    loading: false,
    error: null,
    viewMode: 'grid',
    showMetrics: true,
  },
};

export const Filtered: Story = {
  name: 'Filtered (Privacy Category)',
  args: {
    instances: mockInstances.filter((s) => s.category === 'privacy'),
    loading: false,
    error: null,
    filters: {
      search: '',
      category: 'privacy',
      status: 'all',
    },
    viewMode: 'grid',
  },
};
