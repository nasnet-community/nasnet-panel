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
export declare function useAlerts(options?: UseAlertsOptions): {
    subscription: {
        restart: () => void;
        loading: boolean;
        data?: any;
        error?: import("@apollo/client").ApolloError;
        variables?: import("@apollo/client").OperationVariables | undefined;
    };
    called: boolean;
    client: import("@apollo/client").ApolloClient<any>;
    observable: import("@apollo/client").ObservableQuery<any, import("@apollo/client").OperationVariables>;
    data: any;
    previousData?: any;
    error?: import("@apollo/client").ApolloError;
    errors?: ReadonlyArray<import("graphql").GraphQLFormattedError>;
    loading: boolean;
    networkStatus: import("@apollo/client").NetworkStatus;
    startPolling: (pollInterval: number) => void;
    stopPolling: () => void;
    subscribeToMore: import("@apollo/client").SubscribeToMoreFunction<any, import("@apollo/client").OperationVariables>;
    updateQuery: (mapFn: import("@apollo/client").UpdateQueryMapFn<any, import("@apollo/client").OperationVariables>) => void;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
    reobserve: (newOptions?: Partial<import("@apollo/client").WatchQueryOptions<import("@apollo/client").OperationVariables, any>> | undefined, newNetworkStatus?: import("@apollo/client").NetworkStatus) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
    variables: import("@apollo/client").OperationVariables | undefined;
    fetchMore: <TFetchData = any, TFetchVars extends import("@apollo/client").OperationVariables = import("@apollo/client").OperationVariables>(fetchMoreOptions: import("@apollo/client").FetchMoreQueryOptions<TFetchVars, TFetchData> & {
        updateQuery?: ((previousQueryResult: any, options: {
            fetchMoreResult: import("@apollo/client").Unmasked<TFetchData>;
            variables: TFetchVars;
        }) => any) | undefined;
    }) => Promise<import("@apollo/client").ApolloQueryResult<TFetchData>>;
};
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
export declare function useAcknowledgeAlert(): {
    data?: any;
    error?: import("@apollo/client").ApolloError;
    loading: boolean;
    called: boolean;
    client: import("@apollo/client").ApolloClient<object>;
    reset: () => void;
    acknowledgeAlert: (alertId: string) => Promise<any>;
};
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
export declare function useAcknowledgeAlerts(): {
    data?: any;
    error?: import("@apollo/client").ApolloError;
    loading: boolean;
    called: boolean;
    client: import("@apollo/client").ApolloClient<object>;
    reset: () => void;
    acknowledgeAlerts: (alertIds: string[]) => Promise<any>;
};
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
export declare function useUnacknowledgedAlertCount(deviceId?: string): any;
export {};
//# sourceMappingURL=useAlerts.d.ts.map