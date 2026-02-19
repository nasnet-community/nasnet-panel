/**
 * Storybook stories for CustomTooltip
 *
 * The custom Recharts tooltip for the BandwidthChart component.
 * Displays the data-point timestamp, TX/RX rates, and cumulative
 * TX/RX byte totals (AC 5.5.3).
 */


import { CustomTooltip } from './CustomTooltip';

import type { CustomTooltipProps } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Recharts-style payload entry.
 */
function makePayload(
  dataKey: 'txRate' | 'rxRate',
  value: number,
  txBytes: number,
  rxBytes: number
) {
  return {
    dataKey,
    value,
    payload: {
      timestamp: Date.now(),
      txRate: dataKey === 'txRate' ? value : 0,
      rxRate: dataKey === 'rxRate' ? value : 0,
      txBytes,
      rxBytes,
    },
  };
}

const NOW = new Date('2025-11-10T14:35:22.000Z').getTime();

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof CustomTooltip> = {
  title: 'Features/Dashboard/BandwidthChart/CustomTooltip',
  component: CustomTooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Custom Recharts tooltip rendered when hovering over the BandwidthChart. ' +
          'Shows the data-point timestamp, TX rate, RX rate, and cumulative TX/RX ' +
          'byte totals. Meets WCAG AAA contrast requirements with a high-contrast ' +
          'mode border variant.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomTooltip>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Typical active tooltip with moderate traffic on both TX and RX. */
export const ActiveWithData: Story = {
  args: {
    active: true,
    label: NOW,
    payload: [
      makePayload('txRate', 2_500_000, 450_000_000, 2_100_000_000),
      makePayload('rxRate', 15_200_000, 450_000_000, 2_100_000_000),
    ],
  } satisfies CustomTooltipProps,
};

/** High-bandwidth gigabit traffic — verifies Gbps / GB formatting. */
export const HighBandwidth: Story = {
  args: {
    active: true,
    label: NOW,
    payload: [
      makePayload('txRate', 8_500_000_000, 3_200_000_000_000, 1_100_000_000_000),
      makePayload('rxRate', 3_200_000_000, 3_200_000_000_000, 1_100_000_000_000),
    ],
  } satisfies CustomTooltipProps,
};

/** Very low traffic — verifies Kbps / KB formatting. */
export const LowBandwidth: Story = {
  args: {
    active: true,
    label: NOW,
    payload: [
      makePayload('txRate', 4_800, 12_000, 38_000),
      makePayload('rxRate', 9_200, 12_000, 38_000),
    ],
  } satisfies CustomTooltipProps,
};

/** Tooltip with zero traffic — both rates display as "0 bps". */
export const ZeroTraffic: Story = {
  args: {
    active: true,
    label: NOW,
    payload: [
      makePayload('txRate', 0, 0, 0),
      makePayload('rxRate', 0, 0, 0),
    ],
  } satisfies CustomTooltipProps,
};

/** Inactive state — tooltip should render nothing (empty output). */
export const Inactive: Story = {
  args: {
    active: false,
    label: NOW,
    payload: [
      makePayload('txRate', 2_500_000, 450_000_000, 2_100_000_000),
      makePayload('rxRate', 15_200_000, 450_000_000, 2_100_000_000),
    ],
  } satisfies CustomTooltipProps,
};

/** Empty payload array — tooltip should render nothing. */
export const EmptyPayload: Story = {
  args: {
    active: true,
    label: NOW,
    payload: [],
  } satisfies CustomTooltipProps,
};
