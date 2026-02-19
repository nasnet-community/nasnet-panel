/**
 * WirelessInterfaceCard Stories
 *
 * Showcases the card component used to display a single wireless interface
 * in the WiFi page grid. Each story demonstrates a distinct combination of
 * band, status, and client count.
 *
 * NOTE: WirelessInterfaceCard renders an InterfaceToggle internally, which
 * depends on useToggleInterface and useConnectionStore at runtime. In a full
 * Storybook setup those would be provided via MSW / store decorators. The
 * visual states driven by the `interface` prop are fully exercised here.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { WirelessInterfaceCard } from './WirelessInterfaceCard';
import type { WirelessInterface } from '@nasnet/core/types';

const meta: Meta<typeof WirelessInterfaceCard> = {
  title: 'Features/Wireless/WirelessInterfaceCard',
  component: WirelessInterfaceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a single wireless interface as a clickable card. Shows the ' +
          'interface name, SSID, frequency band badge (color-coded by band), connected ' +
          'client count, and an enable/disable toggle. On desktop it also reveals the ' +
          'channel and operating mode. Keyboard-accessible via Enter / Space.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WirelessInterfaceCard>;

// ---------------------------------------------------------------------------
// Shared base fixture
// ---------------------------------------------------------------------------

const base2_4GHz: WirelessInterface = {
  id: '*1',
  name: 'wlan1',
  macAddress: 'AA:BB:CC:DD:EE:01',
  ssid: 'HomeNetwork',
  disabled: false,
  running: true,
  band: '2.4GHz',
  frequency: 2437,
  channel: '6',
  mode: 'ap-bridge',
  txPower: 20,
  securityProfile: 'default',
  connectedClients: 4,
  hideSsid: false,
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Band2_4GHz: Story = {
  name: '2.4 GHz — Active with Clients',
  args: {
    interface: base2_4GHz,
  },
};

export const Band5GHz: Story = {
  name: '5 GHz — Active with Clients',
  args: {
    interface: {
      ...base2_4GHz,
      id: '*2',
      name: 'wlan2',
      ssid: 'OfficeNetwork-5G',
      band: '5GHz',
      frequency: 5180,
      channel: '36',
      connectedClients: 12,
      securityProfile: 'wpa2-enterprise',
    },
  },
};

export const Band6GHz: Story = {
  name: '6 GHz (WiFi 6E) — Active',
  args: {
    interface: {
      ...base2_4GHz,
      id: '*3',
      name: 'wlan3',
      ssid: 'UltraFast-6E',
      band: '6GHz',
      frequency: 5955,
      channel: '1',
      connectedClients: 2,
    },
  },
};

export const DisabledInterface: Story = {
  name: 'Disabled Interface',
  args: {
    interface: {
      ...base2_4GHz,
      ssid: 'GuestNetwork',
      disabled: true,
      running: false,
      connectedClients: 0,
    },
  },
};

export const NoClients: Story = {
  name: 'Active — No Clients Connected',
  args: {
    interface: {
      ...base2_4GHz,
      ssid: 'IoT-Devices',
      connectedClients: 0,
    },
  },
};

export const SingleClient: Story = {
  name: 'Active — Single Client',
  args: {
    interface: {
      ...base2_4GHz,
      ssid: 'HomeNetwork',
      connectedClients: 1,
    },
  },
};

export const HiddenSsid: Story = {
  name: 'Hidden SSID Network',
  args: {
    interface: {
      ...base2_4GHz,
      ssid: 'SecretNetwork',
      hideSsid: true,
      connectedClients: 3,
    },
  },
};

export const NotConfigured: Story = {
  name: 'Not Configured (No SSID)',
  args: {
    interface: {
      ...base2_4GHz,
      ssid: null,
      disabled: true,
      running: false,
      connectedClients: 0,
    },
  },
};
