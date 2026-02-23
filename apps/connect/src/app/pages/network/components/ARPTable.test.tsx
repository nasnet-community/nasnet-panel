/**
 * ARP Table Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { type ARPEntry } from '@nasnet/core/types';

import { ARPTable } from './ARPTable';


describe('ARPTable', () => {
  const mockEntries: ARPEntry[] = [
    {
      id: '*1',
      ipAddress: '192.168.1.10',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      interface: 'bridge',
      status: 'complete',
      isDynamic: true,
    },
    {
      id: '*2',
      ipAddress: '192.168.1.2',
      macAddress: '11:22:33:44:55:66',
      interface: 'ether1',
      status: 'incomplete',
      isDynamic: true,
    },
    {
      id: '*3',
      ipAddress: '10.0.0.1',
      macAddress: 'FF:EE:DD:CC:BB:AA',
      interface: 'ether2',
      status: 'complete',
      isDynamic: false,
    },
  ];

  it('should render ARP table with entries', () => {
    render(<ARPTable entries={mockEntries} />);
    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText('MAC Address')).toBeInTheDocument();
    expect(screen.getByText('Interface')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should display IP addresses', () => {
    render(<ARPTable entries={mockEntries} />);
    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
  });

  it('should display formatted MAC addresses', () => {
    render(<ARPTable entries={mockEntries} />);
    expect(screen.getByText('AA:BB:CC:DD:EE:FF')).toBeInTheDocument();
    expect(screen.getByText('11:22:33:44:55:66')).toBeInTheDocument();
  });

  it('should display interface names', () => {
    render(<ARPTable entries={mockEntries} />);
    expect(screen.getByText('bridge')).toBeInTheDocument();
    expect(screen.getByText('ether1')).toBeInTheDocument();
    expect(screen.getByText('ether2')).toBeInTheDocument();
  });

  it('should display status badges', () => {
    render(<ARPTable entries={mockEntries} />);
    const completeBadges = screen.getAllByText('Complete');
    expect(completeBadges).toHaveLength(2);
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
  });

  it('should show empty state when no entries', () => {
    render(<ARPTable entries={[]} />);
    expect(screen.getByText('No ARP entries found')).toBeInTheDocument();
  });

  it('should sort by IP address numerically', async () => {
    const user = userEvent.setup();
    const { container } = render(<ARPTable entries={mockEntries} />);

    // Click IP Address header to sort
    const ipHeader = screen.getByText('IP Address');
    await user.click(ipHeader);

    // Get all table rows (excluding header)
    const rows = container.querySelectorAll('tbody tr');
    const firstIP = rows[0].querySelector('td')?.textContent;

    // Should be sorted: 10.0.0.1 first (numerically lowest)
    expect(firstIP).toBe('10.0.0.1');
  });

  it('should cycle through sort states: asc -> desc -> null', async () => {
    const user = userEvent.setup();
    render(<ARPTable entries={mockEntries} />);

    const ipHeader = screen.getByText('IP Address');

    // First click: ascending
    await user.click(ipHeader);
    // Icon should change to ChevronUp

    // Second click: descending
    await user.click(ipHeader);
    // Icon should change to ChevronDown

    // Third click: no sort
    await user.click(ipHeader);
    // Icon should change back to ChevronsUpDown
  });

  it('should sort by MAC address alphabetically', async () => {
    const user = userEvent.setup();
    const { container } = render(<ARPTable entries={mockEntries} />);

    const macHeader = screen.getByText('MAC Address');
    await user.click(macHeader);

    const rows = container.querySelectorAll('tbody tr');
    const firstMAC = rows[0].querySelectorAll('td')[1]?.textContent;

    // Should be sorted alphabetically
    expect(firstMAC).toBe('11:22:33:44:55:66');
  });

  it('should sort by interface name', async () => {
    const user = userEvent.setup();
    const { container } = render(<ARPTable entries={mockEntries} />);

    const interfaceHeader = screen.getByText('Interface');
    await user.click(interfaceHeader);

    const rows = container.querySelectorAll('tbody tr');
    const firstInterface = rows[0].querySelectorAll('td')[2]?.textContent;

    expect(firstInterface).toBe('bridge');
  });

  it('should sort by status (complete first)', async () => {
    const user = userEvent.setup();
    const { container } = render(<ARPTable entries={mockEntries} />);

    const statusHeader = screen.getByText('Status');
    await user.click(statusHeader);

    const rows = container.querySelectorAll('tbody tr');
    const firstStatus = rows[0].querySelectorAll('td')[3]?.textContent;

    // Complete status should come first
    expect(firstStatus).toBe('Complete');
  });
});
