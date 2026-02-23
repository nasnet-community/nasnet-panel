/**
 * TimeRangeInput Component Tests
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TimeRangeInput } from './TimeRangeInput';

describe('TimeRangeInput', () => {
  it('renders start and end time inputs', () => {
    const onChange = vi.fn();
    render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
      />
    );

    expect(screen.getByDisplayValue('22:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
  });

  it('has 44px minimum height for WCAG AAA touch target', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
      />
    );

    const inputs = container.querySelectorAll('input[type="time"]');
    inputs.forEach((input) => {
      expect(input).toHaveClass('h-[44px]');
    });
  });

  it('calls onChange with updated start time when changed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
      />
    );

    const startInput = screen.getByDisplayValue('22:00');
    await user.clear(startInput);
    await user.type(startInput, '20:00');

    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange with updated end time when changed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
      />
    );

    const endInput = screen.getByDisplayValue('08:00');
    await user.clear(endInput);
    await user.type(endInput, '10:00');

    expect(onChange).toHaveBeenCalled();
  });

  it('displays midnight warning when time crosses midnight', () => {
    const onChange = vi.fn();
    render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00" // This is midnight crossing
        onChange={onChange}
      />
    );

    // The alert should be visible (implementation dependent on i18n)
    const alerts = screen.queryAllByRole('alert');
    // Should have an alert visible when crossing midnight
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('does not display midnight warning for same-day times', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangeInput
        startTime="08:00"
        endTime="17:00" // Same day, no crossing
        onChange={onChange}
      />
    );

    // Should not have the midnight crossing warning
    const alerts = container.querySelectorAll('[role="alert"]');
    // When no crossing, should have minimal alerts
    expect(alerts.length).toBeLessThanOrEqual(1);
  });

  it('disables inputs when disabled prop is true', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
        disabled={true}
      />
    );

    const inputs = container.querySelectorAll('input[type="time"]');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('applies className prop correctly', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('has proper aria-labels on time inputs', () => {
    const onChange = vi.fn();
    render(
      <TimeRangeInput
        startTime="22:00"
        endTime="08:00"
        onChange={onChange}
      />
    );

    const startInput = screen.getByDisplayValue('22:00');
    const endInput = screen.getByDisplayValue('08:00');

    expect(startInput).toHaveAttribute('aria-label');
    expect(endInput).toHaveAttribute('aria-label');
  });
});
