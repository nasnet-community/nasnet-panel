/**
 * LazyRoute Storybook Stories
 *
 * Demonstrates the createLazyRoute, preloadRoutes, and createPreloadHandlers
 * utilities. Because these helpers produce TanStack Router configuration
 * objects rather than renderable components, each story wraps the utility
 * output inside a React.Suspense boundary to show the resulting UI states.
 *
 * @module @nasnet/ui/patterns/suspense
 */

import * as React from 'react';

import { Skeleton } from '@nasnet/ui/primitives';

import { createLazyRoute, createPreloadHandlers } from './LazyRoute';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Demo helpers
// ============================================================================

/** A lightweight page-level skeleton shown while lazy components load. */
function PageSkeleton() {
  return (
    <div className="space-y-4 p-6 w-full max-w-md" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** Simulates a lazily loaded page component. */
const FakeDashboardPage = React.lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) => {
      setTimeout(() => {
        resolve({
          default: function DashboardPage() {
            return (
              <div className="p-6 space-y-3 w-full max-w-md">
                <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  This page was lazily loaded via createLazyRoute.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['CPU', 'RAM', 'Uptime', 'Temp'].map((label) => (
                    <div
                      key={label}
                      className="p-3 rounded-lg bg-muted text-center"
                    >
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="text-base font-semibold text-foreground">--</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          },
        });
      }, 1500);
    })
);

/** Simulates an import that always fails. */
function failingImport(): Promise<{ default: React.ComponentType }> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Failed to load module')), 600);
  });
}

// ============================================================================
// Demo wrapper components
// ============================================================================

/**
 * Shows the pending (skeleton) state while a lazy component loads.
 */
function LazyLoadingDemo() {
  const route = createLazyRoute({
    importFn: () => Promise.resolve({ default: FakeDashboardPage as React.ComponentType<object> }),
    skeleton: <PageSkeleton />,
  });

  return (
    <React.Suspense fallback={route.pendingComponent()}>
      <route.Component />
    </React.Suspense>
  );
}

/**
 * Shows the resolved (loaded) component state immediately.
 */
