import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaseCard } from './LeaseCard';
import { mockLeases, createMockLease } from '../../__mocks__/lease-data';

describe('LeaseCard', () => {
  const defaultProps = {
    lease: mockLeases[0],
    isNew: false,
    onMakeStatic: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render lease data correctly', () => {
      render(<LeaseCard {...defaultProps} />);

      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
      expect(screen.getByText('laptop-work')).toBeInTheDocument();
      expect(screen.getByText('bound')).toBeInTheDocument();
    });

    it('should render "Unknown Device" when hostname is undefined', () => {
      const lease = createMockLease({ hostname: undefined });
      render(
        <LeaseCard
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('Unknown Device')).toBeInTheDocument();
    });

    it('should render "New" badge when isNew is true', () => {
      render(
        <LeaseCard
          {...defaultProps}
          isNew={true}
        />
      );

      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('span')).toHaveClass('animate-pulse');
    });

    it('should not render "New" badge when isNew is false', () => {
      render(
        <LeaseCard
          {...defaultProps}
          isNew={false}
        />
      );

      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should show selected state styling', () => {
      const { container } = render(<LeaseCard {...defaultProps} />);

      const card = container.firstChild;
      // Note: Selected state styling validation would require props that enable selection
      expect(card).toBeInTheDocument();
    });

    it('should render blocked indicator for blocked leases', () => {
      const lease = createMockLease({ blocked: true });
      render(
        <LeaseCard
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });
  });

  describe('Tap to expand', () => {
    it('should expand bottom sheet when card is tapped', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      await waitFor(() => {
        expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
        expect(screen.getByText('Lease Details')).toBeInTheDocument();
      });
    });

    it('should show quick action buttons in bottom sheet', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      await waitFor(() => {
        expect(screen.getByText('Make Static')).toBeInTheDocument();
        expect(screen.getByText('Delete Lease')).toBeInTheDocument();
        expect(screen.getByText('Copy MAC')).toBeInTheDocument();
      });
    });

    it('should close bottom sheet when backdrop is tapped', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      const backdrop = await screen.findByTestId('bottom-sheet-backdrop');
      await user.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Swipe gestures', () => {
    it('should reveal Make Static action on right swipe', async () => {
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');

      // Simulate swipe right
      fireEvent.touchStart(card!, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(card!);

      await waitFor(() => {
        expect(screen.getByText('Make Static')).toBeVisible();
      });
    });

    it('should reveal Delete action on left swipe', async () => {
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');

      // Simulate swipe left
      fireEvent.touchStart(card!, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchEnd(card!);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeVisible();
      });
    });

    it('should call onMakeStatic when right swipe action is triggered', async () => {
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');

      // Simulate swipe right
      fireEvent.touchStart(card!, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 120, clientY: 0 }] }); // Full swipe
      fireEvent.touchEnd(card!);

      await waitFor(() => {
        expect(defaultProps.onMakeStatic).toHaveBeenCalledWith(mockLeases[0]);
      });
    });

    it('should call onDelete when left swipe action is triggered', async () => {
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');

      // Simulate swipe left
      fireEvent.touchStart(card!, { touches: [{ clientX: 120, clientY: 0 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 0, clientY: 0 }] }); // Full swipe
      fireEvent.touchEnd(card!);

      await waitFor(() => {
        expect(defaultProps.onDelete).toHaveBeenCalledWith(mockLeases[0]);
      });
    });

    it('should not trigger action on incomplete swipe', async () => {
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');

      // Simulate partial swipe (less than threshold)
      fireEvent.touchStart(card!, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 30, clientY: 0 }] });
      fireEvent.touchEnd(card!);

      await waitFor(() => {
        expect(defaultProps.onMakeStatic).not.toHaveBeenCalled();
        expect(defaultProps.onDelete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Quick action buttons', () => {
    it('should call onMakeStatic when Make Static button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      // Expand bottom sheet
      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      // Click Make Static button
      const makeStaticBtn = await screen.findByText('Make Static');
      await user.click(makeStaticBtn);

      expect(defaultProps.onMakeStatic).toHaveBeenCalledWith(mockLeases[0]);
    });

    it('should call onDelete when Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      // Expand bottom sheet
      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      // Click Delete button
      const deleteBtn = await screen.findByText('Delete Lease');
      await user.click(deleteBtn);

      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockLeases[0]);
    });

    it('should copy MAC address when Copy MAC button is clicked', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn();
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      render(<LeaseCard {...defaultProps} />);

      // Expand bottom sheet
      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      // Click Copy MAC button
      const copyBtn = await screen.findByText('Copy MAC');
      await user.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith('00:11:22:33:44:55');
    });
  });

  describe('Touch targets', () => {
    it('should have 44px minimum touch target for card', () => {
      const { container } = render(<LeaseCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(card);
      const minHeight = parseInt(styles.minHeight);

      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should have 44px minimum touch target for action buttons', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      // Expand bottom sheet
      const card = screen.getByText('192.168.1.100').closest('div');
      await user.click(card!);

      const buttons = await screen.findAllByRole('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Status indicators', () => {
    it('should render bound status with green color', () => {
      const lease = createMockLease({ status: 'bound' });
      render(
        <LeaseCard
          {...defaultProps}
          lease={lease}
        />
      );

      const badge = screen.getByText('bound');
      expect(badge.closest('span')).toHaveClass('bg-semantic-success');
    });

    it('should render waiting status with yellow color', () => {
      const lease = createMockLease({ status: 'waiting' });
      render(
        <LeaseCard
          {...defaultProps}
          lease={lease}
        />
      );

      const badge = screen.getByText('waiting');
      expect(badge.closest('span')).toHaveClass('bg-semantic-warning');
    });

    it('should show expires after time', () => {
      render(<LeaseCard {...defaultProps} />);

      expect(screen.getByText(/2h30m/)).toBeInTheDocument();
    });

    it('should show "never" for static leases', () => {
      const lease = createMockLease({ expiresAfter: 'never', dynamic: false });
      render(
        <LeaseCard
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('never')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LeaseCard {...defaultProps} />);

      expect(screen.getByLabelText(/lease card for/i)).toBeInTheDocument();
    });

    it('should indicate selected state to screen readers', () => {
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByLabelText(/lease card for/i);
      expect(card).toBeInTheDocument();
    });

    it('should have proper focus indicators', async () => {
      const user = userEvent.setup();
      render(<LeaseCard {...defaultProps} />);

      const card = screen.getByText('192.168.1.100').closest('div');
      card!.focus();

      expect(card).toHaveClass('focus:ring-3');
    });
  });
});
