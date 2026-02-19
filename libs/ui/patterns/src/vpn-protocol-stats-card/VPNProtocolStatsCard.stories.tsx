import type { VPNProtocolStats } from '@nasnet/core/types';

import { VPNProtocolStatsCard } from './VPNProtocolStatsCard';

import type { Meta, StoryObj } from '@storybook/react';


const wireguardStats: VPNProtocolStats = {
  protocol: 'wireguard',
  serverCount: 2,
  clientCount: 3,
  activeServerConnections: 8,
  activeClientConnections: 2,
  totalRx: 1_073_741_824, // 1 GB
  totalTx: 536_870_912,   // 512 MB
};

const openvpnStats: VPNProtocolStats = {
  protocol: 'openvpn',
  serverCount: 1,
  clientCount: 2,
  activeServerConnections: 4,
  activeClientConnections: 1,
  totalRx: 2_147_483_648, // 2 GB
  totalTx: 1_073_741_824, // 1 GB
};

const l2tpStats: VPNProtocolStats = {
  protocol: 'l2tp',
  serverCount: 1,
  clientCount: 0,
  activeServerConnections: 0,
  activeClientConnections: 0,
  totalRx: 0,
  totalTx: 0,
};

const ikev2Stats: VPNProtocolStats = {
  protocol: 'ikev2',
  serverCount: 0,
  clientCount: 1,
  activeServerConnections: 0,
  activeClientConnections: 1,
  totalRx: 314_572_800,  // 300 MB
  totalTx: 104_857_600,  // 100 MB
};

const meta: Meta<typeof VPNProtocolStatsCard> = {
  title: 'Patterns/VPNProtocolStatsCard',
  component: VPNProtocolStatsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays statistics for a single VPN protocol: server/client counts, active connections, and cumulative traffic. Supports a compact variant for dashboard use and responds with an active indicator when connections exist.',
      },
    },
  },
  argTypes: {
    compact: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof VPNProtocolStatsCard>;

export const WireGuardActive: Story = {
  args: {
    stats: wireguardStats,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'WireGuard protocol with active server and client connections. The green "Active" indicator appears when any connections are live.',
      },
    },
  },
};

export const OpenVPNActive: Story = {
  args: {
    stats: openvpnStats,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'OpenVPN protocol showing full traffic stats in the non-compact 4-column grid.',
      },
    },
  },
};

export const L2TPInactive: Story = {
  args: {
    stats: l2tpStats,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'L2TP protocol configured but with no active connections and zero traffic. The "Active" indicator is absent.',
      },
    },
  },
};

export const IKEv2ClientOnly: Story = {
  args: {
    stats: ikev2Stats,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'IKEv2 in client-only mode — no servers configured, one active outgoing connection.',
      },
    },
  },
};

export const CompactVariant: Story = {
  args: {
    stats: wireguardStats,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant collapses to a 2-column grid (servers + clients only) and hides the connection-detail footer, suitable for dashboard overviews.',
      },
    },
  },
};

export const Clickable: Story = {
  args: {
    stats: openvpnStats,
    compact: false,
    onClick: () => alert('Navigate to OpenVPN detail'),
  },
  parameters: {
    docs: {
      description: {
        story: 'When an onClick handler is provided the card gains a pointer cursor and a lift hover effect.',
      },
    },
  },
};

export const AllProtocols: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 w-[680px]">
      {([
        wireguardStats,
        openvpnStats,
        l2tpStats,
        ikev2Stats,
        {
          protocol: 'pptp' as const,
          serverCount: 1,
          clientCount: 1,
          activeServerConnections: 3,
          activeClientConnections: 0,
          totalRx: 52_428_800,
          totalTx: 26_214_400,
        },
        {
          protocol: 'sstp' as const,
          serverCount: 0,
          clientCount: 0,
          activeServerConnections: 0,
          activeClientConnections: 0,
          totalRx: 0,
          totalTx: 0,
        },
      ] satisfies VPNProtocolStats[]).map((stats) => (
        <VPNProtocolStatsCard key={stats.protocol} stats={stats} />
      ))}
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'All six supported VPN protocols rendered together, demonstrating the protocol-icon colour system and varying activity levels.',
      },
    },
  },
};
