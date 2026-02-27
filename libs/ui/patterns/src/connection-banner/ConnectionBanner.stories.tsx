/**
 * ConnectionBanner Stories
 *
 * Demonstrates the connection-state banner shown below the app header when
 * the router WebSocket connection is lost or actively reconnecting.
 *
 * ConnectionBanner reads its state from the Zustand `useConnectionStore`.
 * These stories use a self-contained mock presenter that mirrors the
 * component's render tree so each connection state can be demonstrated in
 * isolation without coupling to a real store or WebSocket.
 */

import * as React from 'react';

import { AlertTriangle, Wifi } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock presenter
// Mirrors the real ConnectionBanner render tree but accepts `state` as a prop
// instead of reading it from the Zustand store.
// ---------------------------------------------------------------------------

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

interface MockConnectionBannerProps {
  /** Simulated connection state (mirrors useConnectionStore().state) */
  state?: ConnectionState;
}

function MockConnectionBanner({ state = 'disconnected' }: MockConnectionBannerProps) {
  // Mirrors the real component: renders an informational placeholder when
  // connected so the canvas is not blank.
  if (state === 'connected') {
    return (
      <div className="text-muted-foreground border-border bg-background border-b px-6 py-2 text-xs italic">
        (banner is hidden — connection state is &quot;connected&quot;)
      </div>
    );
  }

  const isReconnecting = state === 'reconnecting';

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b px-6 py-4 transition-colors',
        'bg-warning/10 border-warning/30 backdrop-blur-sm',
        'shadow-sm'
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {isReconnecting ?
        <Wifi
          className="text-warning h-5 w-5 animate-pulse"
          aria-hidden="true"
        />
      : <AlertTriangle
          className="text-warning h-5 w-5"
          aria-hidden="true"
        />
      }
      <p className="text-warning text-sm font-semibold">
        {isReconnecting ?
          'Reconnecting to router...'
        : 'Connection lost. Attempting to reconnect...'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout wrapper — mimics an app shell so the banner looks in-context
// ---------------------------------------------------------------------------

function AppShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-background w-full overflow-hidden rounded-xl border">
      {/* Simulated app header */}
      <div className="border-border bg-card flex items-center justify-between border-b px-6 py-3">
        <span className="text-foreground text-sm font-semibold">NasNetConnect</span>
        <span className="text-muted-foreground text-xs">192.168.88.1</span>
      </div>

      {/* Banner renders here */}
      {children}

      {/* Simulated page content */}
      <div className="p-6">
        <div className="bg-muted/30 flex h-24 items-center justify-center rounded-lg">
          <span className="text-muted-foreground text-sm">Page content area</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof MockConnectionBanner> = {
  title: 'Patterns/Connection/ConnectionBanner',
  component: MockConnectionBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Full-width warning banner displayed below the app header whenever the ' +
          'router WebSocket connection is lost or actively reconnecting. ' +
          'The component is driven by the `useConnectionStore` Zustand store: ' +
          'it renders nothing when `state` is `"connected"`, shows a warning ' +
          'AlertTriangle icon and "Connection lost" message when `"disconnected"`, ' +
          'and shows a pulsing Wifi icon with "Reconnecting to router…" when ' +
          '`"reconnecting"`. Place this directly inside the app layout, below ' +
          '`<AppHeader>`. These stories use a mock presenter to show each state ' +
          'independently without a live store or WebSocket.',
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['connected', 'disconnected', 'reconnecting'],
      description: 'Simulated connection state (mirrors `useConnectionStore().state`)',
    },
  },
  decorators: [
    (Story) => (
      <AppShellWrapper>
        <Story />
      </AppShellWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MockConnectionBanner>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Connection lost — displayed when the WebSocket drops and no active reconnect
 * is in progress. Shows an AlertTriangle icon and the static warning message.
 */
export const Disconnected: Story = {
  args: {
    state: 'disconnected',
  },
};

/**
 * Reconnecting — displayed while the client is actively attempting to
 * re-establish the WebSocket. The Wifi icon pulses to indicate ongoing activity.
 */
export const Reconnecting: Story = {
  args: {
    state: 'reconnecting',
  },
};

/**
 * Connected — the banner returns null in the real component. The mock shows a
 * subtle placeholder so the story canvas is not entirely blank.
 */
export const Connected: Story = {
  args: {
    state: 'connected',
  },
};

/**
 * All three states stacked for side-by-side design review.
 * The wrapper decorator is overridden here so each state is labelled inline.
 */
export const AllStates: Story = {
  decorators: [],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Side-by-side comparison of all three connection states. ' +
          'The "connected" state shows a placeholder since the real component returns null.',
      },
    },
  },
  render: () => (
    <div className="w-full max-w-2xl space-y-4">
      {(['disconnected', 'reconnecting', 'connected'] as ConnectionState[]).map((state) => (
        <div key={state}>
          <p className="text-muted-foreground mb-1 px-1 text-xs font-medium uppercase tracking-wide">
            state: &quot;{state}&quot;
          </p>
          <div className="border-border overflow-hidden rounded-lg border">
            <MockConnectionBanner state={state} />
          </div>
        </div>
      ))}
    </div>
  ),
};
