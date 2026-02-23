/**
 * Storybook stories for InterfaceIPConfig component
 *
 * Renders grouped IP address entries per interface with collapsible rows.
 * Each IP entry can be static, dynamic, or disabled.
 * Network/Netmask/Broadcast details are computed client-side via parseCIDR.
 */


import { type IPAddress } from '@nasnet/core/types';

import { InterfaceIPConfig } from './InterfaceIPConfig';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceIPConfig> = {
  title: 'App/Network/InterfaceIPConfig',
  component: InterfaceIPConfig,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Collapsible section listing all IP addresses assigned to router interfaces. Addresses are grouped by interface name; each group is individually expandable to reveal the full CIDR address, Network, Netmask, and Broadcast values. Badges distinguish Static (blue), Dynamic (green), and Disabled (grey) addresses. Shows a Globe empty state when no addresses are configured.',
      },
    },
  },
  argTypes: {
    defaultCollapsed: {
      control: 'boolean',
      description: 'Whether the IP Addresses section starts collapsed',
    },
    className: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceIPConfig>;

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

let _idCounter = 1;
const makeIP = (
  address: string,
  iface: string,
  isDynamic = false,
  isDisabled = false,
): IPAddress => ({
  id: String(_idCounter++),
  address,
  network: address.split('/')[0].replace(/\.\d+$/, '.0'),
  interface: iface,
  isDynamic,
  isDisabled,
});

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default — Multiple Interfaces',
  args: {
    ipAddresses: [
      makeIP('192.168.88.1/24', 'bridge1'),
      makeIP('10.0.0.1/30', 'pppoe-out1', true),
      makeIP('172.16.0.1/16', 'ether1'),
      makeIP('192.168.99.1/24', 'wlan1'),
    ],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Four addresses across four different interfaces. Each interface group starts collapsed; click a row to expand and see Network/Netmask/Broadcast.',
      },
    },
  },
};

export const StaticAddresses: Story = {
  name: 'Static Addresses Only',
  args: {
    ipAddresses: [
      makeIP('192.168.1.1/24', 'bridge1'),
      makeIP('192.168.1.254/24', 'bridge1'),
      makeIP('10.10.0.1/16', 'ether1'),
    ],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'All addresses are static (no DHCP). Each row renders a blue "Static" badge.',
      },
    },
  },
};

export const DynamicAddresses: Story = {
  name: 'Dynamic (DHCP) Addresses',
  args: {
    ipAddresses: [
      makeIP('203.0.113.42/24', 'ether1', true),
      makeIP('10.0.0.5/30', 'pppoe-out1', true),
    ],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Addresses obtained via DHCP. Each row renders a green "Dynamic" badge. Typical for WAN/PPPoE interfaces.',
      },
    },
  },
};

export const WithDisabledAddresses: Story = {
  name: 'Mixed — Including Disabled Entries',
  args: {
    ipAddresses: [
      makeIP('192.168.88.1/24', 'bridge1'),
      makeIP('192.168.88.2/24', 'bridge1', false, true),
      makeIP('10.0.0.1/30', 'ether1', true),
      makeIP('10.0.0.2/30', 'ether1', false, true),
    ],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled addresses show a grey "Disabled" badge. They are still listed so administrators can see and re-enable them.',
      },
    },
  },
};

export const ManyAddressesPerInterface: Story = {
  name: 'Many Addresses on One Interface',
  args: {
    ipAddresses: [
      makeIP('10.0.1.1/24', 'loopback'),
      makeIP('10.0.2.1/24', 'loopback'),
      makeIP('10.0.3.1/24', 'loopback'),
      makeIP('10.0.4.1/24', 'loopback'),
      makeIP('10.0.5.1/24', 'loopback'),
    ],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Five addresses on a single interface. The interface header badge shows "5 addresses". Expanding reveals all entries in a scrollable list.',
      },
    },
  },
};

export const StartCollapsed: Story = {
  name: 'Starts Collapsed',
  args: {
    ipAddresses: [
      makeIP('192.168.88.1/24', 'bridge1'),
      makeIP('10.0.0.1/30', 'ether1', true),
    ],
    defaultCollapsed: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The outer section header begins collapsed. Click the chevron to reveal the interface groups.',
      },
    },
  },
};

export const EmptyState: Story = {
  name: 'Empty — No IP Addresses',
  args: {
    ipAddresses: [],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no IP addresses are configured the component renders a centred Globe icon with a "No IP addresses configured" message.',
      },
    },
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
