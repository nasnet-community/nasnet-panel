/**
 * ReconnectingOverlay Stories
 *
 * Demonstrates the overlay that appears when the WebSocket connection
 * is lost or actively being re-established. Because the real component
 * reads from the Zustand connection store, we use a self-contained mock
 * presenter so every connection state can be shown in isolation.
 */

import * as React from 'react';

import { AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react';

import { Button, Card, Progress, cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ===== Mock presenter =====
// Mirrors the real ReconnectingOverlay render tree but accepts props directly
// instead of reading them from the connection store.

interface MockOverlayProps {
  /** Simulated WS status */
  wsStatus?: 'disconnected' | 'error' | 'reconnecting';
  /** Whether auto-reconnection is in progress */
  isReconnecting?: boolean;
  /** Current reconnection attempt number */
  reconnectAttempts?: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Whether the manual-retry button is shown */
  showManualRetry?: boolean;
  /** Whether to render as a full-screen backdrop overlay */
  fullScreen?: boolean;
  /** Custom status message */
  message?: string;
  /** Whether to always show the retry button even during auto-reconnection */
  alwaysShowRetry?: boolean;
  /** Dismiss button callback (renders a Dismiss button when provided) */
  onDismiss?: () => void;
}

function MockReconnectingOverlay({
  wsStatus = 'disconnected',
  isReconnecting = false,
  reconnectAttempts = 0,
  maxReconnectAttempts = 5,
  showManualRetry = false,
  fullScreen = false,
  message,
  alwaysShowRetry = false,
  onDismiss,
}: MockOverlayProps) {
  const progress = maxReconnectAttempts > 0 ? (reconnectAttempts / maxReconnectAttempts) * 100 : 0;

  const statusMessage =
    message ??
    (isReconnecting ? 'Attempting to reconnect...'
    : showManualRetry ? 'Connection failed. Please retry manually.'
    : 'Connection lost');

  const StatusIcon =
    isReconnecting ? Loader2
    : showManualRetry ? AlertTriangle
    : WifiOff;

  const card = (
    <Card
      className={cn(
        'mx-auto max-w-sm p-6',
        'bg-card',
        'border-semantic-warning border-2',
        !fullScreen && 'w-full'
      )}
    >
      <div
        className="flex flex-col items-center space-y-4 text-center"
        aria-live="polite"
      >
        {/* Icon */}
        <div
          className={cn(
            'rounded-full p-4',
            isReconnecting ? 'bg-semantic-warning/10'
            : showManualRetry ? 'bg-semantic-error/10'
            : 'bg-muted'
          )}
        >
          <StatusIcon
            className={cn(
              'h-8 w-8',
              isReconnecting && 'text-semantic-warning animate-spin',
              showManualRetry && 'text-semantic-error',
              !isReconnecting && !showManualRetry && 'text-muted-foreground'
            )}
            aria-hidden="true"
          />
        </div>

        {/* Heading + message */}
        <div className="space-y-1">
          <h3 className="text-foreground text-lg font-semibold">
            {isReconnecting ? 'Reconnecting' : 'Disconnected'}
          </h3>
          <p className="text-muted-foreground text-sm">{statusMessage}</p>
        </div>

        {/* Progress bar */}
        {isReconnecting && (
          <div className="w-full space-y-2">
            <Progress
              value={progress}
              className="h-2"
            />
            <p
              className="text-muted-foreground text-xs"
              aria-live="polite"
            >
              Attempt {reconnectAttempts} of {maxReconnectAttempts}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {(showManualRetry || alwaysShowRetry) && (
            <Button
              variant="default"
              onClick={() => console.log('Retry clicked')}
              className="min-w-[120px]"
              aria-label="Retry connection now"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Now
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>

        {/* Help text when manual retry is shown */}
        {showManualRetry && (
          <p className="text-muted-foreground text-xs">
            Check your network connection and ensure the router is accessible.
          </p>
        )}
      </div>
    </Card>
  );

  if (!fullScreen) {
    return <div className="w-80">{card}</div>;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm'
      )}
      role="alertdialog"
      aria-modal="true"
    >
      {card}
    </div>
  );
}

// ===== Meta =====

const meta: Meta<typeof MockReconnectingOverlay> = {
  title: 'Patterns/Connection/ReconnectingOverlay',
  component: MockReconnectingOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A full-screen or inline overlay shown whenever the WebSocket connection to the router ' +
          'is lost or being re-established. It provides progress feedback during automatic ' +
          'reconnection attempts and a manual retry button once all attempts are exhausted. ' +
          'The live component reads state from the Zustand connection store; these stories use ' +
          'a mock presenter so all states are independently controllable.',
      },
    },
  },
  argTypes: {
    wsStatus: {
      control: 'select',
      options: ['disconnected', 'error', 'reconnecting'],
      description: 'Simulated WebSocket status',
    },
    isReconnecting: {
      control: 'boolean',
      description: 'Whether auto-reconnection is in progress',
    },
    reconnectAttempts: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Number of reconnection attempts made so far',
    },
    maxReconnectAttempts: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of reconnection attempts before showing manual retry',
    },
    showManualRetry: {
      control: 'boolean',
      description: 'Show the manual Retry Now button',
    },
    fullScreen: {
      control: 'boolean',
      description: 'Render as a full-screen backdrop overlay',
    },
    alwaysShowRetry: {
      control: 'boolean',
      description: 'Always show retry button even while auto-reconnecting',
    },
    message: {
      control: 'text',
      description: 'Override the default status message',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockReconnectingOverlay>;

// ===== Stories =====

/**
 * Initial disconnection state – connection was lost and no reconnection has started yet.
 */
export const Disconnected: Story = {
  args: {
    wsStatus: 'disconnected',
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    showManualRetry: false,
    fullScreen: false,
  },
};

/**
 * Active reconnection in progress – spinning loader and progress bar show attempt count.
 */
export const Reconnecting: Story = {
  args: {
    wsStatus: 'reconnecting',
    isReconnecting: true,
    reconnectAttempts: 2,
    maxReconnectAttempts: 5,
    showManualRetry: false,
    fullScreen: false,
  },
};

/**
 * Reconnection near maximum attempts – progress bar is mostly filled.
 */
export const ReconnectingNearMax: Story = {
  args: {
    wsStatus: 'reconnecting',
    isReconnecting: true,
    reconnectAttempts: 4,
    maxReconnectAttempts: 5,
    showManualRetry: false,
    fullScreen: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The progress bar is 80 % filled indicating one attempt remains before switching to manual retry.',
      },
    },
  },
};

