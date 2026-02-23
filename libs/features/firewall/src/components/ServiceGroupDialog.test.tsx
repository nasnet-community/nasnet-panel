/**
 * ServiceGroupDialog Tests
 *
 * Test coverage:
 * - ✅ Renders in create mode
 * - ✅ Renders in edit mode with pre-selected services
 * - ✅ Form validation works
 * - ✅ Multi-select works (add/remove services)
 * - ✅ Preview shows correct port count
 * - ✅ Preview shows correct port list
 * - ✅ Protocol filter works
 * - ✅ Conflict detection shows error
 * - ✅ Successful submission calls createGroup
 * - ✅ Successful update calls updateGroup
 * - ✅ At least 1 service required validation
 * - ✅ axe-core violations = 0
 *
 * @module @nasnet/features/firewall/components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import type { ServiceGroup, ServicePortDefinition } from '@nasnet/core/types';

import { ServiceGroupDialog } from './ServiceGroupDialog';
import * as useCustomServicesModule from '../hooks/useCustomServices';

expect.extend(toHaveNoViolations);

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_SERVICES: ServicePortDefinition[] = [
  {
    port: 80,
    service: 'HTTP',
    protocol: 'tcp',
    category: 'web',
    description: 'Hypertext Transfer Protocol',
    isBuiltIn: true,
  },
  {
    port: 443,
    service: 'HTTPS',
    protocol: 'tcp',
    category: 'secure',
    description: 'HTTP over TLS/SSL',
    isBuiltIn: true,
  },
  {
    port: 8080,
    service: 'HTTP-Alt',
    protocol: 'tcp',
    category: 'web',
    description: 'HTTP Alternate',
    isBuiltIn: true,
  },
  {
    port: 53,
    service: 'DNS',
    protocol: 'both',
    category: 'network',
    description: 'Domain Name System',
    isBuiltIn: true,
  },
  {
    port: 123,
    service: 'NTP',
    protocol: 'udp',
    category: 'network',
    description: 'Network Time Protocol',
    isBuiltIn: true,
  },
  {
    port: 9999,
    service: 'my-app',
    protocol: 'tcp',
    category: 'custom',
    description: 'My custom application',
    isBuiltIn: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const MOCK_GROUPS: ServiceGroup[] = [
  {
    id: 'group-1',
    name: 'web-services',
    description: 'Common web services',
    ports: [80, 443, 8080],
    protocol: 'tcp',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// Mocks
// ============================================================================

const mockCreateGroup = vi.fn();
const mockUpdateGroup = vi.fn();

const mockUseCustomServices = {
  services: MOCK_SERVICES,
  customServices: MOCK_SERVICES.filter((s) => !s.isBuiltIn),
  serviceGroups: MOCK_GROUPS,
  addService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  createGroup: mockCreateGroup,
  updateGroup: mockUpdateGroup,
  deleteGroup: vi.fn(),
};

// ============================================================================
// Test Utilities
// ============================================================================

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

function renderDialog(props = {}) {
  return render(<ServiceGroupDialog {...defaultProps} {...props} />);
}

async function openServicePicker(user: ReturnType<typeof userEvent.setup>) {
  const pickerButton = screen.getByRole('combobox', { name: /select services/i });
  await user.click(pickerButton);
}

async function selectService(
  user: ReturnType<typeof userEvent.setup>,
  serviceName: string
) {
  const option = screen.getByRole('option', { name: new RegExp(serviceName, 'i') });
  await user.click(option);
}

// ============================================================================
// Tests
// ============================================================================

describe('ServiceGroupDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useCustomServicesModule, 'useCustomServices').mockReturnValue(
      mockUseCustomServices
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders in create mode', () => {
      renderDialog();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Group')).toBeInTheDocument();
      expect(
        screen.getByText(/group multiple services together/i)
      ).toBeInTheDocument();
    });

    it('renders in edit mode with pre-selected services', () => {
      renderDialog({ editGroup: MOCK_GROUPS[0] });

      expect(screen.getByText('Edit Group')).toBeInTheDocument();
      expect(screen.getByDisplayValue('web-services')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Common web services')).toBeInTheDocument();

      // Check that chips are displayed for pre-selected services
      expect(screen.getByText(/HTTP \(80\)/i)).toBeInTheDocument();
      expect(screen.getByText(/HTTPS \(443\)/i)).toBeInTheDocument();
      expect(screen.getByText(/HTTP-Alt \(8080\)/i)).toBeInTheDocument();
    });

    it('shows all required form fields', () => {
      renderDialog();

      expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/protocol/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select services/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = renderDialog();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // --------------------------------------------------------------------------
  // Form Validation Tests
  // --------------------------------------------------------------------------

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderDialog();

      const submitButton = screen.getByRole('button', { name: /create group/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/group name is required/i)).toBeInTheDocument();
      });
    });

    it('validates at least 1 service required', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Fill in name but don't select any services
      const nameInput = screen.getByLabelText(/group name/i);
      await user.type(nameInput, 'test-group');

      const submitButton = screen.getByRole('button', { name: /create group/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/group must contain at least one port/i)
        ).toBeInTheDocument();
      });
    });

    it('shows conflict error when group name exists', async () => {
      const user = userEvent.setup();
      mockCreateGroup.mockRejectedValueOnce(
        new Error('Service group "web-services" already exists. Please choose a different name.')
      );

      renderDialog();

      // Fill in form
      const nameInput = screen.getByLabelText(/group name/i);
      await user.type(nameInput, 'web-services');

      // Select a service
      await openServicePicker(user);
      await selectService(user, 'HTTP');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create group/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/service group "web-services" already exists/i)
        ).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Multi-Select Tests
  // --------------------------------------------------------------------------

  describe('Multi-Select', () => {
    it('allows selecting multiple services', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Open picker
      await openServicePicker(user);

      // Select multiple services
      await selectService(user, 'HTTP');
      await selectService(user, 'HTTPS');
      await selectService(user, 'HTTP-Alt');

      // Check chips are displayed
      expect(screen.getByText(/HTTP \(80\)/i)).toBeInTheDocument();
      expect(screen.getByText(/HTTPS \(443\)/i)).toBeInTheDocument();
      expect(screen.getByText(/HTTP-Alt \(8080\)/i)).toBeInTheDocument();
    });

    it('allows deselecting services via chip remove button', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Open picker and select a service
      await openServicePicker(user);
      await selectService(user, 'HTTP');

      // Verify chip is displayed
      expect(screen.getByText(/HTTP \(80\)/i)).toBeInTheDocument();

      // Find and click remove button
      const chip = screen.getByText(/HTTP \(80\)/i).closest('div');
      const removeButton = within(chip!).getByRole('button', { name: /remove http/i });
      await user.click(removeButton);

      // Verify chip is removed
      expect(screen.queryByText(/HTTP \(80\)/i)).not.toBeInTheDocument();
    });

    it('shows correct selected count in picker button', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Open picker
      await openServicePicker(user);

      // Select 2 services
      await selectService(user, 'HTTP');
      await selectService(user, 'HTTPS');

      // Close picker
      const pickerButton = screen.getByRole('combobox');
      await user.click(pickerButton);

      // Check button text
      expect(screen.getByText('2 services selected')).toBeInTheDocument();
    });

    it('has searchable service picker', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Open picker
      await openServicePicker(user);

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'http');

      // Verify filtered results
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('HTTPS')).toBeInTheDocument();
      expect(screen.getByText('HTTP-Alt')).toBeInTheDocument();
      expect(screen.queryByText('DNS')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Preview Tests
  // --------------------------------------------------------------------------

  describe('Preview', () => {
    it('shows correct port count in preview', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Select services
      await openServicePicker(user);
      await selectService(user, 'HTTP');
      await selectService(user, 'HTTPS');
      await selectService(user, 'HTTP-Alt');

      // Check preview
      await waitFor(() => {
        expect(screen.getByText('3 ports')).toBeInTheDocument();
      });
    });

    it('shows correct port list in preview', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Select services
      await openServicePicker(user);
      await selectService(user, 'HTTP');
      await selectService(user, 'HTTPS');
      await selectService(user, 'HTTP-Alt');

      // Check preview shows sorted port list
      await waitFor(() => {
        expect(screen.getByText('80, 443, 8080')).toBeInTheDocument();
      });
    });

    it('shows protocol in preview', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Select a service
      await openServicePicker(user);
      await selectService(user, 'HTTP');

      // Check protocol in preview
      await waitFor(() => {
        expect(screen.getByText(/Protocol: TCP/i)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Protocol Filter Tests
  // --------------------------------------------------------------------------

  describe('Protocol Filter', () => {
    it('filters services by TCP protocol', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Select TCP (default)
      expect(screen.getByLabelText('TCP')).toBeChecked();

      // Open picker
      await openServicePicker(user);

      // Verify TCP services are shown
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('HTTPS')).toBeInTheDocument();

      // Verify UDP-only services are NOT shown
      expect(screen.queryByText('NTP')).not.toBeInTheDocument();
    });

    it('filters services by UDP protocol', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Select UDP
      const udpRadio = screen.getByLabelText('UDP');
      await user.click(udpRadio);

      // Open picker
      await openServicePicker(user);

      // Verify UDP services are shown
      expect(screen.getByText('NTP')).toBeInTheDocument();

      // Verify TCP-only services are NOT shown
      expect(screen.queryByText('HTTP')).not.toBeInTheDocument();
    });

    it('shows all services when protocol is "both"', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Select "both"
      const bothRadio = screen.getByLabelText(/tcp & udp/i);
      await user.click(bothRadio);

      // Open picker
      await openServicePicker(user);

      // Verify all services are shown
      expect(screen.getByText('HTTP')).toBeInTheDocument(); // TCP
      expect(screen.getByText('NTP')).toBeInTheDocument(); // UDP
      expect(screen.getByText('DNS')).toBeInTheDocument(); // Both
    });
  });

  // --------------------------------------------------------------------------
  // Submission Tests
  // --------------------------------------------------------------------------

  describe('Submission', () => {
    it('calls createGroup on successful create', async () => {
      const user = userEvent.setup();
      mockCreateGroup.mockResolvedValueOnce(undefined);

      renderDialog();

      // Fill form
      const nameInput = screen.getByLabelText(/group name/i);
      await user.type(nameInput, 'my-group');

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'Test description');

      // Select services
      await openServicePicker(user);
      await selectService(user, 'HTTP');
      await selectService(user, 'HTTPS');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create group/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalledWith({
          name: 'my-group',
          description: 'Test description',
          ports: [80, 443],
          protocol: 'tcp',
        });
      });
    });

    it('calls updateGroup on successful update', async () => {
      const user = userEvent.setup();
      mockUpdateGroup.mockResolvedValueOnce(undefined);

      renderDialog({ editGroup: MOCK_GROUPS[0] });

      // Modify name
      const nameInput = screen.getByLabelText(/group name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'updated-name');

      // Submit
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateGroup).toHaveBeenCalledWith('group-1', {
          name: 'updated-name',
          description: 'Common web services',
          ports: [80, 443, 8080],
          protocol: 'tcp',
        });
      });
    });

    it('closes dialog after successful submission', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      mockCreateGroup.mockResolvedValueOnce(undefined);

      renderDialog({ onOpenChange });

      // Fill form
      const nameInput = screen.getByLabelText(/group name/i);
      await user.type(nameInput, 'test-group');

      // Select a service
      await openServicePicker(user);
      await selectService(user, 'HTTP');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create group/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveCreate: () => void;
      mockCreateGroup.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveCreate = resolve as () => void;
        })
      );

      renderDialog();

      // Fill form
      const nameInput = screen.getByLabelText(/group name/i);
      await user.type(nameInput, 'test-group');

      // Select a service
      await openServicePicker(user);
      await selectService(user, 'HTTP');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create group/i });
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve
      resolveCreate!();
    });
  });

  // --------------------------------------------------------------------------
  // Dialog Controls Tests
  // --------------------------------------------------------------------------

  describe('Dialog Controls', () => {
    it('closes dialog on cancel button click', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when dialog closes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderDialog();

      // Fill in some data
      const nameInput = screen.getByLabelText(/group name/i);
      await user.type(nameInput, 'test');

      // Close dialog
      rerender(<ServiceGroupDialog {...defaultProps} open={false} />);

      // Re-open dialog
      rerender(<ServiceGroupDialog {...defaultProps} open={true} />);

      // Verify form is reset
      expect(screen.getByLabelText(/group name/i)).toHaveValue('');
    });
  });
});
