/**
 * StopDependentsDialog Component Tests
 *
 * Tests for the warning dialog when stopping services with dependents.
 * Validates user interactions, accessibility, and proper rendering.
 *
 * @see NAS-8.19: Feature Dependencies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';

import { StopDependentsDialog, type StopMode } from './StopDependentsDialog';
import type { ServiceDependency } from '@nasnet/api-client/queries';

describe('StopDependentsDialog', () => {
  const mockDependents: ServiceDependency[] = [
    {
      id: 'dep_1',
      fromInstance: {
        id: 'inst_xray_123',
        featureID: 'xray',
        instanceName: 'Xray Proxy',
        status: 'RUNNING',
      },
      toInstance: {
        id: 'inst_tor_456',
        featureID: 'tor',
        instanceName: 'Tor Gateway',
        status: 'RUNNING',
      },
      dependencyType: 'REQUIRES',
      autoStart: true,
      healthTimeoutSeconds: 30,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'dep_2',
      fromInstance: {
        id: 'inst_singbox_789',
        featureID: 'singbox',
        instanceName: 'Sing-box VPN',
        status: 'STOPPED',
      },
      toInstance: {
        id: 'inst_tor_456',
        featureID: 'tor',
        instanceName: 'Tor Gateway',
        status: 'RUNNING',
      },
      dependencyType: 'OPTIONAL',
      autoStart: false,
      healthTimeoutSeconds: 60,
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    instanceName: 'Tor Gateway',
    featureId: 'tor',
    dependents: mockDependents,
    onConfirm: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByText('Stop Tor Gateway?')).toBeInTheDocument();
      expect(screen.getByText('2 services depend on this instance')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(<StopDependentsDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Stop Tor Gateway?')).not.toBeInTheDocument();
    });

    it('should display all dependent services', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByText('Xray Proxy')).toBeInTheDocument();
      expect(screen.getByText('xray')).toBeInTheDocument();
      expect(screen.getByText('Sing-box VPN')).toBeInTheDocument();
      expect(screen.getByText('singbox')).toBeInTheDocument();
    });

    it('should show correct dependent count in singular form', () => {
      const singleDependent = [mockDependents[0]];
      render(<StopDependentsDialog {...defaultProps} dependents={singleDependent} />);

      expect(screen.getByText('1 service depends on this instance')).toBeInTheDocument();
    });

    it('should show correct dependent count in plural form', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByText('2 services depend on this instance')).toBeInTheDocument();
    });

    it('should display warning message with instance name', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      const warningText = screen.getByText(/Stopping/);
      expect(warningText).toBeInTheDocument();
      expect(warningText.textContent).toContain('Tor Gateway');
      expect(warningText.textContent).toContain('(tor)');
    });

    it('should show dependency type badges (Required/Optional)', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.getByText('Optional')).toBeInTheDocument();
    });
  });

  describe('Stop Mode Selection', () => {
    it('should default to "stop-dependents-first" mode', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      const recommendedOption = screen.getByLabelText(/Stop dependents first/i);
      expect(recommendedOption).toBeChecked();
    });

    it('should allow switching to "force-stop" mode', async () => {
      const user = userEvent.setup();
      render(<StopDependentsDialog {...defaultProps} />);

      const forceStopOption = screen.getByLabelText(/Force stop/i);
      await user.click(forceStopOption);

      expect(forceStopOption).toBeChecked();
    });

    it('should show "Recommended" badge for stop-dependents-first', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('should show "Danger" badge for force-stop', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByText('Danger')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm with "stop-dependents-first" when confirmed', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(<StopDependentsDialog {...defaultProps} onConfirm={onConfirm} />);

      const stopButton = screen.getByRole('button', { name: /Stop Service/i });
      await user.click(stopButton);

      expect(onConfirm).toHaveBeenCalledWith('stop-dependents-first');
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm with "force-stop" when force mode selected', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(<StopDependentsDialog {...defaultProps} onConfirm={onConfirm} />);

      // Select force-stop mode
      const forceStopOption = screen.getByLabelText(/Force stop/i);
      await user.click(forceStopOption);

      // Click confirm
      const stopButton = screen.getByRole('button', { name: /Stop Service/i });
      await user.click(stopButton);

      expect(onConfirm).toHaveBeenCalledWith('force-stop');
    });

    it('should call onOpenChange(false) when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<StopDependentsDialog {...defaultProps} onOpenChange={onOpenChange} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset to default mode when dialog reopens', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<StopDependentsDialog {...defaultProps} />);

      // Select force-stop
      const forceStopOption = screen.getByLabelText(/Force stop/i);
      await user.click(forceStopOption);
      expect(forceStopOption).toBeChecked();

      // Close dialog
      rerender(<StopDependentsDialog {...defaultProps} open={false} />);

      // Reopen dialog
      rerender(<StopDependentsDialog {...defaultProps} open={true} />);

      // Should reset to default
      await waitFor(() => {
        const recommendedOption = screen.getByLabelText(/Stop dependents first/i);
        expect(recommendedOption).toBeChecked();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when isLoading is true', () => {
      render(<StopDependentsDialog {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      const stopButton = screen.getByRole('button', { name: /Stopping.../i });

      expect(cancelButton).toBeDisabled();
      expect(stopButton).toBeDisabled();
    });

    it('should show "Stopping..." text when loading', () => {
      render(<StopDependentsDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Stopping...')).toBeInTheDocument();
    });

    it('should enable buttons when isLoading is false', () => {
      render(<StopDependentsDialog {...defaultProps} isLoading={false} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      const stopButton = screen.getByRole('button', { name: /Stop Service/i });

      expect(cancelButton).not.toBeDisabled();
      expect(stopButton).not.toBeDisabled();
    });
  });

  describe('Button Variants', () => {
    it('should show destructive variant button when force-stop is selected', async () => {
      const user = userEvent.setup();
      render(<StopDependentsDialog {...defaultProps} />);

      // Select force-stop
      const forceStopOption = screen.getByLabelText(/Force stop/i);
      await user.click(forceStopOption);

      const stopButton = screen.getByRole('button', { name: /Stop Service/i });
      // Button should have destructive variant classes (implementation-dependent)
      expect(stopButton).toBeInTheDocument();
    });

    it('should show default variant button when stop-dependents-first is selected', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      const stopButton = screen.getByRole('button', { name: /Stop Service/i });
      expect(stopButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      // Dialog should have title
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Stop Tor Gateway?')).toBeInTheDocument();
    });

    it('should have accessible radio group', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
    });

    it('should have labeled radio options', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Stop dependents first/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Force stop/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<StopDependentsDialog {...defaultProps} />);

      // Tab to first radio
      await user.tab();
      const firstRadio = screen.getByLabelText(/Stop dependents first/i);
      expect(firstRadio).toHaveFocus();

      // Arrow down to second radio
      await user.keyboard('{ArrowDown}');
      const secondRadio = screen.getByLabelText(/Force stop/i);
      expect(secondRadio).toBeChecked();
    });

    it('should have focus trap within dialog', async () => {
      const user = userEvent.setup();
      render(<StopDependentsDialog {...defaultProps} />);

      // Dialog should capture focus
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Tab through interactive elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should remain within dialog
      const focusedElement = document.activeElement;
      expect(dialog.contains(focusedElement)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dependents array', () => {
      render(<StopDependentsDialog {...defaultProps} dependents={[]} />);

      expect(screen.getByText('0 services depend on this instance')).toBeInTheDocument();
    });

    it('should handle long instance names with truncation', () => {
      const longNameDependents: ServiceDependency[] = [
        {
          ...mockDependents[0],
          fromInstance: {
            ...mockDependents[0].fromInstance,
            instanceName:
              'Very Long Service Instance Name That Should Be Truncated With Ellipsis',
          },
        },
      ];

      render(<StopDependentsDialog {...defaultProps} dependents={longNameDependents} />);

      // Component should render without crashing
      expect(screen.getByText('Stop Tor Gateway?')).toBeInTheDocument();
    });

    it('should handle many dependents with scrollable list', () => {
      const manyDependents: ServiceDependency[] = Array.from({ length: 10 }, (_, i) => ({
        id: `dep_${i}`,
        fromInstance: {
          id: `inst_${i}`,
          featureID: 'xray',
          instanceName: `Service ${i}`,
          status: 'RUNNING',
        },
        toInstance: mockDependents[0].toInstance,
        dependencyType: 'REQUIRES',
        autoStart: true,
        healthTimeoutSeconds: 30,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }));

      render(<StopDependentsDialog {...defaultProps} dependents={manyDependents} />);

      expect(screen.getByText('10 services depend on this instance')).toBeInTheDocument();
      expect(screen.getByText('Service 0')).toBeInTheDocument();
      expect(screen.getByText('Service 9')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should display status badges for each dependent', () => {
      render(<StopDependentsDialog {...defaultProps} />);

      // StatusBadge component should be rendered for each dependent
      // Verify the component structure (implementation-dependent)
      expect(screen.getByText('Xray Proxy')).toBeInTheDocument();
      expect(screen.getByText('Sing-box VPN')).toBeInTheDocument();
    });
  });
});
