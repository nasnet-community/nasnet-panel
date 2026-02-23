import type { Meta, StoryObj } from '@storybook/react';

import { VirtualInterfaceBridge } from './VirtualInterfaceBridge';

const meta: Meta<typeof VirtualInterfaceBridge> = {
  title: 'Patterns/VirtualInterfaceBridge',
  component: VirtualInterfaceBridge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive virtual interface bridge status display. Shows network bridge readiness, gateway connectivity, interface details (name, IP, VLAN), and error diagnostics for service instances.',
      },
    },
  },
  argTypes: {
    routerId: { control: 'text' },
    instanceId: { control: 'text' },
    serviceName: { control: 'text' },
    pollInterval: { control: 'number' },
    onRefresh: { action: 'refresh' },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualInterfaceBridge>;

export const Default: Story = {
  name: 'Default (Tor Service)',
  args: {
    routerId: 'router-01',
    instanceId: 'tor-instance-01',
    serviceName: 'Tor Proxy',
    pollInterval: 5000,
  },
};

export const CustomServiceName: Story = {
  name: 'Custom Service Name',
  args: {
    routerId: 'router-02',
    instanceId: 'xray-instance-01',
    serviceName: 'Xray-core',
    pollInterval: 5000,
  },
};

export const WithRefreshCallback: Story = {
  name: 'With Refresh Callback',
  args: {
    routerId: 'router-03',
    instanceId: 'singbox-instance-01',
    serviceName: 'sing-box',
    pollInterval: 5000,
    onRefresh: () => console.log('Refresh triggered'),
  },
};

export const CustomPollInterval: Story = {
  name: 'Custom Poll Interval',
  args: {
    routerId: 'router-04',
    instanceId: 'psiphon-instance-01',
    serviceName: 'Psiphon',
    pollInterval: 10000,
  },
};

export const MultipleInstances: Story = {
  name: 'Multiple Instances',
  render: () => (
    <div className="space-y-4">
      <VirtualInterfaceBridge
        routerId="router-05"
        instanceId="tor-instance-02"
        serviceName="Tor (USA)"
        pollInterval={5000}
      />
      <VirtualInterfaceBridge
        routerId="router-05"
        instanceId="tor-instance-03"
        serviceName="Tor (Europe)"
        pollInterval={5000}
      />
    </div>
  ),
};
