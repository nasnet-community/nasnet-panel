/**
 * Router Status Component Tests
 *
 * Comprehensive tests for the Router Status component including:
 * - Hook tests (state transitions, reconnection logic)
 * - Subscription mock tests
 * - Component interaction tests
 * - Platform presenter switching tests
 * - Accessibility tests (axe-core)
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */

import type { ReactNode } from 'react';

import { MockedProvider } from '@apollo/client/testing';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { RouterStatusDesktop } from './router-status-desktop';
import { RouterStatusMobile } from './router-status-mobile';
import { StatusIndicator } from './status-indicator';
import {
  ROUTER_STATUS_CHANGED_SUBSCRIPTION,
  useRouterStatusSubscription,
} from './use-router-status-subscription';

import type { ConnectionStatus, RouterStatusData, UseRouterStatusReturn } from './types';
import type { MockedResponse } from '@apollo/client/testing';


// Note: vitest-axe matchers are extended in setup.ts

// ===== Mock Data Helpers =====

const createMockRouterData = (
  status: ConnectionStatus,
  overrides: Partial<RouterStatusData> = {}
): RouterStatusData => ({
  status,
  protocol: 'REST_API',
  latencyMs: 45,
  model: 'hAP ac3',
  version: '7.12.1',
  uptime: '5d 12h 34m',
  lastConnected: new Date(),
  reconnectAttempt: 0,
  maxReconnectAttempts: 5,
  ...overrides,
});

const createMockState = (
  status: ConnectionStatus,
  overrides: Partial<UseRouterStatusReturn> = {}
): UseRouterStatusReturn => {
  const data = createMockRouterData(status, overrides.data);

  return {
    data,
    loading: false,
    error: null,
    isOnline: status === 'CONNECTED',
    statusLabel:
      status === 'CONNECTED'
        ? 'Connected'
        : status === 'CONNECTING'
          ? 'Connecting...'
          : status === 'DISCONNECTED'
            ? 'Disconnected'
            : 'Error',
    lastSeenRelative: status !== 'CONNECTED' ? '30 seconds ago' : null,
    refresh: vi.fn().mockResolvedValue(undefined),
    reconnect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    cancelReconnect: vi.fn(),
    ...overrides,
  };
};

const createSubscriptionMock = (
  routerId: string,
  status: ConnectionStatus = 'CONNECTED'
): MockedResponse => ({
  request: {
    query: ROUTER_STATUS_CHANGED_SUBSCRIPTION,
    variables: { routerId },
  },
  result: {
    data: {
      routerStatusChanged: {
        router: {
          id: routerId,
          name: 'Main Router',
          host: '192.168.1.1',
          port: 8728,
          status,
          platform: 'MIKROTIK',
          model: 'hAP ac3',
          version: '7.12.1',
          uptime: '5d 12h 34m',
          lastConnected: new Date().toISOString(),
        },
        previousStatus: 'DISCONNECTED',
        newStatus: status,
        timestamp: new Date().toISOString(),
      },
    },
  },
});

