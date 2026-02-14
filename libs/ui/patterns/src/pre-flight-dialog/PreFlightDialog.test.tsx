/**
 * PreFlightDialog Unit Tests
 *
 * Tests for the PreFlightDialog pattern component.
 * Covers deficit calculation, selection logic, sufficiency check, and accessibility.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PreFlightDialog } from './PreFlightDialog';
import type { InsufficientResourcesError } from './types';
import { usePreFlightDialog } from './usePreFlightDialog';

describe('PreFlightDialog', () => {
  const mockError: InsufficientResourcesError = {
    resourceType: 'memory',
    required: 256,
    available: 200,
    deficit: 56,
    suggestions: [
      { id: '1', name: 'Tor', memoryUsage: 64, status: 'running', selected: false },
      { id: '2', name: 'Xray', memoryUsage: 32, status: 'running', selected: false },
      { id: '3', name: 'Psiphon', memoryUsage: 16, status: 'running', selected: false },
    ],
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    error: mockError,
    serviceName: 'AdGuard Home',
    onConfirmWithStops: vi.fn(),
  };

  describe('Component Rendering', () => {
    it('should render dialog when open', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      expect(screen.getByText('Insufficient Memory')).toBeInTheDocument();
      expect(screen.getByText(/AdGuard Home/)).toBeInTheDocument();
    });

    it('should display resource summary', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      expect(screen.getByText('256 MB')).toBeInTheDocument(); // Required
      expect(screen.getByText('200 MB')).toBeInTheDocument(); // Available
      expect(screen.getByText('56 MB')).toBeInTheDocument(); // Deficit
    });

    it('should render all service suggestions', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      expect(screen.getByText('Tor')).toBeInTheDocument();
      expect(screen.getByText('Xray')).toBeInTheDocument();
      expect(screen.getByText('Psiphon')).toBeInTheDocument();
    });

    it('should show memory values for each service', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      expect(screen.getByText('64 MB')).toBeInTheDocument(); // Tor
      expect(screen.getByText('32 MB')).toBeInTheDocument(); // Xray
      expect(screen.getByText('16 MB')).toBeInTheDocument(); // Psiphon
    });

    it('should render mobile variant with Sheet', () => {
      const { container } = render(
        <PreFlightDialog {...defaultProps} variant="mobile" />
      );

      // Mobile uses Sheet component
      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should render desktop variant with Dialog', () => {
      const { container } = render(
        <PreFlightDialog {...defaultProps} variant="desktop" />
      );

      // Desktop uses Dialog component
      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });
  });

  describe('Auto-Selection Logic', () => {
    it('should auto-select services to cover deficit on mount', () => {
      const TestComponent = () => {
        const state = usePreFlightDialog(defaultProps);
        return (
          <div>
            {state.suggestions.map((s) => (
              <div key={s.id} data-testid={`service-${s.id}`}>
                {s.selected ? 'selected' : 'not-selected'}
              </div>
            ))}
          </div>
        );
      };

      render(<TestComponent />);

      // Deficit is 56 MB (with 10% buffer = 61.6 MB)
      // Tor (64 MB) should be auto-selected to cover it
      expect(screen.getByTestId('service-1')).toHaveTextContent('selected');

      // Xray and Psiphon should not be selected (Tor alone is sufficient)
      expect(screen.getByTestId('service-2')).toHaveTextContent('not-selected');
      expect(screen.getByTestId('service-3')).toHaveTextContent('not-selected');
    });

    it('should auto-select multiple services if one is insufficient', () => {
      const largeDeficitError: InsufficientResourcesError = {
        resourceType: 'memory',
        required: 256,
        available: 100,
        deficit: 156,
        suggestions: [
          { id: '1', name: 'Service A', memoryUsage: 64, status: 'running', selected: false },
          { id: '2', name: 'Service B', memoryUsage: 64, status: 'running', selected: false },
          { id: '3', name: 'Service C', memoryUsage: 64, status: 'running', selected: false },
        ],
      };

      const TestComponent = () => {
        const state = usePreFlightDialog({
          ...defaultProps,
          error: largeDeficitError,
        });
        return (
          <div>
            <div data-testid="selected-count">{state.selectedCount}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Deficit is 156 MB (with 10% buffer = 171.6 MB)
      // Should auto-select at least 3 services (3 * 64 = 192 MB)
      expect(screen.getByTestId('selected-count')).toHaveTextContent('3');
    });
  });

  describe('Selection Interaction', () => {
    it('should toggle selection when checkbox is clicked', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      const checkbox = screen.getAllByRole('checkbox')[1]; // Second service (Xray)

      // Initially not selected (assuming Tor is auto-selected)
      expect(checkbox).not.toBeChecked();

      // Click to select
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Click to deselect
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should select all when "Select All" is clicked', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should clear all when "Clear All" is clicked', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      const clearAllButton = screen.getByText(/Clear/);
      fireEvent.click(clearAllButton);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Sufficiency Calculation', () => {
    it('should show sufficient when selection covers deficit', () => {
      const TestComponent = () => {
        const state = usePreFlightDialog(defaultProps);
        return (
          <div>
            <div data-testid="sufficient">{state.isSufficient ? 'yes' : 'no'}</div>
            <div data-testid="total-freed">{state.totalFreed}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Deficit is 56 MB (with 10% buffer = 61.6 MB)
      // Tor (64 MB) is auto-selected, which is sufficient
      expect(screen.getByTestId('sufficient')).toHaveTextContent('yes');
      expect(screen.getByTestId('total-freed')).toHaveTextContent('64');
    });

    it('should show insufficient when selection does not cover deficit', () => {
      const TestComponent = () => {
        const state = usePreFlightDialog(defaultProps);
        return (
          <div>
            <button onClick={state.clearAll}>Clear</button>
            <div data-testid="sufficient">{state.isSufficient ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Clear all selections
      fireEvent.click(screen.getByText('Clear'));

      // Should be insufficient
      expect(screen.getByTestId('sufficient')).toHaveTextContent('no');
    });

    it('should calculate remaining deficit correctly', () => {
      const TestComponent = () => {
        const state = usePreFlightDialog(defaultProps);
        return (
          <div>
            <button onClick={state.clearAll}>Clear</button>
            <button onClick={() => state.toggleSelection('3')}>Select Psiphon</button>
            <div data-testid="remaining">{state.remainingDeficit}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Clear all, then select only Psiphon (16 MB)
      fireEvent.click(screen.getByText('Clear'));
      fireEvent.click(screen.getByText('Select Psiphon'));

      // Deficit with buffer: 56 * 1.1 = 61.6 MB
      // Selected: 16 MB
      // Remaining: 61.6 - 16 = 45.6 MB (rounded to 46)
      const remaining = parseInt(screen.getByTestId('remaining').textContent || '0');
      expect(remaining).toBeGreaterThan(40);
      expect(remaining).toBeLessThan(50);
    });
  });

  describe('Action Callbacks', () => {
    it('should call onConfirmWithStops with selected IDs when confirmed', () => {
      const onConfirmWithStops = vi.fn();
      render(
        <PreFlightDialog
          {...defaultProps}
          onConfirmWithStops={onConfirmWithStops}
          variant="desktop"
        />
      );

      const confirmButton = screen.getByText(/Stop.*Start/);
      fireEvent.click(confirmButton);

      expect(onConfirmWithStops).toHaveBeenCalledTimes(1);
      expect(onConfirmWithStops).toHaveBeenCalledWith(['1']); // Tor is auto-selected
    });

    it('should call onOpenChange when cancelled', () => {
      const onOpenChange = vi.fn();
      render(
        <PreFlightDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
          variant="desktop"
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOverrideAndStart when override is clicked', () => {
      const onOverrideAndStart = vi.fn();
      render(
        <PreFlightDialog
          {...defaultProps}
          onOverrideAndStart={onOverrideAndStart}
          allowOverride={true}
          variant="desktop"
        />
      );

      const overrideButton = screen.getByText(/Override.*Start Anyway/);
      fireEvent.click(overrideButton);

      expect(onOverrideAndStart).toHaveBeenCalledTimes(1);
    });

    it('should not show override button when allowOverride is false', () => {
      render(
        <PreFlightDialog
          {...defaultProps}
          allowOverride={false}
          variant="desktop"
        />
      );

      expect(screen.queryByText(/Override.*Start Anyway/)).not.toBeInTheDocument();
    });

    it('should disable confirm button when insufficient', () => {
      const TestComponent = () => {
        const state = usePreFlightDialog(defaultProps);
        return (
          <div>
            <button onClick={state.clearAll}>Clear</button>
            <button onClick={state.handleConfirm} disabled={!state.isSufficient}>
              Confirm
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      // Clear all selections
      fireEvent.click(screen.getByText('Clear'));

      // Confirm button should be disabled
      expect(screen.getByText('Confirm')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      const { container } = render(
        <PreFlightDialog {...defaultProps} variant="desktop" />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should have accessible dialog title', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      expect(screen.getByText('Insufficient Memory')).toBeInTheDocument();
    });

    it('should have accessible checkboxes with labels', () => {
      render(<PreFlightDialog {...defaultProps} variant="desktop" />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3);

      // Each checkbox should have an associated label
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('id');
        const label = screen.getByLabelText(
          new RegExp(checkbox.getAttribute('id')?.replace('service-', '') || '')
        );
        expect(label).toBeInTheDocument();
      });
    });
  });

  describe('Value Formatting', () => {
    it('should format memory values with MB unit', () => {
      const TestComponent = () => {
        const state = usePreFlightDialog(defaultProps);
        return (
          <div>
            <div data-testid="required">{state.requiredText}</div>
            <div data-testid="available">{state.availableText}</div>
            <div data-testid="deficit">{state.deficitText}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('required')).toHaveTextContent('256 MB');
      expect(screen.getByTestId('available')).toHaveTextContent('200 MB');
      expect(screen.getByTestId('deficit')).toHaveTextContent('56 MB');
    });

    it('should round memory values to nearest integer', () => {
      const decimalError: InsufficientResourcesError = {
        resourceType: 'memory',
        required: 256.75,
        available: 200.25,
        deficit: 56.5,
        suggestions: [
          {
            id: '1',
            name: 'Service',
            memoryUsage: 64.8,
            status: 'running',
            selected: false,
          },
        ],
      };

      const TestComponent = () => {
        const state = usePreFlightDialog({
          ...defaultProps,
          error: decimalError,
        });
        return (
          <div>
            <div data-testid="required">{state.requiredText}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('required')).toHaveTextContent('257 MB');
    });
  });
});
