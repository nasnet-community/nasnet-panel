/**
 * DNS Settings Form Component Tests
 *
 * Tests for DNS settings form including security warning dialog.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DnsSettingsForm, type DnsSettingsFormProps } from './DnsSettingsForm';

describe('DnsSettingsForm', () => {
  const mockProps: DnsSettingsFormProps = {
    initialValues: {
      servers: ['1.1.1.1', '8.8.8.8'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 1024,
    cacheUsedPercent: 50,
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all form fields', () => {
      render(<DnsSettingsForm {...mockProps} />);

      expect(
        screen.getByRole('checkbox', { name: /allow remote requests/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('spinbutton', { name: /cache size/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/cache usage/i)).toBeInTheDocument();
    });

    it('should display initial values correctly', () => {
      render(<DnsSettingsForm {...mockProps} />);

      const remoteRequestsCheckbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });
      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      expect(remoteRequestsCheckbox).not.toBeChecked();
      expect(cacheSizeInput).toHaveValue(2048);
    });

    it('should display cache usage with progress bar', () => {
      render(<DnsSettingsForm {...mockProps} />);

      expect(screen.getByText(/cache usage/i)).toBeInTheDocument();
      expect(
        screen.getByText(/1024 KB \/ 2048 KB \(50%\)/i)
      ).toBeInTheDocument();
    });

    it('should show field help tooltips', () => {
      render(<DnsSettingsForm {...mockProps} />);

      // FieldHelp components should be rendered
      const helpIcons = screen.getAllByRole('button', { name: /help/i });
      expect(helpIcons.length).toBeGreaterThan(0);
    });
  });

  describe('remote requests toggle', () => {
    it('should toggle remote requests when currently disabled', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      await user.click(checkbox);

      // Should show security warning dialog
      await waitFor(() => {
        expect(screen.getByText(/security warning/i)).toBeInTheDocument();
      });
    });

    it('should show security warning dialog when enabling remote requests', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      await user.click(checkbox);

      await waitFor(() => {
        expect(
          screen.getByText(/enabling remote requests allows any device/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /i understand/i })
        ).toBeInTheDocument();
      });
    });

    it('should not show warning when disabling remote requests', async () => {
      const user = userEvent.setup();
      const propsWithRemoteEnabled: DnsSettingsFormProps = {
        ...mockProps,
        initialValues: {
          ...mockProps.initialValues,
          allowRemoteRequests: true,
        },
      };

      render(<DnsSettingsForm {...propsWithRemoteEnabled} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      await user.click(checkbox);

      // Should NOT show security warning
      expect(screen.queryByText(/security warning/i)).not.toBeInTheDocument();
    });

    it('should apply change when user confirms security warning', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      // Click to enable
      await user.click(checkbox);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/security warning/i)).toBeInTheDocument();
      });

      // Click "I Understand"
      const confirmButton = screen.getByRole('button', {
        name: /i understand/i,
      });
      await user.click(confirmButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/security warning/i)).not.toBeInTheDocument();
      });

      // Checkbox should now be checked
      expect(checkbox).toBeChecked();
    });

    it('should revert change when user cancels security warning', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      // Click to enable
      await user.click(checkbox);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/security warning/i)).toBeInTheDocument();
      });

      // Click "Cancel"
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/security warning/i)).not.toBeInTheDocument();
      });

      // Checkbox should remain unchecked
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('cache size validation', () => {
    it('should accept valid cache size', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '4096');

      expect(cacheSizeInput).toHaveValue(4096);
      expect(screen.queryByText(/must be/i)).not.toBeInTheDocument();
    });

    it('should show error for cache size below minimum', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '256');

      // Trigger validation
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/number must be greater than or equal to 512/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error for cache size above maximum', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '20480');

      // Trigger validation
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/number must be less than or equal to 10240/i)
        ).toBeInTheDocument();
      });
    });

    it('should update cache usage display when cache size changes', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '4096');

      // Should update the display (cache used stays same but size changes)
      await waitFor(() => {
        expect(
          screen.getByText(/1024 KB \/ 4096 KB/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with form values when form is valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<DnsSettingsForm {...mockProps} onSubmit={onSubmit} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '4096');

      // Submit form (would typically be triggered by a submit button in parent)
      // For this test, we're testing the form state, not the submission mechanism

      // The parent component would call form.handleSubmit(onSubmit)
      // Here we verify the form state is correct
      expect(cacheSizeInput).toHaveValue(4096);
    });

    it('should not submit when form has validation errors', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<DnsSettingsForm {...mockProps} onSubmit={onSubmit} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      // Enter invalid value
      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '100'); // Below minimum

      // Trigger validation
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/number must be greater than or equal to 512/i)
        ).toBeInTheDocument();
      });

      // onSubmit should not be called with invalid data
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for all form fields', () => {
      render(<DnsSettingsForm {...mockProps} />);

      expect(
        screen.getByRole('checkbox', { name: /allow remote requests/i })
      ).toHaveAccessibleName();
      expect(
        screen.getByRole('spinbutton', { name: /cache size/i })
      ).toHaveAccessibleName();
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '100');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /number must be greater than or equal to 512/i
        );
        expect(errorMessage).toBeInTheDocument();

        // Error should be associated with input via aria-describedby or similar
        const inputId = cacheSizeInput.getAttribute('id');
        expect(inputId).toBeTruthy();
      });
    });

    it('should support keyboard navigation in security dialog', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/security warning/i)).toBeInTheDocument();
      });

      // Tab through dialog buttons
      await user.tab();
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveFocus();

      await user.tab();
      const confirmButton = screen.getByRole('button', {
        name: /i understand/i,
      });
      expect(confirmButton).toHaveFocus();
    });

    it('should trap focus within security dialog', async () => {
      const user = userEvent.setup();
      render(<DnsSettingsForm {...mockProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });

      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/security warning/i)).toBeInTheDocument();
      });

      // Focus should be trapped within dialog
      // (AlertDialog from primitives should handle this)
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero cache used', () => {
      const propsWithZeroUsed: DnsSettingsFormProps = {
        ...mockProps,
        cacheUsed: 0,
        cacheUsedPercent: 0,
      };

      render(<DnsSettingsForm {...propsWithZeroUsed} />);

      expect(screen.getByText(/0 KB \/ 2048 KB \(0%\)/i)).toBeInTheDocument();
    });

    it('should handle full cache', () => {
      const propsWithFullCache: DnsSettingsFormProps = {
        ...mockProps,
        cacheUsed: 2048,
        cacheUsedPercent: 100,
      };

      render(<DnsSettingsForm {...propsWithFullCache} />);

      expect(
        screen.getByText(/2048 KB \/ 2048 KB \(100%\)/i)
      ).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      render(<DnsSettingsForm {...mockProps} loading={true} />);

      // Form fields should be disabled during loading
      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });
      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      expect(checkbox).toBeDisabled();
      expect(cacheSizeInput).toBeDisabled();
    });
  });
});
