/**
 * Apollo Provider Component
 *
 * React provider wrapper for Apollo Client with conditional DevTools.
 * DevTools are only loaded in development mode to keep production bundles lean.
 *
 * @module @nasnet/api-client/core/apollo
 */

import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { Suspense, lazy, ReactNode } from 'react';
import { apolloClient } from './apollo-client';

/**
 * Lazy load Apollo DevTools only in development.
 * Uses dynamic import to avoid bundling in production.
 *
 * Note: Apollo DevTools are integrated via browser extension in most cases,
 * but this provides in-app debugging for environments without the extension.
 */
const ApolloDevToolsPanel = import.meta.env.DEV
  ? lazy(() =>
      import('@apollo/client/dev').then((mod) => ({
        // The dev module exports multiple things, we want ApolloDevTools
        default:
          'ApolloDevTools' in mod
            ? (mod as { ApolloDevTools: React.ComponentType }).ApolloDevTools
            : () => null, // Fallback if not available
      }))
    )
  : null;

/**
 * Props for ApolloProvider component.
 */
interface ApolloProviderProps {
  /** Child components to render within Apollo context */
  children: ReactNode;
}

/**
 * Apollo Provider with integrated DevTools.
 *
 * Wraps children with Apollo Client context and optionally renders
 * DevTools panel in development mode.
 *
 * Usage:
 * ```tsx
 * import { ApolloProvider } from '@nasnet/api-client/core';
 *
 * function App() {
 *   return (
 *     <ApolloProvider>
 *       <Router />
 *     </ApolloProvider>
 *   );
 * }
 * ```
 *
 * Provider tree position (from CLAUDE.md):
 * ErrorBoundary → ApolloProvider → QueryClientProvider → I18nextProvider → ThemeProvider → ToastProvider
 */
export function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={apolloClient}>
      {children}
      {ApolloDevToolsPanel && (
        <Suspense fallback={null}>
          <ApolloDevToolsPanel />
        </Suspense>
      )}
    </BaseApolloProvider>
  );
}
