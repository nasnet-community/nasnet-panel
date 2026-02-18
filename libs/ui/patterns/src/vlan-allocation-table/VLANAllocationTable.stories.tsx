import { VLANAllocationTable } from './VLANAllocationTable';

import type { VLANAllocation } from './VLANAllocationTable';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VLANAllocationTable> = {
  title: 'Patterns/VLAN/VLANAllocationTable',
  component: VLANAllocationTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof VLANAllocationTable>;

// Mock data
const mockAllocations: VLANAllocation[] = [
  {
    id: '1',
    vlanID: 100,
    serviceType: 'tor',
    instanceName: 'Tor Exit Node US',
    bindIP: '10.100.0.1',
    interfaceName: 'vlan100',
    status: 'ALLOCATED',
    allocatedAt: new Date('2026-01-15T10:30:00Z').toISOString(),
  },
  {
    id: '2',
    vlanID: 101,
    serviceType: 'singbox',
    instanceName: 'sing-box Europe',
    bindIP: '10.101.0.1',
    interfaceName: 'vlan101',
    status: 'ALLOCATED',
    allocatedAt: new Date('2026-01-16T14:20:00Z').toISOString(),
  },
  {
    id: '3',
    vlanID: 102,
    serviceType: 'xray',
    instanceName: 'Xray Asia',
    bindIP: '10.102.0.1',
    interfaceName: 'vlan102',
    status: 'ALLOCATED',
    allocatedAt: new Date('2026-01-17T09:45:00Z').toISOString(),
  },
  {
    id: '4',
    vlanID: 103,
    serviceType: 'mtproxy',
    instanceName: 'MTProxy Telegram',
    bindIP: '10.103.0.1',
    interfaceName: 'vlan103',
    status: 'RELEASING',
    allocatedAt: new Date('2026-01-18T11:00:00Z').toISOString(),
  },
  {
    id: '5',
    vlanID: 104,
    serviceType: 'psiphon',
    instanceName: 'Psiphon Canada',
    status: 'RELEASED',
    allocatedAt: new Date('2026-01-10T08:30:00Z').toISOString(),
  },
  {
    id: '6',
    vlanID: 105,
    serviceType: 'adguard',
    instanceName: 'AdGuard Home DNS',
    bindIP: '10.105.0.1',
    interfaceName: 'vlan105',
    status: 'ALLOCATED',
    allocatedAt: new Date('2026-01-19T16:15:00Z').toISOString(),
  },
  {
    id: '7',
    vlanID: 106,
    serviceType: 'tor',
    instanceName: 'Tor Exit Node EU',
    bindIP: '10.106.0.1',
    interfaceName: 'vlan106',
    status: 'ALLOCATED',
    allocatedAt: new Date('2026-01-20T07:50:00Z').toISOString(),
  },
  {
    id: '8',
    vlanID: 200,
    serviceType: 'singbox',
    instanceName: 'sing-box Premium',
    bindIP: '10.200.0.1',
    interfaceName: 'vlan200',
    status: 'ALLOCATED',
    allocatedAt: new Date('2026-02-01T12:30:00Z').toISOString(),
  },
];

/**
 * Default table with mixed allocations
 */
export const Default: Story = {
  args: {
    allocations: mockAllocations,
    loading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    allocations: [],
    loading: true,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  args: {
    allocations: [],
    loading: false,
  },
};

/**
 * All allocated (active)
 */
export const AllAllocated: Story = {
  args: {
    allocations: mockAllocations.filter((a) => a.status === 'ALLOCATED'),
    loading: false,
  },
};

/**
 * Single service type (Tor only)
 */
export const SingleServiceType: Story = {
  args: {
    allocations: mockAllocations.filter((a) => a.serviceType === 'tor'),
    loading: false,
  },
};

/**
 * Large dataset (100 allocations)
 */
export const LargeDataset: Story = {
  args: {
    allocations: Array.from({ length: 100 }, (_, i) => ({
      id: `${i + 1}`,
      vlanID: 100 + i,
      serviceType: ['tor', 'singbox', 'xray', 'mtproxy', 'psiphon', 'adguard'][
        i % 6
      ],
      instanceName: `Instance ${i + 1}`,
      bindIP: `10.${100 + i}.0.1`,
      interfaceName: `vlan${100 + i}`,
      status: (
        i % 10 === 0 ? 'RELEASING' : i % 20 === 0 ? 'RELEASED' : 'ALLOCATED'
      ) as VLANAllocation['status'],
      allocatedAt: new Date(2026, 0, 1 + i, 10, 0, 0).toISOString(),
    })),
    loading: false,
  },
};
