import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('renders with provided placeholder', () => {
    render(<NumberField placeholder="Enter number..." />);
    expect(screen.getByPlaceholderText('Enter number...')).toBeInTheDocument();
  });

  it('renders as number input type', () => {
    const { container } = render(<NumberField />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('type', 'number');
  });

  it('accepts and displays numeric value', async () => {
    const user = userEvent.setup();
    render(<NumberField placeholder="Port" />);
    const input = screen.getByPlaceholderText('Port') as HTMLInputElement;

    await user.type(input, '8080');
    expect(input.value).toBe('8080');
  });

  it('sets min attribute when min prop provided', () => {
    const { container } = render(<NumberField min={0} />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('min', '0');
  });

  it('sets max attribute when max prop provided', () => {
    const { container } = render(<NumberField max={65535} />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('max', '65535');
  });

  it('sets both min and max for constrained range', () => {
    const { container } = render(<NumberField min={1} max={65535} />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '65535');
  });

  it('sets step to 1 for integer input', () => {
    const { container } = render(<NumberField />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('step', '1');
  });

  it('applies monospace font for technical data display', () => {
    const { container } = render(<NumberField />);
    const input = container.querySelector('input');
    const classes = input?.className || '';

    expect(classes).toContain('font-mono');
    expect(classes).toContain('text-xs');
  });

  it('disables input when disabled prop is true', () => {
    render(<NumberField placeholder="Disabled" disabled={true} />);
    const input = screen.getByPlaceholderText('Disabled') as HTMLInputElement;

    expect(input.disabled).toBe(true);
  });

  it('sets aria-invalid when provided', () => {
    render(<NumberField placeholder="Field" aria-invalid={true} />);
    const input = screen.getByPlaceholderText('Field');

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <NumberField ref={ref} placeholder="Test" />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    const { container } = render(
      <NumberField className="custom-class" />
    );
    const input = container.querySelector('input');

    expect(input?.className).toContain('custom-class');
  });

  it('combines monospace font with custom className', () => {
    const { container } = render(
      <NumberField className="custom-style" />
    );
    const input = container.querySelector('input');
    const classes = input?.className || '';

    expect(classes).toContain('font-mono');
    expect(classes).toContain('text-xs');
    expect(classes).toContain('custom-style');
  });

  it('respects all props simultaneously', () => {
    const { container } = render(
      <NumberField
        min={8}
        max={128}
        disabled={false}
        placeholder="Cache size"
        aria-invalid={false}
        className="port-field"
      />
    );
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '8');
    expect(input).toHaveAttribute('max', '128');
    expect(input).toHaveAttribute('step', '1');
    expect(input.disabled).toBe(false);
    expect(input.placeholder).toBe('Cache size');
    expect(input.className).toContain('port-field');
  });
});
