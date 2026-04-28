import type { VPNClient, VPNPeer, VPNServer } from '../types';

export const seededVPNClients = (): VPNClient[] => [
  {
    id: 'vpnc_wg_ubud',
    routerId: 'rtr_ubud',
    name: 'starlink-mask',
    protocol: 'wireguard',
    enabled: true,
    running: true,
    endpoint: 'mask.example.com',
    endpointPort: 51820,
    comment: 'IP-mask tunnel',
  },
  {
    id: 'vpnc_l2tp_tehran',
    routerId: 'rtr_tehran',
    name: 'corp-l2tp',
    protocol: 'l2tp',
    enabled: false,
    running: false,
    endpoint: 'corp.example.com',
    username: 'road-warrior',
  },
];

export const seededVPNServers = (): VPNServer[] => [
  {
    id: 'vpns_wg_ubud',
    routerId: 'rtr_ubud',
    name: 'office-wg',
    protocol: 'wireguard',
    listenPort: 51820,
    ipPool: '10.10.0.0/24',
    dns: '10.10.0.1',
    running: true,
  },
];

export const seededVPNPeers = (): VPNPeer[] => [
  {
    id: 'vpnp_phone',
    serverId: 'vpns_wg_ubud',
    routerId: 'rtr_ubud',
    name: 'phone',
    allowedIps: '10.10.0.2/32',
    publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    privateKey: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    enabled: true,
    lastHandshake: '2026-04-17T11:58:00.000Z',
  },
];
