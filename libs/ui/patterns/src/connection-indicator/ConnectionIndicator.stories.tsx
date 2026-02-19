import * as React from 'react';

import { Circle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// Since ConnectionIndicator uses hooks that depend on stores,
// we create mock presenters for Storybook demonstration

const STATUS_COLOR_CLASSES = {
  green: {
    dot: 'bg-semantic-success',
    text: 'text-semantic-success',
    bg: 'bg-semantic-success/10',
  },
  amber: {
    dot: 'bg-semantic-warning',
    text: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  red: {
    dot: 'bg-semantic-error',
    text: 'text-semantic-error',
    bg: 'bg-semantic-error/10',
  },
  gray: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
  },
} as const;

type StatusColor = keyof typeof STATUS_COLOR_CLASSES;

interface MockConnectionState {
  statusLabel: string;
  statusColor: StatusColor;
  wsStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  latencyMs: number | null;
  latencyQuality?: 'good' | 'moderate' | 'poor';
  isReconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  showManualRetry: boolean;
}

// Mobile presenter mock
function MockMobileIndicator({ state }: { state: MockConnectionState }) {
  const colors = STATUS_COLOR_CLASSES[state.statusColor];

  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-full',
        'min-h-[44px] min-w-[44px]',
        'transition-colors duration-200',
        colors.bg,
        state.showManualRetry && 'cursor-pointer active:opacity-80'
      )}
      aria-label={`Connection status: ${state.statusLabel}`}
    >
      {state.isReconnecting ? (
        <Loader2 className={cn('h-4 w-4 animate-spin', colors.text)} />
      ) : state.wsStatus === 'disconnected' ? (
        <WifiOff className={cn('h-4 w-4', colors.text)} />
      ) : (
        <Wifi className={cn('h-4 w-4', colors.text)} />
      )}

      {state.showManualRetry && (
        <RefreshCw className={cn('h-3 w-3', colors.text)} />
      )}
    </button>
  );
}

// Desktop presenter mock
function MockDesktopIndicator({ state }: { state: MockConnectionState }) {
  const colors = STATUS_COLOR_CLASSES[state.statusColor];

  const LATENCY_QUALITY_CLASSES = {
    good: 'text-semantic-success',
    moderate: 'text-semantic-warning',
    poor: 'text-semantic-error',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md',
        'transition-colors duration-200',
        state.showManualRetry && 'cursor-pointer hover:bg-muted'
      )}
      role="button"
      tabIndex={state.showManualRetry ? 0 : -1}
      aria-label={`Connection status: ${state.statusLabel}`}
    >
      <div className="flex items-center gap-1.5">
        {state.isReconnecting ? (
          <Loader2 className={cn('h-3.5 w-3.5 animate-spin', colors.text)} />
        ) : (
          <Circle
            className={cn(
              'h-2.5 w-2.5 transition-colors',
              colors.dot,
              state.wsStatus === 'connected' && 'animate-pulse'
            )}
            fill="currentColor"
            aria-hidden="true"
          />
        )}

        <span className={cn('text-xs font-medium', colors.text)}>
          {state.statusLabel}
        </span>
      </div>

      {state.wsStatus === 'connected' && state.latencyMs !== null && (
        <span
          className={cn(
            'text-xs font-mono',
            state.latencyQuality && LATENCY_QUALITY_CLASSES[state.latencyQuality]
          )}
        >
          {state.latencyMs}ms
        </span>
      )}

      {state.isReconnecting && (
        <span className="text-xs text-muted-foreground">
          {state.reconnectAttempts}/{state.maxReconnectAttempts}
        </span>
      )}

      {state.showManualRetry && (
        <RefreshCw className={cn('h-3.5 w-3.5', colors.text)} />
      )}
    </div>
  );
}

// Wrapper component for stories
function ConnectionIndicatorDemo({
  variant = 'desktop',
  ...state
}: MockConnectionState & { variant?: 'mobile' | 'desktop' }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {variant === 'mobile' ? (
        <MockMobileIndicator state={state} />
      ) : (
        <MockDesktopIndicator state={state} />
      )}
    </div>
  );
}

