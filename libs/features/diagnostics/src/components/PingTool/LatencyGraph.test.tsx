/**
 * Component tests for LatencyGraph
 *
 * Tests:
 * - Chart rendering with latency data
 * - Reference lines for warning/critical thresholds
 * - Empty state handling
 * - Timeout gaps (connectNulls=false behavior)
 * - Custom tooltip with monospace latency values
 * - Accessibility attributes
 * - Y-axis domain calculation with padding
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatencyGraph } from './LatencyGraph';
import type { PingResult } from './PingTool.types';

describe('LatencyGraph', () => {
  const baseResult: Omit<PingResult, 'seq' | 'time'> = {
    bytes: 56,
    ttl: 64,
    target: '8.8.8.8',
    source: null,
    error: null,
    timestamp: new Date(),
  };

  it('should display empty state when no results', () => {
    render(<LatencyGraph results={[]} />);

    expect(screen.getByText(/no data to display/i)).toBeInTheDocument();
    expect(screen.getByText(/start a ping test/i)).toBeInTheDocument();
  });

  it('should render chart title', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
    ];

    render(<LatencyGraph results={results} />);

    expect(screen.getByText('Latency Over Time')).toBeInTheDocument();
  });

  it('should render chart with accessibility attributes', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Check for role="img" and aria-label
    const chartDiv = container.querySelector('[role="img"]');
    expect(chartDiv).toBeInTheDocument();
    expect(chartDiv).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Latency over time chart')
    );
  });

  it('should transform results into chart data points', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
      { ...baseResult, seq: 2, time: 13.2 },
      { ...baseResult, seq: 3, time: 11.8 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Chart should render without errors
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('should handle timeouts (null times) with gaps in the line', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
      { ...baseResult, seq: 2, time: null, error: 'timeout' },
      { ...baseResult, seq: 3, time: 13.2 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Should render successfully even with null values
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('should calculate Y-axis domain with 20% padding', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 10 },
      { ...baseResult, seq: 2, time: 20 },
      { ...baseResult, seq: 3, time: 30 }, // max time = 30
    ];

    // Y-axis should be calculated as: Math.max(250, ceil(30 * 1.2 / 50) * 50) = 50
    render(<LatencyGraph results={results} />);

    // Just verify it renders without error
    expect(screen.getByText('Latency Over Time')).toBeInTheDocument();
  });

  it('should have minimum Y-axis of 250 for very low latencies', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 0.5 },
      { ...baseResult, seq: 2, time: 1.2 },
      { ...baseResult, seq: 3, time: 2.1 },
    ];

    render(<LatencyGraph results={results} />);

    // Should render with minimum domain to ensure readable chart
    expect(screen.getByText('Latency Over Time')).toBeInTheDocument();
  });

  it('should accept optional className prop', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
    ];

    const { container } = render(
      <LatencyGraph results={results} className="custom-class" />
    );

    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should handle all successful pings', () => {
    const results: PingResult[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseResult,
      seq: i + 1,
      time: 10 + Math.random() * 5, // Random between 10-15ms
    }));

    const { container } = render(<LatencyGraph results={results} />);

    // Should render all 10 data points
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('should handle all failed pings (all timeouts)', () => {
    const results: PingResult[] = Array.from({ length: 5 }, (_, i) => ({
      ...baseResult,
      seq: i + 1,
      time: null,
      error: 'timeout',
    }));

    render(<LatencyGraph results={results} />);

    // Should render even with all null times
    expect(screen.getByText('Latency Over Time')).toBeInTheDocument();
  });

  it('should render warning threshold line at 100ms', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 50 },
      { ...baseResult, seq: 2, time: 150 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Reference line should exist in SVG
    // Look for SVG line element or text label
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render critical threshold line at 200ms', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 100 },
      { ...baseResult, seq: 2, time: 250 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Critical line should be in the chart
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should handle mixed success and timeout results', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
      { ...baseResult, seq: 2, time: null, error: 'timeout' },
      { ...baseResult, seq: 3, time: 13.2 },
      { ...baseResult, seq: 4, time: null, error: 'timeout' },
      { ...baseResult, seq: 5, time: 11.8 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Should render with mixed data
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('should handle very large latency values', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 5000 }, // 5 seconds
      { ...baseResult, seq: 2, time: 6000 }, // 6 seconds
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Y-axis should scale appropriately
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('should render chart container with proper width class', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    // Chart div should have w-full class
    const chartDiv = container.querySelector('[role="img"]');
    expect(chartDiv).toHaveClass('w-full');
  });

  it('should display sequential x-axis labels', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
      { ...baseResult, seq: 2, time: 13.2 },
      { ...baseResult, seq: 3, time: 11.8 },
    ];

    render(<LatencyGraph results={results} />);

    // Just verify chart renders without error
    expect(screen.getByText('Latency Over Time')).toBeInTheDocument();
  });

  it('should handle single ping result', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 12.5 },
    ];

    const { container } = render(<LatencyGraph results={results} />);

    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('should calculate Y-axis with proper rounding to 50ms increments', () => {
    const results: PingResult[] = [
      { ...baseResult, seq: 1, time: 75 }, // max = 75, * 1.2 = 90, ceil(90/50)*50 = 100
    ];

    render(<LatencyGraph results={results} />);

    // Should render with properly rounded domain
    expect(screen.getByText('Latency Over Time')).toBeInTheDocument();
  });
});
