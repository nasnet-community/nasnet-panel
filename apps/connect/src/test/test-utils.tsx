/**
 * Custom render utilities for React Testing Library
 *
 * This module provides a customized render function that wraps components
 * with all necessary providers (theme, router, query client, etc.)
 *
 * Usage:
 * import { render, screen } from '@/test/test-utils';
 *
 * test('example test', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByRole('button')).toBeInTheDocument();
 * });
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a fresh QueryClient for each test to avoid state leaking between tests
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster, more predictable results
        retry: false,
        // Disable caching to ensure fresh data in each test
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Provider wrapper that includes all app providers.
 * Extend this as new providers are added to the app.
 */
function AllProviders({ children }: AllProvidersProps): ReactElement {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with all providers.
 * Use this instead of the default render from @testing-library/react.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Render with user event setup for simulating user interactions.
 * This is the recommended approach for testing user interactions.
 *
 * Usage:
 * const { user } = renderWithUser(<MyComponent />);
 * await user.click(screen.getByRole('button'));
 */
function renderWithUser(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  return {
    user: userEvent.setup(),
    ...customRender(ui, options),
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the render function with our custom one
export { customRender as render, renderWithUser };

// Export userEvent for convenience
export { userEvent };

// Export test utilities
export { createTestQueryClient };
