/**
 * Connection History Hook
 *
 * Fetch and manage WAN connection history with pagination.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import type { ConnectionEventData } from '../types/wan.types';

// GraphQL query for connection history
const GET_WAN_CONNECTION_HISTORY = gql`
  query GetWANConnectionHistory(
    $routerId: ID!
    $wanId: ID
    $limit: Int
    $offset: Int
  ) {
    wanConnectionHistory(
      routerId: $routerId
      wanId: $wanId
      limit: $limit
      offset: $offset
    ) {
      total
      events {
        id
        wanInterfaceId
        eventType
        timestamp
        publicIP
        gateway
        reason
        duration
      }
    }
  }
`;

export interface UseConnectionHistoryOptions {
  routerId: string;
  wanId?: string;
  limit?: number;
  offset?: number;
  skip?: boolean;
}

export interface ConnectionHistoryResult {
  total: number;
  events: ConnectionEventData[];
}

/**
 * Hook to fetch WAN connection history
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useConnectionHistory({
 *   routerId: 'router-123',
 *   limit: 50,
 * });
 * ```
 */
export function useConnectionHistory({
  routerId,
  wanId,
  limit = 50,
  offset = 0,
  skip = false,
}: UseConnectionHistoryOptions) {
  const { data, loading, error, refetch, fetchMore } = useQuery<{
    wanConnectionHistory: ConnectionHistoryResult;
  }>(GET_WAN_CONNECTION_HISTORY, {
    variables: {
      routerId,
      wanId,
      limit,
      offset,
    },
    skip,
    // Poll every 30 seconds for new events
    pollInterval: 30000,
    // Cache for 1 minute
    fetchPolicy: 'cache-and-network',
  });

  /**
   * Load more events (pagination)
   */
  const loadMore = async () => {
    if (!data) return;

    await fetchMore({
      variables: {
        offset: data.wanConnectionHistory.events.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          wanConnectionHistory: {
            ...fetchMoreResult.wanConnectionHistory,
            events: [
              ...prev.wanConnectionHistory.events,
              ...fetchMoreResult.wanConnectionHistory.events,
            ],
          },
        };
      },
    });
  };

  /**
   * Check if more events are available
   */
  const hasMore =
    data &&
    data.wanConnectionHistory.events.length < data.wanConnectionHistory.total;

  return {
    events: data?.wanConnectionHistory.events || [],
    total: data?.wanConnectionHistory.total || 0,
    loading,
    error,
    refetch,
    loadMore,
    hasMore: Boolean(hasMore),
  };
}

/**
 * Mock data generator for development
 */
export function generateMockConnectionHistory(
  count: number = 20
): ConnectionEventData[] {
  const eventTypes = [
    'CONNECTED',
    'DISCONNECTED',
    'AUTH_FAILED',
    'IP_CHANGED',
    'RECONNECTING',
  ];
  const reasons = [
    'DHCP lease renewed',
    'PPPoE authentication successful',
    'Link down detected',
    'Invalid credentials',
    'ISP gateway unreachable',
    'Session timeout',
    'Manual reconnect',
  ];
  const ips = ['203.0.113.10', '203.0.113.45', '198.51.100.23', '192.0.2.15'];

  const events: ConnectionEventData[] = [];
  let currentTime = Date.now();

  for (let i = 0; i < count; i++) {
    const eventType =
      eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const isConnected = eventType === 'CONNECTED' || eventType === 'IP_CHANGED';

    // Events are spaced 10 minutes to 2 hours apart
    currentTime -= Math.floor(Math.random() * 7200000) + 600000;

    events.push({
      id: `event-${i + 1}`,
      wanInterfaceId: Math.random() > 0.7 ? 'pppoe-wan' : 'ether1',
      eventType,
      timestamp: new Date(currentTime).toISOString(),
      publicIP: isConnected ? ips[Math.floor(Math.random() * ips.length)] : undefined,
      gateway: isConnected ? '203.0.113.1' : undefined,
      reason:
        eventType === 'AUTH_FAILED' || eventType === 'DISCONNECTED'
          ? reasons[Math.floor(Math.random() * reasons.length)]
          : undefined,
      duration:
        eventType === 'DISCONNECTED'
          ? Math.floor(Math.random() * 3600) + 60 // 1 min to 1 hour
          : undefined,
    });
  }

  return events;
}
