/**
 * WirelessInterfaceDetail Stories
 *
 * Exercises the full detail view for a wireless interface. Each story targets
 * a distinct combination of operating mode, band, security profile presence,
 * signal strength (station mode), hidden SSID, and regional settings.
 *
 * NOTE: WirelessInterfaceDetail mounts InterfaceToggle and WirelessSettingsModal
 * internally. Both components consume runtime hooks (useToggleInterface,
 * useConnectionStore, and mutation hooks). The visual layout driven by the
 * `interface` prop is fully exercised; interactive mutations need provider
 * decorators in a full Storybook environment.
 */

import type {
  WirelessInterfaceDetail as WirelessInterfaceDetailType,
  SecurityProfile,
} from '@nasnet/core/types';

import { WirelessInterfaceDetail } from './WirelessInterfaceDetail';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared security profile fixtures
// ---------------------------------------------------------------------------

const wpa2Profile: SecurityProfile = {
  id: '*1',
  name: 'default',
  mode: 'dynamic-keys',
  authenticationTypes: ['wpa2-psk'],
  wpa2PreSharedKey: 'MySecureP@ssw0rd',
  unicastCiphers: ['aes-ccm'],
  groupCiphers: ['aes-ccm'],
};

const wpa3Profile: SecurityProfile = {
  id: '*2',
  name: 'wpa3-secure',
  mode: 'dynamic-keys',
  authenticationTypes: ['wpa3-psk'],
  wpa2PreSharedKey: 'UltraSecure!2024',
  unicastCiphers: ['aes-ccm'],
  groupCiphers: ['aes-ccm'],
};

const openProfile: SecurityProfile = {
  id: '*3',
  name: 'guest-open',
  mode: 'none',
  authenticationTypes: [],
  unicastCiphers: [],
  groupCiphers: [],
};

// ---------------------------------------------------------------------------
// Base fixture — 2.4 GHz AP mode with WPA2 profile
// ---------------------------------------------------------------------------

const baseApInterface: WirelessInterfaceDetailType = {
  id: '*1',
  name: 'wlan1',
  macAddress: 'AA:BB:CC:DD:EE:01',
  ssid: 'HomeNetwork',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2437,
  channel: '6',
  channelWidth: '20MHz',
  mode: 'ap-bridge',
  txPower: 20,
  securityProfile: 'default',
  connectedClients: 4,
  hideSsid: false,
  countryCode: 'US',
  securityProfileDetails: wpa2Profile,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof WirelessInterfaceDetail> = {
  title: 'Features/Wireless/WirelessInterfaceDetail',
  component: WirelessInterfaceDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Full-detail view for a single wireless interface. Renders cards for ' +
          'the header (SSID, mode, band, enable/disable toggle), radio settings ' +
          '(frequency, channel, width, TX power), security (profile name, ' +
          'visibility), optional connection info (station mode only), regional ' +
          'settings (country code), full security profile details, and hardware ' +
          '(MAC address, connected clients). An "Edit Settings" button opens the ' +
          'WirelessSettingsModal.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WirelessInterfaceDetail>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AccessPoint2_4GHz: Story = {
  name: 'Access Point — 2.4 GHz (WPA2)',
  args: {
    interface: baseApInterface,
  },
};

export const AccessPoint5GHz: Story = {
  name: 'Access Point — 5 GHz (WPA3, 80 MHz)',
  args: {
    interface: {
      ...baseApInterface,
      id: '*2',
      name: 'wlan2',
      ssid: 'OfficeNetwork-5G',
      band: '5GHz',
      frequency: 5180,
      channel: '36',
      channelWidth: '80MHz',
      txPower: 17,
      securityProfile: 'wpa3-secure',
      connectedClients: 9,
      countryCode: 'DE',
      securityProfileDetails: wpa3Profile,
    },
  },
};

export const HiddenSsid: Story = {
  name: 'Hidden SSID — 2.4 GHz',
  args: {
    interface: {
      ...baseApInterface,
      ssid: 'SecretNetwork',
      hideSsid: true,
      connectedClients: 2,
      countryCode: undefined,
      securityProfileDetails: wpa2Profile,
    },
  },
};

export const StationMode: Story = {
  name: 'Station Mode — Connected to Upstream AP',
  args: {
    interface: {
      ...baseApInterface,
      id: '*3',
      name: 'wlan1',
      ssid: 'UpstreamAP',
      mode: 'station',
      band: '5GHz',
      frequency: 5500,
      channel: '100',
      channelWidth: '40MHz',
      connectedClients: 0,
      signalStrength: -62,
      connectedTo: 'UpstreamAP',
      securityProfileDetails: wpa2Profile,
    },
  },
};

export const OpenGuestNetwork: Story = {
  name: 'Open Guest Network (No Security)',
  args: {
    interface: {
      ...baseApInterface,
      id: '*4',
      name: 'wlan3',
      ssid: 'CafeGuest',
      securityProfile: 'guest-open',
      connectedClients: 14,
      hideSsid: false,
      countryCode: 'GB',
      securityProfileDetails: openProfile,
    },
  },
};

export const DisabledInterface: Story = {
  name: 'Disabled Interface — No Profile Details',
  args: {
    interface: {
      ...baseApInterface,
      ssid: 'OldNetwork',
      disabled: true,
      running: false,
      connectedClients: 0,
      countryCode: undefined,
      securityProfileDetails: undefined,
    },
  },
};
