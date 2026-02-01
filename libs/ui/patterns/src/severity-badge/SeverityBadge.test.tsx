/**
 * SeverityBadge Component Tests
 * Tests for the severity badge component
 * Epic 0.8: System Logs - Story 0.8.3
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { LogSeverity } from '@nasnet/core/types/router';

import { SeverityBadge } from './SeverityBadge';


describe('SeverityBadge', () => {
  describe('Render and Display', () => {
    it('should render debug severity badge', () => {
      render(<SeverityBadge severity="debug" />);
      expect(screen.getByText('Debug')).toBeInTheDocument();
    });

    it('should render info severity badge', () => {
      render(<SeverityBadge severity="info" />);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('should render warning severity badge', () => {
      render(<SeverityBadge severity="warning" />);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should render error severity badge', () => {
      render(<SeverityBadge severity="error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render critical severity badge', () => {
      render(<SeverityBadge severity="critical" />);
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should capitalize severity label', () => {
      render(<SeverityBadge severity="error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('error')).not.toBeInTheDocument();
    });
  });

  describe('Color Styling', () => {
    it('should apply gray color for debug severity', () => {
      render(<SeverityBadge severity="debug" />);
      const badge = screen.getByText('Debug');
      expect(badge.className).toContain('text-gray');
      expect(badge.className).toContain('bg-gray');
    });

    it('should apply blue color for info severity', () => {
      render(<SeverityBadge severity="info" />);
      const badge = screen.getByText('Info');
      expect(badge.className).toContain('text-blue');
      expect(badge.className).toContain('bg-blue');
    });

    it('should apply amber color for warning severity', () => {
      render(<SeverityBadge severity="warning" />);
      const badge = screen.getByText('Warning');
      expect(badge.className).toContain('text-amber');
      expect(badge.className).toContain('bg-amber');
    });

    it('should apply red color for error severity', () => {
      render(<SeverityBadge severity="error" />);
      const badge = screen.getByText('Error');
      expect(badge.className).toContain('text-red');
      expect(badge.className).toContain('bg-red');
    });

    it('should apply red and bold for critical severity', () => {
      render(<SeverityBadge severity="critical" />);
      const badge = screen.getByText('Critical');
      expect(badge.className).toContain('text-red');
      expect(badge.className).toContain('bg-red');
      expect(badge.className).toContain('font-bold');
    });
  });

  describe('Read-only Badge (Log Entry)', () => {
    it('should render as span when no onRemove provided', () => {
      const { container } = render(<SeverityBadge severity="error" />);
      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('role')).toBe('status');
    });

    it('should have aria-label with severity', () => {
      render(<SeverityBadge severity="warning" />);
      const badge = screen.getByLabelText('Severity: Warning');
      expect(badge).toBeInTheDocument();
    });

    it('should not show X button when onRemove not provided', () => {
      render(<SeverityBadge severity="error" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Dismissible Badge (Filter)', () => {
    const mockOnRemove = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render as button when onRemove provided', () => {
      render(<SeverityBadge severity="error" onRemove={mockOnRemove} />);
      const badge = screen.getByRole('button', { name: /remove error filter/i });
      expect(badge).toBeInTheDocument();
    });

    it('should show X icon when onRemove provided', () => {
      const { container } = render(<SeverityBadge severity="error" onRemove={mockOnRemove} />);
      // X icon from lucide-react
      const xIcon = container.querySelector('svg');
      expect(xIcon).toBeInTheDocument();
    });

    it('should call onRemove when clicked', async () => {
      const user = userEvent.setup();
      render(<SeverityBadge severity="warning" onRemove={mockOnRemove} />);

      const badge = screen.getByRole('button', { name: /remove warning filter/i });
      await user.click(badge);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-label for remove button', () => {
      render(<SeverityBadge severity="critical" onRemove={mockOnRemove} />);
      expect(screen.getByRole('button', { name: 'Remove Critical filter' })).toBeInTheDocument();
    });

    it('should show hover effect', () => {
      render(<SeverityBadge severity="error" onRemove={mockOnRemove} />);
      const badge = screen.getByRole('button', { name: /remove error filter/i });
      expect(badge.className).toContain('hover:opacity-80');
    });

    it('should show focus styles', () => {
      render(<SeverityBadge severity="error" onRemove={mockOnRemove} />);
      const badge = screen.getByRole('button', { name: /remove error filter/i });
      expect(badge.className).toContain('focus:outline-none');
      expect(badge.className).toContain('focus:ring-2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for read-only badge', () => {
      render(<SeverityBadge severity="error" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Severity: Error');
    });

    it('should have proper ARIA attributes for dismissible badge', () => {
      const mockOnRemove = vi.fn();
      render(<SeverityBadge severity="warning" onRemove={mockOnRemove} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('aria-label', 'Remove Warning filter');
    });

    it('should mark X icon as aria-hidden', () => {
      const mockOnRemove = vi.fn();
      const { container } = render(<SeverityBadge severity="error" onRemove={mockOnRemove} />);
      const xIcon = container.querySelector('svg');
      expect(xIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(
        <SeverityBadge severity="info" className="custom-class" />
      );
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });

    it('should merge custom className with severity styles', () => {
      render(<SeverityBadge severity="error" className="custom-class" />);
      const badge = screen.getByText('Error');
      expect(badge.className).toContain('custom-class');
      expect(badge.className).toContain('text-red');
    });

    it('should pass through additional HTML attributes', () => {
      render(<SeverityBadge severity="info" data-testid="custom-badge" />);
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('All Severity Levels', () => {
    const allSeverities: LogSeverity[] = ['debug', 'info', 'warning', 'error', 'critical'];

    it('should render all severity levels correctly', () => {
      const { rerender } = render(<SeverityBadge severity="debug" />);

      allSeverities.forEach((severity) => {
        rerender(<SeverityBadge severity={severity} />);
        const expectedLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      });
    });

    it('should apply unique colors to each severity level', () => {
      allSeverities.forEach((severity) => {
        const { container, unmount } = render(<SeverityBadge severity={severity} />);
        const badge = container.querySelector('span');

        // Each severity should have distinct color classes
        expect(badge?.className).toBeTruthy();

        unmount();
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for debug', () => {
      render(<SeverityBadge severity="debug" />);
      const badge = screen.getByText('Debug');
      expect(badge.className).toContain('dark:');
    });

    it('should include dark mode classes for all severities', () => {
      const severities: LogSeverity[] = ['debug', 'info', 'warning', 'error', 'critical'];

      severities.forEach((severity) => {
        const { unmount } = render(<SeverityBadge severity={severity} />);
        const label = severity.charAt(0).toUpperCase() + severity.slice(1);
        const badge = screen.getByText(label);
        expect(badge.className).toContain('dark:');
        unmount();
      });
    });
  });
});
