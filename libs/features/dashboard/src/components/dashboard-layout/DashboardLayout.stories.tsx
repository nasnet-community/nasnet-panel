/**
 * DashboardLayout Storybook Stories
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Stories demonstrate:
 * - Responsive layouts at all breakpoints (Mobile 375px, Tablet 768px, Desktop 1440px)
 * - Grid column calculations
 * - Refresh interaction
 * - Multiple cards in grid
 *
 * @see Story 4.2: shadcn/ui Design System for Card component usage
 */

import { fn } from 'storybook/test';

import { Card } from '@nasnet/ui/primitives';

import { DashboardLayout } from './DashboardLayout';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Features/Dashboard/DashboardLayout',
  component: DashboardLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Responsive dashboard grid layout that adapts to mobile, tablet, and desktop viewports.

**Platform Layouts:**
- **Mobile (<640px):** Single column, full-width cards
- **Tablet (640-1024px):** 2-column grid, collapsible sidebar
- **Desktop (>1024px):** 3-column grid, fixed sidebar (240px)

**Design Tokens:**
- Uses semantic spacing tokens (4px base scale)
- Responsive gap: mobile 16px, tablet 24px, desktop 32px
- Touch targets: 48px × 48px (WCAG AAA)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: 'Dashboard widgets/cards to render in grid',
      control: false,
    },
    onRefresh: {
      description: 'Callback when refresh button is clicked',
      action: 'refreshed',
    },
    showRefresh: {
      description: 'Show refresh button',
      control: 'boolean',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
  args: {
    onRefresh: fn(),
    showRefresh: true,
  },
} satisfies Meta<typeof DashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mock dashboard card component for stories
 */
const MockCard = ({ title, height = 'h-64' }: { title: string; height?: string }) => (
  <Card className={`${height} p-6 flex flex-col`}>
    <h3 className="text-lg font-semibold text-foreground mb-component-sm">{title}</h3>
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      Card content area
    </div>
  </Card>
);

// ============================================================================
// DEFAULT STORY - Desktop with Multiple Cards
// ============================================================================

export const Default: Story = {
  args: {
    children: (
      <>
        <MockCard title="Router Health Summary" height="h-80" />
        <MockCard title="Network Status" height="h-64" />
        <MockCard title="Recent Alerts" height="h-64" />
        <MockCard title="Traffic Statistics" height="h-80" />
        <MockCard title="Active Connections" height="h-64" />
        <MockCard title="System Resources" height="h-64" />
      </>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Default desktop layout with 3-column grid showing multiple dashboard cards.',
      },
    },
  },
};

// ============================================================================
// MOBILE VIEWPORT - 375px
// ============================================================================

export const MobileViewport: Story = {
  args: {
    children: (
      <>
        <MockCard title="Router Health Summary" height="h-64" />
        <MockCard title="Network Status" height="h-48" />
        <MockCard title="Recent Alerts" height="h-56" />
        <MockCard title="Traffic Statistics" height="h-64" />
      </>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    chromatic: {
      viewports: [375],
    },
    docs: {
      description: {
        story: `
Mobile layout (375px) with:
- Single column grid
- Full-width cards
- 44px touch targets
- Bottom tab bar (handled by AppShell)
        `,
      },
    },
  },
};

// ============================================================================
// TABLET VIEWPORT - 768px
// ============================================================================

export const TabletViewport: Story = {
  args: {
    children: (
      <>
        <MockCard title="Router Health Summary" height="h-72" />
        <MockCard title="Network Status" height="h-64" />
        <MockCard title="Recent Alerts" height="h-64" />
        <MockCard title="Traffic Statistics" height="h-72" />
        <MockCard title="Active Connections" height="h-64" />
        <MockCard title="System Resources" height="h-64" />
      </>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    chromatic: {
      viewports: [768],
    },
    docs: {
      description: {
        story: `
Tablet layout (768px) with:
- 2-column grid
- Collapsible sidebar
- Medium density
        `,
      },
    },
  },
};

// ============================================================================
// DESKTOP VIEWPORT - 1440px
// ============================================================================

export const DesktopViewport: Story = {
  args: {
    children: (
      <>
        <MockCard title="Router Health Summary" height="h-80" />
        <MockCard title="Network Status" height="h-64" />
        <MockCard title="Recent Alerts" height="h-64" />
        <MockCard title="Traffic Statistics" height="h-80" />
        <MockCard title="Active Connections" height="h-64" />
        <MockCard title="System Resources" height="h-64" />
        <MockCard title="Firewall Rules" height="h-72" />
        <MockCard title="VPN Status" height="h-72" />
        <MockCard title="Wireless Clients" height="h-72" />
      </>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    chromatic: {
      viewports: [1440],
    },
    docs: {
      description: {
        story: `
Desktop layout (1440px) with:
- 3-column grid
- Fixed sidebar (240px)
- Pro-grade density
- Data tables supported
        `,
      },
    },
  },
};

// ============================================================================
// NO REFRESH BUTTON
// ============================================================================

export const NoRefreshButton: Story = {
  args: {
    showRefresh: false,
    children: (
      <>
        <MockCard title="Router Health Summary" height="h-80" />
        <MockCard title="Network Status" height="h-64" />
        <MockCard title="Recent Alerts" height="h-64" />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard without refresh button (showRefresh=false).',
      },
    },
  },
};

// ============================================================================
// SINGLE CARD
// ============================================================================

export const SingleCard: Story = {
  args: {
    children: <MockCard title="Router Health Summary" height="h-96" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with a single card - demonstrates minimum viable layout.',
      },
    },
  },
};

// ============================================================================
// EMPTY STATE
// ============================================================================

export const EmptyState: Story = {
  args: {
    children: (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground space-y-2">
          <p className="text-lg font-medium">No data to display</p>
          <p className="text-sm">Add a router to see dashboard metrics</p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty dashboard state when no routers are configured.',
      },
    },
  },
};

// ============================================================================
// LOADING SKELETON STATE
// ============================================================================

export const LoadingSkeleton: Story = {
  args: {
    children: (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-64 p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="space-y-2 pt-component-md">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          </Card>
        ))}
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton state while fetching dashboard data.',
      },
    },
  },
};

// ============================================================================
// WITH CUSTOM SPACING
// ============================================================================

export const CustomSpacing: Story = {
  args: {
    className: 'bg-background',
    children: (
      <>
        <MockCard title="Card 1" />
        <MockCard title="Card 2" />
        <MockCard title="Card 3" />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with custom className for background styling.',
      },
    },
  },
};
