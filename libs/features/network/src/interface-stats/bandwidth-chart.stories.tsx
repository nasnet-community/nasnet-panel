/**
 * Storybook stories for BandwidthChart
 * NAS-6.9: Implement Interface Traffic Statistics (Task 5)
 *
 * BandwidthChart fetches historical bandwidth data via
 * useInterfaceStatsHistoryQuery (Apollo Client).  Stories demonstrate the
 * full range of prop combinations.  A mock GraphQL layer (MockedProvider or
 * MSW addon) is required to return chart data; without it the component
 * renders its built-in empty-state UI.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { BandwidthChart } from './bandwidth-chart';
import { GET_INTERFACE_STATS_HISTORY } from '@nasnet/api-client/queries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTimeRange(hoursBack: number) {
  const now = new Date();
  return {
    start: new Date(now.getTime() - hoursBack * 60 * 60 * 1000).toISOString(),
    end: now.toISOString(),
  };
}

/** Build synthetic bandwidth data points for a time window */
function makeMockDataPoints(
  hoursBack: number,
  intervalMinutes: number,
  peakTxMbps = 80,
  peakRxMbps = 45
) {
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  const totalMs = hoursBack * 60 * 60 * 1000;
  const count = Math.floor(totalMs / intervalMs);

  return Array.from({ length: count }, (_, i) => {
    const progress = i / count;
    // Simulate a realistic traffic curve with peak around midday
    const txLoad = Math.sin(progress * Math.PI) * peakTxMbps;
    const rxLoad = Math.sin(progress * Math.PI * 0.9) * peakRxMbps;
    const noise = () => (Math.random() - 0.5) * 5;
    return {
      timestamp: new Date(now - totalMs + i * intervalMs).toISOString(),
      txBytesPerSec: Math.max(0, Math.round((txLoad + noise()) * 125_000)), // Mbps → B/s
      rxBytesPerSec: Math.max(0, Math.round((rxLoad + noise()) * 125_000)),
      txPacketsPerSec: Math.max(0, Math.round(txLoad * 900)),
      rxPacketsPerSec: Math.max(0, Math.round(rxLoad * 700)),
      txErrors: 0,
      rxErrors: 0,
      __typename: 'InterfaceStatsDataPoint' as const,
    };
  });
}

