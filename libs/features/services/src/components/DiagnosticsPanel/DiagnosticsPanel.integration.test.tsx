/**
 * Integration tests for DiagnosticsPanel
 * Tests diagnostic execution flow with MSW mocks
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import { ApolloProvider, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { DiagnosticsPanel } from './DiagnosticsPanel';

// Mock usePlatform to return desktop
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

// Create MSW server
const server = setupServer();

// Mock diagnostic history
const mockHistory = {
  diagnosticHistory: [
    {
      instanceID: 'instance-1',
      runGroupID: 'run-1',
      results: [
        {
          id: 'result-1',
          instanceID: 'instance-1',
          testName: 'process_health',
          status: 'PASS',
          message: 'Process is running',
          details: 'PID: 1234, Memory: 50MB',
          durationMs: 100,
          runGroupID: 'run-1',
          metadata: null,
          errorMessage: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'result-2',
          instanceID: 'instance-1',
          testName: 'tor_socks5',
          status: 'FAIL',
          message: 'SOCKS5 proxy not responding',
          details: 'Connection timeout after 5s',
          durationMs: 5000,
          runGroupID: 'run-1',
          metadata: null,
          errorMessage: 'Connection timed out',
          createdAt: '2024-01-01T00:00:01Z',
        },
      ],
      overallStatus: 'FAIL',
      passedCount: 1,
      failedCount: 1,
      warningCount: 0,
      totalTests: 2,
      timestamp: '2024-01-01T00:00:00Z',
    },
  ],
};

// Mock run diagnostics response
const mockRunResult = {
  runServiceDiagnostics: {
    success: true,
    results: [
      {
        id: 'result-3',
        instanceID: 'instance-1',
        testName: 'process_health',
        status: 'PASS',
        message: 'Process is running',
        details: null,
        durationMs: 50,
        runGroupID: 'run-2',
        metadata: null,
        errorMessage: null,
        createdAt: '2024-01-01T00:05:00Z',
      },
    ],
    runGroupID: 'run-2',
    errors: null,
  },
};

describe('DiagnosticsPanel Integration', () => {
  let apolloClient: ApolloClient<any>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });

    // Setup Apollo Client
    const httpLink = new HttpLink({
      uri: 'http://localhost:8080/graphql',
    });

    apolloClient = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should load and display diagnostic history', async () => {
    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({ data: mockHistory });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1 passed, 1 failed/i)).toBeInTheDocument();
  });

  it('should display startup failure alert', async () => {
    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({ data: mockHistory });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/startup failures detected/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/1 diagnostic test\(s\) failed during service startup/i)
    ).toBeInTheDocument();
  });

  it('should expand and show test details', async () => {
    const user = userEvent.setup();

    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({ data: mockHistory });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
    });

    // Expand the diagnostic run
    const runTrigger = screen.getByText(/2024-01-01/i).closest('button');
    if (runTrigger) {
      await user.click(runTrigger);
    }

    // Wait for test results to appear
    await waitFor(() => {
      expect(screen.getByText('process_health')).toBeInTheDocument();
      expect(screen.getByText('tor_socks5')).toBeInTheDocument();
    });

    // Expand failed test
    const failedTest = screen.getByText('tor_socks5').closest('button');
    if (failedTest) {
      await user.click(failedTest);
    }

    // Check for error details
    await waitFor(() => {
      expect(screen.getByText('Connection timed out')).toBeInTheDocument();
    });
  });

  it('should run diagnostics', async () => {
    const user = userEvent.setup();

    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({
          data: { diagnosticHistory: [] },
        });
      }),
      graphql.mutation('RunServiceDiagnostics', () => {
        return HttpResponse.json({ data: mockRunResult });
      })
    );

    const onComplete = vi.fn();

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
          onDiagnosticsComplete={onComplete}
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no diagnostic history available/i)).toBeInTheDocument();
    });

    // Click Run Diagnostics button
    const runButton = screen.getByRole('button', { name: /run diagnostics/i });
    await user.click(runButton);

    // Wait for completion
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(mockRunResult.runServiceDiagnostics.results);
    });
  });

  it('should show progress during test execution', async () => {
    const user = userEvent.setup();

    let isRunning = false;

    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({
          data: { diagnosticHistory: [] },
        });
      }),
      graphql.mutation('RunServiceDiagnostics', async () => {
        isRunning = true;
        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        isRunning = false;
        return HttpResponse.json({ data: mockRunResult });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /run diagnostics/i })).toBeInTheDocument();
    });

    const runButton = screen.getByRole('button', { name: /run diagnostics/i });
    await user.click(runButton);

    // Button should show "Running..."
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /running\.\.\./i })).toBeInTheDocument();
    });
  });

  it('should handle empty history state', async () => {
    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({
          data: { diagnosticHistory: [] },
        });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no diagnostic history available/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/click "run diagnostics" to start/i)
    ).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({
          errors: [{ message: 'Failed to fetch diagnostic history' }],
        });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch diagnostic history/i)).toBeInTheDocument();
    });
  });

  it('should refresh diagnostic history', async () => {
    const user = userEvent.setup();
    let refreshCount = 0;

    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        refreshCount++;
        return HttpResponse.json({ data: mockHistory });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
    });

    const initialRefreshCount = refreshCount;

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(refreshCount).toBeGreaterThan(initialRefreshCount);
    });
  });

  it('should display pass/fail indicators correctly', async () => {
    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({ data: mockHistory });
      })
    );

    const { container } = render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
    });

    // Expand run to see test results
    const runTrigger = screen.getByText(/2024-01-01/i).closest('button');
    if (runTrigger) {
      await userEvent.setup().click(runTrigger);
    }

    await waitFor(() => {
      // Check for test names
      expect(screen.getByText('process_health')).toBeInTheDocument();
      expect(screen.getByText('tor_socks5')).toBeInTheDocument();
    });
  });

  it('should handle accessibility', async () => {
    server.use(
      graphql.query('GetDiagnosticHistory', () => {
        return HttpResponse.json({ data: mockHistory });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <DiagnosticsPanel
          routerId="router-1"
          instanceId="instance-1"
          serviceName="tor"
        />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
    });

    // Check ARIA labels and roles
    const runButton = screen.getByRole('button', { name: /run diagnostics/i });
    expect(runButton).toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });
});
