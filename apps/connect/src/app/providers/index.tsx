import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApolloProvider } from '@nasnet/api-client/core';
import { I18nProvider, DirectionProvider } from '@nasnet/core/i18n';
import { PlatformProvider } from '@nasnet/ui/layouts';
import { AnimationProvider, ToastProvider } from '@nasnet/ui/patterns';

import { ThemeProvider } from './ThemeProvider';


const queryClient = new QueryClient();

/**
 * Loading fallback for i18n lazy loading
 * Shows a minimal loading state while language pack loads
 */
function I18nLoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/**
 * Root providers for the application
 *
 * Combines all context providers in proper nesting order (outermost to innermost):
 * 1. I18nProvider - Internationalization (NAS-4.22)
 * 2. DirectionProvider - RTL/LTR direction support (NAS-4.22)
 * 3. ThemeProvider - Theme management
 * 4. PlatformProvider - Platform detection for responsive presenters (ADR-018)
 * 5. AnimationProvider - Animation context with reduced motion support (NAS-4.18)
 * 6. ApolloProvider - GraphQL client for server state (subscriptions, normalized cache)
 * 7. QueryClientProvider - TanStack Query for REST endpoints (coexists during migration)
 * 8. ToastProvider - Sonner-based toast notifications (NAS-4.19)
 *
 * Note: Apollo and TanStack Query coexist during migration period:
 * - Apollo: New GraphQL features (subscriptions, real-time updates)
 * - TanStack Query: Existing REST endpoints
 *
 * I18n Provider provides:
 * - react-i18next configuration
 * - Lazy loading of language packs
 * - Suspense boundary for async translations
 *
 * Direction Provider provides:
 * - RTL/LTR detection based on current language
 * - Updates document dir and lang attributes
 * - useDirection hook for direction-aware components
 *
 * Animation Provider provides:
 * - reducedMotion detection from UI store
 * - Platform detection (mobile/tablet/desktop)
 * - Animation tokens adjusted for platform
 * - Helper functions (getVariant, getTransition, getDuration)
 *
 * Toast Provider provides:
 * - Sonner toaster with theme integration
 * - NotificationManager for store-to-Sonner sync
 * - Responsive positioning (bottom-right desktop, bottom-center mobile)
 * - Max 3 visible toasts with queue management
 *
 * Usage:
 * ```tsx
 * <Providers>
 *   <RouterProvider router={router} />
 * </Providers>
 * ```
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider loadingFallback={<I18nLoadingFallback />}>
      <DirectionProvider>
        <ThemeProvider>
          <PlatformProvider>
            <AnimationProvider>
              <ApolloProvider>
                <QueryClientProvider client={queryClient}>
                  <ToastProvider>{children}</ToastProvider>
                </QueryClientProvider>
              </ApolloProvider>
            </AnimationProvider>
          </PlatformProvider>
        </ThemeProvider>
      </DirectionProvider>
    </I18nProvider>
  );
}
Providers.displayName = 'Providers';
