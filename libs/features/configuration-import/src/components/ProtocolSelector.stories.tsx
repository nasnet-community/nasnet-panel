import { fn } from 'storybook/test';

import { ProtocolSelector } from './ProtocolSelector';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ProtocolSelector> = {
  title: 'Features/ConfigurationImport/ProtocolSelector',
  component: ProtocolSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays three connection method cards — RouterOS API, SSH, and Telnet — letting the user choose how the configuration batch job will be executed. Cards for unavailable services are visually dimmed and non-interactive. A "Recommended" badge highlights the fastest (API) option when available.',
      },
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProtocolSelector>;

export const AllEnabled: Story = {
  name: 'All Protocols Available',
  args: {
    value: null,
    apiEnabled: true,
    sshEnabled: true,
    telnetEnabled: true,
  },
};

export const APISelected: Story = {
  name: 'API Selected (Recommended)',
  args: {
    value: 'api',
    apiEnabled: true,
    sshEnabled: true,
    telnetEnabled: false,
  },
};

export const SSHSelected: Story = {
  name: 'SSH Selected',
  args: {
    value: 'ssh',
    apiEnabled: false,
    sshEnabled: true,
    telnetEnabled: false,
  },
};

export const TelnetOnly: Story = {
  name: 'Only Telnet Available',
  parameters: {
    docs: {
      description: {
        story:
          'When only Telnet is enabled on the router the other cards are grayed out. This is a legacy scenario; users should be encouraged to enable the API.',
      },
    },
  },
  args: {
    value: 'telnet',
    apiEnabled: false,
    sshEnabled: false,
    telnetEnabled: true,
  },
};

export const NoneAvailable: Story = {
  name: 'No Protocols Available',
  parameters: {
    docs: {
      description: {
        story:
          'When none of the IP services are enabled a warning banner explains that the user must enable at least one service on the router before importing configuration.',
      },
    },
  },
  args: {
    value: null,
    apiEnabled: false,
    sshEnabled: false,
    telnetEnabled: false,
  },
};

export const Loading: Story = {
  name: 'Checking Services (Loading)',
  parameters: {
    docs: {
      description: {
        story:
          'While the enabled-protocols query is in flight all cards display "Checking..." and a spinner is shown below the grid.',
      },
    },
  },
  args: {
    value: null,
    apiEnabled: false,
    sshEnabled: false,
    telnetEnabled: false,
    isLoading: true,
  },
};

export const DisabledSelector: Story = {
  name: 'Disabled (Read-Only)',
  parameters: {
    docs: {
      description: {
        story:
          'The entire selector is locked — used when the wizard moves to the execute step so the user cannot change the protocol mid-job.',
      },
    },
  },
  args: {
    value: 'api',
    apiEnabled: true,
    sshEnabled: true,
    telnetEnabled: false,
    disabled: true,
  },
};
