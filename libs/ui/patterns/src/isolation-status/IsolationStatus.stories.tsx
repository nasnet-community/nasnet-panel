import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import type { IsolationStatus as GraphQLIsolationStatus } from '@nasnet/api-client/generated';

import { IsolationStatus } from './IsolationStatus';

const mockIsolationHealthy: GraphQLIsolationStatus = {
  violations: [],
  resourceLimits: {
    applied: true,
    memoryMB: 256,
    cpuPercent: 50,
  },
  lastVerified: new Date(Date.now() - 30_000).toISOString(),
};

const mockIsolationWarning: GraphQLIsolationStatus = {
  violations: [
    {
      layer: 'Port Registry',
      severity: 'WARNING' as const,
      message: 'Port 8080 already in use by another process',
      timestamp: new Date(Date.now() - 60_000).toISOString(),
    },
  ] as any,
  resourceLimits: {
    applied: true,
    memoryMB: 256,
    cpuPercent: 50,
  },
  lastVerified: new Date(Date.now() - 30_000).toISOString(),
};

const mockIsolationCritical: GraphQLIsolationStatus = {
  violations: [
    {
      layer: 'Namespace Isolation',
      severity: 'ERROR' as const,
      message: 'Unable to create isolated namespace',
      timestamp: new Date(Date.now() - 120_000).toISOString(),
    },
    {
      layer: 'Cgroup Isolation',
      severity: 'ERROR' as const,
      message: 'cgroup v2 not available on this system',
      timestamp: new Date(Date.now() - 120_000).toISOString(),
    },
  ] as any,
  resourceLimits: {
    applied: false,
    memoryMB: 0,
    cpuPercent: 0,
  },
  lastVerified: new Date(Date.now() - 120_000).toISOString(),
};

const meta: Meta<typeof IsolationStatus> = {
  title: 'Patterns/IsolationStatus',
  component: IsolationStatus,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive isolation status indicator showing service instance isolation health. Displays violations, resource limits, and health classification (healthy/warning/critical/unknown).',
      },
    },
  },
  argTypes: {
    instanceId: { control: 'text' },
    routerId: { control: 'text' },
    showResourceLimits: { control: 'boolean' },
    allowEdit: { control: 'boolean' },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
    variant: { control: { type: 'select', options: ['auto', 'mobile', 'desktop'] } },
    onHealthChange: { action: 'healthChange' },
  },
};

export default meta;
type Story = StoryObj<typeof IsolationStatus>;

export const Healthy: Story = {
  name: 'Healthy',
  args: {
    isolation: mockIsolationHealthy,
    instanceId: 'tor-instance-01',
    routerId: 'router-01',
    showResourceLimits: true,
  },
};

export const Warning: Story = {
  name: 'Warning',
  args: {
    isolation: mockIsolationWarning,
    instanceId: 'tor-instance-02',
    routerId: 'router-01',
    showResourceLimits: true,
    onHealthChange: fn(),
  },
};

export const Critical: Story = {
  name: 'Critical',
  args: {
    isolation: mockIsolationCritical,
    instanceId: 'tor-instance-03',
    routerId: 'router-01',
    showResourceLimits: false,
    onHealthChange: fn(),
  },
};

export const NoData: Story = {
  name: 'No Data (Unknown)',
  args: {
    isolation: null,
    instanceId: 'tor-instance-04',
    routerId: 'router-01',
    showResourceLimits: true,
  },
};

export const WithResourceLimits: Story = {
  name: 'With Resource Limits Editable',
  args: {
    isolation: mockIsolationHealthy,
    instanceId: 'tor-instance-05',
    routerId: 'router-01',
    showResourceLimits: true,
    allowEdit: true,
  },
};

export const SmallSize: Story = {
  name: 'Small Size',
  args: {
    isolation: mockIsolationHealthy,
    instanceId: 'tor-instance-06',
    routerId: 'router-01',
    size: 'sm',
    showResourceLimits: true,
  },
};

export const DesktopVariant: Story = {
  name: 'Desktop Variant (Forced)',
  args: {
    isolation: mockIsolationHealthy,
    instanceId: 'tor-instance-07',
    routerId: 'router-01',
    variant: 'desktop',
    showResourceLimits: true,
  },
};
