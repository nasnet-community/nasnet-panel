/**
 * Stories for Breadcrumb component
 *
 * The real Breadcrumb derives its segments automatically from TanStack Router's
 * `useMatches()` hook, which is unavailable in Storybook. This file uses a
 * MockBreadcrumb that accepts explicit segments as props so every story is
 * self-contained and runnable without a router context.
 */

import * as React from 'react';

import { ChevronRight, Home } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// MockBreadcrumb – mirrors the real component's visual output without any
// router or platform-detection dependency
// ---------------------------------------------------------------------------

interface BreadcrumbSegment {
  key: string;
  label: string;
  path: string;
  isCurrent: boolean;
}

interface MockBreadcrumbProps {
  /** Array of breadcrumb segments to render */
  segments: BreadcrumbSegment[];
  /** Show home icon for first segment */
  showHomeIcon?: boolean;
  /** Compact/mobile presentation: collapse middle segments */
  compact?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

function MockBreadcrumb({
  segments,
  showHomeIcon = true,
  compact = false,
  className,
}: MockBreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false);

  const MAX_VISIBLE = 2;
  const shouldCollapse = compact && segments.length > MAX_VISIBLE && !expanded;

  const visibleSegments = shouldCollapse
    ? [segments[0], segments[segments.length - 1]]
    : segments;

  const hiddenCount = shouldCollapse ? segments.length - 2 : 0;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {visibleSegments.map((segment, index) => (
          <React.Fragment key={segment.key}>
            {/* Ellipsis button for collapsed mobile view */}
            {compact && shouldCollapse && index === 1 && hiddenCount > 0 && (
              <>
                <ChevronRight className="mx-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <li>
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Show ${hiddenCount} more items`}
                  >
                    •••
                  </button>
                </li>
              </>
            )}

            {/* Normal separator */}
            {index > 0 && !(compact && shouldCollapse && index === 1) && (
              <ChevronRight
                className="mx-1 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}

            {/* Segment */}
            <li className="flex items-center">
              {segment.isCurrent ? (
                <span aria-current="page" className="font-medium text-foreground truncate max-w-[160px]">
                  {showHomeIcon && index === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{segment.label}</span>
                    </span>
                  ) : (
                    segment.label
                  )}
                </span>
              ) : (
                <a
                  href={segment.path}
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1 -mx-1 truncate max-w-[160px]"
                >
                  {showHomeIcon && index === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{segment.label}</span>
                    </span>
                  ) : (
                    segment.label
                  )}
                </a>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof MockBreadcrumb> = {
  title: 'Patterns/Breadcrumb',
  component: MockBreadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Auto-generated navigation breadcrumb that reads the current route hierarchy from TanStack Router. Switches between a full desktop presenter (all segments visible) and a compact mobile presenter (first + last segment with an expandable ellipsis for deep paths). Uses `usePlatform()` for automatic switching.',
      },
    },
  },
  argTypes: {
    showHomeIcon: {
      control: 'boolean',
      description: 'Replace the first segment label with a Home icon',
    },
    compact: {
      control: 'boolean',
      description: 'Enable mobile compact mode (collapses middle segments)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockBreadcrumb>;

// ---------------------------------------------------------------------------
// Shared segment datasets
// ---------------------------------------------------------------------------

const twoLevelSegments: BreadcrumbSegment[] = [
  { key: '__root__', label: 'Home', path: '/', isCurrent: false },
  { key: '/network', label: 'Network', path: '/network', isCurrent: true },
];

const threeLevelSegments: BreadcrumbSegment[] = [
  { key: '__root__', label: 'Home', path: '/', isCurrent: false },
  { key: '/network', label: 'Network', path: '/network', isCurrent: false },
  { key: '/network/interfaces', label: 'Interfaces', path: '/network/interfaces', isCurrent: true },
];

const deepSegments: BreadcrumbSegment[] = [
  { key: '__root__', label: 'Home', path: '/', isCurrent: false },
  { key: '/firewall', label: 'Firewall', path: '/firewall', isCurrent: false },
  { key: '/firewall/filter', label: 'Filter Rules', path: '/firewall/filter', isCurrent: false },
  { key: '/firewall/filter/edit', label: 'Edit Rule #42', path: '/firewall/filter/edit', isCurrent: true },
];

const routerDetailSegments: BreadcrumbSegment[] = [
  { key: '__root__', label: 'Home', path: '/', isCurrent: false },
  { key: '/routers', label: 'Routers', path: '/routers', isCurrent: false },
  { key: '/routers/r-1', label: 'MikroTik-Home', path: '/routers/r-1', isCurrent: false },
  { key: '/routers/r-1/vpn', label: 'VPN', path: '/routers/r-1/vpn', isCurrent: true },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Desktop – Two Levels',
  args: {
    segments: twoLevelSegments,
    showHomeIcon: true,
    compact: false,
  },
};

export const ThreeLevels: Story = {
  name: 'Desktop – Three Levels',
  args: {
    segments: threeLevelSegments,
    showHomeIcon: true,
    compact: false,
  },
};

export const DeepPath: Story = {
  name: 'Desktop – Four Levels (Deep Path)',
  args: {
    segments: deepSegments,
    showHomeIcon: true,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop presenter renders all four segments in a horizontal row separated by chevrons.',
      },
    },
  },
};

export const WithoutHomeIcon: Story = {
  name: 'Without Home Icon',
  args: {
    segments: threeLevelSegments,
    showHomeIcon: false,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When `showHomeIcon` is false the first segment is rendered as a text link instead of a house icon.',
      },
    },
  },
};

export const MobileCompactCollapsed: Story = {
  name: 'Mobile – Collapsed (Deep Path)',
  args: {
    segments: routerDetailSegments,
    showHomeIcon: true,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `compact` is true and there are more than two segments the middle items are hidden behind an ellipsis button. Clicking the button expands the full path.',
      },
    },
  },
};

export const MobileShortPath: Story = {
  name: 'Mobile – Short Path (No Collapse)',
  args: {
    segments: twoLevelSegments,
    showHomeIcon: true,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When there are only two segments compact mode shows both without an ellipsis.',
      },
    },
  },
};
