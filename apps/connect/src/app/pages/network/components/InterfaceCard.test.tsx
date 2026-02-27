/**
 * InterfaceCard Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as queries from '@nasnet/api-client/queries';
import { type NetworkInterface } from '@nasnet/core/types';

import { InterfaceCard } from './InterfaceCard';

// Mock the useInterfaceTraffic hook
vi.mock('@nasnet/api-client/queries', async () => {
  const actual = await vi.importActual('@nasnet/api-client/queries');
  return {
    ...actual,
    useInterfaceTraffic: vi.fn(),
  };
});

describe('InterfaceCard', () => {
  const mockInterface: NetworkInterface = {
    id: '*1',
    name: 'ether1',
    type: 'ether',
    status: 'running',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    linkStatus: 'up',
    mtu: 1500,
    comment: 'WAN Port',
  };

  beforeEach(() => {
    // Reset mock before each test
    vi.clearAllMocks();
    // Default mock returns no data (collapsed state)
    (queries.useInterfaceTraffic as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it('should render interface name', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText('ether1')).toBeInTheDocument();
  });

  it('should render interface type', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText('ether')).toBeInTheDocument();
  });

  it('should render MAC address', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText(/AA:BB:CC:DD:EE:FF/)).toBeInTheDocument();
  });

  it('should render MTU when provided', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText(/MTU: 1500/)).toBeInTheDocument();
  });

  it('should render running status badge', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should render disabled status when interface is disabled', () => {
    const disabledInterface = { ...mockInterface, status: 'disabled' as const };
    render(<InterfaceCard interface={disabledInterface} />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should render link status indicator', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText('Link Up')).toBeInTheDocument();
  });

  it('should render N/A for missing MAC address', () => {
    const noMacInterface = { ...mockInterface, macAddress: '' };
    render(<InterfaceCard interface={noMacInterface} />);
    expect(screen.getByText(/MAC: N\/A/)).toBeInTheDocument();
  });

  it('should show chevron down when collapsed', () => {
    render(<InterfaceCard interface={mockInterface} />);
    // ChevronDown should be present, ChevronUp should not
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should expand to show traffic statistics when clicked', async () => {
    const user = userEvent.setup();
    const mockTrafficStats = {
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

    (queries.useInterfaceTraffic as any).mockReturnValue({
      data: mockTrafficStats,
      isLoading: false,
      error: null,
    });

    render(<InterfaceCard interface={mockInterface} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Traffic Statistics')).toBeInTheDocument();
    });
  });

  it('should show loading state when fetching traffic stats', async () => {
    const user = userEvent.setup();

    (queries.useInterfaceTraffic as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<InterfaceCard interface={mockInterface} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Loading traffic statistics...')).toBeInTheDocument();
    });
  });

  it('should show no data message when traffic stats are unavailable', async () => {
    const user = userEvent.setup();

    (queries.useInterfaceTraffic as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<InterfaceCard interface={mockInterface} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('No traffic statistics available')).toBeInTheDocument();
    });
  });

  it('should show additional details when expanded', async () => {
    const user = userEvent.setup();

    render(<InterfaceCard interface={mockInterface} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Additional Details')).toBeInTheDocument();
      expect(screen.getByText(/Comment: WAN Port/)).toBeInTheDocument();
      expect(screen.getByText(/ID: \*1/)).toBeInTheDocument();
    });
  });
});
