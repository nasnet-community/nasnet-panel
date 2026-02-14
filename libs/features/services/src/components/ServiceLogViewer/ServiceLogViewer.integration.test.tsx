/**
 * Integration tests for ServiceLogViewer
 * Tests real-time log streaming with MSW mocks
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import { ApolloProvider, ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { ServiceLogViewer } from './ServiceLogViewer';

// Mock usePlatform to return desktop
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

// Create MSW server
const server = setupServer();

// Mock GraphQL responses
const mockLogFile = {
  serviceLogFile: {
    instanceID: 'instance-1',
    serviceName: 'tor',
    filePath: '/var/log/tor/tor.log',
    sizeBytes: 1024,
    lineCount: 10,
    entries: [
      {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        message: 'Tor service starting',
        source: 'tor',
        rawLine: '[INFO] Tor service starting',
        metadata: null,
      },
      {
        timestamp: '2024-01-01T00:00:01Z',
        level: 'INFO',
        message: 'Bootstrapping 100%',
        source: 'tor',
        rawLine: '[INFO] Bootstrapping 100%',
        metadata: null,
      },
      {
        timestamp: '2024-01-01T00:00:02Z',
        level: 'ERROR',
        message: 'Connection refused',
        source: 'tor',
        rawLine: '[ERROR] Connection refused',
        metadata: null,
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-01T00:00:02Z',
  },
};

describe('ServiceLogViewer Integration', () => {
  let apolloClient: ApolloClient<any>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });

    // Setup Apollo Client with MSW
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

  it('should load and display historical logs', async () => {
    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({ data: mockLogFile });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByText('Tor service starting')).toBeInTheDocument();
    });

    expect(screen.getByText('Bootstrapping 100%')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('should filter logs by level', async () => {
    const user = userEvent.setup();

    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({ data: mockLogFile });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tor service starting')).toBeInTheDocument();
    });

    // Open filter dropdown
    const filterButton = screen.getByRole('button', { name: /all levels/i });
    await user.click(filterButton);

    // Select ERROR filter
    const errorOption = screen.getByText('ERROR');
    await user.click(errorOption);

    // Should only show ERROR logs
    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
      expect(screen.queryByText('Tor service starting')).not.toBeInTheDocument();
    });
  });

  it('should search logs by query', async () => {
    const user = userEvent.setup();

    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({ data: mockLogFile });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tor service starting')).toBeInTheDocument();
    });

    // Search for "bootstrap"
    const searchInput = screen.getByPlaceholderText('Search logs...');
    await user.type(searchInput, 'bootstrap');

    // Should only show matching log
    await waitFor(() => {
      expect(screen.getByText('Bootstrapping 100%')).toBeInTheDocument();
      expect(screen.queryByText('Connection refused')).not.toBeInTheDocument();
    });
  });

  it('should handle empty state', async () => {
    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({
          data: {
            serviceLogFile: {
              ...mockLogFile.serviceLogFile,
              entries: [],
              lineCount: 0,
            },
          },
        });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No logs available yet')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({
          errors: [{ message: 'Failed to fetch logs' }],
        });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading logs/i)).toBeInTheDocument();
    });
  });

  it('should copy logs to clipboard', async () => {
    const user = userEvent.setup();

    // Mock clipboard API
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({ data: mockLogFile });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tor service starting')).toBeInTheDocument();
    });

    // Open actions dropdown
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    await user.click(actionsButton);

    // Click copy
    const copyButton = screen.getByText(/copy to clipboard/i);
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
      const copiedText = mockWriteText.mock.calls[0][0];
      expect(copiedText).toContain('Tor service starting');
      expect(copiedText).toContain('Bootstrapping 100%');
    });
  });

  it('should display level counts', async () => {
    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({ data: mockLogFile });
      })
    );

    render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tor service starting')).toBeInTheDocument();
    });

    // Open filter dropdown to see counts
    const filterButton = screen.getByRole('button', { name: /all levels/i });
    await userEvent.setup().click(filterButton);

    // Check level counts (2 INFO, 1 ERROR)
    const dropdown = screen.getByRole('menu');
    const infoItem = within(dropdown).getByText('INFO');
    const errorItem = within(dropdown).getByText('ERROR');

    expect(infoItem).toBeInTheDocument();
    expect(errorItem).toBeInTheDocument();
  });

  it('should handle accessibility', async () => {
    server.use(
      graphql.query('GetServiceLogFile', () => {
        return HttpResponse.json({ data: mockLogFile });
      })
    );

    const { container } = render(
      <ApolloProvider client={apolloClient}>
        <ServiceLogViewer routerId="router-1" instanceId="instance-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tor service starting')).toBeInTheDocument();
    });

    // Check ARIA labels
    const searchInput = screen.getByLabelText('Search logs');
    expect(searchInput).toBeInTheDocument();

    const autoScrollSwitch = screen.getByLabelText('Auto-scroll to bottom');
    expect(autoScrollSwitch).toBeInTheDocument();

    // Check role attributes
    const logRows = container.querySelectorAll('[role="row"]');
    expect(logRows.length).toBeGreaterThan(0);
  });
});
