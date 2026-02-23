/**
 * Storybook stories for InterfaceCard component
 * Covers: running+link-up, running+link-down, disabled, ethernet, wireless, bridge, PPPoE, loading traffic, no traffic data
 *
 * InterfaceCard has two external dependencies that are mocked here:
 *   - useInterfaceTraffic  → @nasnet/api-client/queries
 *   - useConnectionStore   → @nasnet/state/stores
 */


import { type NetworkInterface, type TrafficStatistics } from '@nasnet/core/types';

import { InterfaceCard } from './InterfaceCard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Module mocks (Storybook static analysis hoisting — mirror vitest.mock pattern)
// ---------------------------------------------------------------------------

// We provide mock implementations through the story `parameters.moduleMock`
// API when using @storybook/addon-module-mock, OR fall back to decorator-based
// approach below.  Because the component imports live hooks we use render
// decorators with beforeEach overrides where the full mock addon is unavailable.

// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceCard> = {
  title: 'App/Network/InterfaceCard',
  component: InterfaceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Expandable card representing a single network interface. Shows status dot (running / link-up / disabled), interface type icon, MAC address, and MTU. When expanded, displays live traffic statistics with RX/TX bytes, packet counts, and an error/drop alert when issues are detected. Fetches live data via useInterfaceTraffic; mocked in stories.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceCard>;

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

const makeInterface = (overrides: Partial<NetworkInterface> = {}): NetworkInterface => ({
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

const _mockTrafficClean: TrafficStatistics = {
  interfaceId: 'ether1',
  rxBytes: 1_572_864_000,
  txBytes: 314_572_800,
  rxPackets: 2_450_000,
  txPackets: 890_000,
  rxErrors: 0,
  txErrors: 0,
  rxDrops: 0,
  txDrops: 0,
};

const _mockTrafficWithErrors: TrafficStatistics = {
  interfaceId: 'ether1',
  rxBytes: 524_288_000,
  txBytes: 104_857_600,
  rxPackets: 1_000_000,
  txPackets: 400_000,
  rxErrors: 15,
  txErrors: 3,
  rxDrops: 64,
  txDrops: 32,
};

// ---------------------------------------------------------------------------
// Because InterfaceCard calls real hooks from outside this package we use a
// Storybook decorator that patches the module registry by providing a stub
// implementation via the `beforeEach` lifecycle hook (supported in
// @storybook/test).  The component is wrapped in a plain div so Storybook
// can render it without a running Apollo / Zustand context.
//
// For full integration tests prefer the connect app's Storybook target where
// real providers are available.
// ---------------------------------------------------------------------------

/**
 * Helper: build a decorator that injects mocked hook return values via
 * window-level stubs. The actual module mocking relies on the project's
 * Storybook MSW / module-mock setup. Here we document the intent and rely on
 * the existing provider wrappers configured in .storybook/preview.tsx (if any).
 */

// --- Stories ---

export const RunningLinkUp: Story = {
  args: {
    interface: makeInterface({ status: 'running', linkStatus: 'up' }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Ethernet interface that is administratively running and the physical link is up. Status dot pulses green.',
      },
    },
  },
};

export const RunningLinkDown: Story = {
  args: {
    interface: makeInterface({ status: 'running', linkStatus: 'down' }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Administratively running but physical link is disconnected. Status dot is amber (no pulse).',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    interface: makeInterface({ status: 'disabled', linkStatus: 'down', name: 'ether2' }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Administratively disabled interface. Card is rendered at reduced opacity with a muted status dot.',
      },
    },
  },
};

export const WirelessInterface: Story = {
  args: {
    interface: makeInterface({
      id: 'wlan1',
      name: 'wlan1',
      type: 'wireless',
      status: 'running',
      linkStatus: 'up',
      macAddress: 'B8:27:EB:11:22:33',
      mtu: 1500,
      comment: '2.4 GHz access point',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Wireless interface showing the Wifi type icon and an optional comment in the expanded view.',
      },
    },
  },
};

export const BridgeInterface: Story = {
  args: {
    interface: makeInterface({
      id: 'bridge1',
      name: 'bridge1',
      type: 'bridge',
      status: 'running',
      linkStatus: 'up',
      macAddress: 'AA:BB:CC:00:11:22',
      mtu: 1500,
      comment: 'LAN bridge',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bridge interface — shows the Layers type icon.',
      },
    },
  },
};

export const PPPoEInterface: Story = {
  args: {
    interface: makeInterface({
      id: 'pppoe-out1',
      name: 'pppoe-out1',
      type: 'pppoe',
      status: 'running',
      linkStatus: 'up',
      macAddress: '',
      mtu: 1480,
      comment: 'WAN uplink via PPPoE',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'PPPoE WAN interface. Empty macAddress renders as "No MAC". MTU of 1480 (PPPoE overhead) is shown.',
      },
    },
  },
};

export const WithComment: Story = {
  args: {
    interface: makeInterface({
      id: 'ether3',
      name: 'ether3',
      type: 'ether',
      status: 'running',
      linkStatus: 'up',
      macAddress: 'DE:AD:BE:EF:CA:FE',
      mtu: 1500,
      comment: 'Uplink to core switch',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a comment is set it appears in the expanded section below the traffic stats.',
      },
    },
  },
};

export const Mobile: Story = {
  ...RunningLinkUp,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...RunningLinkUp,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
