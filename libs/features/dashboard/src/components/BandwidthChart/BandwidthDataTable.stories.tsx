/**
 * Storybook stories for BandwidthDataTable
 * Accessible screen-reader alternative to the BandwidthChart canvas
 */

import { BandwidthDataTable } from './BandwidthDataTable';

import type { BandwidthDataPoint } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

/** Generate a sequence of bandwidth data points starting from `startMs`. */
function generatePoints(
  count: number,
  startMs: number,
  txRateBase: number,
  rxRateBase: number
): BandwidthDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: startMs + i * 2_000,
    txRate: txRateBase + Math.floor(Math.sin(i / 5) * txRateBase * 0.2),
    rxRate: rxRateBase + Math.floor(Math.cos(i / 5) * rxRateBase * 0.15),
    txBytes: 400_000_000 + i * txRateBase * 2,
    rxBytes: 2_000_000_000 + i * rxRateBase * 2,
  }));
}

const now = Date.now();

const fiveMinPoints = generatePoints(150, now - 5 * 60 * 1_000, 1_200_000, 10_000_000);
const oneHourPoints = generatePoints(60, now - 60 * 60 * 1_000, 1_500_000, 12_000_000);
const twentyFourHourPoints = generatePoints(288, now - 24 * 60 * 60 * 1_000, 2_000_000, 18_000_000);
const highTrafficPoints = generatePoints(30, now - 60_000, 90_000_000, 800_000_000);

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof BandwidthDataTable> = {
  title: 'Features/Dashboard/BandwidthDataTable',
  component: BandwidthDataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accessible data table that provides a screen-reader-friendly alternative to the BandwidthChart ' +
          'canvas. By default the component is visually hidden (`sr-only`) so it does not clutter the UI, ' +
          'but it is fully announced to assistive technologies. Add `data-visible="true"` on the wrapper ' +
          'to make it visible for users who prefer tabular data. ' +
          'Columns: Timestamp, TX Rate, RX Rate, TX Total, RX Total. ' +
          'Large datasets are trimmed to the latest 50 points to keep the table manageable.',
      },
    },
  },
  decorators: [
    (Story) => (
      // Force visible so the table renders in Storybook canvas
      <div
        data-visible="true"
        style={{ maxWidth: '900px' }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BandwidthDataTable>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default — 5-minute real-time data (150 points, trimmed to 50 displayed).
 */
export const Default: Story = {
  args: {
    dataPoints: fiveMinPoints,
    timeRange: '5m',
  },
  parameters: {
    docs: {
      description: {
        story:
          '150 raw 2-second data points for the 5-minute time range. ' +
          'The component displays the latest 50 and notes the remainder in the caption.',
      },
    },
  },
};

/**
 * One-hour view with 1-minute averaged data.
 */
export const OneHour: Story = {
  args: {
    dataPoints: oneHourPoints,
    timeRange: '1h',
  },
  parameters: {
    docs: {
      description: {
        story: '60 data points (1-minute averages) covering one hour of bandwidth history.',
      },
    },
  },
};

/**
 * Twenty-four-hour view with 5-minute averaged data.
 */
export const TwentyFourHours: Story = {
  args: {
    dataPoints: twentyFourHourPoints,
    timeRange: '24h',
  },
  parameters: {
    docs: {
      description: {
        story:
          '288 data points (5-minute averages) covering 24 hours. ' +
          'Only the latest 50 are shown; the caption indicates the full count.',
      },
    },
  },
};

/**
 * High-traffic scenario — TX and RX rates near router capacity.
 */
export const HighTraffic: Story = {
  args: {
    dataPoints: highTrafficPoints,
    timeRange: '5m',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Near-capacity traffic: TX ~90 Mbps, RX ~800 Mbps. ' +
          'Formatted values should use Gbps/Mbps automatically via formatBitrate.',
      },
    },
  },
};

/**
 * Empty state — no data points available.
 */
export const Empty: Story = {
  args: {
    dataPoints: [],
    timeRange: '5m',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Zero data points. The table body is empty but the header and caption are still rendered ' +
          'so screen readers can announce the context.',
      },
    },
  },
};

/**
 * Single row — exactly one data point.
 */
export const SingleRow: Story = {
  args: {
    dataPoints: [
      {
        timestamp: now,
        txRate: 512_000,
        rxRate: 4_096_000,
        txBytes: 134_217_728,
        rxBytes: 1_073_741_824,
      },
    ],
    timeRange: '5m',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Minimal dataset with a single data point. Verifies the table renders correctly without looping.',
      },
    },
  },
};
