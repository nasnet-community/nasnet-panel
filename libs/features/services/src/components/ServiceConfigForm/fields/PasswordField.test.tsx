import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('renders with provided placeholder', () => {
    render(<PasswordField placeholder="Enter password..." />);
    expect(screen.getByPlaceholderText('Enter password...')).toBeInTheDocument();
  });

  it('renders as password type by default', () => {
    const { container } = render(<PasswordField placeholder="Test" />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('type', 'password');
  });

  it('accepts and displays password value', async () => {
    const user = userEvent.setup();
    render(<PasswordField placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement;

    await user.type(input, 'secret123');
    expect(input.value).toBe('secret123');
  });

  it('disables autocomplete', () => {
    const { container } = render(<PasswordField />);
    const input = container.querySelector('input');

    expect(input?.getAttribute('autocomplete')).toBe('off');
  });

  it('applies monospace font for technical display', () => {
    const { container } = render(<PasswordField />);
    const input = container.querySelector('input');
    const classes = input?.className || '';

    expect(classes).toContain('font-mono');
    expect(classes).toContain('text-xs');
  });

  it('toggles password visibility when show button clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<PasswordField placeholder="Test" />);
    const input = container.querySelector('input') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password');

    // Initially hidden
    expect(input).toHaveAttribute('type', 'password');

    // Click to show
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click to hide
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('updates toggle button label based on visibility', async () => {
    const user = userEvent.setup();
    const { container } = render(<PasswordField placeholder="Test" />);
    const toggleButton = screen.getByLabelText('Show password');

    // Initially shows "Show password"
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

    // After click, shows "Hide password"
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');

    // Click again
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
  });

  it('disables both input and toggle button when disabled is true', () => {
    render(
      <PasswordField
        placeholder="Disabled field"
        disabled={true}
      />
    );
    const input = screen.getByPlaceholderText('Disabled field') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password') as HTMLButtonElement;

    expect(input.disabled).toBe(true);
    expect(toggleButton.disabled).toBe(true);
  });

  it('sets aria-invalid on input when provided', () => {
    render(
      <PasswordField
        placeholder="Field"
        aria-invalid={true}
      />
    );
    const input = screen.getByPlaceholderText('Field');

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('toggle button has aria-hidden on icon', async () => {
    const user = userEvent.setup();
    const { container } = render(<PasswordField placeholder="Test" />);

    // The icon should have aria-hidden since the button has aria-label
    const icon = container.querySelector('svg');
    expect(icon?.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards ref correctly to input element', () => {
    const ref = { current: null };
    render(
      <PasswordField
        ref={ref}
        placeholder="Test"
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('toggle button has tabindex -1 to skip in tab order', () => {
    const { container } = render(<PasswordField />);
    const toggleButton = container.querySelector('button');

    expect(toggleButton).toHaveAttribute('tabindex', '-1');
  });

  it('applies custom className to input', () => {
    const { container } = render(<PasswordField className="custom-class" />);
    const input = container.querySelector('input');

    expect(input?.className).toContain('custom-class');
  });
});
