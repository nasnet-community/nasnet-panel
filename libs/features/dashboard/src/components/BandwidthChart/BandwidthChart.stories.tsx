/**
 * Storybook stories for BandwidthChart
 * Demonstrates all component states and variations
 */

import { MockedProvider } from '@apollo/client/testing';

import { BandwidthChart } from './BandwidthChart';
import { BandwidthChartDesktop } from './BandwidthChartDesktop';
import { BandwidthChartMobile } from './BandwidthChartMobile';
import { GET_BANDWIDTH_HISTORY } from './graphql';
import { GraphQLTimeRange, GraphQLAggregationType } from './types';

import type { UseBandwidthHistoryReturn } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// Generate mock data for stories
function generateMockData(count: number, startTime: Date) {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(startTime.getTime() + i * 2000).toISOString();
    const baseRx = 10_000_000 + Math.random() * 5_000_000;
    const baseTx = 1_000_000 + Math.random() * 500_000;

    return {
      timestamp,
      txRate: baseTx,
      rxRate: baseRx,
      txBytes: 400_000_000 + i * 1_000_000,
      rxBytes: 2_000_000_000 + i * 10_000_000,
    };
  });
}

function generateHighTrafficData(count: number, startTime: Date) {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(startTime.getTime() + i * 2000).toISOString();
    const baseRx = 800_000_000 + Math.random() * 200_000_000;
    const baseTx = 100_000_000 + Math.random() * 50_000_000;

    return {
      timestamp,
      txRate: baseTx,
      rxRate: baseRx,
      txBytes: 4_000_000_000 + i * 10_000_000,
      rxBytes: 20_000_000_000 + i * 100_000_000,
    };
  });
}

const meta: Meta<typeof BandwidthChart> = {
  title: 'Features/Dashboard/BandwidthChart',
  component: BandwidthChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Bandwidth visualization component with real-time updates and historical data. Supports multiple time ranges, interface filtering, and platform-specific presenters.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (_Story) => (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <_Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BandwidthChart>;

// Mock data sets
const fiveMinData = generateMockData(150, new Date());
const oneHourData = generateMockData(60, new Date(Date.now() - 60 * 60 * 1000));
const twentyFourHourData = generateMockData(288, new Date(Date.now() - 24 * 60 * 60 * 1000));
const highTrafficData = generateHighTrafficData(150, new Date());

/**
 * Default story - 5-minute real-time view with live data simulation
 */
export const Default: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_BANDWIDTH_HISTORY,
              variables: {
                deviceId: 'router-1',
                interfaceId: null,
                timeRange: GraphQLTimeRange.FIVE_MIN,
                aggregation: GraphQLAggregationType.RAW,
              },
            },
            result: {
              data: {
                bandwidthHistory: {
                  dataPoints: fiveMinData,
                  aggregation: 'RAW',
                },
              },
            },
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Default 5-minute view with real-time data updates. Shows TX (upload) in blue and RX (download) in green.',
      },
    },
  },
};

/**
 * One-hour view with 1-minute aggregation
 */
export const OneHour: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      // Pre-select 1-hour time range
      const mockHook: UseBandwidthHistoryReturn = {
        data: {
          dataPoints: oneHourData.map((dp) => ({
            ...dp,
            timestamp: new Date(dp.timestamp).getTime(),
          })),
          aggregation: 'MINUTE',
          currentRates: {
            tx: 1_200_000,
            rx: 12_000_000,
          },
        },
        loading: false,
        error: null,
        refetch: () => {},
        isSubscriptionActive: false,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          '1-hour view with 1-minute averaged data points. Subscription disabled, query-only mode.',
      },
    },
  },
};

/**
 * 24-hour view with 5-minute aggregation
 */
export const TwentyFourHours: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      const mockHook: UseBandwidthHistoryReturn = {
        data: {
          dataPoints: twentyFourHourData.map((dp) => ({
            ...dp,
            timestamp: new Date(dp.timestamp).getTime(),
          })),
          aggregation: 'FIVE_MIN',
          currentRates: {
            tx: 1_500_000,
            rx: 14_000_000,
          },
        },
        loading: false,
        error: null,
        refetch: () => {},
        isSubscriptionActive: false,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          '24-hour view with 5-minute averaged data points. Shows longer-term bandwidth patterns.',
      },
    },
  },
};

