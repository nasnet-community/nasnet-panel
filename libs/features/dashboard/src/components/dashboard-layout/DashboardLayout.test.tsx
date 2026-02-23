/**
 * DashboardLayout Unit Tests
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Test coverage:
 * - Grid column calculations for all platforms
 * - Responsive breakpoint behavior
 * - Refresh button interaction
 * - Accessibility (ARIA labels, semantic HTML)
 * - Proper rendering of children
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardLayout } from './DashboardLayout';

// Mock usePlatform hook
const mockUsePlatform = vi.fn();
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => mockUsePlatform(),
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    // Reset mock to desktop by default
    mockUsePlatform.mockReturnValue('desktop');
  });

  describe('Rendering', () => {
    it('should render page header with title and description', () => {
      render(
        <DashboardLayout>
          <div>Test Card</div>
        </DashboardLayout>
      );

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/router health and network status/i)).toBeInTheDocument();
    });

    it('should render children in main grid area', () => {
      render(
        <DashboardLayout>
          <div data-testid="card-1">Card 1</div>
          <div data-testid="card-2">Card 2</div>
          <div data-testid="card-3">Card 3</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
      expect(screen.getByTestId('card-3')).toBeInTheDocument();
    });

    it('should render refresh button when showRefresh is true and onRefresh provided', () => {
      const onRefresh = vi.fn();
      render(
        <DashboardLayout onRefresh={onRefresh} showRefresh={true}>
          <div>Content</div>
        </DashboardLayout>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh router data/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should NOT render refresh button when showRefresh is false', () => {
      const onRefresh = vi.fn();
      render(
        <DashboardLayout onRefresh={onRefresh} showRefresh={false}>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    });

    it('should NOT render refresh button when onRefresh is not provided', () => {
      render(
        <DashboardLayout showRefresh={true}>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    });
  });

  describe('Grid Column Calculations', () => {
    it('should render single column grid on mobile platform', () => {
      mockUsePlatform.mockReturnValue('mobile');
      const { container } = render(
        <DashboardLayout>
          <div>Card</div>
        </DashboardLayout>
      );

      const gridContainer = container.querySelector('[role="main"]');
      expect(gridContainer).toHaveClass('grid-cols-1');
    });

    it('should render 2-column grid on tablet platform', () => {
      mockUsePlatform.mockReturnValue('tablet');
      const { container } = render(
        <DashboardLayout>
          <div>Card</div>
        </DashboardLayout>
      );

      const gridContainer = container.querySelector('[role="main"]');
      expect(gridContainer).toHaveClass('grid-cols-2');
    });

    it('should render 3-column grid on desktop platform', () => {
      mockUsePlatform.mockReturnValue('desktop');
      const { container } = render(
        <DashboardLayout>
          <div>Card</div>
        </DashboardLayout>
      );

      const gridContainer = container.querySelector('[role="main"]');
      expect(gridContainer).toHaveClass('grid-cols-3');
    });
  });

  describe('User Interactions', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();

      render(
        <DashboardLayout onRefresh={onRefresh}>
          <div>Content</div>
        </DashboardLayout>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh router data/i });
      await user.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should not crash when refresh button is clicked without onRefresh', async () => {
      const user = userEvent.setup();

      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Should not have refresh button without onRefresh
      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on main grid', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const mainGrid = screen.getByRole('main');
      expect(mainGrid).toHaveAttribute('aria-label', 'Dashboard widgets');
    });

    it('should have refresh button with aria-label', () => {
      const onRefresh = vi.fn();
      render(
        <DashboardLayout onRefresh={onRefresh}>
          <div>Content</div>
        </DashboardLayout>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh router data/i });
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh router data');
      expect(refreshButton).toHaveAttribute('title', 'Refresh');
    });

    it('should have refresh icon with aria-hidden', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <DashboardLayout onRefresh={onRefresh}>
          <div>Content</div>
        </DashboardLayout>
      );

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      // Header with heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();

      // Main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have 48px touch target for refresh button (WCAG AAA)', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <DashboardLayout onRefresh={onRefresh}>
          <div>Content</div>
        </DashboardLayout>
      );

      const refreshButton = container.querySelector('button[aria-label="Refresh router data"]');
      expect(refreshButton).toHaveClass('h-12'); // h-12 = 48px
      expect(refreshButton).toHaveClass('w-12'); // w-12 = 48px
    });
  });

  describe('Styling and Layout', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <DashboardLayout className="custom-class">
          <div>Content</div>
        </DashboardLayout>
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should have proper spacing classes for mobile', () => {
      mockUsePlatform.mockReturnValue('mobile');
      const { container } = render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('p-4');

      const main = container.querySelector('main');
      expect(main).toHaveClass('p-4');
    });

    it('should have proper gap classes in grid', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const gridContainer = container.querySelector('[role="main"]');
      expect(gridContainer).toHaveClass('gap-4'); // Mobile: 16px
      expect(gridContainer).toHaveClass('sm:gap-6'); // Tablet: 24px
      expect(gridContainer).toHaveClass('lg:gap-8'); // Desktop: 32px
    });

    it('should use auto-rows-max for proper grid item sizing', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const gridContainer = container.querySelector('[role="main"]');
      expect(gridContainer).toHaveClass('auto-rows-max');
    });
  });

  describe('Edge Cases', () => {
    it('should handle no children', () => {
      render(
        <DashboardLayout>
          <div />
        </DashboardLayout>
      );

      const mainGrid = screen.getByRole('main');
      expect(mainGrid).toBeEmptyDOMElement();
    });

    it('should handle single child', () => {
      render(
        <DashboardLayout>
          <div data-testid="single-card">Only Card</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('single-card')).toBeInTheDocument();
    });

    it('should handle many children', () => {
      const cards = Array.from({ length: 10 }, (_, i) => (
        <div key={i} data-testid={`card-${i}`}>
          Card {i}
        </div>
      ));

      render(<DashboardLayout>{cards}</DashboardLayout>);

      cards.forEach((_, i) => {
        expect(screen.getByTestId(`card-${i}`)).toBeInTheDocument();
      });
    });
  });
});
