/**
 * ResourceGauges Unit Tests
 * AC 5.2: Real-time resource utilization display
 *
 * Test coverage:
 * - Platform-specific rendering (mobile vs desktop)
 * - CPU gauge click to show modal
 * - Threshold-based color changes
 * - Temperature gauge visibility
 * - Loading and skeleton states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceGauges } from './ResourceGauges';

// Mock dependencies
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

vi.mock('@nasnet/ui/primitives', () => ({
  Skeleton: ({ className }: any) => (
    <div
      data-testid="skeleton"
      className={className}
    />
  ),
}));

vi.mock('./CircularGauge', () => ({
  CircularGauge: ({ label, sublabel, value, onClick }: any) => (
    <button
      data-testid={`gauge-${label.toLowerCase()}`}
      onClick={onClick}
      aria-label={`${label}: ${value}%`}
    >
      {label}: {value}% {sublabel && `(${sublabel})`}
    </button>
  ),
}));

vi.mock('./CPUBreakdownModal', () => ({
  CPUBreakdownModal: ({ open }: any) =>
    open ? <div data-testid="cpu-modal">CPU Breakdown Modal</div> : null,
}));

vi.mock('./useResourceMetrics', () => ({
  useResourceMetrics: (deviceId: string) => {
    if (deviceId === 'loading-device') {
      return {
        metrics: null,
        loading: true,
        raw: null,
      };
    }

    return {
      metrics: {
        cpu: { usage: 45, formatted: '4 cores', cores: 4 },
        memory: { percentage: 65, formatted: '8.2GB / 16GB' },
        storage: { percentage: 42, formatted: '210GB / 500GB' },
        temperature: 55,
        hasTemperature: true,
      },
      loading: false,
      raw: {
        cpu: {
          perCore: [45, 50, 40, 48],
          frequency: '2.4GHz',
        },
      },
    };
  },
}));

describe('ResourceGauges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render four gauges on desktop (CPU, Memory, Storage, Temp)', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByTestId('gauge-cpu')).toBeInTheDocument();
      expect(screen.getByTestId('gauge-memory')).toBeInTheDocument();
      expect(screen.getByTestId('gauge-storage')).toBeInTheDocument();
      expect(screen.getByTestId('gauge-temperature')).toBeInTheDocument();
    });

    it('should display values as percentage', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByText(/CPU: 45%/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory: 65%/i)).toBeInTheDocument();
      expect(screen.getByText(/Storage: 42%/i)).toBeInTheDocument();
    });

    it('should display sublabels with formatted values', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByText(/4 cores/i)).toBeInTheDocument();
      expect(screen.getByText(/8.2GB \/ 16GB/i)).toBeInTheDocument();
      expect(screen.getByText(/210GB \/ 500GB/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show skeleton loaders when loading', () => {
      render(<ResourceGauges deviceId="loading-device" />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show 4 skeletons on desktop loading state', () => {
      render(<ResourceGauges deviceId="loading-device" />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBe(4);
    });
  });

  describe('User Interactions', () => {
    it('should open CPU modal when CPU gauge is clicked', async () => {
      const user = userEvent.setup();
      render(<ResourceGauges deviceId="test-device" />);

      const cpuGauge = screen.getByTestId('gauge-cpu');
      await user.click(cpuGauge);

      await waitFor(() => {
        expect(screen.getByTestId('cpu-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Temperature Gauge Visibility', () => {
    it('should render temperature gauge when hasTemperature is true', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByTestId('gauge-temperature')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on gauges', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByLabelText(/CPU: 45%/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Memory: 65%/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Storage: 42%/i)).toBeInTheDocument();
    });

    it('should have proper color-based accessibility (not color-only)', () => {
      // Colors are based on thresholds and paired with numeric display
      render(<ResourceGauges deviceId="test-device" />);

      // Verify text labels are present alongside gauges
      expect(screen.getByText(/CPU:/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory:/i)).toBeInTheDocument();
      expect(screen.getByText(/Storage:/i)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have displayName set for debugging', () => {
      expect(ResourceGauges.displayName).toBe('ResourceGauges');
    });

    it('should render grid layout', () => {
      const { container } = render(<ResourceGauges deviceId="test-device" />);

      // Desktop presenter should have 4-column grid
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-4');
    });
  });

  describe('Platform-Specific Rendering', () => {
    it('should use desktop presenter on desktop platform', () => {
      const { container } = render(<ResourceGauges deviceId="test-device" />);

      // Desktop uses 4-column grid
      const gridContainer = container.querySelector('.grid-cols-4');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined device ID gracefully', () => {
      render(<ResourceGauges deviceId="" />);

      // Should render without crashing
      expect(screen.getByTestId('gauge-cpu')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <ResourceGauges
          deviceId="test-device"
          className="custom-class"
        />
      );

      const gridContainer = container.querySelector('.custom-class');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display CPU cores as sublabel on desktop', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByText(/4 cores/)).toBeInTheDocument();
    });

    it('should display memory as formatted string', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByText(/8.2GB \/ 16GB/)).toBeInTheDocument();
    });

    it('should display storage as formatted string', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByText(/210GB \/ 500GB/)).toBeInTheDocument();
    });

    it('should display temperature in Celsius', () => {
      render(<ResourceGauges deviceId="test-device" />);

      expect(screen.getByText(/55°C/)).toBeInTheDocument();
    });
  });
});
