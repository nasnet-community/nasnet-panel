import * as React from 'react';

import { TooltipProvider } from '../tooltip';
import { DriftBadge } from './DriftBadge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DriftBadge> = {
  title: 'Primitives/DriftBadge',
  component: DriftBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Visual indicator for configuration drift status between desired state (configuration layer) and actual deployed state. Follows semantic color tokens: green for synced, amber for drifted, red for error. WCAG AAA compliant with 7:1 contrast ratios.',
      },
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['synced', 'drifted', 'error', 'pending', 'checking'],
      description: 'Current drift status',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
    },
    count: {
      control: 'number',
      description: 'Number of drifted fields (shown when status is drifted)',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Whether to show tooltip with drift summary',
    },
    interactive: {
      control: 'boolean',
      description: 'Whether the badge is clickable',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DriftBadge>;

export const Default: Story = {
  args: {
    status: 'pending',
    size: 'md',
    showTooltip: false,
  },
};

export const Synced: Story = {
  args: {
    status: 'synced',
    size: 'md',
    showTooltip: false,
  },
};

export const Drifted: Story = {
  args: {
    status: 'drifted',
    size: 'md',
    count: 3,
    showTooltip: false,
  },
};

export const DriftedWithTooltip: Story = {
  args: {
    status: 'drifted',
    size: 'md',
    count: 5,
    showTooltip: true,
    lastChecked: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    size: 'md',
    showTooltip: false,
  },
};

export const Checking: Story = {
  args: {
    status: 'checking',
    size: 'md',
    showTooltip: false,
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="synced" showTooltip={false} />
        <span className="text-xs text-muted-foreground">synced</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="drifted" count={3} showTooltip={false} />
        <span className="text-xs text-muted-foreground">drifted</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="error" showTooltip={false} />
        <span className="text-xs text-muted-foreground">error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="pending" showTooltip={false} />
        <span className="text-xs text-muted-foreground">pending</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="checking" showTooltip={false} />
        <span className="text-xs text-muted-foreground">checking</span>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="drifted" count={2} size="sm" showTooltip={false} />
        <span className="text-xs text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="drifted" count={2} size="md" showTooltip={false} />
        <span className="text-xs text-muted-foreground">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DriftBadge status="drifted" count={2} size="lg" showTooltip={false} />
        <span className="text-xs text-muted-foreground">lg</span>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: function InteractiveDriftBadge() {
    const [clicked, setClicked] = React.useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <DriftBadge
          status="drifted"
          count={3}
          interactive
          showTooltip={false}
          onClick={() => setClicked(true)}
        />
        {clicked && (
          <span className="text-sm text-muted-foreground">
            Drift resolution modal would open here.
          </span>
        )}
        {!clicked && (
          <span className="text-sm text-muted-foreground">Click the badge to trigger action</span>
        )}
      </div>
    );
  },
};

export const InTableContext: Story = {
  render: () => (
    <div className="w-[480px] rounded-lg border">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
        <span>Interface</span>
        <span>Status</span>
        <span>Drift</span>
      </div>
      {[
        { name: 'ether1 (WAN)', status: 'Up', drift: 'synced' as const },
        { name: 'ether2 (LAN)', status: 'Up', drift: 'drifted' as const, count: 2 },
        { name: 'wlan1', status: 'Up', drift: 'checking' as const },
        { name: 'ether3', status: 'Down', drift: 'error' as const },
        { name: 'bridge1', status: 'Up', drift: 'pending' as const },
      ].map((row) => (
        <div
          key={row.name}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-0"
        >
          <span className="text-sm font-mono">{row.name}</span>
          <span className={`text-sm ${row.status === 'Up' ? 'text-success' : 'text-error'}`}>
            {row.status}
          </span>
          <DriftBadge
            status={row.drift}
            count={'count' in row ? row.count : undefined}
            showTooltip={false}
          />
        </div>
      ))}
    </div>
  ),
};

export const CustomTooltip: Story = {
  args: {
    status: 'drifted',
    count: 4,
    size: 'md',
    showTooltip: true,
    tooltipContent: 'Click to review 4 configuration differences and apply changes.',
  },
};

/**
 * Mobile Viewport (375px) - Compact display for small screens
 */
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div className="flex flex-col items-center gap-4 p-4">
      <DriftBadge status="synced" size="sm" showTooltip={false} />
      <DriftBadge status="drifted" count={2} size="sm" showTooltip={false} />
      <DriftBadge status="checking" size="sm" showTooltip={false} />
    </div>
  ),
};

/**
 * Tablet Viewport (768px) - Medium-sized badge display
 */
export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <DriftBadge status="synced" size="md" showTooltip={false} />
      <DriftBadge status="drifted" count={3} size="md" showTooltip={false} />
      <DriftBadge status="error" size="md" showTooltip={false} />
    </div>
  ),
};

/**
 * Desktop Viewport (1280px) - Full-featured badge display
 */
export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
  render: () => (
    <div className="flex items-center gap-8 p-4">
      <DriftBadge status="synced" size="lg" showTooltip={true} lastChecked={new Date()} />
      <DriftBadge
        status="drifted"
        count={5}
        size="lg"
        showTooltip={true}
        lastChecked={new Date(Date.now() - 10 * 60 * 1000)}
      />
      <DriftBadge status="checking" size="lg" showTooltip={true} />
    </div>
  ),
};

/**
 * Interactive with Click Handler
 */
export const InteractiveWithPlayFunction: Story = {
  args: {
    status: 'drifted',
    count: 3,
    interactive: true,
    showTooltip: true,
  },
  play: async ({ canvasElement }) => {
    // Badge is already interactive, play function demonstrates it's accessible
    const badge = canvasElement.querySelector('[role="button"]') as HTMLElement;
    if (badge) {
      badge.focus();
    }
  },
};

/**
 * Keyboard Navigation Test - Tab to focus, Enter/Space to activate
 */
export const KeyboardNavigable: Story = {
  render: function KeyboardTest() {
    const [activated, setActivated] = React.useState(false);
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Press Tab to focus badge, then Enter or Space to activate (interactive mode)
        </p>
        <DriftBadge
          status="drifted"
          count={2}
          interactive
          showTooltip={true}
          lastChecked={new Date()}
          onClick={() => setActivated(!activated)}
        />
        {activated && (
          <p className="text-sm font-medium text-success">Badge activated via keyboard!</p>
        )}
      </div>
    );
  },
};
