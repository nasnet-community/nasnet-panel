/**
 * WirelessSettingsForm Stories
 *
 * Demonstrates all meaningful states of the comprehensive wireless settings
 * form: default values per band, a pre-filled 5 GHz interface, the submitting
 * loading state, and a hidden-SSID pre-configuration. Each story uses inline
 * mock data and action handlers so no providers are needed.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { WirelessSettingsForm } from './WirelessSettingsForm';

const meta: Meta<typeof WirelessSettingsForm> = {
  title: 'Features/Wireless/WirelessSettingsForm',
  component: WirelessSettingsForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Comprehensive form for editing wireless interface settings. Divided into ' +
          'four sections: Basic Settings (SSID, password, hide-SSID toggle), Radio ' +
          'Settings (channel, channel width, TX power), Security (security mode), ' +
          'and Regional (country code). Uses React Hook Form + Zod validation. ' +
          'Channel and channel-width options are dynamically filtered by the current ' +
          'frequency band supplied via `currentValues.band`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WirelessSettingsForm>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default2_4GHz: Story = {
  name: 'Default — 2.4 GHz',
  args: {
    currentValues: {
      ssid: 'HomeNetwork',
      hideSsid: false,
      channel: 'auto',
      channelWidth: '20MHz',
      txPower: 17,
      countryCode: 'US',
      band: '2.4GHz',
    },
    isSubmitting: false,
  },
};

export const Default5GHz: Story = {
  name: 'Default — 5 GHz (80 MHz)',
  args: {
    currentValues: {
      ssid: 'OfficeNetwork-5G',
      hideSsid: false,
      channel: '36',
      channelWidth: '80MHz',
      txPower: 20,
      countryCode: 'DE',
      band: '5GHz',
    },
    isSubmitting: false,
  },
};

export const Default6GHz: Story = {
  name: 'Default — 6 GHz (WiFi 6E)',
  args: {
    currentValues: {
      ssid: 'UltraFast-6E',
      hideSsid: false,
      channel: 'auto',
      channelWidth: '160MHz',
      txPower: 23,
      countryCode: 'US',
      band: '6GHz',
    },
    isSubmitting: false,
  },
};

export const HiddenSsidPreFilled: Story = {
  name: 'Pre-filled — Hidden SSID',
  args: {
    currentValues: {
      ssid: 'SecretNetwork',
      hideSsid: true,
      channel: '11',
      channelWidth: '40MHz',
      txPower: 15,
      countryCode: 'GB',
      band: '2.4GHz',
    },
    isSubmitting: false,
  },
};

export const Submitting: Story = {
  name: 'Submitting State',
  args: {
    currentValues: {
      ssid: 'HomeNetwork',
      hideSsid: false,
      channel: 'auto',
      channelWidth: '20MHz',
      txPower: 17,
      countryCode: 'US',
      band: '2.4GHz',
    },
    isSubmitting: true,
  },
};

export const NoCountryCode: Story = {
  name: 'No Country Code Set',
  args: {
    currentValues: {
      ssid: 'RouterNet',
      hideSsid: false,
      channel: 'auto',
      channelWidth: '20MHz',
      txPower: 17,
      band: '2.4GHz',
    },
    isSubmitting: false,
  },
};
