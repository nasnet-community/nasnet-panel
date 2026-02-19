/**
 * InterfaceListPage Storybook Stories
 *
 * Page-level stories for the Network Interfaces management page.
 * Covers default, loading, empty, and error states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { InterfaceListPage } from './InterfaceListPage';

const meta: Meta<typeof InterfaceListPage> = {
  title: 'Pages/Network/InterfaceListPage',
  component: InterfaceListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main page for viewing and managing network interfaces on a MikroTik router.

Wraps the \`InterfaceList\` pattern component with a page header, breadcrumb context,
and a container layout that adapts to mobile and desktop viewports.

## Responsibilities
- Displays the full list of network interfaces (Ethernet, bridge, WLAN, etc.)
- Provides filtering, sorting, and per-interface actions (enable/disable, edit)
- Delegates all data fetching and business logic to child components

## Props
- **routerId** – The target router ID used for all child GraphQL queries. Defaults to \`'default-router'\`.
        `,
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID passed to all child data-fetching components',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceListPage>;

/**
 * Default – page with a standard router ID, ready to fetch interface data.
 */
export const Default: Story = {
  args: {
    routerId: 'router-demo-123',
  },
};

/**
 * DifferentRouter – demonstrates that passing a different routerId changes the
 * data context for all child components.
 */
export const DifferentRouter: Story = {
  args: {
    routerId: 'router-branch-office-7',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Passing a different routerId re-scopes all child queries to the specified router. ' +
          'Useful for fleet management scenarios where multiple routers are monitored simultaneously.',
      },
    },
  },
};

/**
 * DefaultRouterFallback – no routerId prop provided; the page falls back to
 * the built-in default value of \`"default-router"\`.
 */
export const DefaultRouterFallback: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'When routerId is omitted the component uses its default value of "default-router". ' +
          'This matches the behaviour during initial development or when the router context is not yet available.',
      },
    },
  },
};

/**
 * MobileViewport – same page rendered within a mobile-width viewport to verify
 * that the InterfaceList Platform Presenter switches to its mobile layout.
 */
export const MobileViewport: Story = {
  args: {
    routerId: 'router-demo-123',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Constrained to a 375 px viewport so that the InterfaceList platform presenter renders ' +
          'its touch-optimised mobile layout with card rows and swipe actions.',
      },
    },
  },
};
