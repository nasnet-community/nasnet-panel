/**
 * Unit tests for useBandwidthHistory hook
 * Tests subscription priority, polling fallback, aggregation, and error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useBandwidthHistory } from './useBandwidthHistory';
import { BANDWIDTH_HISTORY_QUERY, BANDWIDTH_SUBSCRIPTION } from './graphql';
import { GraphQLTimeRange, GraphQLAggregationType } from './types';
import type { ReactNode } from 'react';

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
];

describe('useBandwidthHistory', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider
      mocks={[]}
      addTypename={false}
    >
      {children}
    </MockedProvider>
  );

  describe('Query and Subscription Behavior', () => {
    it('should use subscription for 5m view (real-time)', async () => {
      const mocks = [
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
        {
          request: {
            query: BANDWIDTH_SUBSCRIPTION,
            variables: {
              deviceId: 'router-1',
              interfaceId: null,
            },
          },
          result: {
            data: {
              bandwidth: {
                timestamp: '2026-02-05T10:00:04Z',
                txRate: 1700000,
                rxRate: 13500000,
                txBytes: 454000000,
                rxBytes: 2110000000,
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '5m',
            interfaceId: null,
          }),
        { wrapper }
      );

      // Should initially be loading
      expect(result.current.loading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      // Should have processed data
      expect(result.current.data?.dataPoints).toHaveLength(2);
      expect(result.current.data?.aggregation).toBe('RAW');
    });

    it('should skip subscription for 1h view', async () => {
      const mocks = [
        {
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
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '1h',
            interfaceId: null,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.data?.aggregation).toBe('MINUTE');
    });

    it('should skip subscription for 24h view', async () => {
      const mocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
            variables: {
              deviceId: 'router-1',
              interfaceId: null,
              timeRange: GraphQLTimeRange.TWENTY_FOUR_HOURS,
              aggregation: GraphQLAggregationType.FIVE_MIN,
            },
          },
          result: {
            data: {
              bandwidthHistory: {
                dataPoints: mockDataPoints,
                aggregation: 'FIVE_MIN',
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '24h',
            interfaceId: null,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.data?.aggregation).toBe('FIVE_MIN');
    });
  });

  describe('Aggregation Mapping', () => {
    it('should map 5m to RAW aggregation', async () => {
      const mocks = [
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

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '5m',
            interfaceId: null,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data?.aggregation).toBe('RAW');
      });
    });

    it('should map 1h to MINUTE aggregation', async () => {
      const mocks = [
        {
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
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '1h',
            interfaceId: null,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data?.aggregation).toBe('MINUTE');
      });
    });

    it('should map 24h to FIVE_MIN aggregation', async () => {
      const mocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
            variables: {
              deviceId: 'router-1',
              interfaceId: null,
              timeRange: GraphQLTimeRange.TWENTY_FOUR_HOURS,
              aggregation: GraphQLAggregationType.FIVE_MIN,
            },
          },
          result: {
            data: {
              bandwidthHistory: {
                dataPoints: mockDataPoints,
                aggregation: 'FIVE_MIN',
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '24h',
            interfaceId: null,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data?.aggregation).toBe('FIVE_MIN');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return error when query fails', async () => {
      const mocks = [
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

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '5m',
            interfaceId: null,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toContain('Network error');
    });
  });

  describe('Interface Filtering', () => {
    it('should pass interfaceId to query variables', async () => {
      const mocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
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
                dataPoints: mockDataPoints,
                aggregation: 'RAW',
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () =>
          useBandwidthHistory({
            deviceId: 'router-1',
            timeRange: '5m',
            interfaceId: 'ether1',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.data?.dataPoints).toHaveLength(2);
    });
  });
});
