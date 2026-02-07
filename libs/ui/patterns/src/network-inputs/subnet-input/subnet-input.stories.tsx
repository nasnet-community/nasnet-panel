/**
 * SubnetInput Stories
 * Storybook stories for the Subnet/CIDR Input component
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { SubnetInput, SubnetInputDesktop, SubnetInputMobile } from './index';
import type { SubnetInputProps, OverlapResult } from './subnet-input.types';

const meta: Meta<typeof SubnetInput> = {
  title: 'Patterns/Network Inputs/SubnetInput',
  component: SubnetInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A subnet/CIDR input component that displays real-time network calculations.

**Features:**
- CIDR notation input (e.g., 192.168.1.0/24)
- Real-time subnet calculations (network, broadcast, host range)
- Common prefix selector dropdown
- Overlap detection integration
- Platform-responsive (mobile/desktop)
- WCAG AAA accessibility compliance

**Usage:**
\`\`\`tsx
import { SubnetInput } from '@nasnet/ui/patterns';

<SubnetInput
  value={subnet}
  onChange={setSubnet}
  label="Network Subnet"
  checkOverlap={(cidr) => checkConflicts(cidr)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Current CIDR value',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when value changes',
    },
    showCalculations: {
      control: 'boolean',
      description: 'Show the calculations panel',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    error: {
      control: 'text',
      description: 'External error message',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    helpText: {
      control: 'text',
      description: 'Help text below input',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubnetInput>;

// Controlled wrapper for stories
function ControlledSubnetInput(props: SubnetInputProps) {
  const [value, setValue] = React.useState(props.value || '');

  return (
    <SubnetInput
      {...props}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        props.onChange?.(newValue);
      }}
    />
  );
}

/**
 * Default state with no value
 */
export const Default: Story = {
  args: {
    label: 'Network Subnet',
    placeholder: '192.168.1.0',
    helpText: 'Enter a network address in CIDR notation',
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * With a valid CIDR value showing calculations
 */
export const WithValidCIDR: Story = {
  args: {
    label: 'Network Subnet',
    value: '192.168.1.0/24',
    showCalculations: true,
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * With calculations panel hidden
 */
export const CalculationsHidden: Story = {
  args: {
    label: 'Network Subnet',
    value: '10.0.0.0/8',
    showCalculations: false,
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * With overlap warning displayed
 */
export const WithOverlapWarning: Story = {
  args: {
    label: 'Network Subnet',
    value: '192.168.1.0/24',
    showCalculations: true,
    checkOverlap: (cidr: string): OverlapResult | null => {
      // Simulate overlap detection
      if (cidr.startsWith('192.168.1.')) {
        return {
          overlappingCidr: '192.168.1.0/24',
          resourceName: 'LAN Pool',
          resourceType: 'DHCP Pool',
        };
      }
      return null;
    },
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * With validation error
 */
export const WithError: Story = {
  args: {
    label: 'Network Subnet',
    value: '192.168.1.0/24',
    error: 'This subnet conflicts with an existing interface',
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    label: 'Network Subnet',
    value: '10.0.0.0/16',
    disabled: true,
    showCalculations: true,
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * Required field
 */
export const Required: Story = {
  args: {
    label: 'Network Subnet',
    required: true,
    helpText: 'This field is required',
  },
  render: (args) => <ControlledSubnetInput {...args} />,
};

/**
 * Desktop presenter specifically
 */
export const DesktopVariant: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Desktop layout with inline calculations panel',
      },
    }
  },

  args: {
    label: 'Network Subnet',
    value: '172.16.0.0/12',
    showCalculations: true,
  },

  render: (args) => {
    const [value, setValue] = React.useState(args.value || '');
    // Import the hook directly for desktop-specific story
    const { useSubnetInput } = require('./use-subnet-input');
    const state = useSubnetInput({
      value,
      onChange: setValue,
      checkOverlap: args.checkOverlap,
      error: args.error,
    });

    return (
      <SubnetInputDesktop
        {...args}
        state={state}
      />
    );
  },

  globals: {
    viewport: {
      value: 'desktop',
      isRotated: false
    }
  }
};

/**
 * Mobile presenter specifically
 */
export const MobileVariant: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Mobile layout with bottom sheet calculations',
      },
    }
  },

  args: {
    label: 'Network Subnet',
    value: '192.168.10.0/24',
    showCalculations: true,
  },

  render: (args) => {
    const [value, setValue] = React.useState(args.value || '');
    // Import the hook directly for mobile-specific story
    const { useSubnetInput } = require('./use-subnet-input');
    const state = useSubnetInput({
      value,
      onChange: setValue,
      checkOverlap: args.checkOverlap,
      error: args.error,
    });

    return (
      <div className="max-w-sm">
        <SubnetInputMobile
          {...args}
          state={state}
        />
      </div>
    );
  },

  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  }
};

/**
 * Various prefix examples
 */
export const PrefixExamples: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows different prefix lengths and their calculations',
      },
    },
  },
  render: () => {
    const examples = [
      { label: 'Class A (/8)', value: '10.0.0.0/8' },
      { label: 'Class B (/16)', value: '172.16.0.0/16' },
      { label: 'Class C (/24)', value: '192.168.1.0/24' },
      { label: 'Point-to-Point (/30)', value: '192.168.1.0/30' },
      { label: 'Host Route (/32)', value: '192.168.1.1/32' },
    ];

    return (
      <div className="space-y-6">
        {examples.map((example) => (
          <ControlledSubnetInput
            key={example.value}
            label={example.label}
            value={example.value}
            showCalculations
          />
        ))}
      </div>
    );
  },
};

/**
 * Dark mode support
 */
export const DarkMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Component in dark mode theme',
      },
    }
  },

  args: {
    label: 'Network Subnet',
    value: '192.168.1.0/24',
    showCalculations: true,
  },

  render: (args) => (
    <div className="dark bg-background p-4 rounded-lg">
      <ControlledSubnetInput {...args} />
    </div>
  ),

  globals: {
    backgrounds: {
      value: "dark"
    }
  }
};
