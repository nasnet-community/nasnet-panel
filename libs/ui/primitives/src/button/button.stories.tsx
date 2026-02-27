import { Mail, Download, ArrowRight, Check } from 'lucide-react';

import { Button } from './button';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Button - Interactive element for triggering actions
 *
 * Primary component for user interactions across the application. Supports 7 semantic variants
 * and responsive sizing. All buttons include keyboard navigation (Enter/Space), focus indicators,
 * and loading state management with spinner and aria-busy.
 *
 * ## Accessibility
 * - Minimum 44px touch target on mobile devices
 * - Full keyboard navigation support (Enter, Space)
 * - Focus indicators with 2–3px ring offset
 * - Icon-only buttons must include aria-label
 * - Loading state sets aria-busy="true"
 * - Semantic HTML with proper disabled state handling
 *
 * ## Variants
 * - **default/action**: Primary CTA, golden amber background
 * - **secondary**: Secondary action, trust blue background
 * - **destructive**: Dangerous action, red background (delete, reset)
 * - **outline**: Medium emphasis, bordered style
 * - **ghost**: Minimal emphasis, background only on hover
 * - **link**: Inline action, underlined text
 *
 * ## Platform-Specific Behavior
 * - Mobile: Prioritize touch targets (44px minimum), use bottom sheet for dense actions
 * - Tablet: Balanced approach, support both touch and click
 * - Desktop: Standard cursors, all action variants visible
 */
const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive button component supporting 7 semantic variants, responsive sizing, and built-in loading states. Fully accessible with keyboard navigation, focus indicators, and screen reader support.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'action', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
      description: 'Semantic variant determining button styling and context',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size: sm (9px height), default (11px), lg (12px), icon (square)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables button and prevents interaction',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows spinner and disables button, sets aria-busy="true"',
    },
    loadingText: {
      control: 'text',
      description: 'Optional text to display during loading state (defaults to children)',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as different element (link, custom component) via Radix Slot',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default button with primary action styling.
 * Happy path: typical usage with default size and variant.
 */
export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'default',
    size: 'default',
  },
};

/**
 * All 7 semantic variants side-by-side for reference.
 * Use case: design system showcase, understanding context for each variant.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="action">Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All 7 semantic variants for different interaction contexts. Primary (default/action) for CTAs, Secondary for navigation, Destructive for dangerous actions, Outline for medium emphasis, Ghost for minimal emphasis, Link for inline actions.',
      },
    },
  },
};

/**
 * All 4 size variants with responsive heights.
 * Mobile uses larger sizes; desktop uses compact sizes.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small (9px)</Button>
      <Button size="default">Default (11px)</Button>
      <Button size="lg">Large (12px)</Button>
      <Button
        size="icon"
        aria-label="Email"
      >
        <Mail className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Responsive sizing: sm for compact layouts, default for standard, lg for emphasis, icon for square buttons. Icon-only buttons must include aria-label.',
      },
    },
  },
};

/**
 * Buttons with icons for common actions.
 * Icons paired with text for clarity and visual guidance.
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <Mail className="h-4 w-4" />
        Login with Email
      </Button>
      <Button variant="secondary">
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button>
        Next
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Icons enhance visual clarity. Always pair with text labels except for very common affordances (X for close, + for add). Icons have consistent 16px size and spacing.',
      },
    },
  },
};

/**
 * Loading state with spinner and disabled interaction.
 * Shows aria-busy="true" and prevents clicks during operation.
 * Use case: form submissions, async operations, config saves.
 */
export const LoadingState: Story = {
  args: {
    isLoading: true,
    loadingText: 'Saving...',
    children: 'Save Configuration',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state with built-in spinner. Use loadingText to indicate action (e.g., "Saving...", "Applying..."). Button is disabled and aria-busy="true" for accessibility.',
      },
    },
  },
};

/**
 * Loading variant demonstration for all 3 variants.
 * Each shows spinner with appropriate text.
 */
export const LoadingVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button
        isLoading
        loadingText="Saving..."
      >
        Save Changes
      </Button>
      <Button
        variant="secondary"
        isLoading
        loadingText="Loading..."
      >
        Secondary Loading
      </Button>
      <Button
        variant="outline"
        isLoading
        loadingText="Processing..."
      >
        Outline Loading
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state works across all variants. Spinner appears before text, button disables, and aria-busy is set.',
      },
    },
  },
};

/**
 * Disabled state showing visual feedback.
 * Use case: insufficient permissions, waiting for prerequisites, validation failure.
 */
export const DisabledState: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>Disabled Default</Button>
      <Button
        variant="secondary"
        disabled
      >
        Disabled Secondary
      </Button>
      <Button
        variant="destructive"
        disabled
      >
        Disabled Destructive
      </Button>
      <Button
        variant="outline"
        disabled
      >
        Disabled Outline
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled buttons show reduced opacity (50%) and pointer-events-none. Use with tooltips to explain why disabled (e.g., "Complete form before saving").',
      },
    },
  },
};

/**
 * Success state showing completion feedback.
 * Use case: immediate confirmation without toast (quick operations < 1s).
 */
export const SuccessState: Story = {
  render: () => (
    <Button
      variant="default"
      disabled
    >
      <Check className="h-4 w-4" />
      Saved Successfully
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Success state shown momentarily after operation completes (500–1000ms). Pair with toast for visibility.',
      },
    },
  },
};

/**
 * Icon-only button with required aria-label.
 * Mobile touch target: 44px minimum.
 */
export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Send email"
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        aria-label="Download file"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        aria-label="Confirm action"
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only buttons MUST include aria-label for accessibility. Touch target: 44px on mobile, 32px on desktop.',
      },
    },
  },
};

/**
 * Rendering as link element via asChild.
 * Use case: navigation buttons styled as primary action.
 */
export const AsChild: Story = {
  render: () => (
    <Button asChild>
      <a
        href="https://example.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Go to Dashboard
      </a>
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'asChild renders button styling on any element (link, custom component). Useful for consistent styling with different semantics.',
      },
    },
  },
};

/**
 * Mobile viewport (375px): Single column, larger touch targets.
 */
export const Mobile: Story = {
  args: {
    children: 'Touch Target (44px minimum)',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile (< 640px): 44px minimum touch target, 8px spacing between targets, bottom layout for dense actions.',
      },
    },
  },
};

/**
 * Tablet viewport (768px): Balanced spacing and sizing.
 */
export const Tablet: Story = {
  args: {
    children: 'Tablet Size Button',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Tablet (640–1024px): Balanced touch and click interaction, 38–44px targets, support landscape/portrait.',
      },
    },
  },
};

/**
 * Desktop viewport (1280px): Standard click interaction with hover effects.
 */
export const Desktop: Story = {
  args: {
    children: 'Desktop Click Target',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop (> 1024px): 32–38px click targets, hover effects visible, keyboard shortcuts available.',
      },
    },
  },
};

/**
 * Empty/error state: Button with no content (edge case).
 */
export const EdgeCase_NoContent: Story = {
  args: {
    children: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: Button with no children (icon-only should use size="icon" with aria-label instead).',
      },
    },
  },
};

/**
 * Edge case: Very long button text wrapping.
 * Use case: Internationalization (German text ~30% longer than English).
 */
export const EdgeCase_LongText: Story = {
  args: {
    children: 'This is a very long button label that might wrap on smaller screens',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: Long text wrapping. Use for i18n testing (German ~30% longer than English).',
      },
    },
  },
};
