import type { SecurityProfile } from '@nasnet/core/types';

import { SecurityProfileSection } from './SecurityProfileSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SecurityProfileSection> = {
  title: 'Features/Wireless/SecurityProfileSection',
  component: SecurityProfileSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays the security profile of a wireless interface, including the profile name, authentication type, encryption method, and a masked password field with copy functionality. The security level badge dynamically reflects the strength of the configured security.',
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
};

export default meta;
type Story = StoryObj<typeof SecurityProfileSection>;

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
  name: 'wpa3-profile',
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

const weakLegacyProfile: SecurityProfile = {
  id: '*4',
  name: 'legacy-wep',
  mode: 'static-keys-required',
  authenticationTypes: [],
  unicastCiphers: ['tkip'],
  groupCiphers: ['tkip'],
};

const enterpriseProfile: SecurityProfile = {
  id: '*5',
  name: 'enterprise-802.1x',
  mode: 'dynamic-keys',
  authenticationTypes: ['wpa2-eap'],
  unicastCiphers: ['aes-ccm'],
  groupCiphers: ['aes-ccm'],
};

const mixedProfile: SecurityProfile = {
  id: '*6',
  name: 'wpa2-wpa3-mixed',
  mode: 'dynamic-keys',
  authenticationTypes: ['wpa2-psk', 'wpa3-psk'],
  wpa2PreSharedKey: 'SharedKey!Mixed',
  unicastCiphers: ['aes-ccm'],
  groupCiphers: ['aes-ccm'],
};

export const WPA2Personal: Story = {
  name: 'WPA2-Personal (Strong)',
  args: {
    profile: wpa2Profile,
  },
};

export const WPA3Personal: Story = {
  name: 'WPA3-Personal (Strongest)',
  args: {
    profile: wpa3Profile,
  },
};

export const OpenNetwork: Story = {
  name: 'Open Network (No Security)',
  args: {
    profile: openProfile,
  },
};

export const LegacyWEP: Story = {
  name: 'WEP / Static Keys (Weak)',
  args: {
    profile: weakLegacyProfile,
  },
};

export const EnterpriseEAP: Story = {
  name: 'WPA2-Enterprise (EAP)',
  args: {
    profile: enterpriseProfile,
  },
};

export const MixedWPA2WPA3: Story = {
  name: 'WPA2 + WPA3 Transitional',
  args: {
    profile: mixedProfile,
  },
};
