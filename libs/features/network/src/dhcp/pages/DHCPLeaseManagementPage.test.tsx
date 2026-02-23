import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DHCPLeaseManagementPage } from './DHCPLeaseManagementPage';

// Mock dependencies
vi.mock('../hooks/useLeasePage', () => ({
  useLeasePage: vi.fn(),
}));

vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(),
}));

vi.mock('./DHCPLeaseManagementDesktop', () => ({
  DHCPLeaseManagementDesktop: () => <div data-testid="desktop-view">Desktop View</div>,
}));

vi.mock('./DHCPLeaseManagementMobile', () => ({
  DHCPLeaseManagementMobile: () => <div data-testid="mobile-view">Mobile View</div>,
}));

import { useLeasePage } from '../hooks/useLeasePage';
import { usePlatform } from '@nasnet/ui/layouts';

describe('DHCPLeaseManagementPage', () => {
  const mockLeasePageData = {
    leases: [],
    filteredLeases: [],
    isLoading: false,
    isError: false,
    selectedLeases: new Set<string>(),
    newLeases: new Set<string>(),
    toggleSelection: vi.fn(),
    toggleAll: vi.fn(),
    clearSelection: vi.fn(),
    makeAllStatic: vi.fn(),
    deleteMultiple: vi.fn(),
    exportToCSV: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLeasePage as any).mockReturnValue(mockLeasePageData);
  });

  describe('Platform detection', () => {
    it('should render Desktop view when platform is desktop', () => {
      (usePlatform as any).mockReturnValue('desktop');

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-view')).not.toBeInTheDocument();
    });

    it('should render Desktop view when platform is tablet', () => {
      (usePlatform as any).mockReturnValue('tablet');

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-view')).not.toBeInTheDocument();
    });

    it('should render Mobile view when platform is mobile', () => {
      (usePlatform as any).mockReturnValue('mobile');

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('mobile-view')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-view')).not.toBeInTheDocument();
    });
  });

  describe('Data flow', () => {
    it('should pass useLeasePage data to Desktop presenter', () => {
      (usePlatform as any).mockReturnValue('desktop');

      const customData = {
        ...mockLeasePageData,
        leases: [{ id: '1', address: '192.168.1.1' }],
        isLoading: true,
      };
      (useLeasePage as any).mockReturnValue(customData);

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(useLeasePage).toHaveBeenCalled();
      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();
    });

    it('should pass useLeasePage data to Mobile presenter', () => {
      (usePlatform as any).mockReturnValue('mobile');

      const customData = {
        ...mockLeasePageData,
        leases: [{ id: '1', address: '192.168.1.1' }],
        isLoading: false,
      };
      (useLeasePage as any).mockReturnValue(customData);

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(useLeasePage).toHaveBeenCalled();
      expect(screen.getByTestId('mobile-view')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should switch from Desktop to Mobile when platform changes', () => {
      (usePlatform as any).mockReturnValue('desktop');

      const { rerender } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();

      // Simulate platform change
      (usePlatform as any).mockReturnValue('mobile');
      rerender(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('mobile-view')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-view')).not.toBeInTheDocument();
    });

    it('should switch from Mobile to Desktop when platform changes', () => {
      (usePlatform as any).mockReturnValue('mobile');

      const { rerender } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('mobile-view')).toBeInTheDocument();

      // Simulate platform change
      (usePlatform as any).mockReturnValue('desktop');
      rerender(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-view')).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should pass error state to presenters', () => {
      (usePlatform as any).mockReturnValue('desktop');
      (useLeasePage as any).mockReturnValue({
        ...mockLeasePageData,
        isError: true,
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();
    });

    it('should pass loading state to presenters', () => {
      (usePlatform as any).mockReturnValue('mobile');
      (useLeasePage as any).mockReturnValue({
        ...mockLeasePageData,
        isLoading: true,
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(screen.getByTestId('mobile-view')).toBeInTheDocument();
    });
  });

  describe('Hook integration', () => {
    it('should call useLeasePage hook', () => {
      (usePlatform as any).mockReturnValue('desktop');

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(useLeasePage).toHaveBeenCalledTimes(1);
    });

    it('should call usePlatform hook', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(usePlatform).toHaveBeenCalledTimes(1);
    });

    it('should maintain hook calls across re-renders', () => {
      (usePlatform as any).mockReturnValue('desktop');

      const { rerender } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(useLeasePage).toHaveBeenCalledTimes(1);
      expect(usePlatform).toHaveBeenCalledTimes(1);

      rerender(<DHCPLeaseManagementPage routerId="test-router-1" />);

      expect(useLeasePage).toHaveBeenCalledTimes(2);
      expect(usePlatform).toHaveBeenCalledTimes(2);
    });
  });
});
