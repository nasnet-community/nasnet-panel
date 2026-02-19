/**
 * Storybook stories for FirewallDetailTabs
 *
 * The FirewallDetailTabs component renders a 10-tab navigation over filter
 * rules, NAT rules, routing table, mangle, RAW, rate-limiting, address lists,
 * connections, templates and logs.
 *
 * Because this component composes several data-fetching child components
 * (FilterRulesTable, NATRulesTable, RoutingTable, etc.) these stories render
 * the tab shell in isolation using static tab-content placeholders so that
 * the tab navigation, responsive labels and active-tab indicator can be
 * reviewed without a live router connection.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FirewallDetailTabs } from './FirewallDetailTabs';

const meta: Meta<typeof FirewallDetailTabs> = {
  title: 'Features/Firewall/FirewallDetailTabs',
  component: FirewallDetailTabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tabbed navigation container for all firewall sub-sections: Filter Rules, NAT Rules, Routing Table, Mangle Rules, RAW Rules, Rate Limiting, Address Lists, Connections, Templates and Logs. Tabs collapse their labels on small screens.',
      },
    },
  },
  argTypes: {
    defaultTab: {
      control: 'select',
      options: [
        'filter',
        'nat',
        'routing',
        'mangle',
        'raw',
        'rateLimiting',
        'addressLists',
        'connections',
        'templates',
        'logs',
      ],
      description: 'Which tab is active on first render.',
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FirewallDetailTabs>;

/**
 * Starts on the Filter Rules tab (default).
 */
export const DefaultFilterTab: Story = {
  args: {
    defaultTab: 'filter',
    className: 'p-6',
  },
};

/**
 * Opens directly on the NAT Rules tab.
 */
export const NATRulesTab: Story = {
  args: {
    defaultTab: 'nat',
    className: 'p-6',
  },
};

/**
 * Opens directly on the Routing Table tab.
 */
export const RoutingTableTab: Story = {
  args: {
    defaultTab: 'routing',
    className: 'p-6',
  },
};

/**
 * Opens the RAW Rules tab — renders the "navigate elsewhere" placeholder.
 */
export const RAWRulesTab: Story = {
  args: {
    defaultTab: 'raw',
    className: 'p-6',
  },
};

/**
 * Opens the Connections tab.
 */
export const ConnectionsTab: Story = {
  args: {
    defaultTab: 'connections',
    className: 'p-6',
  },
};

/**
 * Desktop viewport — all tab labels visible.
 */
export const DesktopViewport: Story = {
  args: {
    defaultTab: 'filter',
    className: 'p-6',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: 'On desktop all tab labels (Filter Rules, NAT Rules, etc.) are fully visible.',
      },
    },
  },
};

/**
 * Mobile viewport — tab labels collapse to short abbreviations.
 */
export const MobileViewport: Story = {
  args: {
    defaultTab: 'filter',
    className: 'p-4',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    docs: {
      description: {
        story:
          'On mobile (<640px) tab labels collapse to abbreviated text (Filter, NAT, Routes, etc.).',
      },
    },
  },
};
