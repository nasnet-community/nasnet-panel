/**
 * Textarea Component Stories
 *
 * Comprehensive Storybook stories for the Textarea primitive component.
 * Covers all platform viewports (Mobile/Tablet/Desktop), states (default/loading/error/empty),
 * and accessibility requirements (WCAG AAA).
 *
 * @see {@link ./textarea.tsx} For component implementation
 * @see {@link ../../Docs/design/ux-design/6-component-library.md} For component library guidelines
 * @see {@link ../../Docs/design/DESIGN_TOKENS.md} For design token reference
 */

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
          'A multi-line text input built on the native HTML textarea element. Features a rounded design with a 2px border, smooth focus ring transition, and comprehensive accessibility support (WCAG AAA compliant). Supports all standard HTML textarea attributes including placeholder, disabled, readOnly, rows, and validation attributes.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description:
        'Placeholder text displayed when the textarea is empty. Visible only when field is empty and not focused.',
    },
    disabled: {
      control: 'boolean',
      description:
        'Disables the textarea, preventing user input. Also grays out the field and updates cursor. Announced to screen readers.',
    },
    rows: {
      control: { type: 'number', min: 2, max: 20 },
      description:
        'Number of visible text rows. Controls the minimum height of the textarea. Content scrolls vertically if it exceeds this height.',
    },
    readOnly: {
      control: 'boolean',
      description:
        'Makes the textarea read-only. Allows viewing and selecting content but prevents editing. Announced to screen readers.',
    },
    maxLength: {
      control: { type: 'number', min: 10 },
      description:
        'Maximum number of characters allowed in the textarea. Enforced by browser and announced to screen readers.',
    },
    required: {
      control: 'boolean',
      description: 'Marks the field as required for form validation. Announced to screen readers.',
    },
    className: {
      control: 'text',
      description:
        'Additional CSS classes to merge with component styles. Use for custom styling overrides.',
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
    defaultValue: 'RouterOS 7.12\nBoard: RB750Gr3\nSerial: HEX123456\nArchitecture: mipsbe',
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
    <div className="flex w-96 flex-col gap-2">
      <label
        htmlFor="script-editor"
        className="text-foreground text-sm font-medium leading-none"
      >
        RouterOS Script
      </label>
      <Textarea
        id="script-editor"
        placeholder={`/system script\nadd name=backup source=":put [/system backup save]"`}
        rows={6}
      />
      <p className="text-muted-foreground text-xs">
        Paste or write your RouterOS script. It will be validated before execution.
      </p>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <label
        htmlFor="config-input"
        className="text-foreground text-sm font-medium leading-none"
      >
        Configuration Block
      </label>
      <Textarea
        id="config-input"
        defaultValue="/ip address add address=999.999.999.999/24"
        className="border-error focus-visible:ring-error"
        rows={3}
        aria-describedby="config-error"
      />
      <p
        id="config-error"
        className="text-error text-xs"
      >
        Invalid IP address detected on line 1.
      </p>
    </div>
  ),
};

// Platform-specific stories (Mobile/Tablet/Desktop)

export const Mobile: Story = {
  args: {
    placeholder: 'Enter configuration notes...',
    rows: 4,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile viewport (375px). Touch target is 44px minimum. Minimal decorations, single-column layout. Optimized for thumb-friendly interaction.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="mobile-textarea"
            className="text-foreground text-sm font-medium leading-none"
          >
            Notes
          </label>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Tablet: Story = {
  args: {
    placeholder: 'Enter configuration notes...',
    rows: 5,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Tablet viewport (768px). Balanced information density with touch-friendly interaction. Supports both portrait and landscape.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="tablet-textarea"
            className="text-foreground text-sm font-medium leading-none"
          >
            Configuration Notes
          </label>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Desktop: Story = {
  args: {
    placeholder: 'Enter configuration notes...',
    rows: 8,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop viewport (1280px+). Larger display with more generous spacing. Supports keyboard shortcuts and dense layouts.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl p-8">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="desktop-textarea"
            className="text-foreground text-lg font-semibold"
          >
            Configuration Editor
          </label>
          <Story />
        </div>
      </div>
    ),
  ],
};

// State stories

export const Empty: Story = {
  args: {
    placeholder: 'No content yet. Start typing to begin...',
    defaultValue: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with placeholder text guiding user to input.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <label
        htmlFor="loading-textarea"
        className="text-foreground text-sm font-medium leading-none"
      >
        Loading Content...
      </label>
      <Textarea
        id="loading-textarea"
        placeholder="Content is loading..."
        disabled
        className="animate-pulse opacity-60"
        rows={5}
      />
      <p className="text-muted-foreground text-xs">Fetching configuration from router...</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state with disabled field and pulse animation. Users understand content is being fetched.',
      },
    },
  },
};

// Keyboard interaction story

export const WithKeyboardSupport: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <label
        htmlFor="keyboard-textarea"
        className="text-foreground text-sm font-medium leading-none"
      >
        RouterOS Script
      </label>
      <Textarea
        id="keyboard-textarea"
        placeholder="Tab navigates between fields. Ctrl+Enter submits. Shift+Tab goes back."
        rows={6}
        defaultValue='/system script add name=test source=":put hello"'
      />
      <p className="text-muted-foreground text-xs">
        Keyboard Support: Tab (next field), Shift+Tab (previous), Enter (newline in field), Escape
        (cancel)
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates full keyboard navigation support. Field is fully accessible via Tab key and supports all standard textarea keyboard shortcuts.',
      },
    },
  },
};
