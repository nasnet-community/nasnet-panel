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
      options: ['sm', 'md', 'lg', 'xl'],
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
        <Spinner size="sm" />
        <span className="text-muted-foreground text-xs">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-muted-foreground text-xs">md (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-muted-foreground text-xs">lg (32px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" />
        <span className="text-muted-foreground text-xs">xl (48px)</span>
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
        className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
        disabled
      >
        <Spinner
          size="sm"
          label="Connecting to router..."
        />
        Connecting...
      </button>
      <button
        className="border-input bg-background inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
        disabled
      >
        <Spinner
          size="sm"
          label="Saving settings..."
        />
        Saving settings
      </button>
    </div>
  ),
};

export const InLoadingOverlay: Story = {
  render: () => (
    <div className="bg-card relative flex h-40 w-64 items-center justify-center rounded-lg border">
      <div className="flex flex-col items-center gap-3">
        <Spinner
          size="xl"
          label="Loading router data..."
        />
        <span className="text-muted-foreground text-sm">Loading router data...</span>
      </div>
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner
          size="lg"
          className="text-primary"
        />
        <span className="text-muted-foreground text-xs">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner
          size="lg"
          className="text-success"
        />
        <span className="text-muted-foreground text-xs">success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner
          size="lg"
          className="text-warning"
        />
        <span className="text-muted-foreground text-xs">warning</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner
          size="lg"
          className="text-error"
        />
        <span className="text-muted-foreground text-xs">error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner
          size="lg"
          className="text-muted-foreground"
        />
        <span className="text-muted-foreground text-xs">muted</span>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  args: {
    size: 'md',
    label: 'Loading...',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Tablet: Story = {
  args: {
    size: 'md',
    label: 'Loading...',
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

export const Error: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <div className="text-error flex items-center gap-3">
        <Spinner
          size="lg"
          className="text-error"
          label="Error attempting operation..."
        />
        <div>
          <p className="text-foreground text-sm font-medium">Operation Failed</p>
          <p className="text-muted-foreground text-xs">Retrying...</p>
        </div>
      </div>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="flex h-40 flex-col items-center justify-center gap-4">
      <Spinner
        size="lg"
        label="Loading content..."
      />
      <p className="text-muted-foreground text-sm">No data available yet</p>
    </div>
  ),
};
