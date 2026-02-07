import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { InterfaceList } from './InterfaceList';
import { GET_INTERFACES, INTERFACE_STATUS_CHANGED } from '@nasnet/api-client/queries';
import { InterfaceType, InterfaceStatus } from '@nasnet/api-client/generated';

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

const mockInterfaces = [
  {
    id: '*1',
    name: 'ether1',
    type: InterfaceType.Ethernet,
    status: InterfaceStatus.Up,
    enabled: true,
    running: true,
    macAddress: '00:11:22:33:44:55',
    mtu: 1500,
    ip: ['192.168.1.1/24'],
    txBytes: 1000000,
    rxBytes: 2000000,
    linkSpeed: '1Gbps',
    comment: 'WAN Link',
  },
  {
    id: '*2',
    name: 'bridge1',
    type: InterfaceType.Bridge,
    status: InterfaceStatus.Up,
    enabled: true,
    running: true,
    macAddress: '00:11:22:33:44:66',
    mtu: 1500,
    ip: ['10.0.0.1/24'],
    txBytes: 500000,
    rxBytes: 1000000,
    linkSpeed: null,
    comment: 'LAN Bridge',
  },
  {
    id: '*3',
    name: 'ether2',
    type: InterfaceType.Ethernet,
    status: InterfaceStatus.Down,
    enabled: false,
    running: false,
    macAddress: '00:11:22:33:44:77',
    mtu: 1500,
    ip: [],
    txBytes: 0,
    rxBytes: 0,
    linkSpeed: null,
    comment: null,
  },
];

const mocks = [
  {
    request: {
      query: GET_INTERFACES,
      variables: { routerId: 'router-1', type: undefined },
    },
    result: {
      data: {
        interfaces: {
          edges: mockInterfaces.map((node) => ({ node, __typename: 'InterfaceEdge' })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
            __typename: 'PageInfo',
          },
          totalCount: 3,
          __typename: 'InterfaceConnection',
        },
      },
    },
  },
  {
    request: {
      query: INTERFACE_STATUS_CHANGED,
      variables: { routerId: 'router-1' },
    },
    result: {
      data: {
        interfaceStatusChanged: {
          interfaceId: '*1',
          name: 'ether1',
          status: InterfaceStatus.Up,
          enabled: true,
          running: true,
          __typename: 'InterfaceStatusEvent',
        },
      },
    },
  },
];

describe('InterfaceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders interface list with data', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check all interfaces are rendered
    expect(await screen.findByText('ether1')).toBeInTheDocument();
    expect(screen.getByText('bridge1')).toBeInTheDocument();
    expect(screen.getByText('ether2')).toBeInTheDocument();
  });

  it('filters by type', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Find and change type filter
    const typeFilter = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeFilter, { target: { value: InterfaceType.Ethernet } });

    // Should show only ethernet interfaces
    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
      expect(screen.getByText('ether2')).toBeInTheDocument();
      expect(screen.queryByText('bridge1')).not.toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Find and change status filter
    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusFilter, { target: { value: InterfaceStatus.Down } });

    // Should show only down interfaces
    await waitFor(() => {
      expect(screen.getByText('ether2')).toBeInTheDocument();
      expect(screen.queryByText('ether1')).not.toBeInTheDocument();
      expect(screen.queryByText('bridge1')).not.toBeInTheDocument();
    });
  });

  it('searches by name', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'bridge' } });

    // Should show only bridge1
    await waitFor(() => {
      expect(screen.getByText('bridge1')).toBeInTheDocument();
      expect(screen.queryByText('ether1')).not.toBeInTheDocument();
      expect(screen.queryByText('ether2')).not.toBeInTheDocument();
    });
  });

  it('clears all filters', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Apply filters
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'bridge' } });

    await waitFor(() => {
      expect(screen.queryByText('ether1')).not.toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filter/i });
    fireEvent.click(clearButton);

    // All interfaces should be visible again
    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
      expect(screen.getByText('bridge1')).toBeInTheDocument();
      expect(screen.getByText('ether2')).toBeInTheDocument();
    });
  });

  it('selects multiple interfaces', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Find checkboxes (first one is "select all", rest are individual)
    const checkboxes = screen.getAllByRole('checkbox');

    // Select first interface
    fireEvent.click(checkboxes[1]);

    // Select second interface
    fireEvent.click(checkboxes[2]);

    // Should show selection count
    await waitFor(() => {
      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });
  });

  it('clears selection', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Select interfaces
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    await waitFor(() => {
      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    // Clear selection
    const clearSelectionButton = screen.getByRole('button', { name: /clear selection/i });
    fireEvent.click(clearSelectionButton);

    // Selection should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/2 selected/i)).not.toBeInTheDocument();
    });
  });

  it('opens detail panel on row click', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ether1')).toBeInTheDocument();
    });

    // Click on interface row
    const interfaceRow = screen.getByText('ether1').closest('tr');
    if (interfaceRow) {
      fireEvent.click(interfaceRow);
    }

    // Detail panel should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    const loadingMocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { routerId: 'router-1', type: undefined },
        },
        result: {
          data: undefined,
        },
        delay: Infinity,
      },
    ];

    render(
      <MockedProvider mocks={loadingMocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { routerId: 'router-1', type: undefined },
        },
        error: new Error('Failed to fetch interfaces'),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks} addTypename={true}>
        <InterfaceList routerId="router-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });
});
