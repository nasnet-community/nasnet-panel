/**
 * Component Tests for ManualRouterEntry
 * Tests for Epic 0.1, Story 0-1-2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualRouterEntry } from './ManualRouterEntry';

describe('ManualRouterEntry', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render manual entry form', () => {
    render(<ManualRouterEntry />);

    expect(screen.getByText(/add router manually/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ip address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/router name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add router/i })).toBeInTheDocument();
  });

  it('should display IP address input with placeholder', () => {
    render(<ManualRouterEntry />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    expect(ipInput).toBeInTheDocument();
    expect(ipInput).toHaveAttribute('type', 'text');
  });

  it('should display optional router name input', () => {
    render(<ManualRouterEntry />);

    const nameInput = screen.getByPlaceholderText('My Router');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });

  it('should allow user to enter IP address', () => {
    render(<ManualRouterEntry />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1') as HTMLInputElement;

    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });

    expect(ipInput.value).toBe('192.168.1.1');
  });

  it('should allow user to enter router name', () => {
    render(<ManualRouterEntry />);

    const nameInput = screen.getByPlaceholderText('My Router') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Office Router' } });

    expect(nameInput.value).toBe('Office Router');
  });

  it('should show error for empty IP address on submit', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add router/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ip address is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error for invalid IP address format', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    const submitButton = screen.getByRole('button', { name: /add router/i });

    fireEvent.change(ipInput, { target: { value: 'invalid-ip' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid ip address format/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate IPv4 format correctly', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    const submitButton = screen.getByRole('button', { name: /add router/i });

    // Test invalid formats
    const invalidIPs = [
      '256.1.1.1', // Octet > 255
      '192.168.1', // Missing octet
      '192.168.1.1.1', // Extra octet
      '192.168.1.a', // Letter in octet
      '192.168.-1.1', // Negative number
    ];

    for (const invalidIP of invalidIPs) {
      fireEvent.change(ipInput, { target: { value: invalidIP } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid ip address format/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      mockOnSubmit.mockClear();
    }
  });

  it('should accept valid IPv4 addresses', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    const submitButton = screen.getByRole('button', { name: /add router/i });

    const validIPs = ['192.168.88.1', '10.0.0.1', '172.16.0.1', '0.0.0.0', '255.255.255.255'];

    for (const validIP of validIPs) {
      fireEvent.change(ipInput, { target: { value: validIP } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          ipAddress: validIP,
          name: undefined,
        });
      });

      mockOnSubmit.mockClear();
    }
  });

  it('should call onSubmit with IP address and name when both provided', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    const nameInput = screen.getByPlaceholderText('My Router');
    const submitButton = screen.getByRole('button', { name: /add router/i });

    fireEvent.change(ipInput, { target: { value: '192.168.88.1' } });
    fireEvent.change(nameInput, { target: { value: 'Home Router' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        ipAddress: '192.168.88.1',
        name: 'Home Router',
      });
    });
  });

  it('should trim whitespace from inputs', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    const nameInput = screen.getByPlaceholderText('My Router');
    const submitButton = screen.getByRole('button', { name: /add router/i });

    fireEvent.change(ipInput, { target: { value: '  192.168.88.1  ' } });
    fireEvent.change(nameInput, { target: { value: '  My Router  ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        ipAddress: '192.168.88.1',
        name: 'My Router',
      });
    });
  });

  it('should reset form after successful submission', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1') as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText('My Router') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /add router/i });

    fireEvent.change(ipInput, { target: { value: '192.168.88.1' } });
    fireEvent.change(nameInput, { target: { value: 'Test Router' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    expect(ipInput.value).toBe('');
    expect(nameInput.value).toBe('');
  });

  it('should clear error message when user starts typing', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');
    const submitButton = screen.getByRole('button', { name: /add router/i });

    // Trigger error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ip address is required/i)).toBeInTheDocument();
    });

    // Start typing - error should disappear
    fireEvent.change(ipInput, { target: { value: '192' } });

    await waitFor(() => {
      expect(screen.queryByText(/ip address is required/i)).not.toBeInTheDocument();
    });
  });

  it('should render cancel button when onCancel provided', () => {
    render(<ManualRouterEntry onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should not render cancel button when onCancel not provided', () => {
    render(<ManualRouterEntry />);

    const cancelButton = screen.queryByRole('button', { name: /cancel/i });
    expect(cancelButton).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', () => {
    render(<ManualRouterEntry onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should reset form when cancel is clicked', () => {
    render(<ManualRouterEntry onCancel={mockOnCancel} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1') as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText('My Router') as HTMLInputElement;

    // Fill in form
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    expect(ipInput.value).toBe('192.168.1.1');
    expect(nameInput.value).toBe('Test');

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(ipInput.value).toBe('');
    expect(nameInput.value).toBe('');
  });

  it('should display common MikroTik IP presets', () => {
    render(<ManualRouterEntry />);

    expect(screen.getByText(/common mikrotik ips/i)).toBeInTheDocument();
    expect(screen.getByText('192.168.88.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
  });

  it('should populate IP field when preset button clicked', () => {
    render(<ManualRouterEntry />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1') as HTMLInputElement;
    const presetButton = screen.getByRole('button', { name: '10.0.0.1' });

    fireEvent.click(presetButton);

    expect(ipInput.value).toBe('10.0.0.1');
  });

  it('should handle form submission via Enter key', async () => {
    render(<ManualRouterEntry onSubmit={mockOnSubmit} />);

    const ipInput = screen.getByPlaceholderText('192.168.88.1');

    fireEvent.change(ipInput, { target: { value: '192.168.88.1' } });
    fireEvent.submit(ipInput.closest('form')!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        ipAddress: '192.168.88.1',
        name: undefined,
      });
    });
  });

  it('should show helpful hint text for IP input', () => {
    render(<ManualRouterEntry />);

    expect(screen.getByText(/enter ipv4 address/i)).toBeInTheDocument();
  });

  it('should show helpful hint text for name input', () => {
    render(<ManualRouterEntry />);

    expect(screen.getByText(/give your router a friendly name/i)).toBeInTheDocument();
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<ManualRouterEntry />);

    const ipInput = screen.getByLabelText(/ip address/i);
    const nameInput = screen.getByLabelText(/router name/i);

    expect(ipInput).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
  });

  it('should mark IP address as required field', () => {
    render(<ManualRouterEntry />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
