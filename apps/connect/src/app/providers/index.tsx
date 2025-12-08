import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';

const queryClient = new QueryClient();

/**
 * Root providers for the application
 *
 * Combines all context providers in proper nesting order:
 * 1. ThemeProvider - Theme management (outermost)
 * 2. QueryClientProvider - TanStack Query for server state
 * 3. Future providers can be added here
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
