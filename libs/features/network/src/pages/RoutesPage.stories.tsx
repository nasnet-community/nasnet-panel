/**
 * RoutesPage Storybook Stories
 *
 * Page-level stories for the Static Route Management page.
 * Covers default state, mobile viewport, and key interaction entry-points.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RoutesPage } from './RoutesPage';

const meta: Meta<typeof RoutesPage> = {
  title: 'Pages/Network/RoutesPage',
  component: RoutesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main page for viewing and managing static routes on a MikroTik router.

## Features
- View all routes with filtering and sorting by destination, gateway, distance, and routing table
- Add new static routes via a Dialog (desktop) or bottom Sheet (mobile)
- Edit existing routes with pre-populated form values
- Delete routes with a safety confirmation dialog
- Platform-aware UI: Dialog on desktop/tablet, bottom Sheet on mobile
- Gateway reachability checking

## Platform Behaviour
The route form is rendered inside a \`<Dialog>\` on desktop/tablet and a full-height
\`<Sheet>\` on mobile. This is controlled automatically by \`usePlatform()\`.

## Props
- **routerId** – Target router ID for all GraphQL mutations and queries. Defaults to \`'default-router'\`.
      `,
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID used for route CRUD mutations',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RoutesPage>;

/**
 * Default – page mounted with a demo router ID; the RouteList fetches and
 * renders whatever routes the mock Apollo layer returns.
 */
export const Default: Story = {
  args: {
    routerId: 'router-demo-123',
  },
};

/**
 * DifferentRouter – demonstrates re-scoping the entire page to a secondary router.
 */
export const DifferentRouter: Story = {
  args: {
    routerId: 'router-branch-office-2',
  },
  parameters: {
    docs: {
      description: {
        story:
          'All route queries and mutations are scoped to the specified routerId. ' +
          'The page header, list, and form all use this value when communicating with the backend.',
      },
    },
  },
};

/**
 * DefaultRouterFallback – no routerId supplied; falls back to "default-router".
 */
export const DefaultRouterFallback: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'When the routerId prop is omitted the component defaults to "default-router". ' +
          'Covers the initial render before a router context is fully established.',
      },
    },
  },
};

/**
 * MobileViewport – renders the page at 375 px to verify the Sheet-based form
 * and touch-friendly route list layout.
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
          'On mobile the RouteList switches to a card-based layout and the route form ' +
          'opens as a bottom Sheet (90 vh, scrollable) instead of a centered Dialog.',
      },
    },
  },
};
