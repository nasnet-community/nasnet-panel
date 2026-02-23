/**
 * DiagnosticStep - Component Tests
 *
 * Comprehensive component tests covering:
 * - Status rendering (pending, running, passed, failed, skipped)
 * - Result display (success/error messages, execution time)
 * - Active state highlighting
 * - Click interaction for completed steps
 * - Accessibility (ARIA labels, keyboard navigation, semantic HTML)
 *
 * @see Story NAS-5.11 - No Internet Troubleshooting Wizard - Task 5.11.11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagnosticStep } from './DiagnosticStep';
import type { DiagnosticStep as DiagnosticStepType } from '../../types/troubleshoot.types';

describe('DiagnosticStep', () => {
  const defaultProps = {
    stepNumber: 1,
    totalSteps: 5,
    isActive: false,
  };

  const createStep = (
    overrides?: Partial<DiagnosticStepType>
  ): DiagnosticStepType => ({
    id: 'wan',
    name: 'WAN Interface Check',
    description: 'Checking WAN interface status',
    status: 'pending',
    result: undefined,
    fix: undefined,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Rendering - Pending', () => {
    it('should render pending step with clock icon', () => {
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('WAN Interface Check')).toBeInTheDocument();

      // Check for clock icon (aria-hidden, so check class)
      const container = screen.getByRole('status');
      expect(container.querySelector('.lucide-clock')).toBeInTheDocument();
    });

    it('should have reduced opacity for pending steps', () => {
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('opacity-60');
    });

    it('should not show result message for pending step', () => {
      const step = createStep({
        result: {
          success: false,
          message: 'This should not be visible',
          issueCode: undefined,
          executionTimeMs: 100,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
    });
  });

  describe('Status Rendering - Running', () => {
    it('should render running step with spinner icon', () => {
      const step = createStep({ status: 'running' });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      const spinner = container.querySelector('.lucide-loader-2');

      expect(spinner).toBeInTheDocument();
      expect(spinner?.className).toContain('animate-spin');
    });

    it('should show primary border and background for running step', () => {
      const step = createStep({ status: 'running' });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('border-primary');
      expect(container.className).toContain('bg-primary/10');
    });

    it('should show running message', () => {
      const step = createStep({
        status: 'running',
        result: {
          success: false,
          message: 'Checking interface status...',
          issueCode: undefined,
          executionTimeMs: 0,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByText('Checking interface status...')).toBeInTheDocument();
    });

    it('should not show execution time for running step', () => {
      const step = createStep({
        status: 'running',
        result: {
          success: false,
          message: 'Running...',
          issueCode: undefined,
          executionTimeMs: 500,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.queryByText(/0\.5s/)).not.toBeInTheDocument();
    });
  });

  describe('Status Rendering - Passed', () => {
    it('should render passed step with check icon', () => {
      const step = createStep({
        status: 'passed',
        result: {
          success: true,
          message: 'WAN interface is enabled and running',
          issueCode: undefined,
          executionTimeMs: 150,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container.querySelector('.lucide-check-circle-2')).toBeInTheDocument();
    });

    it('should show success border and background', () => {
      const step = createStep({
        status: 'passed',
        result: {
          success: true,
          message: 'Check passed',
          issueCode: undefined,
          executionTimeMs: 100,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('border-success');
      expect(container.className).toContain('bg-success/10');
    });

    it('should show success message in green text', () => {
      const step = createStep({
        status: 'passed',
        result: {
          success: true,
          message: 'WAN interface is enabled',
          issueCode: undefined,
          executionTimeMs: 100,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const message = screen.getByText('WAN interface is enabled');
      expect(message.className).toContain('text-success');
    });

    it('should show execution time', () => {
      const step = createStep({
        status: 'passed',
        result: {
          success: true,
          message: 'Check passed',
          issueCode: undefined,
          executionTimeMs: 1500, // 1.5 seconds
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByText('1.5s')).toBeInTheDocument();
    });
  });

  describe('Status Rendering - Failed', () => {
    it('should render failed step with X icon', () => {
      const step = createStep({
        status: 'failed',
        result: {
          success: false,
          message: 'WAN interface is disabled',
          issueCode: 'WAN_DISABLED',
          executionTimeMs: 200,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container.querySelector('.lucide-x-circle')).toBeInTheDocument();
    });

    it('should show error border and background', () => {
      const step = createStep({
        status: 'failed',
        result: {
          success: false,
          message: 'Check failed',
          issueCode: 'TEST_ERROR',
          executionTimeMs: 100,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('border-error');
      expect(container.className).toContain('bg-error/10');
    });

    it('should show error message in red text', () => {
      const step = createStep({
        status: 'failed',
        result: {
          success: false,
          message: 'Gateway unreachable',
          issueCode: 'GATEWAY_UNREACHABLE',
          executionTimeMs: 3000,
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const message = screen.getByText('Gateway unreachable');
      expect(message.className).toContain('text-error');
    });

    it('should show execution time for failed steps', () => {
      const step = createStep({
        status: 'failed',
        result: {
          success: false,
          message: 'Timeout',
          issueCode: 'GATEWAY_TIMEOUT',
          executionTimeMs: 5000, // 5 seconds
        },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByText('5.0s')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should show ring indicator when active', () => {
      const step = createStep({ status: 'running' });

      render(<DiagnosticStep {...defaultProps} step={step} isActive={true} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('ring-2');
      expect(container.className).toContain('ring-primary');
    });

    it('should not show ring when not active', () => {
      const step = createStep({ status: 'passed' });

      render(<DiagnosticStep {...defaultProps} step={step} isActive={false} />);

      const container = screen.getByRole('status');
      expect(container.className).not.toContain('ring-2');
    });
  });

  describe('Step Number Badge', () => {
    it('should display step number', () => {
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} stepNumber={3} totalSteps={5} />);

      // Check for step number in aria-label
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Step 3 of 5')
      );
    });

    it('should color badge based on status', () => {
      const stepPassed = createStep({
        status: 'passed',
        result: { success: true, message: '', issueCode: undefined, executionTimeMs: 100 },
      });

      const { rerender, container } = render(
        <DiagnosticStep {...defaultProps} step={stepPassed} />
      );

      let badge = container.querySelector('[aria-hidden="true"]:last-child');
      expect(badge?.className).toContain('bg-success');

      // Rerender with failed status
      const stepFailed = createStep({
        status: 'failed',
        result: { success: false, message: '', issueCode: 'ERROR', executionTimeMs: 100 },
      });

      rerender(<DiagnosticStep {...defaultProps} step={stepFailed} />);

      badge = container.querySelector('[aria-hidden="true"]:last-child');
      expect(badge?.className).toContain('bg-error');
    });
  });

  describe('Click Interaction', () => {
    it('should call onClick when step is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const step = createStep({
        status: 'passed',
        result: { success: true, message: 'Passed', issueCode: undefined, executionTimeMs: 100 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} onClick={onClick} />);

      const container = screen.getByRole('status');
      await user.click(container);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible with Enter key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const step = createStep({
        status: 'passed',
        result: { success: true, message: 'Passed', issueCode: undefined, executionTimeMs: 100 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} onClick={onClick} />);

      const container = screen.getByRole('status');
      container.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const step = createStep({
        status: 'passed',
        result: { success: true, message: 'Passed', issueCode: undefined, executionTimeMs: 100 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} onClick={onClick} />);

      const container = screen.getByRole('status');
      container.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor pointer when clickable', () => {
      const onClick = vi.fn();
      const step = createStep({
        status: 'passed',
        result: { success: true, message: 'Passed', issueCode: undefined, executionTimeMs: 100 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} onClick={onClick} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('cursor-pointer');
    });

    it('should be focusable when clickable', () => {
      const onClick = vi.fn();
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} onClick={onClick} />);

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should not be focusable when not clickable', () => {
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} />);

      const container = screen.getByRole('status');
      expect(container).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for pending step', () => {
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} stepNumber={2} totalSteps={5} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Step 2 of 5: WAN Interface Check - Pending'
      );
    });

    it('should have proper ARIA label for running step', () => {
      const step = createStep({ status: 'running' });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Running')
      );
    });

    it('should have proper ARIA label for passed step', () => {
      const step = createStep({
        status: 'passed',
        result: { success: true, message: '', issueCode: undefined, executionTimeMs: 100 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Passed')
      );
    });

    it('should have proper ARIA label for failed step', () => {
      const step = createStep({
        status: 'failed',
        result: { success: false, message: '', issueCode: 'ERROR', executionTimeMs: 100 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Failed')
      );
    });

    it('should hide decorative icons from screen readers', () => {
      const step = createStep({ status: 'passed' });

      const { container } = render(<DiagnosticStep {...defaultProps} step={step} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should use semantic role=status', () => {
      const step = createStep();

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing result gracefully', () => {
      const step = createStep({ status: 'passed', result: undefined });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByText('WAN Interface Check')).toBeInTheDocument();
    });

    it('should handle zero execution time', () => {
      const step = createStep({
        status: 'passed',
        result: { success: true, message: '', issueCode: undefined, executionTimeMs: 0 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      expect(screen.getByText('0.0s')).toBeInTheDocument();
    });

    it('should handle very long step names with truncation', () => {
      const step = createStep({
        name: 'This is a very long step name that should be truncated to prevent layout issues',
      });

      const { container } = render(<DiagnosticStep {...defaultProps} step={step} />);

      const stepName = container.querySelector('h3');
      expect(stepName?.className).toContain('truncate');
    });

    it('should format execution time correctly', () => {
      const step = createStep({
        status: 'passed',
        result: { success: true, message: '', issueCode: undefined, executionTimeMs: 12345 },
      });

      render(<DiagnosticStep {...defaultProps} step={step} />);

      // 12345ms = 12.3s (rounded to 1 decimal)
      expect(screen.getByText('12.3s')).toBeInTheDocument();
    });
  });
});
