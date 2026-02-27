/**
 * ResourceUsageBar Unit Tests
 *
 * Tests for the ResourceUsageBar pattern component.
 * Covers threshold calculation, color mapping, formatting, and accessibility.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ResourceUsageBar } from './ResourceUsageBar';
import { useResourceUsageBar } from './useResourceUsageBar';

describe('ResourceUsageBar', () => {
  describe('Component Rendering', () => {
    it('should render with default props', () => {
      render(
        <ResourceUsageBar
          used={50}
          total={100}
        />
      );

      // Check for progressbar role
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should render with custom label', () => {
      render(
        <ResourceUsageBar
          used={256}
          total={512}
          label="Custom Resource"
        />
      );

      expect(screen.getByText('Custom Resource')).toBeInTheDocument();
    });

    it('should render with resource type label', () => {
      render(
        <ResourceUsageBar
          used={75}
          total={100}
          resourceType="cpu"
        />
      );

      expect(screen.getByText('CPU')).toBeInTheDocument();
    });

    it('should show percentage when showPercentage is true', () => {
      render(
        <ResourceUsageBar
          used={25}
          total={100}
          showPercentage={true}
        />
      );

      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should show values when showValues is true', () => {
      render(
        <ResourceUsageBar
          used={512}
          total={1024}
          unit="MB"
          showValues={true}
        />
      );

      expect(screen.getByText(/512 MB/i)).toBeInTheDocument();
      expect(screen.getByText(/1024 MB/i)).toBeInTheDocument();
    });

    it('should hide values when showValues is false', () => {
      render(
        <ResourceUsageBar
          used={512}
          total={1024}
          unit="MB"
          showValues={false}
        />
      );

      // Values should not be in the visible document (might be in aria-label)
      const visibleUsed = screen.queryByText(/Used:/i);
      expect(visibleUsed).not.toBeInTheDocument();
    });

    it('should render mobile variant when specified', () => {
      const { container } = render(
        <ResourceUsageBar
          used={50}
          total={100}
          variant="mobile"
        />
      );

      // Mobile variant has specific classes
      expect(container.querySelector('.flex-col')).toBeInTheDocument();
    });

    it('should render desktop variant when specified', () => {
      const { container } = render(
        <ResourceUsageBar
          used={50}
          total={100}
          variant="desktop"
        />
      );

      // Desktop variant has specific inline layout
      expect(container.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('Threshold Calculation', () => {
    // Helper to get status from hook
    function getStatus(used: number, total: number, thresholds?: any) {
      const TestComponent = () => {
        const state = useResourceUsageBar({
          used,
          total,
          thresholds,
        });
        return <div data-testid="status">{state.status}</div>;
      };

      render(<TestComponent />);
      return screen.getByTestId('status').textContent;
    }

    it('should return idle status for 0% usage', () => {
      expect(getStatus(0, 100)).toBe('idle');
    });

    it('should return normal status for <60% usage', () => {
      expect(getStatus(50, 100)).toBe('normal');
      expect(getStatus(59, 100)).toBe('normal');
    });

    it('should return warning status for 60-79% usage', () => {
      expect(getStatus(60, 100)).toBe('warning');
      expect(getStatus(70, 100)).toBe('warning');
      expect(getStatus(79, 100)).toBe('warning');
    });

    it('should return critical status for 80-94% usage', () => {
      expect(getStatus(80, 100)).toBe('critical');
      expect(getStatus(90, 100)).toBe('critical');
      expect(getStatus(94, 100)).toBe('critical');
    });

    it('should return danger status for ≥95% usage', () => {
      expect(getStatus(95, 100)).toBe('danger');
      expect(getStatus(99, 100)).toBe('danger');
      expect(getStatus(100, 100)).toBe('danger');
    });

    it('should handle custom thresholds', () => {
      const customThresholds = {
        normal: 50,
        warning: 70,
        critical: 90,
      };

      expect(getStatus(40, 100, customThresholds)).toBe('normal');
      expect(getStatus(60, 100, customThresholds)).toBe('warning');
      expect(getStatus(80, 100, customThresholds)).toBe('critical');
      expect(getStatus(95, 100, customThresholds)).toBe('danger');
    });

    it('should return unknown status for invalid values', () => {
      expect(getStatus(-10, 100)).toBe('unknown');
      expect(getStatus(NaN, 100)).toBe('unknown');
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate correct percentage', () => {
      render(
        <ResourceUsageBar
          used={50}
          total={100}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should clamp percentage to 0-100 range', () => {
      render(
        <ResourceUsageBar
          used={150}
          total={100}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle zero total gracefully', () => {
      render(
        <ResourceUsageBar
          used={50}
          total={0}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should round percentage to nearest integer', () => {
      render(
        <ResourceUsageBar
          used={33}
          total={100}
          showPercentage={true}
        />
      );

      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format values with correct unit', () => {
      render(
        <ResourceUsageBar
          used={512}
          total={1024}
          unit="MB"
          showValues={true}
        />
      );

      expect(screen.getByText(/512 MB/i)).toBeInTheDocument();
      expect(screen.getByText(/1024 MB/i)).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(
        <ResourceUsageBar
          used={512.5}
          total={1024.75}
          unit="GB"
          showValues={true}
        />
      );

      expect(screen.getByText(/512.5 GB/i)).toBeInTheDocument();
      expect(screen.getByText(/1024.75 GB/i)).toBeInTheDocument();
    });

    it('should use custom unit', () => {
      render(
        <ResourceUsageBar
          used={75}
          total={100}
          unit="%"
          showValues={true}
        />
      );

      expect(screen.getByText(/75 %/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper progressbar role', () => {
      render(
        <ResourceUsageBar
          used={50}
          total={100}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have correct ARIA attributes', () => {
      render(
        <ResourceUsageBar
          used={75}
          total={100}
          resourceType="memory"
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-valuetext', '75 MB of 100 MB');
    });

    it('should have descriptive aria-label', () => {
      render(
        <ResourceUsageBar
          used={512}
          total={1024}
          resourceType="memory"
          unit="MB"
        />
      );

      const progressbar = screen.getByRole('progressbar');
      const ariaLabel = progressbar.getAttribute('aria-label');
      expect(ariaLabel).toContain('Memory usage');
      expect(ariaLabel).toContain('512 MB');
      expect(ariaLabel).toContain('1024 MB');
      expect(ariaLabel).toContain('50%');
    });

    it('should have screen reader status announcement', () => {
      render(
        <ResourceUsageBar
          used={80}
          total={100}
          resourceType="cpu"
        />
      );

      // Check for sr-only span with status
      const srOnly = screen.getByText(/CPU status/i);
      expect(srOnly).toHaveClass('sr-only');
    });

    it('should indicate status with icon (not color alone)', () => {
      const { container } = render(
        <ResourceUsageBar
          used={95}
          total={100}
          variant="mobile"
        />
      );

      // Check for icon element (SVG)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label');
    });
  });

  describe('Color Mapping', () => {
    it('should use neutral color for idle status', () => {
      const TestComponent = () => {
        const state = useResourceUsageBar({ used: 0, total: 100 });
        return <div data-testid="color">{state.colorToken}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('neutral');
    });

    it('should use success color for normal status', () => {
      const TestComponent = () => {
        const state = useResourceUsageBar({ used: 50, total: 100 });
        return <div data-testid="color">{state.colorToken}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('success');
    });

    it('should use warning color for warning status', () => {
      const TestComponent = () => {
        const state = useResourceUsageBar({ used: 70, total: 100 });
        return <div data-testid="color">{state.colorToken}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('warning');
    });

    it('should use error color for critical status', () => {
      const TestComponent = () => {
        const state = useResourceUsageBar({ used: 90, total: 100 });
        return <div data-testid="color">{state.colorToken}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('error');
    });

    it('should use error color for danger status', () => {
      const TestComponent = () => {
        const state = useResourceUsageBar({ used: 99, total: 100 });
        return <div data-testid="color">{state.colorToken}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('error');
    });
  });
});
