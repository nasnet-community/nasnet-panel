/**
 * Tests for useNATRuleBuilder Hook
 *
 * Tests hook logic, field visibility, validation, and description generation.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNATRuleBuilder } from './use-nat-rule-builder';
import type { NATRuleInput } from '@nasnet/core/types/firewall';

describe('useNATRuleBuilder', () => {
  describe('Initialization', () => {
    it('should initialize with default masquerade values', () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      expect(result.current.rule.chain).toBe('srcnat');
      expect(result.current.rule.action).toBe('masquerade');
      expect(result.current.rule.disabled).toBe(false);
      expect(result.current.rule.log).toBe(false);
    });

    it('should initialize with custom initial values', () => {
      const initialRule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        protocol: 'tcp',
        dstPort: '80',
        toAddresses: '192.168.1.100',
      };

      const { result } = renderHook(() =>
        useNATRuleBuilder({ initialRule })
      );

      expect(result.current.rule.chain).toBe('dstnat');
      expect(result.current.rule.action).toBe('dst-nat');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.dstPort).toBe('80');
      expect(result.current.rule.toAddresses).toBe('192.168.1.100');
    });

    it('should merge initial values with defaults', () => {
      const initialRule: Partial<NATRuleInput> = {
        action: 'src-nat',
        toAddresses: '10.0.0.1',
      };

      const { result } = renderHook(() =>
        useNATRuleBuilder({ initialRule })
      );

      expect(result.current.rule.chain).toBe('srcnat'); // Default
      expect(result.current.rule.action).toBe('src-nat'); // Custom
      expect(result.current.rule.disabled).toBe(false); // Default
      expect(result.current.rule.toAddresses).toBe('10.0.0.1'); // Custom
    });
  });

  describe('Field Visibility', () => {
    it('should show correct fields for masquerade action', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: { action: 'masquerade' },
        })
      );

      const fields = result.current.visibleFields;
      expect(fields).toContain('outInterface');
      expect(fields).toContain('srcAddress');
      expect(fields).toContain('dstAddress');
      expect(fields).not.toContain('toAddresses');
      expect(fields).not.toContain('toPorts');
    });

    it('should show correct fields for dst-nat action', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: { action: 'dst-nat' },
        })
      );

      const fields = result.current.visibleFields;
      expect(fields).toContain('toAddresses');
      expect(fields).toContain('toPorts');
      expect(fields).toContain('dstPort');
      expect(fields).toContain('inInterface');
      expect(fields).not.toContain('outInterface');
    });

    it('should show correct fields for src-nat action', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: { action: 'src-nat' },
        })
      );

      const fields = result.current.visibleFields;
      expect(fields).toContain('toAddresses');
      expect(fields).toContain('outInterface');
      expect(fields).toContain('srcAddress');
      expect(fields).not.toContain('toPorts');
    });

    it('should update visible fields when action changes', () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      // Initially masquerade
      expect(result.current.visibleFields).toContain('outInterface');
      expect(result.current.visibleFields).not.toContain('toAddresses');

      // Change to dst-nat
      act(() => {
        result.current.form.setValue('action', 'dst-nat');
      });

      expect(result.current.visibleFields).toContain('toAddresses');
      expect(result.current.visibleFields).toContain('toPorts');
    });
  });

  describe('Validation', () => {
    it('should be invalid when masquerade missing outInterface', async () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: undefined,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
        expect(result.current.errors.outInterface).toBeDefined();
      });
    });

    it('should be valid when masquerade has outInterface', async () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
        expect(result.current.errors).toEqual({});
      });
    });

    it('should be invalid when dst-nat missing toAddresses', async () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'dstnat',
            action: 'dst-nat',
            dstPort: '80',
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
        expect(result.current.errors.toAddresses).toBeDefined();
      });
    });

    it('should be valid when dst-nat has toAddresses', async () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'dstnat',
            action: 'dst-nat',
            toAddresses: '192.168.1.100',
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
      });
    });

    it('should validate port format', async () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      // Invalid port format
      act(() => {
        result.current.form.setValue('dstPort', 'invalid');
      });

      await waitFor(() => {
        expect(result.current.errors.dstPort).toBeDefined();
      });

      // Valid port
      act(() => {
        result.current.form.setValue('dstPort', '80');
      });

      await waitFor(() => {
        expect(result.current.errors.dstPort).toBeUndefined();
      });
    });

    it('should validate port range format', async () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      // Valid port range
      act(() => {
        result.current.form.setValue('dstPort', '8000-9000');
      });

      await waitFor(() => {
        expect(result.current.errors.dstPort).toBeUndefined();
      });
    });

    it('should validate IP address format', async () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({ initialRule: { action: 'dst-nat' } })
      );

      // Invalid IP
      act(() => {
        result.current.form.setValue('toAddresses', '999.999.999.999');
      });

      await waitFor(() => {
        expect(result.current.errors.toAddresses).toBeDefined();
      });

      // Valid IP
      act(() => {
        result.current.form.setValue('toAddresses', '192.168.1.100');
      });

      await waitFor(() => {
        expect(result.current.errors.toAddresses).toBeUndefined();
      });
    });

    it('should validate CIDR notation', async () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      // Valid CIDR
      act(() => {
        result.current.form.setValue('srcAddress', '192.168.1.0/24');
      });

      await waitFor(() => {
        expect(result.current.errors.srcAddress).toBeUndefined();
      });

      // Valid single IP
      act(() => {
        result.current.form.setValue('srcAddress', '192.168.1.1');
      });

      await waitFor(() => {
        expect(result.current.errors.srcAddress).toBeUndefined();
      });
    });
  });

  describe('Preview Generation', () => {
    it('should generate preview for masquerade rule', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
            comment: 'WAN masquerade',
          },
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('chain=srcnat');
      expect(preview).toContain('action=masquerade');
      expect(preview).toContain('out-interface=ether1');
      expect(preview).toContain('comment="WAN masquerade"');
    });

    it('should generate preview for dst-nat rule', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'dstnat',
            action: 'dst-nat',
            protocol: 'tcp',
            dstPort: '80',
            toAddresses: '192.168.1.100',
            toPorts: '8080',
          },
        })
      );

      const preview = result.current.preview;
      expect(preview).toContain('chain=dstnat');
      expect(preview).toContain('action=dst-nat');
      expect(preview).toContain('protocol=tcp');
      expect(preview).toContain('dst-port=80');
      expect(preview).toContain('to-addresses=192.168.1.100');
      expect(preview).toContain('to-ports=8080');
    });

    it('should update preview when fields change', () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      // Initial preview
      const initialPreview = result.current.preview;
      expect(initialPreview).toContain('action=masquerade');

      // Change action
      act(() => {
        result.current.form.setValue('action', 'dst-nat');
        result.current.form.setValue('toAddresses', '192.168.1.100');
      });

      const updatedPreview = result.current.preview;
      expect(updatedPreview).toContain('action=dst-nat');
      expect(updatedPreview).toContain('to-addresses=192.168.1.100');
    });
  });

  describe('Description Generation', () => {
    it('should generate description for masquerade rule', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
          },
        })
      );

      expect(result.current.description).toContain('Masquerade');
      expect(result.current.description).toContain('ether1');
    });

    it('should generate description for port forward', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'dstnat',
            action: 'dst-nat',
            protocol: 'tcp',
            dstPort: '80',
            toAddresses: '192.168.1.100',
            toPorts: '8080',
          },
        })
      );

      expect(result.current.description).toContain('Forward');
      expect(result.current.description).toContain('192.168.1.100');
      expect(result.current.description).toContain('8080');
      expect(result.current.description).toContain('TCP');
    });

    it('should include protocol in description', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'dstnat',
            action: 'dst-nat',
            protocol: 'udp',
            dstPort: '53',
            toAddresses: '192.168.1.53',
          },
        })
      );

      expect(result.current.description).toContain('UDP');
    });

    it('should include source/destination addresses in description', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
            srcAddress: '192.168.1.0/24',
            dstAddress: '8.8.8.8',
          },
        })
      );

      expect(result.current.description).toContain('192.168.1.0/24');
      expect(result.current.description).toContain('8.8.8.8');
    });
  });

  describe('Form Actions', () => {
    it('should reset form to initial values', () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      // Change some values
      act(() => {
        result.current.form.setValue('action', 'dst-nat');
        result.current.form.setValue('toAddresses', '192.168.1.100');
      });

      expect(result.current.rule.action).toBe('dst-nat');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.action).toBe('masquerade');
      expect(result.current.rule.toAddresses).toBeUndefined();
    });

    it('should reset to custom initial values', () => {
      const initialRule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        toAddresses: '192.168.1.100',
      };

      const { result } = renderHook(() =>
        useNATRuleBuilder({ initialRule })
      );

      // Change values
      act(() => {
        result.current.form.setValue('action', 'src-nat');
        result.current.form.setValue('toAddresses', '10.0.0.1');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rule.action).toBe('dst-nat');
      expect(result.current.rule.toAddresses).toBe('192.168.1.100');
    });

    it('should duplicate rule', () => {
      const { result } = renderHook(() => useNATRuleBuilder());

      const sourceRule: Partial<NATRuleInput> = {
        id: 'rule-123',
        chain: 'dstnat',
        action: 'dst-nat',
        protocol: 'tcp',
        dstPort: '80',
        toAddresses: '192.168.1.100',
        position: 5,
      };

      act(() => {
        result.current.duplicate(sourceRule);
      });

      expect(result.current.rule.chain).toBe('dstnat');
      expect(result.current.rule.action).toBe('dst-nat');
      expect(result.current.rule.protocol).toBe('tcp');
      expect(result.current.rule.dstPort).toBe('80');
      expect(result.current.rule.toAddresses).toBe('192.168.1.100');
      expect(result.current.rule.id).toBeUndefined(); // Cleared for new rule
      expect(result.current.rule.position).toBeUndefined(); // Cleared for new rule
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit callback with valid data', async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
        })
      );
    });

    it('should not call onSubmit with invalid data', async () => {
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: undefined, // Invalid - required
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should handle async onSubmit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe('Edge Cases', () => {
    it('should handle action change with field clearing', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'dstnat',
            action: 'dst-nat',
            toAddresses: '192.168.1.100',
            toPorts: '8080',
          },
        })
      );

      // Change to action that doesn't use toPorts
      act(() => {
        result.current.form.setValue('action', 'masquerade');
      });

      // toPorts should still exist in form data but not be visible
      expect(result.current.visibleFields).not.toContain('toPorts');
    });

    it('should handle comment field with special characters', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
            comment: 'Rule with "quotes" and special chars: @#$%',
          },
        })
      );

      expect(result.current.preview).toContain(
        'comment="Rule with "quotes" and special chars: @#$%"'
      );
    });

    it('should handle disabled flag in preview', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
            disabled: true,
          },
        })
      );

      expect(result.current.preview).toContain('disabled=yes');
    });

    it('should handle log flag in preview', () => {
      const { result } = renderHook(() =>
        useNATRuleBuilder({
          initialRule: {
            chain: 'srcnat',
            action: 'masquerade',
            outInterface: 'ether1',
            log: true,
            logPrefix: 'NAT-LOG',
          },
        })
      );

      expect(result.current.preview).toContain('log=yes');
      expect(result.current.preview).toContain('log-prefix="NAT-LOG"');
    });
  });
});
