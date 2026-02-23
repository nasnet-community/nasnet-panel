import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { DeviceRoutingMatrix } from './DeviceRoutingMatrix';

import type { DeviceRoutingMatrixData, DeviceRoutingActions } from './types';

const meta: Meta<typeof DeviceRoutingMatrix> = {
  title: 'Patterns/DeviceRoutingMatrix',
  component: DeviceRoutingMatrix,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive device routing matrix showing network devices and their assignments to service instances. Enables assigning devices to virtual interfaces for traffic routing.',
      },
    },
  },
  argTypes: {
    routerId: { control: 'text' },
    loading: { control: 'boolean' },
    showSummary: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof DeviceRoutingMatrix>;

const mockMatrixData: DeviceRoutingMatrixData = {
  devices: [
    {
      deviceID: 'dev-001',
      macAddress: '00:11:22:33:44:55',
      ipAddress: '192.168.1.100',
      hostname: 'laptop-01',
      active: true,
      isRouted: true,
      routingMark: 'tor-mark-1',
      source: 'both',
      dhcpLease: true,
      arpEntry: true,
    },
    {
      deviceID: 'dev-002',
      macAddress: '00:11:22:33:44:66',
      ipAddress: '192.168.1.101',
      hostname: 'phone-01',
      active: true,
      isRouted: true,
      routingMark: 'xray-mark-1',
      source: 'both',
      dhcpLease: true,
      arpEntry: true,
    },
    {
      deviceID: 'dev-003',
      macAddress: '00:11:22:33:44:77',
      ipAddress: undefined,
      hostname: 'device-03',
      active: true,
      isRouted: false,
      routingMark: undefined,
      source: 'arp',
      dhcpLease: false,
      arpEntry: true,
    },
    {
      deviceID: 'dev-004',
      macAddress: '00:11:22:33:44:88',
      ipAddress: '192.168.1.102',
      hostname: undefined,
      active: false,
      isRouted: false,
      routingMark: undefined,
      source: 'dhcp',
      dhcpLease: true,
      arpEntry: false,
    },
    {
      deviceID: 'dev-005',
      macAddress: '00:11:22:33:44:99',
      ipAddress: '192.168.1.103',
      hostname: 'tablet-01',
      active: true,
      isRouted: false,
      routingMark: undefined,
      source: 'both',
      dhcpLease: true,
      arpEntry: true,
    },
  ],
  interfaces: [
    {
      id: 'vif-001',
      instanceID: 'tor-instance-01',
      instanceName: 'Tor (USA)',
      interfaceName: 'vif-tor-usa-0',
      ipAddress: '10.0.0.1',
      routingMark: 'tor-mark-1',
      gatewayType: 'tor',
      gatewayStatus: 'running',
    },
    {
      id: 'vif-002',
      instanceID: 'xray-instance-01',
      instanceName: 'Xray-core',
      interfaceName: 'vif-xray-0',
      ipAddress: '10.0.0.2',
      routingMark: 'xray-mark-1',
      gatewayType: 'proxy',
      gatewayStatus: 'running',
    },
  ],
  routings: [
    {
      id: 'routing-001',
      deviceID: 'dev-001',
      macAddress: '00:11:22:33:44:55',
      deviceIP: '192.168.1.100',
      deviceName: 'laptop-01',
      instanceID: 'tor-instance-01',
      interfaceID: 'vif-001',
      routingMode: 'MAC',
      routingMark: 'tor-mark-1',
      mangleRuleID: 'mangle-001',
      active: true,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: 'routing-002',
      deviceID: 'dev-002',
      macAddress: '00:11:22:33:44:66',
      deviceIP: '192.168.1.101',
      deviceName: 'phone-01',
      instanceID: 'xray-instance-01',
      interfaceID: 'vif-002',
      routingMode: 'IP',
      routingMark: 'xray-mark-1',
      mangleRuleID: 'mangle-002',
      active: true,
      createdAt: '2024-01-20T10:05:00Z',
      updatedAt: '2024-01-20T10:05:00Z',
    },
  ],
  summary: {
    totalDevices: 5,
    dhcpDevices: 4,
    arpOnlyDevices: 1,
    routedDevices: 2,
    unroutedDevices: 3,
    activeRoutings: 2,
    activeInterfaces: 2,
  },
};

const mockActions: DeviceRoutingActions = {
  onAssign: fn(),
  onRemove: fn(),
  onBulkAssign: fn(),
};

export const Default: Story = {
  name: 'Default',
  args: {
    routerId: 'router-01',
    matrix: mockMatrixData,
    actions: mockActions,
    loading: false,
    error: null,
    showSummary: true,
  },
};

export const Empty: Story = {
  name: 'Empty',
  args: {
    routerId: 'router-02',
    matrix: {
      devices: [],
      interfaces: [],
      routings: [],
      summary: {
        totalDevices: 0,
        dhcpDevices: 0,
        arpOnlyDevices: 0,
        routedDevices: 0,
        unroutedDevices: 0,
        activeRoutings: 0,
        activeInterfaces: 0,
      },
    },
    actions: mockActions,
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    routerId: 'router-03',
    matrix: {
      devices: [],
      interfaces: [],
      routings: [],
      summary: {
        totalDevices: 0,
        dhcpDevices: 0,
        arpOnlyDevices: 0,
        routedDevices: 0,
        unroutedDevices: 0,
        activeRoutings: 0,
        activeInterfaces: 0,
      },
    },
    actions: mockActions,
    loading: true,
    error: null,
  },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    routerId: 'router-04',
    matrix: {
      devices: [],
      interfaces: [],
      routings: [],
      summary: {
        totalDevices: 0,
        dhcpDevices: 0,
        arpOnlyDevices: 0,
        routedDevices: 0,
        unroutedDevices: 0,
        activeRoutings: 0,
        activeInterfaces: 0,
      },
    },
    actions: mockActions,
    loading: false,
    error: new Error('Failed to fetch routing data'),
  },
};

export const AllRouted: Story = {
  name: 'All Devices Routed',
  args: {
    routerId: 'router-05',
    matrix: {
      ...mockMatrixData,
      devices: mockMatrixData.devices.map((d) => ({
        ...d,
        isRouted: true,
      })),
      summary: {
        ...mockMatrixData.summary,
        routedDevices: 5,
        unroutedDevices: 0,
      },
    },
    actions: mockActions,
    loading: false,
    error: null,
  },
};

export const NoInterfaces: Story = {
  name: 'No Service Interfaces',
  args: {
    routerId: 'router-06',
    matrix: {
      ...mockMatrixData,
      interfaces: [],
      routings: [],
    },
    actions: mockActions,
    loading: false,
    error: null,
  },
};

export const WithSummary: Story = {
  name: 'With Summary Stats',
  args: {
    routerId: 'router-07',
    matrix: mockMatrixData,
    actions: mockActions,
    loading: false,
    error: null,
    showSummary: true,
  },
};
