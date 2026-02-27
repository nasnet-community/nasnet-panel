/**
 * DHCP Client Form Component Tests
 *
 * Tests for DHCP WAN client configuration form including safety warning dialog.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 2: DHCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DhcpClientForm, type DhcpClientFormProps } from './DhcpClientForm';

// Mock InterfaceSelector component
vi.mock('@nasnet/ui/patterns', async () => {
  const actual = await vi.importActual('@nasnet/ui/patterns');
  return {
    ...actual,
    InterfaceSelector: ({ onSelect, disabled }: any) => (
      <div data-testid="interface-selector">
        <button
          onClick={() =>
            onSelect({ name: 'ether1', type: 'ether', macAddress: '00:11:22:33:44:55' })
          }
          disabled={disabled}
        >
          Select ether1
        </button>
        <button
          onClick={() =>
            onSelect({ name: 'ether2', type: 'ether', macAddress: '00:11:22:33:44:66' })
          }
          disabled={disabled}
        >
          Select ether2
        </button>
      </div>
    ),
  };
});

describe('DhcpClientForm', () => {
  const mockProps: DhcpClientFormProps = {
    routerId: 'router-123',
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all form sections', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.getByText(/interface configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/dhcp settings/i)).toBeInTheDocument();
      expect(screen.getByText(/optional settings/i)).toBeInTheDocument();
    });

    it('should render interface selector', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.getByTestId('interface-selector')).toBeInTheDocument();
      expect(screen.getByText(/select ether1/i)).toBeInTheDocument();
    });

    it('should render all DHCP settings switches', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.getByRole('switch', { name: /add default route/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /use peer dns/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /use peer ntp/i })).toBeInTheDocument();
    });

    it('should render comment input field', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.getByLabelText(/comment/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(
        <DhcpClientForm
          {...mockProps}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /configure dhcp/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('initial values', () => {
    it('should use default values when no initial values provided', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.getByRole('switch', { name: /add default route/i })).toBeChecked();
      expect(screen.getByRole('switch', { name: /use peer dns/i })).toBeChecked();
      expect(screen.getByRole('switch', { name: /use peer ntp/i })).not.toBeChecked();
      expect(screen.getByLabelText(/comment/i)).toHaveValue('');
    });

    it('should display provided initial values', () => {
      const initialValues = {
        interface: 'ether1',
        addDefaultRoute: false,
        usePeerDNS: false,
        usePeerNTP: true,
        comment: 'Primary WAN',
      };

      render(
        <DhcpClientForm
          {...mockProps}
          initialValues={initialValues}
        />
      );

      expect(screen.getByRole('switch', { name: /add default route/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /use peer dns/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /use peer ntp/i })).toBeChecked();
      expect(screen.getByLabelText(/comment/i)).toHaveValue('Primary WAN');
    });
  });

  describe('interface selection', () => {
    it('should update form when interface is selected', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const selectButton = screen.getByText(/select ether1/i);
      await user.click(selectButton);

      // Interface details should be displayed
      await waitFor(() => {
        expect(screen.getByText(/selected interface details/i)).toBeInTheDocument();
        expect(screen.getByText('ether1')).toBeInTheDocument();
        expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
      });
    });

    it('should mark form as dirty when interface is selected', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });

      // Submit should be disabled initially (form not dirty)
      expect(submitButton).toBeDisabled();

      const selectButton = screen.getByText(/select ether1/i);
      await user.click(selectButton);

      // Submit should be enabled after interface selection
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('DHCP settings toggles', () => {
    it('should toggle add default route', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const toggle = screen.getByRole('switch', { name: /add default route/i });

      // Initially checked (default)
      expect(toggle).toBeChecked();

      // Toggle off
      await user.click(toggle);
      expect(toggle).not.toBeChecked();

      // Toggle back on
      await user.click(toggle);
      expect(toggle).toBeChecked();
    });

    it('should toggle use peer DNS', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const toggle = screen.getByRole('switch', { name: /use peer dns/i });

      // Initially checked (default)
      expect(toggle).toBeChecked();

      // Toggle off
      await user.click(toggle);
      expect(toggle).not.toBeChecked();

      // Toggle back on
      await user.click(toggle);
      expect(toggle).toBeChecked();
    });

    it('should toggle use peer NTP', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const toggle = screen.getByRole('switch', { name: /use peer ntp/i });

      // Initially unchecked (default)
      expect(toggle).not.toBeChecked();

      // Toggle on
      await user.click(toggle);
      expect(toggle).toBeChecked();

      // Toggle back off
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });
  });

  describe('comment field', () => {
    it('should accept valid comment text', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const commentInput = screen.getByLabelText(/comment/i);

      await user.type(commentInput, 'Primary WAN connection');

      expect(commentInput).toHaveValue('Primary WAN connection');
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const commentInput = screen.getByLabelText(/comment/i);

      // Initial count
      expect(screen.getByText(/0\/255 characters/i)).toBeInTheDocument();

      await user.type(commentInput, 'Test comment');

      // Updated count
      await waitFor(() => {
        expect(screen.getByText(/12\/255 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for comment exceeding 255 characters', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const commentInput = screen.getByLabelText(/comment/i);

      // Type 256 characters (exceeds limit)
      const longComment = 'a'.repeat(256);
      await user.type(commentInput, longComment);

      await waitFor(() => {
        expect(screen.getByText(/comment cannot exceed 255 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('default route warning dialog', () => {
    it('should show warning when submitting with default route enabled', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      // Select interface
      await user.click(screen.getByText(/select ether1/i));

      // Submit form (default route is enabled by default)
      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      // Warning dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/default route warning/i)).toBeInTheDocument();
        expect(screen.getByText(/you are about to add a default route/i)).toBeInTheDocument();
      });
    });

    it('should not show warning when default route is disabled', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      // Select interface
      await user.click(screen.getByText(/select ether1/i));

      // Disable default route
      const defaultRouteToggle = screen.getByRole('switch', {
        name: /add default route/i,
      });
      await user.click(defaultRouteToggle);

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      // Warning dialog should NOT appear
      expect(screen.queryByText(/default route warning/i)).not.toBeInTheDocument();

      // onSubmit should be called directly
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalled();
      });
    });

    it('should call onSubmit when user confirms warning', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <DhcpClientForm
          {...mockProps}
          onSubmit={onSubmit}
        />
      );

      // Select interface and submit
      await user.click(screen.getByText(/select ether1/i));

      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      await user.click(submitButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/default route warning/i)).toBeInTheDocument();
      });

      // Click "I Understand, Proceed"
      const proceedButton = screen.getByRole('button', {
        name: /i understand, proceed/i,
      });
      await user.click(proceedButton);

      // onSubmit should be called
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          interface: 'ether1',
          addDefaultRoute: true,
          usePeerDNS: true,
          usePeerNTP: false,
          comment: '',
        });
      });

      // Dialog should close
      expect(screen.queryByText(/default route warning/i)).not.toBeInTheDocument();
    });

    it('should not call onSubmit when user cancels warning', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <DhcpClientForm
          {...mockProps}
          onSubmit={onSubmit}
        />
      );

      // Select interface and submit
      await user.click(screen.getByText(/select ether1/i));

      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      await user.click(submitButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/default route warning/i)).toBeInTheDocument();
      });

      // Click "Cancel"
      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      // onSubmit should NOT be called
      expect(onSubmit).not.toHaveBeenCalled();

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/default route warning/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('form validation', () => {
    it('should require interface selection', () => {
      render(<DhcpClientForm {...mockProps} />);

      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });

      // Submit button should be disabled when no interface is selected
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Select interface
      await user.click(screen.getByText(/select ether1/i));

      // Submit button should now be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('loading state', () => {
    it('should disable all inputs during loading', () => {
      render(
        <DhcpClientForm
          {...mockProps}
          loading={true}
        />
      );

      // Interface selector should be disabled
      const selectButtons = screen.getAllByRole('button');
      selectButtons.forEach((button) => {
        if (button.textContent?.includes('Select ether')) {
          expect(button).toBeDisabled();
        }
      });

      // Switches should be disabled
      expect(screen.getByRole('switch', { name: /add default route/i })).toBeDisabled();
      expect(screen.getByRole('switch', { name: /use peer dns/i })).toBeDisabled();
      expect(screen.getByRole('switch', { name: /use peer ntp/i })).toBeDisabled();

      // Comment input should be disabled
      expect(screen.getByLabelText(/comment/i)).toBeDisabled();
    });

    it('should show loading text on submit button', () => {
      render(
        <DhcpClientForm
          {...mockProps}
          loading={true}
        />
      );

      expect(screen.getByText(/configuring.../i)).toBeInTheDocument();
    });

    it('should disable submit button during loading', () => {
      render(
        <DhcpClientForm
          {...mockProps}
          loading={true}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /configuring.../i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(
        <DhcpClientForm
          {...mockProps}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for all form fields', () => {
      render(<DhcpClientForm {...mockProps} />);

      expect(screen.getByRole('switch', { name: /add default route/i })).toHaveAccessibleName();
      expect(screen.getByRole('switch', { name: /use peer dns/i })).toHaveAccessibleName();
      expect(screen.getByRole('switch', { name: /use peer ntp/i })).toHaveAccessibleName();
      expect(screen.getByLabelText(/comment/i)).toHaveAccessibleName();
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      const commentInput = screen.getByLabelText(/comment/i);

      // Enter invalid comment (too long)
      const longComment = 'a'.repeat(256);
      await user.type(commentInput, longComment);

      await waitFor(() => {
        const errorMessage = screen.getByText(/comment cannot exceed 255 characters/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should support keyboard navigation in warning dialog', async () => {
      const user = userEvent.setup();
      render(<DhcpClientForm {...mockProps} />);

      // Select interface and submit
      await user.click(screen.getByText(/select ether1/i));

      const submitButton = screen.getByRole('button', {
        name: /configure dhcp/i,
      });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/default route warning/i)).toBeInTheDocument();
      });

      // Dialog should be present
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
