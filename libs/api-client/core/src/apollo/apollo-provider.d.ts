/**
 * Apollo Provider Component
 *
 * React provider wrapper for Apollo Client with conditional DevTools.
 * DevTools are only loaded in development mode to keep production bundles lean.
 *
 * @module @nasnet/api-client/core/apollo
 */
import { ReactNode } from 'react';
/**
 * Props for ApolloProvider component.
 */
interface ApolloProviderProps {
  /** Child components to render within Apollo context */
  children: ReactNode;
}
/**
 * Apollo Provider with integrated DevTools and cache persistence.
 *
 * Wraps children with Apollo Client context, initializes cache persistence
 * for offline support, and optionally renders DevTools panel in development mode.
 *
 * Cache persistence is initialized before rendering children to ensure
 * the cache is hydrated from IndexedDB/localStorage before any queries run.
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
export declare function ApolloProvider({
  children,
}: ApolloProviderProps): import('react/jsx-runtime').JSX.Element | null;
export {};
//# sourceMappingURL=apollo-provider.d.ts.map
