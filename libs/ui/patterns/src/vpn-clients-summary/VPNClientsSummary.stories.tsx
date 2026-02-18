import * as React from 'react';
import { useState } from 'react';

import {
  Shield,
  ChevronRight,
  ChevronDown,
  Loader2,
  Wifi,
  Lock,
  Key,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// Mock types and components for Storybook
type VPNProtocol = 'wireguard' | 'openvpn' | 'l2tp' | 'pptp' | 'sstp' | 'ikev2';

interface MockVPNClient {
  id: string;
  name: string;
  protocol: VPNProtocol;
  remoteAddress?: string;
  localAddress?: string;
  uptime?: string;
}

// Mock protocol icon
function MockProtocolIcon({ protocol }: { protocol: VPNProtocol }) {
  const colors: Record<VPNProtocol, string> = {
    wireguard: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    openvpn: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    l2tp: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    pptp: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    sstp: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    ikev2: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[protocol]}`}>
      {protocol === 'wireguard' ? (
        <Lock className="w-4 h-4" />
      ) : (
        <Key className="w-4 h-4" />
      )}
    </div>
  );
}

interface MockVPNClientsSummaryProps {
  connectedCount: number;
  clients?: MockVPNClient[];
  isLoading?: boolean;
  linkTo?: string;
  maxVisible?: number;
  className?: string;
}

function MockVPNClientsSummary({
  connectedCount,
  clients = [],
  isLoading = false,
  linkTo = '/vpn',
  maxVisible = 3,
  className = '',
}: MockVPNClientsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasClients = clients.length > 0;
  const visibleClients = isExpanded ? clients : clients.slice(0, maxVisible);
  const hasMore = clients.length > maxVisible;

  const status = connectedCount > 0 ? 'connected' : 'disconnected';
  const statusColor = status === 'connected' ? 'text-success' : 'text-muted-foreground';
  const bgColor =
    status === 'connected' ? 'bg-success/10 dark:bg-success/20' : 'bg-muted';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}
            >
              <Shield className={`w-5 h-5 ${statusColor}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">VPN Clients</CardTitle>
              <p className={`text-sm ${statusColor} font-medium`}>
                {connectedCount} Connected
              </p>
            </div>
          </div>
          {linkTo && (
            <Button variant="ghost" size="sm" className="gap-1">
              See All
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasClients ? (
          <div className="space-y-2 mt-3">
            {visibleClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 dark:bg-muted/20"
              >
                <MockProtocolIcon protocol={client.protocol} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {client.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {client.localAddress && (
                      <span className="font-mono">{client.localAddress}</span>
                    )}
                    {client.uptime && (
                      <>
                        <span>•</span>
                        <span>{client.uptime}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
                {isExpanded ? 'Show Less' : `Show ${clients.length - maxVisible} More`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Wifi className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No clients connected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const meta: Meta<typeof MockVPNClientsSummary> = {
  title: 'Patterns/VPNClientsSummary',
  component: MockVPNClientsSummary,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A summary card showing VPN client connections with an expandable list. Displays connected count, protocol badges, and client details. Based on the Action-First UX design pattern.',
      },
    },
  },
  argTypes: {
    connectedCount: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of connected clients',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    maxVisible: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Max clients visible before expansion',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockVPNClientsSummary>;

const sampleClients: MockVPNClient[] = [
  {
    id: '1',
    name: 'iPhone-John',
    protocol: 'wireguard',
    localAddress: '10.0.0.2',
    uptime: '2h 15m',
  },
  {
    id: '2',
    name: 'MacBook-Pro',
    protocol: 'wireguard',
    localAddress: '10.0.0.3',
    uptime: '5h 42m',
  },
  {
    id: '3',
    name: 'Office-Desktop',
    protocol: 'openvpn',
    localAddress: '10.0.0.4',
    uptime: '1d 3h',
  },
  {
    id: '4',
    name: 'iPad-Mini',
    protocol: 'wireguard',
    localAddress: '10.0.0.5',
    uptime: '45m',
  },
  {
    id: '5',
    name: 'Android-Tablet',
    protocol: 'openvpn',
    localAddress: '10.0.0.6',
    uptime: '3h 20m',
  },
];

export const Default: Story = {
  args: {
    connectedCount: 3,
    clients: sampleClients.slice(0, 3),
    maxVisible: 3,
  },
};

export const WithExpandableList: Story = {
  args: {
    connectedCount: 5,
    clients: sampleClients,
    maxVisible: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'With more clients than maxVisible, shows expand/collapse button.',
      },
    },
  },
};

export const NoClients: Story = {
  args: {
    connectedCount: 0,
    clients: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no VPN clients are connected.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    connectedCount: 0,
    isLoading: true,
  },
};

export const NoLink: Story = {
  args: {
    connectedCount: 2,
    clients: sampleClients.slice(0, 2),
    linkTo: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Without "See All" link button.',
      },
    },
  },
};

export const MixedProtocols: Story = {
  args: {
    connectedCount: 5,
    clients: [
      { id: '1', name: 'WireGuard-User', protocol: 'wireguard', localAddress: '10.0.0.2', uptime: '2h' },
      { id: '2', name: 'OpenVPN-Client', protocol: 'openvpn', localAddress: '10.0.0.3', uptime: '1h' },
      { id: '3', name: 'L2TP-Device', protocol: 'l2tp', localAddress: '10.0.0.4', uptime: '30m' },
      { id: '4', name: 'IKEv2-Phone', protocol: 'ikev2', localAddress: '10.0.0.5', uptime: '4h' },
      { id: '5', name: 'SSTP-Laptop', protocol: 'sstp', localAddress: '10.0.0.6', uptime: '15m' },
    ],
    maxVisible: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Showing various VPN protocols with different badge colors.',
      },
    },
  },
};

export const InDashboard: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <h2 className="text-lg font-semibold">VPN Overview</h2>
      <MockVPNClientsSummary
        connectedCount={3}
        clients={sampleClients.slice(0, 3)}
        maxVisible={3}
      />
      <div className="p-4 rounded-lg border bg-card text-sm text-muted-foreground">
        Other dashboard cards would go here...
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'VPNClientsSummary in a dashboard context.',
      },
    },
  },
};
