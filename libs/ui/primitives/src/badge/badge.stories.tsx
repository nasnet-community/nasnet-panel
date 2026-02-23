import { Badge } from './badge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A small inline label component for status indicators, tags, and categorization. Uses semantic color tokens that automatically adapt to light/dark theme. Supports pulse animation for live/real-time data (respects prefers-reduced-motion). WCAG AAA accessible with 7:1 contrast ratio. Color should never be the sole status indicator—always pair with icon and text.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'success', 'connected', 'warning', 'error', 'info', 'offline', 'outline'],
      description: 'Color variant. Semantic variants (success, warning, error, info) use standard status colors.',
    },
    pulse: {
      control: 'boolean',
      description: 'Enable pulse animation for live/real-time indicators (auto-disabled via prefers-reduced-motion)',
    },
    className: {
      control: 'text',
      description: 'Optional custom CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="connected">Connected</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="offline">Offline</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="connected">Connected</Badge>
        <span className="text-sm text-muted-foreground">Server is online and responding</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">Pending</Badge>
        <span className="text-sm text-muted-foreground">Connection is being established</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="error">Failed</Badge>
        <span className="text-sm text-muted-foreground">Connection could not be established</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="offline">Offline</Badge>
        <span className="text-sm text-muted-foreground">Server is not responding</span>
      </div>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="success" className="gap-1">
        <span className="h-2 w-2 rounded-full bg-success" />
        Online
      </Badge>
      <Badge variant="error" className="gap-1">
        <span className="h-2 w-2 rounded-full bg-error" />
        Offline
      </Badge>
    </div>
  ),
};

/**
 * Mobile viewport story (375px)
 */
export const Mobile: Story = {
  render: () => (
    <div className="space-y-3">
      <Badge variant="success">Online</Badge>
      <Badge variant="error">Offline</Badge>
      <Badge variant="warning" pulse>
        Connecting
      </Badge>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport story (768px)
 */
export const Tablet: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop viewport story (1280px) - Full variant showcase
 */
export const Desktop: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Brand variants</h3>
        <div className="flex gap-2">
          <Badge variant="default">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Status indicators (semantic colors)</h3>
        <div className="flex gap-2">
          <Badge variant="success">Online</Badge>
          <Badge variant="error">Offline</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">With icons (color + icon + text)</h3>
        <div className="flex gap-2">
          <Badge variant="success" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            Online
          </Badge>
          <Badge variant="error" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-error" />
            Offline
          </Badge>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Live indicator (pulse animation)</h3>
        <Badge variant="success" pulse className="gap-1">
          <span className="h-2 w-2 rounded-full bg-success" />
          Live
        </Badge>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Other variants</h3>
        <div className="flex gap-2">
          <Badge variant="offline">Offline</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="connected">Connected</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Dark mode story - Verifies color tokens adapt correctly
 */
export const DarkMode: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Badge variant="default">Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
      </div>
      <div className="flex gap-2">
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </div>
      <div className="flex gap-2">
        <Badge variant="success" pulse>
          Live
        </Badge>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'padded',
  },
};

/**
 * Pulse animation story - Demonstrates live indicator behavior
 */
export const LiveIndicators: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant="success" pulse className="gap-1">
          <span className="h-2 w-2 rounded-full bg-success" />
          Live
        </Badge>
        <span className="text-sm text-muted-foreground">Server streaming data</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="warning" pulse className="gap-1">
          <span className="h-2 w-2 rounded-full bg-warning" />
          Syncing
        </Badge>
        <span className="text-sm text-muted-foreground">Configuration in progress</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="error" className="gap-1">
          <span className="h-2 w-2 rounded-full bg-error" />
          Error
        </Badge>
        <span className="text-sm text-muted-foreground">No pulse (non-recoverable error)</span>
      </div>
    </div>
  ),
};

/**
 * Accessibility story - Demonstrates proper status communication
 */
export const AccessibilityBestPractices: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">✓ Correct: Color + Icon + Text</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-success" />
              Online
            </Badge>
            <span className="text-xs text-muted-foreground">Uses all three indicators</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="error" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-error" />
              Offline
            </Badge>
            <span className="text-xs text-muted-foreground">Color-blind accessible</span>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">✗ Incorrect: Color Only</h3>
        <div className="space-y-2">
          <Badge variant="success">Status indicator</Badge>
          <span className="text-xs text-muted-foreground block">
            Without icon/text, color-blind users cannot determine status
          </span>
        </div>
      </div>
    </div>
  ),
};
