/**
 * TrafficStats Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { type TrafficStatistics } from '@nasnet/core/types';

import { TrafficStats } from './TrafficStats';


describe('TrafficStats', () => {
  const mockStats: TrafficStatistics = {
    interfaceId: '*1',
    txBytes: 1024000,
    rxBytes: 2048000,
    txPackets: 1000,
    rxPackets: 2000,
    txErrors: 0,
    rxErrors: 0,
    txDrops: 0,
    rxDrops: 0,
  };

  it('should render traffic statistics', () => {
    render(<TrafficStats stats={mockStats} />);
    expect(screen.getByText('Traffic Statistics')).toBeInTheDocument();
  });

  it('should render formatted bytes for TX and RX', () => {
    render(<TrafficStats stats={mockStats} />);
    expect(screen.getByText('1.00 MB')).toBeInTheDocument(); // TX bytes
    expect(screen.getByText('2.00 MB')).toBeInTheDocument(); // RX bytes
  });

  it('should render packet counts', () => {
    render(<TrafficStats stats={mockStats} />);
    expect(screen.getByText('1,000')).toBeInTheDocument(); // TX packets
    expect(screen.getByText('2,000')).toBeInTheDocument(); // RX packets
  });

  it('should render zero errors and drops', () => {
    render(<TrafficStats stats={mockStats} />);
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4); // TX errors, RX errors, TX drops, RX drops
  });

  it('should highlight errors when present', () => {
    const statsWithErrors = {
      ...mockStats,
      txErrors: 5,
      rxErrors: 3,
    };
    render(<TrafficStats stats={statsWithErrors} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should highlight drops when present', () => {
    const statsWithDrops = {
      ...mockStats,
      txDrops: 10,
      rxDrops: 15,
    };
    render(<TrafficStats stats={statsWithDrops} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should render upload and download labels', () => {
    render(<TrafficStats stats={mockStats} />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });
});
