import type { DomesticUplink, StarlinkUplink, WanVpnClient } from '../../api';
import { initial, type State } from '../easy-config/state';

export function seedStarlink(entity?: StarlinkUplink): State {
  if (!entity) return { ...initial };
  return {
    ...initial,
    starlinkInterfaceType: entity.interfaceType,
    starlinkInterface: entity.interfaceName,
    starlinkWanSsid: entity.wirelessSsid ?? '',
    starlinkWanPassword: entity.wirelessPassword ?? '',
  };
}

export function starlinkFromState(
  s: State,
  routerId: string,
  name: string,
  enabled: boolean,
): Omit<StarlinkUplink, 'id'> {
  const wireless = s.starlinkInterfaceType === 'wireless';
  return {
    routerId,
    name,
    enabled,
    interfaceType: s.starlinkInterfaceType,
    interfaceName: s.starlinkInterface,
    wirelessSsid: wireless ? s.starlinkWanSsid : undefined,
    wirelessPassword: wireless ? s.starlinkWanPassword : undefined,
  };
}

export function seedDomestic(entity?: DomesticUplink): State {
  if (!entity) return { ...initial };
  return {
    ...initial,
    domesticInterfaceType: entity.interfaceType,
    domesticInterface: entity.interfaceName,
    domesticWanSsid: entity.wirelessSsid ?? '',
    domesticWanPassword: entity.wirelessPassword ?? '',
    domesticMode: entity.mode,
    pppoeUser: entity.pppoeUser ?? '',
    pppoePassword: entity.pppoePassword ?? '',
    staticIp: entity.staticIp ?? '',
    staticGateway: entity.staticGateway ?? '',
    staticDns: entity.staticDns ?? '',
  };
}

export function domesticFromState(
  s: State,
  routerId: string,
  name: string,
  enabled: boolean,
): Omit<DomesticUplink, 'id'> {
  const wireless = s.domesticInterfaceType === 'wireless';
  return {
    routerId,
    name,
    enabled,
    interfaceType: s.domesticInterfaceType,
    interfaceName: s.domesticInterface,
    wirelessSsid: wireless ? s.domesticWanSsid : undefined,
    wirelessPassword: wireless ? s.domesticWanPassword : undefined,
    mode: s.domesticMode,
    pppoeUser: s.domesticMode === 'pppoe' ? s.pppoeUser : undefined,
    pppoePassword: s.domesticMode === 'pppoe' ? s.pppoePassword : undefined,
    staticIp: s.domesticMode === 'static' ? s.staticIp : undefined,
    staticGateway: s.domesticMode === 'static' ? s.staticGateway : undefined,
    staticDns: s.domesticMode === 'static' ? s.staticDns : undefined,
  };
}

export function seedVpn(entity?: WanVpnClient): State {
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

export function vpnFromState(
  s: State,
  routerId: string,
  name: string,
  enabled: boolean,
): Omit<WanVpnClient, 'id'> {
  const base = { routerId, name, kind: s.ipMaskKind, enabled };
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
