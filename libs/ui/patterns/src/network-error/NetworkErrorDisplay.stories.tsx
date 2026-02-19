/**
 * NetworkErrorDisplay Stories
 *
 * Demonstrates the network-specific error display with auto-retry indicators,
 * troubleshooting tips, and both default and compact variants.
 *
 * Note: NetworkErrorDisplay internally uses the `useNetworkStatus` hook from
 * OfflineIndicator (reads `navigator.onLine`). In a Storybook environment the
 * browser is always online, so the "back online" success state is demonstrated
 * via the `type="offline"` story which renders the restored-connection UI when
 * the browser reports online=true.
 */

import { NetworkErrorDisplay } from './NetworkErrorDisplay';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkErrorDisplay> = {
  title: 'Patterns/Error/NetworkErrorDisplay',
  component: NetworkErrorDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Specialised error card for network and connectivity failures. ' +
          'Extends the standard ErrorCard with auto-retry countdown display, ' +
          'attempt tracking (e.g. 2/5), expandable troubleshooting tips, ' +
          'and a "connection restored" success state when the browser comes ' +
          'back online. Supports default and compact variants.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['offline', 'timeout', 'connection-refused', 'dns-failed', 'server-error', 'unknown'],
    },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkErrorDisplay>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Basic unknown network error with a manual retry button.
 */
export const Default: Story = {
  args: {
    type: 'unknown',
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Device offline — shown when `navigator.onLine` is false. In this Storybook
 * environment the browser reports online=true, so the card will display the
 * "Connection restored" success state to demonstrate that UI path.
 */
export const DeviceOffline: Story = {
  args: {
    type: 'offline',
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Connection timed out — common when the router is under heavy load or the
 * network path has high latency.
 */
export const Timeout: Story = {
  args: {
    type: 'timeout',
    errorCode: 'N408',
    technicalMessage: 'Request timed out after 30 000 ms — POST /api/v1/graphql',
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Connection refused — the router host is reachable but the API port is not
 * accepting connections.
 */
export const ConnectionRefused: Story = {
  args: {
    type: 'connection-refused',
    errorCode: 'N200',
    technicalMessage: 'ECONNREFUSED 192.168.88.1:8728',
    showTroubleshooting: true,
    onRetry: () => console.log('Retry clicked'),
    onOpenSettings: () => console.log('Network settings clicked'),
  },
};

/**
 * Auto-retry in progress — shows spinner, attempt counter, and countdown.
 * The retry button is disabled while retrying is active.
 */
export const AutoRetrying: Story = {
  args: {
    type: 'timeout',
    isRetrying: true,
    retryAttempt: 2,
    maxRetries: 5,
    nextRetryIn: 4,
    onRetry: () => console.log('Manual retry override clicked'),
  },
};

/**
 * Compact variant — fits inside sidebars, notification bars, or inline areas.
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    type: 'connection-refused',
    isRetrying: false,
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Compact variant with auto-retry countdown.
 */
export const CompactRetrying: Story = {
  args: {
    variant: 'compact',
    type: 'timeout',
    isRetrying: true,
    nextRetryIn: 7,
  },
};
