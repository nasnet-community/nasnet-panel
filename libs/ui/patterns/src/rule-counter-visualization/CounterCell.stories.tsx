/**
 * CounterCell Storybook Stories
 * Visual testing for counter visualization component
 */

import { CounterCell } from './CounterCell';
import { CounterCellDesktop } from './CounterCellDesktop';
import { CounterCellMobile } from './CounterCellMobile';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CounterCell> = {
  title: 'UI Patterns/Rule Counter Visualization/CounterCell',
  component: CounterCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays firewall rule counter statistics with platform-specific presenters. Automatically adapts layout based on viewport size.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    packets: {
      control: { type: 'number', min: 0, step: 1000 },
      description: 'Number of packets processed by the rule',
    },
    bytes: {
      control: { type: 'number', min: 0, step: 1000000 },
      description: 'Number of bytes processed by the rule',
    },
    percentOfMax: {
      control: { type: 'range', min: 0, max: 100, step: 0.1 },
      description: 'Percentage of maximum traffic (0-100)',
    },
    isUnused: {
      control: 'boolean',
      description: 'Whether this rule has zero traffic',
    },
    showRate: {
      control: 'boolean',
      description: 'Show rate calculation (desktop only)',
    },
    showBar: {
      control: 'boolean',
      description: 'Show relative progress bar',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CounterCell>;

/**
 * Zero Traffic - Unused Rule
 * Rule that has never matched any traffic
 */
export const ZeroTraffic: Story = {
  args: {
    packets: 0,
    bytes: 0,
    percentOfMax: 0,
    isUnused: true,
    showRate: false,
    showBar: true,
  },
};

/**
 * Low Traffic
 * Rule with minimal traffic (< 10% of max)
 */
export const LowTraffic: Story = {
  args: {
    packets: 1234,
    bytes: 5678900,
    percentOfMax: 8.5,
    isUnused: false,
    showRate: true,
    showBar: true,
  },
};

/**
 * Moderate Traffic
 * Rule with moderate traffic (10-50% of max)
 */
export const ModerateTraffic: Story = {
  args: {
    packets: 456789,
    bytes: 234567890,
    percentOfMax: 35.2,
    isUnused: false,
    showRate: true,
    showBar: true,
  },
};

/**
 * High Traffic
 * Rule with high traffic (50-80% of max)
 */
export const HighTraffic: Story = {
  args: {
    packets: 1234567,
    bytes: 9876543210,
    percentOfMax: 67.8,
    isUnused: false,
    showRate: true,
    showBar: true,
  },
};

/**
 * Maximum Traffic
 * Rule at or near maximum traffic (> 80%)
 */
export const MaxTraffic: Story = {
  args: {
    packets: 9999999,
    bytes: 99999999999,
    percentOfMax: 98.5,
    isUnused: false,
    showRate: true,
    showBar: true,
  },
};

/**
 * Without Rate Display
 * Counter without rate calculation (polling disabled)
 */
export const WithoutRate: Story = {
  args: {
    packets: 456789,
    bytes: 234567890,
    percentOfMax: 35.2,
    isUnused: false,
    showRate: false,
    showBar: true,
  },
};

/**
 * Without Progress Bar
 * Counter without relative progress bar
 */
export const WithoutBar: Story = {
  args: {
    packets: 456789,
    bytes: 234567890,
    percentOfMax: 35.2,
    isUnused: false,
    showRate: true,
    showBar: false,
  },
};

/**
 * Minimal Display
 * Counter with only basic stats (no rate, no bar)
 */
export const MinimalDisplay: Story = {
  args: {
    packets: 456789,
    bytes: 234567890,
    percentOfMax: 35.2,
    isUnused: false,
    showRate: false,
    showBar: false,
  },
};

/**
 * Desktop Presenter - Horizontal Layout
 * Direct usage of desktop presenter
 */
export const DesktopPresenter: Story = {
  render: (args) => <CounterCellDesktop {...args} />,
  args: {
    packets: 1234567,
    bytes: 9876543210,
    percentOfMax: 67.8,
    isUnused: false,
    showRate: true,
    showBar: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Mobile Presenter - Vertical Stack
 * Direct usage of mobile presenter
 */
export const MobilePresenter: Story = {
  render: (args) => <CounterCellMobile {...args} />,
  args: {
    packets: 1234567,
    bytes: 9876543210,
    percentOfMax: 67.8,
    isUnused: false,
    showBar: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Loading State
 * Counter with skeleton/loading placeholders
 */
export const Loading: Story = {
  args: {
    packets: 0,
    bytes: 0,
    percentOfMax: 0,
    isUnused: true,
    showRate: false,
    showBar: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state would typically use Skeleton components from primitives.',
      },
    },
  },
};

/**
 * Comparison Grid - Multiple Rules
 * Grid showing multiple rules for comparison
 */
export const ComparisonGrid: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Firewall Rules Traffic Comparison</div>
      <div className="space-y-2 border rounded-lg p-4">
        <CounterCell
          packets={9999999}
          bytes={99999999999}
          percentOfMax={100}
          isUnused={false}
          showRate={true}
          showBar={true}
        />
        <div className="border-t my-2" />
        <CounterCell
          packets={1234567}
          bytes={9876543210}
          percentOfMax={65.2}
          isUnused={false}
          showRate={true}
          showBar={true}
        />
        <div className="border-t my-2" />
        <CounterCell
          packets={456789}
          bytes={234567890}
          percentOfMax={28.5}
          isUnused={false}
          showRate={true}
          showBar={true}
        />
        <div className="border-t my-2" />
        <CounterCell
          packets={1234}
          bytes={5678900}
          percentOfMax={5.1}
          isUnused={false}
          showRate={true}
          showBar={true}
        />
        <div className="border-t my-2" />
        <CounterCell
          packets={0}
          bytes={0}
          percentOfMax={0}
          isUnused={true}
          showRate={false}
          showBar={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how CounterCell components look when displayed in a list for comparison.',
      },
    },
  },
};
