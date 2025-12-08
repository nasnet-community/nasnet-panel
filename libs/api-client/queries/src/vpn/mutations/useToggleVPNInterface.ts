/**
 * Toggle VPN Interface Mutation Hook
 * Enables/disables VPN interfaces for all protocols
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { VPNProtocol } from '@nasnet/core/types';
import { vpnKeys } from '../queryKeys';
import { toast } from '@nasnet/ui/primitives';

/**
 * Request payload for toggling VPN interface state
 */
export interface ToggleVPNInterfaceRequest {
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  disabled: boolean;
}

/**
 * Map protocol to RouterOS endpoint
 */
function getEndpointForProtocol(protocol: VPNProtocol, isServer?: boolean): string {
  switch (protocol) {
    case 'wireguard':
      return 'interface/wireguard/set';
    case 'openvpn':
      return isServer ? 'interface/ovpn-server/server/set' : 'interface/ovpn-client/set';
    case 'l2tp':
      return isServer ? 'interface/l2tp-server/server/set' : 'interface/l2tp-client/set';
    case 'pptp':
      return isServer ? 'interface/pptp-server/server/set' : 'interface/pptp-client/set';
    case 'sstp':
      return isServer ? 'interface/sstp-server/server/set' : 'interface/sstp-client/set';
    case 'ikev2':
      return 'ip/ipsec/peer/set';
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

/**
 * Get the query keys to invalidate for a protocol
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
      keys.push(vpnKeys.l2tpServer(routerIp), vpnKeys.l2tpClients(routerIp));
      break;
    case 'pptp':
      keys.push(vpnKeys.pptpServer(routerIp), vpnKeys.pptpClients(routerIp));
      break;
    case 'sstp':
      keys.push(vpnKeys.sstpServer(routerIp), vpnKeys.sstpClients(routerIp));
      break;
    case 'ikev2':
      keys.push(vpnKeys.ipsecPeers(routerIp), vpnKeys.ipsecActive(routerIp));
      break;
  }
  
  return keys;
}

/**
 * Toggle VPN interface enabled/disabled state
 */
async function toggleVPNInterface({
  routerIp,
  id,
  protocol,
  disabled,
}: ToggleVPNInterfaceRequest): Promise<void> {
  const endpoint = getEndpointForProtocol(protocol);
  
  const body: Record<string, string> = {
    disabled: disabled ? 'yes' : 'no',
  };
  
  // For non-server endpoints, include the ID
  if (!endpoint.includes('server/set')) {
    body['.id'] = id;
  }
  
  const result = await makeRouterOSRequest<void>(
    routerIp,
    endpoint,
    {
      method: 'POST',
      body,
    }
  );

  if (!result.success) {
    throw new Error(result.error || 'Failed to toggle VPN interface');
  }
}

/**
 * Hook for toggling VPN interface state
 */
export function useToggleVPNInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleVPNInterface,

    onSuccess: (_, variables) => {
      const { routerIp, name, protocol, disabled } = variables;
      const action = disabled ? 'disabled' : 'enabled';

      // Invalidate relevant queries
      const keys = getQueryKeysForProtocol(protocol, routerIp);
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: `${name} ${action}`,
        description: `${protocol.toUpperCase()} interface has been ${action}`,
      });
    },

    onError: (error, variables) => {
      const { name } = variables;

      toast({
        variant: 'destructive',
        title: `Failed to toggle ${name}`,
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
      });
    },
  });
}

