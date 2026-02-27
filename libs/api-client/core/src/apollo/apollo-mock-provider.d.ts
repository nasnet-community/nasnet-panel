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
import type { ReactNode } from 'react';
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
export declare function MockApolloProvider({
  children,
}: MockApolloProviderProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=apollo-mock-provider.d.ts.map
