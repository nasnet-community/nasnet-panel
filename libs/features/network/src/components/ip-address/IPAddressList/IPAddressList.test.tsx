/**
 * IPAddressList Component Tests
 * NAS-6.2: IP Address Management
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IPAddressListDesktop } from './IPAddressListDesktop';
import type { IPAddressData, IPAddressFilters, IPAddressSortOptions } from './types';

// Mock data
const mockIpAddresses: IPAddressData[] = [
  {
    id: '1',
    address: '192.168.1.1/24',
    network: '192.168.1.0',
    broadcast: '192.168.1.255',
    interface: { id: 'ether1', name: 'ether1', type: 'ethernet' },
    disabled: false,
    dynamic: false,
    invalid: false,
    comment: 'Management IP',
  },
  {
    id: '2',
    address: '10.0.0.1/8',
    network: '10.0.0.0',
    broadcast: '10.255.255.255',
    interface: { id: 'ether2', name: 'ether2', type: 'ethernet' },
    disabled: false,
    dynamic: true, // DHCP-assigned
    invalid: false,
    comment: 'DHCP IP',
  },
  {
    id: '3',
    address: '172.16.0.1/16',
    network: '172.16.0.0',
    broadcast: '172.16.255.255',
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    disabled: true,
    dynamic: false,
    invalid: false,
  },
];

describe('IPAddressListDesktop', () => {
  const defaultFilters: IPAddressFilters = {
    source: 'all',
    status: 'all',
  };

  const defaultSortOptions: IPAddressSortOptions = {
    field: 'address',
    direction: 'asc',
  };

  const defaultProps = {
    ipAddresses: mockIpAddresses,
    loading: false,
    filters: defaultFilters,
    sortOptions: defaultSortOptions,
    onFiltersChange: vi.fn(),
    onSortChange: vi.fn(),
  };

  it('should render all IP addresses', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    expect(screen.getByText('192.168.1.1/24')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1/8')).toBeInTheDocument();
    expect(screen.getByText('172.16.0.1/16')).toBeInTheDocument();
  });

  it('should display "Dynamic" badge for DHCP-assigned addresses', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    const dynamicBadges = screen.getAllByText('Dynamic');
    expect(dynamicBadges).toHaveLength(1);
  });

  it('should display "Disabled" badge for disabled addresses', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    const disabledBadges = screen.getAllByText('Disabled');
    expect(disabledBadges).toHaveLength(1);
  });

  it('should display interface names', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    expect(screen.getByText('ether1')).toBeInTheDocument();
    expect(screen.getByText('ether2')).toBeInTheDocument();
    expect(screen.getByText('bridge1')).toBeInTheDocument();
  });

  it('should display network and broadcast addresses', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    expect(screen.getByText('192.168.1.0')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.255')).toBeInTheDocument();
  });

  it('should display comments', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    expect(screen.getByText('Management IP')).toBeInTheDocument();
    expect(screen.getByText('DHCP IP')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <IPAddressListDesktop
        {...defaultProps}
        loading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show empty state when no IP addresses', () => {
    render(
      <IPAddressListDesktop
        {...defaultProps}
        ipAddresses={[]}
      />
    );

    expect(
      screen.getByText('No IP addresses found. Add an IP address to get started.')
    ).toBeInTheDocument();
  });

  it('should show error message', () => {
    const error = 'Failed to fetch IP addresses';
    render(
      <IPAddressListDesktop
        {...defaultProps}
        error={error}
      />
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should filter by search text', () => {
    const onFiltersChange = vi.fn();
    render(
      <IPAddressListDesktop
        {...defaultProps}
        onFiltersChange={onFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search address or comment...');
    fireEvent.change(searchInput, { target: { value: 'Management' } });

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      searchText: 'Management',
    });
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <IPAddressListDesktop
        {...defaultProps}
        onEdit={onEdit}
      />
    );

    // Click the first Actions dropdown button
    const actionButtons = screen.getAllByRole('button', { name: /Actions for/ });
    fireEvent.click(actionButtons[0]);

    // Click Edit in dropdown
    const editButton = screen.getByRole('menuitem', { name: /Edit/ });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockIpAddresses[0]);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <IPAddressListDesktop
        {...defaultProps}
        onDelete={onDelete}
      />
    );

    // Click the first Actions dropdown button
    const actionButtons = screen.getAllByRole('button', { name: /Actions for/ });
    fireEvent.click(actionButtons[0]);

    // Click Delete in dropdown
    const deleteButton = screen.getByRole('menuitem', { name: /Delete/ });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockIpAddresses[0]);
  });

  it('should disable actions for dynamic IP addresses', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    // Get all action buttons
    const actionButtons = screen.getAllByRole('button', { name: /Actions for/ });

    // Click the second one (dynamic IP)
    fireEvent.click(actionButtons[1]);

    // Edit and Delete should be disabled
    const editMenuItem = screen.getByRole('menuitem', { name: /Edit/ });
    const deleteMenuItem = screen.getByRole('menuitem', { name: /Delete/ });

    expect(editMenuItem).toHaveAttribute('aria-disabled', 'true');
    expect(deleteMenuItem).toHaveAttribute('aria-disabled', 'true');
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(
      <IPAddressListDesktop
        {...defaultProps}
        onRefresh={onRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh/ });
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it('should show correct count in footer', () => {
    render(<IPAddressListDesktop {...defaultProps} />);

    expect(screen.getByText(/Showing 3 of 3 IP addresses/)).toBeInTheDocument();
  });

  it('should filter by interface name', () => {
    const filters: IPAddressFilters = {
      ...defaultFilters,
      interfaceName: 'ether1',
    };

    render(
      <IPAddressListDesktop
        {...defaultProps}
        filters={filters}
      />
    );

    // Should only show ether1
    expect(screen.getByText('192.168.1.1/24')).toBeInTheDocument();
    expect(screen.queryByText('10.0.0.1/8')).not.toBeInTheDocument();
    expect(screen.queryByText('172.16.0.1/16')).not.toBeInTheDocument();
  });

  it('should filter by source (static/dynamic)', () => {
    const filters: IPAddressFilters = {
      ...defaultFilters,
      source: 'dynamic',
    };

    render(
      <IPAddressListDesktop
        {...defaultProps}
        filters={filters}
      />
    );

    // Should only show dynamic IP
    expect(screen.getByText('10.0.0.1/8')).toBeInTheDocument();
    expect(screen.queryByText('192.168.1.1/24')).not.toBeInTheDocument();
  });

  it('should filter by status (enabled/disabled)', () => {
    const filters: IPAddressFilters = {
      ...defaultFilters,
      status: 'disabled',
    };

    render(
      <IPAddressListDesktop
        {...defaultProps}
        filters={filters}
      />
    );

    // Should only show disabled IP
    expect(screen.getByText('172.16.0.1/16')).toBeInTheDocument();
    expect(screen.queryByText('192.168.1.1/24')).not.toBeInTheDocument();
  });
});
