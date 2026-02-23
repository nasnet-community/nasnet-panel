
import { type InterfaceType } from '@nasnet/core/types';

import { InterfaceTypeIcon } from './InterfaceTypeIcon';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceTypeIcon> = {
  title: 'App/Network/InterfaceTypeIcon',
  component: InterfaceTypeIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Maps a MikroTik interface type string to the appropriate Lucide icon. Covers ether (Network), bridge (Layers), vlan (Tag), wireless/wlan (Wifi), pppoe (Link), vpn (Shield), wireguard (Lock), loopback (RefreshCw), lte (Signal), and a HelpCircle fallback for unknown types. Accepts an optional className for sizing and colour overrides.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'ether',
        'bridge',
        'vlan',
        'wireless',
        'wlan',
        'pppoe',
        'vpn',
        'wireguard',
        'loopback',
        'lte',
        'other',
      ] satisfies InterfaceType[],
      description: 'MikroTik interface type',
    },
    className: {
      control: 'text',
      description: 'Tailwind class string for size / colour override',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceTypeIcon>;

// ---------------------------------------------------------------------------
// Individual type stories
// ---------------------------------------------------------------------------

export const Ethernet: Story = {
  name: 'ether — Ethernet (Network icon)',
  args: { type: 'ether', className: 'w-6 h-6 text-info' },
};

export const Bridge: Story = {
  name: 'bridge — Bridge (Layers icon)',
  args: { type: 'bridge', className: 'w-6 h-6 text-primary' },
};

export const VLAN: Story = {
  name: 'vlan — VLAN (Tag icon)',
  args: { type: 'vlan', className: 'w-6 h-6 text-primary' },
};

export const Wireless: Story = {
  name: 'wireless — Wireless (Wifi icon)',
  args: { type: 'wireless', className: 'w-6 h-6 text-info' },
};

export const WlanAlias: Story = {
  name: 'wlan — WLAN alias (same Wifi icon)',
  args: { type: 'wlan', className: 'w-6 h-6 text-info' },
};

export const PPPoE: Story = {
  name: 'pppoe — PPPoE (Link icon)',
  args: { type: 'pppoe', className: 'w-6 h-6 text-warning' },
};

export const VPN: Story = {
  name: 'vpn — VPN (Shield icon)',
  args: { type: 'vpn', className: 'w-6 h-6 text-success' },
};

export const WireGuard: Story = {
  name: 'wireguard — WireGuard (Lock icon)',
  args: { type: 'wireguard', className: 'w-6 h-6 text-success' },
};

export const Loopback: Story = {
  name: 'loopback — Loopback (RefreshCw icon)',
  args: { type: 'loopback', className: 'w-6 h-6 text-muted-foreground' },
};

export const LTE: Story = {
  name: 'lte — LTE (Signal icon)',
  args: { type: 'lte', className: 'w-6 h-6 text-error' },
};

export const UnknownFallback: Story = {
  name: 'other — Unknown type fallback (HelpCircle icon)',
  args: { type: 'other', className: 'w-6 h-6 text-muted-foreground' },
};

// ---------------------------------------------------------------------------
// Gallery: all types side-by-side using a render override
// ---------------------------------------------------------------------------

const ALL_TYPES: { type: InterfaceType; label: string }[] = [
  { type: 'ether', label: 'ether' },
  { type: 'bridge', label: 'bridge' },
  { type: 'vlan', label: 'vlan' },
  { type: 'wireless', label: 'wireless' },
  { type: 'wlan', label: 'wlan' },
  { type: 'pppoe', label: 'pppoe' },
  { type: 'vpn', label: 'vpn' },
  { type: 'wireguard', label: 'wireguard' },
  { type: 'loopback', label: 'loopback' },
  { type: 'lte', label: 'lte' },
  { type: 'other', label: 'other' },
];

export const Gallery: Story = {
  name: 'Gallery — All Types',
  args: { type: 'ether' },
  render: () => (
    <div className="flex flex-wrap gap-6 p-4">
      {ALL_TYPES.map(({ type, label }) => (
        <div key={type} className="flex flex-col items-center gap-1">
          <InterfaceTypeIcon type={type} className="w-7 h-7 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side gallery of every supported interface type with its icon and label, useful for visual regression testing.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
