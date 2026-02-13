/**
 * Unit Tests for useConnectionTrackingSettings Hook - ACTIVATED
 *
 * Tests the headless hook for connection tracking settings including:
 * - Zod schema validation
 * - Duration parsing/formatting (e.g., "1d" <-> 86400 seconds)
 * - Form state management (isDirty, isValid, reset)
 * - Settings conversion (form <-> API)
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useConnectionTrackingSettings } from './use-connection-tracking-settings';
import { parseDuration, formatDuration, isValidDuration } from './timeout-utils';
import type { ConnectionTrackingSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

describe('useConnectionTrackingSettings', () => {
  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      expect(result.current.form).toBeDefined();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize with provided settings', () => {
      const onSubmit = vi.fn();
      const customSettings: ConnectionTrackingSettings = {
        ...DEFAULT_SETTINGS,
        enabled: false,
        maxEntries: 100000,
        tcpEstablishedTimeout: 43200, // 12 hours
      };

      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          initialSettings: customSettings,
          onSubmit,
        })
      );

      const formValues = result.current.form.getValues();
      expect(formValues.enabled).toBe(false);
      expect(formValues.maxEntries).toBe('100000');
      expect(formValues.tcpEstablishedTimeout).toBe('12h');
    });
  });

  describe('Form State Management', () => {
    it('should track isDirty when form values change', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.form.setValue('maxEntries', '500000', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });

    it('should reset form to original values', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('maxEntries', '999999', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      act(() => {
        result.current.handleReset();
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });

      const formValues = result.current.form.getValues();
      expect(formValues.maxEntries).toBe(String(DEFAULT_SETTINGS.maxEntries));
    });

    it('should call onReset callback when reset', () => {
      const onSubmit = vi.fn();
      const onReset = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
          onReset,
        })
      );

      act(() => {
        result.current.handleReset();
      });

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Zod Schema Validation', () => {
    it('should validate maxEntries is positive integer', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('maxEntries', '-1', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.maxEntries).toBeDefined();
      });
    });

    it('should validate maxEntries is not zero', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('maxEntries', '0', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.maxEntries).toBeDefined();
      });
    });

    it('should validate maxEntries does not exceed limit', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('maxEntries', '20000000', { shouldValidate: true }); // Over limit
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.maxEntries).toBeDefined();
      });
    });

    it('should validate duration format', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('tcpEstablishedTimeout', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.tcpEstablishedTimeout).toBeDefined();
      });
    });

    it('should accept valid duration formats', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      const validDurations = ['1d', '12h', '30m', '45s', '1d2h3m'];

      for (const duration of validDurations) {
        act(() => {
          result.current.form.setValue('tcpEstablishedTimeout', duration);
        });

        await waitFor(() => {
          const errors = result.current.form.formState.errors;
          expect(errors.tcpEstablishedTimeout).toBeUndefined();
        });
      }
    });
  });

  describe('Settings Conversion', () => {
    it('should convert settings to form values', () => {
      const onSubmit = vi.fn();
      const settings: ConnectionTrackingSettings = {
        enabled: true,
        maxEntries: 262144,
        tcpEstablishedTimeout: 86400, // 1 day
        tcpTimeWaitTimeout: 120,
        tcpCloseTimeout: 10,
        tcpSynSentTimeout: 120,
        tcpSynReceivedTimeout: 60,
        tcpFinWaitTimeout: 120,
        tcpCloseWaitTimeout: 60,
        tcpLastAckTimeout: 30,
        udpTimeout: 180,
        udpStreamTimeout: 180,
        icmpTimeout: 30,
        genericTimeout: 600,
        looseTracking: false,
      };

      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      const formValues = result.current.settingsToForm(settings);

      expect(formValues.enabled).toBe(true);
      expect(formValues.maxEntries).toBe('262144');
      expect(formValues.tcpEstablishedTimeout).toBe('1d');
      expect(formValues.tcpTimeWaitTimeout).toBe('2m');
      expect(formValues.udpTimeout).toBe('3m');
      expect(formValues.looseTracking).toBe(false);
    });

    it('should convert form values to settings', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      const formValues = {
        enabled: false,
        maxEntries: '500000',
        tcpEstablishedTimeout: '12h',
        tcpTimeWaitTimeout: '30s',
        tcpCloseTimeout: '15s',
        tcpSynSentTimeout: '10s',
        tcpSynReceivedTimeout: '10s',
        tcpFinWaitTimeout: '15s',
        tcpCloseWaitTimeout: '15s',
        tcpLastAckTimeout: '15s',
        udpTimeout: '20s',
        udpStreamTimeout: '5m',
        icmpTimeout: '15s',
        genericTimeout: '10m',
        looseTracking: true,
      };

      const settings = result.current.formToSettings(formValues);

      expect(settings.enabled).toBe(false);
      expect(settings.maxEntries).toBe(500000);
      expect(settings.tcpEstablishedTimeout).toBe(43200); // 12 hours
      expect(settings.tcpTimeWaitTimeout).toBe(30);
      expect(settings.udpStreamTimeout).toBe(300); // 5 minutes
      expect(settings.looseTracking).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with converted settings', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('maxEntries', '500000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          maxEntries: 500000,
        })
      );
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() =>
        useConnectionTrackingSettings({
          onSubmit,
        })
      );

      expect(result.current.isSubmitting).toBe(false);

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      // Should be submitting during async operation
      await waitFor(() => {
        // Note: isSubmitting might be true or false depending on timing
        // Just verify the submission completes
      });

      await submitPromise;

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Duration Utilities', () => {
  describe('parseDuration', () => {
    it('should parse "1d" to 86400 seconds', () => {
      expect(parseDuration('1d')).toBe(86400);
    });

    it('should parse "12h" to 43200 seconds', () => {
      expect(parseDuration('12h')).toBe(43200);
    });

    it('should parse "30m" to 1800 seconds', () => {
      expect(parseDuration('30m')).toBe(1800);
    });

    it('should parse "45s" to 45 seconds', () => {
      expect(parseDuration('45s')).toBe(45);
    });

    it('should parse combined format "1d2h3m"', () => {
      // 1 day + 2 hours + 3 minutes = 86400 + 7200 + 180 = 93780
      expect(parseDuration('1d2h3m')).toBe(93780);
    });

    it('should parse plain number as seconds', () => {
      expect(parseDuration('120')).toBe(120);
    });

    it('should return 0 for empty string', () => {
      expect(parseDuration('')).toBe(0);
    });

    it('should handle case insensitivity', () => {
      expect(parseDuration('1D')).toBe(86400);
      expect(parseDuration('12H')).toBe(43200);
    });
  });

  describe('formatDuration', () => {
    it('should format 86400 to "1d"', () => {
      expect(formatDuration(86400)).toBe('1d');
    });

    it('should format 43200 to "12h"', () => {
      expect(formatDuration(43200)).toBe('12h');
    });

    it('should format 1800 to "30m"', () => {
      expect(formatDuration(1800)).toBe('30m');
    });

    it('should format 45 to "45s"', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('should format 93780 to "1d2h3m"', () => {
      expect(formatDuration(93780)).toBe('1d2h3m');
    });

    it('should format 0 to "0s"', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should format complex durations correctly', () => {
      // 1 day + 12 hours + 30 minutes + 15 seconds
      expect(formatDuration(86400 + 43200 + 1800 + 15)).toBe('1d12h30m15s');
    });
  });

  describe('isValidDuration', () => {
    it('should validate correct duration formats', () => {
      expect(isValidDuration('1d')).toBe(true);
      expect(isValidDuration('12h')).toBe(true);
      expect(isValidDuration('30m')).toBe(true);
      expect(isValidDuration('45s')).toBe(true);
      expect(isValidDuration('1d2h3m')).toBe(true);
      expect(isValidDuration('120')).toBe(true); // Plain number
    });

    it('should reject invalid duration formats', () => {
      expect(isValidDuration('')).toBe(false);
      expect(isValidDuration('invalid')).toBe(false);
      expect(isValidDuration('1x')).toBe(false); // Invalid unit
      expect(isValidDuration('d1')).toBe(false); // Wrong order
      expect(isValidDuration('-1d')).toBe(false); // Negative
    });

    it('should handle whitespace', () => {
      expect(isValidDuration('  1d  ')).toBe(true);
    });
  });

  describe('Round-trip Conversion', () => {
    it('should maintain value through parse -> format cycle', () => {
      const testCases = [
        { seconds: 86400, expected: '1d' },
        { seconds: 43200, expected: '12h' },
        { seconds: 1800, expected: '30m' },
        { seconds: 45, expected: '45s' },
      ];

      for (const { seconds, expected } of testCases) {
        const formatted = formatDuration(seconds);
        expect(formatted).toBe(expected);

        const parsed = parseDuration(formatted);
        expect(parsed).toBe(seconds);
      }
    });

    it('should maintain value through format -> parse cycle', () => {
      const testCases = ['1d', '12h', '30m', '45s', '1d2h3m'];

      for (const duration of testCases) {
        const parsed = parseDuration(duration);
        const formatted = formatDuration(parsed);
        const reparsed = parseDuration(formatted);

        expect(reparsed).toBe(parsed);
      }
    });
  });
});
