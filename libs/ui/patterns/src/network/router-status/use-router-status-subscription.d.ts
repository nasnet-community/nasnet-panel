/**
 * Router Status Subscription Hook
 *
 * GraphQL subscription wrapper for router status changes.
 * Handles subscription lifecycle with automatic reconnection.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */
/**
 * GraphQL subscription for router status changes
 *
 * Subscribes to the routerStatusChanged subscription defined in schema/schema.graphql
 */
export declare const ROUTER_STATUS_CHANGED_SUBSCRIPTION: import("graphql").DocumentNode;
/**
 * Router data from subscription
 */
export interface SubscriptionRouter {
    id: string;
    name: string;
    host: string;
    port: number;
    status: string;
    platform: string;
    model: string | null;
    version: string | null;
    uptime: string | null;
    lastConnected: string | null;
    protocol?: string;
    latencyMs?: number;
}
/**
 * Router status change event from subscription
 */
export interface RouterStatusEvent {
    router: SubscriptionRouter;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
}
/**
 * Subscription data shape
 */
export interface RouterStatusSubscriptionData {
    routerStatusChanged: RouterStatusEvent;
}
/**
 * Return type for useRouterStatusSubscription hook
 */
export interface UseRouterStatusSubscriptionReturn {
    /**
     * Latest status change event (null if no events yet)
     */
    event: RouterStatusEvent | null;
    /**
     * Whether the subscription is connecting
     */
    loading: boolean;
    /**
     * Subscription error (null if no error)
     */
    error: Error | undefined;
}
/**
 * GraphQL subscription hook for router status changes.
 *
 * Wraps Apollo Client's useSubscription with proper typing
 * and automatic reconnection support.
 *
 * @param routerId - Router ID to subscribe to
 * @returns Subscription state with latest event, loading, and error
 *
 * @example
 * ```tsx
 * function RouterStatusDisplay({ routerId }: { routerId: string }) {
 *   const { event, loading, error } = useRouterStatusSubscription(routerId);
 *
 *   if (loading) return <Skeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *
 *   return (
 *     <div>
 *       Status: {event?.router.status}
 *       Model: {event?.router.model}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useRouterStatusSubscription(routerId: string): UseRouterStatusSubscriptionReturn;
//# sourceMappingURL=use-router-status-subscription.d.ts.map