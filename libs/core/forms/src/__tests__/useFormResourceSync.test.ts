/**
 * Tests for useFormResourceSync
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useFormResourceSync } from '../useFormResourceSync';

interface TestFormData {
  name: string;
  email: string;
}

describe('useFormResourceSync', () => {
  const defaultSourceData: TestFormData = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  describe('initial state', () => {
    it('initializes with source data', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
        });
      });

      await waitFor(() => {
        expect(result.current.state.source).toEqual(defaultSourceData);
      });
    });

    it('starts with no saving state', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
        });
      });

      await waitFor(() => {
        expect(result.current.state.isSaving).toBe(false);
        expect(result.current.state.error).toBeNull();
      });
    });
  });

  describe('actions', () => {
    it('applyOptimistic sets optimistic state', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
        });
      });

      const optimisticData: TestFormData = {
        name: 'Optimistic',
        email: 'optimistic@test.com',
      };

      await act(async () => {
        result.current.actions.applyOptimistic(optimisticData);
      });

      expect(result.current.state.optimistic).toEqual(optimisticData);
    });

    it('clearOptimistic removes optimistic state', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
        });
      });

      await act(async () => {
        result.current.actions.applyOptimistic({ name: 'Test', email: 'test@test.com' });
      });

      expect(result.current.state.optimistic).not.toBeNull();

      await act(async () => {
        result.current.actions.clearOptimistic();
      });

      expect(result.current.state.optimistic).toBeNull();
    });

    it('handleSaveError sets error state', async () => {
      const onSaveError = vi.fn();

      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
          onSaveError,
        });
      });

      const error = new Error('Test error');

      await act(async () => {
        result.current.actions.handleSaveError(error);
      });

      expect(result.current.state.error).toEqual(error);
      expect(onSaveError).toHaveBeenCalledWith(error);
    });

    it('completeSave clears saving and error state', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
        });
      });

      // Set an error first
      await act(async () => {
        result.current.actions.handleSaveError(new Error('Test'));
      });

      expect(result.current.state.error).not.toBeNull();

      // Complete save
      await act(async () => {
        result.current.actions.completeSave();
      });

      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isSaving).toBe(false);
      expect(result.current.state.optimistic).toBeNull();
    });
  });

  describe('save operations with onSave', () => {
    it('calls onSave when startSave is invoked', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
          onSave,
        });
      });

      await act(async () => {
        await result.current.actions.startSave();
      });

      expect(onSave).toHaveBeenCalled();
      expect(result.current.state.isSaving).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('handles save errors from onSave', async () => {
      const error = new Error('Save failed');
      const onSave = vi.fn().mockRejectedValue(error);
      const onSaveError = vi.fn();

      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
          onSave,
          onSaveError,
        });
      });

      await act(async () => {
        await result.current.actions.startSave();
      });

      expect(result.current.state.error).toEqual(error);
      expect(result.current.state.optimistic).toBeNull();
      expect(onSaveError).toHaveBeenCalledWith(error);
    });
  });

  describe('conflict detection', () => {
    it('detects source version changes', async () => {
      const onSourceChange = vi.fn();

      const { result, rerender } = renderHook(
        (props: { version: string }) => {
          const form = useForm<TestFormData>({
            defaultValues: defaultSourceData,
          });

          return useFormResourceSync({
            form,
            sourceData: defaultSourceData,
            resourceId: 'test-1',
            resourceVersion: props.version,
            onSourceChange,
          });
        },
        { initialProps: { version: 'v1' } }
      );

      // Initially no change
      expect(result.current.state.hasSourceChanged).toBe(false);

      // Change the version
      rerender({ version: 'v2' });

      await waitFor(() => {
        expect(result.current.state.hasSourceChanged).toBe(true);
        expect(onSourceChange).toHaveBeenCalled();
      });
    });
  });

  describe('computed values', () => {
    it('provides conflict info', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
          resourceVersion: 'v1',
        });
      });

      expect(result.current.conflict).toHaveProperty('hasConflict');
      expect(result.current.conflict).toHaveProperty('sourceVersion', 'v1');
    });

    it('canSave is false when not dirty and valid', async () => {
      const { result } = renderHook(() => {
        const form = useForm<TestFormData>({
          defaultValues: defaultSourceData,
        });

        return useFormResourceSync({
          form,
          sourceData: defaultSourceData,
          resourceId: 'test-1',
          onSave: vi.fn(),
        });
      });

      // Form starts clean (not dirty)
      await waitFor(() => {
        expect(result.current.canSave).toBe(false);
      });
    });
  });
});
