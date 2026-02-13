/**
 * Tests for useQuietHoursConfig hook
 *
 * Covers: State management, form validation, event handlers, derived values
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useQuietHoursConfig } from './useQuietHoursConfig';
import type { QuietHoursConfig, DayOfWeek } from './types';

describe('useQuietHoursConfig', () => {
  describe('initialization', () => {
    it('initializes with default values when no initialValue provided', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      expect(result.current.startTime).toBe('22:00');
      expect(result.current.endTime).toBe('08:00');
      expect(result.current.bypassCritical).toBe(true);
      expect(result.current.daysOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6]); // All days
      expect(result.current.timezone).toBeTruthy(); // Browser timezone
    });

    it('initializes with provided initial values', () => {
      const onChange = vi.fn();
      const initialValue: Partial<QuietHoursConfig> = {
        startTime: '20:00',
        endTime: '06:00',
        timezone: 'America/New_York',
        bypassCritical: false,
        daysOfWeek: [1, 2, 3, 4, 5] as DayOfWeek[], // Weekdays only
      };

      const { result } = renderHook(() => useQuietHoursConfig(initialValue, onChange));

      expect(result.current.startTime).toBe('20:00');
      expect(result.current.endTime).toBe('06:00');
      expect(result.current.timezone).toBe('America/New_York');
      expect(result.current.bypassCritical).toBe(false);
      expect(result.current.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it('provides stable function references', () => {
      const onChange = vi.fn();
      const { result, rerender } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      const handlers = {
        handleTimeChange: result.current.handleTimeChange,
        handleTimezoneChange: result.current.handleTimezoneChange,
        handleBypassCriticalChange: result.current.handleBypassCriticalChange,
        handleDaysChange: result.current.handleDaysChange,
        handleSubmit: result.current.handleSubmit,
        handleReset: result.current.handleReset,
      };

      rerender();

      // Handler references should remain stable
      expect(result.current.handleTimeChange).toBe(handlers.handleTimeChange);
      expect(result.current.handleTimezoneChange).toBe(handlers.handleTimezoneChange);
      expect(result.current.handleBypassCriticalChange).toBe(handlers.handleBypassCriticalChange);
      expect(result.current.handleDaysChange).toBe(handlers.handleDaysChange);
      expect(result.current.handleSubmit).toBe(handlers.handleSubmit);
      expect(result.current.handleReset).toBe(handlers.handleReset);
    });
  });

  describe('handleTimeChange', () => {
    it('updates start and end time', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.handleTimeChange('23:00', '07:00');
      });

      expect(result.current.startTime).toBe('23:00');
      expect(result.current.endTime).toBe('07:00');
    });

    it('recalculates duration when time changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      // Default: 22:00 to 08:00 = 10 hours
      expect(result.current.duration).toBe('10 hours');

      act(() => {
        result.current.handleTimeChange('22:00', '06:00');
      });

      // 22:00 to 06:00 = 8 hours
      expect(result.current.duration).toBe('8 hours');
    });

    it('handles midnight-crossing time spans', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.handleTimeChange('23:00', '01:00');
      });

      expect(result.current.isTimeSpanCrossing).toBe(true);
      expect(result.current.duration).toBe('2 hours');
    });
  });

  describe('handleTimezoneChange', () => {
    it('updates timezone', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.handleTimezoneChange('Europe/London');
      });

      expect(result.current.timezone).toBe('Europe/London');
    });
  });

  describe('handleBypassCriticalChange', () => {
    it('updates bypassCritical flag', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      expect(result.current.bypassCritical).toBe(true); // Default

      act(() => {
        result.current.handleBypassCriticalChange(false);
      });

      expect(result.current.bypassCritical).toBe(false);

      act(() => {
        result.current.handleBypassCriticalChange(true);
      });

      expect(result.current.bypassCritical).toBe(true);
    });
  });

  describe('handleDaysChange', () => {
    it('updates selected days', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.handleDaysChange([1, 2, 3, 4, 5] as DayOfWeek[]); // Weekdays
      });

      expect(result.current.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty day selection', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.handleDaysChange([] as DayOfWeek[]);
      });

      expect(result.current.daysOfWeek).toEqual([]);
    });

    it('handles weekend-only selection', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.handleDaysChange([0, 6] as DayOfWeek[]); // Sunday, Saturday
      });

      expect(result.current.daysOfWeek).toEqual([0, 6]);
    });
  });

  describe('handleSubmit', () => {
    it('calls onChange with current values when form is valid', async () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      // Form should be valid by default
      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
      });

      act(() => {
        result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            startTime: '22:00',
            endTime: '08:00',
            bypassCritical: true,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          })
        );
      });
    });

    it('does not call onChange when form is invalid', async () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      // Make form invalid by setting invalid time format
      act(() => {
        result.current.form.setValue('startTime', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('handleReset', () => {
    it('resets form to initial values', () => {
      const onChange = vi.fn();
      const initialValue: Partial<QuietHoursConfig> = {
        startTime: '20:00',
        endTime: '06:00',
        timezone: 'America/New_York',
        bypassCritical: false,
        daysOfWeek: [1, 2, 3] as DayOfWeek[],
      };

      const { result } = renderHook(() => useQuietHoursConfig(initialValue, onChange));

      // Modify values
      act(() => {
        result.current.handleTimeChange('23:00', '07:00');
        result.current.handleBypassCriticalChange(true);
        result.current.handleDaysChange([0, 6] as DayOfWeek[]);
      });

      // Reset
      act(() => {
        result.current.handleReset();
      });

      // Should return to initial values
      expect(result.current.startTime).toBe('20:00');
      expect(result.current.endTime).toBe('06:00');
      expect(result.current.timezone).toBe('America/New_York');
      expect(result.current.bypassCritical).toBe(false);
      expect(result.current.daysOfWeek).toEqual([1, 2, 3]);
    });
  });

  describe('duration calculation', () => {
    it('calculates duration for normal time range', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '09:00', endTime: '17:00' }, onChange)
      );

      expect(result.current.duration).toBe('8 hours');
    });

    it('calculates duration for time range crossing midnight', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '22:00', endTime: '06:00' }, onChange)
      );

      expect(result.current.duration).toBe('8 hours');
    });

    it('handles fractional hours', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '22:00', endTime: '06:30' }, onChange)
      );

      expect(result.current.duration).toBe('8h 30m');
    });

    it('handles single hour', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '22:00', endTime: '23:00' }, onChange)
      );

      expect(result.current.duration).toBe('1 hour');
    });

    it('handles 24-hour range', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '00:00', endTime: '00:00' }, onChange)
      );

      expect(result.current.duration).toBe('0 hours');
    });
  });

  describe('isTimeSpanCrossing', () => {
    it('detects midnight crossing', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '22:00', endTime: '06:00' }, onChange)
      );

      expect(result.current.isTimeSpanCrossing).toBe(true);
    });

    it('detects non-crossing time range', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '09:00', endTime: '17:00' }, onChange)
      );

      expect(result.current.isTimeSpanCrossing).toBe(false);
    });

    it('handles same start and end time', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useQuietHoursConfig({ startTime: '12:00', endTime: '12:00' }, onChange)
      );

      expect(result.current.isTimeSpanCrossing).toBe(false);
    });
  });

  describe('validation', () => {
    it('validates time format', async () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      // Set invalid time format
      act(() => {
        result.current.form.setValue('startTime', '25:00', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
        expect(result.current.errors.startTime).toBeTruthy();
      });
    });

    it('validates timezone', async () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      // Set invalid timezone
      act(() => {
        result.current.form.setValue('timezone', '', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
        expect(result.current.errors.timezone).toBeTruthy();
      });
    });

    it('exposes errors as Record<string, string>', async () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      act(() => {
        result.current.form.setValue('startTime', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(typeof result.current.errors).toBe('object');
        expect(typeof result.current.errors.startTime).toBe('string');
      });
    });
  });

  describe('form state', () => {
    it('exposes form instance for advanced usage', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuietHoursConfig(undefined, onChange));

      expect(result.current.form).toBeDefined();
      expect(result.current.form.getValues).toBeInstanceOf(Function);
      expect(result.current.form.setValue).toBeInstanceOf(Function);
      expect(result.current.form.reset).toBeInstanceOf(Function);
    });
  });
});
