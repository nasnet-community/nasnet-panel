import * as React from 'react';

import { Textarea } from './textarea';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A multi-line text input built on the native HTML textarea element. Features a rounded design with a 2px border, smooth focus ring transition, and consistent disabled/placeholder styling aligned with the NasNet design system.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text displayed when the textarea is empty.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the textarea, preventing user input.',
    },
    rows: {
      control: { type: 'number', min: 2, max: 20 },
      description: 'Number of visible text rows.',
    },
    readOnly: {
      control: 'boolean',
      description: 'Makes the textarea read-only.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Enter configuration notes...',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithValue: Story = {
  args: {
    defaultValue:
      '/ip firewall filter\nadd chain=input action=accept protocol=tcp dst-port=22\nadd chain=input action=drop',
    rows: 5,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    placeholder: 'Configuration is locked...',
    disabled: true,
    defaultValue: 'This configuration is managed by the system and cannot be edited.',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue:
      'RouterOS 7.12\nBoard: RB750Gr3\nSerial: HEX123456\nArchitecture: mipsbe',
    rows: 4,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-96">
      <label
        htmlFor="script-editor"
        className="text-sm font-medium leading-none text-foreground"
      >
        RouterOS Script
      </label>
      <Textarea
        id="script-editor"
        placeholder={`/system script\nadd name=backup source=":put [/system backup save]"`}
        rows={6}
      />
      <p className="text-xs text-muted-foreground">
        Paste or write your RouterOS script. It will be validated before execution.
      </p>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-96">
      <label
        htmlFor="config-input"
        className="text-sm font-medium leading-none text-foreground"
      >
        Configuration Block
      </label>
      <Textarea
        id="config-input"
        defaultValue="/ip address add address=999.999.999.999/24"
        className="border-error focus-visible:ring-error"
        rows={3}
      />
      <p className="text-xs text-error">
        Invalid IP address detected on line 1.
      </p>
    </div>
  ),
};
