/**
 * useMangleRuleEditor Hook Tests
 *
 * Tests for the headless mangle rule editor hook including:
 * - Field validation (chain, action, mark names, DSCP)
 * - Mark name validation (alphanumeric, underscore, hyphen; max 63)
 * - DSCP value validation (0-63)
 * - Human-readable preview generation
 * - Duplicate rule functionality
 * - Reset form state
 * - Save with validation errors
 * - Edit mode pre-population
 * - isDirty tracking
 * - visibleFields computed correctly
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { MangleRule } from '@nasnet/core/types';

import { useMangleRuleEditor, validateMarkName } from './use-mangle-rule-editor';

describe('useMangleRuleEditor', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      expect(result.current.rule.chain).toBe('prerouting');
      expect(result.current.rule.action).toBe('mark-connection');
      expect(result.current.rule.passthrough).toBe(true);
      expect(result.current.rule.disabled).toBe(false);
      expect(result.current.rule.log).toBe(false);
    });

    it('initializes with provided initial rule', () => {
      const initialRule: Partial<MangleRule> = {
        chain: 'forward',
        action: 'mark-packet',
        newPacketMark: 'test_mark',
        protocol: 'tcp',
        dstPort: '80',
      };

      const { result } = renderHook(() => useMangleRuleEditor({ initialRule }));

      expect(result.current.rule.chain).toBe('forward');
      expect(result.current.rule.action).toBe('mark-packet');
      expect(result.current.rule.newPacketMark).toBe('test_mark');
      expect(result.current.rule.protocol).toBe('tcp');
    });
  });

  describe('Field Validation', () => {
    it('marks form as invalid when chain is missing', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      await act(async () => {
        result.current.form.setValue('chain', '' as any);
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.chain).toBeDefined();
    });

    it('marks form as invalid when action is missing', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', '' as any);
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.action).toBeDefined();
    });

    it('validates mark-connection requires newConnectionMark', async () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
          },
        })
      );

      // Set valid mark name
      await act(async () => {
        result.current.form.setValue('newConnectionMark', 'valid_mark');
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(true);
    });

    it('validates mark-packet requires newPacketMark', async () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'forward',
            action: 'mark-packet',
          },
        })
      );

      await act(async () => {
        result.current.form.setValue('newPacketMark', 'packet_mark');
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(true);
    });

    it('validates change-dscp requires newDscp', async () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'change-dscp',
          },
        })
      );

      await act(async () => {
        result.current.form.setValue('newDscp', 46); // EF class
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Mark Name Validation', () => {
    it('accepts valid mark names', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      const validNames = [
        'valid_mark',
        'valid-mark',
        'ValidMark123',
        '_underscore',
        'a'.repeat(63),
      ];

      for (const name of validNames) {
        await act(async () => {
          result.current.form.setValue('action', 'mark-connection');
          result.current.form.setValue('newConnectionMark', name);
          await result.current.form.trigger('newConnectionMark');
        });

        expect(result.current.errors.newConnectionMark).toBeUndefined();
      }
    });

    it('rejects mark names with invalid characters', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'mark-connection');
        result.current.form.setValue('newConnectionMark', 'invalid mark!');
        await result.current.form.trigger('newConnectionMark');
      });

      expect(result.current.errors.newConnectionMark).toBeDefined();
      expect(result.current.errors.newConnectionMark).toContain(
        'letters, numbers, underscores, and hyphens'
      );
    });

    it('rejects mark names exceeding 63 characters', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'mark-connection');
        result.current.form.setValue('newConnectionMark', 'a'.repeat(64));
        await result.current.form.trigger('newConnectionMark');
      });

      expect(result.current.errors.newConnectionMark).toBeDefined();
      expect(result.current.errors.newConnectionMark).toContain('63 characters or less');
    });
  });

  describe('DSCP Validation', () => {
    it('accepts valid DSCP values (0-63)', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      const validValues = [0, 46, 63];

      for (const value of validValues) {
        await act(async () => {
          result.current.form.setValue('action', 'change-dscp');
          result.current.form.setValue('newDscp', value);
          await result.current.form.trigger('newDscp');
        });

        expect(result.current.errors.newDscp).toBeUndefined();
      }
    });

    it('rejects DSCP values outside 0-63 range', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'change-dscp');
        result.current.form.setValue('newDscp', 64);
        await result.current.form.trigger('newDscp');
      });

      expect(result.current.errors.newDscp).toBeDefined();
    });

    it('rejects non-integer DSCP values', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'change-dscp');
        result.current.form.setValue('newDscp', 46.5);
        await result.current.form.trigger('newDscp');
      });

      expect(result.current.errors.newDscp).toBeDefined();
    });
  });

  describe('Preview Generation', () => {
    it('generates preview for mark-connection rule', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
            newConnectionMark: 'web_traffic',
            protocol: 'tcp',
            dstPort: '80,443',
          },
        })
      );

      expect(result.current.preview).toContain("Mark connection 'web_traffic'");
      expect(result.current.preview).toContain('TCP traffic');
      expect(result.current.preview).toContain('port 80,443');
      expect(result.current.preview).toContain('prerouting chain');
    });

    it('generates preview for mark-packet rule', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'forward',
            action: 'mark-packet',
            newPacketMark: 'high_priority',
            protocol: 'udp',
            dstPort: '5060',
          },
        })
      );

      expect(result.current.preview).toContain("Mark packet 'high_priority'");
      expect(result.current.preview).toContain('UDP traffic');
    });

    it('generates preview for change-dscp rule with class name', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'change-dscp',
            newDscp: 46, // EF class
          },
        })
      );

      expect(result.current.preview).toContain('Change DSCP to');
      expect(result.current.preview).toContain('46');
      expect(result.current.preview).toContain('EF');
    });

    it('includes connection state in preview', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
            newConnectionMark: 'test',
            connectionState: ['new', 'established'],
          },
        })
      );

      expect(result.current.preview).toContain('new,established packets');
    });

    it('includes source and destination addresses in preview', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
            newConnectionMark: 'test',
            srcAddress: '192.168.1.0/24',
            dstAddress: '10.0.0.1',
          },
        })
      );

      expect(result.current.preview).toContain('from 192.168.1.0/24');
      expect(result.current.preview).toContain('to 10.0.0.1');
    });

    it('shows (terminal) when passthrough is false', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
            newConnectionMark: 'test',
            passthrough: false,
          },
        })
      );

      expect(result.current.preview).toContain('(terminal)');
    });
  });

  describe('Duplicate Rule', () => {
    it('copies rule values but clears ID and position', () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      const sourceRule: Partial<MangleRule> = {
        id: '*1',
        position: 5,
        chain: 'forward',
        action: 'mark-packet',
        newPacketMark: 'duplicated_mark',
        protocol: 'tcp',
        dstPort: '443',
      };

      act(() => {
        result.current.duplicate(sourceRule);
      });

      expect(result.current.rule.chain).toBe('forward');
      expect(result.current.rule.action).toBe('mark-packet');
      expect(result.current.rule.newPacketMark).toBe('duplicated_mark');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.id).toBeUndefined();
      expect(result.current.rule.position).toBeUndefined();
    });
  });

  describe('Reset Form', () => {
    it('resets to default values when no initialRule provided', () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      // Make changes
      act(() => {
        result.current.form.setValue('chain', 'forward');
        result.current.form.setValue('action', 'drop');
        result.current.form.setValue('protocol', 'tcp');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.chain).toBe('prerouting');
      expect(result.current.rule.action).toBe('mark-connection');
      expect(result.current.rule.protocol).toBeUndefined();
    });

    it('resets to initialRule values when provided', () => {
      const initialRule: Partial<MangleRule> = {
        chain: 'forward',
        action: 'mark-packet',
        newPacketMark: 'initial_mark',
      };

      const { result } = renderHook(() => useMangleRuleEditor({ initialRule }));

      // Make changes
      act(() => {
        result.current.form.setValue('newPacketMark', 'changed_mark');
        result.current.form.setValue('protocol', 'tcp');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.newPacketMark).toBe('initial_mark');
      expect(result.current.rule.protocol).toBeUndefined();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit callback with validated data', async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
            newConnectionMark: 'test_mark',
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'prerouting',
          action: 'mark-connection',
          newConnectionMark: 'test_mark',
        })
      );
    });

    it('does not call onSubmit when form has validation errors', async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: {
            chain: 'prerouting',
            action: 'mark-connection',
            // Missing newConnectionMark - validation error
          },
          onSubmit,
        })
      );

      // Try to submit with invalid form
      await act(async () => {
        // Set invalid mark name
        result.current.form.setValue('newConnectionMark', 'invalid mark!');
        await result.current.onSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Visible Fields', () => {
    it('shows newConnectionMark and passthrough for mark-connection action', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: { action: 'mark-connection' },
        })
      );

      expect(result.current.visibleFields).toContain('newConnectionMark');
      expect(result.current.visibleFields).toContain('passthrough');
    });

    it('shows newPacketMark and passthrough for mark-packet action', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: { action: 'mark-packet' },
        })
      );

      expect(result.current.visibleFields).toContain('newPacketMark');
      expect(result.current.visibleFields).toContain('passthrough');
    });

    it('shows newDscp for change-dscp action', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: { action: 'change-dscp' },
        })
      );

      expect(result.current.visibleFields).toContain('newDscp');
      expect(result.current.visibleFields).not.toContain('passthrough');
    });

    it('shows jumpTarget for jump action', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: { action: 'jump' },
        })
      );

      expect(result.current.visibleFields).toContain('jumpTarget');
    });

    it('shows logPrefix for log action', () => {
      const { result } = renderHook(() =>
        useMangleRuleEditor({
          initialRule: { action: 'log' },
        })
      );

      expect(result.current.visibleFields).toContain('logPrefix');
    });

    it('updates visibleFields when action changes', () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      expect(result.current.visibleFields).toContain('newConnectionMark');

      act(() => {
        result.current.form.setValue('action', 'change-dscp');
      });

      expect(result.current.visibleFields).toContain('newDscp');
      expect(result.current.visibleFields).not.toContain('newConnectionMark');
    });
  });

  describe('isDirty Tracking', () => {
    it('marks form as dirty when values change', async () => {
      const { result } = renderHook(() => useMangleRuleEditor());

      expect(result.current.form.formState.isDirty).toBe(false);

      act(() => {
        result.current.form.setValue('protocol', 'tcp', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.isDirty).toBe(true);
      });
    });
  });
});

describe('validateMarkName', () => {
  it('returns true for valid mark names', () => {
    expect(validateMarkName('valid_mark')).toBe(true);
    expect(validateMarkName('valid-mark')).toBe(true);
    expect(validateMarkName('ValidMark123')).toBe(true);
  });

  it('returns error message for empty name', () => {
    expect(validateMarkName('')).toBe('Mark name is required');
  });

  it('returns error message for invalid characters', () => {
    const result = validateMarkName('invalid mark!');
    expect(result).toBe('Mark name must contain only letters, numbers, underscores, and hyphens');
  });

  it('returns error message for names exceeding 63 characters', () => {
    const result = validateMarkName('a'.repeat(64));
    expect(result).toBe('Mark name must contain only letters, numbers, underscores, and hyphens');
  });
});
