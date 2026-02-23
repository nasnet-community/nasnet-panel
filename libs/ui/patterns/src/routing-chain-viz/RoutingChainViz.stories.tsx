import type { Meta, StoryObj } from '@storybook/react';
import { RoutingChainViz } from './RoutingChainViz';
import type { RoutingChainData } from './types';

const meta: Meta<typeof RoutingChainViz> = {
  title: 'Patterns/RoutingChainViz',
  component: RoutingChainViz,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Visualizes multi-hop routing chains showing the path from a network device through service instances to the internet. Desktop shows horizontal flow, mobile shows vertical timeline.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RoutingChainViz>;

const defaultChain: RoutingChainData = {
  id: 'chain-1',
  deviceId: 'device-123',
  deviceName: 'Living Room PC',
  deviceMac: '00:1A:2B:3C:4D:5E',
  deviceIp: '192.168.1.100',
  active: true,
  routingMode: 'MAC',
  killSwitchEnabled: true,
  killSwitchMode: 'BLOCK_ALL',
  killSwitchActive: false,
  totalLatencyMs: 45,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      serviceType: 'vpn',
      routingMark: 'tor_mark',
      latencyMs: 25,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-2',
      order: 2,
      serviceName: 'Xray',
      serviceType: 'proxy',
      routingMark: 'xray_mark',
      latencyMs: 20,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

const singleHopChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-2',
  totalLatencyMs: 15,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      serviceType: 'vpn',
      routingMark: 'tor_mark',
      latencyMs: 15,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

const multiHopChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-3',
  totalLatencyMs: 95,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      routingMark: 'tor_mark',
      latencyMs: 25,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-2',
      order: 2,
      serviceName: 'Xray',
      routingMark: 'xray_mark',
      latencyMs: 30,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-3',
      order: 3,
      serviceName: 'MTProxy',
      routingMark: 'mtproxy_mark',
      latencyMs: 20,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-4',
      order: 4,
      serviceName: 'Psiphon',
      routingMark: 'psiphon_mark',
      latencyMs: 20,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

const unhealthyHopChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-4',
  totalLatencyMs: null,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      routingMark: 'tor_mark',
      latencyMs: 25,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-2',
      order: 2,
      serviceName: 'Xray',
      routingMark: 'xray_mark',
      latencyMs: -1,
      healthy: false,
      killSwitchActive: true,
    },
  ],
};

const highLatencyChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-5',
  totalLatencyMs: 450,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      routingMark: 'tor_mark',
      latencyMs: 220,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-2',
      order: 2,
      serviceName: 'Xray',
      routingMark: 'xray_mark',
      latencyMs: 230,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

const killSwitchActiveChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-6',
  killSwitchActive: true,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      routingMark: 'tor_mark',
      latencyMs: 25,
      healthy: true,
      killSwitchActive: true,
    },
    {
      id: 'hop-2',
      order: 2,
      serviceName: 'Xray',
      routingMark: 'xray_mark',
      latencyMs: 20,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

const killSwitchModeChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-7',
  killSwitchMode: 'FALLBACK_SERVICE',
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      routingMark: 'tor_mark',
      latencyMs: 25,
      healthy: true,
      killSwitchActive: false,
    },
    {
      id: 'hop-2',
      order: 2,
      serviceName: 'Xray',
      routingMark: 'xray_mark',
      latencyMs: 20,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

const inactiveChain: RoutingChainData = {
  ...defaultChain,
  id: 'chain-8',
  active: false,
  hops: [
    {
      id: 'hop-1',
      order: 1,
      serviceName: 'Tor',
      routingMark: 'tor_mark',
      latencyMs: 25,
      healthy: true,
      killSwitchActive: false,
    },
  ],
};

export const Default: Story = {
  args: {
    chain: defaultChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const SingleHop: Story = {
  args: {
    chain: singleHopChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const MultiHop: Story = {
  args: {
    chain: multiHopChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const UnhealthyHop: Story = {
  args: {
    chain: unhealthyHopChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const HighLatency: Story = {
  args: {
    chain: highLatencyChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const KillSwitchActive: Story = {
  args: {
    chain: killSwitchActiveChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const KillSwitchModes: Story = {
  args: {
    chain: killSwitchModeChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const Loading: Story = {
  args: {
    chain: defaultChain,
    loading: true,
  },
};

export const Error: Story = {
  args: {
    chain: defaultChain,
    error: 'Failed to load routing chain. Please try again.',
  },
};

export const Compact: Story = {
  args: {
    chain: defaultChain,
    compact: true,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const Inactive: Story = {
  args: {
    chain: inactiveChain,
    showLatency: true,
    showKillSwitch: true,
  },
};

export const WithoutLatency: Story = {
  args: {
    chain: defaultChain,
    showLatency: false,
    showKillSwitch: true,
  },
};

export const WithoutKillSwitch: Story = {
  args: {
    chain: defaultChain,
    showLatency: true,
    showKillSwitch: false,
  },
};

export const CustomDeviceLabel: Story = {
  args: {
    chain: {
      ...defaultChain,
      deviceName: 'Network Device (192.168.1.50)',
    },
    showLatency: true,
    showKillSwitch: true,
  },
};

export const Interactive: Story = {
  args: {
    chain: defaultChain,
    showLatency: true,
    showKillSwitch: true,
    onHopClick: (hop) => {
      console.log('Hop clicked:', hop);
    },
    onKillSwitchToggle: (enabled) => {
      console.log('Kill switch toggled:', enabled);
    },
  },
};
