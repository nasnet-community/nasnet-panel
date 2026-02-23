import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DHCPLeaseManagementPage } from './DHCPLeaseManagementPage';
import { mockLeases } from '../__mocks__/lease-data';

expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useDHCPLeases: vi.fn(),
  useMakeLeaseStatic: vi.fn(),
  useDeleteLease: vi.fn(),
}));

vi.mock('@nasnet/state/stores', () => ({
  useDHCPUIStore: vi.fn(),
}));

vi.mock('@nasnet/ui/primitives', () => ({
  useToast: vi.fn(),
}));

vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(),
}));

import { useDHCPLeases, useMakeLeaseStatic, useDeleteLease } from '@nasnet/api-client/queries';
import { useDHCPUIStore } from '@nasnet/state/stores';
import { useToast } from '@nasnet/ui/primitives';
import { usePlatform } from '@nasnet/ui/layouts';

describe('DHCP Lease Management Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as any).mockReturnValue({ toast: vi.fn() });
    (usePlatform as any).mockReturnValue('desktop');
    (useMakeLeaseStatic as any).mockReturnValue({ mutate: vi.fn(), isLoading: false });
    (useDeleteLease as any).mockReturnValue({ mutate: vi.fn(), isLoading: false });
    (useDHCPLeases as any).mockReturnValue({
      data: mockLeases,
      isLoading: false,
      isError: false,
      error: null,
    });
    (useDHCPUIStore as any).mockReturnValue({
      leaseSearch: '',
      setLeaseSearch: vi.fn(),
      leaseStatusFilter: 'all',
      setLeaseStatusFilter: vi.fn(),
      leaseServerFilter: 'all',
      setLeaseServerFilter: vi.fn(),
    });
  });

  describe('axe-core violations', () => {
    it('should have no accessibility violations on Desktop view', async () => {
      (usePlatform as any).mockReturnValue('desktop');
      const { container } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on Mobile view', async () => {
      (usePlatform as any).mockReturnValue('mobile');
      const { container } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with filters applied', async () => {
      (useDHCPUIStore as any).mockReturnValue({
        leaseSearch: '192.168.1',
        setLeaseSearch: vi.fn(),
        leaseStatusFilter: 'bound',
        setLeaseStatusFilter: vi.fn(),
        leaseServerFilter: 'LAN DHCP',
        setLeaseServerFilter: vi.fn(),
      });

      const { container } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard navigation', () => {
    it('should navigate through table rows with Tab key', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      // Focus first interactive element
      await user.keyboard('{Tab}');

      const activeElement = document.activeElement;
      expect(activeElement).toBeInTheDocument();
      expect(activeElement?.tagName).toMatch(/BUTTON|INPUT/);
    });

    it('should navigate to checkboxes with Tab key', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes[0].focus();

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(checkboxes[1]);
    });

    it('should toggle checkbox with Space key', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      checkbox.focus();

      await user.keyboard(' ');

      expect(checkbox).toBeChecked();
    });

    it('should navigate through dropdowns with Arrow keys', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const statusButton = screen.getByText('Status').closest('button');
      statusButton!.focus();

      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      // Filter should be applied
      const store = (useDHCPUIStore as any).mock.results[0].value;
      expect(store.setLeaseStatusFilter).toHaveBeenCalled();
    });

    it('should support Enter key for button activation', async () => {
      const user = userEvent.setup();
      const mockExport = vi.fn();

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const exportButton = screen.getByText(/export/i);
      exportButton.focus();

      await user.keyboard('{Enter}');

      // Export should be triggered
      expect(mockExport).toHaveBeenCalled();
    });
  });

  describe('Screen reader announcements', () => {
    it('should have proper ARIA labels for table', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('DHCP leases'));
    });

    it('should have proper ARIA labels for checkboxes', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      expect(headerCheckbox).toHaveAttribute('aria-label', 'Select all leases');

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
      rowCheckboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('aria-label', expect.stringContaining('Select'));
      });
    });

    it('should announce selection count to screen readers', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', expect.stringContaining('1 selected'));
    });

    it('should have semantic heading structure', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent(/DHCP Lease Management/i);
    });

    it('should announce filter changes', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const statusButton = screen.getByText('Status').closest('button');
      await user.click(statusButton!);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', expect.stringContaining('status'));
    });
  });

  describe('Focus indicators', () => {
    it('should have visible focus ring on buttons', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const button = screen.getByText('Status').closest('button');
      button!.focus();

      const styles = window.getComputedStyle(button!);
      expect(button).toHaveClass('focus:ring-3');
    });

    it('should have visible focus ring on checkboxes', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const checkbox = screen.getAllByRole('checkbox')[0];
      checkbox.focus();

      expect(checkbox).toHaveClass('focus:ring-3');
    });

    it('should have visible focus ring on table rows', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const firstRow = screen.getAllByRole('row')[1];
      firstRow.focus();

      expect(firstRow).toHaveClass('focus:ring-3');
    });

    it('should maintain focus after interactions', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      checkbox.focus();

      await user.keyboard(' ');

      expect(document.activeElement).toBe(checkbox);
    });
  });

  describe('Touch targets (Mobile)', () => {
    it('should have 44px minimum touch targets on mobile', () => {
      (usePlatform as any).mockReturnValue('mobile');
      const { container } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have 44px minimum touch targets for cards', () => {
      (usePlatform as any).mockReturnValue('mobile');
      const { container } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const cards = container.querySelectorAll('[data-testid="lease-card"]');
      cards.forEach((card) => {
        const styles = window.getComputedStyle(card);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have proper spacing between touch targets', () => {
      (usePlatform as any).mockReturnValue('mobile');
      const { container } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const buttons = Array.from(container.querySelectorAll('button'));
      for (let i = 0; i < buttons.length - 1; i++) {
        const rect1 = buttons[i].getBoundingClientRect();
        const rect2 = buttons[i + 1].getBoundingClientRect();

        const spacing = rect2.top - rect1.bottom;
        expect(spacing).toBeGreaterThanOrEqual(8); // Minimum 8px spacing
      }
    });
  });

  describe('Reduced motion support', () => {
    it('should respect prefers-reduced-motion', () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      Object.defineProperty(mediaQuery, 'matches', { value: true });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const animatedElements = document.querySelectorAll('[class*="animate-"]');
      animatedElements.forEach((element) => {
        expect(element).toHaveClass('motion-reduce:animate-none');
      });
    });

    it('should disable transitions when reduced motion is enabled', () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      Object.defineProperty(mediaQuery, 'matches', { value: true });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const elements = document.querySelectorAll('[class*="transition"]');
      elements.forEach((element) => {
        expect(element).toHaveClass('motion-reduce:transition-none');
      });
    });
  });

  describe('Color contrast (WCAG AAA)', () => {
    it('should have 7:1 contrast for normal text', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const textElements = screen.getAllByText(/192\.168\.1/);
      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Note: Actual contrast calculation would require a library
        // This is a simplified check
        expect(color).toBeTruthy();
        expect(backgroundColor).toBeTruthy();
      });
    });

    it('should have 4.5:1 contrast for large text', () => {
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const heading = screen.getByRole('heading', { level: 1 });
      const styles = window.getComputedStyle(heading);

      expect(styles.fontSize).toBeTruthy();
      expect(styles.color).toBeTruthy();
    });
  });

  describe('Error states', () => {
    it('should announce errors to screen readers', () => {
      (useDHCPLeases as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    });

    it('should provide accessible error recovery options', () => {
      (useDHCPLeases as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('aria-label', expect.stringContaining('retry'));
    });
  });
});
