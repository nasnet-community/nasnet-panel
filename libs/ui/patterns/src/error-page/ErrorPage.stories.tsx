/**
 * ErrorPage Stories
 *
 * Demonstrates all variants of the full-page error display component,
 * covering generic errors, 404, 403, server crashes, and network failures.
 */

import { ErrorPage } from './ErrorPage';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ErrorPage> = {
  title: 'Patterns/Error/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-page error display for critical failures requiring user attention. ' +
          'Supports five variants: error, network, unauthorized, not-found, and server-error. ' +
          'Each variant ships with contextual default messaging, icon, and color scheme. ' +
          'All content is customisable via props. Use inside a route-level error boundary ' +
          'or as a standalone route component (e.g. a 404 page).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['error', 'network', 'unauthorized', 'not-found', 'server-error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorPage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Generic unexpected error — the default variant shown when no specific type
 * is known.
 */
export const Default: Story = {
  args: {
    variant: 'error',
    onRetry: () => console.log('Retry clicked'),
    showHomeButton: true,
  },
};

/**
 * 404 Not Found — shown when navigating to a page or resource that no longer
 * exists.
 */
export const NotFound: Story = {
  args: {
    variant: 'not-found',
    statusCode: 404,
    showHomeButton: true,
    showBackButton: true,
  },
};

/**
 * 403 Unauthorized — shown when the user lacks permission to access a page
 * or feature.
 */
export const Unauthorized: Story = {
  args: {
    variant: 'unauthorized',
    statusCode: 403,
    showHomeButton: true,
    showBackButton: false,
  },
};

/**
 * 500 Server Error — shown when the backend encountered an unhandled error.
 */
export const ServerError: Story = {
  args: {
    variant: 'server-error',
    statusCode: 500,
    errorCode: 'S600',
    technicalMessage: 'pq: relation "router_configs" does not exist',
    onRetry: () => console.log('Retry clicked'),
    onReport: () => console.log('Report clicked'),
    showHomeButton: true,
  },
};

/**
 * Network connectivity failure — used when the frontend cannot reach the
 * backend or router.
 */
export const NetworkError: Story = {
  args: {
    variant: 'network',
    errorCode: 'N300',
    technicalMessage: 'ECONNREFUSED 192.168.88.1:8728',
    retryLabel: 'Reconnect',
    onRetry: () => console.log('Reconnect clicked'),
    showHomeButton: false,
  },
};

/**
 * Custom title and description override the variant defaults, showing how
 * the component adapts to application-specific error messages.
 */
export const CustomMessage: Story = {
  args: {
    variant: 'error',
    title: 'Router backup failed',
    description:
      'The configuration backup could not be written to disk. The storage volume may be full or read-only.',
    errorCode: 'B201',
    technicalMessage: "ENOSPC: no space left on device, write '/var/backups/router-config.json'",
    retryLabel: 'Retry Backup',
    onRetry: () => console.log('Retry backup clicked'),
    onReport: () => console.log('Report clicked'),
    showHomeButton: true,
    showBackButton: true,
  },
};

/**
 * With children — arbitrary content (e.g. a quick-link list) rendered below
 * the main error block.
 */
export const WithChildren: Story = {
  args: {
    variant: 'not-found',
    statusCode: 404,
    showHomeButton: true,
    showBackButton: true,
  },
  render: (args) => (
    <ErrorPage {...args}>
      <div className="mx-auto max-w-xs text-left">
        <p className="text-muted-foreground mb-2 text-sm font-medium">You might be looking for:</p>
        <ul className="text-primary space-y-1 text-sm underline-offset-4">
          <li>
            <a
              href="/dashboard"
              className="hover:underline"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/firewall"
              className="hover:underline"
            >
              Firewall Rules
            </a>
          </li>
          <li>
            <a
              href="/network"
              className="hover:underline"
            >
              Network Interfaces
            </a>
          </li>
        </ul>
      </div>
    </ErrorPage>
  ),
};
