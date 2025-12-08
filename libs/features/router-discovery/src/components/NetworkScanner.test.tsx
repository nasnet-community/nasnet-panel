/**
 * Component Tests for NetworkScanner
 * Tests for Epic 0.1, Story 0-1-1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkScanner } from './NetworkScanner';
import type { ScanResult, ScanProgress } from '@nasnet/core/types';
import * as scanService from '../services/scanService';

// Mock the scan service
vi.mock('../services/scanService', () => ({
  startNetworkScan: vi.fn(),
  validateSubnet: vi.fn(),
  getDefaultSubnet: vi.fn(() => '192.168.88.0/24'),
  ScanError: class ScanError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'ScanError';
    }
  },
}));

describe('NetworkScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default subnet', () => {
    render(<NetworkScanner />);

    const input = screen.getByPlaceholderText('192.168.88.0/24');
    expect(input).toHaveValue('192.168.88.0/24');

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    expect(scanButton).toBeInTheDocument();
  });

  it('should allow user to change subnet input', () => {
    render(<NetworkScanner />);

    const input = screen.getByPlaceholderText(
      '192.168.88.0/24'
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '10.0.0.0/24' } });

    expect(input.value).toBe('10.0.0.0/24');
  });

  it('should display error for invalid subnet format', async () => {
    vi.mocked(scanService.validateSubnet).mockReturnValue(false);

    render(<NetworkScanner />);

    const input = screen.getByPlaceholderText('192.168.88.0/24');
    const scanButton = screen.getByRole('button', { name: /scan network/i });

    fireEvent.change(input, { target: { value: 'invalid-subnet' } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(
        screen.getByText(/invalid subnet format/i)
      ).toBeInTheDocument();
    });

    expect(scanService.startNetworkScan).not.toHaveBeenCalled();
  });

  it('should initiate scan with valid subnet', async () => {
    const mockResults: ScanResult[] = [
      {
        ipAddress: '192.168.88.1',
        isReachable: true,
        model: 'hEX S',
        routerOsVersion: '7.10',
        responseTime: 45,
      },
    ];

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue(mockResults);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(scanService.startNetworkScan).toHaveBeenCalledWith(
        '192.168.88.0/24',
        expect.any(Function)
      );
    });
  });

  it('should display scanning progress indicator', async () => {
    const mockProgress: ScanProgress = {
      totalHosts: 254,
      scannedHosts: 100,
      foundRouters: 1,
      currentIp: '192.168.88.100',
      isScanning: true,
    };

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockImplementation(
      async (subnet, onProgress) => {
        // Simulate progress callback
        if (onProgress) {
          onProgress(mockProgress);
        }
        return [];
      }
    );

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/scanning network/i)).toBeInTheDocument();
      expect(screen.getByText(/100.*254/)).toBeInTheDocument();
      expect(screen.getByText(/192\.168\.88\.100/)).toBeInTheDocument();
    });
  });

  it('should display scan results after completion', async () => {
    const mockResults: ScanResult[] = [
      {
        ipAddress: '192.168.88.1',
        isReachable: true,
        model: 'hEX S',
        routerOsVersion: '7.10',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        responseTime: 45,
      },
      {
        ipAddress: '192.168.88.2',
        isReachable: true,
        model: 'CCR1009',
        routerOsVersion: '7.11',
      },
    ];

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue(mockResults);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/found 2 routers/i)).toBeInTheDocument();
      expect(screen.getByText('192.168.88.1')).toBeInTheDocument();
      expect(screen.getByText('192.168.88.2')).toBeInTheDocument();
      expect(screen.getByText('hEX S')).toBeInTheDocument();
      expect(screen.getByText('CCR1009')).toBeInTheDocument();
    });
  });

  it('should call onScanComplete callback with results', async () => {
    const mockResults: ScanResult[] = [
      {
        ipAddress: '192.168.88.1',
        isReachable: true,
      },
    ];

    const onScanCompleteMock = vi.fn();

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue(mockResults);

    render(<NetworkScanner onScanComplete={onScanCompleteMock} />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(onScanCompleteMock).toHaveBeenCalledWith(mockResults);
    });
  });

  it('should call onRouterSelect when router is clicked', async () => {
    const mockResults: ScanResult[] = [
      {
        ipAddress: '192.168.88.1',
        isReachable: true,
        model: 'hEX S',
      },
    ];

    const onRouterSelectMock = vi.fn();

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue(mockResults);

    render(<NetworkScanner onRouterSelect={onRouterSelectMock} />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('192.168.88.1')).toBeInTheDocument();
    });

    const routerButton = screen.getByText('192.168.88.1').closest('button');
    fireEvent.click(routerButton!);

    expect(onRouterSelectMock).toHaveBeenCalledWith(mockResults[0]);
  });

  it('should display error message on scan failure', async () => {
    const mockError = new scanService.ScanError(
      'Backend service unavailable',
      'SCAN_START_FAILED'
    );

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockRejectedValue(mockError);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/scan failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/failed to start network scan/i)
      ).toBeInTheDocument();
    });
  });

  it('should display "no routers found" message for empty results', async () => {
    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue([]);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(
        screen.getByText(/no routers found on the network/i)
      ).toBeInTheDocument();
    });
  });

  it('should disable scan button during scanning', async () => {
    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        })
    );

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', {
      name: /scan network/i,
    }) as HTMLButtonElement;

    fireEvent.click(scanButton);

    // Button should be disabled immediately after click
    expect(scanButton.disabled).toBe(true);
    expect(screen.getByText(/scanning/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(scanButton.disabled).toBe(false);
    });
  });

  it('should disable subnet input during scanning', async () => {
    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        })
    );

    render(<NetworkScanner />);

    const input = screen.getByPlaceholderText(
      '192.168.88.0/24'
    ) as HTMLInputElement;
    const scanButton = screen.getByRole('button', { name: /scan network/i });

    fireEvent.click(scanButton);

    expect(input.disabled).toBe(true);

    await waitFor(() => {
      expect(input.disabled).toBe(false);
    });
  });

  it('should clear previous results when starting new scan', async () => {
    const mockResults1: ScanResult[] = [
      { ipAddress: '192.168.88.1', isReachable: true },
    ];
    const mockResults2: ScanResult[] = [
      { ipAddress: '10.0.0.1', isReachable: true },
    ];

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan)
      .mockResolvedValueOnce(mockResults1)
      .mockResolvedValueOnce(mockResults2);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });

    // First scan
    fireEvent.click(scanButton);
    await waitFor(() => {
      expect(screen.getByText('192.168.88.1')).toBeInTheDocument();
    });

    // Second scan
    const input = screen.getByPlaceholderText('192.168.88.0/24');
    fireEvent.change(input, { target: { value: '10.0.0.0/24' } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.queryByText('192.168.88.1')).not.toBeInTheDocument();
      expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    });
  });

  it('should display router details including MAC address', async () => {
    const mockResults: ScanResult[] = [
      {
        ipAddress: '192.168.88.1',
        isReachable: true,
        model: 'hEX S',
        routerOsVersion: '7.10',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        responseTime: 45,
      },
    ];

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue(mockResults);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/AA:BB:CC:DD:EE:FF/)).toBeInTheDocument();
      expect(screen.getByText(/RouterOS: 7\.10/)).toBeInTheDocument();
      expect(screen.getByText(/45ms/)).toBeInTheDocument();
    });
  });

  it('should display online badge for reachable routers', async () => {
    const mockResults: ScanResult[] = [
      {
        ipAddress: '192.168.88.1',
        isReachable: true,
        model: 'hEX S',
      },
    ];

    vi.mocked(scanService.validateSubnet).mockReturnValue(true);
    vi.mocked(scanService.startNetworkScan).mockResolvedValue(mockResults);

    render(<NetworkScanner />);

    const scanButton = screen.getByRole('button', { name: /scan network/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/online/i)).toBeInTheDocument();
    });
  });
});
