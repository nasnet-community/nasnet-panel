/**
 * NetworkTopology Storybook Stories
 *
 * Documentation and visual testing for the NetworkTopology component.
 * Includes stories for various states and configurations.
 */


import { NetworkTopology } from './NetworkTopology';
import { NetworkTopologyDesktop } from './NetworkTopology.Desktop';
import { NetworkTopologyMobile } from './NetworkTopology.Mobile';

import type { RouterInfo, WanInterface, LanNetwork, Device } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// Sample data for stories
const sampleRouter: RouterInfo = {
  id: 'router-1',
  name: 'Home Router',
  model: 'MikroTik RB5009UG+S+IN',
  status: 'online',
};

const sampleWanInterfaces: WanInterface[] = [
  {
    id: 'wan-1',
    name: 'WAN Primary',
    ip: '203.0.113.1',
    status: 'connected',
    provider: 'Fiber ISP',
  },
  {
    id: 'wan-2',
    name: 'WAN Backup',
    ip: '203.0.113.2',
    status: 'disconnected',
    provider: 'LTE Backup',
  },
];

const sampleLanNetworks: LanNetwork[] = [
  {
    id: 'lan-1',
    name: 'Main Network',
    cidr: '192.168.1.0/24',
    gateway: '192.168.1.1',
    deviceCount: 15,
  },
  {
    id: 'lan-2',
    name: 'Guest Network',
    cidr: '192.168.2.0/24',
    gateway: '192.168.2.1',
    deviceCount: 3,
  },
];

const sampleDevices: Device[] = [
  {
    id: 'dev-1',
    name: 'Desktop PC',
    ip: '192.168.1.10',
    mac: '00:11:22:33:44:55',
    type: 'computer',
    status: 'online',
  },
  {
    id: 'dev-2',
    name: 'iPhone 15',
    ip: '192.168.1.11',
    type: 'phone',
    status: 'online',
  },
  {
    id: 'dev-3',
    name: 'Smart TV',
    ip: '192.168.1.12',
    type: 'iot',
    status: 'offline',
  },
  {
    id: 'dev-4',
    name: 'iPad Pro',
    ip: '192.168.1.13',
    type: 'tablet',
    status: 'online',
  },
];

/**
 * Network Topology Visualization
 *
 * A visual diagram showing network configuration with:
 * - Router at center
 * - WAN interfaces on the left
 * - LAN networks on the right
 * - Connected devices (optional)
 *
 * The component automatically switches between desktop (SVG) and
 * mobile (card-based) presentations based on screen size.
 */
