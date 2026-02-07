import type { Meta, StoryObj } from '@storybook/react';
import { BridgeListDesktop } from './BridgeListDesktop';
import { BridgeListMobile } from './BridgeListMobile';

/**
 * Bridge List Component Stories
 * Demonstrates bridge list in different states and platforms
 */

const mockBridges = [
  {
    uuid: 'bridge-1',
    name: 'bridge1',
    comment: 'Main bridge for LAN',
    disabled: false,
    running: true,
    macAddress: '00:11:22:33:44:55',
    mtu: 1500,
    protocol: 'rstp',
    priority: 32768,
    vlanFiltering: false,
    pvid: 1,
    ports: [
      { uuid: 'p1', interfaceName: 'ether2' },
      { uuid: 'p2', interfaceName: 'ether3' },
      { uuid: 'p3', interfaceName: 'ether4' },
    ],
    ipAddresses: ['192.168.1.1/24'],
  },
  {
    uuid: 'bridge-2',
    name: 'bridge-guest',
    comment: 'Guest network bridge',
    disabled: false,
    running: true,
    macAddress: 'AA:BB:CC:DD:EE:FF',
    mtu: 1500,
    protocol: 'rstp',
    priority: 32768,
    vlanFiltering: true,
    pvid: 100,
    ports: [
      { uuid: 'p4', interfaceName: 'wlan1' },
    ],
    ipAddresses: ['192.168.100.1/24'],
  },
  {
    uuid: 'bridge-3',
    name: 'bridge-iot',
    comment: 'IoT devices bridge',
    disabled: false,
    running: false,
    macAddress: '11:22:33:44:55:66',
    mtu: 1500,
    protocol: 'none',
    priority: 32768,
    vlanFiltering: false,
    pvid: 1,
    ports: [],
    ipAddresses: [],
  },
  {
    uuid: 'bridge-4',
    name: 'bridge-disabled',
    comment: 'Disabled test bridge',
    disabled: true,
    running: false,
    macAddress: 'FF:EE:DD:CC:BB:AA',
    mtu: 1500,
    protocol: 'stp',
    priority: 32768,
    vlanFiltering: false,
    pvid: 1,
    ports: [],
    ipAddresses: [],
  },
];

const baseProps = {
  bridges: mockBridges,
  allBridges: mockBridges,
  loading: false,
  error: null,
  selectedIds: new Set<string>(),
  toggleSelection: () => {},
  selectAll: () => {},
  clearSelection: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  protocolFilter: null,
  setProtocolFilter: () => {},
  vlanFilteringFilter: null,
  setVlanFilteringFilter: () => {},
  setSelectedBridgeId: () => {},
  handleDelete: async () => {},
  refetch: async () => {},
  routerId: 'router-1',
};

// Desktop Stories
const metaDesktop: Meta<typeof BridgeListDesktop> = {
  title: 'Features/Network/Bridges/BridgeList/Desktop',
  component: BridgeListDesktop,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  tags: ['autodocs'],
};

export default metaDesktop;

type StoryDesktop = StoryObj<typeof BridgeListDesktop>;

export const Default: StoryDesktop = {
  args: baseProps,
};

export const Loading: StoryDesktop = {
  args: {
    ...baseProps,
    bridges: [],
    loading: true,
  },
};

export const Empty: StoryDesktop = {
  args: {
    ...baseProps,
    bridges: [],
    allBridges: [],
  },
};

export const Error: StoryDesktop = {
  args: {
    ...baseProps,
    bridges: [],
    error: new Error('Failed to load bridges from router'),
  },
};

export const WithSelection: StoryDesktop = {
  args: {
    ...baseProps,
    selectedIds: new Set(['bridge-1', 'bridge-2']),
  },
};

export const Filtered: StoryDesktop = {
  args: {
    ...baseProps,
    bridges: mockBridges.filter((b) => b.protocol === 'rstp'),
    searchQuery: 'guest',
  },
};

export const SingleBridge: StoryDesktop = {
  args: {
    ...baseProps,
    bridges: [mockBridges[0]],
    allBridges: [mockBridges[0]],
  },
};

export const ManyBridges: StoryDesktop = {
  args: {
    ...baseProps,
    bridges: Array.from({ length: 20 }, (_, i) => ({
      ...mockBridges[0],
      uuid: `bridge-${i}`,
      name: `bridge${i}`,
      comment: `Auto-generated bridge ${i}`,
      ports: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
        uuid: `p${i}-${j}`,
        interfaceName: `ether${j + 1}`,
      })),
    })),
  },
};

// Mobile Stories
const metaMobile: Meta<typeof BridgeListMobile> = {
  title: 'Features/Network/Bridges/BridgeList/Mobile',
  component: BridgeListMobile,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
};

export { metaMobile };

type StoryMobile = StoryObj<typeof BridgeListMobile>;

export const MobileDefault: StoryMobile = {
  args: baseProps,
};

export const MobileLoading: StoryMobile = {
  args: {
    ...baseProps,
    bridges: [],
    loading: true,
  },
};

export const MobileEmpty: StoryMobile = {
  args: {
    ...baseProps,
    bridges: [],
    allBridges: [],
  },
};

export const MobileError: StoryMobile = {
  args: {
    ...baseProps,
    bridges: [],
    error: new Error('Failed to load bridges'),
  },
};

export const MobileSingleBridge: StoryMobile = {
  args: {
    ...baseProps,
    bridges: [mockBridges[0]],
    allBridges: [mockBridges[0]],
  },
};

export const MobileLongList: StoryMobile = {
  args: {
    ...baseProps,
    bridges: mockBridges.concat(mockBridges).concat(mockBridges),
  },
};
