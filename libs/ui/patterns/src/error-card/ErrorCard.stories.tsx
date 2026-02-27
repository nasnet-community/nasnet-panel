/**
 * ErrorCard Stories
 *
 * Demonstrates all variants, error types, and interactive states of the
 * inline ErrorCard component used throughout the application.
 */

import { ErrorCard } from './ErrorCard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ErrorCard> = {
  title: 'Patterns/Error/ErrorCard',
  component: ErrorCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Inline error display with retry action and expandable technical details. ' +
          'Supports three variants (default, compact, minimal), five error type styles ' +
          '(error, warning, network, auth, not-found), and optional secondary actions ' +
          'and issue-reporting. Use this for per-section or per-widget error states.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['error', 'warning', 'network', 'auth', 'not-found'],
      description: 'Controls icon and color scheme',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'minimal'],
      description: 'Display density',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorCard>;

// ---------------------------------------------------------------------------
// Stories — Variants
// ---------------------------------------------------------------------------

/**
 * Default card with retry and report actions.
 */
export const Default: Story = {
  args: {
    type: 'error',
    title: 'Failed to load router configuration',
    description:
      'There was a problem retrieving the configuration from the router. The data shown may be stale.',
    errorCode: 'R100',
    technicalMessage: 'GET /api/v1/config: 503 Service Unavailable',
    onRetry: () => console.log('Retry clicked'),
    onReport: () => console.log('Report clicked'),
  },
};

/**
 * Compact variant — suitable for sidebars, toolbars, and list items.
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    type: 'error',
    title: 'Sync failed',
    description: 'Router is unreachable at 192.168.88.1',
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Minimal single-line variant for inline use inside cards or tables.
 */
export const Minimal: Story = {
  args: {
    variant: 'minimal',
    type: 'error',
    title: 'Update failed — click to retry',
    onRetry: () => console.log('Retry clicked'),
  },
};

// ---------------------------------------------------------------------------
// Stories — Error Types
// ---------------------------------------------------------------------------

/**
 * Warning type — for degraded states that are not full failures.
 */
export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Configuration drift detected',
    description:
      'The running config differs from the last saved config. Changes may have been applied outside this app.',
    onRetry: () => console.log('Refresh clicked'),
    onSecondaryAction: () => console.log('Reconcile clicked'),
    secondaryActionLabel: 'Reconcile',
  },
};

/**
 * Network type — for connectivity failures reaching the router.
 */
export const NetworkError: Story = {
  args: {
    type: 'network',
    title: 'Connection lost',
    description: 'Unable to reach the router at 192.168.88.1. Check your network connection.',
    errorCode: 'N300',
    technicalMessage: 'ECONNREFUSED 192.168.88.1:8728',
    onRetry: () => console.log('Reconnect clicked'),
  },
};

/**
 * Auth type — for authentication or authorization failures.
 */
export const AuthError: Story = {
  args: {
    type: 'auth',
    title: 'Session expired',
    description: 'Your session has timed out. Please log in again to continue.',
    errorCode: 'A401',
    onRetry: () => console.log('Login clicked'),
    onSecondaryAction: () => console.log('Cancel clicked'),
    secondaryActionLabel: 'Cancel',
  },
};

/**
 * Not-found type — for missing resources such as a deleted rule or lease.
 */
export const NotFound: Story = {
  args: {
    type: 'not-found',
    title: 'Resource not found',
    description:
      'The requested firewall rule no longer exists. It may have been deleted by another administrator.',
    errorCode: 'R404',
    onSecondaryAction: () => console.log('Back clicked'),
    secondaryActionLabel: 'Back to list',
  },
};

/**
 * Full-featured default card with all optional props populated.
 */
export const FullFeatured: Story = {
  args: {
    type: 'network',
    title: 'Router unreachable',
    description:
      'The router at 192.168.88.1 cannot be reached. This may be due to a network interruption or the router being offline.',
    errorCode: 'N300',
    technicalMessage:
      'Error: connect ECONNREFUSED 192.168.88.1:8728\n  at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1494:16)',
    stackTrace:
      'Error: connect ECONNREFUSED 192.168.88.1:8728\n    at Object.exports.createConnection (/app/lib/net.js:49:10)\n    at RouterClient.connect (/app/router-client.js:127:12)',
    onRetry: () => console.log('Retry clicked'),
    onSecondaryAction: () => console.log('Settings clicked'),
    secondaryActionLabel: 'Network Settings',
    onReport: () => console.log('Report clicked'),
    autoFocus: false,
  },
};
