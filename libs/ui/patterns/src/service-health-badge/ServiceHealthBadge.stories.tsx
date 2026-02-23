import type { Meta, StoryObj } from '@storybook/react';

import { ServiceHealthBadge } from './ServiceHealthBadge';

import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';

const meta: Meta<typeof ServiceHealthBadge> = {
  title: 'Patterns/ServiceHealthBadge',
  component: ServiceHealthBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive health status indicator for service instances. Displays health state with appropriate detail level for each platform.',
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    animate: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceHealthBadge>;

const healthyStatus: ServiceInstanceHealth = {
  status: 'HEALTHY',
  connectionStatus: 'UP' as any,
  processAlive: true,
  lastHealthy: new Date(Date.now() - 15_000).toISOString(),
  latencyMs: 45,
  consecutiveFails: 0,
  uptimeSeconds: 3600,
};

const unhealthyStatus: ServiceInstanceHealth = {
  status: 'UNHEALTHY',
  connectionStatus: 'DOWN' as any,
  processAlive: false,
  lastHealthy: new Date(Date.now() - 120_000).toISOString(),
  latencyMs: 250,
  consecutiveFails: 3,
  uptimeSeconds: null,
};

const checkingStatus: ServiceInstanceHealth = {
  status: 'CHECKING',
  connectionStatus: 'UNKNOWN' as any,
  processAlive: true,
  lastHealthy: null,
  latencyMs: null,
  consecutiveFails: 0,
  uptimeSeconds: 60,
};

const unknownStatus: ServiceInstanceHealth = {
  status: 'UNKNOWN',
  connectionStatus: 'UNKNOWN' as any,
  processAlive: false,
  lastHealthy: null,
  latencyMs: null,
  consecutiveFails: 0,
  uptimeSeconds: null,
};

export const Healthy: Story = {
  name: 'Healthy',
  args: {
    health: healthyStatus,
    loading: false,
    animate: false,
  },
};

export const Unhealthy: Story = {
  name: 'Unhealthy',
  args: {
    health: unhealthyStatus,
    loading: false,
    animate: false,
  },
};

export const Checking: Story = {
  name: 'Checking',
  args: {
    health: checkingStatus,
    loading: false,
    animate: false,
  },
};

export const Unknown: Story = {
  name: 'Unknown',
  args: {
    health: unknownStatus,
    loading: false,
    animate: false,
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    health: undefined,
    loading: true,
    animate: false,
  },
};

export const NoData: Story = {
  name: 'No Data',
  args: {
    health: null,
    loading: false,
    animate: false,
  },
};

export const HealthyAnimated: Story = {
  name: 'Healthy (Animated)',
  args: {
    health: healthyStatus,
    loading: false,
    animate: true,
  },
};
