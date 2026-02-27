/**
 * AddServiceDialog Component Tests
 *
 * Test coverage:
 * - Renders in add mode (empty form)
 * - Renders in edit mode with pre-filled values
 * - Form validation (required fields, port range, service name format)
 * - Conflict detection (built-in + custom services)
 * - Successful submission calls addService
 * - Successful update calls updateService
 * - Cancel closes dialog without saving
 * - Dialog resets on close
 * - Accessibility (axe-core violations = 0)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { AddServiceDialog } from './AddServiceDialog';
import { useCustomServices } from '../hooks';
import type { CustomServicePortInput } from '@nasnet/core/types';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../hooks', () => ({
  useCustomServices: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'servicePorts.addService': 'Add Service',
        'servicePorts.editService': 'Edit Service',
        'servicePorts.fields.name': 'Service Name',
        'servicePorts.fields.protocol': 'Protocol',
        'servicePorts.fields.port': 'Port',
        'servicePorts.fields.description': 'Description',
        'servicePorts.protocols.tcp': 'TCP',
        'servicePorts.protocols.udp': 'UDP',
        'servicePorts.protocols.both': 'TCP & UDP',
        'servicePorts.placeholders.serviceName': 'e.g., my-app',
        'servicePorts.placeholders.port': 'e.g., 8080',
        'servicePorts.placeholders.description': 'Optional description',
        'servicePorts.validation.nameInvalid':
          'Name must be alphanumeric with optional hyphens/underscores',
        'servicePorts.validation.portInvalid': 'Invalid port number (1-65535)',
        'servicePorts.validation.descriptionTooLong':
          'Description must be less than 500 characters',
        'servicePorts.validation.nameExists': 'Service name already exists',
        'servicePorts.emptyStates.noServicesDescription':
          'Add custom services to use in firewall rules',
        'servicePorts.confirmations.deleteServiceDescription':
          'This action cannot be undone. The service will be removed from your custom list.',
      };
      return translations[key] || key;
    },
  }),
}));

// ============================================================================
// Test Setup
// ============================================================================

const mockAddService = vi.fn();
const mockUpdateService = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useCustomServices as ReturnType<typeof vi.fn>).mockReturnValue({
    addService: mockAddService,
    updateService: mockUpdateService,
    services: [],
    customServices: [],
    serviceGroups: [],
    deleteService: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

const sampleService: CustomServicePortInput = {
  port: 9999,
  service: 'my-app',
  protocol: 'tcp',
  description: 'My custom application',
};

// ============================================================================
// Tests: Rendering
// ============================================================================

describe('AddServiceDialog - Rendering', () => {
  it('renders in add mode with empty form', () => {
    render(<AddServiceDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Service' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Service Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Port/i)).toHaveValue(8080); // Default value
    // Check TCP radio by finding checked radio in the group
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked(); // TCP is first
    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
  });

  it('renders in edit mode with pre-filled values', () => {
    render(
      <AddServiceDialog
        {...defaultProps}
        editService={sampleService}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit Service' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Service Name/i)).toHaveValue('my-app');
    expect(screen.getByLabelText(/Port/i)).toHaveValue(9999);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked(); // TCP is checked
    expect(screen.getByLabelText(/Description/i)).toHaveValue('My custom application');
  });

  it('displays all protocol options', () => {
    render(<AddServiceDialog {...defaultProps} />);

    // Check we have 3 radio buttons (TCP, UDP, Both)
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // Check labels are present
    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('UDP')).toBeInTheDocument();
    expect(screen.getByText('TCP & UDP')).toBeInTheDocument();
  });
});

// ============================================================================
// Tests: Form Validation
// ============================================================================

describe('AddServiceDialog - Form Validation', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<AddServiceDialog {...defaultProps} />);

    // Clear required fields
    const serviceInput = screen.getByLabelText(/Service Name/i);
    await user.clear(serviceInput);

    const submitButton = screen.getByRole('button', { name: /Save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Service name is required/i)).toBeInTheDocument();
    });

    expect(mockAddService).not.toHaveBeenCalled();
  });

  it('validates port range (1-65535)', async () => {
    const user = userEvent.setup();
    render(<AddServiceDialog {...defaultProps} />);

    const portInput = screen.getByLabelText(/Port/i);
    const submitButton = screen.getByRole('button', { name: /Save/i });

    // Test port < 1
    await user.clear(portInput);
    await user.type(portInput, '0');
    await user.click(submitButton);

    // Zod schema should prevent submission with invalid port
    await waitFor(() => {
      expect(mockAddService).not.toHaveBeenCalled();
    });

    // Test port > 65535
    await user.clear(portInput);
    await user.type(portInput, '65536');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddService).not.toHaveBeenCalled();
    });
  });

  it('validates service name format (alphanumeric + hyphens/underscores)', async () => {
    const user = userEvent.setup();
    render(<AddServiceDialog {...defaultProps} />);

    const serviceInput = screen.getByLabelText(/Service Name/i);

    // Invalid characters
    await user.clear(serviceInput);
    await user.type(serviceInput, 'my service!'); // Spaces and special chars
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Service name must be alphanumeric with optional hyphens\/underscores/i)
      ).toBeInTheDocument();
    });

    expect(mockAddService).not.toHaveBeenCalled();
  });

  it('validates description max length (500 characters)', async () => {
    render(<AddServiceDialog {...defaultProps} />);

    const descriptionInput = screen.getByLabelText(/Description/i);

    // Textarea has maxLength attribute to prevent typing beyond 500
    expect(descriptionInput).toHaveAttribute('maxLength', '500');
  });
});

// ============================================================================
// Tests: Conflict Detection
// ============================================================================

describe('AddServiceDialog - Conflict Detection', () => {
  it('shows error when service name conflicts with built-in service', async () => {
    const user = userEvent.setup();
    const conflictError = new Error(
      'Service name "HTTP" conflicts with a built-in service. Please choose a different name.'
    );
    mockAddService.mockRejectedValueOnce(conflictError);

    render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.type(screen.getByLabelText(/Service Name/i), 'HTTP');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getByText(/conflicts with a built-in service/i)).toBeInTheDocument();
    });
  });

  it('shows error when service name conflicts with custom service', async () => {
    const user = userEvent.setup();
    const conflictError = new Error(
      'Service name "my-app" already exists. Please choose a different name.'
    );
    mockAddService.mockRejectedValueOnce(conflictError);

    render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.type(screen.getByLabelText(/Service Name/i), 'my-app');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Tests: Form Submission
// ============================================================================

describe('AddServiceDialog - Form Submission', () => {
  it('calls addService on successful submission (add mode)', async () => {
    const user = userEvent.setup();
    mockAddService.mockResolvedValueOnce(undefined);

    render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.type(screen.getByLabelText(/Service Name/i), 'test-service');
    await user.clear(screen.getByLabelText(/Port/i));
    await user.type(screen.getByLabelText(/Port/i), '3000');

    // Click UDP radio (second radio button)
    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]); // UDP is the second radio

    await user.type(screen.getByLabelText(/Description/i), 'Test service description');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(mockAddService).toHaveBeenCalledWith({
        service: 'test-service',
        port: 3000,
        protocol: 'udp',
        description: 'Test service description',
      });
    });

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls updateService on successful submission (edit mode)', async () => {
    const user = userEvent.setup();
    mockUpdateService.mockResolvedValueOnce(undefined);

    render(
      <AddServiceDialog
        {...defaultProps}
        editService={sampleService}
      />
    );

    await user.clear(screen.getByLabelText(/Port/i));
    await user.type(screen.getByLabelText(/Port/i), '7777');

    await user.click(screen.getByRole('button', { name: /Update/i }));

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledWith(9999, {
        service: 'my-app',
        port: 7777,
        protocol: 'tcp',
        description: 'My custom application',
      });
    });

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});

// ============================================================================
// Tests: Dialog Behavior
// ============================================================================

describe('AddServiceDialog - Dialog Behavior', () => {
  it('closes dialog without saving when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AddServiceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/Service Name/i), 'test');
    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockAddService).not.toHaveBeenCalled();
  });

  it('resets form when dialog closes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.type(screen.getByLabelText(/Service Name/i), 'test-service');

    // Close dialog
    rerender(
      <AddServiceDialog
        {...defaultProps}
        open={false}
      />
    );

    // Reopen dialog
    rerender(
      <AddServiceDialog
        {...defaultProps}
        open={true}
      />
    );

    // Form should be reset to defaults
    expect(screen.getByLabelText(/Service Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Port/i)).toHaveValue(8080);
  });

  it('disables buttons while submitting', async () => {
    const user = userEvent.setup();
    mockAddService.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.type(screen.getByLabelText(/Service Name/i), 'test-service');

    const submitButton = screen.getByRole('button', { name: /Save/i });
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });

    await user.click(submitButton);

    // Buttons should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });
});

// ============================================================================
// Tests: Accessibility
// ============================================================================

describe('AddServiceDialog - Accessibility', () => {
  it('has no accessibility violations (axe-core)', async () => {
    const { container } = render(<AddServiceDialog {...defaultProps} />);

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('properly labels all form fields', () => {
    render(<AddServiceDialog {...defaultProps} />);

    expect(screen.getByLabelText(/Service Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

    // Protocol radios - check we have 3 radios
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // Check protocol labels exist
    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('UDP')).toBeInTheDocument();
    expect(screen.getByText('TCP & UDP')).toBeInTheDocument();
  });

  it('uses aria-invalid for error states', async () => {
    const user = userEvent.setup();
    render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Service Name/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('associates error messages with inputs via aria-describedby', async () => {
    const user = userEvent.setup();
    render(<AddServiceDialog {...defaultProps} />);

    await user.clear(screen.getByLabelText(/Service Name/i));
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      const input = screen.getByLabelText(/Service Name/i);
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toBeInTheDocument();
    });
  });
});
