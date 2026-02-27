/**
 * DHCP Mutation Hooks
 * Create, update, delete DHCP servers, pools, networks, and leases
 * Follows atomic 3-step transaction pattern for server creation
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { toast } from '@nasnet/ui/primitives';
import { dhcpKeys } from './useDHCP';

/**
 * Input for creating a DHCP server
 * Combines pool, network, and server configuration
 */
export interface CreateDHCPServerInput {
  name: string;
  interface: string;
  poolStart: string;
  poolEnd: string;
  network: string; // CIDR notation, e.g., "192.168.1.0/24"
  gateway: string;
  dnsServers: string[]; // Up to 3 DNS servers
  leaseTime: string; // e.g., "1d", "12h", "3600"
  domain?: string;
  ntpServer?: string;
}

/**
 * Input for updating DHCP server settings
 */
export interface UpdateDHCPServerInput {
  serverId: string; // RouterOS .id
  leaseTime?: string;
  disabled?: boolean;
  authoritative?: boolean;
}

/**
 * Input for making a lease static
 */
export interface MakeLeaseStaticInput {
  leaseId: string; // RouterOS .id of the lease
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
 * Create DHCP server with atomic 3-step transaction
 *
 * Steps:
 * 1. Create address pool (ip/pool/add)
 * 2. Create DHCP network settings (ip/dhcp-server/network/add)
 * 3. Create DHCP server (ip/dhcp-server/add)
 *
 * If any step fails, rollback in reverse order
 */
async function createDHCPServer(
  routerIp: string,
  input: CreateDHCPServerInput
): Promise<CreateDHCPServerResult> {
  let poolId: string | null = null;
  let networkId: string | null = null;

  try {
    // Step 1: Create address pool
    const poolResult = await makeRouterOSRequest<{ ret: string }>(routerIp, 'ip/pool/add', {
      method: 'POST',
      body: {
        name: `pool-${input.name}`,
        ranges: `${input.poolStart}-${input.poolEnd}`,
      },
    });

    if (!poolResult.success || !poolResult.data?.ret) {
      throw new Error(poolResult.error || 'Failed to create address pool');
    }
    poolId = poolResult.data.ret;

    // Step 2: Create DHCP network settings
    const networkBody: Record<string, string> = {
      address: input.network,
      gateway: input.gateway,
      'dns-server': input.dnsServers.join(','),
    };

    if (input.domain) {
      networkBody.domain = input.domain;
    }

    if (input.ntpServer) {
      networkBody['ntp-server'] = input.ntpServer;
    }

    const networkResult = await makeRouterOSRequest<{ ret: string }>(
      routerIp,
      'ip/dhcp-server/network/add',
      {
        method: 'POST',
        body: networkBody,
      }
    );

    if (!networkResult.success || !networkResult.data?.ret) {
      throw new Error(networkResult.error || 'Failed to create DHCP network');
    }
    networkId = networkResult.data.ret;

    // Step 3: Create DHCP server
    const serverResult = await makeRouterOSRequest<{ ret: string }>(
      routerIp,
      'ip/dhcp-server/add',
      {
        method: 'POST',
        body: {
          name: input.name,
          interface: input.interface,
          'address-pool': `pool-${input.name}`,
          'lease-time': input.leaseTime,
          disabled: 'no',
        },
      }
    );

    if (!serverResult.success || !serverResult.data?.ret) {
      throw new Error(serverResult.error || 'Failed to create DHCP server');
    }

    return {
      poolId,
      networkId,
      serverId: serverResult.data.ret,
    };
  } catch (error) {
    // Rollback in reverse order
    if (networkId) {
      try {
        await makeRouterOSRequest(routerIp, 'ip/dhcp-server/network/remove', {
          method: 'POST',
          body: { '.id': networkId },
        });
      } catch (rollbackError) {
        console.error('Failed to rollback DHCP network:', rollbackError);
      }
    }

    if (poolId) {
      try {
        await makeRouterOSRequest(routerIp, 'ip/pool/remove', {
          method: 'POST',
          body: { '.id': poolId },
        });
      } catch (rollbackError) {
        console.error('Failed to rollback address pool:', rollbackError);
      }
    }

    throw error; // Re-throw original error
  }
}

/**
 * Hook for creating DHCP servers
 * Handles atomic transaction with automatic rollback on failure
 */
export function useCreateDHCPServer(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDHCPServerInput) => createDHCPServer(routerIp, input),

    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: dhcpKeys.servers(routerIp) });
      queryClient.invalidateQueries({ queryKey: dhcpKeys.pools(routerIp) });
      queryClient.invalidateQueries({ queryKey: dhcpKeys.leases(routerIp) });

      toast({
        title: 'DHCP server created',
        description: 'The DHCP server has been created successfully',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create DHCP server',
        description:
          error instanceof Error ? error.message : 'An error occurred. Please try again.',
      });
    },
  });
}

