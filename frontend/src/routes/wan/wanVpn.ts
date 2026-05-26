import {
  addL2TPClient,
  deleteL2TPClient,
  deleteWireguardInterface,
  importWireguardConfig,
  listVPNClients,
  updateVPNClient,
  type SystemCredentials,
  type VPNClientResponse,
} from '../../api';
import { wanCommentFor, type WanCategory, type WanVpnFormPayload } from './types';

const WAN_VPN_TYPES = new Set(['wg', 'l2tp-out']);

export async function listWanVpnClients(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<VPNClientResponse[]> {
  const all = await listVPNClients(creds, signal);
  return all.filter((c) => WAN_VPN_TYPES.has(c.type));
}

export async function createWanVpn(
  creds: SystemCredentials,
  category: WanCategory,
  payload: WanVpnFormPayload,
): Promise<void> {
  const comment = wanCommentFor(category);

  if (payload.kind === 'l2tp') {
    await addL2TPClient(creds, {
      name: payload.name,
      connectTo: payload.l2tpServer ?? '',
      user: payload.l2tpUsername ?? '',
      password: payload.l2tpPassword ?? '',
      disabled: !payload.enabled,
      ipsecSecret: payload.l2tpUseIpsec ? payload.l2tpIpsecSecret : undefined,
    });
    await updateVPNClient(creds, payload.name, { comment });
    return;
  }

  if (!payload.wgConfig) {
    throw new Error('WireGuard config is required.');
  }
  await importWireguardConfig(creds, {
    interfaceName: payload.name,
    config: payload.wgConfig,
  });
  await updateVPNClient(creds, payload.name, { comment });
}

export async function toggleWanVpn(
  creds: SystemCredentials,
  name: string,
  enabled: boolean,
): Promise<void> {
  await updateVPNClient(creds, name, { disabled: !enabled });
}

export async function deleteWanVpn(
  creds: SystemCredentials,
  client: VPNClientResponse,
): Promise<void> {
  if (client.type === 'wg') {
    await deleteWireguardInterface(creds, client.name);
    return;
  }
  if (client.type === 'l2tp-out') {
    await deleteL2TPClient(creds, client.name);
    return;
  }
  throw new Error(`Unsupported VPN client type: ${client.type}`);
}
