/**
 * useScheduleEditor Hook Tests
 * Comprehensive tests for the schedule editor headless hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { DayPresetKey } from '@nasnet/core/types/services/schedule.types';

import { useScheduleEditor } from './use-schedule-editor';


describe('useScheduleEditor', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      expect(result.current.schedule).toEqual({
        routingID: 'routing-123',
        days: [1, 2, 3, 4, 5], // Weekdays
        startTime: '09:00',
        endTime: '17:00',
        timezone: expect.any(String),
        enabled: true,
      });
      expect(result.current.selectedPreset).toBe('WEEKDAYS');
    });

    it('should initialize with custom initial schedule', () => {
      const initialSchedule = {
        days: [0, 6], // Weekends
        startTime: '10:00',
        endTime: '18:00',
        timezone: 'America/New_York',
        enabled: false,
      };

      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule,
        })
      );

      expect(result.current.schedule.days).toEqual([0, 6]);
      expect(result.current.schedule.startTime).toBe('10:00');
      expect(result.current.schedule.endTime).toBe('18:00');
      expect(result.current.schedule.timezone).toBe('America/New_York');
      expect(result.current.schedule.enabled).toBe(false);
      expect(result.current.selectedPreset).toBe('WEEKENDS');
    });

    it('should use custom default timezone', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          defaultTimezone: 'Europe/London',
        })
      );

      expect(result.current.schedule.timezone).toBe('Europe/London');
    });
  });

  describe('toggleDay', () => {
    it('should add day when not present', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1, 2, 3] },
        })
      );

      act(() => {
        result.current.toggleDay(4);
      });

      expect(result.current.schedule.days).toEqual([1, 2, 3, 4]);
    });

    it('should remove day when present', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1, 2, 3, 4, 5] },
        })
      );

      act(() => {
        result.current.toggleDay(3);
      });

      expect(result.current.schedule.days).toEqual([1, 2, 4, 5]);
    });

    it('should keep days sorted after adding', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1, 3, 5] },
        })
      );

      act(() => {
        result.current.toggleDay(2);
      });

      expect(result.current.schedule.days).toEqual([1, 2, 3, 5]);
    });

    it('should trigger validation after toggle', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1] },
        })
      );

      // Remove the only day to trigger validation error
      act(() => {
        result.current.toggleDay(1);
      });

      await waitFor(
        () => {
          expect(result.current.schedule.days).toEqual([]);
          expect(result.current.isValid).toBe(false);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('applyPreset', () => {
    it('should apply WEEKDAYS preset', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [0, 6] },
        })
      );

      act(() => {
        result.current.applyPreset('WEEKDAYS' as DayPresetKey);
      });

      expect(result.current.schedule.days).toEqual([1, 2, 3, 4, 5]);
      expect(result.current.selectedPreset).toBe('WEEKDAYS');
    });

    it('should apply WEEKENDS preset', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1, 2, 3, 4, 5] },
        })
      );

      act(() => {
        result.current.applyPreset('WEEKENDS' as DayPresetKey);
      });

      expect(result.current.schedule.days).toEqual([0, 6]);
      expect(result.current.selectedPreset).toBe('WEEKENDS');
    });

    it('should apply EVERY_DAY preset', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1] },
        })
      );

      act(() => {
        result.current.applyPreset('EVERY_DAY' as DayPresetKey);
      });

      expect(result.current.schedule.days).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(result.current.selectedPreset).toBe('EVERY_DAY');
    });
  });

  describe('selectedPreset detection', () => {
    it('should detect WEEKDAYS preset', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1, 2, 3, 4, 5] },
        })
      );

      expect(result.current.selectedPreset).toBe('WEEKDAYS');
    });

    it('should detect WEEKENDS preset', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [0, 6] },
        })
      );

      expect(result.current.selectedPreset).toBe('WEEKENDS');
    });

    it('should detect EVERY_DAY preset', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [0, 1, 2, 3, 4, 5, 6] },
        })
      );

      expect(result.current.selectedPreset).toBe('EVERY_DAY');
    });

    it('should return null for custom selection', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [1, 3, 5] },
        })
      );

      expect(result.current.selectedPreset).toBeNull();
    });

    it('should return null for empty days', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: { days: [] },
        })
      );

      expect(result.current.selectedPreset).toBeNull();
    });
  });

  describe('preview generation', () => {
    it('should generate preview for weekdays schedule', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: '09:00',
            endTime: '17:00',
            timezone: 'America/New_York',
            enabled: true,
          },
        })
      );

      expect(result.current.preview).toContain('Active Mon-Fri');
      expect(result.current.preview).toContain('09:00 - 17:00');
    });

    it('should generate preview for every day schedule', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [0, 1, 2, 3, 4, 5, 6],
            startTime: '00:00',
            endTime: '23:59',
            enabled: true,
          },
        })
      );

      expect(result.current.preview).toContain('Active every day');
    });

    it('should generate preview for weekend schedule', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [0, 6],
            startTime: '10:00',
            endTime: '18:00',
            enabled: true,
          },
        })
      );

      expect(result.current.preview).toContain('Active Sat-Sun');
    });

    it('should generate preview for custom days', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [1, 3, 5],
            startTime: '08:00',
            endTime: '16:00',
            enabled: true,
          },
        })
      );

      expect(result.current.preview).toContain('Mon, Wed, Fri');
    });

    it('should show disabled status when schedule is disabled', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: '09:00',
            endTime: '17:00',
            enabled: false,
          },
        })
      );

      expect(result.current.preview).toBe('Schedule is disabled');
    });

    it('should include next activation in preview when enabled', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: '09:00',
            endTime: '17:00',
            enabled: true,
          },
        })
      );

      expect(result.current.preview).toContain('Next activation');
    });
  });

  describe('nextActivation calculation', () => {
    it('should return null when schedule is disabled', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: '09:00',
            enabled: false,
          },
        })
      );

      expect(result.current.nextActivation).toBeNull();
    });

    it('should calculate next activation for enabled schedule', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: '09:00',
            enabled: true,
          },
        })
      );

      expect(result.current.nextActivation).toBeInstanceOf(Date);
    });

    it('should return null when days are not set', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule: {
            days: [],
            startTime: '09:00',
            enabled: true,
          },
        })
      );

      expect(result.current.nextActivation).toBeNull();
    });
  });

  describe('form validation', () => {
    it('should invalidate form when days array is empty', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // Remove all days
      act(() => {
        result.current.form.setValue('days', [], { shouldValidate: true });
      });

      await waitFor(
        () => {
          expect(result.current.isValid).toBe(false);
        },
        { timeout: 2000 }
      );
    });

    it('should invalidate form with invalid time format', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // Invalid time format
      act(() => {
        result.current.form.setValue('startTime', '9:00', { shouldValidate: true });
      });

      await waitFor(
        () => {
          expect(result.current.isValid).toBe(false);
        },
        { timeout: 2000 }
      );
    });

    it('should invalidate when end time is before start time', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // End time before start time
      act(() => {
        result.current.form.setValue('startTime', '17:00', { shouldValidate: true });
        result.current.form.setValue('endTime', '09:00', { shouldValidate: true });
      });

      await waitFor(
        () => {
          expect(result.current.isValid).toBe(false);
        },
        { timeout: 2000 }
      );
    });

    it('should reject overnight schedule (start > end)', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // Overnight schedule is NOT valid in the cross-field validation
      act(() => {
        result.current.form.setValue('startTime', '22:00', { shouldValidate: true });
        result.current.form.setValue('endTime', '06:00', { shouldValidate: true });
      });

      await waitFor(
        () => {
          // According to schema, end must be after start (no overnight support in validation)
          expect(result.current.isValid).toBe(false);
        },
        { timeout: 2000 }
      );
    });

    it('should invalidate with empty timezone', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // Empty timezone
      act(() => {
        result.current.form.setValue('timezone', '', { shouldValidate: true });
      });

      await waitFor(
        () => {
          expect(result.current.isValid).toBe(false);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('reset', () => {
    it('should reset form to initial values', () => {
      const initialSchedule = {
        days: [0, 6],
        startTime: '10:00',
        endTime: '18:00',
        timezone: 'UTC',
        enabled: false,
      };

      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          initialSchedule,
        })
      );

      // Make changes
      act(() => {
        result.current.toggleDay(1);
        result.current.form.setValue('startTime', '11:00');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.schedule.days).toEqual([0, 6]);
      expect(result.current.schedule.startTime).toBe('10:00');
    });

    it('should reset to default values when no initial schedule', () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // Make changes
      act(() => {
        result.current.applyPreset('WEEKENDS' as DayPresetKey);
        result.current.form.setValue('startTime', '11:00');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.schedule.days).toEqual([1, 2, 3, 4, 5]);
      expect(result.current.schedule.startTime).toBe('09:00');
    });
  });

  describe('onSubmit', () => {
    it('should call onSubmit callback with valid data', async () => {
      const onSubmitMock = vi.fn();
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          onSubmit: onSubmitMock,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmitMock).toHaveBeenCalledWith({
        routingID: 'routing-123',
        days: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00',
        timezone: expect.any(String),
        enabled: true,
      });
    });

    it('should not call onSubmit callback with invalid data', async () => {
      const onSubmitMock = vi.fn();
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          onSubmit: onSubmitMock,
        })
      );

      // Set invalid data
      act(() => {
        result.current.form.setValue('days', []);
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    it('should handle async onSubmit callback', async () => {
      const onSubmitMock = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
          onSubmit: onSubmitMock,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmitMock).toHaveBeenCalled();
    });
  });

  describe('errors extraction', () => {
    it('should invalidate form with multiple validation errors', async () => {
      const { result } = renderHook(() =>
        useScheduleEditor({
          routingID: 'routing-123',
        })
      );

      // Trigger multiple validation errors
      act(() => {
        result.current.form.setValue('days', [], { shouldValidate: true });
        result.current.form.setValue('startTime', 'invalid', { shouldValidate: true });
      });

      await waitFor(
        () => {
          expect(result.current.isValid).toBe(false);
          // Errors object should exist (even if empty object)
          expect(result.current.errors).toBeDefined();
        },
        { timeout: 2000 }
      );
    });
  });
});