function LazyLoadedDemo() {
  return (
    <div className="p-6 space-y-3 w-full max-w-md">
      <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      <p className="text-sm text-muted-foreground">
        This page was lazily loaded via createLazyRoute.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {['CPU', 'RAM', 'Uptime', 'Temp'].map((label) => (
          <div key={label} className="p-3 rounded-lg bg-muted text-center">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-base font-semibold text-foreground">--</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shows the error fallback when a lazy import fails.
 */
function LazyErrorFallbackDemo() {
  const [triggered, setTriggered] = React.useState(false);

  const route = createLazyRoute({
    importFn: failingImport,
    skeleton: <PageSkeleton />,
    errorComponent: (error: Error) => (
      <div className="p-6 text-center space-y-3 w-full max-w-md">
        <p className="text-destructive font-medium">Failed to load page</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={() => setTriggered(false)}
          className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
        >
          Try again
        </button>
      </div>
    ),
  });

  if (!triggered) {
    return (
      <div className="p-6 text-center space-y-3 w-full max-w-md">
        <p className="text-sm text-muted-foreground">
          Click the button to simulate a failed lazy import.
        </p>
        <button
          type="button"
          onClick={() => setTriggered(true)}
          className="px-4 py-2 bg-destructive text-destructive-foreground text-sm rounded-md hover:bg-destructive/90"
        >
          Trigger Import Failure
        </button>
      </div>
    );
  }

  const ErrorBoundaryFallback = route.errorComponent;

  return (
    <React.Suspense fallback={route.pendingComponent()}>
      {ErrorBoundaryFallback ? (
        <ErrorBoundaryFallback error={new Error('Failed to load module')} />
      ) : null}
    </React.Suspense>
  );
}

/**
 * Demonstrates createPreloadHandlers — hover/focus to preload a lazy route.
 */
function PreloadHandlersDemo() {
  const [preloaded, setPreloaded] = React.useState(false);

  const handlers = React.useMemo(
    () =>
      createPreloadHandlers(() => {
        setPreloaded(true);
        return Promise.resolve({
          default: function SettingsPage() {
            return <div>Settings</div>;
          },
        });
      }),
    []
  );

  return (
    <div className="p-6 space-y-4 w-full max-w-md">
      <p className="text-sm text-muted-foreground">
        Hover over the link below to trigger preloading. The import fires once
        on first hover/focus and is then cached.
      </p>
      <a
        href="#settings"
        onClick={(e) => e.preventDefault()}
        {...handlers}
        className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Settings (hover to preload)
      </a>
      <div
        className={`text-xs font-mono px-3 py-2 rounded-md transition-colors ${
          preloaded ? 'bg-semantic-success/10 text-semantic-success' : 'bg-muted text-muted-foreground'
        }`}
      >
        {preloaded ? 'Module preloaded!' : 'Waiting for hover…'}
      </div>
    </div>
  );
}

/**
 * Shows the custom skeleton fallback configuration.
 */
function CustomSkeletonDemo() {
  const CustomSkeleton = () => (
    <div className="p-6 space-y-4 w-full max-w-md">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );

  const route = createLazyRoute({
    importFn: () =>
      new Promise<{ default: React.ComponentType<object> }>((resolve) => {
        setTimeout(() => resolve({ default: () => <div>Loaded!</div> }), 3000);
      }),
    skeleton: <CustomSkeleton />,
  });

  return (
    <div>
      <div className="mb-3 px-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Custom skeleton (3s delay)
        </span>
      </div>
      <React.Suspense fallback={route.pendingComponent()}>
        <route.Component />
      </React.Suspense>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

/**
 * Wrapper component for Storybook — routes stories by scenario name.
 */
function LazyRouteDemo({ scenario }: { scenario: string }) {
  switch (scenario) {
    case 'loading':
      return <LazyLoadingDemo />;
    case 'loaded':
      return <LazyLoadedDemo />;
    case 'error':
      return <LazyErrorFallbackDemo />;
    case 'preload-handlers':
      return <PreloadHandlersDemo />;
    case 'custom-skeleton':
      return <CustomSkeletonDemo />;
    default:
      return <LazyLoadedDemo />;
  }
}

const meta: Meta<typeof LazyRouteDemo> = {
  title: 'Patterns/Suspense/LazyRoute',
  component: LazyRouteDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Utility functions for creating lazy-loaded routes with TanStack Router.

## Exports

- **\`createLazyRoute\`** — wraps \`React.lazy\` and returns \`{ Component, pendingComponent, preload, errorComponent }\`
- **\`preloadRoutes\`** — eagerly imports multiple routes using \`requestIdleCallback\`
- **\`createPreloadHandlers\`** — returns \`{ onMouseEnter, onFocus }\` handlers for link elements

## Usage with TanStack Router
\`\`\`tsx
const dashboardRoute = createLazyRoute({
  importFn: () => import('./pages/Dashboard'),
  skeleton: <DashboardSkeleton />,
});

export const Route = createFileRoute('/dashboard')({
  component: dashboardRoute.Component,
  pendingComponent: dashboardRoute.pendingComponent,
});
\`\`\`

## Preloading on hover
\`\`\`tsx
const handlers = createPreloadHandlers(() => import('./pages/Settings'));
<Link to="/settings" {...handlers}>Settings</Link>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: ['loading', 'loaded', 'error', 'preload-handlers', 'custom-skeleton'],
      description: 'Which scenario to demonstrate',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LazyRouteDemo>;

// ============================================================================
// Stories
// ============================================================================

/**
 * The pending (loading) state — shows the skeleton configured in createLazyRoute
 * while the lazy component resolves.
 */
export const PendingSkeleton: Story = {
  name: 'Pending Skeleton',
  args: { scenario: 'loading' },
  parameters: {
    docs: {
      description: {
        story:
          'The `pendingComponent` returned by `createLazyRoute` renders this skeleton ' +
          'while the lazy component\'s Promise is pending.',
      },
    },
  },
};

/**
 * The resolved (loaded) state — the lazy component has resolved and rendered.
 */
export const ResolvedComponent: Story = {
  name: 'Resolved Component',
  args: { scenario: 'loaded' },
  parameters: {
    docs: {
      description: {
        story: 'Once the lazy import resolves, the real component replaces the skeleton.',
      },
    },
  },
};

/**
 * Error state — the lazy import failed and the custom errorComponent is shown.
 */
export const ErrorFallback: Story = {
  name: 'Error Fallback',
  args: { scenario: 'error' },
  parameters: {
    docs: {
      description: {
        story:
          'When the import function rejects, the `errorComponent` callback is called with ' +
          'the thrown Error. Click the button to simulate a module load failure.',
      },
    },
  },
};

/**
 * Demonstrates createPreloadHandlers — hover/focus an element to fire the import.
 */
export const PreloadOnHover: Story = {
  name: 'Preload On Hover',
  args: { scenario: 'preload-handlers' },
  parameters: {
    docs: {
      description: {
        story:
          '`createPreloadHandlers` returns `{ onMouseEnter, onFocus }` that invoke ' +
          'the import only once. Spread these props onto a `<Link>` to preload the ' +
          'target route before the user clicks.',
      },
    },
  },
};

/**
 * A customized skeleton that matches the shape of the page being loaded.
 */
export const CustomSkeleton: Story = {
  name: 'Custom Skeleton Shape',
  args: { scenario: 'custom-skeleton' },
  parameters: {
    docs: {
      description: {
        story:
          'Pass any React node as `skeleton` to `createLazyRoute`. A skeleton that ' +
          'matches the page layout reduces perceived loading time.',
      },
    },
  },
};
