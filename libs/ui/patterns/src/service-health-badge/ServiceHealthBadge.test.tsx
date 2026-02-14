import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServiceHealthBadge } from './ServiceHealthBadge';
import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

describe('ServiceHealthBadge', () => {
  it('should render desktop variant for desktop platform', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 25,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    const { container } = render(<ServiceHealthBadge health={health} />);

    // Desktop variant should show full metrics
    expect(container.querySelector('.text-xs')).toBeTruthy();
  });

  it('should render mobile variant for mobile platform', () => {
    // Override platform mock for this test
    const { usePlatform } = require('@nasnet/ui/layouts');
    usePlatform.mockReturnValue('mobile');

    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 25,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    render(<ServiceHealthBadge health={health} />);

    // Mobile variant should only show dot (no detailed metrics)
    expect(screen.queryByText('Process:')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ServiceHealthBadge health={null} loading={true} />);

    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('should show healthy state with metrics', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 42,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    render(<ServiceHealthBadge health={health} />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Process:')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.getByText('Connection:')).toBeInTheDocument();
    expect(screen.getByText('CONNECTED')).toBeInTheDocument();
    expect(screen.getByText('Latency:')).toBeInTheDocument();
    expect(screen.getByText('42ms')).toBeInTheDocument();
  });

  it('should show unhealthy state with failure count', () => {
    const health: ServiceInstanceHealth = {
      status: 'UNHEALTHY',
      processAlive: false,
      connectionStatus: 'FAILED',
      latencyMs: null,
      lastHealthy: '2024-01-15T09:00:00Z',
      consecutiveFails: 5,
      uptimeSeconds: 0,
    };

    render(<ServiceHealthBadge health={health} />);

    expect(screen.getByText(/Unhealthy/)).toBeInTheDocument();
    expect(screen.getByText(/5 failures/)).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('should show warning for consecutive failures', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 45,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 2, // Has failures but not critical
      uptimeSeconds: 3600,
    };

    render(<ServiceHealthBadge health={health} />);

    expect(screen.getByText(/2 consecutive failures detected/)).toBeInTheDocument();
  });

  it('should show uptime when available', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 30,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 7200, // 2 hours
    };

    render(<ServiceHealthBadge health={health} />);

    expect(screen.getByText('Uptime:')).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });

  it('should show last healthy timestamp', () => {
    const health: ServiceInstanceHealth = {
      status: 'UNHEALTHY',
      processAlive: false,
      connectionStatus: 'FAILED',
      latencyMs: null,
      lastHealthy: '2024-01-15T09:00:00Z',
      consecutiveFails: 3,
      uptimeSeconds: 0,
    };

    render(<ServiceHealthBadge health={health} />);

    expect(screen.getByText('Last Healthy:')).toBeInTheDocument();
  });

  it('should animate when animate prop is true', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 25,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    const { container } = render(<ServiceHealthBadge health={health} animate />);

    // Animation class should be present
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should apply custom className', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 25,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    const { container } = render(
      <ServiceHealthBadge health={health} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('should handle unknown state gracefully', () => {
    render(<ServiceHealthBadge health={null} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

describe('ServiceHealthBadge - Subscription Integration', () => {
  it('should update display when health status changes via subscription', async () => {
    // Initial healthy state
    const initialHealth: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 25,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    const { rerender } = render(<ServiceHealthBadge health={initialHealth} />);

    // Verify initial healthy state
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();

    // Simulate subscription update with unhealthy state
    const updatedHealth: ServiceInstanceHealth = {
      status: 'UNHEALTHY',
      processAlive: false,
      connectionStatus: 'FAILED',
      latencyMs: null,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 3,
      uptimeSeconds: 0,
    };

    rerender(<ServiceHealthBadge health={updatedHealth} />);

    // Verify updated unhealthy state
    expect(screen.getByText(/Unhealthy/)).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.getByText(/3 failures/)).toBeInTheDocument();

    // Simulate recovery via subscription
    const recoveredHealth: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 30,
      lastHealthy: new Date().toISOString(),
      consecutiveFails: 0,
      uptimeSeconds: 60,
    };

    rerender(<ServiceHealthBadge health={recoveredHealth} />);

    // Verify recovery
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.queryByText(/failures/)).not.toBeInTheDocument();
  });
});
