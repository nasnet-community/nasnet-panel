import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { VlanSelector } from './VlanSelector';

// ---------------------------------------------------------------------------
// Controlled wrapper so Storybook stories reflect real interactive behaviour
// ---------------------------------------------------------------------------

function ControlledVlanSelector(props: React.ComponentProps<typeof VlanSelector>) {
  const [value, setValue] = useState<number[]>(props.value);
  return (
    <VlanSelector
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof VlanSelector> = {
  title: 'Features/Network/Bridges/VlanSelector',
  component: VlanSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multi-value VLAN ID selector used in the Bridge Port Editor. Accepts numeric VLAN IDs ' +
          'between 1 and 4094, validates input, and displays the selected IDs as removable chip badges. ' +
          'Values are sorted ascending on each addition. Supports keyboard entry (Enter to add) and ' +
          'full accessibility via aria-label and role="alert" on errors.',
      },
    },
  },
  args: {
    onChange: fn(),
  },
  render: (args) => <ControlledVlanSelector {...args} />,
};

export default meta;
type Story = StoryObj<typeof VlanSelector>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Empty (No VLANs)',
  args: {
    label: 'Tagged VLANs',
    description: 'VLANs whose frames will be carried with the 802.1Q tag preserved.',
    value: [],
    placeholder: 'Enter VLAN ID (1–4094)',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial state with no VLANs selected. The "No VLANs selected" italic hint is shown ' +
          'below the input. Type a number and press Enter or click + to add it.',
      },
    },
  },
};

export const WithPreselectedVlans: Story = {
  name: 'Pre-selected VLANs',
  args: {
    label: 'Tagged VLANs',
    description: 'VLANs whose frames will be carried with the 802.1Q tag preserved.',
    value: [10, 20, 30, 100, 200],
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Five VLANs already selected. Each chip has a remove (×) button. ' +
          'The IDs are kept in ascending numeric order.',
      },
    },
  },
};

export const UntaggedVlans: Story = {
  name: 'Untagged VLAN Selector',
  args: {
    label: 'Untagged VLANs',
    description: 'Frames for these VLANs will have their 802.1Q tag stripped on egress.',
    value: [1, 100],
    placeholder: 'Enter VLAN ID (1–4094)',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same component used for untagged VLAN membership, with two IDs pre-populated.',
      },
    },
  },
};

export const ManyVlans: Story = {
  name: 'Many VLANs (Chip Wrap)',
  args: {
    label: 'Tagged VLANs',
    value: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Twelve VLAN chips to demonstrate how the chip container wraps across multiple rows.',
      },
    },
  },
};

export const Disabled: Story = {
  name: 'Disabled State',
  args: {
    label: 'Tagged VLANs',
    description: 'VLAN configuration is locked while changes are being applied.',
    value: [10, 20],
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When disabled the text input, Add button, and individual chip remove buttons are all ' +
          'inert. Use this state while a save operation is in flight.',
      },
    },
  },
};

export const NoDescription: Story = {
  name: 'No Description Text',
  args: {
    label: 'PVID Overrides',
    value: [1],
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact variant without a description paragraph, suitable for tight form layouts.',
      },
    },
  },
};
