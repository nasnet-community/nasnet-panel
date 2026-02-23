import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders with provided placeholder', () => {
    render(<TextArea placeholder="Enter multi-line text..." />);
    expect(screen.getByPlaceholderText('Enter multi-line text...')).toBeInTheDocument();
  });

  it('accepts and displays multi-line value', async () => {
    const user = userEvent.setup();
    render(<TextArea placeholder="Type here" />);
    const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement;

    await user.type(textarea, 'line 1\nline 2\nline 3');
    expect(textarea.value).toBe('line 1\nline 2\nline 3');
  });

  it('sets default rows to 4', () => {
    const { container } = render(<TextArea />);
    const textarea = container.querySelector('textarea');

    expect(textarea?.rows).toBe(4);
  });

  it('respects custom rows prop', () => {
    const { container } = render(<TextArea rows={8} />);
    const textarea = container.querySelector('textarea');

    expect(textarea?.rows).toBe(8);
  });

  it('disables textarea when disabled prop is true', () => {
    render(<TextArea placeholder="Disabled field" disabled={true} />);
    const textarea = screen.getByPlaceholderText('Disabled field') as HTMLTextAreaElement;

    expect(textarea.disabled).toBe(true);
  });

  it('sets aria-invalid when provided', () => {
    render(<TextArea placeholder="Field" aria-invalid={true} />);
    const textarea = screen.getByPlaceholderText('Field');

    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <TextArea ref={ref} placeholder="Test" />
    );

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TextArea className="custom-class" />
    );
    const textarea = container.querySelector('textarea');

    expect(textarea?.className).toContain('custom-class');
  });

  it('includes resize-vertical class by default', () => {
    const { container } = render(<TextArea />);
    const textarea = container.querySelector('textarea');
    const classes = textarea?.className || '';

    expect(classes).toContain('resize-vertical');
  });

  it('combines resize-vertical with custom className', () => {
    const { container } = render(
      <TextArea className="custom-style" />
    );
    const textarea = container.querySelector('textarea');
    const classes = textarea?.className || '';

    expect(classes).toContain('resize-vertical');
    expect(classes).toContain('custom-style');
  });
});