/**
 * Update DHCP server settings
 */
async function updateDHCPServer(routerIp: string, input: UpdateDHCPServerInput): Promise<void> {
  const body: Record<string, string> = {
    '.id': input.serverId,
  };

  if (input.leaseTime !== undefined) {
    body['lease-time'] = input.leaseTime;
  }

  if (input.disabled !== undefined) {
    body.disabled = input.disabled ? 'yes' : 'no';
  }

  if (input.authoritative !== undefined) {
    body.authoritative = input.authoritative ? 'yes' : 'no';
  }

  const result = await makeRouterOSRequest(routerIp, 'ip/dhcp-server/set', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to update DHCP server');
  }
}

/**
 * Hook for updating DHCP server settings
 */
export function useUpdateDHCPServer(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDHCPServerInput) => updateDHCPServer(routerIp, input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dhcpKeys.servers(routerIp) });

      toast({
        title: 'DHCP server updated',
        description: 'Server settings have been updated successfully',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update DHCP server',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    },
  });
}

/**
 * Delete DHCP server
 */
async function deleteDHCPServer(routerIp: string, serverId: string): Promise<void> {
  const result = await makeRouterOSRequest(routerIp, 'ip/dhcp-server/remove', {
    method: 'POST',
    body: { '.id': serverId },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete DHCP server');
  }
}

/**
 * Hook for deleting DHCP servers
 */
export function useDeleteDHCPServer(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => deleteDHCPServer(routerIp, serverId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dhcpKeys.servers(routerIp) });
      queryClient.invalidateQueries({ queryKey: dhcpKeys.leases(routerIp) });

      toast({
        title: 'DHCP server deleted',
        description: 'The DHCP server has been removed',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete DHCP server',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    },
  });
}

/**
 * Enable DHCP server
 */
async function enableDHCPServer(routerIp: string, serverId: string): Promise<void> {
  const result = await makeRouterOSRequest(routerIp, 'ip/dhcp-server/set', {
    method: 'POST',
    body: { '.id': serverId, disabled: 'no' },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to enable DHCP server');
  }
}

/**
 * Hook for enabling DHCP servers
 */
export function useEnableDHCPServer(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => enableDHCPServer(routerIp, serverId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dhcpKeys.servers(routerIp) });

      toast({
        title: 'DHCP server enabled',
        description: 'The DHCP server is now active',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to enable DHCP server',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    },
  });
}

/**
 * Disable DHCP server
 */
async function disableDHCPServer(routerIp: string, serverId: string): Promise<void> {
  const result = await makeRouterOSRequest(routerIp, 'ip/dhcp-server/set', {
    method: 'POST',
    body: { '.id': serverId, disabled: 'yes' },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to disable DHCP server');
  }
}

/**
 * Hook for disabling DHCP servers
 */
export function useDisableDHCPServer(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => disableDHCPServer(routerIp, serverId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dhcpKeys.servers(routerIp) });

      toast({
        title: 'DHCP server disabled',
        description: 'The DHCP server is now inactive',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to disable DHCP server',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    },
  });
}

/**
 * Convert a dynamic lease to a static binding
 */
async function makeLeaseStatic(routerIp: string, input: MakeLeaseStaticInput): Promise<void> {
  // First, make the lease static by updating it
  const result = await makeRouterOSRequest(routerIp, 'ip/dhcp-server/lease/make-static', {
    method: 'POST',
    body: {
      '.id': input.leaseId,
      address: input.address,
      'mac-address': input.macAddress,
      'host-name': input.hostname,
      comment: input.comment,
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to make lease static');
  }
}

/**
 * Hook for converting leases to static bindings
 */
export function useMakeLeaseStatic(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MakeLeaseStaticInput) => makeLeaseStatic(routerIp, input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dhcpKeys.leases(routerIp) });

      toast({
        title: 'Lease converted to static',
        description: 'The device will always receive the same IP address',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to make lease static',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    },
  });
}

/**
 * Delete a DHCP lease
 */
async function deleteLease(routerIp: string, leaseId: string): Promise<void> {
  const result = await makeRouterOSRequest(routerIp, 'ip/dhcp-server/lease/remove', {
    method: 'POST',
    body: { '.id': leaseId },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete lease');
  }
}

/**
 * Hook for deleting DHCP leases
 */
export function useDeleteLease(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaseId: string) => deleteLease(routerIp, leaseId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dhcpKeys.leases(routerIp) });

      toast({
        title: 'Lease deleted',
        description: 'The DHCP lease has been removed',
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete lease',
        description: error instanceof Error ? error.message : 'An error occurred.',
      });
    },
  });
}
