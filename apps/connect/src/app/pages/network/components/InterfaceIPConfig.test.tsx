/**
 * Interface IP Configuration Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { type IPAddress } from '@nasnet/core/types';

import { InterfaceIPConfig } from './InterfaceIPConfig';


describe('InterfaceIPConfig', () => {
  const mockIPAddresses: IPAddress[] = [
    {
      id: '*1',
      address: '192.168.88.1/24',
      network: '192.168.88.0',
      interface: 'bridge',
      isDynamic: false,
      isDisabled: false,
    },
    {
      id: '*2',
      address: '10.0.0.2/24',
      network: '10.0.0.0',
      interface: 'ether1',
      isDynamic: true,
      isDisabled: false,
    },
    {
      id: '*3',
      address: '192.168.88.10/24',
      network: '192.168.88.0',
      interface: 'bridge',
      isDynamic: false,
      isDisabled: false,
    },
  ];

  it('should render IP addresses grouped by interface', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    expect(screen.getByText('bridge')).toBeInTheDocument();
    expect(screen.getByText('ether1')).toBeInTheDocument();
  });

  it('should display correct address count per interface', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    expect(screen.getByText(/\(2 addresses\)/)).toBeInTheDocument(); // bridge has 2
    expect(screen.getByText(/\(1 address\)/)).toBeInTheDocument(); // ether1 has 1
  });

  it('should display IP addresses in CIDR notation', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    expect(screen.getByText('192.168.88.1/24')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.2/24')).toBeInTheDocument();
  });

  it('should display static badge for static IPs', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    const staticBadges = screen.getAllByText('Static');
    expect(staticBadges).toHaveLength(2); // Two static IPs
  });

  it('should display dynamic badge for dynamic IPs', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
  });

  it('should display disabled badge for disabled IPs', () => {
    const disabledIP: IPAddress = {
      id: '*4',
      address: '172.16.0.1/24',
      network: '172.16.0.0',
      interface: 'ether2',
      isDynamic: false,
      isDisabled: true,
    };

    render(<InterfaceIPConfig ipAddresses={[disabledIP]} />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should display network information', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    expect(screen.getByText(/Network:/)).toBeInTheDocument();
    expect(screen.getByText(/Netmask:/)).toBeInTheDocument();
    expect(screen.getByText(/Broadcast:/)).toBeInTheDocument();
  });

  it('should show empty state when no IP addresses', () => {
    render(<InterfaceIPConfig ipAddresses={[]} />);
    expect(screen.getByText('No IP addresses configured')).toBeInTheDocument();
  });

  it('should handle multiple IPs on same interface', () => {
    render(<InterfaceIPConfig ipAddresses={mockIPAddresses} />);
    // bridge interface should show both IPs
    expect(screen.getByText('192.168.88.1/24')).toBeInTheDocument();
    expect(screen.getByText('192.168.88.10/24')).toBeInTheDocument();
  });
});
