/**
 * Query to fetch service alerts for a specific service instance
 */
export declare const GET_SERVICE_ALERTS: import('graphql').DocumentNode;
/**
 * Subscription for real-time service alert events
 */
export declare const SERVICE_ALERT_EVENTS: import('graphql').DocumentNode;
/**
 * Mutation to acknowledge a service alert
 */
export declare const ACKNOWLEDGE_ALERT: import('graphql').DocumentNode;
/**
 * Mutation to acknowledge multiple alerts
 */
export declare const ACKNOWLEDGE_ALERTS: import('graphql').DocumentNode;
/**
 * Alert severity levels
 */
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
/**
 * Alert action types for subscriptions
 */
export type AlertAction = 'CREATED' | 'ACKNOWLEDGED' | 'RESOLVED';
/**
 * Escalation status
 */
export type EscalationStatus = 'PENDING' | 'RESOLVED' | 'MAX_REACHED';
/**
 * Alert escalation tracking
 */
export interface AlertEscalation {
  id: string;
  currentLevel: number;
  maxLevel: number;
  status: EscalationStatus;
  nextEscalationAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
/**
 * Alert rule reference
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
}
/**
 * Service alert
 */
export interface ServiceAlert {
  id: string;
  rule: AlertRule;
  eventType: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  deviceId?: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  deliveryStatus?: Record<string, unknown>;
  escalation?: AlertEscalation;
  suppressedCount?: number;
  suppressReason?: string;
  updatedAt: string;
}
/**
 * Alert connection for pagination
 */
export interface AlertConnection {
  edges: Array<{
    node: ServiceAlert;
    cursor: string;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}
/**
 * Alert event for subscriptions
 */
export interface AlertEvent {
  alert: ServiceAlert;
  action: AlertAction;
}
/**
 * Mutation error
 */
export interface MutationError {
  field?: string;
  message: string;
}
export interface GetServiceAlertsVariables {
  instanceId: string;
  severity?: AlertSeverity;
  acknowledged?: boolean;
  limit?: number;
  offset?: number;
}
export interface GetServiceAlertsResult {
  serviceAlerts: AlertConnection;
}
export interface AcknowledgeAlertVariables {
  alertId: string;
}
export interface AcknowledgeAlertResult {
  acknowledgeAlert: {
    alert?: ServiceAlert;
    errors?: MutationError[];
  };
}
export interface AcknowledgeAlertsVariables {
  alertIds: string[];
}
export interface AcknowledgeAlertsResult {
  acknowledgeAlerts: {
    acknowledgedCount: number;
    errors?: MutationError[];
  };
}
export interface ServiceAlertEventsVariables {
  deviceId?: string;
}
export interface ServiceAlertEventsResult {
  alertEvents: AlertEvent;
}
/**
 * Hook to fetch service alerts for a specific service instance
 *
 * Provides paginated access to alerts with optional filtering by severity and
 * acknowledged status. Use this to display alert history and current alerts
 * in the service detail view.
 *
 * @param variables - Query variables including instanceId and filters
 * @param options - Apollo Client query options
 * @returns Service alerts data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { alerts, loading, error, refetch } = useServiceAlerts({
 *   instanceId: 'instance-123',
 *   severity: 'CRITICAL',
 *   acknowledged: false,
 *   limit: 50,
 * });
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <AlertsList
 *     alerts={alerts}
 *     totalCount={alerts?.totalCount ?? 0}
 *     onRefresh={refetch}
 *   />
 * );
 * ```
 */
export declare function useServiceAlerts(
  variables: GetServiceAlertsVariables,
  options?: {
    pollInterval?: number;
    skip?: boolean;
  }
): {
  alerts: AlertConnection | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<GetServiceAlertsVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<GetServiceAlertsResult>>;
};
/**
 * Hook to subscribe to real-time service alert events
 *
 * Monitors service alerts for a specific device (or all devices if deviceId is omitted).
 * Use this to show live toast notifications when new alerts are triggered or
 * when alerts are acknowledged/resolved.
 *
 * @param variables - Subscription variables (optional deviceId filter)
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Alert event data, loading state, and error
 *
 * @example
 * ```tsx
 * const { alertEvent, loading, error } = useServiceAlertSubscription({
 *   deviceId: 'router-1',
 * });
 *
 * useEffect(() => {
 *   if (alertEvent) {
 *     const { alert, action } = alertEvent;
 *
 *     if (action === 'CREATED') {
 *       toast.error(alert.title, {
 *         description: alert.message,
 *         severity: alert.severity,
 *       });
 *     } else if (action === 'ACKNOWLEDGED') {
 *       toast.info(`Alert acknowledged: ${alert.title}`);
 *     }
 *   }
 * }, [alertEvent]);
 * ```
 */
export declare function useServiceAlertSubscription(
  variables?: ServiceAlertEventsVariables,
  enabled?: boolean
): {
  alertEvent: AlertEvent | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
/**
 * Hook to acknowledge a single service alert
 *
 * Marks an alert as acknowledged and stops any active escalations.
 * Use this when users click "Acknowledge" on an alert notification.
 *
 * @returns Mutation function, loading state, error, and result data
 *
 * @example
 * ```tsx
 * const [acknowledgeAlert, { loading, error }] = useAcknowledgeAlert();
 *
 * const handleAcknowledge = async (alertId: string) => {
 *   const result = await acknowledgeAlert({
 *     variables: { alertId },
 *   });
 *
 *   if (result.data?.acknowledgeAlert.alert) {
 *     toast.success('Alert acknowledged');
 *   } else if (result.data?.acknowledgeAlert.errors) {
 *     toast.error(result.data.acknowledgeAlert.errors[0].message);
 *   }
 * };
 * ```
 */
export declare function useAcknowledgeAlert(): readonly [
  (
    options?:
      | import('@apollo/client').MutationFunctionOptions<
          AcknowledgeAlertResult,
          AcknowledgeAlertVariables,
          import('@apollo/client').DefaultContext,
          import('@apollo/client').ApolloCache<any>
        >
      | undefined
  ) => Promise<import('@apollo/client').FetchResult<AcknowledgeAlertResult>>,
  {
    readonly data: AcknowledgeAlertResult | null | undefined;
    readonly loading: boolean;
    readonly error: import('@apollo/client').ApolloError | undefined;
  },
];
/**
 * Hook to acknowledge multiple service alerts in bulk
 *
 * Marks multiple alerts as acknowledged simultaneously. Use this for
 * "Acknowledge All" functionality or bulk operations.
 *
 * @returns Mutation function, loading state, error, and result data
 *
 * @example
 * ```tsx
 * const [acknowledgeAlerts, { loading, error }] = useAcknowledgeAlerts();
 *
 * const handleAcknowledgeAll = async (alertIds: string[]) => {
 *   const result = await acknowledgeAlerts({
 *     variables: { alertIds },
 *   });
 *
 *   if (result.data?.acknowledgeAlerts) {
 *     const count = result.data.acknowledgeAlerts.acknowledgedCount;
 *     toast.success(`${count} alerts acknowledged`);
 *   }
 * };
 * ```
 */
export declare function useAcknowledgeAlerts(): readonly [
  (
    options?:
      | import('@apollo/client').MutationFunctionOptions<
          AcknowledgeAlertsResult,
          AcknowledgeAlertsVariables,
          import('@apollo/client').DefaultContext,
          import('@apollo/client').ApolloCache<any>
        >
      | undefined
  ) => Promise<import('@apollo/client').FetchResult<AcknowledgeAlertsResult>>,
  {
    readonly data: AcknowledgeAlertsResult | null | undefined;
    readonly loading: boolean;
    readonly error: import('@apollo/client').ApolloError | undefined;
  },
];
//# sourceMappingURL=useServiceAlerts.d.ts.map
