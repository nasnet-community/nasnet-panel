/**
 * CircularGauge Component Tests
 * Tests for circular progress gauge with threshold-based coloring
 * Story 5.2: Real-Time Resource Utilization Display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CircularGauge } from './CircularGauge';

describe('CircularGauge', () => {
  it('renders with basic props', () => {
    render(<CircularGauge value={50} label="CPU" />);

    expect(screen.getByRole('meter')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
  });

  it('renders sublabel when provided', () => {
    render(<CircularGauge value={50} label="CPU" sublabel="4 cores" />);

    expect(screen.getByText('4 cores')).toBeInTheDocument();
  });

  it('applies correct ARIA attributes (AC 5.2.3)', () => {
    render(<CircularGauge value={75} label="CPU" sublabel="4 cores" />);

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '75');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-label', 'CPU: 75%, 4 cores');
  });

  it('applies success color for normal values (AC 5.2.3)', () => {
    const { container } = render(
      <CircularGauge
        value={50}
        label="CPU"
        thresholds={{ warning: 70, critical: 90 }}
      />
    );

    const progressCircle = container.querySelector('circle.stroke-success');
    expect(progressCircle).toBeInTheDocument();
  });

  it('applies warning color when above warning threshold (AC 5.2.3)', () => {
    const { container } = render(
      <CircularGauge
        value={75}
        label="CPU"
        thresholds={{ warning: 70, critical: 90 }}
      />
    );

    const progressCircle = container.querySelector('circle.stroke-warning');
    expect(progressCircle).toBeInTheDocument();
  });

  it('applies error color when above critical threshold (AC 5.2.3)', () => {
    const { container } = render(
      <CircularGauge
        value={95}
        label="CPU"
        thresholds={{ warning: 70, critical: 90 }}
      />
    );

    const progressCircle = container.querySelector('circle.stroke-error');
    expect(progressCircle).toBeInTheDocument();
  });

  it('renders at boundary values correctly', () => {
    const { rerender } = render(<CircularGauge value={0} label="CPU" />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<CircularGauge value={100} label="CPU" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps values outside 0-100 range', () => {
    const { rerender } = render(<CircularGauge value={-10} label="CPU" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');

    rerender(<CircularGauge value={150} label="CPU" />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders as button when onClick provided', () => {
    const handleClick = vi.fn();
    render(<CircularGauge value={50} label="CPU" onClick={handleClick} />);

    const button = screen.getByRole('meter');
    expect(button.tagName).toBe('BUTTON');
  });

  it('renders as div when onClick not provided', () => {
    render(<CircularGauge value={50} label="CPU" />);

    const meter = screen.getByRole('meter');
    expect(meter.tagName).toBe('DIV');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<CircularGauge value={50} label="CPU" onClick={handleClick} />);

    const button = screen.getByRole('meter');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders small size correctly', () => {
    const { container } = render(
      <CircularGauge value={50} label="CPU" size="sm" />
    );

    // Small size: 80px diameter
    const svg = container.querySelector('svg');
    expect(svg?.parentElement).toHaveStyle({ width: '80px', height: '80px' });
  });

  it('renders medium size correctly', () => {
    const { container } = render(
      <CircularGauge value={50} label="CPU" size="md" />
    );

    // Medium size: 120px diameter
    const svg = container.querySelector('svg');
    expect(svg?.parentElement).toHaveStyle({ width: '120px', height: '120px' });
  });

  it('renders large size correctly', () => {
    const { container } = render(
      <CircularGauge value={50} label="CPU" size="lg" />
    );

    // Large size: 160px diameter
    const svg = container.querySelector('svg');
    expect(svg?.parentElement).toHaveStyle({ width: '160px', height: '160px' });
  });

  it('has transition animation class', () => {
    const { container } = render(<CircularGauge value={50} label="CPU" />);

    const progressCircle = container.querySelectorAll('circle')[1]; // Second circle is progress
    expect(progressCircle).toHaveClass('transition-all', 'duration-500', 'ease-out');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CircularGauge value={50} label="CPU" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses default thresholds when not provided', () => {
    const { container } = render(<CircularGauge value={80} label="CPU" />);

    // Default thresholds: warning=70, critical=90
    // Value 80 should be warning (amber)
    const progressCircle = container.querySelector('circle.stroke-warning');
    expect(progressCircle).toBeInTheDocument();
  });

  it('supports keyboard focus when clickable', () => {
    const handleClick = vi.fn();
    render(<CircularGauge value={50} label="CPU" onClick={handleClick} />);

    const button = screen.getByRole('meter');
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });

  it('renders SVG with correct geometry', () => {
    const { container } = render(<CircularGauge value={50} label="CPU" size="md" />);

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2); // Background + progress

    // Both circles should have same center and radius
    circles.forEach((circle) => {
      expect(circle).toHaveAttribute('cx', '60'); // 120/2
      expect(circle).toHaveAttribute('cy', '60');
      expect(circle).toHaveAttribute('r', '56'); // (120-8)/2
    });
  });
});
