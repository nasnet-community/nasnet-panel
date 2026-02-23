/**
 * TextArea Stories
 *
 * Storybook stories for the TextArea component — a multi-line textarea for
 * long-form text input, configuration data, and code snippets.
 * Used for TEXT_AREA type service config fields.
 */

import { Label } from '@nasnet/ui/primitives';
import { TextArea } from './TextArea';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TextArea> = {
  title: 'Features/Services/ServiceConfigForm/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-line text area field for TEXT_AREA service config field types. Renders a textarea element with configurable rows and automatic height adjustment via CSS resize. Suitable for long-form text input, configuration data, or code snippets.',
      },
    },
  },
  argTypes: {
    rows: {
      control: { type: 'number', min: 2, max: 20, step: 1 },
      description: 'Number of visible rows (height)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the textarea',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when empty',
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
type Story = StoryObj<typeof TextArea>;

/**
 * Default textarea with 4 rows (standard size).
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    rows: 4,
  },
};

/**
 * Configuration text field for storing custom configuration data.
 */
export const Configuration: Story = {
  args: {
    rows: 6,
    defaultValue: `# Service Configuration
[settings]
timeout=30
retry_count=3
log_level=INFO`,
    placeholder: 'Enter configuration...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="config-field">Configuration</Label>
      <TextArea {...args} id="config-field" />
      <p className="text-xs text-muted-foreground">
        Supports INI, YAML, and JSON formats
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'TextArea field for storing configuration data. The larger size accommodates multi-line config files.',
      },
    },
  },
};

/**
 * Custom script/code field showing how to store code snippets.
 */
export const CustomScript: Story = {
  args: {
    rows: 8,
    defaultValue: `#!/bin/bash
# Custom startup script
echo "Service starting..."
/usr/bin/service-daemon --config=/etc/config.yml
echo "Service ready"`,
    placeholder: 'Paste your script here...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="script-field">Startup Script</Label>
      <TextArea {...args} id="script-field" />
      <p className="text-xs text-muted-foreground">
        Bash script (#!/bin/bash)
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Larger TextArea field for storing executable scripts or code snippets.',
      },
    },
  },
};

/**
 * Description/notes field with smaller size.
 */
export const Notes: Story = {
  args: {
    rows: 3,
    placeholder: 'Add optional notes...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="notes-field">Notes</Label>
      <TextArea {...args} id="notes-field" />
      <p className="text-xs text-muted-foreground">
        Optional: Document any special configuration
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Compact TextArea field (3 rows) for short notes or descriptions.',
      },
    },
  },
};

/**
 * Long-form content field with many rows.
 */
export const LongForm: Story = {
  args: {
    rows: 12,
    placeholder: 'Enter detailed documentation...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="docs-field">Documentation</Label>
      <TextArea {...args} id="docs-field" />
      <p className="text-xs text-muted-foreground">
        Use Markdown for formatting
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Larger TextArea field (12 rows) for long-form content and detailed documentation.',
      },
    },
  },
};

/**
 * Disabled state — the textarea value is locked and cannot be changed.
 */
export const Disabled: Story = {
  args: {
    rows: 4,
    disabled: true,
    defaultValue: `Original configuration
This field cannot be edited currently
Service is running and configuration is locked`,
    placeholder: 'Content...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="locked-config">Read-only Configuration</Label>
      <TextArea {...args} id="locked-config" />
      <p className="text-xs text-muted-foreground">
        This configuration is locked while the service is running.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled TextArea. Used when the configuration value cannot be changed in the current state.',
      },
    },
  },
};

/**
 * Error state — field validation failed.
 */
export const WithError: Story = {
  args: {
    rows: 6,
    placeholder: 'Enter valid JSON...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="json-field">Service Configuration (JSON)</Label>
      <TextArea {...args} id="json-field" aria-invalid={true} />
      <p className="text-xs text-destructive">
        Invalid JSON syntax. Please check for missing commas or brackets.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TextArea field in error state with validation message displayed.',
      },
    },
  },
};
