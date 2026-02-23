/**
 * DHCP Mutation Hooks
 * Create, update, delete DHCP servers, pools, networks, and leases
 * Follows atomic 3-step transaction pattern for server creation
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */
/**
 * Input for creating a DHCP server
 * Combines pool, network, and server configuration
 */
export interface CreateDHCPServerInput {
    name: string;
    interface: string;
    poolStart: string;
    poolEnd: string;
    network: string;
    gateway: string;
    dnsServers: string[];
    leaseTime: string;
    domain?: string;
    ntpServer?: string;
}
/**
 * Input for updating DHCP server settings
 */
export interface UpdateDHCPServerInput {
    serverId: string;
    leaseTime?: string;
    disabled?: boolean;
    authoritative?: boolean;
}
/**
 * Input for making a lease static
 */
export interface MakeLeaseStaticInput {
    leaseId: string;
    address: string;
    macAddress: string;
    hostname?: string;
    comment?: string;
}
/**
 * Result of DHCP server creation (3-step transaction)
 */
interface CreateDHCPServerResult {
    poolId: string;
    networkId: string;
    serverId: string;
}
/**
 * Hook for creating DHCP servers
 * Handles atomic transaction with automatic rollback on failure
 */
export declare function useCreateDHCPServer(routerIp: string): import("@tanstack/react-query").UseMutationResult<CreateDHCPServerResult, Error, CreateDHCPServerInput, unknown>;
/**
 * Hook for updating DHCP server settings
 */
export declare function useUpdateDHCPServer(routerIp: string): import("@tanstack/react-query").UseMutationResult<void, Error, UpdateDHCPServerInput, unknown>;
/**
 * Hook for deleting DHCP servers
 */
export declare function useDeleteDHCPServer(routerIp: string): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
/**
 * Hook for enabling DHCP servers
 */
export declare function useEnableDHCPServer(routerIp: string): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
/**
 * Hook for disabling DHCP servers
 */
export declare function useDisableDHCPServer(routerIp: string): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
/**
 * Hook for converting leases to static bindings
 */
export declare function useMakeLeaseStatic(routerIp: string): import("@tanstack/react-query").UseMutationResult<void, Error, MakeLeaseStaticInput, unknown>;
/**
 * Hook for deleting DHCP leases
 */
export declare function useDeleteLease(routerIp: string): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
export {};
//# sourceMappingURL=mutations.d.ts.map