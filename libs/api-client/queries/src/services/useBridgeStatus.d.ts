import type { VirtualInterface } from './useVirtualInterfaces';
/**
 * GraphQL query to fetch bridge status for a service instance
 */
export declare const GET_BRIDGE_STATUS: import("graphql").DocumentNode;
/**
 * Bridge status combining interface and gateway health
 */
export interface BridgeStatus {
    /** The virtual interface (null if not created yet) */
    interface?: VirtualInterface;
    /** Whether the interface is ready for traffic */
    isReady: boolean;
    /** Whether the gateway (if any) is running */
    gatewayRunning: boolean;
    /** Any errors encountered during setup */
    errors?: string[];
}
/**
 * Hook to fetch bridge status for a service instance
 *
 * Bridge status provides a unified view of network setup health,
 * including interface readiness and gateway connectivity.
 *
 * This is critical for monitoring service network isolation and
 * gateway tunnel status (for features like Tor, sing-box, etc.)
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @returns Bridge status data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { status, loading, error, refetch } = useBridgeStatus('router-1', 'instance-123');
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     <StatusBadge status={status.isReady ? 'online' : 'offline'}>
 *       {status.isReady ? 'Network Ready' : 'Network Pending'}
 *     </StatusBadge>
 *     {status.interface && (
 *       <div>
 *         Interface: {status.interface.name} ({status.interface.ipAddress})
 *       </div>
 *     )}
 *     {status.gatewayRunning && <div>Gateway: Running</div>}
 *     {status.errors?.length > 0 && (
 *       <ErrorList errors={status.errors} />
 *     )}
 *   </div>
 * );
 * ```
 */
export declare function useBridgeStatus(routerId: string, instanceId: string): {
    status: BridgeStatus | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useBridgeStatus.d.ts.map