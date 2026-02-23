import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { useTranslation } from '@nasnet/core/i18n';
import { useAlertNotifications } from '@nasnet/features/alerts';
import { AppShell } from '@nasnet/ui/layouts';
import {
  CommandPalette,
  ShortcutsOverlay,
  useGlobalShortcuts,
  SearchFAB,
  ConnectionBanner,
} from '@nasnet/ui/patterns';
import { Toaster } from '@nasnet/ui/primitives';

import { AppHeader } from '../app/components/AppHeader';
import { useConnectionHeartbeat } from '../app/hooks/useConnectionHeartbeat';
import { useConnectionToast } from '../app/hooks/useConnectionToast';
import { useDefaultCommands } from '../app/hooks/useDefaultCommands';
import { Providers } from '../app/providers';


function RootInner() {
  const { t } = useTranslation('common');

  // Enable connection toast notifications
  useConnectionToast();

  // Enable connection heartbeat monitoring
  useConnectionHeartbeat();

  // Register default commands and shortcuts
  useDefaultCommands();

  // Enable global keyboard shortcuts (Cmd+K, ?, etc.)
  useGlobalShortcuts();

  // Enable alert notifications subscription with toast + sound playback
  useAlertNotifications();

  return (
    <AppShell header={<AppHeader />} banner={<ConnectionBanner />}>
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground"
      >
        {t('a11y.skipToMainContent')}
      </a>
      <main id="main-content">
        <Outlet />
      </main>
      <Toaster />
      {/* Command Palette - opens with Cmd+K or via SearchFAB on mobile */}
      <CommandPalette />
      {/* Shortcuts Overlay - opens with ? key (desktop only) */}
      <ShortcutsOverlay />
      {/* Search FAB - visible on mobile only */}
      <SearchFAB />
    </AppShell>
  );
}

function RootComponent() {
  return (
    <Providers>
      <RootInner />
      {/* Only show devtools in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </Providers>
  );
}

// Root-level error boundary
function RootErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="alert" aria-live="assertive">
      <div className="max-w-md p-8 bg-card text-card-foreground rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-error mb-4">{t('errors.applicationError')}</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t('actions.reloadApplication')}
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
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted">{t('errors.notFound')}</h1>
        <p className="text-xl text-muted-foreground mt-4">{t('errors.pageNotFound')}</p>
        <a
          href="/"
          className="mt-6 inline-block min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t('actions.goHome')}
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
