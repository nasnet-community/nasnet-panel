import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BridgePortDiagram } from './BridgePortDiagram';
import * as queries from '@nasnet/api-client/queries';

// Mock API client hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useBridgePorts: vi.fn(),
  useAvailableInterfacesForBridge: vi.fn(),
  useAddBridgePort: vi.fn(),
  useRemoveBridgePort: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPorts = [
  {
    uuid: 'port-1',
    interfaceName: 'ether2',
    pvid: 1,
    frameTypes: 'ADMIT_ALL',
    ingressFiltering: false,
    taggedVlans: [10, 20],
    untaggedVlans: [1],
    role: 'designated',
    state: 'forwarding',
    pathCost: 10,
    edge: false,
  },
  {
    uuid: 'port-2',
    interfaceName: 'ether3',
    pvid: 10,
    frameTypes: 'ADMIT_ALL',
    ingressFiltering: true,
    taggedVlans: [],
    untaggedVlans: [10],
    role: 'root',
    state: 'forwarding',
    pathCost: 5,
    edge: true,
  },
];

const mockAvailableInterfaces = [
  {
    uuid: 'iface-1',
    name: 'ether4',
    type: 'ether',
    macAddress: '00:11:22:33:44:66',
  },
  {
    uuid: 'iface-2',
    name: 'wlan1',
    type: 'wlan',
    macAddress: 'AA:BB:CC:DD:EE:FF',
  },
];

