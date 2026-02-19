/**
 * WAN Card Storybook Stories
 *
 * Interactive documentation and visual testing for the WANCard and WANCardCompact
 * components. Covers all connection types, health states, and status combinations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { WANCard, WANCardCompact } from './WANCard';
import type { WANInterfaceData } from '../../types/wan.types';

// ---------------------------------------------------------------------------
// Shared mock data helpers
// ---------------------------------------------------------------------------

const now = new Date().toISOString();
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

const connectedDHCP: WANInterfaceData = {
  id: 'wan-001',
  interfaceName: 'ether1',
  connectionType: 'DHCP',
  status: 'CONNECTED',
  publicIP: '203.0.113.45',
  gateway: '203.0.113.1',
  primaryDNS: '1.1.1.1',
  secondaryDNS: '1.0.0.1',
  lastConnected: twoHoursAgo,
  isDefaultRoute: true,
  healthStatus: 'HEALTHY',
  healthTarget: '1.1.1.1',
  healthLatency: 12,
  healthEnabled: true,
};

const connectedPPPoE: WANInterfaceData = {
  id: 'wan-002',
  interfaceName: 'pppoe-out1',
  connectionType: 'PPPOE',
  status: 'CONNECTED',
  publicIP: '198.51.100.77',
  gateway: '198.51.100.1',
  primaryDNS: '8.8.8.8',
  secondaryDNS: '8.8.4.4',
  lastConnected: threeDaysAgo,
  isDefaultRoute: false,
  healthStatus: 'DEGRADED',
  healthTarget: '8.8.8.8',
  healthLatency: 240,
  healthEnabled: true,
};

const connectedStatic: WANInterfaceData = {
  id: 'wan-003',
  interfaceName: 'ether2',
  connectionType: 'STATIC_IP',
  status: 'CONNECTED',
  publicIP: '198.51.100.10',
  gateway: '198.51.100.9',
  primaryDNS: '9.9.9.9',
  lastConnected: now,
  isDefaultRoute: true,
  healthStatus: 'HEALTHY',
  healthEnabled: false,
};

const connectedLTE: WANInterfaceData = {
  id: 'wan-004',
  interfaceName: 'lte1',
  connectionType: 'LTE',
  status: 'CONNECTED',
  publicIP: '100.72.44.12',
  gateway: '100.72.44.1',
  primaryDNS: '1.1.1.1',
  lastConnected: twoHoursAgo,
  isDefaultRoute: false,
  healthStatus: 'HEALTHY',
  healthTarget: '1.1.1.1',
  healthLatency: 55,
  healthEnabled: true,
};

const disconnectedWAN: WANInterfaceData = {
  id: 'wan-005',
  interfaceName: 'ether1',
  connectionType: 'DHCP',
  status: 'DISCONNECTED',
  lastConnected: threeDaysAgo,
  isDefaultRoute: false,
  healthStatus: 'DOWN',
  healthTarget: '1.1.1.1',
  healthEnabled: true,
};

const connectingWAN: WANInterfaceData = {
  id: 'wan-006',
  interfaceName: 'pppoe-out2',
  connectionType: 'PPPOE',
  status: 'CONNECTING',
  isDefaultRoute: false,
  healthStatus: 'UNKNOWN',
  healthEnabled: false,
};

const errorWAN: WANInterfaceData = {
  id: 'wan-007',
  interfaceName: 'ether3',
  connectionType: 'STATIC_IP',
  status: 'ERROR',
  lastConnected: threeDaysAgo,
  isDefaultRoute: false,
  healthStatus: 'DOWN',
  healthTarget: '8.8.8.8',
  healthEnabled: true,
};

// ---------------------------------------------------------------------------
// WANCard stories
// ---------------------------------------------------------------------------

const meta: Meta<typeof WANCard> = {
  title: 'Features/Network/WAN/WANCard',
  component: WANCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Composite card showing WAN interface status, connection type, health, IP details,
and uptime at a glance. Supports four connection types (DHCP, PPPoE, Static IP, LTE)
and five connection states (CONNECTED, CONNECTING, DISCONNECTED, ERROR, DISABLED).

## Exported components
- **WANCard** - Full card with all details, used in desktop/tablet views
- **WANCardCompact** - Condensed row layout for mobile views

## Click behaviour
When \`onViewDetails\` is provided the entire card becomes clickable (shows
\`cursor-pointer\` and hover shadow). \`onConfigure\` renders a small "Configure"
link that fires without bubbling to the card click handler.
        `,
      },
    },
  },
  argTypes: {
    onConfigure: { action: 'configure clicked' },
    onViewDetails: { action: 'view details clicked' },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WANCard>;

/**
 * ConnectedDHCP - healthy DHCP connection with health check active.
 */
