import type { Interface } from '../types';

export const seededInterfaces = (): Record<string, Interface[]> => ({
  rtr_ubud: [
    {
      name: 'ether1',
      type: 'ether',
      mac: 'AA:BB:CC:00:00:01',
      running: true,
      speed: '1Gbps',
      comment: 'Starlink uplink',
    },
    {
      name: 'ether2',
      type: 'ether',
      mac: 'AA:BB:CC:00:00:02',
      running: true,
      speed: '1Gbps',
      comment: 'Domestic ISP',
    },
    { name: 'ether3', type: 'ether', mac: 'AA:BB:CC:00:00:03', running: false },
    { name: 'bridge1', type: 'bridge', mac: 'AA:BB:CC:00:00:0B', running: true },
    { name: 'wifi2.4', type: 'wireless', mac: 'AA:BB:CC:00:00:0C', running: true, band: '2.4ghz' },
    { name: 'wifi5', type: 'wireless', mac: 'AA:BB:CC:00:00:0D', running: true, band: '5ghz' },
  ],
  rtr_tehran: [
    {
      name: 'ether1',
      type: 'ether',
      mac: 'BB:CC:DD:00:00:01',
      running: true,
      speed: '1Gbps',
      comment: 'WAN uplink',
    },
    { name: 'ether2', type: 'ether', mac: 'BB:CC:DD:00:00:02', running: true, speed: '1Gbps' },
    { name: 'bridge1', type: 'bridge', mac: 'BB:CC:DD:00:00:0B', running: true },
    { name: 'wifi2.4', type: 'wireless', mac: 'BB:CC:DD:00:00:0C', running: true, band: '2.4ghz' },
    { name: 'wifi5', type: 'wireless', mac: 'BB:CC:DD:00:00:0D', running: true, band: '5ghz' },
  ],
  rtr_basecamp: [
    { name: 'ether1', type: 'ether', mac: 'CC:DD:EE:00:00:01', running: false },
    { name: 'ether2', type: 'ether', mac: 'CC:DD:EE:00:00:02', running: false },
  ],
});
