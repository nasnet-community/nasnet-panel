/**
 * useRawRuleEditor Hook Tests
 *
 * Tests for the headless RAW rule editor hook including:
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

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { RawRule } from '@nasnet/core/types';

import { useRawRuleEditor, validateLogPrefix, validateJumpTarget } from './use-raw-rule-editor';


describe('useRawRuleEditor', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useRawRuleEditor());

      expect(result.current.rule.chain).toBe('prerouting');
      expect(result.current.rule.action).toBe('notrack');
      expect(result.current.rule.disabled).toBe(false);
      expect(result.current.rule.protocol).toBe('tcp');
    });

    it('initializes with provided initial rule', () => {
      const initialRule: Partial<RawRule> = {
        chain: 'output',
        action: 'drop',
        protocol: 'tcp',
        dstPort: '80',
        comment: 'Block HTTP',
      };

      const { result } = renderHook(() =>
        useRawRuleEditor({ initialRule })
      );

      expect(result.current.rule.chain).toBe('output');
      expect(result.current.rule.action).toBe('drop');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.dstPort).toBe('80');
    });
  });

  describe('Field Validation', () => {
    it('marks form as invalid when chain is missing', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('chain', '' as any);
        await result.current.form.trigger('chain');
      });

      await waitFor(() => {
        expect(result.current.errors.chain).toBeDefined();
      });
    });

    it('marks form as invalid when action is missing', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', '' as any);
        await result.current.form.trigger('action');
      });

      await waitFor(() => {
        expect(result.current.errors.action).toBeDefined();
      });
    });

    it('validates IP addresses with CIDR notation', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

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
      const { result } = renderHook(() => useRawRuleEditor());

      const validPorts = ['80', '443', '8000-9000', '1024-65535'];

      for (const port of validPorts) {
        await act(async () => {
          result.current.form.setValue('dstPort', port);
          await result.current.form.trigger('dstPort');
        });

        expect(result.current.errors.dstPort).toBeUndefined();
      }
    });

    it('rejects invalid IP addresses', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      const invalidAddresses = ['999.999.999.999', '192.168.1', 'not-an-ip'];

      for (const addr of invalidAddresses) {
        await act(async () => {
          result.current.form.setValue('srcAddress', addr);
          await result.current.form.trigger('srcAddress');
        });

        expect(result.current.errors.srcAddress).toBeDefined();
      }
    });

    it('rejects invalid port ranges', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      const invalidPorts = ['99999', '8000-7000', 'not-a-port'];

      for (const port of invalidPorts) {
        await act(async () => {
          result.current.form.setValue('dstPort', port);
          await result.current.form.trigger('dstPort');
        });

        expect(result.current.errors.dstPort).toBeDefined();
      }
    });
  });

  describe('Action-Specific Fields', () => {
    it('shows logPrefix field for log action', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'log');
      });

      expect(result.current.visibleFields).toContain('logPrefix');
    });

    it('shows jumpTarget field for jump action', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'jump');
      });

      expect(result.current.visibleFields).toContain('jumpTarget');
    });

    it('hides action-specific fields for drop action', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'drop');
      });

      expect(result.current.visibleFields).not.toContain('logPrefix');
      expect(result.current.visibleFields).not.toContain('jumpTarget');
    });

    it('requires logPrefix when action is log', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'log');
        result.current.form.setValue('logPrefix', '');
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.logPrefix).toBeDefined();
    });

    it('requires jumpTarget when action is jump', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'jump');
        result.current.form.setValue('jumpTarget', '');
        await result.current.form.trigger();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.jumpTarget).toBeDefined();
    });
  });

  describe('Chain-Specific Constraints', () => {
    it('allows inInterface for prerouting chain', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('chain', 'prerouting');
      });

      expect(result.current.canUseInInterface).toBe(true);
      expect(result.current.canUseOutInterface).toBe(false);
    });

    it('allows outInterface for output chain', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('chain', 'output');
      });

      expect(result.current.canUseInInterface).toBe(false);
      expect(result.current.canUseOutInterface).toBe(true);
    });
  });

  describe('Preview Generation', () => {
    it('generates preview for drop rule', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'drop');
        result.current.form.setValue('protocol', 'tcp');
        result.current.form.setValue('dstPort', '22');
      });

      expect(result.current.preview).toContain('DROP');
      expect(result.current.preview).toContain('TCP');
      expect(result.current.preview).toContain('22');
    });

    it('generates preview for notrack rule', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      await act(async () => {
        result.current.form.setValue('action', 'notrack');
        result.current.form.setValue('srcAddress', '192.168.1.0/24');
      });

      expect(result.current.preview).toContain('NOTRACK');
      expect(result.current.preview).toContain('192.168.1.0/24');
    });
  });

  describe('Reset and Duplicate', () => {
    it('resets form to initial values', async () => {
      const initialRule: Partial<RawRule> = {
        chain: 'output',
        action: 'drop',
      };

      const { result } = renderHook(() => useRawRuleEditor({ initialRule }));

      // Change values
      await act(async () => {
        result.current.form.setValue('chain', 'prerouting');
        result.current.form.setValue('action', 'accept');
      });

      // Reset
      await act(async () => {
        result.current.reset();
      });

      expect(result.current.rule.chain).toBe('output');
      expect(result.current.rule.action).toBe('drop');
    });

    it('duplicates rule values', async () => {
      const { result } = renderHook(() => useRawRuleEditor());

      const sourceRule: Partial<RawRule> = {
        chain: 'output',
        action: 'drop',
        protocol: 'tcp',
        dstPort: '80',
        comment: 'Block HTTP',
      };

      await act(async () => {
        result.current.duplicate(sourceRule);
      });

      expect(result.current.rule.chain).toBe('output');
      expect(result.current.rule.action).toBe('drop');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.dstPort).toBe('80');
      expect(result.current.rule.id).toBeUndefined(); // ID should be cleared
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with valid data', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => useRawRuleEditor({ onSubmit }));

      await act(async () => {
        result.current.form.setValue('chain', 'prerouting');
        result.current.form.setValue('action', 'drop');
        await result.current.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'prerouting',
          action: 'drop',
        })
      );
    });
  });
});

describe('validateLogPrefix', () => {
  it('accepts valid log prefix', () => {
    const validPrefixes = ['RAW-DROP-', 'RAW-BOGON-', 'DDOS-PROTECT'];

    validPrefixes.forEach((prefix) => {
      expect(validateLogPrefix(prefix)).toBe(true);
    });
  });

  it('rejects empty log prefix', () => {
    expect(validateLogPrefix('')).toMatch(/required/i);
  });

  it('rejects log prefix with invalid characters', () => {
    expect(validateLogPrefix('RAW:DROP')).toMatch(/alphanumeric/i);
    expect(validateLogPrefix('RAW DROP')).toMatch(/alphanumeric/i);
  });

  it('rejects log prefix exceeding 50 characters', () => {
    const longPrefix = 'A'.repeat(51);
    expect(validateLogPrefix(longPrefix)).toMatch(/50 characters/i);
  });
});

describe('validateJumpTarget', () => {
  it('accepts valid jump target', () => {
    const validTargets = ['custom-chain', 'my-chain-123', 'a'];

    validTargets.forEach((target) => {
      expect(validateJumpTarget(target)).toBe(true);
    });
  });

  it('rejects empty jump target', () => {
    expect(validateJumpTarget('')).toMatch(/required/i);
  });

  it('rejects jump target exceeding 63 characters', () => {
    const longTarget = 'A'.repeat(64);
    expect(validateJumpTarget(longTarget)).toMatch(/63 characters/i);
  });
});
