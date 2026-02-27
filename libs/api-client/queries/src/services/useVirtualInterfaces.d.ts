/**
 * GraphQL query to fetch virtual interfaces for a router
 */
export declare const GET_VIRTUAL_INTERFACES: import('graphql').DocumentNode;
/**
 * GraphQL query to fetch a specific virtual interface
 */
export declare const GET_VIRTUAL_INTERFACE: import('graphql').DocumentNode;
/**
 * Gateway type for virtual interface routing
 */
export declare enum GatewayType {
  NONE = 'NONE',
  HEV_SOCKS5_TUNNEL = 'HEV_SOCKS5_TUNNEL',
}
/**
 * Gateway runtime status
 */
export declare enum GatewayStatus {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  FAILED = 'FAILED',
}
/**
 * Virtual interface lifecycle status
 */
export declare enum VirtualInterfaceStatus {
  CREATING = 'CREATING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  REMOVING = 'REMOVING',
}
/**
 * Virtual interface data structure
 */
export interface VirtualInterface {
  id: string;
  instanceId: string;
  name: string;
  vlanId: number;
  ipAddress: string;
  gatewayType: GatewayType;
  gatewayStatus: GatewayStatus;
  tunName?: string;
  routingMark: string;
  status: VirtualInterfaceStatus;
  createdAt: string;
  updatedAt: string;
}
/**
 * Hook to fetch all virtual interfaces for a router
 *
 * Virtual interfaces provide network isolation for service instances.
 * Each interface has a VLAN ID, IP address, and optional gateway tunnel.
 *
 * @param routerId - Router ID to fetch interfaces for
 * @returns Virtual interfaces data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { interfaces, loading, error, refetch } = useVirtualInterfaces('router-1');
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     {interfaces.map(iface => (
 *       <div key={iface.id}>
 *         {iface.name} - {iface.ipAddress} (VLAN {iface.vlanId})
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export declare function useVirtualInterfaces(routerId: string): {
  interfaces: VirtualInterface[];
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Hook to fetch a specific virtual interface for a service instance
 *
 * Useful for detailed interface status and configuration views.
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @returns Virtual interface data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { interface: vif, loading, error } = useVirtualInterface('router-1', 'instance-123');
 *
 * if (vif) {
 *   console.log(`Interface ${vif.name} is ${vif.status}`);
 *   console.log(`Gateway: ${vif.gatewayType} (${vif.gatewayStatus})`);
 * }
 * ```
 */
export declare function useVirtualInterface(
  routerId: string,
  instanceId: string
): {
  interface: VirtualInterface | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
//# sourceMappingURL=useVirtualInterfaces.d.ts.map
