/**
 * WANManagementPage Storybook Stories
 *
 * Page-level stories for the WAN Management page (NAS-6.8).
 *
 * NOTE: WANManagementPage reads the router ID from the URL via `useParams` and subscribes
 * to real-time WAN events via `useWANSubscription`. In Storybook these dependencies require
 * global decorators (router context stub + Apollo MockedProvider). The stories below focus
 * on the distinct visual layouts and tab states that the page can present.
 *
 * For interactive E2E testing see the Playwright test suite.
 */

import { WANManagementPage } from './WANManagementPage';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data mirrors the built-in mockWANs constant inside WANManagementPage
// so each story description accurately describes what is rendered.
// ---------------------------------------------------------------------------

const meta: Meta<typeof WANManagementPage> = {
  title: 'Pages/Network/WANManagementPage',
  component: WANManagementPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main WAN Management page (NAS-6.8) – configure and monitor all WAN connections
for a MikroTik router.

## Layout
The page is split into three tabs:

| Tab | Icon | Content |
|-----|------|---------|
| **Overview** | Globe | \`WANOverviewList\` – cards for every WAN interface with status, IP, health |
| **Health Monitoring** | Activity | Placeholder for per-interface health-check configuration |
| **Connection History** | History | \`ConnectionHistoryTable\` – paginated event log with 50 generated mock entries |

## Built-in Mock Data (Development)
While the GraphQL layer is being implemented the page ships with two inline mock WANs:

| Interface | Type | Status | Default Route |
|-----------|------|--------|---------------|
| \`pppoe-wan\` | PPPoE | CONNECTED (healthy, 12 ms) | Yes |
| \`ether1\` | DHCP | DISCONNECTED | No |

## Real-time Updates
\`useWANSubscription\` patches the local WAN list whenever the backend pushes a
\`WANStatusChanged\` or \`WANHealthChanged\` event. It is automatically skipped when
no \`routerId\` is available (e.g., in Storybook without a router stub).

## Configuration Dialog
Clicking "Add WAN" or "Configure" on an existing card opens a \`<Dialog>\` that lets
the operator select a connection type (DHCP, PPPoE, Static IP, LTE, Health Check)
and then renders the appropriate sub-form.
      `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WANManagementPage>;

/**
 * Default – page mounted as the router would render it. Because `useParams` is
 * called with `strict: false` the page silently falls back to an undefined
 * routerId in Storybook and skips the WAN subscription.
 *
 * The Overview tab is active; both built-in mock WANs (PPPoE connected +
 * DHCP disconnected) are displayed via the WANOverviewList component.
 */
export const Default: Story = {
  args: {},
};

/**
 * OverviewTab – default view showing the WAN overview list. Identical to
 * Default but documents the tab content explicitly.
 */
export const OverviewTab: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'The Overview tab is selected by default. WANOverviewList renders one card ' +
          'for each WAN interface in the local state (two mock entries during development: ' +
          'a connected PPPoE WAN and a disconnected DHCP WAN).',
      },
    },
  },
};

/**
 * MobileViewport – full page at 375 px. WANOverviewList switches to its compact
 * card layout and the Add WAN button is still accessible.
 */
export const MobileViewport: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'At 375 px viewport width the page header stacks vertically, the tab list ' +
          'scrolls horizontally, and WANOverviewList renders WANCardCompact rows instead ' +
          'of the full card layout used on desktop.',
      },
    },
  },
};

/**
 * TabletViewport – intermediate 768 px viewport.
 */
export const TabletViewport: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story:
          'At 768 px the page uses a hybrid layout – collapsible sidebar on the parent ' +
          'shell, full-width tab panel, and standard WANCard grid inside WANOverviewList.',
      },
    },
  },
};