const meta: Meta<typeof NetworkTopology> = {
  title: 'Patterns/Visualization/NetworkTopology',
  component: NetworkTopology,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A Layer 2 pattern component for visualizing network configurations.

## Features
- **Responsive**: Automatically switches between SVG (desktop) and card-based (mobile) views
- **Interactive**: Hover/focus for tooltips with detailed information
- **Accessible**: Full keyboard navigation and screen reader support (WCAG AAA)
- **Themeable**: Uses CSS variables for colors, supports dark mode

## Usage
\`\`\`tsx
import { NetworkTopology } from '@nasnet/ui/patterns';

<NetworkTopology
  router={{ id: '1', name: 'Main Router', status: 'online' }}
  wanInterfaces={[
    { id: 'wan1', name: 'WAN', status: 'connected', ip: '203.0.113.1' }
  ]}
  lanNetworks={[
    { id: 'lan1', name: 'LAN', cidr: '192.168.1.0/24', gateway: '192.168.1.1' }
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    presenter: {
      control: 'radio',
      options: [undefined, 'mobile', 'desktop'],
      description: 'Force a specific presenter (auto-detects if not set)',
    },
    showDevices: {
      control: 'boolean',
      description: 'Show individual devices in the topology',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkTopology>;

/**
 * Default topology with typical home network setup
 */
export const Default: Story = {
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
  },
};

/**
 * Topology showing connected devices
 */
export const WithDevices: Story = {
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
    devices: sampleDevices,
    showDevices: true,
  },
};

/**
 * Simple setup with single WAN and LAN
 */
export const SimpleNetwork: Story = {
  args: {
    router: {
      id: 'router-1',
      name: 'Home Router',
      status: 'online',
    },
    wanInterfaces: [
      {
        id: 'wan-1',
        name: 'Internet',
        ip: '192.168.0.100',
        status: 'connected',
      },
    ],
    lanNetworks: [
      {
        id: 'lan-1',
        name: 'Home Network',
        cidr: '192.168.1.0/24',
        gateway: '192.168.1.1',
      },
    ],
  },
};

/**
 * Router is offline
 */
export const RouterOffline: Story = {
  args: {
    router: {
      ...sampleRouter,
      status: 'offline',
    },
    wanInterfaces: sampleWanInterfaces.map((wan) => ({
      ...wan,
      status: 'disconnected' as const,
    })),
    lanNetworks: sampleLanNetworks,
  },
};

/**
 * WAN connection pending (e.g., during reconnection)
 */
export const PendingConnection: Story = {
  args: {
    router: {
      ...sampleRouter,
      status: 'unknown',
    },
    wanInterfaces: [
      {
        id: 'wan-1',
        name: 'WAN Primary',
        status: 'pending',
        provider: 'Fiber ISP',
      },
    ],
    lanNetworks: sampleLanNetworks,
  },
};

/**
 * Empty state - no WAN or LAN configured
 */
export const EmptyState: Story = {
  args: {
    router: {
      id: 'router-1',
      name: 'New Router',
      status: 'online',
    },
    wanInterfaces: [],
    lanNetworks: [],
  },
};

/**
 * Forced desktop presenter view
 */
export const DesktopView: Story = {
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
    devices: sampleDevices,
    presenter: 'desktop',
    showDevices: true,
  },
  globals: {
    viewport: {
      value: 'desktop',
      isRotated: false
    }
  },
};

/**
 * Forced mobile presenter view
 */
export const MobileView: Story = {
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
    devices: sampleDevices,
    presenter: 'mobile',
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

/**
 * Dark mode theme
 */
export const DarkMode: Story = {
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
    devices: sampleDevices,
    showDevices: true,
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
  globals: {
    backgrounds: {
      value: "dark"
    }
  },
};

/**
 * Multiple WAN interfaces (Multi-WAN setup)
 */
export const MultiWan: Story = {
  args: {
    router: {
      id: 'router-1',
      name: 'Edge Router',
      model: 'MikroTik CCR2004',
      status: 'online',
    },
    wanInterfaces: [
      { id: 'wan-1', name: 'Fiber 1Gbps', ip: '100.64.1.1', status: 'connected', provider: 'Main ISP' },
      { id: 'wan-2', name: 'Fiber 500Mbps', ip: '100.64.2.1', status: 'connected', provider: 'Backup ISP' },
      { id: 'wan-3', name: 'LTE Failover', status: 'disconnected', provider: 'Mobile Carrier' },
    ],
    lanNetworks: [
      { id: 'lan-1', name: 'Office', cidr: '10.0.1.0/24', gateway: '10.0.1.1', deviceCount: 50 },
      { id: 'lan-2', name: 'Guest WiFi', cidr: '10.0.2.0/24', gateway: '10.0.2.1', deviceCount: 12 },
      { id: 'lan-3', name: 'IoT VLAN', cidr: '10.0.3.0/24', gateway: '10.0.3.1', deviceCount: 25 },
    ],
  },
};

// Desktop-specific stories
const desktopMeta: Meta<typeof NetworkTopologyDesktop> = {
  title: 'Patterns/Visualization/NetworkTopology/Desktop',
  component: NetworkTopologyDesktop,
  parameters: {
    layout: 'padded',
  },
};

export const DesktopComponent: StoryObj<typeof NetworkTopologyDesktop> = {
  ...desktopMeta,
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
    devices: sampleDevices,
    showDevices: true,
  },
};

// Mobile-specific stories
const mobileMeta: Meta<typeof NetworkTopologyMobile> = {
  title: 'Patterns/Visualization/NetworkTopology/Mobile',
  component: NetworkTopologyMobile,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileComponent: StoryObj<typeof NetworkTopologyMobile> = {
  ...mobileMeta,
  args: {
    router: sampleRouter,
    wanInterfaces: sampleWanInterfaces,
    lanNetworks: sampleLanNetworks,
    devices: sampleDevices,
    defaultExpanded: true,
  },
};
