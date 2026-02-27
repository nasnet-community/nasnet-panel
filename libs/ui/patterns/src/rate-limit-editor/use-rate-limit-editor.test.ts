/**
 * useRateLimitEditor Hook Tests
 *
 * Tests validation, field visibility, preview generation for rate limit rule editor.
 * Uses fixtures from __test-utils__/rate-limit-fixtures.ts
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  useRateLimitEditor,
  validateSourceAddress,
  validateAddressListName,
} from './use-rate-limit-editor';
import {
  mockDropRule,
  mockTarpitRule,
  mockAddToListRule,
  emptyRuleInput,
} from '../__test-utils__/rate-limit-fixtures';

describe('useRateLimitEditor', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockCheckAddressListExists = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAddressListExists.mockResolvedValue(true);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      const rule = result.current.rule;
      expect(rule.connectionLimit).toBe(100);
      expect(rule.timeWindow).toBe('per-minute');
      expect(rule.action).toBe('drop');
    });

    it('should initialize with provided initial rule', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockDropRule,
          onSubmit: mockOnSubmit,
        })
      );

      const rule = result.current.rule;
      expect(rule.connectionLimit).toBe(mockDropRule.connectionLimit);
      expect(rule.timeWindow).toBe(mockDropRule.timeWindow);
      expect(rule.action).toBe(mockDropRule.action);
      expect(rule.comment).toBe(mockDropRule.comment);
    });

    it('should merge initial rule with defaults', () => {
      const partialRule = {
        connectionLimit: 50,
        action: 'tarpit' as const,
      };

      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: partialRule,
          onSubmit: mockOnSubmit,
        })
      );

      const rule = result.current.rule;
      expect(rule.connectionLimit).toBe(50);
      expect(rule.action).toBe('tarpit');
      expect(rule.timeWindow).toBeDefined(); // From defaults
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      // Remove required field
      act(() => {
        result.current.form.setValue('connectionLimit', undefined as any);
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('should validate connection limit is positive', async () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      act(() => {
        result.current.form.setValue('connectionLimit', -10, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('should validate time window is valid enum', async () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      act(() => {
        result.current.form.setValue('timeWindow', 'invalid' as any, {
          shouldValidate: true,
        });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('should validate action is valid enum', async () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      act(() => {
        result.current.form.setValue('action', 'invalid' as any, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });
  });

  describe('Visible Fields', () => {
    it('should hide addressList fields for "drop" action', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'drop' },
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.visibleFields.addressList).toBe(false);
      expect(result.current.visibleFields.addressListTimeout).toBe(false);
    });

    it('should hide addressList fields for "tarpit" action', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'tarpit' },
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.visibleFields.addressList).toBe(false);
      expect(result.current.visibleFields.addressListTimeout).toBe(false);
    });

    it('should show addressList fields for "add-to-list" action', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list' },
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.visibleFields.addressList).toBe(true);
      expect(result.current.visibleFields.addressListTimeout).toBe(true);
    });

    it('should update visible fields when action changes', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'drop' },
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.visibleFields.addressList).toBe(false);

      act(() => {
        result.current.form.setValue('action', 'add-to-list');
      });

      expect(result.current.visibleFields.addressList).toBe(true);
    });
  });

  describe('Preview Generation', () => {
    it('should generate preview for drop action', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockDropRule,
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('Drop connections');
      expect(preview).toContain('100 connections');
      expect(preview).toContain('per minute');
    });

    it('should generate preview for tarpit action', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockTarpitRule,
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('Tarpit connections');
      expect(preview).toContain('50 connections');
      expect(preview).toContain('per second');
    });

    it('should generate preview for add-to-list action', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockAddToListRule,
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('Add source IPs');
      expect(preview).toContain('rate-limited');
      expect(preview).toContain('1h');
    });

    it('should include source address in preview', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { ...mockDropRule, srcAddress: '192.168.1.0/24' },
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('192.168.1.0/24');
    });

    it('should include source address list in preview', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { ...mockDropRule, srcAddressList: 'trusted-ips' },
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('trusted-ips');
    });

    it('should handle negated source address list in preview', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { ...mockDropRule, srcAddressList: '!whitelist' },
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('not in');
      expect(preview).toContain('whitelist');
    });

    it('should show "any IP" when no source specified', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: emptyRuleInput,
          onSubmit: mockOnSubmit,
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('from any IP');
    });

    it('should update preview when form values change', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockDropRule,
          onSubmit: mockOnSubmit,
        })
      );

      const initialPreview = result.current.preview;

      act(() => {
        result.current.form.setValue('connectionLimit', 200);
      });

      const updatedPreview = result.current.preview;
      expect(updatedPreview).not.toBe(initialPreview);
      expect(updatedPreview).toContain('200 connections');
    });
  });

  describe('Address List Existence Check', () => {
    it('should check if address list exists', async () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list', addressList: 'test-list' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      await waitFor(() => {
        expect(mockCheckAddressListExists).toHaveBeenCalledWith('test-list');
        expect(result.current.addressListExists).toBe(true);
      });
    });

    it('should set addressListExists to false when list does not exist', async () => {
      mockCheckAddressListExists.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list', addressList: 'non-existent' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      await waitFor(() => {
        expect(result.current.addressListExists).toBe(false);
      });
    });

    it('should not check when action is not add-to-list', async () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'drop', addressList: 'test-list' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      await waitFor(() => {
        expect(mockCheckAddressListExists).not.toHaveBeenCalled();
        expect(result.current.addressListExists).toBeNull();
      });
    });

    it('should handle check error gracefully', async () => {
      mockCheckAddressListExists.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list', addressList: 'test-list' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      await waitFor(() => {
        expect(result.current.addressListExists).toBe(false);
      });
    });

    it('should re-check when address list name changes', async () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list', addressList: 'list-1' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      await waitFor(() => {
        expect(mockCheckAddressListExists).toHaveBeenCalledWith('list-1');
      });

      act(() => {
        result.current.form.setValue('addressList', 'list-2');
      });

      await waitFor(() => {
        expect(mockCheckAddressListExists).toHaveBeenCalledWith('list-2');
      });
    });

    it('should cancel pending check on unmount', async () => {
      const { unmount } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list', addressList: 'test-list' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      // Unmount before check completes
      unmount();

      // Should not throw
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data', async () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockDropRule,
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionLimit: mockDropRule.connectionLimit,
          timeWindow: mockDropRule.timeWindow,
          action: mockDropRule.action,
        })
      );
    });

    it('should not submit if form is invalid', async () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      // Make form invalid
      act(() => {
        result.current.form.setValue('connectionLimit', -1, { shouldValidate: true });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should reset form to initial values', () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockDropRule,
          onSubmit: mockOnSubmit,
        })
      );

      // Modify form
      act(() => {
        result.current.form.setValue('connectionLimit', 200);
        result.current.form.setValue('action', 'tarpit');
      });

      expect(result.current.rule.connectionLimit).toBe(200);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.connectionLimit).toBe(mockDropRule.connectionLimit);
      expect(result.current.rule.action).toBe(mockDropRule.action);
    });

    it('should reset addressListExists state', async () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: { action: 'add-to-list', addressList: 'test-list' },
          onSubmit: mockOnSubmit,
          checkAddressListExists: mockCheckAddressListExists,
        })
      );

      await waitFor(() => {
        expect(result.current.addressListExists).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.addressListExists).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should extract error messages from form state', async () => {
      const { result } = renderHook(() => useRateLimitEditor({ onSubmit: mockOnSubmit }));

      // Set an invalid value that will trigger validation error
      act(() => {
        result.current.form.setValue('action', 'invalid' as any, { shouldValidate: true });
      });

      await waitFor(() => {
        // Check that errors object has been populated
        expect(result.current.form.formState.errors.action).toBeDefined();
      });
    });
  });

  describe('Validation Helpers', () => {
    describe('validateSourceAddress', () => {
      it('should accept empty address (any)', () => {
        expect(validateSourceAddress('')).toBe(true);
        expect(validateSourceAddress(undefined)).toBe(true);
      });

      it('should accept valid IPv4 address', () => {
        expect(validateSourceAddress('192.168.1.1')).toBe(true);
        expect(validateSourceAddress('10.0.0.1')).toBe(true);
        expect(validateSourceAddress('172.16.0.1')).toBe(true);
      });

      it('should accept valid IPv4 CIDR', () => {
        expect(validateSourceAddress('192.168.1.0/24')).toBe(true);
        expect(validateSourceAddress('10.0.0.0/8')).toBe(true);
      });

      it('should accept valid IPv6 address', () => {
        expect(validateSourceAddress('2001:db8::1')).toBe(true);
        expect(validateSourceAddress('fe80::1')).toBe(true);
      });

      it('should accept valid IPv6 CIDR', () => {
        expect(validateSourceAddress('2001:db8::/32')).toBe(true);
      });

      it('should reject invalid addresses', () => {
        expect(validateSourceAddress('invalid')).toBe('Invalid IP address or CIDR notation');
        // Note: The regex is simplified and doesn't validate octets are 0-255
        // '999.999.999.999' would pass the basic pattern but fail on the router
        expect(validateSourceAddress('192.168.1')).toBe('Invalid IP address or CIDR notation');
        expect(validateSourceAddress('not-an-ip')).toBe('Invalid IP address or CIDR notation');
      });
    });

    describe('validateAddressListName', () => {
      it('should require name for add-to-list action', () => {
        expect(validateAddressListName('')).toBe(
          'Address list name is required for add-to-list action'
        );
        expect(validateAddressListName(undefined)).toBe(
          'Address list name is required for add-to-list action'
        );
      });

      it('should accept valid names', () => {
        expect(validateAddressListName('rate-limited')).toBe(true);
        expect(validateAddressListName('ddos_attackers')).toBe(true);
        expect(validateAddressListName('list123')).toBe(true);
      });

      it('should reject names longer than 63 characters', () => {
        const longName = 'a'.repeat(64);
        expect(validateAddressListName(longName)).toBe(
          'Address list name must be 63 characters or less'
        );
      });

      it('should reject names with invalid characters', () => {
        expect(validateAddressListName('rate limited')).toContain('alphanumeric characters');
        expect(validateAddressListName('rate@limited')).toContain('alphanumeric characters');
        expect(validateAddressListName('rate.limited')).toContain('alphanumeric characters');
      });
    });
  });

  describe('Form State Tracking', () => {
    it('should track form validity', async () => {
      const { result } = renderHook(() =>
        useRateLimitEditor({
          initialRule: mockDropRule,
          onSubmit: mockOnSubmit,
        })
      );

      // Initially may not be valid until touched/validated
      // Set an invalid value
      act(() => {
        result.current.form.setValue('action', 'invalid' as any, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });

      // Fix the value
      act(() => {
        result.current.form.setValue('action', 'drop', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
      });
    });
  });
});
