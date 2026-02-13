/**
 * RuleStatisticsPanel Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RuleStatisticsPanel } from './RuleStatisticsPanel';
import { Button } from '@nasnet/ui/primitives';
import type { FilterRule } from '@nasnet/core/types';
import type { CounterHistoryEntry } from './types';

/**
 * Mock filter rule
 */
const mockRule: FilterRule = {
  id: '1',
  chain: 'forward',
  action: 'accept',
  srcAddress: '192.168.1.0/24',
  dstAddress: '10.0.0.0/8',
  protocol: 'tcp',
  dstPort: '443',
  comment: 'Allow HTTPS traffic to internal network',
  disabled: false,
  bytes: 15234567,
  packets: 12345,
};

/**
 * Generate mock history data
 */
function generateHistoryData(hours: number, dataPoints: number): CounterHistoryEntry[] {
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / dataPoints;
  const data: CounterHistoryEntry[] = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i) * interval;
    const baseBytes = Math.random() * 1000000 + 500000; // 500KB - 1.5MB
    const basePackets = Math.floor(baseBytes / 1500); // ~1500 bytes per packet

    data.push({
      timestamp,
      bytes: Math.floor(baseBytes),
      packets: basePackets,
    });
  }

  return data;
}

/**
 * Interactive wrapper component
 */
function RuleStatisticsPanelStory({
  historyData,
}: {
  historyData: CounterHistoryEntry[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Statistics Panel</Button>
      <RuleStatisticsPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        rule={mockRule}
        historyData={historyData}
        onExportCsv={() => {
          console.log('Export CSV clicked');
          alert('CSV export functionality would trigger here');
        }}
      />
    </div>
  );
}

const meta: Meta<typeof RuleStatisticsPanel> = {
  title: 'Patterns/RuleStatisticsPanel',
  component: RuleStatisticsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays detailed firewall rule statistics with historical traffic charts. Implements Headless + Platform Presenters pattern for responsive design.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RuleStatisticsPanel>;

/**
 * Empty history - No data available
 */
export const EmptyHistory: Story = {
  render: () => <RuleStatisticsPanelStory historyData={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'Panel with no historical data. Shows empty state in chart.',
      },
    },
  },
};

/**
 * 1-Hour Data - 6 data points
 */
export const OneHourData: Story = {
  render: () => <RuleStatisticsPanelStory historyData={generateHistoryData(1, 6)} />,
  parameters: {
    docs: {
      description: {
        story: '1 hour of traffic data with 6 data points (10-minute intervals).',
      },
    },
  },
};

/**
 * 24-Hour Data - 24 data points
 */
export const TwentyFourHourData: Story = {
  render: () => <RuleStatisticsPanelStory historyData={generateHistoryData(24, 24)} />,
  parameters: {
    docs: {
      description: {
        story: '24 hours of traffic data with 24 data points (hourly intervals).',
      },
    },
  },
};

/**
 * 7-Day Data - 168 data points
 */
export const SevenDayData: Story = {
  render: () => <RuleStatisticsPanelStory historyData={generateHistoryData(168, 168)} />,
  parameters: {
    docs: {
      description: {
        story: '7 days of traffic data with 168 data points (hourly intervals).',
      },
    },
  },
};

/**
 * Large Dataset - Stress test with 500 data points
 */
export const LargeDataset: Story = {
  render: () => <RuleStatisticsPanelStory historyData={generateHistoryData(168, 500)} />,
  parameters: {
    docs: {
      description: {
        story: 'Stress test with 500 data points to verify chart performance.',
      },
    },
  },
};

/**
 * Mobile Viewport - Force mobile layout
 */
export const MobileViewport: Story = {
  render: () => <RuleStatisticsPanelStory historyData={generateHistoryData(24, 24)} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile layout with full-screen bottom sheet (viewport <640px).',
      },
    },
  },
};

/**
 * Desktop Viewport - Force desktop layout
 */
export const DesktopViewport: Story = {
  render: () => <RuleStatisticsPanelStory historyData={generateHistoryData(24, 24)} />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop layout with 500px side sheet (viewport >=640px).',
      },
    },
  },
};