// Apollo Provider wrapper
const createApolloWrapper =
  (mocks: MockedResponse[]) =>
  ({ children }: { children: ReactNode }) =>
    (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

// ===== StatusIndicator Tests =====

describe('StatusIndicator', () => {
  it('renders with correct status color for CONNECTED', () => {
    render(<StatusIndicator status="CONNECTED" />);
    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('bg-semantic-success');
  });

  it('renders with correct status color for CONNECTING', () => {
    render(<StatusIndicator status="CONNECTING" />);
    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('bg-semantic-warning');
  });

  it('renders with correct status color for DISCONNECTED', () => {
    render(<StatusIndicator status="DISCONNECTED" />);
    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('bg-gray-400');
  });

  it('renders with correct status color for ERROR', () => {
    render(<StatusIndicator status="ERROR" />);
    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('bg-semantic-error');
  });

  it('applies pulse animation for CONNECTING status', () => {
    render(<StatusIndicator status="CONNECTING" animated />);
    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('animate-pulse');
  });

  it('does not apply animation when animated=false', () => {
    render(<StatusIndicator status="CONNECTING" animated={false} />);
    const indicator = screen.getByRole('img');
    expect(indicator).not.toHaveClass('animate-pulse');
  });

  it('does not apply animation for non-CONNECTING status', () => {
    render(<StatusIndicator status="CONNECTED" animated />);
    const indicator = screen.getByRole('img');
    expect(indicator).not.toHaveClass('animate-pulse');
  });

  it('renders correct size classes', () => {
    const { rerender } = render(<StatusIndicator status="CONNECTED" size="sm" />);
    expect(screen.getByRole('img')).toHaveClass('h-3', 'w-3');

    rerender(<StatusIndicator status="CONNECTED" size="md" />);
    expect(screen.getByRole('img')).toHaveClass('h-4', 'w-4');

    rerender(<StatusIndicator status="CONNECTED" size="lg" />);
    expect(screen.getByRole('img')).toHaveClass('h-6', 'w-6');
  });

  it('has accessible aria-label', () => {
    render(<StatusIndicator status="CONNECTED" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Router is connected');
  });

  it('accepts custom aria-label', () => {
    render(<StatusIndicator status="CONNECTED" aria-label="Custom label" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Custom label');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<StatusIndicator status="CONNECTED" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ===== RouterStatusDesktop Tests =====

describe('RouterStatusDesktop', () => {
  it('renders connected state with all details', () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusDesktop state={state} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('REST API')).toBeInTheDocument();
    expect(screen.getByText('45ms')).toBeInTheDocument();
    expect(screen.getByText('hAP ac3')).toBeInTheDocument();
    expect(screen.getByText('RouterOS 7.12.1')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    const state = createMockState('CONNECTED', { loading: true });
    const { container } = render(<RouterStatusDesktop state={state} />);

    // Should have skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state with retry button', async () => {
    const state = createMockState('ERROR', {
      error: new Error('Connection timeout'),
    });
    render(<RouterStatusDesktop state={state} />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Connection timeout')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);
    expect(state.reconnect).toHaveBeenCalled();
  });

  it('shows reconnect attempts when connecting', () => {
    const state = createMockState('CONNECTING', {
      data: createMockRouterData('CONNECTING', { reconnectAttempt: 2 }),
    });
    render(<RouterStatusDesktop state={state} />);

    expect(screen.getByText(/attempt 2 of 5/i)).toBeInTheDocument();
  });

  it('shows last connected time when disconnected', () => {
    const state = createMockState('DISCONNECTED', {
      lastSeenRelative: '30 seconds ago',
    });
    render(<RouterStatusDesktop state={state} />);

    expect(screen.getByText(/last connected: 30 seconds ago/i)).toBeInTheDocument();
  });

  it('opens action menu and calls refresh', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusDesktop state={state} />);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    await userEvent.click(menuButton);

    const refreshItem = await screen.findByText('Refresh Status');
    await userEvent.click(refreshItem);
    expect(state.refresh).toHaveBeenCalled();
  });

  it('shows disconnect option when connected', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusDesktop state={state} />);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    await userEvent.click(menuButton);

    const disconnectItem = await screen.findByText('Disconnect');
    await userEvent.click(disconnectItem);
    expect(state.disconnect).toHaveBeenCalled();
  });

  it('shows reconnect option when disconnected', async () => {
    const state = createMockState('DISCONNECTED');
    render(<RouterStatusDesktop state={state} />);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    await userEvent.click(menuButton);

    const reconnectItem = await screen.findByText('Reconnect');
    await userEvent.click(reconnectItem);
    expect(state.reconnect).toHaveBeenCalled();
  });

  it('shows cancel option when connecting', async () => {
    const state = createMockState('CONNECTING', {
      data: createMockRouterData('CONNECTING', { reconnectAttempt: 1 }),
    });
    render(<RouterStatusDesktop state={state} />);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    await userEvent.click(menuButton);

    const cancelItem = await screen.findByText('Cancel Reconnect');
    await userEvent.click(cancelItem);
    expect(state.cancelReconnect).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const state = createMockState('CONNECTED');
    const { container } = render(<RouterStatusDesktop state={state} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ===== RouterStatusMobile Tests =====

describe('RouterStatusMobile', () => {
  it('renders compact badge with status', () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusMobile state={state} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    const state = createMockState('CONNECTED', { loading: true });
    const { container } = render(<RouterStatusMobile state={state} />);

    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows reconnect attempt count in badge when connecting', () => {
    const state = createMockState('CONNECTING', {
      data: createMockRouterData('CONNECTING', { reconnectAttempt: 3 }),
    });
    render(<RouterStatusMobile state={state} />);

    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('opens bottom sheet on tap', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusMobile state={state} />);

    const badge = screen.getByRole('button', { name: /router status/i });
    await userEvent.click(badge);

    // Sheet should be open with full details
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('REST API')).toBeInTheDocument();
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('has 44px minimum touch target', () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusMobile state={state} />);

    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('min-h-[44px]', 'min-w-[44px]');
  });

  it('calls disconnect and closes sheet when connected', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusMobile state={state} />);

    // Open sheet
    await userEvent.click(screen.getByRole('button', { name: /router status/i }));

    // Click disconnect
    const disconnectButton = await screen.findByRole('button', { name: /disconnect/i });
    await userEvent.click(disconnectButton);

    expect(state.disconnect).toHaveBeenCalled();
  });

  it('calls reconnect when disconnected', async () => {
    const state = createMockState('DISCONNECTED');
    render(<RouterStatusMobile state={state} />);

    // Open sheet
    await userEvent.click(screen.getByRole('button', { name: /router status/i }));

    // Click reconnect
    const reconnectButton = await screen.findByRole('button', { name: /reconnect/i });
    await userEvent.click(reconnectButton);

    expect(state.reconnect).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const state = createMockState('CONNECTED');
    const { container } = render(<RouterStatusMobile state={state} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has focus ring for keyboard navigation', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusMobile state={state} />);

    const button = screen.getByRole('button', { name: /router status/i });
    expect(button).toHaveClass('focus:ring-2');
  });
});

// ===== useRouterStatusSubscription Tests =====

describe('useRouterStatusSubscription', () => {
  it('subscribes to router status changes', async () => {
    const mocks = [createSubscriptionMock('router-1', 'CONNECTED')];
    const wrapper = createApolloWrapper(mocks);

    const { result } = renderHook(() => useRouterStatusSubscription('router-1'), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.event).not.toBeNull();
    expect(result.current.event?.router.status).toBe('CONNECTED');
  });

  it('skips subscription when routerId is empty', () => {
    const mocks: MockedResponse[] = [];
    const wrapper = createApolloWrapper(mocks);

    const { result } = renderHook(() => useRouterStatusSubscription(''), {
      wrapper,
    });

    // Should not be loading when skipped
    expect(result.current.event).toBeNull();
  });

  it('returns error on subscription failure', async () => {
    const errorMock: MockedResponse = {
      request: {
        query: ROUTER_STATUS_CHANGED_SUBSCRIPTION,
        variables: { routerId: 'router-1' },
      },
      error: new Error('Subscription failed'),
    };

    const wrapper = createApolloWrapper([errorMock]);

    const { result } = renderHook(() => useRouterStatusSubscription('router-1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});

// ===== Status Transition Tests =====

describe('Status Transitions', () => {
  it('transitions from CONNECTED to DISCONNECTED', () => {
    const { rerender } = render(
      <RouterStatusDesktop state={createMockState('CONNECTED')} />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();

    rerender(
      <RouterStatusDesktop
        state={createMockState('DISCONNECTED', {
          lastSeenRelative: '5 seconds ago',
        })}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('transitions from DISCONNECTED to CONNECTING', () => {
    const { rerender } = render(
      <RouterStatusDesktop state={createMockState('DISCONNECTED')} />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    rerender(
      <RouterStatusDesktop
        state={createMockState('CONNECTING', {
          data: createMockRouterData('CONNECTING', { reconnectAttempt: 1 }),
        })}
      />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('transitions from CONNECTING to CONNECTED', () => {
    const { rerender } = render(
      <RouterStatusDesktop
        state={createMockState('CONNECTING', {
          data: createMockRouterData('CONNECTING', { reconnectAttempt: 2 }),
        })}
      />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    rerender(
      <RouterStatusDesktop
        state={createMockState('CONNECTED', {
          data: createMockRouterData('CONNECTED', { reconnectAttempt: 0 }),
        })}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('transitions from CONNECTING to ERROR', () => {
    const { rerender } = render(
      <RouterStatusDesktop
        state={createMockState('CONNECTING', {
          data: createMockRouterData('CONNECTING', { reconnectAttempt: 5 }),
        })}
      />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    rerender(
      <RouterStatusDesktop
        state={createMockState('ERROR', {
          error: new Error('Max retries exceeded'),
        })}
      />
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
  });
});

// ===== Latency Display Tests =====

describe('Latency Display', () => {
  it('shows green for good latency (<100ms)', () => {
    const state = createMockState('CONNECTED', {
      data: createMockRouterData('CONNECTED', { latencyMs: 45 }),
    });
    render(<RouterStatusDesktop state={state} />);

    const latency = screen.getByText('45ms');
    expect(latency).toHaveClass('text-semantic-success');
  });

  it('shows amber for moderate latency (100-300ms)', () => {
    const state = createMockState('CONNECTED', {
      data: createMockRouterData('CONNECTED', { latencyMs: 200 }),
    });
    render(<RouterStatusDesktop state={state} />);

    const latency = screen.getByText('200ms');
    expect(latency).toHaveClass('text-semantic-warning');
  });

  it('shows red for poor latency (>300ms)', () => {
    const state = createMockState('CONNECTED', {
      data: createMockRouterData('CONNECTED', { latencyMs: 500 }),
    });
    render(<RouterStatusDesktop state={state} />);

    const latency = screen.getByText('500ms');
    expect(latency).toHaveClass('text-semantic-error');
  });
});

// ===== Keyboard Navigation Tests =====

describe('Keyboard Navigation', () => {
  it('action menu is keyboard accessible', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusDesktop state={state} />);

    const menuButton = screen.getByRole('button', { name: /actions/i });

    // Focus and open with Enter
    menuButton.focus();
    await userEvent.keyboard('{Enter}');

    // Menu should be open
    expect(await screen.findByText('Refresh Status')).toBeInTheDocument();

    // Navigate with arrow keys and select
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(state.refresh).toHaveBeenCalled();
  });

  it('mobile badge can be activated with Enter', async () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusMobile state={state} />);

    const badge = screen.getByRole('button', { name: /router status/i });
    badge.focus();
    await userEvent.keyboard('{Enter}');

    // Sheet should open
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

// ===== Focus Management Tests =====

describe('Focus Management', () => {
  it('maintains focus visibility with ring', () => {
    const state = createMockState('CONNECTED');
    render(<RouterStatusDesktop state={state} />);

    const menuButton = screen.getByRole('button', { name: /actions/i });
    expect(menuButton).toHaveClass('focus:ring-2', 'focus:ring-primary');
  });
});
