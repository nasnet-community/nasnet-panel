/**
 * MultiSelect Field Stories
 *
 * Storybook stories for the MultiSelect component which provides
 * a popover dropdown with checkboxes for multiple selection in service config forms.
 */

import { useState } from 'react';

import { MultiSelect } from './MultiSelect';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MultiSelect> = {
  title: 'Features/Services/ServiceConfigForm/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-select dropdown field for MULTI_SELECT type service config fields. Allows selecting multiple values from a list. Selected items appear as dismissible badges. Supports both string and {value, label} object formats.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when no values are selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the multi-select field',
    },
    onChange: {
      action: 'values changed',
      description: 'Callback triggered when selections change',
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
type Story = StoryObj<typeof MultiSelect>;

/**
 * Empty multi-select with no initial selections.
 * Click to open dropdown and check multiple options.
 */
export const Default: Story = {
  args: {
    value: [],
    placeholder: 'Select options',
    options: [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' },
      { value: 'opt3', label: 'Option 3' },
      { value: 'opt4', label: 'Option 4' },
    ],
  },
};

/**
 * Multi-select with some pre-selected values.
 */
export const WithValues: Story = {
  args: {
    value: ['us', 'de'],
    placeholder: 'Select countries',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'de', label: 'Germany' },
      { value: 'nl', label: 'Netherlands' },
      { value: 'se', label: 'Sweden' },
      { value: 'fr', label: 'France' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-selected with "us" and "de" values. Each selected item appears as a badge that can be removed individually.',
      },
    },
  },
};

/**
 * Multi-select with string array options.
 */
export const StringOptions: Story = {
  args: {
    value: ['admin', 'user'],
    placeholder: 'Select roles',
    options: ['admin', 'user', 'viewer', 'editor'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Options provided as simple strings rather than {value, label} objects.',
      },
    },
  },
};

/**
 * Disabled state — cannot select or deselect values.
 */
export const Disabled: Story = {
  args: {
    value: ['http', 'https'],
    placeholder: 'Select protocols',
    disabled: true,
    options: [
      { value: 'http', label: 'HTTP' },
      { value: 'https', label: 'HTTPS' },
      { value: 'ftp', label: 'FTP' },
      { value: 'ssh', label: 'SSH' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled mode. The dropdown and all remove buttons are non-interactive.',
      },
    },
  },
};

/**
 * Many options to show scrolling in the dropdown.
 */
export const ManyOptions: Story = {
  args: {
    value: ['us', 'ca', 'gb'],
    placeholder: 'Select countries',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'gb', label: 'United Kingdom' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
      { value: 'nl', label: 'Netherlands' },
      { value: 'se', label: 'Sweden' },
      { value: 'no', label: 'Norway' },
      { value: 'fi', label: 'Finland' },
      { value: 'jp', label: 'Japan' },
      { value: 'au', label: 'Australia' },
      { value: 'nz', label: 'New Zealand' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Long list of options. The dropdown scrolls internally to show all options.',
      },
    },
  },
};

/**
 * All options selected.
 */
export const AllSelected: Story = {
  args: {
    value: ['us', 'de', 'nl', 'se', 'fr'],
    placeholder: 'Select countries',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'de', label: 'Germany' },
      { value: 'nl', label: 'Netherlands' },
      { value: 'se', label: 'Sweden' },
      { value: 'fr', label: 'France' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'All options are pre-selected and shown as badges.',
      },
    },
  },
};

/**
 * Interactive controlled example.
 * Demonstrates adding/removing selections with real-time display.
 */
export const Interactive: Story = {
  render: (args) => {
    function InteractiveMultiSelect() {
      const [countries, setCountries] = useState<string[]>(['us', 'de']);

      return (
        <div className="space-y-3">
          <div className="text-sm font-medium">Allowed Exit Countries</div>
          <MultiSelect
            {...args}
            value={countries}
            onChange={setCountries}
            placeholder="Select countries"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'de', label: 'Germany' },
              { value: 'nl', label: 'Netherlands' },
              { value: 'se', label: 'Sweden' },
              { value: 'fr', label: 'France' },
              { value: 'ca', label: 'Canada' },
              { value: 'au', label: 'Australia' },
            ]}
          />
          <div className="text-muted-foreground text-xs">
            Selected {countries.length} countries:{' '}
            {countries.length > 0 ? countries.join(', ') : 'none'}
          </div>
        </div>
      );
    }

    return <InteractiveMultiSelect />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive controlled example. Check/uncheck options in the dropdown and see the selected list update with badges. Each badge can be individually removed.',
      },
    },
  },
};
