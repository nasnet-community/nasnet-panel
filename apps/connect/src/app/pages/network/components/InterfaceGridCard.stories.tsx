/**
 * Storybook stories for InterfaceGridCard component
 * Compact expandable card used in the network dashboard grid layout.
 *
 * External hook dependencies mocked in the connect Storybook target:
 *   - useInterfaceTraffic  → @nasnet/api-client/queries
 *   - useConnectionStore   → @nasnet/state/stores
 *
 * Stories demonstrate all status combinations and interface types.
 * Traffic statistics will not render in isolation Storybook targets
 * because the Apollo / Zustand providers are absent; use the connect
 * app Storybook for fully hydrated stories.
 */


import { type NetworkInterface } from '@nasnet/core/types';

import { InterfaceGridCard } from './InterfaceGridCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceGridCard> = {
  title: 'App/Network/InterfaceGridCard',
  component: InterfaceGridCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A compact interface card designed for a responsive CSS grid. Shows a pulsing status indicator, interface type icon, interface name, and optionally collapsed traffic byte totals. Clicking the card expands an inline detail panel with MAC address, MTU, packet counts and per-interface traffic. Fetches live traffic data via `useInterfaceTraffic`; mocked in these stories.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InterfaceGridCard>;

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

const makeIface = (overrides: Partial<NetworkInterface> = {}): NetworkInterface => ({
  id: 'ether1',
  name: 'ether1',
  type: 'ether',
  status: 'running',
  macAddress: 'D4:CA:6D:AA:BB:CC',
  linkStatus: 'up',
  mtu: 1500,
  comment: undefined,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const RunningLinkUp: Story = {
  name: 'Running — Link Up (Ethernet)',
  args: {
    interface: makeIface({ status: 'running', linkStatus: 'up' }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully active ethernet interface. The status dot pulses green and the card border turns emerald on hover.',
      },
    },
  },
};

export const RunningLinkDown: Story = {
  name: 'Running — Link Down',
  args: {
    interface: makeIface({ status: 'running', linkStatus: 'down', name: 'ether2' }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Administratively enabled but the physical cable/link is disconnected. Status dot is amber without pulse; card border turns amber.',
      },
    },
  },
};

export const Disabled: Story = {
  name: 'Disabled Interface',
  args: {
    interface: makeIface({
      id: 'ether3',
      name: 'ether3',
      status: 'disabled',
      linkStatus: 'down',
      macAddress: 'AA:BB:CC:DD:EE:FF',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Administratively disabled interface. The card is rendered at reduced opacity (60%) with a muted status dot.',
      },
    },
  },
};

export const WirelessInterface: Story = {
  name: 'Wireless (wlan)',
  args: {
    interface: makeIface({
      id: 'wlan1',
      name: 'wlan1',
      type: 'wireless',
      status: 'running',
      linkStatus: 'up',
      macAddress: 'B8:27:EB:11:22:33',
      mtu: 1500,
      comment: '2.4 GHz AP',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Wireless interface — shows the Wifi icon from InterfaceTypeIcon.',
      },
    },
  },
};

export const BridgeInterface: Story = {
  name: 'Bridge Interface',
  args: {
    interface: makeIface({
      id: 'bridge1',
      name: 'bridge1',
      type: 'bridge',
      status: 'running',
      linkStatus: 'up',
      macAddress: 'CC:DD:EE:FF:00:11',
      mtu: 1500,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'LAN bridge — shows the Layers icon and standard running/up styling.',
      },
    },
  },
};

export const VLANInterface: Story = {
  name: 'VLAN Interface',
  args: {
    interface: makeIface({
      id: 'vlan10',
      name: 'vlan10',
      type: 'vlan',
      status: 'running',
      linkStatus: 'up',
      macAddress: 'AA:BB:CC:00:00:10',
      mtu: 1500,
      comment: 'Management VLAN',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'VLAN sub-interface — shows the Tag icon.',
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
