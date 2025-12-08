/**
 * Create VPN Interface Mutation Hook
 * Creates new VPN interfaces for all protocols
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { 
  VPNProtocol,
  WireGuardServerInput,
  WireGuardPeerInput,
  OpenVPNServerInput,
  OpenVPNClientInput,
  PPPClientInput,
  IPsecPeerInput,
} from '@nasnet/core/types';
import { vpnKeys } from '../queryKeys';
import { toast } from '@nasnet/ui/primitives';

/**
 * Union type for all VPN creation inputs
 */
export type VPNCreateInput = 
  | { protocol: 'wireguard'; type: 'server'; data: WireGuardServerInput }
  | { protocol: 'wireguard'; type: 'peer'; data: WireGuardPeerInput }
  | { protocol: 'openvpn'; type: 'server'; data: OpenVPNServerInput }
  | { protocol: 'openvpn'; type: 'client'; data: OpenVPNClientInput }
  | { protocol: 'l2tp'; type: 'client'; data: PPPClientInput }
  | { protocol: 'pptp'; type: 'client'; data: PPPClientInput }
  | { protocol: 'sstp'; type: 'client'; data: PPPClientInput }
  | { protocol: 'ikev2'; type: 'peer'; data: IPsecPeerInput };

/**
 * Request payload for creating VPN interface
 */
export interface CreateVPNInterfaceRequest {
  routerIp: string;
  input: VPNCreateInput;
}

/**
 * Map input to RouterOS endpoint and body
 */
function getEndpointAndBody(input: VPNCreateInput): { endpoint: string; body: Record<string, unknown> } {
  switch (input.protocol) {
    case 'wireguard':
      if (input.type === 'server') {
        const data = input.data as WireGuardServerInput;
        return {
          endpoint: 'interface/wireguard/add',
          body: {
            name: data.name,
            'listen-port': data.listenPort.toString(),
            mtu: data.mtu?.toString() || '1420',
            'private-key': data.privateKey,
            disabled: data.disabled ? 'yes' : 'no',
            comment: data.comment,
          },
        };
      } else {
        const data = input.data as WireGuardPeerInput;
        return {
          endpoint: 'interface/wireguard/peers/add',
          body: {
            interface: data.interface,
            'public-key': data.publicKey,
            'preshared-key': data.presharedKey,
            endpoint: data.endpoint,
            'allowed-address': data.allowedAddress.join(','),
            'persistent-keepalive': data.persistentKeepalive?.toString(),
            disabled: data.disabled ? 'yes' : 'no',
            comment: data.comment,
          },
        };
      }

    case 'openvpn':
      if (input.type === 'server') {
        const data = input.data as OpenVPNServerInput;
        return {
          endpoint: 'interface/ovpn-server/add',
          body: {
            name: data.name,
            port: data.port.toString(),
            mode: data.mode,
            protocol: data.protocol || 'tcp',
            'max-mtu': data.maxMtu?.toString() || '1500',
            certificate: data.certificate,
            'require-client-certificate': data.requireClientCertificate ? 'yes' : 'no',
            auth: data.auth || 'sha1',
            cipher: data.cipher || 'aes256-cbc',
            'default-profile': data.defaultProfile,
            disabled: data.disabled ? 'yes' : 'no',
            comment: data.comment,
          },
        };
      } else {
        const data = input.data as OpenVPNClientInput;
        return {
          endpoint: 'interface/ovpn-client/add',
          body: {
            name: data.name,
            'connect-to': data.connectTo,
            port: data.port.toString(),
            mode: data.mode,
            protocol: data.protocol || 'tcp',
            user: data.user,
            password: data.password,
            certificate: data.certificate,
            'verify-server-certificate': data.verifyCertificate ? 'yes' : 'no',
            auth: data.auth || 'sha1',
            cipher: data.cipher || 'aes256-cbc',
            'add-default-route': data.addDefaultRoute ? 'yes' : 'no',
            disabled: data.disabled ? 'yes' : 'no',
            comment: data.comment,
          },
        };
      }

    case 'l2tp': {
      const data = input.data as PPPClientInput;
      return {
        endpoint: 'interface/l2tp-client/add',
        body: {
          name: data.name,
          'connect-to': data.connectTo,
          user: data.user,
          password: data.password,
          profile: data.profile,
          'add-default-route': data.addDefaultRoute ? 'yes' : 'no',
          'use-ipsec': data.useIpsec ? 'yes' : 'no',
          'ipsec-secret': data.ipsecSecret,
          disabled: data.disabled ? 'yes' : 'no',
          comment: data.comment,
        },
      };
    }

    case 'pptp': {
      const data = input.data as PPPClientInput;
      return {
        endpoint: 'interface/pptp-client/add',
        body: {
          name: data.name,
          'connect-to': data.connectTo,
          user: data.user,
          password: data.password,
          profile: data.profile,
          'add-default-route': data.addDefaultRoute ? 'yes' : 'no',
          disabled: data.disabled ? 'yes' : 'no',
          comment: data.comment,
        },
      };
    }

    case 'sstp': {
      const data = input.data as PPPClientInput;
      return {
        endpoint: 'interface/sstp-client/add',
        body: {
          name: data.name,
          'connect-to': data.connectTo,
          user: data.user,
          password: data.password,
          profile: data.profile,
          'add-default-route': data.addDefaultRoute ? 'yes' : 'no',
          disabled: data.disabled ? 'yes' : 'no',
          comment: data.comment,
        },
      };
    }

    case 'ikev2': {
      const data = input.data as IPsecPeerInput;
      return {
        endpoint: 'ip/ipsec/peer/add',
        body: {
          name: data.name,
          address: data.address,
          profile: data.profile || 'default',
          'exchange-mode': data.exchangeMode || 'ike2',
          passive: data.passive ? 'yes' : 'no',
          'local-address': data.localAddress,
          port: data.port?.toString() || '500',
          disabled: data.disabled ? 'yes' : 'no',
          comment: data.comment,
        },
      };
    }

    default:
      throw new Error(`Unsupported protocol`);
  }
}

/**
 * Create VPN interface via RouterOS API
 */
async function createVPNInterface({
  routerIp,
  input,
}: CreateVPNInterfaceRequest): Promise<{ id: string }> {
  const { endpoint, body } = getEndpointAndBody(input);
  
  // Remove undefined values
  const cleanBody = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined)
  );

  const result = await makeRouterOSRequest<{ ret: string } | undefined>(
    routerIp,
    endpoint,
    {
      method: 'POST',
      body: cleanBody,
    }
  );

  if (!result.success) {
    throw new Error(result.error || 'Failed to create VPN interface');
  }

  return { id: result.data?.ret || 'created' };
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
 * Hook for creating VPN interfaces
 */
export function useCreateVPNInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVPNInterface,

    onSuccess: (_, variables) => {
      const { routerIp, input } = variables;

      // Invalidate relevant queries
      const keys = getQueryKeysForProtocol(input.protocol, routerIp);
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: 'VPN interface created',
        description: `${input.protocol.toUpperCase()} ${input.type} has been created successfully`,
      });
    },

    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create VPN interface',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
      });
    },
  });
}

