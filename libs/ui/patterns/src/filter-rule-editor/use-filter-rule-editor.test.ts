/**
 * useFilterRuleEditor Hook Tests
 *
 * Tests for the headless filter rule editor hook including:
 * - Field validation (chain, action, addresses, ports)
 * - IP address validation (CIDR notation)
 * - Port validation (ranges)
 * - Log prefix validation
 * - Jump target validation
 * - Human-readable preview generation
 * - Duplicate rule functionality
 * - Reset form state
 * - Chain-specific interface constraints
 * - visibleFields computed correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFilterRuleEditor, validateLogPrefix, validateJumpTarget } from './use-filter-rule-editor';
import type { FilterRule } from '@nasnet/core/types';

describe('useFilterRuleEditor', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      expect(result.current.rule.chain).toBe('input');
      expect(result.current.rule.action).toBe('accept');
      expect(result.current.rule.disabled).toBe(false);
      expect(result.current.rule.log).toBe(false);
      expect(result.current.rule.protocol).toBe('tcp');
    });

    it('initializes with provided initial rule', () => {
      const initialRule: Partial<FilterRule> = {
        chain: 'forward',
        action: 'drop',
        protocol: 'tcp',
        dstPort: '80',
        comment: 'Block HTTP',
      };

      const { result } = renderHook(() =>
        useFilterRuleEditor({ initialRule })
      );

      expect(result.current.rule.chain).toBe('forward');
      expect(result.current.rule.action).toBe('drop');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.dstPort).toBe('80');
    });
  });

  describe('Field Validation', () => {
    it('marks form as invalid when chain is missing', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      await act(async () => {
        result.current.form.setValue('chain', '' as any);
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.chain).toBeDefined();
    });

    it('marks form as invalid when action is missing', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', '' as any);
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.action).toBeDefined();
    });

    it('validates IP addresses with CIDR notation', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      const validAddresses = ['192.168.1.1', '10.0.0.0/8', '172.16.0.0/12'];

      for (const addr of validAddresses) {
        await act(async () => {
          result.current.form.setValue('srcAddress', addr);
          await result.current.form.trigger('srcAddress');
        });

        expect(result.current.errors.srcAddress).toBeUndefined();
      }
    });

    it('validates port ranges', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      const validPorts = ['80', '443', '8000-9000', '1024-65535'];

      for (const port of validPorts) {
        await act(async () => {
          result.current.form.setValue('dstPort', port);
          await result.current.form.trigger('dstPort');
        });

        expect(result.current.errors.dstPort).toBeUndefined();
      }
    });
  });

  describe('Action-Specific Validation', () => {
    it('validates log action requires logPrefix', async () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'input',
            action: 'log',
            log: true,
          },
        })
      );

      // Set valid log prefix
      await act(async () => {
        result.current.form.setValue('logPrefix', 'FIREWALL-');
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(true);
    });

    it('validates jump action requires jumpTarget', async () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'forward',
            action: 'jump',
          },
        })
      );

      // Set valid jump target
      await act(async () => {
        result.current.form.setValue('jumpTarget', 'custom-chain');
        await result.current.form.trigger();
      });

      expect(result.current.errors.jumpTarget).toBeUndefined();
    });
  });

  describe('Log Prefix Validation', () => {
    it('accepts valid log prefixes', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      const validPrefixes = ['DROPPED-', 'ACCEPTED-', 'FIREWALL-', 'TEST123-'];

      for (const prefix of validPrefixes) {
        await act(async () => {
          result.current.form.setValue('action', 'log');
          result.current.form.setValue('log', true);
          result.current.form.setValue('logPrefix', prefix);
          await result.current.form.trigger('logPrefix');
        });

        expect(result.current.errors.logPrefix).toBeUndefined();
      }
    });

    it('rejects log prefixes with invalid characters', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'log');
        result.current.form.setValue('log', true);
        result.current.form.setValue('logPrefix', 'INVALID PREFIX!');
        await result.current.form.trigger('logPrefix');
      });

      expect(result.current.errors.logPrefix).toBeDefined();
      expect(result.current.errors.logPrefix).toContain('alphanumeric');
    });

    it('rejects log prefixes exceeding 50 characters', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'log');
        result.current.form.setValue('log', true);
        result.current.form.setValue('logPrefix', 'A'.repeat(51));
        await result.current.form.trigger('logPrefix');
      });

      expect(result.current.errors.logPrefix).toBeDefined();
      expect(result.current.errors.logPrefix).toContain('50 characters');
    });
  });

  describe('Chain-Specific Interface Validation', () => {
    it('allows inInterface on input and forward chains', () => {
      const { result: inputResult } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { chain: 'input' } })
      );
      expect(inputResult.current.canUseInInterface).toBe(true);

      const { result: forwardResult } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { chain: 'forward' } })
      );
      expect(forwardResult.current.canUseInInterface).toBe(true);
    });

    it('disallows inInterface on output chain', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { chain: 'output' } })
      );

      expect(result.current.canUseInInterface).toBe(false);
    });

    it('allows outInterface on forward and output chains', () => {
      const { result: forwardResult } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { chain: 'forward' } })
      );
      expect(forwardResult.current.canUseOutInterface).toBe(true);

      const { result: outputResult } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { chain: 'output' } })
      );
      expect(outputResult.current.canUseOutInterface).toBe(true);
    });

    it('disallows outInterface on input chain', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { chain: 'input' } })
      );

      expect(result.current.canUseOutInterface).toBe(false);
    });
  });

  describe('Preview Generation', () => {
    it('generates preview for accept rule', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'input',
            action: 'accept',
            protocol: 'tcp',
            dstPort: '22',
            comment: 'Allow SSH',
          },
        })
      );

      expect(result.current.preview).toContain('ACCEPT');
      expect(result.current.preview).toContain('TCP');
      expect(result.current.preview).toContain('22');
    });

    it('generates preview for drop rule', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'forward',
            action: 'drop',
            protocol: 'tcp',
            srcAddress: '192.168.1.100',
          },
        })
      );

      expect(result.current.preview).toContain('DROP');
      expect(result.current.preview).toContain('192.168.1.100');
    });

    it('includes connection state in preview', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'input',
            action: 'accept',
            connectionState: ['established', 'related'],
          },
        })
      );

      expect(result.current.preview).toContain('state:established,related');
    });

    it('includes source and destination addresses in preview', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'forward',
            action: 'accept',
            srcAddress: '192.168.1.0/24',
            dstAddress: '10.0.0.1',
          },
        })
      );

      expect(result.current.preview).toContain('from 192.168.1.0/24');
      expect(result.current.preview).toContain('to 10.0.0.1');
    });

    it('includes interface in preview', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'input',
            action: 'accept',
            inInterface: 'ether1',
          },
        })
      );

      expect(result.current.preview).toContain('ether1');
    });
  });

  describe('Duplicate Rule', () => {
    it('copies rule values but clears ID and order', () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      const sourceRule: Partial<FilterRule> = {
        id: '*1',
        order: 5,
        chain: 'forward',
        action: 'drop',
        protocol: 'tcp',
        dstPort: '23',
        comment: 'Block telnet',
      };

      act(() => {
        result.current.duplicate(sourceRule);
      });

      expect(result.current.rule.chain).toBe('forward');
      expect(result.current.rule.action).toBe('drop');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.dstPort).toBe('23');
      expect(result.current.rule.id).toBeUndefined();
      expect(result.current.rule.order).toBeUndefined();
    });
  });

  describe('Reset Form', () => {
    it('resets to default values when no initialRule provided', () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      // Make changes
      act(() => {
        result.current.form.setValue('chain', 'forward');
        result.current.form.setValue('action', 'drop');
        result.current.form.setValue('protocol', 'udp');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.chain).toBe('input');
      expect(result.current.rule.action).toBe('accept');
      expect(result.current.rule.protocol).toBe('tcp');
    });

    it('resets to initialRule values when provided', () => {
      const initialRule: Partial<FilterRule> = {
        chain: 'forward',
        action: 'drop',
        protocol: 'tcp',
        dstPort: '80',
      };

      const { result } = renderHook(() =>
        useFilterRuleEditor({ initialRule })
      );

      // Make changes
      act(() => {
        result.current.form.setValue('dstPort', '443');
        result.current.form.setValue('protocol', 'udp');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.dstPort).toBe('80');
      expect(result.current.rule.protocol).toBe('tcp');
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit callback with validated data', async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'input',
            action: 'accept',
            protocol: 'tcp',
            dstPort: '22',
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'input',
          action: 'accept',
          protocol: 'tcp',
          dstPort: '22',
        })
      );
    });

    it('does not call onSubmit when form has validation errors', async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: {
            chain: 'input',
            action: 'log',
            log: true,
            // Missing logPrefix - validation error
          },
          onSubmit,
        })
      );

      // Try to submit with invalid form
      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Visible Fields', () => {
    it('shows logPrefix for log action', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: { action: 'log' },
        })
      );

      expect(result.current.visibleFields).toContain('logPrefix');
    });

    it('shows jumpTarget for jump action', () => {
      const { result } = renderHook(() =>
        useFilterRuleEditor({
          initialRule: { action: 'jump' },
        })
      );

      expect(result.current.visibleFields).toContain('jumpTarget');
    });

    it('shows no special fields for accept/drop/reject actions', () => {
      const { result: acceptResult } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { action: 'accept' } })
      );
      expect(acceptResult.current.visibleFields).toEqual([]);

      const { result: dropResult } = renderHook(() =>
        useFilterRuleEditor({ initialRule: { action: 'drop' } })
      );
      expect(dropResult.current.visibleFields).toEqual([]);
    });

    it('updates visibleFields when action changes', () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      expect(result.current.visibleFields).toEqual([]);

      act(() => {
        result.current.form.setValue('action', 'log');
      });

      expect(result.current.visibleFields).toContain('logPrefix');
    });
  });

  describe('isDirty Tracking', () => {
    it('marks form as dirty when values change', async () => {
      const { result } = renderHook(() => useFilterRuleEditor());

      expect(result.current.form.formState.isDirty).toBe(false);

      act(() => {
        result.current.form.setValue('protocol', 'udp', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.form.formState.isDirty).toBe(true);
      });
    });
  });
});

describe('validateLogPrefix', () => {
  it('returns true for valid log prefixes', () => {
    expect(validateLogPrefix('DROPPED-')).toBe(true);
    expect(validateLogPrefix('FIREWALL-')).toBe(true);
    expect(validateLogPrefix('TEST123-')).toBe(true);
  });

  it('returns error message for empty prefix when log is enabled', () => {
    expect(validateLogPrefix('')).toContain('required');
  });

  it('returns error message for invalid characters', () => {
    const result = validateLogPrefix('INVALID PREFIX!');
    expect(result).toContain('alphanumeric');
  });

  it('returns error message for prefixes exceeding 50 characters', () => {
    const result = validateLogPrefix('A'.repeat(51));
    expect(result).toContain('50 characters');
  });
});

describe('validateJumpTarget', () => {
  it('returns true for valid jump targets', () => {
    expect(validateJumpTarget('custom-chain')).toBe(true);
    expect(validateJumpTarget('my_chain')).toBe(true);
  });

  it('returns error message for empty target', () => {
    expect(validateJumpTarget('')).toContain('required');
  });

  it('returns error message for targets exceeding 63 characters', () => {
    const result = validateJumpTarget('a'.repeat(64));
    expect(result).toContain('63 characters');
  });
});