export const ConnectedDHCP: Story = {
  args: {
    wan: connectedDHCP,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
};

/**
 * ConnectedPPPoE - PPPoE connection with degraded health (high latency).
 */
export const ConnectedPPPoE: Story = {
  args: {
    wan: connectedPPPoE,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'PPPoE WAN with degraded health status (240ms latency). The health badge turns amber to alert the operator.',
      },
    },
  },
};

/**
 * ConnectedStaticIP - static IP WAN without health monitoring enabled.
 */
export const ConnectedStaticIP: Story = {
  args: {
    wan: connectedStatic,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Static IP WAN with health monitoring disabled. No health status badge is shown, only the connection type and IP information.',
      },
    },
  },
};

/**
 * ConnectedLTE - LTE backup WAN with health check active.
 */
export const ConnectedLTE: Story = {
  args: {
    wan: connectedLTE,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'LTE WAN configured as a non-default secondary link. The LTE badge uses a TrendingUp icon to distinguish it from Ethernet connections.',
      },
    },
  },
};

/**
 * Disconnected - WAN link down with last-connected timestamp.
 */
export const Disconnected: Story = {
  args: {
    wan: disconnectedWAN,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'WAN is disconnected. No IP information is shown. The card displays a "Not connected" row and the relative time since last connection.',
      },
    },
  },
};

/**
 * Connecting - WAN dial-up in progress (intermediate state).
 */
export const Connecting: Story = {
  args: {
    wan: connectingWAN,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'PPPoE connection is currently being established. No IP or health data is available yet.',
      },
    },
  },
};

/**
 * ErrorState - WAN in error state (e.g. authentication failure).
 */
export const ErrorState: Story = {
  args: {
    wan: errorWAN,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'WAN is in an ERROR state — typically caused by a wrong static IP, unreachable gateway, or PPPoE auth failure.',
      },
    },
  },
};

/**
 * ReadOnly - card without action buttons (display-only).
 */
export const ReadOnly: Story = {
  args: {
    wan: connectedDHCP,
    // onConfigure and onViewDetails intentionally omitted
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card rendered without action callbacks. The Configure link and card click handler are both absent. Suitable for read-only dashboards.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// WANCardCompact stories (separate meta block)
// ---------------------------------------------------------------------------

export const CompactConnected: Story = {
  render: (args) => <WANCardCompact {...args} />,
  args: {
    wan: connectedDHCP,
    onConfigure: (id) => console.log('Configure', id),
    onViewDetails: (id) => console.log('View details', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'WANCardCompact layout for mobile views. Shows interface name, status badge, public IP, and connection type in a compact row.',
      },
    },
  },
};

export const CompactDisconnected: Story = {
  render: (args) => <WANCardCompact {...args} />,
  args: {
    wan: disconnectedWAN,
    onConfigure: (id) => console.log('Configure', id),
  },
  parameters: {
    docs: {
      description: {
        story:
          'WANCardCompact for a disconnected WAN. No public IP row is rendered.',
      },
    },
  },
};
