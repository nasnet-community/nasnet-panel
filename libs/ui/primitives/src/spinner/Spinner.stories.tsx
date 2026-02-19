import * as React from 'react';

import { Spinner } from './Spinner';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated loading spinner for indicating in-progress actions. Built with the Loader2 lucide icon. Respects prefers-reduced-motion and includes screen reader support via role="status".',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    label: {
      control: 'text',
      description: 'Screen reader label (visually hidden)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: 'md',
    label: 'Loading...',
  },
};

export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    label: 'Loading...',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Loading...',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Loading...',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    label: 'Loading...',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xs" />
        <span className="text-xs text-muted-foreground">xs (12px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-muted-foreground">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs text-muted-foreground">md (20px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground">lg (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" />
        <span className="text-xs text-muted-foreground">xl (32px)</span>
      </div>
    </div>
  ),
};

export const WithCustomLabel: Story = {
  args: {
    size: 'md',
    label: 'Saving configuration...',
  },
};

export const InButtonContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <button
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        disabled
      >
        <Spinner size="sm" label="Connecting to router..." />
        Connecting...
      </button>
      <button
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
        disabled
      >
        <Spinner size="sm" label="Saving settings..." />
        Saving settings
      </button>
    </div>
  ),
};

export const InLoadingOverlay: Story = {
  render: () => (
    <div className="relative flex h-40 w-64 items-center justify-center rounded-lg border bg-card">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" label="Loading router data..." />
        <span className="text-sm text-muted-foreground">Loading router data...</span>
      </div>
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-primary" />
        <span className="text-xs text-muted-foreground">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-success" />
        <span className="text-xs text-muted-foreground">success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-warning" />
        <span className="text-xs text-muted-foreground">warning</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-error" />
        <span className="text-xs text-muted-foreground">error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">muted</span>
      </div>
    </div>
  ),
};
