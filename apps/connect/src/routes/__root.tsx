import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from '@nasnet/ui/primitives';
import { AppShell } from '@nasnet/ui/layouts';
import {
  CommandPalette,
  ShortcutsOverlay,
  useGlobalShortcuts,
  SearchFAB,
  ConnectionBanner,
} from '@nasnet/ui/patterns';
import { Providers } from '../app/providers';
import { AppHeader } from '../app/components/AppHeader';
import { useConnectionToast } from '../app/hooks/useConnectionToast';
import { useConnectionHeartbeat } from '../app/hooks/useConnectionHeartbeat';
import { useDefaultCommands } from '../app/hooks/useDefaultCommands';

function RootComponent() {
  // Enable connection toast notifications
  useConnectionToast();

  // Enable connection heartbeat monitoring
  useConnectionHeartbeat();

  // Register default commands and shortcuts
  useDefaultCommands();

  // Enable global keyboard shortcuts (Cmd+K, ?, etc.)
  useGlobalShortcuts();

  return (
    <Providers>
      <AppShell header={<AppHeader />} banner={<ConnectionBanner />}>
        <Outlet />
        <Toaster />
        {/* Command Palette - opens with Cmd+K or via SearchFAB on mobile */}
        <CommandPalette />
        {/* Shortcuts Overlay - opens with ? key (desktop only) */}
        <ShortcutsOverlay />
        {/* Search FAB - visible on mobile only */}
        <SearchFAB />
      </AppShell>
      {/* Only show devtools in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </Providers>
  );
}

// Root-level error boundary
function RootErrorComponent({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-8 bg-card text-card-foreground rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-error mb-4">Application Error</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover"
        >
          Reload Application
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto text-foreground">
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}

// 404 Not Found component
function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted">404</h1>
        <p className="text-xl text-muted-foreground mt-4">Page not found</p>
        <a
          href="/"
          className="mt-6 inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
});
