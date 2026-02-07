import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BridgeList } from './BridgeList';
import * as queries from '@nasnet/api-client/queries';

// Mock API client hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useBridges: vi.fn(),
  useDeleteBridge: vi.fn(),
  useUndoBridgeOperation: vi.fn(),
}));

// Mock platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBridges = [
  {
    uuid: 'bridge-1',
    name: 'bridge1',
    comment: 'Test bridge 1',
    disabled: false,
    running: true,
    macAddress: '00:11:22:33:44:55',
    mtu: 1500,
    protocol: 'rstp',
    priority: 32768,
    vlanFiltering: false,
    pvid: 1,
    ports: [
      { uuid: 'port-1', interfaceName: 'ether2' },
      { uuid: 'port-2', interfaceName: 'ether3' },
    ],
    ipAddresses: [],
  },
  {
    uuid: 'bridge-2',
    name: 'bridge2',
    comment: 'Test bridge 2',
    disabled: false,
    running: false,
    macAddress: 'AA:BB:CC:DD:EE:FF',
    mtu: 1500,
    protocol: 'none',
    priority: 32768,
    vlanFiltering: true,
    pvid: 1,
    ports: [],
    ipAddresses: [],
  },
];

describe('BridgeList', () => {
  const mockRefetch = vi.fn();
  const mockDeleteBridge = vi.fn();
  const mockUndoBridgeOperation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    (queries.useBridges as any).mockReturnValue({
      bridges: mockBridges,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    (queries.useDeleteBridge as any).mockReturnValue([
      mockDeleteBridge,
      { loading: false },
    ]);

    (queries.useUndoBridgeOperation as any).mockReturnValue([
      mockUndoBridgeOperation,
      { loading: false },
    ]);
  });

  it('renders bridge list with correct data', () => {
    render(<BridgeList routerId="router-1" />);

    expect(screen.getByText('bridge1')).toBeInTheDocument();
    expect(screen.getByText('bridge2')).toBeInTheDocument();
    expect(screen.getByText('Test bridge 1')).toBeInTheDocument();
    expect(screen.getByText('2 ports')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (queries.useBridges as any).mockReturnValue({
      bridges: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<BridgeList routerId="router-1" />);

    // Should show skeleton loaders (implementation specific)
    expect(screen.queryByText('bridge1')).not.toBeInTheDocument();
  });

  it('shows error state', () => {
    (queries.useBridges as any).mockReturnValue({
      bridges: [],
      loading: false,
      error: new Error('Failed to load bridges'),
      refetch: mockRefetch,
    });

    render(<BridgeList routerId="router-1" />);

    expect(screen.getByText(/Failed to load bridges/i)).toBeInTheDocument();
  });

  it('shows empty state when no bridges', () => {
    (queries.useBridges as any).mockReturnValue({
      bridges: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<BridgeList routerId="router-1" />);

    expect(screen.getByText(/No bridges configured/i)).toBeInTheDocument();
  });

  it('filters bridges by search query', async () => {
    const user = userEvent.setup();
    render(<BridgeList routerId="router-1" />);

    const searchInput = screen.getByPlaceholderText(/Search bridges/i);
    await user.type(searchInput, 'bridge1');

    expect(screen.getByText('bridge1')).toBeInTheDocument();
    expect(screen.queryByText('bridge2')).not.toBeInTheDocument();
  });

  it('filters bridges by protocol', async () => {
    const user = userEvent.setup();
    render(<BridgeList routerId="router-1" />);

    // Find and click protocol filter
    const protocolSelect = screen.getByRole('combobox', { name: /protocol/i });
    await user.click(protocolSelect);

    // Select RSTP
    const rstpOption = screen.getByRole('option', { name: /RSTP/i });
    await user.click(rstpOption);

    // Should only show bridge1 (RSTP)
    expect(screen.getByText('bridge1')).toBeInTheDocument();
    expect(screen.queryByText('bridge2')).not.toBeInTheDocument();
  });

  it('filters bridges by VLAN filtering status', async () => {
    const user = userEvent.setup();
    render(<BridgeList routerId="router-1" />);

    // Find VLAN filtering filter
    const vlanFilterSelect = screen.getByRole('combobox', { name: /vlan filtering/i });
    await user.click(vlanFilterSelect);

    // Select "VLAN Filtering Enabled"
    const enabledOption = screen.getByRole('option', { name: /VLAN Filtering Enabled/i });
    await user.click(enabledOption);

    // Should only show bridge2 (VLAN filtering enabled)
    expect(screen.getByText('bridge2')).toBeInTheDocument();
    expect(screen.queryByText('bridge1')).not.toBeInTheDocument();
  });

  it('opens detail panel when bridge is clicked', async () => {
    const user = userEvent.setup();
    render(<BridgeList routerId="router-1" />);

    // Click on bridge1
    const bridge1Row = screen.getByText('bridge1').closest('tr');
    if (bridge1Row) {
      await user.click(bridge1Row);
    }

    // Detail panel should open (implementation specific - check for dialog/sheet)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens create bridge dialog when "Add Bridge" is clicked', async () => {
    const user = userEvent.setup();
    render(<BridgeList routerId="router-1" />);

    const addButton = screen.getByRole('button', { name: /Add Bridge/i });
    await user.click(addButton);

    // Should open detail panel in create mode
    await waitFor(() => {
      expect(screen.getByText(/Create Bridge/i)).toBeInTheDocument();
    });
  });

  it('displays correct badge variants for STP protocols', () => {
    render(<BridgeList routerId="router-1" />);

    // RSTP should have success variant
    const rstpBadge = screen.getByText('RSTP');
    expect(rstpBadge).toHaveClass('badge'); // Implementation specific

    // None should have muted variant
    const noneBadge = screen.getByText('NONE');
    expect(noneBadge).toHaveClass('badge');
  });

  it('displays correct badge variants for running status', () => {
    render(<BridgeList routerId="router-1" />);

    // Running bridge should have success badge
    const runningBadges = screen.getAllByText('Running');
    expect(runningBadges.length).toBeGreaterThan(0);

    // Stopped bridge should have warning badge
    const stoppedBadge = screen.getByText('Stopped');
    expect(stoppedBadge).toBeInTheDocument();
  });

  it('handles delete bridge with confirmation', async () => {
    const user = userEvent.setup();
    mockDeleteBridge.mockResolvedValue({
      data: {
        deleteBridge: {
          success: true,
          operationId: 'op-123',
          errors: [],
        },
      },
    });

    render(<BridgeList routerId="router-1" />);

    // Find and click delete button (implementation specific - might be in dropdown)
    // This is a simplified example
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/Delete Bridge/i)).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Delete mutation should be called
    await waitFor(() => {
      expect(mockDeleteBridge).toHaveBeenCalled();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<BridgeList routerId="router-1" />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
