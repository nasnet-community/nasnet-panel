/**
 * Component tests for PingStatistics
 *
 * Tests:
 * - Statistics display with various packet loss scenarios
 * - Color coding based on loss percentage (green/amber/red)
 * - Badge variants and status indicators
 * - Monospace font for RTT values
 * - Accessibility with semantic dl/dt/dd structure
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PingStatistics } from './PingStatistics';
import type { PingStatistics as PingStatisticsType } from './PingTool.types';

describe('PingStatistics', () => {
  const baseStats: PingStatisticsType = {
    sent: 10,
    received: 10,
    lost: 0,
    lossPercent: 0,
    minRtt: 11.8,
    avgRtt: 12.9,
    maxRtt: 14.2,
    stdDev: 0.95,
  };

  it('should render statistics with no packet loss', () => {
    render(<PingStatistics statistics={baseStats} />);

    // Header
    expect(screen.getByText('Statistics')).toBeInTheDocument();

    // Badge
    expect(screen.getByText('No Loss')).toBeInTheDocument();

    // All stat values
    expect(screen.getByText('10')).toBeInTheDocument(); // sent = received
    expect(screen.getByText('0')).toBeInTheDocument(); // lost = 0
    expect(screen.getByText('0%')).toBeInTheDocument(); // lossPercent = 0
  });

  it('should display RTT values in monospace font', () => {
    const { container } = render(<PingStatistics statistics={baseStats} />);

    // Find all monospace (font-mono) RTT values
    const monoElements = container.querySelectorAll('.font-mono');

    // Should have at least 4 monospace elements (min, avg, max, stdDev RTT values)
    expect(monoElements.length).toBeGreaterThanOrEqual(4);

    // Verify RTT values are displayed
    expect(screen.getByText('11.80 ms')).toBeInTheDocument(); // minRtt
    expect(screen.getByText('12.90 ms')).toBeInTheDocument(); // avgRtt
    expect(screen.getByText('14.20 ms')).toBeInTheDocument(); // maxRtt
    expect(screen.getByText('0.95 ms')).toBeInTheDocument(); // stdDev
  });

  it('should show warning badge for minor packet loss', () => {
    const stats: PingStatisticsType = {
      ...baseStats,
      received: 9,
      lost: 1,
      lossPercent: 10,
    };

    render(<PingStatistics statistics={stats} />);

    // Should show loss percentage badge
    expect(screen.getByText('10% Loss')).toBeInTheDocument();

    // Verify lost packet count
    expect(screen.getAllByText('1')).toHaveLength(1); // lost = 1
  });

  it('should show error badge for critical packet loss', () => {
    const stats: PingStatisticsType = {
      ...baseStats,
      received: 3,
      lost: 7,
      lossPercent: 70,
    };

    render(<PingStatistics statistics={stats} />);

    // Should show loss percentage badge
    expect(screen.getByText('70% Loss')).toBeInTheDocument();

    expect(screen.getByText('3')).toBeInTheDocument(); // received
    expect(screen.getAllByText('7')).toHaveLength(1); // lost
  });

  it('should show "Host Unreachable" badge when all packets lost', () => {
    const stats: PingStatisticsType = {
      ...baseStats,
      received: 0,
      lost: 10,
      lossPercent: 100,
      minRtt: null,
      avgRtt: null,
      maxRtt: null,
      stdDev: null,
    };

    render(<PingStatistics statistics={stats} />);

    // Host unreachable badge
    expect(screen.getByText('Host Unreachable')).toBeInTheDocument();

    // All RTT values should be N/A
    expect(screen.getAllByText('N/A')).toHaveLength(4); // min, avg, max, stdDev
  });

  it('should handle null RTT values gracefully', () => {
    const stats: PingStatisticsType = {
      ...baseStats,
      minRtt: null,
      avgRtt: null,
      maxRtt: null,
      stdDev: null,
    };

    render(<PingStatistics statistics={stats} />);

    // N/A for all missing values
    expect(screen.getAllByText('N/A')).toHaveLength(4);
  });

  it('should use semantic HTML (dl/dt/dd) for accessibility', () => {
    const { container } = render(<PingStatistics statistics={baseStats} />);

    // Check for definition list structure
    const dl = container.querySelector('dl');
    expect(dl).toBeInTheDocument();
    expect(dl).toHaveAttribute('aria-label', 'Ping statistics summary');

    // Should have multiple dt/dd pairs
    const dts = container.querySelectorAll('dt');
    const dds = container.querySelectorAll('dd');
    expect(dts.length).toBeGreaterThan(0);
    expect(dds.length).toBeGreaterThan(0);
    expect(dts.length).toBe(dds.length); // Equal number of labels and values
  });

  it('should accept optional className prop', () => {
    const { container } = render(
      <PingStatistics
        statistics={baseStats}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should format RTT values to 2 decimal places', () => {
    const stats: PingStatisticsType = {
      ...baseStats,
      minRtt: 10.123,
      avgRtt: 12.567,
      maxRtt: 15.999,
      stdDev: 1.001,
    };

    render(<PingStatistics statistics={stats} />);

    expect(screen.getByText('10.12 ms')).toBeInTheDocument(); // min rounded
    expect(screen.getByText('12.57 ms')).toBeInTheDocument(); // avg rounded
    expect(screen.getByText('16.00 ms')).toBeInTheDocument(); // max rounded
    expect(screen.getByText('1.00 ms')).toBeInTheDocument(); // stdDev rounded
  });

  it('should display header title correctly', () => {
    render(<PingStatistics statistics={baseStats} />);

    const title = screen.getByText('Statistics');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });

  it('should indicate successful stats with success color', () => {
    const { container } = render(<PingStatistics statistics={baseStats} />);

    // Received count should have success color (text-success)
    const receivedValue = screen.getByText('10').parentElement;
    expect(receivedValue?.parentElement).toHaveClass('text-success');
  });

  it('should show lost packets in red when non-zero', () => {
    const stats: PingStatisticsType = {
      ...baseStats,
      received: 9,
      lost: 1,
      lossPercent: 10,
    };

    const { container } = render(<PingStatistics statistics={stats} />);

    // Find the lost packet value (1)
    const lostValue = screen.getAllByText('1')[0]; // First "1" is the lost count
    expect(lostValue.parentElement).toHaveClass('text-error');
  });
});
