/**
 * AppErrorBoundary Stories
 *
 * Demonstrates the outermost application error boundary that catches
 * catastrophic failures and displays a full-page recovery UI.
 *
 * Note: Because AppErrorBoundary is a React class-based error boundary,
 * stories use a "BrokenComponent" pattern to trigger the boundary and
 * showcase the AppErrorFallback UI directly via a test harness component.
 */

import * as React from 'react';

import { AppErrorBoundary } from './AppErrorBoundary';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

/**
 * Throws on first render to trigger the error boundary.
 */
function BrokenComponent({ message }: { message: string }): React.ReactNode {
  throw new Error(message);
}

/**
 * Toggle-able wrapper that mounts/unmounts BrokenComponent so the boundary
 * can be triggered interactively inside Storybook.
 */
function ErrorTrigger({
  errorMessage,
  onError,
}: {
  errorMessage: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  const [crashed, setCrashed] = React.useState(false);

  if (crashed) {
    return (
      <AppErrorBoundary onError={onError}>
        <BrokenComponent message={errorMessage} />
      </AppErrorBoundary>
    );
  }

  return (
    <div className="border-border bg-muted/30 flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8">
      <p className="text-muted-foreground text-center text-sm">
        Click the button below to simulate a catastrophic render error and trigger the{' '}
        <strong>AppErrorBoundary</strong> fallback UI.
      </p>
      <button
        onClick={() => setCrashed(true)}
        className="bg-error hover:bg-error/90 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        Trigger Application Crash
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof AppErrorBoundary> = {
  title: 'Patterns/ErrorBoundary/AppErrorBoundary',
  component: AppErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The outermost error boundary for catastrophic application failures. ' +
          'Place this at the root of your app (wrapping all providers). ' +
          'It catches any error that escapes inner boundaries and renders a full-page ' +
          'recovery UI with reload, retry, home navigation, and issue-reporting actions. ' +
          'Technical stack details are always shown in dev mode and toggle-able in production.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppErrorBoundary>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Interactive demo: click the button to trigger a crash and see the fallback.
 */
export const Default: Story = {
  render: () => (
    <ErrorTrigger errorMessage="TypeError: Cannot read properties of undefined (reading 'router')" />
  ),
};

/**
 * Shows what the fallback looks like for a provider-initialisation failure.
 */
export const ProviderInitializationFailure: Story = {
  render: () => (
    <ErrorTrigger errorMessage="ApolloError: Failed to initialize Apollo Client — network unreachable" />
  ),
};

/**
 * Shows the fallback for a runtime chunk-load error (lazy import failure).
 */
export const ChunkLoadError: Story = {
  render: () => (
    <ErrorTrigger errorMessage="ChunkLoadError: Loading chunk 42 failed. (missing: /static/js/42.chunk.js)" />
  ),
};

/**
 * Demonstrates the onError telemetry callback receiving the error.
 * Open the Actions panel to see the logged error details.
 */
export const WithTelemetryCallback: Story = {
  render: () => (
    <ErrorTrigger
      errorMessage="ReferenceError: useRouter is not defined"
      onError={(error, errorInfo) => {
        console.log('[Telemetry] Error caught:', {
          message: error.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    />
  ),
};

/**
 * Healthy state — no error is thrown, children render normally.
 */
export const HealthyChildren: Story = {
  render: () => (
    <AppErrorBoundary>
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-foreground text-lg font-semibold">Application Running Normally</p>
          <p className="text-muted-foreground mt-1 text-sm">
            No error has been thrown. The boundary is transparent.
          </p>
        </div>
      </div>
    </AppErrorBoundary>
  ),
};
