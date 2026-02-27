import { VPNStatusHero } from './VPNStatusHero';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNStatusHero> = {
  title: 'Patterns/VPNStatusHero',
  component: VPNStatusHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Large hero status card showing overall VPN infrastructure health. Displays status (healthy/warning/critical/loading), total servers/clients, active connections, and cumulative traffic. Includes animated status icon.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['healthy', 'warning', 'critical', 'loading'],
    },
    totalServers: { control: 'number' },
    totalClients: { control: 'number' },
    activeServerConnections: { control: 'number' },
    activeClientConnections: { control: 'number' },
    totalRx: { control: 'number' },
    totalTx: { control: 'number' },
    issueCount: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof VPNStatusHero>;

export const HealthyStatus: Story = {
  args: {
    status: 'healthy',
    totalServers: 5,
    totalClients: 12,
    activeServerConnections: 18,
    activeClientConnections: 8,
    totalRx: 10_737_418_240,
    totalTx: 5_368_709_120,
    issueCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'VPN infrastructure is healthy. Status hero shows green background with animated pulse icon.',
      },
    },
  },
};

export const WarningStatus: Story = {
  args: {
    status: 'warning',
    totalServers: 5,
    totalClients: 12,
    activeServerConnections: 8,
    activeClientConnections: 2,
    totalRx: 5_368_709_120,
    totalTx: 2_684_354_560,
    issueCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Some VPN connections need attention. Amber background with alert icon shows number of issues.',
      },
    },
  },
};

export const CriticalStatus: Story = {
  args: {
    status: 'critical',
    totalServers: 3,
    totalClients: 8,
    activeServerConnections: 0,
    activeClientConnections: 0,
    totalRx: 1_073_741_824,
    totalTx: 536_870_912,
    issueCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'VPN infrastructure has errors. Red background with error icon displays multiple issues.',
      },
    },
  },
};

export const LoadingStatus: Story = {
  args: {
    status: 'loading',
    totalServers: 0,
    totalClients: 0,
    activeServerConnections: 0,
    activeClientConnections: 0,
    totalRx: 0,
    totalTx: 0,
    issueCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading VPN status. Muted background with spinning loader icon.',
      },
    },
  },
};

export const SingleIssue: Story = {
  args: {
    status: 'warning',
    totalServers: 2,
    totalClients: 4,
    activeServerConnections: 6,
    activeClientConnections: 2,
    totalRx: 2_147_483_648,
    totalTx: 1_073_741_824,
    issueCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single issue scenario — "1 issue found" singular form.',
      },
    },
  },
};

export const NoConnections: Story = {
  args: {
    status: 'critical',
    totalServers: 3,
    totalClients: 5,
    activeServerConnections: 0,
    activeClientConnections: 0,
    totalRx: 0,
    totalTx: 0,
    issueCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'All servers/clients configured but none active and no traffic — critical state.',
      },
    },
  },
};

export const HighLoad: Story = {
  args: {
    status: 'healthy',
    totalServers: 10,
    totalClients: 50,
    activeServerConnections: 128,
    activeClientConnections: 42,
    totalRx: 1_099_511_627_776,
    totalTx: 549_755_813_888,
    issueCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'High-load production environment with significant traffic volume.',
      },
    },
  },
};