function buildMock(
  interfaceId: string,
  timeRange: { start: string; end: string },
  interval: string,
  hoursBack: number,
  intervalMinutes: number
) {
  return {
    request: {
      query: GET_INTERFACE_STATS_HISTORY,
      variables: {
        routerId: 'router-001',
        interfaceId,
        timeRange,
        interval,
      },
    },
    result: {
      data: {
        interfaceStatsHistory: {
          interfaceId,
          interval,
          startTime: timeRange.start,
          endTime: timeRange.end,
          dataPoints: makeMockDataPoints(hoursBack, intervalMinutes),
          __typename: 'InterfaceStatsHistory',
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Shared time ranges
// ---------------------------------------------------------------------------

const range24h = makeTimeRange(24);
const range1h = makeTimeRange(1);
const range7d = makeTimeRange(7 * 24);
const range6h = makeTimeRange(6);

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof BandwidthChart> = {
  title: 'Features/Network/InterfaceStats/BandwidthChart',
  component: BandwidthChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Historical bandwidth visualization for a router interface.

Renders a **Recharts LineChart** with:
- TX (upload) and RX (download) bandwidth lines
- Peak value markers (ReferenceDot)
- Zoom/pan brush control
- Interactive tooltip with precise values formatted as bps / Kbps / Mbps / Gbps
- Responsive container (fills parent width)

Data is fetched from the GraphQL API via \`useInterfaceStatsHistoryQuery\`.
Combine with \`TimeRangeSelector\` to let users switch between time windows.
        `,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <MockedProvider
        mocks={context.parameters['apolloMocks'] ?? []}
        addTypename={true}
      >
        <div style={{ width: '800px' }}>
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  args: {
    routerId: 'router-001',
    interfaceId: 'ether1',
    interfaceName: 'ether1 – WAN',
    timeRange: range24h,
    interval: '5m',
    showLegend: true,
  },
};

export default meta;
type Story = StoryObj<typeof BandwidthChart>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default view: last 24 hours at 5-minute resolution with TX/RX legend.
 * Mocked data simulates realistic daytime traffic curve peaking at ~80 Mbps TX.
 */
export const Default: Story = {
  args: {},
  parameters: {
    apolloMocks: [buildMock('ether1', range24h, '5m', 24, 5)],
    docs: {
      description: {
        story:
          'Primary view: 24-hour window at 5-minute intervals. Realistic traffic curve ' +
          'with peak TX ~80 Mbps and peak RX ~45 Mbps. Peak markers shown at highest values.',
      },
    },
  },
};

/**
 * Last 1 hour at 1-minute resolution – high-frequency, short window.
 * Useful when investigating a current incident.
 */
export const LastOneHour: Story = {
  name: 'Last 1 hour (1 min interval)',
  args: {
    timeRange: range1h,
    interval: '1m',
    interfaceName: 'ether1 – WAN',
  },
  parameters: {
    apolloMocks: [buildMock('ether1', range1h, '1m', 1, 1)],
    docs: {
      description: {
        story:
          'Short high-resolution window (60 data points at 1 min). Ideal when ' +
          'investigating a live incident — shows the last 60 minutes in fine detail.',
      },
    },
  },
};

/**
 * Last 7 days at 1-hour resolution – useful for weekly traffic pattern analysis.
 */
export const LastSevenDays: Story = {
  name: 'Last 7 days (1 h interval)',
  args: {
    timeRange: range7d,
    interval: '1h',
    interfaceName: 'ether1 – WAN',
  },
  parameters: {
    apolloMocks: [buildMock('ether1', range7d, '1h', 7 * 24, 60)],
    docs: {
      description: {
        story:
          'Weekly view (168 data points at 1 h intervals). Identifies recurring ' +
          'traffic patterns such as business-hours peaks or weekend lulls.',
      },
    },
  },
};

/**
 * Legend hidden – compact view suitable for embedding inside a dashboard widget.
 */
export const NoLegend: Story = {
  name: 'Without legend',
  args: {
    showLegend: false,
  },
  parameters: {
    apolloMocks: [buildMock('ether1', range24h, '5m', 24, 5)],
    docs: {
      description: {
        story:
          'Hides the TX / RX legend below the chart. Saves vertical space when ' +
          'the chart is embedded inside a widget that provides its own legend.',
      },
    },
  },
};

/**
 * LTE backup interface – different interface ID, 6-hour window.
 * Simulates lower but stable traffic typical of a mobile backup link.
 */
export const LteInterface: Story = {
  name: 'LTE backup interface',
  args: {
    interfaceId: 'lte1',
    interfaceName: 'lte1 – LTE Backup',
    timeRange: range6h,
    interval: '5m',
  },
  parameters: {
    apolloMocks: [buildMock('lte1', range6h, '5m', 6, 5)],
    docs: {
      description: {
        story:
          'Secondary interface view. LTE links typically run at lower peak throughput ' +
          '(capped by carrier); the chart correctly scales the Y-axis accordingly.',
      },
    },
  },
};

/**
 * Empty data state – when the selected time range has no stored data points.
 * Renders the dashed empty-state placeholder instead of a chart.
 */
export const EmptyState: Story = {
  name: 'Empty state (no data)',
  args: {
    timeRange: makeTimeRange(0.5), // 30 min window with no data
    interval: '1m',
  },
  parameters: {
    apolloMocks: [
      {
        request: {
          query: GET_INTERFACE_STATS_HISTORY,
          variables: {
            routerId: 'router-001',
            interfaceId: 'ether1',
            timeRange: makeTimeRange(0.5),
            interval: '1m',
          },
        },
        result: {
          data: {
            interfaceStatsHistory: {
              interfaceId: 'ether1',
              interval: '1m',
              startTime: makeTimeRange(0.5).start,
              endTime: makeTimeRange(0.5).end,
              dataPoints: [],
              __typename: 'InterfaceStatsHistory',
            },
          },
        },
      },
    ],
    docs: {
      description: {
        story:
          'Renders the built-in empty-state placeholder ("No data available for the selected time range") ' +
          'when the API returns zero data points.',
      },
    },
  },
};
