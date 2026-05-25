import { initial, type State } from '../easy-config/state';
import type { WanVpnFormPayload } from './types';

export function seedVpn(entity?: WanVpnFormPayload): State {
  if (!entity) return { ...initial };
  return {
    ...initial,
    ipMaskKind: entity.kind,
    wgConfig: entity.wgConfig ?? '',
    wgEndpoint: entity.wgEndpoint ?? '',
    wgEndpointPort: entity.wgEndpointPort ?? initial.wgEndpointPort,
    wgPeerPublicKey: entity.wgPeerPublicKey ?? '',
    wgPrivateKey: entity.wgPrivateKey ?? '',
    wgPublicKey: entity.wgPublicKey ?? '',
    wgAllowedIps: entity.wgAllowedIps ?? initial.wgAllowedIps,
    wgKeepalive: entity.wgKeepalive ?? initial.wgKeepalive,
    wgMtu: entity.wgMtu ?? initial.wgMtu,
    l2tpServer: entity.l2tpServer ?? '',
    l2tpUsername: entity.l2tpUsername ?? '',
    l2tpPassword: entity.l2tpPassword ?? '',
    l2tpUseIpsec: entity.l2tpUseIpsec ?? false,
    l2tpIpsecSecret: entity.l2tpIpsecSecret ?? '',
  };
}

export function vpnFromState(s: State, name: string, enabled: boolean): WanVpnFormPayload {
  const base: WanVpnFormPayload = { name, kind: s.ipMaskKind, enabled };
  if (s.ipMaskKind === 'wireguard') {
    return {
      ...base,
      wgConfig: s.wgConfig,
      wgEndpoint: s.wgEndpoint,
      wgEndpointPort: s.wgEndpointPort,
      wgPeerPublicKey: s.wgPeerPublicKey,
      wgPrivateKey: s.wgPrivateKey,
      wgPublicKey: s.wgPublicKey,
      wgAllowedIps: s.wgAllowedIps,
      wgKeepalive: s.wgKeepalive,
      wgMtu: s.wgMtu,
    };
  }
  return {
    ...base,
    l2tpServer: s.l2tpServer,
    l2tpUsername: s.l2tpUsername,
    l2tpPassword: s.l2tpPassword,
    l2tpUseIpsec: s.l2tpUseIpsec,
    l2tpIpsecSecret: s.l2tpIpsecSecret,
  };
}
