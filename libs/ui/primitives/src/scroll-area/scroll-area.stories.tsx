import * as React from 'react';

import { ScrollArea, ScrollBar } from './scroll-area';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof ScrollArea> = {
  title: 'Primitives/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A scroll area component built on Radix UI ScrollArea primitive. Provides a custom-styled, cross-browser scrollbar. Supports vertical and horizontal scrolling via the ScrollBar sub-component.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const logLines = [
  '10:00:01 info  firewall: rule #1 matched — accepted tcp 192.168.1.5:54312 → 8.8.8.8:53',
  '10:00:02 info  dhcp: lease 192.168.1.100 assigned to DC:A6:32:1A:2B:3C',
  '10:00:03 warn  cpu: usage at 74% — above threshold',
  '10:00:04 info  interface: ether1 link up 1Gbps full-duplex',
  '10:00:05 error vpn: wireguard peer handshake timeout (peer: 203.0.113.45)',
  '10:00:06 info  firewall: rule #4 matched — dropped udp 10.0.0.1:5353 → 224.0.0.251:5353',
  '10:00:07 info  dhcp: lease 192.168.1.101 renewed for DC:A6:32:1A:FF:01',
  '10:00:08 warn  memory: usage at 82% — consider restarting idle services',
  '10:00:09 info  nat: masquerade applied — 192.168.1.5 → 203.0.113.1',
  '10:00:10 info  routing: OSPF route 10.10.0.0/24 via 192.168.1.254 cost 10',
  '10:00:11 info  firewall: rule #2 matched — accepted tcp 192.168.1.20:43210 → 1.1.1.1:443',
  '10:00:12 error interface: ether3 link down — cable disconnected',
  '10:00:13 info  system: scheduled backup completed — 142 KB written',
  '10:00:14 warn  firewall: flood detected from 203.0.113.99 — rate limiting applied',
  '10:00:15 info  vpn: wireguard peer 10.8.0.2 connected — handshake OK',
];

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-64 w-[420px] rounded-lg border border-border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-semibold">System Log</h4>
        {logLines.map((line, i) => (
          <p key={i} className="mb-1.5 font-mono text-xs text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

const interfaces = [
  { name: 'ether1', type: 'Ethernet', speed: '1Gbps', status: 'running', ip: '203.0.113.1/30' },
  { name: 'ether2', type: 'Ethernet', speed: '1Gbps', status: 'running', ip: '192.168.1.1/24' },
  { name: 'ether3', type: 'Ethernet', speed: '100Mbps', status: 'disabled', ip: '' },
  { name: 'wlan1', type: 'Wireless', speed: '300Mbps', status: 'running', ip: '192.168.2.1/24' },
  { name: 'bridge1', type: 'Bridge', speed: '1Gbps', status: 'running', ip: '10.0.0.1/8' },
  { name: 'vlan10', type: 'VLAN', speed: '1Gbps', status: 'running', ip: '172.16.10.1/24' },
  { name: 'vlan20', type: 'VLAN', speed: '1Gbps', status: 'running', ip: '172.16.20.1/24' },
  { name: 'ovpn-out1', type: 'OpenVPN', speed: '—', status: 'running', ip: '10.8.0.1/24' },
  { name: 'wg0', type: 'WireGuard', speed: '—', status: 'running', ip: '10.9.0.1/24' },
  { name: 'pppoe-out1', type: 'PPPoE', speed: '100Mbps', status: 'disabled', ip: '' },
];

export const InterfaceList: Story = {
  render: () => (
    <ScrollArea className="h-72 w-[500px] rounded-lg border border-border">
      <div className="p-3">
        <h4 className="mb-3 px-1 text-sm font-semibold">Network Interfaces</h4>
        <div className="space-y-1">
          {interfaces.map((iface) => (
            <div
              key={iface.name}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    iface.status === 'running' ? 'bg-success' : 'bg-muted-foreground'
                  }`}
                />
                <span className="font-mono text-sm font-medium">{iface.name}</span>
                <span className="text-xs text-muted-foreground">{iface.type}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {iface.ip && <span className="font-mono">{iface.ip}</span>}
                <span>{iface.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  ),
};

const columns = ['Name', 'Chain', 'Action', 'Src Address', 'Dst Address', 'Protocol', 'Port', 'Comment', 'Bytes', 'Packets'];
const firewallRows = Array.from({ length: 12 }, (_, i) => ({
  name: `rule-${i + 1}`,
  chain: i % 3 === 0 ? 'forward' : 'input',
  action: i % 4 === 0 ? 'drop' : 'accept',
  src: i % 2 === 0 ? '192.168.1.0/24' : 'any',
  dst: 'any',
  protocol: i % 3 === 0 ? 'tcp' : 'all',
  port: i % 3 === 0 ? String(80 + i) : 'any',
  comment: `Auto rule ${i + 1}`,
  bytes: `${(Math.random() * 10000).toFixed(0)} KiB`,
  packets: String(Math.floor(Math.random() * 5000)),
}));

export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-[480px] rounded-lg border border-border">
      <div className="min-w-max">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {firewallRows.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-2 font-mono">{row.name}</td>
                <td className="whitespace-nowrap px-4 py-2">{row.chain}</td>
                <td
                  className={`whitespace-nowrap px-4 py-2 ${
                    row.action === 'accept' ? 'text-success' : 'text-error'
                  }`}
                >
                  {row.action}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono">{row.src}</td>
                <td className="whitespace-nowrap px-4 py-2 font-mono">{row.dst}</td>
                <td className="whitespace-nowrap px-4 py-2">{row.protocol}</td>
                <td className="whitespace-nowrap px-4 py-2 font-mono">{row.port}</td>
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{row.comment}</td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-muted-foreground">{row.bytes}</td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-muted-foreground">{row.packets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const SmallViewport: Story = {
  render: () => (
    <ScrollArea className="h-32 w-64 rounded-lg border border-border">
      <div className="p-3 space-y-1">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm text-muted-foreground whitespace-nowrap">
            Item {i + 1} — network.device.{i + 1}.local
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <ScrollArea className="h-48 w-80 rounded-lg border border-border">
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">No log entries found.</p>
      </div>
    </ScrollArea>
  ),
};