describe('BridgePortDiagram', () => {
  const mockRefetchPorts = vi.fn();
  const mockRefetchInterfaces = vi.fn();
  const mockAddBridgePort = vi.fn();
  const mockRemoveBridgePort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (queries.useBridgePorts as any).mockReturnValue({
      ports: mockPorts,
      loading: false,
      error: null,
      refetch: mockRefetchPorts,
    });

    (queries.useAvailableInterfacesForBridge as any).mockReturnValue({
      interfaces: mockAvailableInterfaces,
      loading: false,
      error: null,
      refetch: mockRefetchInterfaces,
    });

    (queries.useAddBridgePort as any).mockReturnValue([
      mockAddBridgePort,
      { loading: false },
    ]);

    (queries.useRemoveBridgePort as any).mockReturnValue([
      mockRemoveBridgePort,
      { loading: false },
    ]);
  });

  it('renders bridge ports section', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText('Bridge Ports')).toBeInTheDocument();
    expect(screen.getByText('ether2')).toBeInTheDocument();
    expect(screen.getByText('ether3')).toBeInTheDocument();
  });

  it('renders available interfaces section', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText('Available Interfaces')).toBeInTheDocument();
    expect(screen.getByText('ether4')).toBeInTheDocument();
    expect(screen.getByText('wlan1')).toBeInTheDocument();
  });

  it('displays port VLAN information', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    // Check PVID display
    expect(screen.getByText(/PVID: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/PVID: 10/i)).toBeInTheDocument();

    // Check tagged VLANs
    expect(screen.getByText(/Tagged: 10, 20/i)).toBeInTheDocument();

    // Check untagged VLANs
    expect(screen.getByText(/Untagged: 1/i)).toBeInTheDocument();
  });

  it('displays STP role and state badges', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText('designated')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getAllByText('forwarding')).toHaveLength(2);
  });

  it('displays edge port indicator', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    const edgeBadges = screen.getAllByText('Edge');
    expect(edgeBadges).toHaveLength(1); // Only ether3 is edge
  });

  it('shows empty state when no ports', () => {
    (queries.useBridgePorts as any).mockReturnValue({
      ports: [],
      loading: false,
      error: null,
      refetch: mockRefetchPorts,
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText(/No ports assigned/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag an interface/i)).toBeInTheDocument();
  });

  it('shows loading state for ports', () => {
    (queries.useBridgePorts as any).mockReturnValue({
      ports: [],
      loading: true,
      error: null,
      refetch: mockRefetchPorts,
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    // Should show skeleton loaders
    expect(screen.queryByText('ether2')).not.toBeInTheDocument();
  });

  it('shows error state for ports', () => {
    (queries.useBridgePorts as any).mockReturnValue({
      ports: [],
      loading: false,
      error: new Error('Failed to load ports'),
      refetch: mockRefetchPorts,
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText(/Failed to load bridge ports/i)).toBeInTheDocument();
  });

  it('shows loading state for available interfaces', () => {
    (queries.useAvailableInterfacesForBridge as any).mockReturnValue({
      interfaces: [],
      loading: true,
      error: null,
      refetch: mockRefetchInterfaces,
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    // Should show skeleton loaders in available interfaces section
    expect(screen.queryByText('ether4')).not.toBeInTheDocument();
  });

  it('shows empty state when no available interfaces', () => {
    (queries.useAvailableInterfacesForBridge as any).mockReturnValue({
      interfaces: [],
      loading: false,
      error: null,
      refetch: mockRefetchInterfaces,
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText(/No interfaces available/i)).toBeInTheDocument();
  });

  it('shows remove confirmation dialog when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    // Find port node and hover to reveal actions
    const portNode = screen.getByText('ether2').closest('div');
    if (portNode) {
      await user.hover(portNode);
    }

    // Click remove button
    const removeButtons = screen.getAllByLabelText(/Remove.*from bridge/i);
    await user.click(removeButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/Remove port "ether2"/i)).toBeInTheDocument();
    });
  });

  it('calls removeBridgePort when confirmed', async () => {
    const user = userEvent.setup();
    mockRemoveBridgePort.mockResolvedValue({
      data: {
        removeBridgePort: {
          success: true,
          operationId: 'op-123',
          errors: [],
        },
      },
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    // Click remove button
    const removeButtons = screen.getAllByLabelText(/Remove.*from bridge/i);
    await user.click(removeButtons[0]);

    // Confirm removal
    await waitFor(() => {
      expect(screen.getByText(/Remove port/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Remove Port/i });
    await user.click(confirmButton);

    // Should call mutation
    await waitFor(() => {
      expect(mockRemoveBridgePort).toHaveBeenCalledWith({
        variables: { portId: 'port-1' },
      });
    });
  });

  it('refetches data after successful remove', async () => {
    const user = userEvent.setup();
    mockRemoveBridgePort.mockResolvedValue({
      data: {
        removeBridgePort: {
          success: true,
          operationId: 'op-123',
          errors: [],
        },
      },
    });

    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    // Remove port
    const removeButtons = screen.getAllByLabelText(/Remove.*from bridge/i);
    await user.click(removeButtons[0]);

    const confirmButton = await screen.findByRole('button', { name: /Remove Port/i });
    await user.click(confirmButton);

    // Should refetch both lists
    await waitFor(() => {
      expect(mockRefetchPorts).toHaveBeenCalled();
      expect(mockRefetchInterfaces).toHaveBeenCalled();
    });
  });

  it('calls onEditPort when edit button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEditPort = vi.fn();

    render(
      <BridgePortDiagram
        bridgeId="bridge-1"
        routerId="router-1"
        onEditPort={mockOnEditPort}
      />
    );

    // Find and click edit button
    const editButtons = screen.getAllByLabelText(/Edit.*settings/i);
    await user.click(editButtons[0]);

    expect(mockOnEditPort).toHaveBeenCalledWith('port-1');
  });

  it('displays interface type badges for available interfaces', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText('ether')).toBeInTheDocument();
    expect(screen.getByText('wlan')).toBeInTheDocument();
  });

  it('displays MAC addresses for available interfaces', () => {
    render(<BridgePortDiagram bridgeId="bridge-1" routerId="router-1" />);

    expect(screen.getByText('00:11:22:33:44:66')).toBeInTheDocument();
    expect(screen.getByText('AA:BB:CC:DD:EE:FF')).toBeInTheDocument();
  });
});
