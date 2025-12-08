/**
 * Delete VPN Interface Mutation Hook
 * Deletes VPN interfaces for all protocols
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { VPNProtocol } from '@nasnet/core/types';
import { vpnKeys } from '../queryKeys';
import { toast } from '@nasnet/ui/primitives';

/**
 * Request payload for deleting VPN interface
 */
export interface DeleteVPNInterfaceRequest {
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  type: 'server' | 'client' | 'peer';
}

/**
 * Map protocol to RouterOS endpoint
 */
function getEndpointForProtocol(protocol: VPNProtocol, type: string): string {
  switch (protocol) {
    case 'wireguard':
      return type === 'peer' ? 'interface/wireguard/peers/remove' : 'interface/wireguard/remove';
    case 'openvpn':
      return type === 'server' ? 'interface/ovpn-server/remove' : 'interface/ovpn-client/remove';
    case 'l2tp':
      return 'interface/l2tp-client/remove';
    case 'pptp':
      return 'interface/pptp-client/remove';
    case 'sstp':
      return 'interface/sstp-client/remove';
    case 'ikev2':
      return 'ip/ipsec/peer/remove';
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

/**
 * Delete VPN interface via RouterOS API
 */
async function deleteVPNInterface({
  routerIp,
  id,
  protocol,
  type,
}: DeleteVPNInterfaceRequest): Promise<void> {
  const endpoint = getEndpointForProtocol(protocol, type);

  const result = await makeRouterOSRequest<void>(
    routerIp,
    endpoint,
    {
      method: 'POST',
      body: {
        '.id': id,
      },
    }
  );

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete VPN interface');
  }
}

/**
 * Get query keys to invalidate for a protocol
 */
function getQueryKeysForProtocol(protocol: VPNProtocol, routerIp: string) {
  const keys: (readonly string[])[] = [vpnKeys.stats(routerIp)];
  
  switch (protocol) {
    case 'wireguard':
      keys.push(vpnKeys.wireguardInterfaces(routerIp));
      break;
    case 'openvpn':
      keys.push(vpnKeys.openvpnServers(routerIp), vpnKeys.openvpnClients(routerIp));
      break;
    case 'l2tp':
      keys.push(vpnKeys.l2tpClients(routerIp));
      break;
    case 'pptp':
      keys.push(vpnKeys.pptpClients(routerIp));
      break;
    case 'sstp':
      keys.push(vpnKeys.sstpClients(routerIp));
      break;
    case 'ikev2':
      keys.push(vpnKeys.ipsecPeers(routerIp));
      break;
  }
  
  return keys;
}

/**
 * Hook for deleting VPN interfaces
 */
export function useDeleteVPNInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVPNInterface,

    onSuccess: (_, variables) => {
      const { routerIp, name, protocol } = variables;

      // Invalidate relevant queries
      const keys = getQueryKeysForProtocol(protocol, routerIp);
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: `${name} deleted`,
        description: `${protocol.toUpperCase()} interface has been deleted successfully`,
      });
    },

    onError: (error, variables) => {
      const { name } = variables;

      toast({
        variant: 'destructive',
        title: `Failed to delete ${name}`,
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
      });
    },
  });
}

