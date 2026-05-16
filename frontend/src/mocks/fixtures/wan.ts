import type { DomesticUplink, StarlinkUplink, WanVpnClient } from '../types';

export const seededStarlinkUplinks = (): StarlinkUplink[] => [
  {
    id: 'wan_sl_ubud',
    routerId: 'rtr_ubud',
    name: 'Starlink Primary',
    interfaceType: 'ethernet',
    interfaceName: 'ether1',
    enabled: true,
  },
];

export const seededDomesticUplinks = (): DomesticUplink[] => [
  {
    id: 'wan_dom_ubud',
    routerId: 'rtr_ubud',
    name: 'Domestic Fiber',
    interfaceType: 'ethernet',
    interfaceName: 'ether2',
    mode: 'pppoe',
    pppoeUser: 'isp-user',
    pppoePassword: 'isp-pass',
    enabled: true,
  },
];

export const seededMaskingVpnClients = (): WanVpnClient[] => [
  {
    id: 'wan_mvpn_ubud',
    routerId: 'rtr_ubud',
    name: 'mask-wg',
    kind: 'wireguard',
    wgEndpoint: 'mask.example.com',
    wgEndpointPort: '51820',
    wgAllowedIps: '0.0.0.0/0',
    wgKeepalive: '25',
    wgMtu: '1420',
    enabled: true,
  },
];

export const seededDomesticVpnInterfaces = (): WanVpnClient[] => [
  {
    id: 'wan_dvpn_ubud',
    routerId: 'rtr_ubud',
    name: 'dom-l2tp',
    kind: 'l2tp',
    l2tpServer: 'corp.example.com',
    l2tpUsername: 'road',
    l2tpPassword: 'warrior',
    l2tpUseIpsec: false,
    enabled: false,
  },
];
