/**
 * FormFieldDescription Stories
 *
 * Storybook stories for the FormFieldDescription component.
 * Demonstrates text-only and icon-augmented variants, custom styling,
 * and real-world usage inside a labelled form field.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import { FormFieldDescription } from './FormFieldDescription';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * FormFieldDescription
 *
 * A lightweight help-text element that sits below a form field label or input.
 * Linked to its target input via `aria-describedby` for screen reader support.
 *
 * ## Features
 *
 * - Renders as a `<p>` tag with `role` semantics for accessibility
 * - Optional `id` prop to satisfy `aria-describedby` from the sibling input
 * - Optional `showIcon` prop renders a HelpCircle icon before the text
 * - Fully composable: accepts any `ReactNode` as children
 *
 * ## Usage
 *
 * ```tsx
 * <label htmlFor="ip-address">IP Address</label>
 * <input id="ip-address" aria-describedby="ip-address-desc" />
 * <FormFieldDescription id="ip-address-desc">
 *   Enter the IP address in CIDR notation, e.g. 192.168.1.1/24
 * </FormFieldDescription>
 * ```
 */
const meta: Meta<typeof FormFieldDescription> = {
  title: 'Patterns/Forms/FormFieldDescription',
  component: FormFieldDescription,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Help text displayed beneath a form field. Supports an optional HelpCircle icon and links to its input via aria-describedby for full accessibility compliance.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'The description text or any ReactNode',
    },
    id: {
      control: 'text',
      description: 'HTML id for aria-describedby linkage from the associated input',
    },
    showIcon: {
      control: 'boolean',
      description: 'When true, renders a HelpCircle icon before the text',
    },
    className: {
      control: 'text',
      description: 'Additional Tailwind classes applied to the paragraph element',
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
type Story = StoryObj<typeof FormFieldDescription>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default
 *
 * Plain help text without an icon. The most common use case for short,
 * self-explanatory field descriptions.
 */
export const Default: Story = {
  args: {
    children: 'Enter your preferred username. This will be visible to other users.',
    showIcon: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default plain text description with no icon.',
      },
    },
  },
};

/**
 * With Help Icon
 *
 * Adds a HelpCircle icon to the left of the text to draw attention to
 * descriptions that contain important information or caveats.
 */
export const WithHelpIcon: Story = {
  args: {
    children: 'IP address in CIDR notation, e.g. 192.168.1.0/24. Changing this will disconnect active clients.',
    showIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'showIcon=true prepends a HelpCircle icon. Use for descriptions that require extra user attention.',
      },
    },
  },
};

/**
 * Technical Description
 *
 * Longer description with inline code-style formatting wrapped in a `<code>`
 * element. The component renders any ReactNode as children so rich content
 * is fully supported.
 */
export const TechnicalDescription: Story = {
  render: () => (
    <FormFieldDescription showIcon>
      Specify the WireGuard listen port (default{' '}
      <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">51820</code>
      ). The port must not be in use by another service and must be allowed
      through the router firewall.
    </FormFieldDescription>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Rich content children with inline code formatting demonstrate that FormFieldDescription accepts any ReactNode.',
      },
    },
  },
};

/**
 * With Aria ID
 *
 * Demonstrates `id` prop usage. The description paragraph receives an `id` so
 * the sibling input can reference it via `aria-describedby`. Inspect the DOM
 * to verify the id attribute is present.
 */
export const WithAriaId: Story = {
  render: () => (
    <div className="space-y-1.5">
      <label htmlFor="knock-timeout" className="text-sm font-medium">
        Knock Timeout
      </label>
      <input
        id="knock-timeout"
        aria-describedby="knock-timeout-desc"
        placeholder="10s"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      />
      <FormFieldDescription id="knock-timeout-desc" showIcon>
        Maximum time allowed between consecutive port knocks. Accepts duration strings
        such as <code className="font-mono text-xs bg-muted px-1 rounded">10s</code>,{' '}
        <code className="font-mono text-xs bg-muted px-1 rounded">2m</code>, or{' '}
        <code className="font-mono text-xs bg-muted px-1 rounded">1h</code>.
      </FormFieldDescription>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full field with label, input, and a linked description using aria-describedby. Inspect the DOM to verify the id attribute.',
      },
    },
  },
};

/**
 * Short Description
 *
 * Very brief one-line descriptions are the most common use case.
 */
export const ShortDescription: Story = {
  args: {
    children: 'Must be at least 8 characters.',
    showIcon: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal one-line description typical for simple validation hints.',
      },
    },
  },
};

/**
 * Custom Class
 *
 * Demonstrates `className` customisation. Here a warning colour is applied
 * to highlight that the field has a destructive impact.
 */
export const CustomClass: Story = {
  args: {
    children: 'Changing this value will terminate all active VPN sessions immediately.',
    showIcon: true,
    className: 'text-warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom className overrides the muted-foreground default to show the description in warning colour.',
      },
    },
  },
};
