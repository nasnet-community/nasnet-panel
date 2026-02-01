/**
 * ResourceGauge Component Tests
 * Tests for resource usage gauge component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ResourceGauge } from './ResourceGauge';

describe('ResourceGauge', () => {
  describe('Data Display (AC-1, AC-2)', () => {
    it('should render label correctly', () => {
      render(<ResourceGauge label="CPU" value={45} status="healthy" />);
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });

    it('should display percentage value numerically (AC-2)', () => {
      render(<ResourceGauge label="CPU" value={45} status="healthy" />);
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should round percentage values to nearest integer', () => {
      render(<ResourceGauge label="CPU" value={45.6} status="healthy" />);
      expect(screen.getByText('46%')).toBeInTheDocument();
    });

    it('should render optional subtitle when provided', () => {
      render(
        <ResourceGauge
          label="CPU"
          value={45}
          status="healthy"
          subtitle="4 cores"
        />
      );
      expect(screen.getByText('4 cores')).toBeInTheDocument();
    });
  });

  describe('Color Coding (AC-3, AC-4, AC-5)', () => {
    it('should use green color for healthy status (AC-3)', () => {
      const { container } = render(
        <ResourceGauge label="CPU" value={30} status="healthy" />
      );

      const progressCircle = container.querySelector('.text-green-500');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should use amber color for warning status (AC-4)', () => {
      const { container } = render(
        <ResourceGauge label="CPU" value={65} status="warning" />
      );

      const progressCircle = container.querySelector('.text-amber-500');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should use red color for critical status (AC-5)', () => {
      const { container } = render(
        <ResourceGauge label="CPU" value={90} status="critical" />
      );

      const progressCircle = container.querySelector('.text-red-500');
      expect(progressCircle).toBeInTheDocument();
    });
  });

  describe('Loading State (AC-6)', () => {
    it('should display skeleton loading state when isLoading is true', () => {
      render(<ResourceGauge label="CPU" isLoading={true} />);

      // Verify skeletons are rendered
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not display value during loading', () => {
      render(<ResourceGauge label="CPU" value={45} isLoading={true} />);

      // Value should not be visible during loading
      expect(screen.queryByText('45%')).not.toBeInTheDocument();
    });

    it('should not display label during loading', () => {
      render(<ResourceGauge label="CPU" value={45} isLoading={true} />);

      // Label should not be visible during loading
      expect(screen.queryByText('CPU')).not.toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should default value to 0 if not provided', () => {
      render(<ResourceGauge label="CPU" status="healthy" />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should default status to healthy if not provided', () => {
      const { container } = render(<ResourceGauge label="CPU" value={45} />);

      const progressCircle = container.querySelector('.text-green-500');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should default isLoading to false', () => {
      render(<ResourceGauge label="CPU" value={45} />);

      // Should show data, not loading skeleton
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0% correctly', () => {
      render(<ResourceGauge label="CPU" value={0} status="healthy" />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% correctly', () => {
      render(<ResourceGauge label="CPU" value={100} status="critical" />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should render SVG gauge elements', () => {
      const { container } = render(
        <ResourceGauge label="CPU" value={45} status="healthy" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2); // Background + progress
    });
  });
});
