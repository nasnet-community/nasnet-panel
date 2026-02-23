/**
 * Hooks for managing alerts and real-time subscriptions
 * Per Task 5.5: Implement useAlerts hook with Apollo subscription
 * Per AC7: Alerts arrive via GraphQL subscription, notification area updates without refresh
 *
 * @description Provides three hooks for alert management:
 * - useAlerts: Fetch alerts with filtering/pagination + real-time subscription
 * - useAcknowledgeAlert: Acknowledge single alert with optimistic update
 * - useAcknowledgeAlerts: Bulk acknowledge multiple alerts
 * - useUnacknowledgedAlertCount: Get count of unacknowledged alerts
 *
 * Subscriptions auto-cleanup on component unmount via Apollo's built-in cleanup.
 */
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { useEffect, useCallback } from 'react';

// GraphQL queries, mutations, and subscriptions
const GET_ALERTS = gql`
  query GetAlerts(
    $deviceId: ID
    $severity: AlertSeverity
    $acknowledged: Boolean
    $limit: Int
    $offset: Int
  ) {
    alerts(
      deviceId: $deviceId
      severity: $severity
      acknowledged: $acknowledged
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          ruleId
          eventType
          severity
          title
          message
          data
          deviceId
          triggeredAt
          acknowledgedAt
          acknowledgedBy
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($alertId: ID!) {
    acknowledgeAlert(alertId: $alertId) {
      alert {
        id
        acknowledgedAt
        acknowledgedBy
      }
      errors {
        code
        message
      }
    }
  }
`;

const ACKNOWLEDGE_ALERTS = gql`
  mutation AcknowledgeAlerts($alertIds: [ID!]!) {
    acknowledgeAlerts(alertIds: $alertIds) {
      acknowledgedCount
      errors {
        code
        message
      }
    }
  }
`;

const ALERT_EVENTS_SUBSCRIPTION = gql`
  subscription AlertEvents($deviceId: ID) {
    alertEvents(deviceId: $deviceId) {
      alert {
        id
        ruleId
        eventType
        severity
        title
        message
        data
        deviceId
        triggeredAt
        acknowledgedAt
        acknowledgedBy
      }
      action
    }
  }
`;

interface UseAlertsOptions {
  /** Device ID to filter alerts */
  deviceId?: string;

  /** Severity filter (CRITICAL | WARNING | INFO) */
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';

  /** Filter by acknowledged status */
  acknowledged?: boolean;

  /** Pagination limit (default 50) */
  limit?: number;

  /** Pagination offset (default 0) */
  offset?: number;

  /** Enable real-time subscription updates (default true) */
  enableSubscription?: boolean;
}

/**
 * Hook to fetch alerts with filtering, pagination, and real-time updates
 *
 * @description Fetches alerts from server and subscribes to real-time events.
 * Uses 'cache-and-network' fetch policy to show cached data immediately while
 * refreshing in background. Subscriptions automatically cleanup on unmount.
 *
 * @param options - Filter, pagination, and subscription options
 * @returns Query result with subscription data
 *
 * @example
 * ```tsx
 * const { data, loading, error, subscription } = useAlerts({
 *   deviceId: 'device-123',
 *   severity: 'CRITICAL',
 *   limit: 50,
 * });
 * ```
 */
