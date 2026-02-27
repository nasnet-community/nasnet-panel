/**
 * SkipLinks Stories
 *
 * Demonstrates the skip-navigation components for keyboard and screen reader users.
 * The links are visually hidden by default and only become visible when focused,
 * so each story includes instructions on how to see them in Storybook.
 */

import * as React from 'react';

import { SkipLink, SkipLinks } from './skip-links';

import type { Meta, StoryObj } from '@storybook/react';

// ===== Meta =====

const meta: Meta<typeof SkipLinks> = {
  title: 'Patterns/Accessibility/SkipLinks',
  component: SkipLinks,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Provides skip navigation links that are visually hidden by default and appear ' +
          'on keyboard focus. This is a WCAG 2.1 AAA requirement that allows keyboard and ' +
          'screen reader users to bypass repetitive navigation and jump directly to the ' +
          'main content or other page landmarks. ' +
          '\n\n' +
          '**Usage:** Place `<SkipLinks />` as the first child of your page layout, then ' +
          'add matching `id` attributes to landmark elements (`#main-content`, `#navigation`, etc.).' +
          '\n\n' +
          '**To see the links in Storybook:** Click inside the story canvas, then press Tab ' +
          'to focus the first skip link and reveal it.',
      },
    },
  },
  argTypes: {
    links: {
      control: 'object',
      description: 'Array of skip link targets. Each item has `href` and `label` fields.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the skip links container',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkipLinks>;

// ===== Shared page mock =====

function MockPage({ children }: { children?: React.ReactNode }) {
  return (
    <div className="text-foreground bg-background min-h-[400px] font-sans">
      {children}

      {/* Navigation landmark */}
      <nav
        id="navigation"
        className="bg-card mt-12 flex items-center gap-4 border-b px-6 py-3"
        aria-label="Main navigation"
      >
        <span className="text-sm font-semibold">NasNet</span>
        <a
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Dashboard
        </a>
        <a
          href="/network"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Network
        </a>
        <a
          href="/firewall"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Firewall
        </a>
      </nav>

      {/* Main content landmark */}
      <main
        id="main-content"
        className="px-6 py-8"
      >
        <h1 className="mb-2 text-xl font-semibold">Main Content Area</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Press Tab from within this story to bring focus to the skip links above and reveal them.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted h-20 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// ===== Stories =====

/**
 * Default configuration – two links targeting `#main-content` and `#navigation`.
 * Press Tab inside the story canvas to reveal the first link.
 */
export const Default: Story = {
  render: (args) => (
    <MockPage>
      <SkipLinks {...args} />
    </MockPage>
  ),
  args: {
    links: [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#navigation', label: 'Skip to navigation' },
    ],
  },
};

/**
 * Custom links – a three-link set covering main content, sidebar, and footer.
 */
export const CustomLinks: Story = {
  render: (args) => (
    <MockPage>
      <SkipLinks {...args} />
    </MockPage>
  ),
  args: {
    links: [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#sidebar', label: 'Skip to sidebar' },
      { href: '#footer', label: 'Skip to footer' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'A customised three-link set. Additional links stack vertically when focused ' +
          'in sequence.',
      },
    },
  },
};

/**
 * Single link – minimal configuration with just the main content target.
 */
export const SingleLink: Story = {
  render: (args) => (
    <MockPage>
      <SkipLinks {...args} />
    </MockPage>
  ),
  args: {
    links: [{ href: '#main-content', label: 'Skip to main content' }],
  },
};

/**
 * SkipLink (singular) – the individual `<SkipLink>` component for custom layouts
 * that need granular placement outside the standard container.
 */
export const SingleSkipLink: Story = {
  render: () => (
    <div className="bg-background min-h-[300px] p-6">
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      <nav
        className="bg-card mb-4 rounded border p-4"
        aria-label="Navigation"
      >
        <p className="text-muted-foreground text-sm">
          (Focus the SkipLink above by pressing Tab from this frame)
        </p>
      </nav>

      <main
        id="main-content"
        className="bg-muted rounded p-4"
      >
        <h1 className="mb-1 font-semibold">Main Content</h1>
        <p className="text-muted-foreground text-sm">
          The individual {'<SkipLink>'} component uses <code>sr-only</code> styling by default and
          becomes visible at the top of the viewport when focused.
        </p>
      </main>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`SkipLink` (singular export) provides a single, individually positioned link. ' +
          'Useful when the container `<SkipLinks>` does not fit the page layout.',
      },
    },
  },
};

/**
 * Visible state preview – the links are forced into their focused/visible state using
 * a custom class so the appearance can be inspected without keyboard interaction.
 */
export const VisiblePreview: Story = {
  render: () => (
    <div className="bg-background relative min-h-[200px] p-6 pt-24">
      <div
        className="fixed left-0 top-0 z-[9999] flex flex-col gap-2 p-4"
        aria-label="Skip links (visible preview)"
      >
        {/* Render the links already in their visible state for documentation */}
        {[
          { href: '#main-content', label: 'Skip to main content' },
          { href: '#navigation', label: 'Skip to navigation' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={[
              'bg-primary rounded-lg px-4 py-3',
              'text-primary-foreground text-sm font-semibold',
              'min-h-[44px] min-w-[44px] shadow-lg',
              'flex items-center justify-center',
              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            ].join(' ')}
          >
            {link.label}
          </a>
        ))}
      </div>

      <p className="text-muted-foreground mt-4 text-sm">
        This story renders the skip links in their visible state so you can see how they look
        without needing keyboard interaction. In production they are hidden until focused.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A non-interactive preview that shows the focused/visible appearance of the ' +
          'skip links. In the real component these are only displayed when the user tabs ' +
          'into them.',
      },
    },
  },
};
