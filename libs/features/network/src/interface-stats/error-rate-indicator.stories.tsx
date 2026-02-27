/**
 * Storybook stories for ErrorRateIndicator
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * ErrorRateIndicator is a pure presentational component: it takes a numeric
 * error rate, trend direction, and optional threshold and renders the
 * appropriate colour-coded status with a trend icon.  No async data is
 * required, so all stories can render fully without a mock layer.
 */

import { ErrorRateIndicator } from './error-rate-indicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ErrorRateIndicator> = {
  title: 'Features/Network/InterfaceStats/ErrorRateIndicator',
  component: ErrorRateIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Displays interface error rate as a percentage with colour-coded severity and a trend direction icon.

## Status levels
| Status | Condition | Colour |
|--------|-----------|--------|
| Healthy | rate ≤ threshold / 2 | Green |
| Warning | threshold / 2 < rate ≤ threshold | Amber / yellow |
| Error | rate > threshold | Red |

## Trend icons
- **TrendingUp** – error rate is increasing
- **TrendingDown** – error rate is decreasing
- **Minus** – error rate is stable

Default threshold is **0.1 %**. Fully accessible via \`role="status"\` and ARIA labels.
        `,
      },
    },
  },
  argTypes: {
    rate: {
      control: { type: 'number', min: 0, max: 5, step: 0.001 },
      description: 'Error rate as a percentage (e.g. 0.05 = 0.05%)',
    },
    trend: {
      control: { type: 'number', min: -1, max: 1, step: 1 },
      description: 'Trend direction: >0 increasing, <0 decreasing, 0 stable',
    },
    threshold: {
      control: { type: 'number', min: 0, max: 5, step: 0.01 },
      description: 'Warning threshold percentage (default 0.1%)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorRateIndicator>;

/**
 * Healthy – error rate is well below the threshold.
 * Displayed in green with a stable (dash) trend icon.
 */
export const Healthy: Story = {
  args: {
    rate: 0.001,
    trend: 0,
    threshold: 0.1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Green healthy state: rate (0.001%) is well below the 0.1% threshold. ' +
          'Stable Minus icon signals no change in error frequency.',
      },
    },
  },
};

/**
 * Warning – error rate is above threshold/2 but not yet over the threshold.
 * Displayed in amber/yellow with an upward trend icon.
 */
export const Warning: Story = {
  args: {
    rate: 0.065,
    trend: 1,
    threshold: 0.1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Amber warning state: rate (0.065%) exceeds half the threshold (0.05%) but ' +
          'has not yet breached the 0.1% limit. TrendingUp icon urges the operator to watch this link.',
      },
    },
  },
};

/**
 * Error – rate exceeds the threshold.
 * Displayed in red with an upward trend icon.
 */
export const ErrorState: Story = {
  name: 'Error (rate exceeds threshold)',
  args: {
    rate: 0.25,
    trend: 1,
    threshold: 0.1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Red error state: rate (0.25%) has exceeded the 0.1% threshold. ' +
          'Operator should check cable connections and port configuration.',
      },
    },
  },
};

/**
 * Recovering – rate was high but is now trending down; still above threshold.
 * Displayed in red with a downward trend icon signalling active improvement.
 */
export const Recovering: Story = {
  name: 'Recovering (trending down)',
  args: {
    rate: 0.13,
    trend: -1,
    threshold: 0.1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Still in error state but the TrendingDown icon signals that the rate is improving. ' +
          'Useful for monitoring recovery after a transient fault such as a cable reconnection.',
      },
    },
  },
};

/**
 * Custom threshold – useful for high-reliability links where even 0.01%
 * errors should trigger a warning.
 */
export const StrictThreshold: Story = {
  name: 'Strict threshold (0.01%)',
  args: {
    rate: 0.008,
    trend: 0,
    threshold: 0.01,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates per-interface threshold tuning. A rate of 0.008% is already in the ' +
          'warning zone when the threshold is set to 0.01%, useful for carrier-grade or ' +
          'high-reliability backbone links.',
      },
    },
  },
};

/**
 * Zero errors – perfect interface health, ideal baseline display.
 */
export const ZeroErrors: Story = {
  name: 'Zero errors',
  args: {
    rate: 0,
    trend: 0,
    threshold: 0.1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Ideal baseline: 0.000% error rate on a newly provisioned or fully healthy interface.',
      },
    },
  },
};
