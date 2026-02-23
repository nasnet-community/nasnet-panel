import { fn } from 'storybook/test';

import type { WirelessInterface } from '@nasnet/core/types';

import { InterfaceToggle } from './InterfaceToggle';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * NOTE: InterfaceToggle depends on two hooks at runtime:
 *   - useToggleInterface (from @nasnet/api-client/queries)
 *   - useConnectionStore  (from @nasnet/state/stores)
 *
 * In a full Storybook setup these would be mocked via MSW or decorator
 * providers. The stories below demonstrate the visual states driven by
 * the `interface` prop; interaction stories require those providers.
 */

const meta: Meta<typeof InterfaceToggle> = {
  title: 'Features/Wireless/InterfaceToggle',
  component: InterfaceToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toggle switch for enabling or disabling a wireless interface. Before applying the change a confirmation dialog is shown, warning the user how many clients (if any) will be disconnected. Supports optimistic updates with visual loading feedback.',
      },
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceToggle>;

const baseInterface: WirelessInterface = {
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
  connectedClients: 3,
};

export const Enabled: Story = {
  name: 'Enabled Interface',
  args: {
    interface: {
      ...baseInterface,
      disabled: false,
      connectedClients: 3,
    },
  },
};

export const Disabled: Story = {
  name: 'Disabled Interface',
  args: {
    interface: {
      ...baseInterface,
      disabled: true,
      running: false,
      connectedClients: 0,
    },
  },
};

export const EnabledNoClients: Story = {
  name: 'Enabled — No Clients Connected',
  args: {
    interface: {
      ...baseInterface,
      disabled: false,
      connectedClients: 0,
    },
  },
};

export const EnabledManyClients: Story = {
  name: 'Enabled — Many Clients (12)',
  args: {
    interface: {
      ...baseInterface,
      name: 'wlan2',
      ssid: 'OfficeNetwork-5G',
      band: '5GHz',
      disabled: false,
      connectedClients: 12,
    },
  },
};

export const GuestInterface: Story = {
  name: 'Guest Interface (5 GHz)',
  args: {
    interface: {
      ...baseInterface,
      id: '*2',
      name: 'wlan2',
      ssid: 'GuestNetwork',
      band: '5GHz',
      frequency: 5180,
      channel: '36',
      disabled: false,
      connectedClients: 1,
    },
  },
};
