import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BridgeForm } from './bridge-form';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BridgeForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders all form fields in create mode', () => {
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/Bridge Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Comment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/STP Protocol/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/VLAN Filtering/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/MTU/i)).toBeInTheDocument();
    });

    it('has correct default values in create mode', () => {
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i) as HTMLInputElement;
      const mtuInput = screen.getByLabelText(/MTU/i) as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(mtuInput.value).toBe('1500');
    });

    it('validates bridge name is required', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Create Bridge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Bridge name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates bridge name format', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i);
      await user.type(nameInput, 'invalid name!'); // Contains space and special char

      const submitButton = screen.getByRole('button', { name: /Create Bridge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name can only contain/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const nameInput = screen.getByLabelText(/Bridge Name/i);
      await user.type(nameInput, 'bridge1');

      const commentInput = screen.getByLabelText(/Comment/i);
      await user.type(commentInput, 'Test bridge');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create Bridge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'bridge1',
            comment: 'Test bridge',
            protocol: 'rstp',
            priority: 32768,
            vlanFiltering: false,
            pvid: 1,
            mtu: 1500,
          })
        );
      });
    });

    it('shows priority field when STP is enabled', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Priority should be visible by default (RSTP is default)
      expect(screen.getByLabelText(/Bridge Priority/i)).toBeInTheDocument();

      // Change to none
      const protocolSelect = screen.getByLabelText(/STP Protocol/i);
      await user.click(protocolSelect);
      const noneOption = screen.getByRole('option', { name: /None/i });
      await user.click(noneOption);

      // Priority should be hidden
      expect(screen.queryByLabelText(/Bridge Priority/i)).not.toBeInTheDocument();
    });

    it('shows PVID field when VLAN filtering is enabled', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // PVID should not be visible initially
      expect(screen.queryByLabelText(/PVID/i)).not.toBeInTheDocument();

      // Enable VLAN filtering
      const vlanFilteringSwitch = screen.getByLabelText(/VLAN Filtering/i);
      await user.click(vlanFilteringSwitch);

      // PVID should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/PVID/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockBridge = {
      uuid: 'bridge-1',
      name: 'bridge1',
      comment: 'Existing bridge',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'rstp',
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
    };

    it('populates form with bridge data', () => {
      render(
        <BridgeForm
          bridge={mockBridge}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i) as HTMLInputElement;
      const commentInput = screen.getByLabelText(/Comment/i) as HTMLTextAreaElement;

      expect(nameInput.value).toBe('bridge1');
      expect(commentInput.value).toBe('Existing bridge');
    });

    it('disables name field in edit mode', () => {
      render(
        <BridgeForm
          bridge={mockBridge}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i) as HTMLInputElement;
      expect(nameInput).toBeDisabled();
    });

    it('shows "Update Bridge" button in edit mode', () => {
      render(
        <BridgeForm
          bridge={mockBridge}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /Update Bridge/i })).toBeInTheDocument();
    });

    it('shows VLAN filtering warning when enabling for existing bridge', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={mockBridge}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enable VLAN filtering
      const vlanFilteringSwitch = screen.getByLabelText(/VLAN Filtering/i);
      await user.click(vlanFilteringSwitch);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Update Bridge/i });
      await user.click(submitButton);

      // Warning dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/Enable VLAN Filtering/i)).toBeInTheDocument();
      });

      // Submit should not be called yet
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits after confirming VLAN filtering warning', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <BridgeForm
          bridge={mockBridge}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Enable VLAN filtering
      const vlanFilteringSwitch = screen.getByLabelText(/VLAN Filtering/i);
      await user.click(vlanFilteringSwitch);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Update Bridge/i });
      await user.click(submitButton);

      // Confirm warning
      await waitFor(() => {
        expect(screen.getByText(/Enable VLAN Filtering/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Enable VLAN Filtering/i });
      await user.click(confirmButton);

      // Now submit should be called
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('validates MTU range (68-65535)', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i);
      await user.type(nameInput, 'bridge1');

      const mtuInput = screen.getByLabelText(/MTU/i);
      await user.clear(mtuInput);
      await user.type(mtuInput, '50'); // Below minimum

      const submitButton = screen.getByRole('button', { name: /Create Bridge/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('validates PVID range (1-4094)', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i);
      await user.type(nameInput, 'bridge1');

      // Enable VLAN filtering to show PVID
      const vlanFilteringSwitch = screen.getByLabelText(/VLAN Filtering/i);
      await user.click(vlanFilteringSwitch);

      await waitFor(() => {
        expect(screen.getByLabelText(/PVID/i)).toBeInTheDocument();
      });

      const pvidInput = screen.getByLabelText(/PVID/i);
      await user.clear(pvidInput);
      await user.type(pvidInput, '5000'); // Above maximum

      const submitButton = screen.getByRole('button', { name: /Create Bridge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Submitting State', () => {
    it('disables all inputs and shows loading state when submitting', async () => {
      const user = userEvent.setup();
      render(
        <BridgeForm
          bridge={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      );

      const nameInput = screen.getByLabelText(/Bridge Name/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Saving.../i });

      expect(nameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
