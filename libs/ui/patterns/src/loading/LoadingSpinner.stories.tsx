/**
 * LoadingSpinner Stories
 *
 * Storybook stories for the LoadingSpinner pattern component.
 * Demonstrates size, orientation, label, centering, and padding variants.
 */

import { LoadingSpinner } from './LoadingSpinner';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Patterns/PageStructure/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Pattern-level loading spinner with label and layout options, built on top of the \`Spinner\` primitive.

Features:
- Five size variants: \`xs\`, \`sm\`, \`md\` (default), \`lg\`, \`xl\`
- Optional visible label (vertical or horizontal layout)
- Screen-reader-only label when visual label is hidden
- \`centered\` prop to fill the container width and centre content
- \`padded\` prop to add internal spacing (useful inside cards)

## Usage

\`\`\`tsx
import { LoadingSpinner } from '@nasnet/ui/patterns';

// Simple spinner (no visible label)
<LoadingSpinner />

// With visible label
<LoadingSpinner label="Fetching interfaces..." showLabel />

// Centred with padding, large size
<LoadingSpinner centered padded size="lg" label="Loading dashboard..." showLabel />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      description: 'Spinner size',
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    label: {
      description: 'Text label (also used as screen-reader-only label when showLabel is false)',
      control: 'text',
    },
    showLabel: {
      description: 'Whether to show the label visually',
      control: 'boolean',
    },
    orientation: {
      description: 'Layout direction of spinner and label',
      control: 'radio',
      options: ['vertical', 'horizontal'],
    },
    centered: {
      description: 'Centre the spinner within its container (full width)',
      control: 'boolean',
    },
    padded: {
      description: 'Add internal padding around the spinner',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

/**
 * Default spinner — medium size, no visible label, screen-reader label only.
 */
export const Default: Story = {
  args: {
    size: 'md',
    label: 'Loading...',
    showLabel: false,
  },
};

/**
 * Spinner with a visible label beneath it (vertical layout).
 */
export const WithLabel: Story = {
  args: {
    size: 'md',
    label: 'Fetching router data...',
    showLabel: true,
    orientation: 'vertical',
  },
  parameters: {
    docs: {
      description: {
        story: 'Label displayed below the spinner in vertical orientation.',
      },
    },
  },
};

/**
 * Horizontal layout — spinner and label side-by-side.
 * Useful for inline loading states inside forms or toolbars.
 */
export const HorizontalLayout: Story = {
  args: {
    size: 'sm',
    label: 'Applying configuration...',
    showLabel: true,
    orientation: 'horizontal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline spinner with label in horizontal orientation — ideal for form submit states.',
      },
    },
  },
};

/**
 * All size variants displayed together.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <LoadingSpinner size={size} label={`${size} spinner`} />
          <span className="text-xs text-muted-foreground font-mono">{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four size variants: sm (16px), md (24px), lg (32px), xl (48px).',
      },
    },
  },
};

/**
 * Centred and padded — typical usage inside a card or page section.
 */
export const CenteredAndPadded: Story = {
  render: () => (
    <div className="w-80 border border-border rounded-2xl bg-card">
      <LoadingSpinner
        centered
        padded
        size="lg"
        label="Loading network interfaces..."
        showLabel
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Centred with padding inside a card container — the typical full-section loading state.',
      },
    },
  },
};

/**
 * Large spinner for full-page loading states.
 */
export const FullPageLoading: Story = {
  render: () => (
    <div className="flex items-center justify-center h-64 w-full">
      <LoadingSpinner
        size="xl"
        label="Connecting to router..."
        showLabel
        orientation="vertical"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full-page loading pattern with xl spinner and descriptive label.',
      },
    },
  },
};
