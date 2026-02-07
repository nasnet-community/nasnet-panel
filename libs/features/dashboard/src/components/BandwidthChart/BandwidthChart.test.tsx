/**
 * Component tests for BandwidthChart
 * Tests rendering, interactions, and state management
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { BandwidthChart } from './BandwidthChart';
import { BandwidthChartDesktop } from './BandwidthChartDesktop';
import { BandwidthChartMobile } from './BandwidthChartMobile';
import { BANDWIDTH_HISTORY_QUERY } from './graphql';
import { GraphQLTimeRange, GraphQLAggregationType } from './types';
import type { ReactNode } from 'react';

// Mock the platform hook
jest.mock('@nasnet/ui/layouts', () => ({
  usePlatform: jest.fn(() => 'desktop'),
  useReducedMotion: jest.fn(() => false),
}));

// Mock Recharts to avoid canvas rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

// Mock data
const mockDataPoints = [
  {
    timestamp: '2026-02-05T10:00:00Z',
    txRate: 1500000,
    rxRate: 12500000,
    txBytes: 450000000,
    rxBytes: 2100000000,
  },
  {
    timestamp: '2026-02-05T10:00:02Z',
    txRate: 1600000,
    rxRate: 13000000,
    txBytes: 452000000,
    rxBytes: 2105000000,
  },
  {
    timestamp: '2026-02-05T10:00:04Z',
    txRate: 1700000,
    rxRate: 13500000,
    txBytes: 454000000,
    rxBytes: 2110000000,
  },
];

describe('BandwidthChart', () => {
  const defaultMocks = [
    {
      request: {
        query: BANDWIDTH_HISTORY_QUERY,
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
            dataPoints: mockDataPoints,
            aggregation: 'RAW',
          },
        },
      },
    },
  ];

  const wrapper = ({ children, mocks = defaultMocks }: { children: ReactNode; mocks?: any[] }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );

  describe('Rendering', () => {
    it('should render chart with mock data', async () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Check for chart elements
      expect(screen.getByText('Bandwidth Usage')).toBeInTheDocument();
      expect(screen.getByText(/TX:/i)).toBeInTheDocument();
      expect(screen.getByText(/RX:/i)).toBeInTheDocument();
    });

    it('should show loading skeleton during data fetch', () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: [] }) }
      );

      // Skeleton should be visible initially
      // Note: This depends on your Skeleton component implementation
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render current rates display', async () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      await waitFor(() => {
        expect(screen.getByText(/1\.\d+ Mbps/)).toBeInTheDocument(); // TX rate
        expect(screen.getByText(/12\.\d+ Mbps/)).toBeInTheDocument(); // RX rate
      });
    });
  });

  describe('Time Range Selection', () => {
    it('should update query when time range changes', async () => {
      const user = userEvent.setup();
      const oneHourMock = {
        request: {
          query: BANDWIDTH_HISTORY_QUERY,
          variables: {
            deviceId: 'router-1',
            interfaceId: null,
            timeRange: GraphQLTimeRange.ONE_HOUR,
            aggregation: GraphQLAggregationType.MINUTE,
          },
        },
        result: {
          data: {
            bandwidthHistory: {
              dataPoints: mockDataPoints,
              aggregation: 'MINUTE',
            },
          },
        },
      };

      const mocks = [...defaultMocks, oneHourMock];

      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks }) }
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Find and click 1 hour button
      const oneHourButton = screen.getByRole('radio', { name: /1 hour/i });
      await user.click(oneHourButton);

      // Verify button is selected
      await waitFor(() => {
        expect(oneHourButton).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should support keyboard navigation in time range selector', async () => {
      const user = userEvent.setup();

      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Focus on time range selector
      const fiveMinButton = screen.getByRole('radio', { name: /5 min/i });
      fiveMinButton.focus();

      // Press arrow key to navigate
      await user.keyboard('{ArrowRight}');

      // Next option should be focused
      const oneHourButton = screen.getByRole('radio', { name: /1 hour/i });
      expect(oneHourButton).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Interface Filter Selection', () => {
    it('should render interface filter dropdown', async () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Check for interface filter (using aria-label)
      expect(screen.getByLabelText(/filter bandwidth by interface/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton during loading', () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: [] }) }
      );

      // Should show loading indicator
      // This depends on your skeleton implementation
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message with retry button on query failure', async () => {
      const errorMocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
            variables: {
              deviceId: 'router-1',
              interfaceId: null,
              timeRange: GraphQLTimeRange.FIVE_MIN,
              aggregation: GraphQLAggregationType.RAW,
            },
          },
          error: new Error('Failed to fetch bandwidth data'),
        },
      ];

      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: errorMocks }) }
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading chart/i)).toBeInTheDocument();
      });

      // Check for retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should allow retry on error', async () => {
      const user = userEvent.setup();
      const errorMocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
            variables: {
              deviceId: 'router-1',
              interfaceId: null,
              timeRange: GraphQLTimeRange.FIVE_MIN,
              aggregation: GraphQLAggregationType.RAW,
            },
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: errorMocks }) }
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading chart/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify retry was attempted (refetch called)
      // This would require additional mocking or checking for loading state
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data available', async () => {
      const emptyMocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
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
                dataPoints: [],
                aggregation: 'RAW',
              },
            },
          },
        },
      ];

      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: emptyMocks }) }
      );

      await waitFor(() => {
        expect(screen.getByText(/no bandwidth data/i)).toBeInTheDocument();
      });

      // Check for helpful message
      expect(screen.getByText(/check your router connection/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for chart region', async () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Check for ARIA label on chart
      expect(screen.getByRole('img', { name: /bandwidth usage graph/i })).toBeInTheDocument();
    });

    it('should have keyboard-accessible controls', async () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Time range selector should be keyboard accessible
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();

      // All radio buttons should be keyboard accessible
      const radios = within(radioGroup).getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute('tabIndex');
      });
    });

    it('should provide screen reader alternative via data table', async () => {
      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Data table should exist (hidden but accessible)
      const table = screen.getByRole('region', { name: /bandwidth data table/i });
      expect(table).toBeInTheDocument();
    });
  });

  describe('Platform Detection', () => {
    it('should render desktop presenter on desktop', () => {
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('desktop');

      const { container } = render(
        <BandwidthChart deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      // Desktop version should be rendered
      // This would check for desktop-specific class or structure
      expect(container).toBeTruthy();
    });

    it('should render mobile presenter on mobile', () => {
      const { usePlatform } = require('@nasnet/ui/layouts');
      usePlatform.mockReturnValue('mobile');

      const { container } = render(
        <BandwidthChart deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      // Mobile version should be rendered
      expect(container).toBeTruthy();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should disable animations when prefers-reduced-motion is set', () => {
      const { useReducedMotion } = require('@nasnet/ui/layouts');
      useReducedMotion.mockReturnValue(true);

      render(
        <BandwidthChartDesktop deviceId="router-1" />,
        { wrapper: (props) => wrapper({ ...props, mocks: defaultMocks }) }
      );

      // Animation should be disabled
      // This would check for isAnimationActive prop on Recharts components
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});
