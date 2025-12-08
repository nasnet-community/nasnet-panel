/**
 * Update VPN Interface Mutation Hook
 * Updates existing VPN interfaces for all protocols
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { VPNProtocol } from '@nasnet/core/types';
import { vpnKeys } from '../queryKeys';
import { toast } from '@nasnet/ui/primitives';

/**
 * Request payload for updating VPN interface
 */
export interface UpdateVPNInterfaceRequest {
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  type: 'server' | 'client' | 'peer';
  updates: Record<string, unknown>;
}

/**
 * Map protocol to RouterOS endpoint
 */
function getEndpointForProtocol(protocol: VPNProtocol, type: string): string {
  switch (protocol) {
    case 'wireguard':
      return type === 'peer' ? 'interface/wireguard/peers/set' : 'interface/wireguard/set';
    case 'openvpn':
      return type === 'server' ? 'interface/ovpn-server/set' : 'interface/ovpn-client/set';
    case 'l2tp':
      return type === 'server' ? 'interface/l2tp-server/server/set' : 'interface/l2tp-client/set';
    case 'pptp':
      return type === 'server' ? 'interface/pptp-server/server/set' : 'interface/pptp-client/set';
    case 'sstp':
      return type === 'server' ? 'interface/sstp-server/server/set' : 'interface/sstp-client/set';
    case 'ikev2':
      return 'ip/ipsec/peer/set';
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

/**
 * Convert camelCase to kebab-case for RouterOS
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Update VPN interface via RouterOS API
 */
async function updateVPNInterface({
  routerIp,
  id,
  protocol,
  type,
  updates,
}: UpdateVPNInterfaceRequest): Promise<void> {
  const endpoint = getEndpointForProtocol(protocol, type);
  
  // Convert updates to RouterOS format
  const body: Record<string, string> = {};
  
  // Add ID for non-server endpoints
  if (!endpoint.includes('server/set')) {
    body['.id'] = id;
  }
  
  // Convert each update field
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    
    const rosKey = toKebabCase(key);
    
    if (typeof value === 'boolean') {
      body[rosKey] = value ? 'yes' : 'no';
    } else if (Array.isArray(value)) {
      body[rosKey] = value.join(',');
    } else {
      body[rosKey] = String(value);
    }
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
    throw new Error(result.error || 'Failed to update VPN interface');
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
      keys.push(vpnKeys.l2tpServer(routerIp), vpnKeys.l2tpClients(routerIp));
      break;
    case 'pptp':
      keys.push(vpnKeys.pptpServer(routerIp), vpnKeys.pptpClients(routerIp));
      break;
    case 'sstp':
      keys.push(vpnKeys.sstpServer(routerIp), vpnKeys.sstpClients(routerIp));
      break;
    case 'ikev2':
      keys.push(vpnKeys.ipsecPeers(routerIp));
      break;
  }
  
  return keys;
}

/**
 * Hook for updating VPN interfaces
 */
export function useUpdateVPNInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVPNInterface,

    onSuccess: (_, variables) => {
      const { routerIp, name, protocol } = variables;

      // Invalidate relevant queries
      const keys = getQueryKeysForProtocol(protocol, routerIp);
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: `${name} updated`,
        description: `${protocol.toUpperCase()} interface has been updated successfully`,
      });
    },

    onError: (error, variables) => {
      const { name } = variables;

      toast({
        variant: 'destructive',
        title: `Failed to update ${name}`,
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
      });
    },
  });
}

