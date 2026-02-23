/**
 * PageHeader Stories
 *
 * Demonstrates the page-level header component used at the top
 * of feature pages for consistent layout and navigation context.
 */

import * as React from 'react';

import { Button } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'Patterns/Common/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A page-level header component that displays a title with optional ' +
          'description and action buttons. Provides consistent spacing and ' +
          'typography across all feature pages. Simple, single-platform component ' +
          '(no mobile/tablet/desktop variants needed due to CSS media queries).',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title (required)',
    },
    description: {
      control: 'text',
      description: 'Optional descriptive subtitle',
    },
    actions: {
      control: false,
      description: 'Optional action buttons or controls to render on the right',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

/**
 * Default header with title and description.
 */
export const Default: Story = {
  args: {
    title: 'DNS Configuration',
    description: 'Manage DNS servers and static entries',
  },
};

/**
 * Header with title only (no description).
 */
export const TitleOnly: Story = {
  args: {
    title: 'Network Interfaces',
  },
};

/**
 * Header with title and action buttons.
 */
export const WithActions: Story = {
  args: {
    title: 'Firewall Rules',
    description: 'View and manage firewall filter rules',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Import
        </Button>
        <Button size="sm">Add Rule</Button>
      </div>
    ),
  },
};

/**
 * Header with multiple action buttons.
 */
export const WithMultipleActions: Story = {
  args: {
    title: 'VPN Configuration',
    description: 'Manage VPN tunnels and connections',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Docs
        </Button>
        <Button variant="outline" size="sm">
          Settings
        </Button>
        <Button size="sm">Add VPN</Button>
      </div>
    ),
  },
};

/**
 * Header with long title text (testing text wrapping).
 */
export const LongTitle: Story = {
  args: {
    title: 'Virtual Interface Factory Service Instance Configuration and Management Dashboard',
    description:
      'Configure advanced routing policies and network segmentation for per-device routing',
  },
};

/**
 * Header with minimal styling (custom className).
 */
export const CustomStyling: Story = {
  args: {
    title: 'System Settings',
    description: 'Configure system-wide preferences',
    className: 'mb-12 px-4 border-b pb-4',
  },
};
