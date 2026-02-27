import * as React from 'react';

import { Network, Users, ChevronRight, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// Mock DHCPSummaryCard for Storybook since it depends on TanStack Router
interface MockDHCPSummaryCardProps {
  activeLeases: number;
  totalCapacity?: number;
  ipRange?: string;
  serverName?: string;
  isLoading?: boolean;
  linkTo?: string;
  className?: string;
}

function MockDHCPSummaryCard({
  activeLeases,
  totalCapacity,
  ipRange,
  serverName = 'DHCP Server',
  isLoading = false,
  linkTo = '/dhcp',
  className = '',
}: MockDHCPSummaryCardProps) {
  return (
    <Card
      className={`h-full transition-all duration-200 ${linkTo ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-info/10 dark:bg-info/20 flex h-8 w-8 items-center justify-center rounded-lg">
              <Network className="text-info h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">{serverName}</CardTitle>
          </div>
          {linkTo && <ChevronRight className="text-muted-foreground h-4 w-4" />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ?
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        : <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Users className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-foreground text-2xl font-bold">
                  {activeLeases}
                  {totalCapacity && (
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                      / {totalCapacity}
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">Active Leases</p>
              </div>
            </div>

            {ipRange && (
              <div className="border-border border-t pt-2">
                <p className="text-muted-foreground text-xs">IP Range</p>
                <p
                  className="text-foreground truncate font-mono text-sm"
                  title={ipRange}
                >
                  {ipRange}
                </p>
              </div>
            )}
          </div>
        }
      </CardContent>
    </Card>
  );
}

const meta: Meta<typeof MockDHCPSummaryCard> = {
  title: 'Patterns/DHCPSummaryCard',
  component: MockDHCPSummaryCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A compact card showing DHCP server status with active lease count and IP range. Links to the full DHCP management page. Based on the Action-First UX design pattern.',
      },
    },
  },
  argTypes: {
    activeLeases: {
      control: { type: 'number', min: 0, max: 254 },
      description: 'Number of active DHCP leases',
    },
    totalCapacity: {
      control: { type: 'number', min: 0, max: 254 },
      description: 'Total lease capacity',
    },
    ipRange: {
      control: 'text',
      description: 'IP address range',
    },
    serverName: {
      control: 'text',
      description: 'DHCP server name',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    linkTo: {
      control: 'text',
      description: 'Link destination',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockDHCPSummaryCard>;

export const Default: Story = {
  args: {
    activeLeases: 24,
    totalCapacity: 100,
    ipRange: '192.168.1.100-192.168.1.200',
    serverName: 'DHCP Server',
  },
};

export const HighUtilization: Story = {
  args: {
    activeLeases: 95,
    totalCapacity: 100,
    ipRange: '192.168.1.100-192.168.1.200',
    serverName: 'Primary DHCP',
  },
  parameters: {
    docs: {
      description: {
        story: 'DHCP server with high utilization (95% capacity).',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    activeLeases: 0,
    isLoading: true,
    serverName: 'DHCP Server',
  },
};

export const NoCapacity: Story = {
  args: {
    activeLeases: 12,
    ipRange: '10.0.0.50-10.0.0.150',
    serverName: 'Office DHCP',
  },
  parameters: {
    docs: {
      description: {
        story: 'Without total capacity shown (just active count).',
      },
    },
  },
};

export const NoLink: Story = {
  args: {
    activeLeases: 8,
    totalCapacity: 50,
    ipRange: '192.168.2.100-192.168.2.150',
    serverName: 'Guest Network',
    linkTo: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card without navigation link (no chevron, no hover effects).',
      },
    },
  },
};

export const MultipleServers: Story = {
  render: () => (
    <div className="grid w-[500px] grid-cols-2 gap-4">
      <MockDHCPSummaryCard
        activeLeases={45}
        totalCapacity={100}
        ipRange="192.168.1.100-192.168.1.200"
        serverName="Main Network"
      />
      <MockDHCPSummaryCard
        activeLeases={12}
        totalCapacity={50}
        ipRange="192.168.2.100-192.168.2.150"
        serverName="Guest Network"
      />
      <MockDHCPSummaryCard
        activeLeases={8}
        totalCapacity={30}
        ipRange="10.0.0.100-10.0.0.130"
        serverName="IoT Network"
      />
      <MockDHCPSummaryCard
        activeLeases={3}
        totalCapacity={20}
        ipRange="172.16.0.100-172.16.0.120"
        serverName="Management"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard view with multiple DHCP server cards.',
      },
    },
  },
};

export const InDashboard: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <h2 className="text-lg font-semibold">Network Overview</h2>
      <MockDHCPSummaryCard
        activeLeases={24}
        totalCapacity={100}
        ipRange="192.168.1.100-192.168.1.200"
        serverName="DHCP Server"
      />
      <div className="bg-card text-muted-foreground rounded-lg border p-4 text-sm">
        Other dashboard cards would go here...
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'DHCPSummaryCard in a dashboard context.',
      },
    },
  },
};
