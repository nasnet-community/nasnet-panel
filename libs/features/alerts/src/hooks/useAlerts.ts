/**
 * Hook for managing alerts and real-time subscriptions
 * Per Task 5.5: Implement useAlerts hook with Apollo subscription
 * Per AC7: Alerts arrive via GraphQL subscription, notification area updates without refresh
 */
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';
import { useEffect } from 'react';

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
  deviceId?: string;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  acknowledged?: boolean;
  limit?: number;
  offset?: number;
  enableSubscription?: boolean;
}

/**
 * Hook to fetch alerts with filtering and pagination
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
 */
export function useAcknowledgeAlert() {
  const [mutate, result] = useMutation(ACKNOWLEDGE_ALERT, {
    // Optimistic update
    optimisticResponse: (vars) => ({
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
    update: (cache, { data }) => {
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

  const acknowledgeAlert = async (alertId: string) => {
    const { data } = await mutate({
      variables: { alertId },
    });

    if (data?.acknowledgeAlert?.errors?.length > 0) {
      throw new Error(data.acknowledgeAlert.errors[0].message);
    }

    return data?.acknowledgeAlert?.alert;
  };

  return {
    acknowledgeAlert,
    ...result,
  };
}

/**
 * Hook to acknowledge multiple alerts (bulk operation)
 */
export function useAcknowledgeAlerts() {
  const [mutate, result] = useMutation(ACKNOWLEDGE_ALERTS, {
    refetchQueries: [{ query: GET_ALERTS }],
  });

  const acknowledgeAlerts = async (alertIds: string[]) => {
    const { data } = await mutate({
      variables: { alertIds },
    });

    if (data?.acknowledgeAlerts?.errors?.length > 0) {
      throw new Error(data.acknowledgeAlerts.errors[0].message);
    }

    return data?.acknowledgeAlerts?.acknowledgedCount;
  };

  return {
    acknowledgeAlerts,
    ...result,
  };
}

/**
 * Get count of unacknowledged alerts
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
