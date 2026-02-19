/**
 * WifiSecuritySummary Stories
 *
 * Displays a colour-coded security card for every wireless interface,
 * classifying each by its security profile name (WPA3, WPA2, WPA, WEP,
 * or open/unknown).
 */


import type { WirelessInterface } from '@nasnet/core/types';

import { WifiSecuritySummary } from './WifiSecuritySummary';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const wpa3Interface: WirelessInterface = {
  id: '*1',
  name: 'wlan1',
  macAddress: 'AA:BB:CC:DD:EE:01',
  ssid: 'HomeNetwork-5G',
  disabled: false,
  running: true,
  band: '5GHz',
  frequency: 5180,
  channel: '36',
  mode: 'ap-bridge',
  txPower: 20,
  securityProfile: 'wpa3-profile',
  connectedClients: 4,
};

const wpa2Interface: WirelessInterface = {
  id: '*2',
  name: 'wlan2',
  macAddress: 'AA:BB:CC:DD:EE:02',
  ssid: 'HomeNetwork-2.4G',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2412,
  channel: '1',
  mode: 'ap-bridge',
  txPower: 17,
  securityProfile: 'wpa2-profile',
  connectedClients: 7,
};

const wpaInterface: WirelessInterface = {
  id: '*3',
  name: 'wlan3',
  macAddress: 'AA:BB:CC:DD:EE:03',
  ssid: 'LegacyGuest',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2437,
  channel: '6',
  mode: 'ap-bridge',
  txPower: 14,
  securityProfile: 'wpa-only',
  connectedClients: 1,
};

const wepInterface: WirelessInterface = {
  id: '*4',
  name: 'wlan4',
  macAddress: 'AA:BB:CC:DD:EE:04',
  ssid: 'OldPrinter',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2462,
  channel: '11',
  mode: 'ap-bridge',
  txPower: 10,
  securityProfile: 'wep-legacy',
  connectedClients: 1,
};

const openInterface: WirelessInterface = {
  id: '*5',
  name: 'wlan5',
  macAddress: 'AA:BB:CC:DD:EE:05',
  ssid: 'CaptivePortal',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2412,
  channel: '1',
  mode: 'ap-bridge',
  txPower: 15,
  securityProfile: 'none',
  connectedClients: 0,
};

const disabledInterface: WirelessInterface = {
  id: '*6',
  name: 'wlan6',
  macAddress: 'AA:BB:CC:DD:EE:06',
  ssid: null,
  disabled: true,
  running: false,
  band: '5GHz',
  frequency: 5500,
  channel: '100',
  mode: 'ap-bridge',
  txPower: 0,
  securityProfile: '',
  connectedClients: 0,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof WifiSecuritySummary> = {
  title: 'App/WiFi/WifiSecuritySummary',
  component: WifiSecuritySummary,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders a grid of security-profile cards for each wireless ' +
          'interface.  Cards are colour-coded by security level: emerald for ' +
          'WPA3, green for WPA2, amber for WPA/WEP, and red for open networks.',
      },
    },
  },
  argTypes: {
    interfaces: { control: false },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof WifiSecuritySummary>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** All four security tiers represented side-by-side. */
export const Default: Story = {
  args: {
    interfaces: [wpa3Interface, wpa2Interface, wpaInterface, openInterface],
    isLoading: false,
  },
};

/** Single interface showing the WPA3 (strong) card. */
export const StrongSecurity: Story = {
  args: {
    interfaces: [wpa3Interface],
    isLoading: false,
  },
};

/** WPA2 is the most common real-world deployment. */
export const GoodSecurity: Story = {
  args: {
    interfaces: [wpa2Interface],
    isLoading: false,
  },
};

/** Mix of legacy WPA, WEP, and an open interface — highlights risk. */
export const WeakAndOpenSecurity: Story = {
  args: {
    interfaces: [wpaInterface, wepInterface, openInterface],
    isLoading: false,
  },
};

/** Skeleton pulse shown while wireless data is being fetched. */
export const Loading: Story = {
  args: {
    interfaces: [],
    isLoading: true,
  },
};

/**
 * A realistic multi-interface router with mixed security profiles,
 * including a disabled interface with no profile.
 */
export const MixedRealWorld: Story = {
  args: {
    interfaces: [wpa3Interface, wpa2Interface, wpaInterface, openInterface, disabledInterface],
    isLoading: false,
  },
};
