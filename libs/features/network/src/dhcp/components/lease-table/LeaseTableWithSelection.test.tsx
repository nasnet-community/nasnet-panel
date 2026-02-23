import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaseTableWithSelection } from './LeaseTableWithSelection';
import { mockLeases } from '../../__mocks__/lease-data';

// Mock dependencies
vi.mock('./LeaseDetailPanel', () => ({
  LeaseDetailPanel: ({ lease }: any) => (
    <div data-testid="detail-panel">Detail for {lease.hostname}</div>
  ),
}));

describe('LeaseTableWithSelection', () => {
  const defaultProps = {
    leases: mockLeases,
    selectedIds: new Set<string>(),
    newLeaseIds: new Set<string>(),
    onSelectionChange: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with lease data', () => {
      render(<LeaseTableWithSelection {...defaultProps} />);

      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
      expect(screen.getByText('laptop-work')).toBeInTheDocument();
    });

    it('should render loading skeleton when isLoading is true', () => {
      render(<LeaseTableWithSelection {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    });

    it('should render empty state when no leases', () => {
      render(<LeaseTableWithSelection {...defaultProps} leases={[]} />);

      expect(screen.getByText(/no DHCP leases found/i)).toBeInTheDocument();
    });

    it('should render "New" badge for new leases', () => {
      const newLeaseIds = new Set(['lease-1']);
      render(<LeaseTableWithSelection {...defaultProps} newLeaseIds={newLeaseIds} />);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('New').closest('span')).toHaveClass('animate-pulse');
    });
  });

  describe('Checkbox selection', () => {
    it('should call onSelectionChange when row checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const checkbox = screen.getAllByRole('checkbox')[1]; // First row checkbox (0 is select all)
      await user.click(checkbox);

      expect(defaultProps.onSelectionChange).toHaveBeenCalled();
    });

    it('should call onSelectionChange when header checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const headerCheckbox = screen.getAllByRole('checkbox')[0]; // Header checkbox
      await user.click(headerCheckbox);

      expect(defaultProps.onSelectionChange).toHaveBeenCalled();
    });

    it('should show checked state for selected leases', () => {
      const selectedIds = new Set(['lease-1', 'lease-2']);
      render(<LeaseTableWithSelection {...defaultProps} selectedIds={selectedIds} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[1]).toBeChecked(); // lease-1
      expect(checkboxes[2]).toBeChecked(); // lease-2
      expect(checkboxes[3]).not.toBeChecked(); // lease-3
    });

    it('should show indeterminate state when some leases selected', () => {
      const selectedIds = new Set(['lease-1']);
      render(<LeaseTableWithSelection {...defaultProps} selectedIds={selectedIds} />);

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      expect(headerCheckbox).toHaveProperty('indeterminate', true);
    });

    it('should show checked header when all leases selected', () => {
      const selectedIds = new Set(mockLeases.map((l) => l.id));
      render(<LeaseTableWithSelection {...defaultProps} selectedIds={selectedIds} />);

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      expect(headerCheckbox).toBeChecked();
      expect(headerCheckbox).toHaveProperty('indeterminate', false);
    });
  });

  describe('Row expansion', () => {
    it('should expand row and show detail panel when row is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const firstRow = screen.getByText('192.168.1.100').closest('tr');
      await user.click(firstRow!);

      await waitFor(() => {
        expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
        expect(screen.getByText('Detail for laptop-work')).toBeInTheDocument();
      });
    });

    it('should collapse row when clicked again', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const firstRow = screen.getByText('192.168.1.100').closest('tr');

      // Expand
      await user.click(firstRow!);
      await waitFor(() => {
        expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
      });

      // Collapse
      await user.click(firstRow!);
      await waitFor(() => {
        expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
      });
    });

    it('should not expand when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const checkbox = screen.getAllByRole('checkbox')[1];
      await user.click(checkbox);

      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by IP address when column header is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const ipHeader = screen.getByText('IP Address');
      await user.click(ipHeader);

      const rows = screen.getAllByRole('row');
      // Check if first data row contains the first IP in sorted order
      expect(rows[1]).toHaveTextContent('192.168.1.50');
    });

    it('should toggle sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const ipHeader = screen.getByText('IP Address');

      // First click - ascending
      await user.click(ipHeader);
      const rows1 = screen.getAllByRole('row');
      expect(rows1[1]).toHaveTextContent('192.168.1.50');

      // Second click - descending
      await user.click(ipHeader);
      const rows2 = screen.getAllByRole('row');
      expect(rows2[1]).toHaveTextContent('192.168.2.100');
    });

    it('should sort by MAC address', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const macHeader = screen.getByText('MAC Address');
      await user.click(macHeader);

      // Verify sorting occurred (first MAC should be 00:11:22:33:44:55)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('00:11:22:33:44:55');
    });

    it('should sort by hostname', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const hostnameHeader = screen.getByText('Hostname');
      await user.click(hostnameHeader);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('blocked-device');
    });

    it('should sort by status', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const statusHeader = screen.getByText('Status');
      await user.click(statusHeader);

      // All bound leases should come first
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('bound');
    });
  });

  describe('Search filtering', () => {
    it('should filter leases by IP address', () => {
      const filteredLeases = mockLeases.filter((l) => l.address.includes('192.168.1.100'));
      render(<LeaseTableWithSelection {...defaultProps} leases={filteredLeases} />);

      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.queryByText('192.168.2.100')).not.toBeInTheDocument();
    });

    it('should filter leases by MAC address', () => {
      const filteredLeases = mockLeases.filter((l) =>
        l.macAddress.includes('00:11:22:33:44:55')
      );
      render(<LeaseTableWithSelection {...defaultProps} leases={filteredLeases} />);

      expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
      expect(screen.queryByText('00:11:22:33:44:56')).not.toBeInTheDocument();
    });

    it('should filter leases by hostname', () => {
      const filteredLeases = mockLeases.filter((l) =>
        l.hostname?.toLowerCase().includes('laptop')
      );
      render(<LeaseTableWithSelection {...defaultProps} leases={filteredLeases} />);

      expect(screen.getByText('laptop-work')).toBeInTheDocument();
      expect(screen.queryByText('phone-android')).not.toBeInTheDocument();
    });
  });

  describe('Quick actions', () => {
    it('should render Make Static button in detail panel', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      // Expand first row
      const firstRow = screen.getByText('192.168.1.100').closest('tr');
      await user.click(firstRow!);

      // Make Static button should be visible in detail panel
      await waitFor(() => {
        expect(screen.getByText('Make Static')).toBeInTheDocument();
      });
    });

    it('should render Delete button in detail panel', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      // Expand first row
      const firstRow = screen.getByText('192.168.1.100').closest('tr');
      await user.click(firstRow!);

      // Delete button should be visible in detail panel
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });
  });

  describe('Status badges', () => {
    it('should render bound status with green badge', () => {
      render(<LeaseTableWithSelection {...defaultProps} />);

      const boundBadges = screen.getAllByText('bound');
      expect(boundBadges[0].closest('span')).toHaveClass('bg-semantic-success');
    });

    it('should render waiting status with yellow badge', () => {
      render(<LeaseTableWithSelection {...defaultProps} />);

      const waitingBadge = screen.getByText('waiting');
      expect(waitingBadge.closest('span')).toHaveClass('bg-semantic-warning');
    });

    it('should render blocked indicator for blocked leases', () => {
      render(<LeaseTableWithSelection {...defaultProps} />);

      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      render(<LeaseTableWithSelection {...defaultProps} />);

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      expect(headerCheckbox).toHaveAttribute('aria-label', 'Select all leases');

      const rowCheckbox = screen.getAllByRole('checkbox')[1];
      expect(rowCheckbox).toHaveAttribute('aria-label', expect.stringContaining('Select'));
    });

    it('should have proper table structure', () => {
      render(<LeaseTableWithSelection {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(7); // Including checkbox column
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LeaseTableWithSelection {...defaultProps} />);

      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      firstCheckbox.focus();

      // Press Space to toggle selection
      await user.keyboard(' ');
      expect(defaultProps.onSelectionChange).toHaveBeenCalled();
    });
  });
});
