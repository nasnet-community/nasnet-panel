import { fn } from 'storybook/test';

import { ConfigurationInput } from './ConfigurationInput';

import type { Meta, StoryObj } from '@storybook/react';

const SAMPLE_CONFIG = `/ip address
add address=192.168.88.1/24 interface=ether1 network=192.168.88.0
add address=10.0.0.1/24 interface=ether2 network=10.0.0.0

/ip route
add dst-address=0.0.0.0/0 gateway=192.168.88.254

/ip firewall filter
add action=accept chain=input comment="Accept established" connection-state=established,related
add action=drop chain=input comment="Drop invalid" connection-state=invalid
add action=accept chain=input protocol=icmp

/system identity
set name=MyRouter
`;

const meta: Meta<typeof ConfigurationInput> = {
  title: 'Features/ConfigurationImport/ConfigurationInput',
  component: ConfigurationInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dual-mode input component for providing a RouterOS configuration. Supports drag-and-drop file upload (.rsc / .txt / .conf) and a paste/manual-entry text area with clipboard integration. Switches automatically to the text view when a file is loaded so the user can review the content.',
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
type Story = StoryObj<typeof ConfigurationInput>;

export const EmptyUploadMode: Story = {
  name: 'Empty — Upload Mode',
  args: {
    value: '',
  },
};

export const EmptyPasteMode: Story = {
  name: 'Empty — Paste Mode',
  parameters: {
    docs: {
      description: {
        story:
          'The paste tab is pre-selected. The textarea shows the placeholder and the character counter reads 0.',
      },
    },
  },
  args: {
    value: '',
  },
  play: async ({ canvasElement }) => {
    // Click the "Paste Config" tab to start on paste mode
    const pasteTab = canvasElement.querySelector(
      '[role="tab"][aria-controls="panel-paste"]'
    ) as HTMLButtonElement | null;
    pasteTab?.click();
  },
};

export const WithConfiguration: Story = {
  name: 'Paste Mode — With Content',
  args: {
    value: SAMPLE_CONFIG,
  },
};

export const WithError: Story = {
  name: 'With Validation Error',
  args: {
    value: '',
    error: 'Configuration cannot be empty. Please upload a .rsc file or paste your configuration.',
  },
};

export const DisabledState: Story = {
  name: 'Disabled (Read-Only)',
  parameters: {
    docs: {
      description: {
        story:
          'When the wizard is in the execution step the input is locked to prevent edits during apply.',
      },
    },
  },
  args: {
    value: SAMPLE_CONFIG,
    disabled: true,
  },
};

export const LargeConfiguration: Story = {
  name: 'Large Configuration (800+ lines)',
  args: {
    value: Array.from(
      { length: 40 },
      (_, i) =>
        `/ip firewall filter\nadd action=accept chain=forward comment="Rule ${i + 1}" src-address=10.0.${i}.0/24`
    ).join('\n'),
  },
};