export function useAlerts(options: UseAlertsOptions = {}) {
  const { deviceId, severity, acknowledged, limit = 50, offset = 0, enableSubscription = true } = options;

  const queryResult = useQuery(GET_ALERTS, {
    variables: {
      deviceId,
      severity,
      acknowledged,
      limit,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe to real-time alert events
  const subscriptionResult = useSubscription(ALERT_EVENTS_SUBSCRIPTION, {
    variables: { deviceId },
    skip: !enableSubscription,
  });

  // Refetch when new alert arrives via subscription
  // Auto-cleanup handled by Apollo on unmount
  useEffect(() => {
    if (subscriptionResult.data?.alertEvents) {
      queryResult.refetch();
    }
  }, [subscriptionResult.data, queryResult]);

  return {
    ...queryResult,
    subscription: subscriptionResult,
  };
}

/**
 * Hook to acknowledge a single alert
 * Per Task 5.6: Implement alert acknowledgment flow with optimistic update
 *
 * @description Acknowledges a single alert with optimistic UI update.
 * Immediately updates UI cache while request is in-flight; rolls back on error.
 * Integrates with Apollo cache for seamless synchronization.
 *
 * @returns Object with acknowledgeAlert function and mutation result
 *
 * @example
 * ```tsx
 * const { acknowledgeAlert, loading } = useAcknowledgeAlert();
 *
 * const handleAckAlert = async (alertId) => {
 *   try {
 *     await acknowledgeAlert(alertId);
 *     // UI already updated optimistically
 *   } catch (error) {
 *     toast.error(error.message);
 *   }
 * };
 * ```
 */
export function useAcknowledgeAlert() {
  const [mutate, result] = useMutation<any, any>(ACKNOWLEDGE_ALERT, {
    // Optimistic update
    optimisticResponse: (vars: any) => ({
      acknowledgeAlert: {
        alert: {
          id: vars.alertId,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: 'system',
          __typename: 'Alert',
        },
        errors: [],
        __typename: 'AlertPayload',
      },
    }),
    // Update cache after mutation
    update: (cache, { data }: any) => {
      if (data?.acknowledgeAlert?.alert) {
        cache.modify({
          id: cache.identify({ __typename: 'Alert', id: data.acknowledgeAlert.alert.id }),
          fields: {
            acknowledgedAt: () => data.acknowledgeAlert.alert.acknowledgedAt,
            acknowledgedBy: () => data.acknowledgeAlert.alert.acknowledgedBy,
          },
        });
      }
    },
  });

  // Memoized acknowledgment handler
  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      const { data } = await mutate({
        variables: { alertId },
      });

      if (data?.acknowledgeAlert?.errors?.length > 0) {
        throw new Error(data.acknowledgeAlert.errors[0].message);
      }

      return data?.acknowledgeAlert?.alert;
    },
    [mutate]
  );

  return {
    acknowledgeAlert,
    ...result,
  };
}

/**
 * Hook to acknowledge multiple alerts (bulk operation)
 *
 * @description Acknowledges multiple alerts in a single mutation.
 * Refetches alerts list after successful operation to ensure cache consistency.
 *
 * @returns Object with acknowledgeAlerts function and mutation result
 *
 * @example
 * ```tsx
 * const { acknowledgeAlerts, loading } = useAcknowledgeAlerts();
 *
 * const handleBulkAck = async (selectedIds) => {
 *   const count = await acknowledgeAlerts(selectedIds);
 *   toast.success(`Acknowledged ${count} alerts`);
 * };
 * ```
 */
export function useAcknowledgeAlerts() {
  const [mutate, result] = useMutation<any, any>(ACKNOWLEDGE_ALERTS, {
    refetchQueries: [{ query: GET_ALERTS }],
  });

  // Memoized bulk acknowledgment handler
  const acknowledgeAlerts = useCallback(
    async (alertIds: string[]) => {
      const { data } = await mutate({
        variables: { alertIds },
      });

      if (data?.acknowledgeAlerts?.errors?.length > 0) {
        throw new Error(data.acknowledgeAlerts.errors[0].message);
      }

      return data?.acknowledgeAlerts?.acknowledgedCount;
    },
    [mutate]
  );

  return {
    acknowledgeAlerts,
    ...result,
  };
}

/**
 * Get count of unacknowledged alerts
 *
 * @description Fetches count of unacknowledged alerts, optionally filtered by device.
 * Subscribes to real-time updates for live count changes.
 * Unsubscribes automatically on unmount.
 *
 * @param deviceId - Optional device ID to filter alerts
 * @returns Count of unacknowledged alerts
 *
 * @example
 * ```tsx
 * const unackedCount = useUnacknowledgedAlertCount(routerId);
 * return <Badge>{unackedCount}</Badge>;
 * ```
 */
export function useUnacknowledgedAlertCount(deviceId?: string) {
  const { data } = useAlerts({
    deviceId,
    acknowledged: false,
    limit: 0,
    enableSubscription: true,
  });

  return data?.alerts?.totalCount ?? 0;
}
