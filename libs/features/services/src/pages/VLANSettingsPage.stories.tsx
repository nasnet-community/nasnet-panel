/**
 * Storybook stories for VLANSettingsPage
 *
 * VLAN Settings management page with three tabs:
 * - Pool Config: Configure VLAN pool range
 * - Allocations: View and filter VLAN allocations
 * - Diagnostics: Orphan detection and cleanup tools
 *
 * The page is platform-aware: Desktop renders a sidebar gauge + tabbed
 * content area; Mobile/Tablet stacks the gauge above the tabs.
 *
 * Individual sub-components (VLANPoolGauge, VLANAllocationTable,
 * VLANPoolConfig) are tested in their own story files.
 */

import { VLANSettingsPage } from './VLANSettingsPage';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof VLANSettingsPage> = {
  title: 'Pages/Services/VLANSettingsPage',
  component: VLANSettingsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VLAN Settings page (Layer 3 Domain component). ' +
          'Displays a real-time pool utilisation gauge alongside three tabs: ' +
          'Pool Config (set pool range), Allocations (browse current VLAN allocations ' +
          'with filter/sort), and Diagnostics (orphan detection and bulk cleanup). ' +
          'Desktop layout uses a fixed 320px sidebar for the gauge; mobile and tablet ' +
          'use a stacked single-column layout. ' +
          'All data is fetched via GraphQL hooks (useVLANPoolStatus, useVLANAllocations, ' +
          'useCleanupOrphanedVLANs).',
      },
    },
  },
  argTypes: {
    routerID: {
      description: 'Router ID used to scope all VLAN queries and mutations',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VLANSettingsPage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default — Desktop layout with a typical router ID.
 *
 * Renders the sidebar gauge and Pool Config tab by default.
 * The actual gauge and table content depends on the MSW / Apollo mock
 * setup in the Storybook environment.
 */
export const Default: Story = {
  args: {
    routerID: 'router-001',
  },
};

/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px) collapses the desktop sidebar.
 * The gauge is rendered above the tabs in a stacked layout.
 * Tab labels are abbreviated (Config / Allocs / Tools) to fit the screen.
 */
export const MobileViewport: Story = {
  args: {
    routerID: 'router-001',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile breakpoint (<640px). Gauge stacks above the tabs; ' +
          'tab triggers use short labels; action buttons are full-width with 44px min-height.',
      },
    },
  },
};

/**
 * Tablet Viewport
 *
 * Mid-range viewport (640–1024px) uses the mobile/tablet stacked layout
 * (same as mobile) since the component branches only on desktop.
 */
export const TabletViewport: Story = {
  args: {
    routerID: 'router-002',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Tablet breakpoint (640–1024px). Uses the same stacked layout as ' +
          'mobile; the page fills available width without a fixed sidebar.',
      },
    },
  },
};

/**
 * Desktop Viewport
 *
 * Wide viewport (>1024px) activates the sidebar-plus-content layout.
 * The 320px gauge sidebar is fixed on the left; tabs occupy the remaining space.
 */
export const DesktopViewport: Story = {
  args: {
    routerID: 'router-001',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop breakpoint (>1024px). Renders the 320px fixed gauge sidebar ' +
          'alongside the tabbed content area. Tab labels show full text: ' +
          'Pool Config / Allocations / Diagnostics.',
      },
    },
  },
};
