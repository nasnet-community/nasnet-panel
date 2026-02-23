/**
 * ServicePortsPage Storybook Stories
 *
 * Interactive stories for the Service Ports page domain component.
 * Demonstrates tab navigation between the Services and Groups views,
 * context-aware action buttons, empty states, and dialog integration.
 *
 * @module @nasnet/features/firewall/pages
 */

import { ServicePortsPage } from './ServicePortsPage';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * ServicePortsPage — service ports and service groups management
 *
 * Main page for managing firewall service port definitions used in filter,
 * NAT, and mangle rules. Provides:
 *
 * - **Services tab**: Combined list of built-in RouterOS services (HTTP,
 *   HTTPS, DNS, SSH, etc.) and user-created custom services. Rendered by
 *   `ServicePortsTable`.
 * - **Groups tab**: User-defined service groups that bundle multiple ports
 *   into a single reusable matcher. Empty state is shown when no groups
 *   exist; a placeholder card appears when groups are present (full table
 *   is a future milestone).
 * - **Context-aware action button**: Shows "Add Service" on the Services
 *   tab and "Create Group" on the Groups tab.
 * - **Dialogs**: `AddServiceDialog` and `ServiceGroupDialog` are mounted
 *   at page level and controlled via boolean state.
 *
 * ## Data flow
 *
 * `useCustomServices` (from `@nasnet/features/firewall/hooks`) fetches
 * user-defined services and service groups from the backend.
 * Built-in services are rendered from a static constant list inside
 * `ServicePortsTable`.
 */
const meta: Meta<typeof ServicePortsPage> = {
  title: 'Pages/Firewall/ServicePortsPage',
  component: ServicePortsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Service Ports management page (NAS-7.8). Tab navigation between ' +
          'Services (built-in + custom) and Groups views. The page-level action ' +
          'button changes contextually: "Add Service" on the Services tab, ' +
          '"Create Group" on the Groups tab. Both add/edit dialogs are mounted ' +
          'at this level to avoid portal issues with nested modals.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServicePortsPage>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default — Services Tab
 *
 * The page opens on the Services tab by default. The full list of built-in
 * RouterOS services is displayed alongside any custom services stored in the
 * backend. The "Add Service" button is shown in the header.
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default view: Services tab active with built-in services list. ' +
          '"Add Service" action button visible in the tab header. The actual ' +
          'service rows depend on the MSW / Apollo mock environment.',
      },
    },
  },
};

/**
 * Groups Tab — Empty State
 *
 * The Groups tab is active and no service groups have been created yet.
 * The dashed-border empty-state card is shown with a "Create Group" CTA.
 * The page-level action button also switches to "Create Group".
 */
export const GroupsTabEmpty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Groups tab with empty state. No service groups defined yet. ' +
          'A dashed-border card guides the user to create their first group. ' +
          'Both the in-card button and the page-level header button open ' +
          'ServiceGroupDialog.',
      },
    },
    mockData: {
      activeTab: 'groups',
      serviceGroups: [],
    },
  },
};

/**
 * Groups Tab — With Groups
 *
 * The Groups tab is active and service groups exist in the store. The
 * placeholder "coming soon" card is shown with the group count, indicating
 * the full groups table is a future scope item.
 */
export const GroupsTabWithGroups: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Groups tab with existing service groups. The placeholder card ' +
          'shows the group count (3 groups defined) and notes the full table ' +
          'view is forthcoming. The "Create Group" button remains available.',
      },
    },
    mockData: {
      activeTab: 'groups',
      serviceGroups: [
        { id: 'grp-1', name: 'Web Services', ports: ['80', '443', '8080'] },
        { id: 'grp-2', name: 'Mail Services', ports: ['25', '143', '587', '993'] },
        { id: 'grp-3', name: 'Management', ports: ['22', '8291', '8728', '8729'] },
      ],
    },
  },
};

/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). Tab triggers stack cleanly; the action button
 * remains full-width below the tab list on smaller screens.
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile view (<640px). Tab list and action button adjust to ' +
          'touch-friendly sizing (44px min-height). ServicePortsTable switches ' +
          'to its card-based mobile presenter.',
      },
    },
  },
};
