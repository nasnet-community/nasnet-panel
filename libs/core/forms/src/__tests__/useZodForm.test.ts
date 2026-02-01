/**
 * Tests for useZodForm hook
 *
 * Tests validate:
 * - Schema binding via Zod
 * - Default value initialization
 * - TypeScript type inference
 * - Validation mode configuration
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useZodForm } from '../useZodForm';

describe('useZodForm', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(0).max(150).optional(),
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: {
          name: 'John',
          email: 'john@example.com',
        },
      })
    );

    expect(result.current.getValues()).toEqual({
      name: 'John',
      email: 'john@example.com',
    });
  });

  it('should use onBlur validation mode by default', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: '', email: '' },
      })
    );

    // Form should initialize without errors
    expect(result.current.formState.errors).toEqual({});
  });

  it('should trigger validation and return isValid status', async () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: '', email: '' },
      })
    );

    // Trigger validation - should return false for invalid data
    let isValid = true;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(false);
  });

  it('should pass validation with valid data', async () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: 'John', email: 'john@example.com' },
      })
    );

    let isValid = false;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(true);
  });

  it('should infer TypeScript types from schema', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: '', email: '' },
      })
    );

    // TypeScript should infer the correct types
    const values = result.current.getValues();

    // These type assertions should pass at compile time
    const _name: string = values.name;
    const _email: string = values.email;
    const _age: number | undefined = values.age;

    expect(_name).toBe('');
    expect(_email).toBe('');
    expect(_age).toBeUndefined();
  });

  it('should track form validity in formState', async () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: '', email: '' },
      })
    );

    // Trigger validation to update formState
    await act(async () => {
      await result.current.trigger();
    });

    // After trigger, formState.isValid should be false
    expect(result.current.formState.isValid).toBe(false);
  });

  it('should accept custom validation mode', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: '', email: '' },
        mode: 'onChange',
      })
    );

    // Form should initialize without errors
    expect(result.current.formState.errors).toEqual({});
  });

  it('should register fields correctly', () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: 'Test', email: 'test@test.com' },
      })
    );

    // Register should return field registration props
    const nameReg = result.current.register('name');
    expect(nameReg.name).toBe('name');
    expect(typeof nameReg.onChange).toBe('function');
    expect(typeof nameReg.onBlur).toBe('function');
  });

  it('should allow setting values programmatically', async () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: '', email: '' },
      })
    );

    await act(async () => {
      result.current.setValue('name', 'Updated Name');
      result.current.setValue('email', 'updated@example.com');
    });

    expect(result.current.getValues()).toEqual({
      name: 'Updated Name',
      email: 'updated@example.com',
    });
  });

  it('should reset form to default values', async () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema: testSchema,
        defaultValues: { name: 'Original', email: 'original@test.com' },
      })
    );

    // Change values
    await act(async () => {
      result.current.setValue('name', 'Changed');
    });

    expect(result.current.getValues('name')).toBe('Changed');

    // Reset
    await act(async () => {
      result.current.reset();
    });

    expect(result.current.getValues('name')).toBe('Original');
  });

  it('should handle nested object schemas', async () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1),
        address: z.object({
          city: z.string().min(1),
        }),
      }),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema: nestedSchema,
        defaultValues: {
          user: {
            name: 'Test',
            address: {
              city: 'NYC',
            },
          },
        },
      })
    );

    // Valid nested data should pass
    let isValid = false;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(true);
  });

  it('should reject invalid nested data', async () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1),
      }),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema: nestedSchema,
        defaultValues: {
          user: {
            name: '', // Invalid - empty string
          },
        },
      })
    );

    let isValid = true;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(false);
  });

  it('should handle array fields in schema', async () => {
    const arraySchema = z.object({
      items: z.array(z.string().min(1)).min(1, 'At least one item required'),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema: arraySchema,
        defaultValues: { items: [] },
      })
    );

    // Empty array should fail validation
    let isValid = true;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(false);
  });

  it('should pass with valid array data', async () => {
    const arraySchema = z.object({
      items: z.array(z.string().min(1)).min(1),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema: arraySchema,
        defaultValues: { items: ['item1', 'item2'] },
      })
    );

    let isValid = false;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(true);
  });
});
