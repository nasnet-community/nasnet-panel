/**
 * Storybook stories for WifiStatusHero
 * Four-cell stats grid: Connected Clients, Active Interfaces, Signal Quality, Frequency Bands
 */

import type { WirelessInterface, WirelessClient } from '@nasnet/core/types';

import { WifiStatusHero } from './WifiStatusHero';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WifiStatusHero> = {
  title: 'App/WiFi/WifiStatusHero',
  component: WifiStatusHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A responsive 2×4 stats grid placed at the top of the WiFi dashboard page. It summarises the number of connected wireless clients, how many of the router's wireless interfaces are actively running, the average client signal quality (with a progress bar), and which frequency bands (2.4 GHz / 5 GHz / 6 GHz) are in use. Supports a loading skeleton state.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WifiStatusHero>;

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

const makeInterface = (overrides: Partial<WirelessInterface> = {}): WirelessInterface => ({
  id: '*1',
  name: 'wlan1',
  macAddress: 'AA:BB:CC:DD:EE:01',
  ssid: 'HomeNetwork',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2412,
  channel: '1',
  mode: 'ap-bridge',
  txPower: 20,
  securityProfile: 'default',
  connectedClients: 3,
  countryCode: 'US',
  hideSsid: false,
  ...overrides,
});

const makeClient = (overrides: Partial<WirelessClient> = {}): WirelessClient => ({
  id: 'c1',
  macAddress: '11:22:33:44:55:66',
  interface: 'wlan1',
  signalStrength: -55,
  txRate: 144,
  rxRate: 72,
  uptime: '2h 14m',
  lastActivity: '0s',
  rxBytes: 52_428_800,
  txBytes: 10_485_760,
  rxPackets: 42_000,
  txPackets: 12_000,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (dual-band, good signal)',
  args: {
    interfaces: [
      makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 3 }),
      makeInterface({
        id: '*2',
        name: 'wlan2',
        band: '5GHz',
        frequency: 5180,
        channel: '36',
        connectedClients: 2,
      }),
    ],
    clients: [
      makeClient({ id: 'c1', macAddress: '11:22:33:44:55:66', signalStrength: -52 }),
      makeClient({
        id: 'c2',
        macAddress: '22:33:44:55:66:77',
        signalStrength: -58,
        interface: 'wlan2',
      }),
      makeClient({
        id: 'c3',
        macAddress: '33:44:55:66:77:88',
        signalStrength: -61,
        interface: 'wlan2',
      }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typical dual-band router with 2.4 GHz and 5 GHz interfaces and 3 connected clients at good signal quality.',
      },
    },
  },
};

export const TriBand: Story = {
  name: 'Tri-Band (2.4 + 5 + 6 GHz)',
  args: {
    interfaces: [
      makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 2 }),
      makeInterface({
        id: '*2',
        name: 'wlan2',
        band: '5GHz',
        frequency: 5180,
        channel: '36',
        connectedClients: 4,
      }),
      makeInterface({
        id: '*3',
        name: 'wlan3',
        band: '6GHz',
        frequency: 6100,
        channel: '1',
        connectedClients: 1,
      }),
    ],
    clients: [
      makeClient({ id: 'c1', signalStrength: -45 }),
      makeClient({ id: 'c2', signalStrength: -48, interface: 'wlan2' }),
      makeClient({ id: 'c3', signalStrength: -50, interface: 'wlan2' }),
      makeClient({ id: 'c4', signalStrength: -40, interface: 'wlan3' }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tri-band router with all three frequency bands active. All three band badges (2.4G / 5G / 6G) are shown. Average signal is "Excellent".',
      },
    },
  },
};

export const WeakSignal: Story = {
  name: 'Weak Signal',
  args: {
    interfaces: [makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 2 })],
    clients: [
      makeClient({ id: 'c1', signalStrength: -78 }),
      makeClient({ id: 'c2', signalStrength: -82, macAddress: '99:88:77:66:55:44' }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clients with poor signal (below −70 dBm). The Signal cell shows "Weak" in red with a low progress bar.',
      },
    },
  },
};

export const NoClients: Story = {
  name: 'No Clients Connected',
  args: {
    interfaces: [
      makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 0 }),
      makeInterface({
        id: '*2',
        name: 'wlan2',
        band: '5GHz',
        frequency: 5180,
        channel: '36',
        connectedClients: 0,
      }),
    ],
    clients: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interfaces are up but no clients are associated. Client count is 0 and the signal cell shows a dash.',
      },
    },
  },
};

export const OneInterfaceDisabled: Story = {
  name: 'Partial — One Interface Disabled',
  args: {
    interfaces: [
      makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 3 }),
      makeInterface({
        id: '*2',
        name: 'wlan2',
        band: '5GHz',
        frequency: 5180,
        channel: '36',
        disabled: true,
        running: false,
        connectedClients: 0,
      }),
    ],
    clients: [
      makeClient({ id: 'c1', signalStrength: -60 }),
      makeClient({ id: 'c2', signalStrength: -65, macAddress: 'FF:EE:DD:CC:BB:AA' }),
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'One of two interfaces is disabled. The Active tile shows "1/2" with a 50% progress bar.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading Skeleton',
  args: {
    interfaces: [],
    clients: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pulse skeleton shown while wireless data is being fetched from the router.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    interfaces: [
      makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 3 }),
      makeInterface({
        id: '*2',
        name: 'wlan2',
        band: '5GHz',
        frequency: 5180,
        channel: '36',
        connectedClients: 2,
      }),
    ],
    clients: [
      makeClient({ id: 'c1', macAddress: '11:22:33:44:55:66', signalStrength: -52 }),
      makeClient({
        id: 'c2',
        macAddress: '22:33:44:55:66:77',
        signalStrength: -58,
        interface: 'wlan2',
      }),
      makeClient({
        id: 'c3',
        macAddress: '33:44:55:66:77:88',
        signalStrength: -61,
        interface: 'wlan2',
      }),
    ],
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    interfaces: [
      makeInterface({ id: '*1', name: 'wlan1', band: '2.4GHz', connectedClients: 3 }),
      makeInterface({
        id: '*2',
        name: 'wlan2',
        band: '5GHz',
        frequency: 5180,
        channel: '36',
        connectedClients: 2,
      }),
    ],
    clients: [
      makeClient({ id: 'c1', macAddress: '11:22:33:44:55:66', signalStrength: -52 }),
      makeClient({
        id: 'c2',
        macAddress: '22:33:44:55:66:77',
        signalStrength: -58,
        interface: 'wlan2',
      }),
      makeClient({
        id: 'c3',
        macAddress: '33:44:55:66:77:88',
        signalStrength: -61,
        interface: 'wlan2',
      }),
    ],
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