/**
 * Manual retry required – all auto-reconnect attempts have been exhausted.
 * Shows the Retry Now button and help text.
 */
export const ManualRetryRequired: Story = {
  args: {
    wsStatus: 'disconnected',
    isReconnecting: false,
    reconnectAttempts: 5,
    maxReconnectAttempts: 5,
    showManualRetry: true,
    fullScreen: false,
  },
};

/**
 * Connection error state with a custom message.
 */
export const ConnectionError: Story = {
  args: {
    wsStatus: 'error',
    isReconnecting: false,
    reconnectAttempts: 5,
    maxReconnectAttempts: 5,
    showManualRetry: true,
    fullScreen: false,
    message: 'Unable to reach the router. Check that it is online.',
  },
};

/**
 * With dismiss button – useful in non-critical contexts where the user can
 * choose to continue using cached data.
 */
export const WithDismiss: Story = {
  args: {
    wsStatus: 'disconnected',
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    showManualRetry: false,
    fullScreen: false,
    onDismiss: () => console.log('Overlay dismissed'),
  },
};

/**
 * Full-screen backdrop variant used in production to block interaction
 * until the connection is restored.
 */
export const FullScreen: Story = {
  args: {
    wsStatus: 'reconnecting',
    isReconnecting: true,
    reconnectAttempts: 1,
    maxReconnectAttempts: 5,
    showManualRetry: false,
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'The full-screen variant renders a dimmed backdrop and centres the card. ' +
          'This is the default mode used in the app to prevent interaction during reconnection.',
      },
    },
  },
};
