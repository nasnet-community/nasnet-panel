/**
 * Storybook stories for ConnectedClientsTable
 * Responsive table (desktop) / card list (mobile) of WiFi clients sorted by signal strength
 */

import type { WirelessClient } from '@nasnet/core/types';

import { ConnectedClientsTable } from './ConnectedClientsTable';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ConnectedClientsTable> = {
  title: 'App/WiFi/ConnectedClientsTable',
  component: ConnectedClientsTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Displays the list of wireless clients currently associated with any of the router's wireless interfaces. Clients are sorted by signal strength (strongest first). On desktop (≥768 px) a full table with MAC address, interface, signal bars + dBm value, TX/RX rates and traffic byte totals, and uptime is rendered. On mobile the same data is shown in compact cards. Supports empty and loading states.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectedClientsTable>;

// ---------------------------------------------------------------------------
// Mock data factory
// ---------------------------------------------------------------------------

const makeClient = (overrides: Partial<WirelessClient> = {}): WirelessClient => ({
  id: 'c1',
  macAddress: 'AA:BB:CC:DD:EE:01',
  interface: 'wlan1',
  signalStrength: -55,
  txRate: 144,
  rxRate: 72,
  uptime: '3h 22m',
  lastActivity: '2s',
  rxBytes: 104_857_600,
  txBytes: 26_214_400,
  rxPackets: 80_000,
  txPackets: 22_000,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (multiple clients)',
  args: {
    clients: [
      makeClient({
        id: 'c1',
        macAddress: 'AA:BB:CC:DD:EE:01',
        signalStrength: -45,
        interface: 'wlan1',
        uptime: '5h 10m',
        rxBytes: 209_715_200,
        txBytes: 52_428_800,
      }),
      makeClient({
        id: 'c2',
        macAddress: 'AA:BB:CC:DD:EE:02',
        signalStrength: -58,
        interface: 'wlan2',
        txRate: 300,
        rxRate: 150,
        uptime: '1h 44m',
        rxBytes: 31_457_280,
        txBytes: 10_485_760,
      }),
      makeClient({
        id: 'c3',
        macAddress: 'AA:BB:CC:DD:EE:03',
        signalStrength: -63,
        interface: 'wlan1',
        txRate: 72,
        rxRate: 36,
        uptime: '12m',
        rxBytes: 5_242_880,
        txBytes: 1_048_576,
      }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three clients across two interfaces, sorted by signal strength (best first). Signal bar icons reflect each level.',
      },
    },
  },
};

export const ExcellentSignal: Story = {
  name: 'Excellent Signal (≥ −50 dBm)',
  args: {
    clients: [
      makeClient({
        id: 'c1',
        macAddress: 'AA:BB:CC:DD:EE:01',
        signalStrength: -42,
        uptime: '8h 05m',
        rxBytes: 524_288_000,
        txBytes: 104_857_600,
      }),
      makeClient({
        id: 'c2',
        macAddress: 'BB:CC:DD:EE:FF:00',
        signalStrength: -47,
        uptime: '4h 30m',
        txRate: 600,
        rxRate: 300,
        rxBytes: 157_286_400,
        txBytes: 31_457_280,
      }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'All clients have excellent signal (above −50 dBm) — four green bars each.',
      },
    },
  },
};

export const MixedSignalLevels: Story = {
  name: 'Mixed Signal Levels',
  args: {
    clients: [
      makeClient({
        id: 'c1',
        macAddress: 'AA:BB:CC:DD:EE:01',
        signalStrength: -48,
        interface: 'wlan2',
        uptime: '6h 00m',
      }),
      makeClient({
        id: 'c2',
        macAddress: 'AA:BB:CC:DD:EE:02',
        signalStrength: -62,
        interface: 'wlan1',
        uptime: '2h 15m',
      }),
      makeClient({
        id: 'c3',
        macAddress: 'AA:BB:CC:DD:EE:03',
        signalStrength: -71,
        interface: 'wlan1',
        txRate: 54,
        rxRate: 27,
        uptime: '35m',
      }),
      makeClient({
        id: 'c4',
        macAddress: 'AA:BB:CC:DD:EE:04',
        signalStrength: -85,
        interface: 'wlan1',
        txRate: 12,
        rxRate: 6,
        uptime: '3m',
        rxBytes: 524_288,
        txBytes: 131_072,
      }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clients covering all four signal bands: Excellent, Good, Fair, and Weak. Verify that signal bar counts (4/3/2/1) and colours (emerald/green/amber/red) are correct.',
      },
    },
  },
};

export const EmptyState: Story = {
  name: 'Empty — No Clients',
  args: {
    clients: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No wireless clients are associated. The empty state with a Signal icon and "No clients connected" message is displayed.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading Skeleton',
  args: {
    clients: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Animated pulse skeleton rendered while client data is being fetched from the router.',
      },
    },
  },
};

export const SingleClient: Story = {
  name: 'Single Client',
  args: {
    clients: [
      makeClient({
        id: 'c1',
        macAddress: 'DE:AD:BE:EF:CA:FE',
        signalStrength: -55,
        interface: 'wlan1',
        uptime: '1h 01m',
      }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case with exactly one client. The section header shows count badge "1" and the table / card renders a single row.',
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
