/**
 * Component Tests for CredentialDialog
 * Tests for Epic 0.1, Story 0-1-3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CredentialDialog } from './CredentialDialog';

describe('CredentialDialog', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    routerIp: '192.168.88.1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        isOpen={false}
      />
    );

    expect(screen.queryByText(/connect to router/i)).not.toBeInTheDocument();
  });

  it('should render dialog when isOpen is true', () => {
    render(<CredentialDialog {...defaultProps} />);

    expect(screen.getByText(/connect to router/i)).toBeInTheDocument();
    expect(screen.getByText('192.168.88.1')).toBeInTheDocument();
  });

  it('should display router name and IP when provided', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        routerName="Home Router"
      />
    );

    expect(screen.getByText('Home Router')).toBeInTheDocument();
    expect(screen.getByText(/\(192\.168\.88\.1\)/)).toBeInTheDocument();
  });

  it('should render username and password inputs', () => {
    render(<CredentialDialog {...defaultProps} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render connect and cancel buttons', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should render remember credentials checkbox', () => {
    render(<CredentialDialog {...defaultProps} />);

    expect(screen.getByLabelText(/remember credentials/i)).toBeInTheDocument();
  });

  it('should default remember credentials checkbox to checked', () => {
    render(<CredentialDialog {...defaultProps} />);

    const checkbox = screen.getByLabelText(/remember credentials/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should mask password by default', () => {
    render(<CredentialDialog {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('should toggle password visibility when toggle button clicked', () => {
    render(<CredentialDialog {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // SVG button has no text

    expect(passwordInput.type).toBe('password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should allow user to enter username', () => {
    render(<CredentialDialog {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    expect(usernameInput.value).toBe('testuser');
  });

  it('should allow user to enter password', () => {
    render(<CredentialDialog {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    expect(passwordInput.value).toBe('secret123');
  });

  it('should allow user to toggle remember credentials', () => {
    render(<CredentialDialog {...defaultProps} />);

    const checkbox = screen.getByLabelText(/remember credentials/i) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('should call onSubmit with credentials and save flag', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const saveCheckbox = screen.getByLabelText(/remember credentials/i);
    const submitButton = screen.getByRole('button', { name: /connect/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(saveCheckbox); // Uncheck
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        username: 'admin',
        password: 'password123',
      },
      false // saveCredentials is false
    );
  });

  it('should call onSubmit with saveCredentials true by default', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /connect/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'test' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.any(Object),
      true // saveCredentials defaults to true
    );
  });

  it('should trim whitespace from username', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /connect/i });

    fireEvent.change(usernameInput, { target: { value: '  admin  ' } });
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        username: 'admin', // Trimmed
        password: 'pass',
      },
      expect.any(Boolean)
    );
  });

  it('should disable submit button when username is empty', () => {
    render(<CredentialDialog {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', {
      name: /connect/i,
    }) as HTMLButtonElement;

    fireEvent.change(usernameInput, { target: { value: '' } });

    expect(submitButton.disabled).toBe(true);
  });

  it('should disable submit button when username is only whitespace', () => {
    render(<CredentialDialog {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', {
      name: /connect/i,
    }) as HTMLButtonElement;

    fireEvent.change(usernameInput, { target: { value: '   ' } });

    expect(submitButton.disabled).toBe(true);
  });

  it('should not call onSubmit when username is empty', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /connect/i });

    fireEvent.change(usernameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should reset form to defaults when cancel is clicked', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onCancel={mockOnCancel}
        initialCredentials={{ username: 'admin', password: '' }}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    // Change values
    fireEvent.change(usernameInput, { target: { value: 'changed' } });
    fireEvent.change(passwordInput, { target: { value: 'newpass' } });

    expect(usernameInput.value).toBe('changed');
    expect(passwordInput.value).toBe('newpass');

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Should reset to initial values
    expect(usernameInput.value).toBe('admin');
    expect(passwordInput.value).toBe('');
  });

  it('should display validation error when provided', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        validationError="Invalid username or password"
      />
    );

    expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
  });

  it('should show loading state when isValidating is true', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        isValidating={true}
      />
    );

    expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument();
  });

  it('should disable all inputs when isValidating is true', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        isValidating={true}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const saveCheckbox = screen.getByLabelText(/remember credentials/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /connecting/i,
    }) as HTMLButtonElement;
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    }) as HTMLButtonElement;

    expect(usernameInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(saveCheckbox.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);
  });

  it('should disable password toggle when isValidating is true', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        isValidating={true}
      />
    );

    // Find the password toggle button by type="button" (not submit)
    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons.find(
      (btn) => btn.getAttribute('type') === 'button' && !btn.textContent?.includes('Cancel')
    ) as HTMLButtonElement;

    expect(toggleButton.disabled).toBe(true);
  });

  it('should pre-fill username and password with initialCredentials', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        initialCredentials={{ username: 'testuser', password: 'testpass' }}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  it('should use default credentials when initialCredentials not provided', () => {
    render(<CredentialDialog {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(usernameInput.value).toBe('admin'); // DEFAULT_CREDENTIALS.username
    expect(passwordInput.value).toBe(''); // DEFAULT_CREDENTIALS.password
  });

  it('should handle form submission via Enter key', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const form = usernameInput.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        username: 'admin',
        password: 'password',
      },
      true
    );
  });

  it('should have autofocus on username input', () => {
    render(<CredentialDialog {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i);

    expect(usernameInput).toHaveAttribute('autofocus');
  });

  it('should display helpful hint about default credentials', () => {
    render(<CredentialDialog {...defaultProps} />);

    expect(screen.getByText(/default mikrotik credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/admin/)).toBeInTheDocument();
    expect(screen.getByText(/empty password/i)).toBeInTheDocument();
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<CredentialDialog {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const saveCheckbox = screen.getByLabelText(/remember credentials/i);

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(saveCheckbox).toBeInTheDocument();
  });

  it('should call onCancel when backdrop is clicked', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onCancel={mockOnCancel}
      />
    );

    // Find the backdrop (first motion.div with fixed positioning)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');

    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('should show spinner animation when validating', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        isValidating={true}
      />
    );

    // Check for spinner element
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle empty password (MikroTik default)', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /connect/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        username: 'admin',
        password: '',
      },
      true
    );
  });

  it('should not prevent form submission with empty password', () => {
    render(
      <CredentialDialog
        {...defaultProps}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', {
      name: /connect/i,
    }) as HTMLButtonElement;

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    // Password remains empty (default)

    expect(submitButton.disabled).toBe(false);

    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
