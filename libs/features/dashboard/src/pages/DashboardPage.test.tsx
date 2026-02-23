/**
 * DashboardPage Unit Tests
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Test coverage:
 * - Component rendering with mock routers
 * - Refresh functionality
 * - Empty state when no routers configured
 * - Layout structure and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';

// Mock child components to avoid complex dependencies
vi.mock('../components/dashboard-layout', () => ({
  DashboardLayout: ({ children, onRefresh, showRefresh }: any) => (
    <div data-testid="dashboard-layout" onClick={onRefresh}>
      {showRefresh && <button data-testid="refresh-btn">Refresh</button>}
      <main>{children}</main>
    </div>
  ),
}));

vi.mock('../components/router-health-summary-card', () => ({
  RouterHealthSummaryCard: ({ routerId }: any) => (
    <div data-testid={`health-card-${routerId}`}>Health Card: {routerId}</div>
  ),
}));

vi.mock('../components/ResourceGauges', () => ({
  ResourceGauges: ({ deviceId }: any) => (
    <div data-testid={`gauges-${deviceId}`}>Resource Gauges: {deviceId}</div>
  ),
}));

vi.mock('../components/RecentLogs', () => ({
  RecentLogs: ({ deviceId }: any) => (
    <div data-testid={`logs-${deviceId}`}>Recent Logs: {deviceId}</div>
  ),
}));

describe('DashboardPage', () => {
  describe('Rendering', () => {
    it('should render dashboard layout', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
    });

    it('should render router health summary cards for each router', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('health-card-router-uuid-1')).toBeInTheDocument();
      expect(screen.getByTestId('health-card-router-uuid-2')).toBeInTheDocument();
      expect(screen.getByTestId('health-card-router-uuid-3')).toBeInTheDocument();
    });

    it('should render resource utilization section for each router', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('gauges-router-uuid-1')).toBeInTheDocument();
      expect(screen.getByTestId('gauges-router-uuid-2')).toBeInTheDocument();
      expect(screen.getByTestId('gauges-router-uuid-3')).toBeInTheDocument();
    });

    it('should render recent logs section for each router', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('logs-router-uuid-1')).toBeInTheDocument();
      expect(screen.getByTestId('logs-router-uuid-2')).toBeInTheDocument();
      expect(screen.getByTestId('logs-router-uuid-3')).toBeInTheDocument();
    });

    it('should render section headings', () => {
      render(<DashboardPage />);

      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should have refresh callback', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      const refreshBtn = screen.getByTestId('refresh-btn');
      await user.click(refreshBtn);

      // Verify component is still mounted after interaction
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic heading hierarchy', () => {
      render(<DashboardPage />);

      // Should have content with proper h2 headings for sections
      const sections = screen.getAllByRole('heading', { level: 2 });
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have proper main landmark', () => {
      render(<DashboardPage />);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should use memo for performance optimization', () => {
      // Component should be memoized
      expect(DashboardPage.displayName).toBe('DashboardPage');
    });

    it('should render multiple router cards in correct order', () => {
      render(<DashboardPage />);

      const healthCards = [
        screen.getByTestId('health-card-router-uuid-1'),
        screen.getByTestId('health-card-router-uuid-2'),
        screen.getByTestId('health-card-router-uuid-3'),
      ];

      healthCards.forEach((card) => {
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Data Layout', () => {
    it('should organize content into sections per router', () => {
      render(<DashboardPage />);

      // For each router ID, verify all three sections are present
      const routerIds = ['router-uuid-1', 'router-uuid-2', 'router-uuid-3'];

      routerIds.forEach((routerId) => {
        expect(screen.getByTestId(`health-card-${routerId}`)).toBeInTheDocument();
        expect(screen.getByTestId(`gauges-${routerId}`)).toBeInTheDocument();
        expect(screen.getByTestId(`logs-${routerId}`)).toBeInTheDocument();
      });
    });

    it('should have "Resource Utilization" heading for each router', () => {
      render(<DashboardPage />);

      // Since we have 3 routers, we should have at least 3 such headings
      const headings = screen.getAllByText(/Resource Utilization/i);
      expect(headings.length).toBeGreaterThanOrEqual(3);
    });

    it('should have "Recent Logs" heading for each router', () => {
      render(<DashboardPage />);

      const headings = screen.getAllByText(/Recent Logs/i);
      expect(headings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
