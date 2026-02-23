/**
 * NetworkStatusHero Stories
 *
 * Displays a three-column stats hero: active interfaces count with a progress bar,
 * total download bytes (+ optional live rate), and total upload bytes (+ optional live rate).
 * Prop-driven — no stores or routing required.
 */


import type { NetworkInterface } from '@nasnet/core/types';

import { NetworkStatusHero } from './NetworkStatusHero';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const allRunning: NetworkInterface[] = [
  { id: '1', name: 'ether1', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:01', linkStatus: 'up' },
  { id: '2', name: 'ether2', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:02', linkStatus: 'up' },
  { id: '3', name: 'bridge1', type: 'bridge', status: 'running', macAddress: 'AA:BB:CC:DD:EE:03', linkStatus: 'up' },
  { id: '4', name: 'wlan1', type: 'wireless', status: 'running', macAddress: 'AA:BB:CC:DD:EE:04', linkStatus: 'up' },
];

const mixedInterfaces: NetworkInterface[] = [
  { id: '1', name: 'ether1', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:01', linkStatus: 'up' },
  { id: '2', name: 'ether2', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:02', linkStatus: 'up' },
  { id: '3', name: 'ether3', type: 'ether', status: 'disabled', macAddress: 'AA:BB:CC:DD:EE:03', linkStatus: 'down' },
  { id: '4', name: 'wlan1', type: 'wireless', status: 'disabled', macAddress: 'AA:BB:CC:DD:EE:04', linkStatus: 'down' },
  { id: '5', name: 'vpn0', type: 'vpn', status: 'running', macAddress: 'AA:BB:CC:DD:EE:05', linkStatus: 'up' },
];

const noInterfaces: NetworkInterface[] = [];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkStatusHero> = {
  title: 'App/Network/NetworkStatusHero',
  component: NetworkStatusHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Three-column hero strip shown at the top of the Network Dashboard. ' +
          'Columns: (1) active vs. total interface count with a cyan progress bar, ' +
          '(2) cumulative download bytes with optional live rx-rate, ' +
          '(3) cumulative upload bytes with optional live tx-rate. ' +
          'Supports a full skeleton loading state.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkStatusHero>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AllInterfacesActive: Story = {
  args: {
    interfaces: allRunning,
    totalTraffic: {
      rxBytes: 1_073_741_824, // 1 GiB
      txBytes: 268_435_456,   // 256 MiB
      rxRate: 5_242_880,      // 5 MiB/s
      txRate: 1_048_576,      // 1 MiB/s
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'All 4 interfaces running. Progress bar is at 100%. Live rates are shown beneath the byte totals.',
      },
    },
  },
};

export const PartialInterfaces: Story = {
  args: {
    interfaces: mixedInterfaces,
    totalTraffic: {
      rxBytes: 536_870_912, // 512 MiB
      txBytes: 134_217_728, // 128 MiB
      rxRate: 2_097_152,    // 2 MiB/s
      txRate: 524_288,      // 512 KiB/s
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: '3 of 5 interfaces active (60%). The progress bar reflects partial utilisation.',
      },
    },
  },
};

export const NoTrafficRates: Story = {
  args: {
    interfaces: allRunning,
    totalTraffic: {
      rxBytes: 2_147_483_648, // 2 GiB
      txBytes: 1_073_741_824, // 1 GiB
      // rxRate / txRate omitted — rate rows should not render
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Traffic totals present but no live rate data available. Rate sub-lines are hidden.',
      },
    },
  },
};

export const NoInterfaces: Story = {
  args: {
    interfaces: noInterfaces,
    totalTraffic: undefined,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Zero interfaces discovered. Active count shows 0/0 and traffic shows "0 B".',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    interfaces: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full skeleton/pulse loading state shown while data is being fetched.',
      },
    },
  },
};

export const Mobile: Story = {
  ...AllInterfacesActive,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...AllInterfacesActive,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
