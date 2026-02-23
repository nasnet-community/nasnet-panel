import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('renders with provided placeholder', () => {
    render(<TextField placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('accepts and displays value', async () => {
    const user = userEvent.setup();
    render(<TextField placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;

    await user.type(input, 'test value');
    expect(input.value).toBe('test value');
  });

  it('applies monospace font for email type', () => {
    const { container } = render(<TextField type="email" />);
    const input = container.querySelector('input');
    const classes = input?.className || '';

    expect(classes).toContain('font-mono');
    expect(classes).toContain('text-xs');
  });

  it('applies monospace font for URL type', () => {
    const { container } = render(<TextField type="url" />);
    const input = container.querySelector('input');
    const classes = input?.className || '';

    expect(classes).toContain('font-mono');
    expect(classes).toContain('text-xs');
  });

  it('disables autocomplete when sensitive is true', () => {
    const { container } = render(<TextField sensitive={true} />);
    const input = container.querySelector('input');

    expect(input?.getAttribute('autocomplete')).toBe('off');
  });

  it('does not disable autocomplete when sensitive is false', () => {
    const { container } = render(<TextField sensitive={false} />);
    const input = container.querySelector('input');

    expect(input?.getAttribute('autocomplete')).toBeNull();
  });

  it('disables input when disabled prop is true', () => {
    render(<TextField placeholder="Disabled field" disabled={true} />);
    const input = screen.getByPlaceholderText('Disabled field') as HTMLInputElement;

    expect(input.disabled).toBe(true);
  });

  it('sets aria-invalid when provided', () => {
    render(<TextField placeholder="Field" aria-invalid={true} />);
    const input = screen.getByPlaceholderText('Field');

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <TextField ref={ref} placeholder="Test" />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TextField className="custom-class" />
    );
    const input = container.querySelector('input');

    expect(input?.className).toContain('custom-class');
  });

  it('handles password type with monospace font', () => {
    const { container } = render(<TextField type="password" />);
    const input = container.querySelector('input');
    const classes = input?.className || '';

    expect(classes).toContain('font-mono');
    expect(classes).toContain('text-xs');
  });
});