const meta: Meta<typeof ConnectionIndicatorDemo> = {
  title: 'Patterns/ConnectionIndicator',
  component: ConnectionIndicatorDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A connection status indicator that shows WebSocket connection state with platform-adaptive presentation. Displays status, latency, and reconnection progress. Follows the Headless + Platform Presenter pattern (ADR-018).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionIndicatorDemo>;

export const Connected: Story = {
  args: {
    variant: 'desktop',
    statusLabel: 'Connected',
    statusColor: 'green',
    wsStatus: 'connected',
    latencyMs: 24,
    latencyQuality: 'good',
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    showManualRetry: false,
  },
};

export const ConnectedMobile: Story = {
  args: {
    variant: 'mobile',
    statusLabel: 'Connected',
    statusColor: 'green',
    wsStatus: 'connected',
    latencyMs: 24,
    latencyQuality: 'good',
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    showManualRetry: false,
  },
};

export const Connecting: Story = {
  args: {
    variant: 'desktop',
    statusLabel: 'Connecting',
    statusColor: 'amber',
    wsStatus: 'connecting',
    latencyMs: null,
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    showManualRetry: false,
  },
};

export const Reconnecting: Story = {
  args: {
    variant: 'desktop',
    statusLabel: 'Reconnecting',
    statusColor: 'amber',
    wsStatus: 'reconnecting',
    latencyMs: null,
    isReconnecting: true,
    reconnectAttempts: 2,
    maxReconnectAttempts: 5,
    showManualRetry: false,
  },
};

export const Disconnected: Story = {
  args: {
    variant: 'desktop',
    statusLabel: 'Disconnected',
    statusColor: 'red',
    wsStatus: 'disconnected',
    latencyMs: null,
    isReconnecting: false,
    reconnectAttempts: 5,
    maxReconnectAttempts: 5,
    showManualRetry: true,
  },
};

export const DisconnectedMobile: Story = {
  args: {
    variant: 'mobile',
    statusLabel: 'Disconnected',
    statusColor: 'red',
    wsStatus: 'disconnected',
    latencyMs: null,
    isReconnecting: false,
    reconnectAttempts: 5,
    maxReconnectAttempts: 5,
    showManualRetry: true,
  },
};

export const LatencyQualities: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs text-muted-foreground mb-1 block">Good latency (&lt;50ms)</span>
        <ConnectionIndicatorDemo
          variant="desktop"
          statusLabel="Connected"
          statusColor="green"
          wsStatus="connected"
          latencyMs={24}
          latencyQuality="good"
          isReconnecting={false}
          reconnectAttempts={0}
          maxReconnectAttempts={5}
          showManualRetry={false}
        />
      </div>
      <div>
        <span className="text-xs text-muted-foreground mb-1 block">Moderate latency (50-150ms)</span>
        <ConnectionIndicatorDemo
          variant="desktop"
          statusLabel="Connected"
          statusColor="green"
          wsStatus="connected"
          latencyMs={89}
          latencyQuality="moderate"
          isReconnecting={false}
          reconnectAttempts={0}
          maxReconnectAttempts={5}
          showManualRetry={false}
        />
      </div>
      <div>
        <span className="text-xs text-muted-foreground mb-1 block">Poor latency (&gt;150ms)</span>
        <ConnectionIndicatorDemo
          variant="desktop"
          statusLabel="Connected"
          statusColor="green"
          wsStatus="connected"
          latencyMs={245}
          latencyQuality="poor"
          isReconnecting={false}
          reconnectAttempts={0}
          maxReconnectAttempts={5}
          showManualRetry={false}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Latency is color-coded: green (&lt;50ms), amber (50-150ms), red (&gt;150ms).',
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Desktop Variant</h3>
        <div className="flex flex-col gap-2">
          <ConnectionIndicatorDemo
            variant="desktop"
            statusLabel="Connected"
            statusColor="green"
            wsStatus="connected"
            latencyMs={24}
            latencyQuality="good"
            isReconnecting={false}
            reconnectAttempts={0}
            maxReconnectAttempts={5}
            showManualRetry={false}
          />
          <ConnectionIndicatorDemo
            variant="desktop"
            statusLabel="Connecting"
            statusColor="amber"
            wsStatus="connecting"
            latencyMs={null}
            isReconnecting={false}
            reconnectAttempts={0}
            maxReconnectAttempts={5}
            showManualRetry={false}
          />
          <ConnectionIndicatorDemo
            variant="desktop"
            statusLabel="Reconnecting"
            statusColor="amber"
            wsStatus="reconnecting"
            latencyMs={null}
            isReconnecting={true}
            reconnectAttempts={3}
            maxReconnectAttempts={5}
            showManualRetry={false}
          />
          <ConnectionIndicatorDemo
            variant="desktop"
            statusLabel="Disconnected"
            statusColor="red"
            wsStatus="disconnected"
            latencyMs={null}
            isReconnecting={false}
            reconnectAttempts={5}
            maxReconnectAttempts={5}
            showManualRetry={true}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Mobile Variant</h3>
        <div className="flex gap-2">
          <ConnectionIndicatorDemo
            variant="mobile"
            statusLabel="Connected"
            statusColor="green"
            wsStatus="connected"
            latencyMs={24}
            latencyQuality="good"
            isReconnecting={false}
            reconnectAttempts={0}
            maxReconnectAttempts={5}
            showManualRetry={false}
          />
          <ConnectionIndicatorDemo
            variant="mobile"
            statusLabel="Connecting"
            statusColor="amber"
            wsStatus="connecting"
            latencyMs={null}
            isReconnecting={true}
            reconnectAttempts={2}
            maxReconnectAttempts={5}
            showManualRetry={false}
          />
          <ConnectionIndicatorDemo
            variant="mobile"
            statusLabel="Disconnected"
            statusColor="red"
            wsStatus="disconnected"
            latencyMs={null}
            isReconnecting={false}
            reconnectAttempts={5}
            maxReconnectAttempts={5}
            showManualRetry={true}
          />
        </div>
      </div>
    </div>
  ),
};
