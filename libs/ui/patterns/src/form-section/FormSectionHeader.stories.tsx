/**
 * FormSectionHeader Storybook Stories
 *
 * Demonstrates all variants of the FormSectionHeader sub-component:
 * static (non-collapsible) and interactive (collapsible), with error badges,
 * help icons, and reduced-motion support.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import * as React from 'react';

import { FormSectionHeader } from './FormSectionHeader';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof FormSectionHeader> = {
  title: 'Patterns/FormSection/FormSectionHeader',
  component: FormSectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## FormSectionHeader

The header sub-component of \`FormSection\`. Renders either a static \`<div>\`
(non-collapsible) or an accessible \`<button>\` (collapsible) depending on the
\`isCollapsible\` prop.

### Features
- **Title** – always displayed as \`<h3>\`
- **Description** – optional muted subtitle
- **Error badge** – shows count when \`errorCount > 0\`
- **Help icon** – tooltip-wrapped button when \`helpId\` is provided
- **Chevron icon** – rotates 180° when expanded (collapsible mode only)
- **44px minimum tap target** – WCAG AAA compliant
- **Reduced motion** – chevron rotation transition disabled when \`reducedMotion\` is true

### Props
| Prop | Type | Description |
|------|------|-------------|
| \`title\` | \`string\` | Section title (required) |
| \`description\` | \`string?\` | Optional subtitle |
| \`isCollapsible\` | \`boolean\` | Renders a button when true |
| \`isExpanded\` | \`boolean\` | Controls chevron rotation and aria-expanded |
| \`onToggle\` | \`() => void\` | Called when the button is clicked |
| \`helpId\` | \`string?\` | Triggers help tooltip when provided |
| \`errorCount\` | \`number\` | Badge count (hidden when 0) |
| \`headingId\` | \`string\` | \`id\` applied to the heading element |
| \`contentId\` | \`string\` | \`aria-controls\` value for collapsible button |
| \`reducedMotion\` | \`boolean\` | Disables chevron CSS transition |
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    isCollapsible: { control: 'boolean' },
    isExpanded: { control: 'boolean' },
    errorCount: { control: { type: 'number', min: 0, max: 10 } },
    helpId: { control: 'text' },
    reducedMotion: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FormSectionHeader>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Non-collapsible header – static div, no toggle button, no chevron.
 * Suitable for required sections that should always be visible.
 */
export const Static: Story = {
  args: {
    title: 'Network Settings',
    description: 'Configure your network connection',
    isCollapsible: false,
    isExpanded: true,
    onToggle: () => {},
    errorCount: 0,
    headingId: 'section-heading-static',
    contentId: 'section-content-static',
    reducedMotion: false,
  },
};

/**
 * Collapsible header in expanded state.
 * The chevron points upward (rotated 180°).
 */
export const CollapsibleExpanded: Story = {
  args: {
    title: 'Advanced Options',
    description: 'Optional configuration for power users',
    isCollapsible: true,
    isExpanded: true,
    onToggle: () => {},
    errorCount: 0,
    headingId: 'section-heading-expanded',
    contentId: 'section-content-expanded',
    reducedMotion: false,
  },
};

/**
 * Collapsible header in collapsed state.
 * The chevron points downward (default orientation).
 */
export const CollapsibleCollapsed: Story = {
  args: {
    title: 'Advanced Options',
    description: 'Optional configuration for power users',
    isCollapsible: true,
    isExpanded: false,
    onToggle: () => {},
    errorCount: 0,
    headingId: 'section-heading-collapsed',
    contentId: 'section-content-collapsed',
    reducedMotion: false,
  },
};

/**
 * Error badge visible – shows error count next to the title.
 * The badge is always rendered regardless of collapsible state.
 */
export const WithErrors: Story = {
  args: {
    title: 'IP Configuration',
    description: 'IPv4 address and subnet settings',
    isCollapsible: false,
    isExpanded: true,
    onToggle: () => {},
    errorCount: 3,
    headingId: 'section-heading-errors',
    contentId: 'section-content-errors',
    reducedMotion: false,
  },
};

/**
 * Collapsible with a single error – collapses to hide errors until expanded.
 */
export const CollapsibleWithError: Story = {
  args: {
    title: 'Authentication',
    description: 'Credentials for this connection',
    isCollapsible: true,
    isExpanded: false,
    onToggle: () => {},
    errorCount: 1,
    headingId: 'section-heading-auth-error',
    contentId: 'section-content-auth-error',
    reducedMotion: false,
  },
};

/**
 * Help icon rendered – a question-mark button with tooltip appears on the right.
 */
export const WithHelpIcon: Story = {
  args: {
    title: 'DHCP Settings',
    description: 'Address pool and lease time configuration',
    isCollapsible: false,
    isExpanded: true,
    onToggle: () => {},
    helpId: 'dhcp-settings-help',
    errorCount: 0,
    headingId: 'section-heading-help',
    contentId: 'section-content-help',
    reducedMotion: false,
  },
};

/**
 * Interactive toggle demo – click the header to expand/collapse.
 */
export const InteractiveToggle: Story = {
  render: () => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
      <div className="w-96 rounded-lg border border-border overflow-hidden">
        <FormSectionHeader
          title="WireGuard Interface"
          description="Click to toggle this section"
          isCollapsible
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((prev) => !prev)}
          errorCount={0}
          headingId="interactive-heading"
          contentId="interactive-content"
          reducedMotion={false}
        />
        {isExpanded && (
          <div id="interactive-content" className="p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Section is <strong>expanded</strong>. Click the header above to collapse.
            </p>
            <p className="mt-2 text-xs text-muted-foreground font-mono">
              isExpanded: {String(isExpanded)}
            </p>
          </div>
        )}
      </div>
    );
  },
};

/**
 * Reduced motion – chevron rotation CSS transition is disabled.
 * The icon still flips but without the animated transition.
 */
export const ReducedMotion: Story = {
  args: {
    title: 'Firewall Rules',
    description: 'Transition is instant (no CSS animation)',
    isCollapsible: true,
    isExpanded: true,
    onToggle: () => {},
    errorCount: 0,
    headingId: 'section-heading-reduced',
    contentId: 'section-content-reduced',
    reducedMotion: true,
  },
};

/**
 * Full kitchen-sink – collapsible, errors, help icon, all active together.
 */
export const AllFeatures: Story = {
  args: {
    title: 'VPN Authentication',
    description: 'Manage certificates and pre-shared keys',
    isCollapsible: true,
    isExpanded: true,
    onToggle: () => {},
    helpId: 'vpn-auth-help',
    errorCount: 2,
    headingId: 'section-heading-all',
    contentId: 'section-content-all',
    reducedMotion: false,
  },
};
