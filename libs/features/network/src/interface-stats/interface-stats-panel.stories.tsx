/**
 * Storybook stories for InterfaceStatsPanel
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * InterfaceStatsPanel is a headless + platform-presenter component (ADR-018)
 * that auto-selects InterfaceStatsPanelDesktop or InterfaceStatsPanelMobile
 * based on the current viewport.  Stories cover prop combinations and both
 * explicit presenter variants.
 *
 * The component fetches data via useInterfaceStatsPanel (Apollo + subscription).
 * A MockedProvider decorator provides the necessary GraphQL mock context so the
 * panel renders its loading/error/data states correctly in Storybook.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { GET_INTERFACE_STATS, INTERFACE_STATS_UPDATED } from '@nasnet/api-client/queries';

import {
  InterfaceStatsPanel,
  InterfaceStatsPanelDesktop,
  InterfaceStatsPanelMobile,
} from './interface-stats-panel';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock GraphQL data
// ---------------------------------------------------------------------------

const mockStats = {
  txBytes: '15728640000', // ~15 GB
  rxBytes: '52428800000', // ~52 GB
  txPackets: '12500000',
  rxPackets: '41000000',
  txErrors: 2,
  rxErrors: 0,
  txDrops: 5,
  rxDrops: 1,
  __typename: 'InterfaceStats',
};

const mockHighErrorStats = {
  txBytes: '1048576000',
  rxBytes: '2097152000',
  txPackets: '800000',
  rxPackets: '1600000',
  txErrors: 1500,
  rxErrors: 820,
  txDrops: 300,
  rxDrops: 150,
  __typename: 'InterfaceStats',
};

function buildStatsMock(interfaceId: string, stats: typeof mockStats = mockStats) {
  return [
    {
      request: {
        query: GET_INTERFACE_STATS,
        variables: { routerId: 'router-001', interfaceId },
      },
      result: {
        data: {
          interface: {
            id: interfaceId,
            name: interfaceId,
            statistics: stats,
            __typename: 'Interface',
          },
        },
      },
    },
    {
      request: {
        query: INTERFACE_STATS_UPDATED,
        variables: { routerId: 'router-001', interfaceId, interval: '5s' },
      },
      result: {
        data: { interfaceStatsUpdated: stats },
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceStatsPanel> = {
  title: 'Features/Network/InterfaceStats/InterfaceStatsPanel',
  component: InterfaceStatsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Displays real-time interface statistics with platform-specific UI following the
**Headless + Platform Presenters** pattern (ADR-018).

## Data displayed
- TX / RX bytes and packets (cumulative counters)
- Calculated bandwidth rates (bytes/s → bits/s with auto-scaling unit)
- TX / RX error and drop counts
- Error rate percentage with threshold-based colour coding

## Platform presenters
| Platform | Trigger | Layout |
|----------|---------|--------|
| Desktop | > 1024 px | Dense 4-column grid, full bandwidth rate cards |
| Mobile | < 640 px | Card-based list, 44 px touch targets |

Data is fetched via the \`useInterfaceStatsPanel\` headless hook using
\`useInterfaceStatsQuery\` (initial snapshot) and \`useInterfaceStatsSubscription\`
(real-time updates).
        `,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <MockedProvider
        mocks={context.parameters['apolloMocks'] ?? buildStatsMock('ether1')}
        addTypename={true}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  args: {
    routerId: 'router-001',
    interfaceId: 'ether1',
    interfaceName: 'ether1 – WAN',
    pollingInterval: '5s',
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceStatsPanel>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Platform-adaptive panel for the primary WAN interface.
 * Renders Desktop presenter on wide viewports, Mobile on narrow viewports.
 */
export const Default: Story = {
  args: {},
  parameters: {
    apolloMocks: buildStatsMock('ether1'),
    docs: {
      description: {
        story:
          'Primary WAN interface with healthy stats: ~15 GB TX, ~52 GB RX, 2 TX errors only. ' +
          'Platform auto-detection chooses Desktop or Mobile presenter based on viewport width.',
      },
    },
  },
};

/**
 * LAN bridge interface with a longer display name.
 */
export const LanBridgeInterface: Story = {
  name: 'LAN bridge interface',
  args: {
    interfaceId: 'bridge-lan',
    interfaceName: 'bridge-lan – Local Network',
  },
  parameters: {
    apolloMocks: buildStatsMock('bridge-lan'),
    docs: {
      description: {
        story:
          'Bridge interface variant showing the same stats layout with a different interface name.',
      },
    },
  },
};

/**
 * High error rate scenario — triggers the red warning banner and error-rate
 * indicator in error state.
 */
export const HighErrorRate: Story = {
  name: 'High error rate (warning)',
  args: {
    interfaceId: 'ether3',
    interfaceName: 'ether3 – Degraded Link',
  },
  parameters: {
    apolloMocks: buildStatsMock('ether3', mockHighErrorStats),
    docs: {
      description: {
        story:
          'Simulates a degraded link with significant TX/RX errors and drops. ' +
          'The panel shows the red "Interface has errors" banner and the ErrorRateIndicator in error state.',
      },
    },
  },
};

/**
 * Desktop presenter rendered directly — for visual regression tests at a
 * fixed wide viewport regardless of Storybook's current breakpoint.
 */
export const DesktopPresenter: Story = {
  name: 'Desktop presenter (explicit)',
  render: (args) => <InterfaceStatsPanelDesktop {...args} />,
  args: {
    interfaceName: 'ether1 – WAN',
  },
  parameters: {
    apolloMocks: buildStatsMock('ether1'),
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Forces the Desktop presenter regardless of actual viewport. ' +
          'Useful for visual regression tests and design review at a fixed wide layout.',
      },
    },
  },
};

/**
 * Mobile presenter rendered directly — for visual regression tests at a
 * fixed narrow viewport.
 */
export const MobilePresenter: Story = {
  name: 'Mobile presenter (explicit)',
  render: (args) => <InterfaceStatsPanelMobile {...args} />,
  args: {
    interfaceName: 'ether1 – WAN',
  },
  parameters: {
    apolloMocks: buildStatsMock('ether1'),
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Forces the Mobile presenter (< 640 px). ' +
          'Card-based layout with 44 px touch targets optimised for field use.',
      },
    },
  },
};

/**
 * Slow polling interval — 30 s refresh, suitable for bandwidth-constrained
 * management links or metered LTE uplinks.
 */
export const SlowPolling: Story = {
  name: 'Slow polling (30 s)',
  args: {
    pollingInterval: '30s',
    interfaceId: 'lte1',
    interfaceName: 'lte1 – LTE Backup',
  },
  parameters: {
    apolloMocks: buildStatsMock('lte1'),
    docs: {
      description: {
        story:
          'Uses a 30-second polling interval instead of the default 5 s. ' +
          'Reduces traffic on metered or rate-limited management connections.',
      },
    },
  },
};
