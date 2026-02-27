/**
 * Storybook stories for DashboardPage
 *
 * Main landing page after login. Renders router health summary cards,
 * resource utilisation gauges, and the recent-logs widget for every
 * configured router. Epic 5 — Story 5.1.
 *
 * Because DashboardPage owns its own internal state and composes several
 * data-fetching sub-components (RouterHealthSummaryCard, ResourceGauges,
 * RecentLogs), these stories demonstrate the page shell at the layout level.
 * Individual sub-components are tested in their own story files.
 */

import { DashboardPage } from './DashboardPage';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DashboardPage> = {
  title: 'Features/Dashboard/DashboardPage',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    /**
     * Use fullscreen layout so the dashboard fills the viewport as it does
     * in the real application shell.
     */
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main dashboard page (Epic 5, Story 5.1). ' +
          'Displays router health summary cards, resource utilisation gauges ' +
          '(CPU / memory / storage), and a recent system-log stream for each ' +
          'configured router. ' +
          'Supports manual refresh, GraphQL subscriptions with a 10-second ' +
          'polling fallback, and an empty-state when no routers are present. ' +
          'The responsive grid adjusts from 1 column on mobile to 3 columns ' +
          'on wide desktop displays.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default render with the three hard-coded mock router IDs.
 * Each section fires its own GraphQL query/subscription so the actual
 * content depends on the MSW/Apollo mock setup in the Storybook environment.
 */
export const Default: Story = {};

/**
 * Demonstrates the full-page layout in a narrow viewport to verify
 * mobile-first single-column stacking.
 * Resize the Canvas panel to <640px to activate the mobile layout.
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Render at mobile breakpoint (<640px). ' +
          'Sub-components switch to their Mobile platform presenter variants.',
      },
    },
  },
};

/**
 * Tablet viewport (640–1024px) — two-column grid, collapsible sidebar.
 */
export const TabletViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Render at tablet breakpoint (640–1024px). ' +
          'Sub-components switch to their Tablet/hybrid platform presenter variants.',
      },
    },
  },
};

/**
 * Desktop viewport (>1024px) — three-column grid with dense data tables.
 */
export const DesktopViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Render at desktop breakpoint (>1024px). ' +
          'Sub-components switch to their Desktop platform presenter variants ' +
          'with higher information density.',
      },
    },
  },
};
