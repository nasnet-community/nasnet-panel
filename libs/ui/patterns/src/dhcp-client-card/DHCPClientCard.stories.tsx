import type { DHCPClient } from '@nasnet/core/types';

import { DHCPClientCard } from './DHCPClientCard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const boundClient: DHCPClient = {
  id: 'dhcp-client-1',
  interface: 'ether1-wan',
  status: 'bound',
  address: '203.0.113.42/24',
  gateway: '203.0.113.1',
  primaryDns: '8.8.8.8',
  secondaryDns: '8.8.4.4',
  dhcpServer: '203.0.113.1',
  expiresAfter: '23h45m12s',
  disabled: false,
};

const boundClientNoDns2: DHCPClient = {
  id: 'dhcp-client-2',
  interface: 'sfp1-wan',
  status: 'bound',
  address: '192.0.2.88/30',
  gateway: '192.0.2.89',
  primaryDns: '1.1.1.1',
  dhcpServer: '192.0.2.89',
  expiresAfter: '5m30s',
  disabled: false,
};

const searchingClient: DHCPClient = {
  id: 'dhcp-client-3',
  interface: 'lte1',
  status: 'searching',
  disabled: false,
};

const requestingClient: DHCPClient = {
  id: 'dhcp-client-4',
  interface: 'pppoe-out1',
  status: 'requesting',
  disabled: false,
};

const stoppedClient: DHCPClient = {
  id: 'dhcp-client-5',
  interface: 'ether2-backup',
  status: 'stopped',
  disabled: false,
};

const disabledClient: DHCPClient = {
  id: 'dhcp-client-6',
  interface: 'ether3-failover',
  status: 'stopped',
  disabled: true,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DHCPClientCard> = {
  title: 'Patterns/DHCPClientCard',
  component: DHCPClientCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Shows the WAN DHCP client status for a single interface. The card adapts its body based on status: "bound" displays full lease details (IP, gateway, DNS, server, expiry), "searching" and "requesting" show an animated spinner, and "stopped" or disabled show a simple text placeholder.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPClientCard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Bound: Story = {
  args: {
    client: boundClient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully bound WAN client showing IP address, gateway, primary and secondary DNS, DHCP server address, and lease expiry time.',
      },
    },
  },
};

export const BoundSingleDns: Story = {
  args: {
    client: boundClientNoDns2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bound client with only a primary DNS — the "Secondary DNS" row is omitted from the card.',
      },
    },
  },
};

export const Searching: Story = {
  args: {
    client: searchingClient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'LTE interface actively searching for a DHCP server — displays a spinner with the text "Searching for DHCP server...".',
      },
    },
  },
};

export const Requesting: Story = {
  args: {
    client: requestingClient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Client found a DHCP server and is now requesting an address — spinner remains visible with "Requesting IP address...".',
      },
    },
  },
};

export const Stopped: Story = {
  args: {
    client: stoppedClient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'DHCP client is configured but stopped (e.g. manually halted). A short text placeholder is shown instead of lease details.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    client: disabledClient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'DHCP client is disabled at the interface level — the placeholder reads "DHCP Client Disabled".',
      },
    },
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="grid w-[360px] grid-cols-1 gap-4">
      <DHCPClientCard client={boundClient} />
      <DHCPClientCard client={searchingClient} />
      <DHCPClientCard client={requestingClient} />
      <DHCPClientCard client={stoppedClient} />
      <DHCPClientCard client={disabledClient} />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'All five status variants stacked to compare the card body behaviour across every possible DHCP client state.',
      },
    },
  },
};
