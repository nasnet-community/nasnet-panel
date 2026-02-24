/**
 * Mock Apollo Provider for Storybook and Tests
 *
 * Creates a minimal Apollo Client with InMemoryCache and a no-op terminating link.
 * Components get an Apollo context but queries stay in loading state.
 *
 * For stories that need specific mock data, use MockedProvider from
 * @apollo/client/testing instead.
 *
 * @module @nasnet/api-client/core/apollo
 */

import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } from '@apollo/client';
import type { ReactNode } from 'react';

/**
 * A terminating link that never resolves — queries stay in loading state.
 * This is intentional: the mock provider exists only to satisfy the Apollo
 * context requirement so components don't crash.
 */
const noOpLink = new ApolloLink(
  () => new Observable(() => {
    // Never completes — keeps queries in loading state
  }),
);

/**
 * Minimal Apollo Client for non-production environments.
 * No cache persistence, no WebSocket, no real HTTP.
 */
const mockApolloClient = new ApolloClient({
  link: noOpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'no-cache' },
    query: { fetchPolicy: 'no-cache' },
  },
});

interface MockApolloProviderProps {
  children: ReactNode;
}

/**
 * Wraps children with a minimal Apollo context for Storybook and tests.
 *
 * Usage:
 * ```tsx
 * <MockApolloProvider>
 *   <MyComponent />
 * </MockApolloProvider>
 * ```
 */
export function MockApolloProvider({ children }: MockApolloProviderProps) {
  return (
    <ApolloProvider client={mockApolloClient}>
      {children}
    </ApolloProvider>
  );
}
