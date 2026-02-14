import { gql, useQuery } from '@apollo/client';

/**
 * GraphQL query to fetch virtual interfaces for a router
 */
export const GET_VIRTUAL_INTERFACES = gql`
  query GetVirtualInterfaces($routerID: ID!) {
    virtualInterfaces(routerID: $routerID) {
      id
      instanceId
      name
      vlanId
      ipAddress
      gatewayType
      gatewayStatus
      tunName
      routingMark
      status
      createdAt
      updatedAt
    }
  }
`;

/**
 * GraphQL query to fetch a specific virtual interface
 */
export const GET_VIRTUAL_INTERFACE = gql`
  query GetVirtualInterface($routerID: ID!, $instanceID: ID!) {
    virtualInterface(routerID: $routerID, instanceID: $instanceID) {
      id
      instanceId
      name
      vlanId
      ipAddress
      gatewayType
      gatewayStatus
      tunName
      routingMark
      status
      createdAt
      updatedAt
    }
  }
`;

/**
 * Gateway type for virtual interface routing
 */
export enum GatewayType {
  NONE = 'NONE',
  HEV_SOCKS5_TUNNEL = 'HEV_SOCKS5_TUNNEL',
}

/**
 * Gateway runtime status
 */
export enum GatewayStatus {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  FAILED = 'FAILED',
}

/**
 * Virtual interface lifecycle status
 */
export enum VirtualInterfaceStatus {
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
export function useVirtualInterfaces(routerId: string) {
  const { data, loading, error, refetch } = useQuery(GET_VIRTUAL_INTERFACES, {
    variables: { routerID: routerId },
    skip: !routerId,
    pollInterval: 10000, // Poll every 10 seconds for interface status updates
    fetchPolicy: 'cache-and-network',
  });

  return {
    interfaces: (data?.virtualInterfaces ?? []) as VirtualInterface[],
    loading,
    error,
    refetch,
  };
}

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
export function useVirtualInterface(routerId: string, instanceId: string) {
  const { data, loading, error, refetch } = useQuery(GET_VIRTUAL_INTERFACE, {
    variables: { routerID: routerId, instanceID: instanceId },
    skip: !routerId || !instanceId,
    pollInterval: 10000, // Poll every 10 seconds for interface status updates
    fetchPolicy: 'cache-and-network',
  });

  return {
    interface: data?.virtualInterface as VirtualInterface | undefined,
    loading,
    error,
    refetch,
  };
}
