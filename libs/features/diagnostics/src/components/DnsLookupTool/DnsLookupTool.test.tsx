/**
 * DNS Lookup Tool - Component Tests
 *
 * Component tests for DnsLookupTool covering form rendering,
 * validation, user interactions, and accessibility.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.11
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { DnsLookupToolDesktop } from './DnsLookupToolDesktop';
import { GET_DNS_SERVERS } from './dnsLookup.graphql';

const mockDnsServers = {
  servers: [
    { address: '8.8.8.8', isPrimary: true, isSecondary: false },
    { address: '1.1.1.1', isPrimary: false, isSecondary: true },
  ],
  primary: '8.8.8.8',
  secondary: '1.1.1.1',
};

describe('DnsLookupTool', () => {
  const deviceId = 'test-device-123';

  it('should render form with hostname input and lookup button', () => {
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DnsLookupToolDesktop deviceId={deviceId} />
      </MockedProvider>
    );

    // Check form elements are present
    expect(screen.getByLabelText(/hostname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/record type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dns server/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lookup/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid hostname', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DnsLookupToolDesktop deviceId={deviceId} />
      </MockedProvider>
    );

    const hostnameInput = screen.getByLabelText(/hostname/i);
    const lookupButton = screen.getByRole('button', { name: /lookup/i });

    // Enter invalid hostname
    await user.type(hostnameInput, '-invalid-.com');

    // Wait for validation
    await waitFor(() => {
      expect(lookupButton).toBeDisabled();
    });
  });

  it('should enable lookup button when form is valid', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DnsLookupToolDesktop deviceId={deviceId} />
      </MockedProvider>
    );

    const hostnameInput = screen.getByLabelText(/hostname/i);
    const lookupButton = screen.getByRole('button', { name: /lookup/i });

    // Initially disabled (no hostname)
    expect(lookupButton).toBeDisabled();

    // Enter valid hostname
    await user.type(hostnameInput, 'google.com');

    // Wait for validation
    await waitFor(() => {
      expect(lookupButton).not.toBeDisabled();
    });
  });

  it('should have proper accessibility labels', () => {
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DnsLookupToolDesktop deviceId={deviceId} />
      </MockedProvider>
    );

    // Check for proper labels
    const hostnameInput = screen.getByLabelText(/hostname/i);
    expect(hostnameInput).toHaveAttribute('id', 'dns-hostname');
    expect(hostnameInput).toHaveAttribute('aria-describedby', 'dns-hostname-description');

    const recordTypeSelect = screen.getByLabelText(/record type/i);
    expect(recordTypeSelect).toHaveAttribute('id', 'record-type');
    expect(recordTypeSelect).toHaveAttribute('aria-describedby', 'record-type-description');

    const dnsServerSelect = screen.getByLabelText(/dns server/i);
    expect(dnsServerSelect).toHaveAttribute('id', 'dns-server');
    expect(dnsServerSelect).toHaveAttribute('aria-describedby', 'dns-server-description');
  });

  it('should show description text for form fields', () => {
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DnsLookupToolDesktop deviceId={deviceId} />
      </MockedProvider>
    );

    // Check for description texts
    expect(screen.getByText(/domain name or ip address for reverse lookup/i)).toBeInTheDocument();
    expect(screen.getByText(/type of dns record to query/i)).toBeInTheDocument();
    expect(screen.getByText(/dns server to query/i)).toBeInTheDocument();
  });
});
