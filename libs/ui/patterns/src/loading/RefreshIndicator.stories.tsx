/**
 * RefreshIndicator Stories
 *
 * Storybook stories for the RefreshIndicator pattern component.
 * Demonstrates bar vs dots variants, color options, position, and fixed mode.
 */

import { RefreshIndicator } from './RefreshIndicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RefreshIndicator> = {
  title: 'Patterns/PageStructure/RefreshIndicator',
  component: RefreshIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Subtle progress indicator shown during background data refreshes (stale-while-revalidate).

Two style variants:
- **Bar** (default): A sliding bar across the top or bottom edge — minimal visual footprint.
- **Dots**: Three pulsing dots — draws slightly more attention.

Three color options: \`primary\`, \`secondary\`, \`muted\`.

The component renders **nothing** when \`isRefreshing\` is \`false\`, so it is safe to always mount it.

## Usage

\`\`\`tsx
import { RefreshIndicator } from '@nasnet/ui/patterns';

// Relative bar at top of a container
<div className="relative">
  <RefreshIndicator isRefreshing={isRevalidating} />
  {/* page content */}
</div>

// Fixed to viewport top
<RefreshIndicator isRefreshing={isRevalidating} fixed />

// Dots at bottom
<RefreshIndicator isRefreshing={isRevalidating} position="bottom" variant="dots" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isRefreshing: {
      description: 'Whether a refresh is in progress. Component renders nothing when false.',
      control: 'boolean',
    },
    variant: {
      description: 'Visual style — sliding bar or pulsing dots',
      control: 'radio',
      options: ['bar', 'dots'],
    },
    color: {
      description: 'Color of the indicator',
      control: 'select',
      options: ['primary', 'secondary', 'muted'],
    },
    position: {
      description: 'Whether to place the indicator at the top or bottom of its container',
      control: 'radio',
      options: ['top', 'bottom'],
    },
    fixed: {
      description: 'Pin to the viewport edge (fixed positioning) rather than the nearest container',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RefreshIndicator>;

/**
 * Active bar indicator — the default variant.
 * Wraps in a relative container to demonstrate absolute positioning.
 */
export const Default: Story = {
  render: () => (
    <div className="relative w-full h-20 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden">
      <RefreshIndicator isRefreshing={true} variant="bar" color="primary" position="top" />
      <span className="text-sm text-muted-foreground">Card content (refreshing in background)</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default bar variant — a thin animated line sliding across the top edge of the container.',
      },
    },
  },
};

/**
 * Not refreshing — component renders nothing.
 */
export const NotRefreshing: Story = {
  render: () => (
    <div className="relative w-full h-20 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden">
      <RefreshIndicator isRefreshing={false} />
      <span className="text-sm text-muted-foreground">Content visible — indicator hidden</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'When `isRefreshing` is false, the component renders nothing at all.',
      },
    },
  },
};

/**
 * Dots variant — three pulsing dots.
 */
export const DotsVariant: Story = {
  render: () => (
    <div className="relative w-full h-20 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden">
      <RefreshIndicator isRefreshing={true} variant="dots" color="primary" position="top" />
      <span className="text-sm text-muted-foreground">Refreshing with dots indicator</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dots variant — three pulsing circles with staggered animation delays.',
      },
    },
  },
};

/**
 * Bottom position with dots.
 */
export const BottomDots: Story = {
  render: () => (
    <div className="relative w-full h-20 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden">
      <RefreshIndicator isRefreshing={true} variant="dots" color="secondary" position="bottom" />
      <span className="text-sm text-muted-foreground">Dots at bottom edge</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dots variant positioned at the bottom of the container.',
      },
    },
  },
};

/**
 * All color variants side-by-side.
 */
export const ColorVariants: Story = {
  render: () => (
    <div className="space-y-4">
      {(['primary', 'secondary', 'muted'] as const).map((color) => (
        <div
          key={color}
          className="relative w-full h-16 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden"
        >
          <RefreshIndicator isRefreshing={true} variant="bar" color={color} position="top" />
          <span className="text-sm text-muted-foreground font-mono">color="{color}"</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All three color variants: primary (amber), secondary (blue), and muted.',
      },
    },
  },
};

/**
 * Both variants side-by-side for comparison.
 */
export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div
        className="relative w-full h-16 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden"
      >
        <RefreshIndicator isRefreshing={true} variant="bar" color="primary" position="top" />
        <span className="text-sm text-muted-foreground">variant="bar"</span>
      </div>
      <div
        className="relative w-full h-16 border border-border rounded-xl bg-card flex items-center justify-center overflow-hidden"
      >
        <RefreshIndicator isRefreshing={true} variant="dots" color="primary" position="top" />
        <span className="text-sm text-muted-foreground">variant="dots"</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of `bar` and `dots` variants.',
      },
    },
  },
};
