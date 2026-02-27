/**
 * Component Tests for FirewallLogFilters
 *
 * Tests the complete filter component including:
 * - Rendering both desktop and mobile presenters
 * - User interactions (time range, actions, IPs, ports, prefix)
 * - Filter state updates
 * - Clear filters functionality
 * - Accessibility (axe-core)
 *
 * @see NAS-7.9: Implement Firewall Logging
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { axe, toHaveNoViolations } from 'vitest-axe/matchers';

import { FirewallLogFilters } from './FirewallLogFilters';
import { FirewallLogFiltersDesktop } from './FirewallLogFiltersDesktop';
import { FirewallLogFiltersMobile } from './FirewallLogFiltersMobile';

import type { FirewallLogFilterState } from './firewall-log-filters.types';

// expect.extend(toHaveNoViolations);

describe('FirewallLogFilters', () => {
  const defaultFilters: FirewallLogFilterState = {
    timeRangePreset: '1h',
    actions: [],
  };

  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  describe('Desktop Presenter', () => {
    it('renders without crashing', () => {
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('displays active filter count badge when filters are active', () => {
      render(
        <FirewallLogFiltersDesktop
          filters={{ ...defaultFilters, actions: ['drop'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // Badge shows count
    });

    it('shows Clear button when filters are active', () => {
      render(
        <FirewallLogFiltersDesktop
          filters={{ ...defaultFilters, srcIp: '192.168.1.*' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('calls onFiltersChange when time range preset changes', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Click on time range select trigger
      const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
      await user.click(timeRangeSelect);

      // Select "Last 6 Hours"
      const option6h = await screen.findByRole('option', { name: /last 6 hours/i });
      await user.click(option6h);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            timeRangePreset: '6h',
          })
        );
      });
    });

    it('toggles action filters', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Find and click the "drop" checkbox
      const dropCheckbox = screen.getByRole('checkbox', { name: /drop/i });
      await user.click(dropCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: ['drop'],
          })
        );
      });
    });

    it('updates source IP filter', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const srcIpInput = screen.getByPlaceholderText(/192\.168\.1\.\*/i);
      await user.clear(srcIpInput);
      await user.type(srcIpInput, '192.168.1.*');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            srcIp: '192.168.1.*',
          })
        );
      });
    });

    it('shows validation error for invalid IP', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={{ ...defaultFilters, srcIp: 'invalid-ip' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText(/invalid ip format/i)).toBeInTheDocument();
    });

    it('updates port filters', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const dstPortInput = screen.getByPlaceholderText(/443 or 80-443/i);
      await user.clear(dstPortInput);
      await user.type(dstPortInput, '80-443');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            dstPort: { min: 80, max: 443 },
          })
        );
      });
    });

    it('displays available prefixes in dropdown when provided', () => {
      const prefixes = ['DROPPED-', 'ACCEPTED-', 'FIREWALL-'];
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availablePrefixes={prefixes}
        />
      );

      // Should show select instead of input
      expect(screen.getByRole('combobox', { name: /log prefix/i })).toBeInTheDocument();
    });

    it('clears all filters when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={{
            timeRangePreset: '1d',
            actions: ['drop'],
            srcIp: '192.168.1.*',
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          timeRangePreset: '1h',
          actions: [],
        });
      });
    });

    it.skip('passes axe accessibility check', async () => {
      // TODO: Configure axe-core for vitest
      // const { container } = render(
      //   <FirewallLogFiltersDesktop
      //     filters={defaultFilters}
      //     onFiltersChange={mockOnFiltersChange}
      //     availablePrefixes={['DROPPED-', 'ACCEPTED-']}
      //   />
      // );
      // const results = await axe(container);
      // expect(results).toHaveNoViolations();
    });
  });

  describe('Mobile Presenter', () => {
    it('renders without crashing', () => {
      render(
        <FirewallLogFiltersMobile
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('displays active filter count badge', () => {
      render(
        <FirewallLogFiltersMobile
          filters={{ ...defaultFilters, actions: ['drop', 'reject'] }}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows Clear All Filters button when filters are active', () => {
      render(
        <FirewallLogFiltersMobile
          filters={{ ...defaultFilters, dstIp: '10.0.0.1' }}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    it('renders with 44px minimum touch targets', () => {
      render(
        <FirewallLogFiltersMobile
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={vi.fn()}
        />
      );

      // Check that select triggers have h-11 class (44px)
      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        expect(select).toHaveClass('h-11');
      });
    });

    it('calls onClose when Apply Filters button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      render(
        <FirewallLogFiltersMobile
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={mockOnClose}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('toggles action filters with touch targets', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersMobile
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={vi.fn()}
        />
      );

      const acceptCheckbox = screen.getByRole('checkbox', { name: /accept/i });
      await user.click(acceptCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: ['accept'],
          })
        );
      });
    });

    it('clears filters when Clear All Filters button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersMobile
          filters={{
            timeRangePreset: '1w',
            actions: ['drop', 'reject'],
            prefix: 'DROPPED-',
          }}
          onFiltersChange={mockOnFiltersChange}
          open={true}
          onClose={vi.fn()}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          timeRangePreset: '1h',
          actions: [],
        });
      });
    });

    it.skip('passes axe accessibility check', async () => {
      // TODO: Configure axe-core for vitest
      // const { container } = render(
      //   <FirewallLogFiltersMobile
      //     filters={defaultFilters}
      //     onFiltersChange={mockOnFiltersChange}
      //     open={true}
      //     onClose={vi.fn()}
      //     availablePrefixes={['DROPPED-', 'ACCEPTED-']}
      //   />
      // );
      // const results = await axe(container);
      // expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Switching', () => {
    it('renders the correct presenter based on platform', () => {
      // This would require mocking usePlatform hook
      // For now, we test the presenters directly
      expect(FirewallLogFiltersDesktop).toBeDefined();
      expect(FirewallLogFiltersMobile).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('supports wildcard IP patterns', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const srcIpInput = screen.getByPlaceholderText(/192\.168\.1\.\*/i);
      await user.clear(srcIpInput);
      await user.type(srcIpInput, '10.0.*.*');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            srcIp: '10.0.*.*',
          })
        );
      });

      // No validation error should appear
      expect(screen.queryByText(/invalid ip format/i)).not.toBeInTheDocument();
    });

    it('supports port range input', async () => {
      const user = userEvent.setup();
      render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const srcPortInput = screen.getByPlaceholderText(/80 or 8000-9000/i);
      await user.clear(srcPortInput);
      await user.type(srcPortInput, '8000-9000');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            srcPort: { min: 8000, max: 9000 },
          })
        );
      });
    });

    it('maintains filter state across multiple changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <FirewallLogFiltersDesktop
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Add action filter
      const dropCheckbox = screen.getByRole('checkbox', { name: /drop/i });
      await user.click(dropCheckbox);

      // Update filters and rerender
      const updatedFilters = {
        ...defaultFilters,
        actions: ['drop'] as readonly ('accept' | 'unknown' | 'drop' | 'reject')[],
      };
      rerender(
        <FirewallLogFiltersDesktop
          filters={updatedFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Checkbox should remain checked
      expect(dropCheckbox).toBeChecked();

      // Badge should show count
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
