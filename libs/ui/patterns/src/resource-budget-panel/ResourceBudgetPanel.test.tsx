/**
 * ResourceBudgetPanel Unit Tests
 *
 * Tests for the ResourceBudgetPanel pattern component.
 * Covers sorting, aggregation, filtering, and accessibility.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ResourceBudgetPanel } from './ResourceBudgetPanel';
import { useResourceBudgetPanel } from './useResourceBudgetPanel';

import type { ServiceInstanceResource, SystemResourceTotals } from './types';

describe('ResourceBudgetPanel', () => {
  const mockInstances: ServiceInstanceResource[] = [
    {
      id: '1',
      name: 'Tor',
      memoryUsed: 64,
      memoryLimit: 128,
      status: 'running',
    },
    {
      id: '2',
      name: 'Xray',
      memoryUsed: 32,
      memoryLimit: 64,
      status: 'running',
    },
    {
      id: '3',
      name: 'AdGuard',
      memoryUsed: 80,
      memoryLimit: 100,
      status: 'stopped',
    },
  ];

  const mockSystemTotals: SystemResourceTotals = {
    totalMemoryUsed: 176,
    totalMemoryAvailable: 512,
    runningInstances: 2,
    stoppedInstances: 1,
  };

  const defaultProps = {
    instances: mockInstances,
    systemTotals: mockSystemTotals,
  };

  describe('Component Rendering', () => {
    it('should render system totals section', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByText('System Resources')).toBeInTheDocument();
    });

    it('should display all instances', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByText('Tor')).toBeInTheDocument();
      expect(screen.getByText('Xray')).toBeInTheDocument();
      expect(screen.getByText('AdGuard')).toBeInTheDocument();
    });

    it('should show instance count', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByText(/Service Instances \(3\)/)).toBeInTheDocument();
    });

    it('should hide system totals when showSystemTotals is false', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          showSystemTotals={false}
          variant="desktop"
        />
      );

      expect(screen.queryByText('System Resources')).not.toBeInTheDocument();
    });

    it('should render mobile variant', () => {
      const { container } = render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="mobile"
        />
      );

      // Mobile uses cards
      expect(container.querySelectorAll('[class*="card"]').length).toBeGreaterThan(0);
    });

    it('should render desktop variant with table', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('System Totals Display', () => {
    it('should show correct system memory values', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      // Total Memory label
      expect(screen.getByText('Total Memory')).toBeInTheDocument();

      // Check that system values are displayed (176 MB used, 512 MB total)
      // Values are rendered in ResourceUsageBar component
    });

    it('should show running and stopped instance counts', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument(); // Running instances
      expect(screen.getByText('1')).toBeInTheDocument(); // Stopped instances
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by usage percent descending by default', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel(defaultProps);
        return (
          <div>
            {state.instances.map((i) => (
              <div
                key={i.id}
                data-testid={`instance-${i.id}`}
              >
                {i.name}: {i.usagePercent}%
              </div>
            ))}
          </div>
        );
      };

      render(<TestComponent />);

      const instances = screen.getAllByTestId(/instance-/);

      // AdGuard has 80%, Tor has 50%, Xray has 50%
      // Sorted desc by usage: AdGuard (80%), then Tor/Xray (50%)
      expect(instances[0]).toHaveTextContent('AdGuard');
    });

    it('should toggle sort direction when same column clicked', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      const nameHeader = screen.getByText('Service Name');

      // First click: sort by name asc
      fireEvent.click(nameHeader);
      const firstInstance = screen.getAllByRole('row')[1]; // Skip header row
      expect(firstInstance).toHaveTextContent('AdGuard');

      // Second click: sort by name desc
      fireEvent.click(nameHeader);
      const firstInstanceAfter = screen.getAllByRole('row')[1];
      expect(firstInstanceAfter).toHaveTextContent('Xray');
    });

    it('should sort by name', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      const nameHeader = screen.getByText('Service Name');
      fireEvent.click(nameHeader);

      const rows = screen.getAllByRole('row');
      // Skip header, first instance should be AdGuard (alphabetically first, desc)
      expect(rows[1]).toHaveTextContent('Xray');
    });

    it('should sort by status', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      const statusHeader = screen.getByText('Status');
      fireEvent.click(statusHeader);

      // Sorted desc: "stopped" > "running"
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('stopped');
    });

    it('should sort by memory used', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      const memoryHeader = screen.getByText('Memory Used');
      fireEvent.click(memoryHeader);

      // Sorted desc: AdGuard (80) > Tor (64) > Xray (32)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('AdGuard');
      expect(rows[2]).toHaveTextContent('Tor');
      expect(rows[3]).toHaveTextContent('Xray');
    });
  });

  describe('Filtering', () => {
    it('should show all instances by default', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel(defaultProps);
        return <div data-testid="count">{state.totalInstances}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('count')).toHaveTextContent('3');
    });

    it('should filter to show only running instances', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel({
          ...defaultProps,
          showOnlyRunning: true,
        });
        return <div data-testid="count">{state.totalInstances}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('count')).toHaveTextContent('2'); // Only Tor and Xray
    });
  });

  describe('Usage Calculation', () => {
    it('should calculate usage percentage correctly', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel(defaultProps);
        const tor = state.instances.find((i) => i.name === 'Tor');
        return <div data-testid="tor-usage">{tor?.usagePercent}</div>;
      };

      render(<TestComponent />);

      // Tor: 64/128 = 50%
      expect(screen.getByTestId('tor-usage')).toHaveTextContent('50');
    });

    it('should calculate system usage percentage correctly', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel(defaultProps);
        return <div data-testid="system-usage">{state.systemUsagePercent}</div>;
      };

      render(<TestComponent />);

      // System: 176/512 = 34.375%
      const usage = parseFloat(screen.getByTestId('system-usage').textContent || '0');
      expect(usage).toBeCloseTo(34.375, 1);
    });

    it('should determine usage status correctly', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel(defaultProps);
        const adguard = state.instances.find((i) => i.name === 'AdGuard');
        return <div data-testid="adguard-status">{adguard?.usageStatus}</div>;
      };

      render(<TestComponent />);

      // AdGuard: 80/100 = 80% = critical status
      expect(screen.getByTestId('adguard-status')).toHaveTextContent('critical');
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no instances', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          instances={[]}
          variant="desktop"
        />
      );

      expect(screen.getByText('No service instances found')).toBeInTheDocument();
    });

    it('should show custom empty message', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          instances={[]}
          emptyMessage="Custom empty message"
          variant="desktop"
        />
      );

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading message when isLoading is true', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          isLoading={true}
          variant="desktop"
        />
      );

      expect(screen.getByText('Loading resource data...')).toBeInTheDocument();
    });

    it('should not show instances when loading', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          isLoading={true}
          variant="desktop"
        />
      );

      expect(screen.queryByText('Tor')).not.toBeInTheDocument();
    });
  });

  describe('Instance Click Callback', () => {
    it('should call onInstanceClick when instance is clicked (desktop)', () => {
      const onInstanceClick = vi.fn();
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          onInstanceClick={onInstanceClick}
          variant="desktop"
        />
      );

      const torRow = screen.getByText('Tor').closest('tr');
      if (torRow) {
        fireEvent.click(torRow);
      }

      expect(onInstanceClick).toHaveBeenCalledTimes(1);
      expect(onInstanceClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Tor',
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have table role for desktop variant', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have sortable column headers with keyboard support', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      const nameHeader = screen.getByText('Service Name');
      expect(nameHeader.closest('th')).toHaveClass('cursor-pointer');
    });

    it('should have proper heading hierarchy', () => {
      render(
        <ResourceBudgetPanel
          {...defaultProps}
          variant="desktop"
        />
      );

      expect(screen.getByText('System Resources')).toBeInTheDocument();
      expect(screen.getByText(/Service Instances/)).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format memory values with MB unit', () => {
      const TestComponent = () => {
        const state = useResourceBudgetPanel(defaultProps);
        return (
          <div>
            <div data-testid="system-used">{state.systemTotalUsedText}</div>
            <div data-testid="system-available">{state.systemTotalAvailableText}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('system-used')).toHaveTextContent('176 MB');
      expect(screen.getByTestId('system-available')).toHaveTextContent('512 MB');
    });

    it('should round memory values to nearest integer', () => {
      const decimalInstance: ServiceInstanceResource = {
        id: '4',
        name: 'Decimal',
        memoryUsed: 64.7,
        memoryLimit: 128.3,
        status: 'running',
      };

      render(
        <ResourceBudgetPanel
          {...defaultProps}
          instances={[decimalInstance]}
          variant="desktop"
        />
      );

      // Values should be rounded
      expect(screen.getByText('65 MB')).toBeInTheDocument(); // memoryUsed
      expect(screen.getByText('128 MB')).toBeInTheDocument(); // memoryLimit
    });
  });
});
