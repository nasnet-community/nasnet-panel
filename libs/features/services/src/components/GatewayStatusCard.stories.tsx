import type { Meta, StoryObj } from '@storybook/react';
import { GatewayStatusCard } from './GatewayStatusCard';
import { GatewayState } from '@nasnet/api-client/queries';

const meta: Meta<typeof GatewayStatusCard> = {
  title: 'Features/Services/GatewayStatusCard',
  component: GatewayStatusCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive gateway status card that automatically renders a Mobile or Desktop variant based on viewport size. Displays TUN interface name, process ID, uptime, health check status, and error messages for a running service gateway.',
      },
    },
  },
  argTypes: {
    serviceName: { control: 'text' },
    instanceId: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof GatewayStatusCard>;

export const Running: Story = {
  name: 'Running',
  args: {
    instanceId: 'tor-usa-01',
    serviceName: 'Tor',
    gateway: {
      state: GatewayState.RUNNING,
      tunName: 'tun-tor-usa',
      pid: 14532,
      uptime: 7384,
      lastHealthCheck: new Date(Date.now() - 15_000),
      errorMessage: null,
    },
  },
};

export const Stopped: Story = {
  name: 'Stopped',
  args: {
    instanceId: 'tor-eu-02',
    serviceName: 'Tor',
    gateway: {
      state: GatewayState.STOPPED,
      tunName: null,
      pid: null,
      uptime: null,
      lastHealthCheck: null,
      errorMessage: null,
    },
  },
};

export const Error: Story = {
  name: 'Error',
  args: {
    instanceId: 'singbox-us-03',
    serviceName: 'sing-box',
    gateway: {
      state: GatewayState.ERROR,
      tunName: null,
      pid: null,
      uptime: null,
      lastHealthCheck: new Date(Date.now() - 300_000),
      errorMessage: 'Failed to bind TUN interface: permission denied',
    },
  },
};

export const NotNeeded: Story = {
  name: 'Not Needed',
  args: {
    instanceId: 'adguard-home-01',
    serviceName: 'AdGuard Home',
    gateway: {
      state: GatewayState.NOT_NEEDED,
      tunName: null,
      pid: null,
      uptime: null,
      lastHealthCheck: null,
      errorMessage: null,
    },
  },
};

export const RunningHighUptime: Story = {
  name: 'Running — Long Uptime',
  args: {
    instanceId: 'psiphon-prod-01',
    serviceName: 'Psiphon',
    gateway: {
      state: GatewayState.RUNNING,
      tunName: 'tun-psiphon0',
      pid: 27801,
      uptime: 864000, // 10 days
      lastHealthCheck: new Date(Date.now() - 4_000),
      errorMessage: null,
    },
  },
};

export const RunningMinimalInfo: Story = {
  name: 'Running — Minimal Info',
  args: {
    instanceId: 'xray-core-01',
    serviceName: 'Xray-core',
    gateway: {
      state: GatewayState.RUNNING,
      tunName: undefined,
      pid: undefined,
      uptime: 120,
      lastHealthCheck: new Date(Date.now() - 60_000),
      errorMessage: null,
    },
  },
};
