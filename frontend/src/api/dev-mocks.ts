import type { InterfaceResponse, IpAddressResponse, RouteResponse } from './system';

const enabled =
  process.env.NODE_ENV !== 'production' && typeof navigator !== 'undefined' && !navigator.webdriver;

const interfaces: InterfaceResponse[] = [
  {
    id: '*1',
    name: 'ether1',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '1Gbps',
    comment: 'Starlink uplink',
    rxMbps: 84.32,
    txMbps: 12.7,
  },
  {
    id: '*2',
    name: 'ether2',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '1Gbps',
    comment: 'Domestic ISP',
    rxMbps: 41.9,
    txMbps: 8.05,
  },
  { id: '*3', name: 'ether3', type: 'ether', running: false, disabled: false },
  {
    id: '*4',
    name: 'ether4',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '1Gbps',
    rxMbps: 3.21,
    txMbps: 1.04,
  },
  { id: '*5', name: 'ether5', type: 'ether', running: false, disabled: true },
  {
    id: '*6',
    name: 'ether6',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '1Gbps',
    rxMbps: 0.42,
    txMbps: 0.18,
  },
  {
    id: '*7',
    name: 'ether7',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '1Gbps',
    rxMbps: 7.6,
    txMbps: 2.3,
  },
  {
    id: '*8',
    name: 'ether8',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '2.5Gbps',
    rxMbps: 220.5,
    txMbps: 64.8,
  },
  {
    id: '*9',
    name: 'ether9',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '1Gbps',
    rxMbps: 1.15,
    txMbps: 0.6,
  },
  { id: '*10', name: 'ether10', type: 'ether', running: false, disabled: false },
  {
    id: '*20',
    name: 'sfp-sfpplus1',
    type: 'ether',
    running: true,
    disabled: false,
    speed: '10Gbps',
    comment: 'SFP+ uplink',
    rxMbps: 612.4,
    txMbps: 158.9,
  },
  { id: '*30', name: 'bridge1', type: 'bridge', running: true, disabled: false },
];

const addresses: IpAddressResponse[] = [
  { id: '*1', address: '100.64.0.2/24', interface: 'ether1', dynamic: true, disabled: false },
  { id: '*2', address: '203.0.113.10/24', interface: 'ether2', dynamic: false, disabled: false },
  { id: '*3', address: '192.168.88.1/24', interface: 'bridge1', dynamic: false, disabled: false },
];

const routes: RouteResponse[] = [
  {
    id: '*1',
    dstAddress: '0.0.0.0/0',
    gateway: '100.64.0.1',
    interface: 'ether1',
    active: true,
    distance: 1,
  },
  {
    id: '*2',
    dstAddress: '0.0.0.0/0',
    gateway: '203.0.113.1',
    interface: 'ether2',
    active: false,
    distance: 2,
  },
];

const TABLE: Record<string, unknown> = {
  '/api/interfaces': interfaces,
  '/api/ip/addresses': addresses,
  '/api/routes': routes,
};

export function devMock(path: string): unknown | undefined {
  if (!enabled) return undefined;
  return TABLE[path.split('?')[0]];
}
