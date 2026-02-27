/**
 * Select Field Stories
 *
 * Storybook stories for the Select component which provides
 * a dropdown for single-choice selection in service config forms.
 */

import { useState } from 'react';

import { Select } from './Select';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Select> = {
  title: 'Features/Services/ServiceConfigForm/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dropdown select field for SELECT type service config fields. Allows selecting a single value from a list of options. Supports both string and {value, label} object formats.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when no value is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the select field',
    },
    onValueChange: {
      action: 'value changed',
      description: 'Callback triggered when selection changes',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

/**
 * Basic select with no initial value.
 * Click to open dropdown and choose an option.
 */
export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Select an option',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  },
};

/**
 * Select with a pre-selected value.
 */
export const WithValue: Story = {
  args: {
    value: 'relay',
    placeholder: 'Select relay mode',
    options: [
      { value: 'exit', label: 'Exit relay (full internet access)' },
      { value: 'relay', label: 'Middle relay (no exit)' },
      { value: 'bridge', label: 'Bridge relay (hidden)' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Pre-selected with "relay" value. Used for showing current configuration.',
      },
    },
  },
};

/**
 * Select with string array options (auto-converted to label).
 */
export const StringOptions: Story = {
  args: {
    value: 'debug',
    placeholder: 'Select log level',
    options: ['debug', 'info', 'warning', 'error', 'critical'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Options provided as simple strings rather than {value, label} objects. Each string is used as both value and label.',
      },
    },
  },
};

/**
 * Disabled state — cannot select values.
 */
export const Disabled: Story = {
  args: {
    value: 'active',
    placeholder: 'Select status',
    disabled: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'maintenance', label: 'Maintenance' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled mode. The select field is non-interactive. Used in read-only contexts.',
      },
    },
  },
};

/**
 * Many options to show scrolling behavior.
 */
export const ManyOptions: Story = {
  args: {
    value: '',
    placeholder: 'Select country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'gb', label: 'United Kingdom' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
      { value: 'nl', label: 'Netherlands' },
      { value: 'se', label: 'Sweden' },
      { value: 'no', label: 'Norway' },
      { value: 'jp', label: 'Japan' },
      { value: 'au', label: 'Australia' },
      { value: 'nz', label: 'New Zealand' },
      { value: 'sg', label: 'Singapore' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Long list of options. The dropdown scrolls to show all options without expanding to window edges.',
      },
    },
  },
};

/**
 * Interactive controlled example.
 * Demonstrates value changes and display updates.
 */
export const Interactive: Story = {
  render: (args) => {
    function InteractiveSelect() {
      const [mode, setMode] = useState<string>('middle');

      return (
        <div className="space-y-3">
          <div className="text-sm font-medium">Exit Mode Configuration</div>
          <Select
            {...args}
            value={mode}
            onValueChange={setMode}
            placeholder="Choose relay mode"
            options={[
              { value: 'exit', label: 'Exit relay — route user traffic' },
              { value: 'middle', label: 'Middle relay — internal node only' },
              { value: 'bridge', label: 'Bridge relay — hidden from scanner' },
            ]}
          />
          <div className="text-muted-foreground text-xs">
            Selected: <span className="font-mono">{mode || 'none'}</span>
          </div>
        </div>
      );
    }

    return <InteractiveSelect />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive controlled example. Select a relay mode and see the selected value update below.',
      },
    },
  },
};
