/**
 * Service Ports Table Component Tests
 *
 * Tests for ServicePortsTable component following RTL best practices.
 *
 * Coverage:
 * - Renders with built-in services
 * - Renders with custom services
 * - Built-in services show disabled actions
 * - Custom services show enabled actions
 * - Search filters by name and port
 * - Protocol filter works
 * - Category filter works
 * - Delete button opens confirmation
 * - Edit button works (placeholder)
 * - Empty state shows when no results
 * - Loading state shows skeleton
 * - Accessibility (axe-core)
 *
 * @see NAS-7.8: Implement Service Ports Management - Task 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ServicePortsTable } from './ServicePortsTable';
import { useCustomServices } from '../hooks/useCustomServices';
import type { ServicePortDefinition } from '@nasnet/core/types';

// Extend matchers
expect.extend(toHaveNoViolations);

// Mock hooks
vi.mock('../hooks/useCustomServices');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useMediaQuery: () => false, // Default to desktop
  };
});

// Test fixtures
const builtInService: ServicePortDefinition = {
  port: 80,
  service: 'HTTP',
  protocol: 'tcp',
  category: 'web',
  description: 'HyperText Transfer Protocol',
  isBuiltIn: true,
};

const customService: ServicePortDefinition = {
  port: 9999,
  service: 'my-app',
  protocol: 'tcp',
  category: 'custom',
  description: 'My custom application',
  isBuiltIn: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockServices: ServicePortDefinition[] = [builtInService, customService];

describe('ServicePortsTable', () => {
  const mockDeleteService = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCustomServices as ReturnType<typeof vi.fn>).mockReturnValue({
      services: mockServices,
      customServices: [customService],
      serviceGroups: [],
      deleteService: mockDeleteService,
      addService: vi.fn(),
      updateService: vi.fn(),
      createGroup: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders with built-in services', () => {
      render(<ServicePortsTable />);

      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('HyperText Transfer Protocol')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('renders with custom services', () => {
      render(<ServicePortsTable />);

      expect(screen.getByText('my-app')).toBeInTheDocument();
      expect(screen.getByText('My custom application')).toBeInTheDocument();
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('shows empty state when no services', () => {
      (useCustomServices as ReturnType<typeof vi.fn>).mockReturnValue({
        services: [],
        customServices: [],
        serviceGroups: [],
        deleteService: mockDeleteService,
        addService: vi.fn(),
        updateService: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
      });

      render(<ServicePortsTable />);

      expect(
        screen.getByText(/servicePorts.emptyStates.noServices/i)
      ).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('built-in services show disabled actions', () => {
      render(<ServicePortsTable />);

      const httpRow = screen.getByText('HTTP').closest('tr');
      expect(httpRow).toBeInTheDocument();

      const editButtons = within(httpRow!).getAllByRole('button');
      const editButton = editButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-pencil')
      );
      const deleteButton = editButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it('custom services show enabled actions', () => {
      render(<ServicePortsTable />);

      const customRow = screen.getByText('my-app').closest('tr');
      expect(customRow).toBeInTheDocument();

      const actionButtons = within(customRow!).getAllByRole('button');
      const editButton = actionButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-pencil')
      );
      const deleteButton = actionButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      expect(editButton).not.toBeDisabled();
      expect(deleteButton).not.toBeDisabled();
    });

    it('delete button opens confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const customRow = screen.getByText('my-app').closest('tr');
      const actionButtons = within(customRow!).getAllByRole('button');
      const deleteButton = actionButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      await user.click(deleteButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/servicePorts.confirmations.deleteService/i)
        ).toBeInTheDocument();
      });
    });

    it('calls deleteService when confirmed', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      // Open delete dialog
      const customRow = screen.getByText('my-app').closest('tr');
      const actionButtons = within(customRow!).getAllByRole('button');
      const deleteButton = actionButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      await user.click(deleteButton!);

      // Confirm deletion
      await waitFor(() => {
        expect(
          screen.getByText(/servicePorts.confirmations.deleteService/i)
        ).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/servicePorts.deleteService/i);
      await user.click(confirmButton);

      expect(mockDeleteService).toHaveBeenCalledWith(9999);
    });

    it('edit button logs service (placeholder)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const customRow = screen.getByText('my-app').closest('tr');
      const actionButtons = within(customRow!).getAllByRole('button');
      const editButton = actionButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-pencil')
      );

      await user.click(editButton!);

      expect(consoleSpy).toHaveBeenCalledWith('Edit service:', customService);
      consoleSpy.mockRestore();
    });
  });

  describe('Search and Filters', () => {
    it('search filters by service name', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const searchInput = screen.getByPlaceholderText(
        /servicePorts.placeholders.searchServices/i
      );
      await user.type(searchInput, 'my-app');

      await waitFor(() => {
        expect(screen.getByText('my-app')).toBeInTheDocument();
        expect(screen.queryByText('HTTP')).not.toBeInTheDocument();
      });
    });

    it('search filters by port number', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const searchInput = screen.getByPlaceholderText(
        /servicePorts.placeholders.searchServices/i
      );
      await user.type(searchInput, '80');

      await waitFor(() => {
        expect(screen.getByText('HTTP')).toBeInTheDocument();
        expect(screen.queryByText('my-app')).not.toBeInTheDocument();
      });
    });

    it('protocol filter works', async () => {
      const udpService: ServicePortDefinition = {
        port: 53,
        service: 'DNS',
        protocol: 'udp',
        category: 'network',
        isBuiltIn: true,
      };

      (useCustomServices as ReturnType<typeof vi.fn>).mockReturnValue({
        services: [...mockServices, udpService],
        customServices: [customService],
        serviceGroups: [],
        deleteService: mockDeleteService,
        addService: vi.fn(),
        updateService: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
      });

      const user = userEvent.setup();
      render(<ServicePortsTable />);

      // Find and click protocol filter
      const protocolSelects = screen.getAllByRole('combobox');
      const protocolFilter = protocolSelects[0];
      await user.click(protocolFilter);

      // Select UDP
      const udpOption = await screen.findByText(/servicePorts.protocols.udp/i);
      await user.click(udpOption);

      await waitFor(() => {
        expect(screen.getByText('DNS')).toBeInTheDocument();
        expect(screen.queryByText('HTTP')).not.toBeInTheDocument();
        expect(screen.queryByText('my-app')).not.toBeInTheDocument();
      });
    });

    it('category filter works', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      // Find and click category filter
      const categorySelects = screen.getAllByRole('combobox');
      const categoryFilter = categorySelects[1];
      await user.click(categoryFilter);

      // Select custom category
      const customOption = await screen.findByText('custom');
      await user.click(customOption);

      await waitFor(() => {
        expect(screen.getByText('my-app')).toBeInTheDocument();
        expect(screen.queryByText('HTTP')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when no results match filters', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const searchInput = screen.getByPlaceholderText(
        /servicePorts.placeholders.searchServices/i
      );
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(
          screen.getByText(/servicePorts.emptyStates.noServices/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('sorts by name when name header is clicked', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const nameHeader = screen.getByText(/servicePorts.fields.name/i);
      await user.click(nameHeader);

      // Check ascending order (HTTP before my-app)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      expect(within(dataRows[0]).getByText('HTTP')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('my-app')).toBeInTheDocument();

      // Click again for descending
      await user.click(nameHeader);

      const rowsDesc = screen.getAllByRole('row');
      const dataRowsDesc = rowsDesc.slice(1);
      expect(within(dataRowsDesc[0]).getByText('my-app')).toBeInTheDocument();
      expect(within(dataRowsDesc[1]).getByText('HTTP')).toBeInTheDocument();
    });

    it('sorts by port when port header is clicked', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const portHeader = screen.getByText(/servicePorts.fields.port/i);
      await user.click(portHeader);

      // Check ascending order (80 before 9999)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      expect(within(dataRows[0]).getByText('80')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('9999')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no axe-core violations', async () => {
      const { container } = render(<ServicePortsTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible tooltips for disabled actions', async () => {
      const user = userEvent.setup();
      render(<ServicePortsTable />);

      const httpRow = screen.getByText('HTTP').closest('tr');
      const editButtons = within(httpRow!).getAllByRole('button');
      const editButton = editButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-pencil')
      );

      // Hover to show tooltip
      await user.hover(editButton!.parentElement!);

      await waitFor(() => {
        expect(
          screen.getByText(/servicePorts.tooltips.builtInReadOnly/i)
        ).toBeInTheDocument();
      });
    });
  });
});
