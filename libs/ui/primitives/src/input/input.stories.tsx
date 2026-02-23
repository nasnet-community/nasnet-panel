import { Input } from './input';
import { Button } from '../button/button';
import { Label } from '../label/label';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Input Component Stories
 *
 * Comprehensive Storybook documentation for the Input primitive component.
 * Covers all input types, sizes, and states across mobile, tablet, and desktop viewports.
 *
 * Accessibility (WCAG AAA):
 * - 7:1 contrast ratio maintained in both light and dark modes
 * - 44px minimum touch target on mobile (inputSize="default")
 * - Semantic aria-invalid attribute for error states
 * - Full keyboard navigation support
 * - Screen reader compatible with proper label associations
 *
 * Dark Mode: All stories support theme toggle via Storybook theme switcher
 * Visual Regression: Baseline created in Chromatic for all story states
 */
const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible text input component supporting multiple input types (text, email, password, number, search, tel, url, file). ' +
          'Features rounded borders (6px via rounded-input token), smooth focus transitions (200ms), error states with semantic aria-invalid, ' +
          'and full WCAG AAA accessibility (7:1 contrast, 44px touch targets on mobile). Renders as native HTML input with forwarded ref. ' +
          'Uses semantic design tokens (primary, error, muted-foreground) for dark mode support.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'file'],
      description: 'HTML input type (defaults to "text")',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state with reduced opacity and cursor-not-allowed',
    },
    error: {
      control: 'boolean',
      description: 'Error state: red border + error ring color on focus (semantic feedback)',
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size variant: sm (compact 9px), default (44px mobile, 11px), lg (12px touch targets)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text (muted-foreground color, 14px weight)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes merged via cn() utility',
    },
    variant: {
      control: 'select',
      options: ['default', 'error'],
      description: 'Style variant (auto-set to error when error=true prop)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

/**
 * Default story - Happy path typical input
 * Demonstrates basic text input with placeholder
 */
export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
};

/**
 * Mobile viewport story (375px)
 * Verifies 44px touch target and single-column layout on small screens
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    type: 'text',
    inputSize: 'default',
    placeholder: 'Mobile input (44px target)',
  },
};

/**
 * Tablet viewport story (768px)
 * Verifies proper spacing and readable input on medium screens
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    type: 'text',
    inputSize: 'default',
    placeholder: 'Tablet input (38-44px)',
  },
};

/**
 * Desktop viewport story (1280px)
 * Verifies dense layout and full detail visibility
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    type: 'text',
    inputSize: 'default',
    placeholder: 'Desktop input (32-38px)',
  },
};

/**
 * With Label story
 * Shows proper semantic label association (htmlFor linking)
 * Ensures screen reader compatibility
 */
export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

/**
 * Disabled state story
 * Verifies visual feedback: reduced opacity, cursor-not-allowed
 * Input remains keyboard accessible but functionally disabled
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};

/**
 * Error state story
 * Demonstrates error styling: red border + error ring on focus
 * Shows aria-invalid attribute semantic feedback for screen readers
 */
export const ErrorState: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="invalid-email">Email</Label>
      <Input
        id="invalid-email"
        type="email"
        error
        placeholder="Invalid email"
        defaultValue="not-an-email"
        aria-describedby="email-error"
      />
      <p id="email-error" className="text-sm text-error">
        Please enter a valid email address
      </p>
    </div>
  ),
};

/**
 * Small size story
 * Verifies compact layout (9px height, 3px padding)
 * Suitable for dense data tables and advanced forms
 */
export const SmallSize: Story = {
  args: {
    type: 'text',
    inputSize: 'sm',
    placeholder: 'Small input...',
  },
};

/**
 * Large size story
 * Verifies enhanced touch target (12px height, 5px padding)
 * Recommended for primary mobile inputs
 */
export const LargeSize: Story = {
  args: {
    type: 'text',
    inputSize: 'lg',
    placeholder: 'Large input...',
  },
};

/**
 * Loading state story (empty)
 * Shows input ready for user interaction
 * Demonstrates proper focus ring appearance
 */
export const Loading: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="loading-input">Loading example</Label>
      <Input
        id="loading-input"
        type="text"
        placeholder="Focus to see ring..."
        autoFocus
      />
    </div>
  ),
};

/**
 * With Button story
 * Shows input combined with action button in flex layout
 * Verifies spacing consistency (space-x-2 = 8px gap)
 */
export const WithButton: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="email" placeholder="Email" />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
};

/**
 * File input story
 * Demonstrates file-specific styling and label association
 * Shows custom file input presentation
 */
export const File: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  ),
};

/**
 * All input types showcase
 * Comprehensive demonstration of supported input types:
 * text, email, password, number, search, tel, url, file
 * Each with proper label associations
 */
export const AllTypes: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="text">Text</Label>
        <Input type="text" id="text" placeholder="Text input" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" placeholder="email@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input type="password" id="password" placeholder="Password" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="number">Number</Label>
        <Input type="number" id="number" placeholder="0" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="search">Search</Label>
        <Input type="search" id="search" placeholder="Search..." />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tel">Telephone</Label>
        <Input type="tel" id="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="url">URL</Label>
        <Input type="url" id="url" placeholder="https://example.com" />
      </div>
    </div>
  ),
};
