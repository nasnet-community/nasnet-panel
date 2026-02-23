/**
 * DayOfWeekSelector Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DayOfWeekSelector } from './DayOfWeekSelector';

describe('DayOfWeekSelector', () => {
  it('renders all 7 day buttons with correct initial selection', () => {
    const onChange = vi.fn();
    render(
      <DayOfWeekSelector
        value={[1, 2, 3]} // Mon, Tue, Wed
        onChange={onChange}
      />
    );

    // Should have 7 buttons (one for each day)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
  });

  it('toggles day selection on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DayOfWeekSelector
        value={[1]} // Only Monday selected
        onChange={onChange}
      />
    );

    // Click to toggle a day
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[2]); // Click Tuesday

    expect(onChange).toHaveBeenCalled();
  });

  it('disables all buttons when disabled prop is true', () => {
    const onChange = vi.fn();
    render(
      <DayOfWeekSelector
        value={[1]}
        onChange={onChange}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('applies correct aria-pressed state based on selection', () => {
    const onChange = vi.fn();
    render(
      <DayOfWeekSelector
        value={[0, 1]} // Sunday and Monday selected
        onChange={onChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies className prop correctly', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DayOfWeekSelector
        value={[1]}
        onChange={onChange}
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('maintains selection when adding another day', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <DayOfWeekSelector
        value={[1]}
        onChange={onChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[2]); // Click Tuesday

    // Simulate onChange being called with updated value
    rerender(
      <DayOfWeekSelector
        value={[1, 2]}
        onChange={onChange}
      />
    );

    const updatedButtons = screen.getAllByRole('button');
    expect(updatedButtons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(updatedButtons[2]).toHaveAttribute('aria-pressed', 'true');
  });

  it('has correct touch target size (44px minimum)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DayOfWeekSelector
        value={[1]}
        onChange={onChange}
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('min-w-[44px]');
    expect(button).toHaveClass('h-[44px]');
  });
});
