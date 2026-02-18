/**
 * useSynFloodConfigPanel Hook Tests
 *
 * Tests form validation, presets, confirmation logic for SYN flood protection.
 * Uses fixtures from __test-utils__/rate-limit-fixtures.ts
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSynFloodConfigPanel } from './use-syn-flood-config-panel';
import {
  mockSynFloodDrop,
  mockSynFloodTarpit,
  mockSynFloodDisabled,
  mockSynFloodStrict,
} from '../__test-utils__/rate-limit-fixtures';

describe('useSynFloodConfigPanel', () => {
  const mockOnSubmit = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with provided config', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      const values = result.current.form.getValues();
      expect(values.enabled).toBe(mockSynFloodDrop.enabled);
      expect(values.synLimit).toBe(String(mockSynFloodDrop.synLimit));
      expect(values.burst).toBe(String(mockSynFloodDrop.burst));
      expect(values.action).toBe(mockSynFloodDrop.action);
    });

    it('should initialize with default config when not provided', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          onSubmit: mockOnSubmit,
        })
      );

      const values = result.current.form.getValues();
      expect(values).toBeDefined();
      expect(typeof values.enabled).toBe('boolean');
      expect(typeof values.synLimit).toBe('string');
      expect(typeof values.burst).toBe('string');
      expect(values.action).toMatch(/^(drop|tarpit)$/);
    });

    it('should not be dirty initially', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('should not be submitting initially', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should validate synLimit is required', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('synLimit', '', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.synLimit?.message).toBe('SYN limit is required');
      });
    });

    it('should validate synLimit is between 1 and 10,000', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      // Test below minimum
      act(() => {
        result.current.form.setValue('synLimit', '0', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.synLimit?.message).toBe('Must be between 1 and 10,000');
      });

      // Test above maximum
      act(() => {
        result.current.form.setValue('synLimit', '10001', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.synLimit?.message).toBe('Must be between 1 and 10,000');
      });

      // Test valid value
      act(() => {
        result.current.form.setValue('synLimit', '100', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.synLimit).toBeUndefined();
      });
    });

    it('should validate burst is required', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('burst', '', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.burst?.message).toBe('Burst is required');
      });
    });

    it('should validate burst is between 1 and 1,000', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      // Test below minimum
      act(() => {
        result.current.form.setValue('burst', '0', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.burst?.message).toBe('Must be between 1 and 1,000');
      });

      // Test above maximum
      act(() => {
        result.current.form.setValue('burst', '1001', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.burst?.message).toBe('Must be between 1 and 1,000');
      });

      // Test valid value
      act(() => {
        result.current.form.setValue('burst', '10', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.burst).toBeUndefined();
      });
    });

    it('should validate burst is less than or equal to synLimit', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      // Set synLimit to 100
      act(() => {
        result.current.form.setValue('synLimit', '100', { shouldValidate: true });
      });

      // Set burst > synLimit
      act(() => {
        result.current.form.setValue('burst', '150', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.burst?.message).toBe('Burst must be less than or equal to SYN limit');
      });

      // Set burst <= synLimit
      act(() => {
        result.current.form.setValue('burst', '50', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.burst).toBeUndefined();
      });
    });

    it('should validate action is "drop" or "tarpit"', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      // Test valid values
      act(() => {
        result.current.form.setValue('action', 'drop', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.action).toBeUndefined();
      });

      act(() => {
        result.current.form.setValue('action', 'tarpit', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.form.formState.errors;
        expect(errors.action).toBeUndefined();
      });
    });
  });

  describe('Submit Handling', () => {
    it('should call onSubmit with converted config', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: mockSynFloodDrop.enabled,
          synLimit: mockSynFloodDrop.synLimit,
          burst: mockSynFloodDrop.burst,
          action: mockSynFloodDrop.action,
        })
      );
    });

    it('should not submit if form is invalid', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      // Make form invalid
      act(() => {
        result.current.form.setValue('synLimit', '', { shouldValidate: true });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Reset Handling', () => {
    it('should reset form to initial values', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
          onReset: mockOnReset,
        })
      );

      // Modify form
      act(() => {
        result.current.form.setValue('synLimit', '200');
        result.current.form.setValue('burst', '20');
      });

      // Reset
      act(() => {
        result.current.handleReset();
      });

      const values = result.current.form.getValues();
      expect(values.synLimit).toBe(String(mockSynFloodDrop.synLimit));
      expect(values.burst).toBe(String(mockSynFloodDrop.burst));
      expect(mockOnReset).toHaveBeenCalled();
    });

    it('should reset without onReset callback', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      // Modify form
      act(() => {
        result.current.form.setValue('synLimit', '200');
      });

      // Reset (should not throw)
      act(() => {
        result.current.handleReset();
      });

      const values = result.current.form.getValues();
      expect(values.synLimit).toBe(String(mockSynFloodDrop.synLimit));
    });
  });

  describe('Conversion Helpers', () => {
    it('should convert config to form values', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      const formValues = result.current.configToForm(mockSynFloodTarpit);

      expect(formValues).toEqual({
        enabled: mockSynFloodTarpit.enabled,
        synLimit: String(mockSynFloodTarpit.synLimit),
        burst: String(mockSynFloodTarpit.burst),
        action: mockSynFloodTarpit.action,
      });
    });

    it('should convert form values to config', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      const formValues = {
        enabled: true,
        synLimit: '150',
        burst: '10',
        action: 'drop' as const,
      };

      const config = result.current.formToConfig(formValues);

      expect(config).toEqual({
        enabled: true,
        synLimit: 150,
        burst: 10,
        action: 'drop',
      });
    });
  });

  describe('Low SYN Limit Check', () => {
    it('should return true when synLimit is below 100', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodStrict, // synLimit: 50
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.isLowSynLimit()).toBe(true);
    });

    it('should return false when synLimit is 100 or above', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop, // synLimit: 100
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.isLowSynLimit()).toBe(false);
    });

    it('should handle invalid synLimit gracefully', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.form.setValue('synLimit', 'invalid');
      });

      expect(result.current.isLowSynLimit()).toBe(false);
    });
  });

  describe('Form State Tracking', () => {
    it('should mark form as dirty when values change', async () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.form.setValue('synLimit', '200');
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });

    it('should track submitting state', async () => {
      const slowSubmit = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDrop,
          onSubmit: slowSubmit,
        })
      );

      expect(result.current.isSubmitting).toBe(false);

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      // Should eventually complete
      await submitPromise;
      expect(slowSubmit).toHaveBeenCalled();
    });
  });

  describe('Different Config Presets', () => {
    it('should work with disabled config', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodDisabled,
          onSubmit: mockOnSubmit,
        })
      );

      const values = result.current.form.getValues();
      expect(values.enabled).toBe(false);
    });

    it('should work with tarpit action', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodTarpit,
          onSubmit: mockOnSubmit,
        })
      );

      const values = result.current.form.getValues();
      expect(values.action).toBe('tarpit');
    });

    it('should work with strict config', () => {
      const { result } = renderHook(() =>
        useSynFloodConfigPanel({
          initialConfig: mockSynFloodStrict,
          onSubmit: mockOnSubmit,
        })
      );

      const values = result.current.form.getValues();
      expect(values.synLimit).toBe('50');
      expect(values.burst).toBe('5');
    });
  });
});
