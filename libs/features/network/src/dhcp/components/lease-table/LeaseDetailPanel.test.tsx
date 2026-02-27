import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaseDetailPanel } from './LeaseDetailPanel';
import { mockLeases, createMockLease } from '../../__mocks__/lease-data';

describe('LeaseDetailPanel', () => {
  const defaultProps = {
    lease: mockLeases[0],
    onMakeStatic: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render lease information', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Lease Details')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
      expect(screen.getByText('laptop-work')).toBeInTheDocument();
    });

    it('should render device info section', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Device Information')).toBeInTheDocument();
      expect(screen.getByText('Hostname:')).toBeInTheDocument();
      expect(screen.getByText('MAC Address:')).toBeInTheDocument();
    });

    it('should render assignment info section', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Assignment Information')).toBeInTheDocument();
      expect(screen.getByText('IP Address:')).toBeInTheDocument();
      expect(screen.getByText('Server:')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
    });

    it('should render timing info section', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Timing Information')).toBeInTheDocument();
      expect(screen.getByText('Expires After:')).toBeInTheDocument();
      expect(screen.getByText('Last Seen:')).toBeInTheDocument();
    });

    it('should render "Unknown Device" when hostname is undefined', () => {
      const lease = createMockLease({ hostname: undefined });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('Unknown Device')).toBeInTheDocument();
    });
  });

  describe('Quick action buttons', () => {
    it('should render Make Static button', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Make Static')).toBeInTheDocument();
    });

    it('should render Delete button', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Delete Lease')).toBeInTheDocument();
    });

    it('should render Copy MAC button', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Copy MAC Address')).toBeInTheDocument();
    });

    it('should call onMakeStatic when Make Static button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseDetailPanel {...defaultProps} />);

      const button = screen.getByText('Make Static');
      await user.click(button);

      expect(defaultProps.onMakeStatic).toHaveBeenCalledWith(mockLeases[0].id);
    });

    it('should call onDelete when Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseDetailPanel {...defaultProps} />);

      const button = screen.getByText('Delete Lease');
      await user.click(button);

      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockLeases[0].id);
    });

    it('should copy MAC address when Copy MAC button is clicked', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn();
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      render(<LeaseDetailPanel {...defaultProps} />);

      const button = screen.getByText('Copy MAC Address');
      await user.click(button);

      expect(writeTextMock).toHaveBeenCalledWith('00:11:22:33:44:55');
    });

    it('should disable Make Static button for static leases', () => {
      const lease = createMockLease({ dynamic: false });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      const button = screen.getByText('Make Static');
      expect(button).toBeDisabled();
    });
  });

  describe('Status display', () => {
    it('should render bound status with green badge', () => {
      const lease = createMockLease({ status: 'bound' });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      const badge = screen.getByText('bound');
      expect(badge.closest('span')).toHaveClass('bg-semantic-success');
    });

    it('should render waiting status with yellow badge', () => {
      const lease = createMockLease({ status: 'waiting' });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      const badge = screen.getByText('waiting');
      expect(badge.closest('span')).toHaveClass('bg-semantic-warning');
    });

    it('should show "Dynamic" for dynamic leases', () => {
      const lease = createMockLease({ dynamic: true });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('Dynamic')).toBeInTheDocument();
    });

    it('should show "Static" for static leases', () => {
      const lease = createMockLease({ dynamic: false });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    it('should show blocked indicator for blocked leases', () => {
      const lease = createMockLease({ blocked: true });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });
  });

  describe('Timing information', () => {
    it('should display expires after time', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('2h30m')).toBeInTheDocument();
    });

    it('should display "never" for static leases', () => {
      const lease = createMockLease({ expiresAfter: 'never' });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('never')).toBeInTheDocument();
    });

    it('should format last seen timestamp', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      // Should show formatted date/time
      expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    });
  });

  describe('Client ID display', () => {
    it('should display client ID when available', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByText('Client ID:')).toBeInTheDocument();
      expect(screen.getByText('client-1')).toBeInTheDocument();
    });

    it('should display "N/A" when client ID is unavailable', () => {
      const lease = createMockLease({ clientId: undefined });
      render(
        <LeaseDetailPanel
          {...defaultProps}
          lease={lease}
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Close button', () => {
    it('should render close button', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseDetailPanel {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByRole('region', { name: 'Lease details' })).toBeInTheDocument();
    });

    it('should have semantic heading hierarchy', () => {
      render(<LeaseDetailPanel {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2, name: 'Lease Details' })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: 'Device Information' })
      ).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LeaseDetailPanel {...defaultProps} />);

      const firstButton = screen.getByText('Make Static');
      firstButton.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByText('Delete Lease')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByText('Copy MAC Address')).toHaveFocus();
    });
  });

  describe('Layout', () => {
    it('should use grid layout for information sections', () => {
      const { container } = render(<LeaseDetailPanel {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have proper spacing between sections', () => {
      const { container } = render(<LeaseDetailPanel {...defaultProps} />);

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);

      sections.forEach((section) => {
        expect(section).toHaveClass('space-y-2');
      });
    });
  });
});
