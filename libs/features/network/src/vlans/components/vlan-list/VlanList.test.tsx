/**
 * Unit Tests for VlanList Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { VlanList } from './VlanList';
import { GET_VLANS, DELETE_VLAN } from '@nasnet/api-client/queries';

// Mock usePlatform hook
jest.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

const mockVlans = [
  {
    id: 'vlan-1',
    name: 'vlan-guest',
    vlanId: 10,
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    mtu: 1500,
    comment: 'Guest network',
    disabled: false,
    running: true,
  },
  {
    id: 'vlan-2',
    name: 'vlan-iot',
    vlanId: 20,
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    mtu: 1500,
    comment: 'IoT devices',
    disabled: false,
    running: true,
  },
];

const mocks = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    result: {
      data: {
        vlans: mockVlans,
      },
    },
  },
];

describe('VlanList', () => {
  it('should render VLAN list', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <VlanList routerId="router-1" />
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('vlan-guest')).toBeInTheDocument();
    });

    expect(screen.getByText('vlan-iot')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <VlanList routerId="router-1" />
      </MockedProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show empty state when no VLANs', async () => {
    const emptyMocks = [
      {
        request: {
          query: GET_VLANS,
          variables: { routerId: 'router-1', filter: undefined },
        },
        result: {
          data: {
            vlans: [],
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <VlanList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no vlans found/i)).toBeInTheDocument();
    });
  });

  it('should filter VLANs by search', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <VlanList routerId="router-1" />
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('vlan-guest')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search vlans/i);
    await user.type(searchInput, 'guest');

    // Only guest VLAN should be visible
    await waitFor(() => {
      expect(screen.getByText('vlan-guest')).toBeInTheDocument();
      expect(screen.queryByText('vlan-iot')).not.toBeInTheDocument();
    });
  });

  it('should have accessible labels', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <VlanList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('vlan-guest')).toBeInTheDocument();
    });

    // Check for ARIA labels on action buttons
    const editButtons = screen.getAllByLabelText(/edit vlan/i);
    expect(editButtons).toHaveLength(2);

    const deleteButtons = screen.getAllByLabelText(/delete vlan/i);
    expect(deleteButtons).toHaveLength(2);
  });

  it('should display status badges correctly', async () => {
    const mixedStatusMocks = [
      {
        request: {
          query: GET_VLANS,
          variables: { routerId: 'router-1', filter: undefined },
        },
        result: {
          data: {
            vlans: [
              { ...mockVlans[0], running: true, disabled: false }, // Running
              { ...mockVlans[1], running: false, disabled: false }, // Not Running
              {
                id: 'vlan-3',
                name: 'vlan-disabled',
                vlanId: 30,
                interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
                mtu: null,
                comment: null,
                disabled: true,
                running: false,
              }, // Disabled
            ],
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mixedStatusMocks} addTypename={false}>
        <VlanList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    expect(screen.getByText('Not Running')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