/**
 * Interface-filtered view (specific interface selected)
 */
export const InterfaceFiltered: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_BANDWIDTH_HISTORY,
              variables: {
                deviceId: 'router-1',
                interfaceId: 'ether1',
                timeRange: GraphQLTimeRange.FIVE_MIN,
                aggregation: GraphQLAggregationType.RAW,
              },
            },
            result: {
              data: {
                bandwidthHistory: {
                  dataPoints: fiveMinData,
                  aggregation: 'RAW',
                },
              },
            },
          },
        ]}
        addTypename={false}
      >
        <_Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Bandwidth data filtered to a specific interface (ether1). Useful for per-interface analysis.',
      },
    },
  },
};

/**
 * Loading state with skeleton
 */
export const Loading: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      const mockHook: UseBandwidthHistoryReturn = {
        data: null,
        loading: true,
        error: null,
        refetch: () => {},
        isSubscriptionActive: false,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton state while bandwidth data is being fetched. Respects prefers-reduced-motion.',
      },
    },
  },
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      const mockHook: UseBandwidthHistoryReturn = {
        data: null,
        loading: false,
        error: new Error('Failed to fetch bandwidth data from router'),
        refetch: () => {
          console.log('Retry clicked');
        },
        isSubscriptionActive: false,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Error state when GraphQL query fails. Displays error message with retry button.',
      },
    },
  },
};

/**
 * Empty state (no data available)
 */
export const Empty: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      const mockHook: UseBandwidthHistoryReturn = {
        data: {
          dataPoints: [],
          aggregation: 'RAW',
          currentRates: {
            tx: 0,
            rx: 0,
          },
        },
        loading: false,
        error: null,
        refetch: () => {},
        isSubscriptionActive: false,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no bandwidth data is available. Suggests checking router connection.',
      },
    },
  },
};

/**
 * Mobile view (compact layout)
 */
export const Mobile: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      const mockHook: UseBandwidthHistoryReturn = {
        data: {
          dataPoints: fiveMinData.map((dp) => ({
            ...dp,
            timestamp: new Date(dp.timestamp).getTime(),
          })),
          aggregation: 'RAW',
          currentRates: {
            tx: 1_500_000,
            rx: 12_500_000,
          },
        },
        loading: false,
        error: null,
        refetch: () => {},
        isSubscriptionActive: true,
      };

      return (
        <div style={{ maxWidth: '375px', margin: '0 auto' }}>
          <BandwidthChartMobile
            deviceId="router-1"
            hookOverride={mockHook}
          />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Mobile presenter with 200px chart height, simplified controls, and tap-optimized tooltips.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * High traffic scenario (near capacity)
 */
export const HighTraffic: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      const mockHook: UseBandwidthHistoryReturn = {
        data: {
          dataPoints: highTrafficData.map((dp) => ({
            ...dp,
            timestamp: new Date(dp.timestamp).getTime(),
          })),
          aggregation: 'RAW',
          currentRates: {
            tx: 95_000_000,
            rx: 950_000_000,
          },
        },
        loading: false,
        error: null,
        refetch: () => {},
        isSubscriptionActive: true,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'High traffic scenario showing bandwidth usage near router capacity (900+ Mbps).',
      },
    },
  },
};

/**
 * Reduced motion mode (animations disabled)
 */
export const ReducedMotion: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (_Story) => {
      // Mock prefers-reduced-motion
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = (query: string) => ({
        ...originalMatchMedia(query),
        matches: query === '(prefers-reduced-motion: reduce)',
      });

      const mockHook: UseBandwidthHistoryReturn = {
        data: {
          dataPoints: fiveMinData.map((dp) => ({
            ...dp,
            timestamp: new Date(dp.timestamp).getTime(),
          })),
          aggregation: 'RAW',
          currentRates: {
            tx: 1_500_000,
            rx: 12_500_000,
          },
        },
        loading: false,
        error: null,
        refetch: () => {},
        isSubscriptionActive: true,
      };

      return (
        <BandwidthChartDesktop
          deviceId="router-1"
          hookOverride={mockHook}
        />
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Chart with animations disabled for users who prefer reduced motion (WCAG AAA compliance).',
      },
    },
  },
};
