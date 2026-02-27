/**
 * NAT Rule Builder Unit Tests
 *
 * Tests for NAT rule builder components and hooks.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */

import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { NATRuleInput } from '@nasnet/core/types/firewall';

import { NATRuleBuilder } from './NATRuleBuilder';
import { useNATRuleBuilder } from './use-nat-rule-builder';

import type { NATRuleBuilderProps } from './nat-rule-builder.types';

// ============================================================================
// Mocks
// ============================================================================

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock dependencies
const mockInterfaces = ['ether1', 'ether2', 'bridge1'];
const mockInterfaceLists = ['WAN', 'LAN'];
const mockAddressLists = ['trusted-ips'];

// ============================================================================
// Test Setup
// ============================================================================

const defaultProps: NATRuleBuilderProps = {
  routerId: 'router-1',
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  interfaces: mockInterfaces,
  interfaceLists: mockInterfaceLists,
  addressLists: mockAddressLists,
};

// ============================================================================
// Hook Tests
// ============================================================================

describe('useNATRuleBuilder', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNATRuleBuilder());

    expect(result.current.rule.chain).toBe('srcnat');
    expect(result.current.rule.action).toBe('masquerade');
    expect(result.current.rule.disabled).toBe(false);
    expect(result.current.rule.log).toBe(false);
  });

  it('should initialize with custom initial rule', () => {
    const initialRule: Partial<NATRuleInput> = {
      chain: 'dstnat',
      action: 'dst-nat',
      protocol: 'tcp',
      dstPort: '80',
      toAddresses: '192.168.1.100',
    };

    const { result } = renderHook(() => useNATRuleBuilder({ initialRule }));

    expect(result.current.rule.chain).toBe('dstnat');
    expect(result.current.rule.action).toBe('dst-nat');
    expect(result.current.rule.protocol).toBe('tcp');
    expect(result.current.rule.dstPort).toBe('80');
    expect(result.current.rule.toAddresses).toBe('192.168.1.100');
  });

  it('should show correct visible fields for masquerade action', () => {
    const { result } = renderHook(() =>
      useNATRuleBuilder({
        initialRule: { chain: 'srcnat', action: 'masquerade' },
      })
    );

    const fields = result.current.visibleFields;
    expect(fields).toContain('chain');
    expect(fields).toContain('action');
    expect(fields).toContain('outInterface');
    expect(fields).toContain('srcAddress');
    expect(fields).not.toContain('toAddresses');
  });

  it('should show correct visible fields for dst-nat action', () => {
    const { result } = renderHook(() =>
      useNATRuleBuilder({
        initialRule: { chain: 'dstnat', action: 'dst-nat' },
      })
    );

    const fields = result.current.visibleFields;
    expect(fields).toContain('chain');
    expect(fields).toContain('action');
    expect(fields).toContain('inInterface');
    expect(fields).toContain('toAddresses');
    expect(fields).toContain('toPorts');
    expect(fields).not.toContain('outInterface');
  });

  it('should generate correct preview for masquerade rule', () => {
    const { result } = renderHook(() =>
      useNATRuleBuilder({
        initialRule: {
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
        },
      })
    );

    expect(result.current.preview).toContain('chain=srcnat');
    expect(result.current.preview).toContain('action=masquerade');
    expect(result.current.preview).toContain('out-interface=ether1');
  });

  it('should generate correct preview for dst-nat rule', () => {
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

    expect(result.current.preview).toContain('chain=dstnat');
    expect(result.current.preview).toContain('action=dst-nat');
    expect(result.current.preview).toContain('protocol=tcp');
    expect(result.current.preview).toContain('dst-port=80');
    expect(result.current.preview).toContain('to-addresses=192.168.1.100');
    expect(result.current.preview).toContain('to-ports=8080');
  });

  it('should generate human-readable description', () => {
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

    expect(result.current.description).toContain('Forward to');
    expect(result.current.description).toContain('192.168.1.100');
    expect(result.current.description).toContain('TCP');
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() => useNATRuleBuilder());

    // Update form values
    act(() => {
      result.current.form.setValue('chain', 'dstnat');
      result.current.form.setValue('action', 'dst-nat');
    });

    expect(result.current.rule.chain).toBe('dstnat');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.rule.chain).toBe('srcnat');
    expect(result.current.rule.action).toBe('masquerade');
  });

  it('should duplicate rule and clear ID', () => {
    const { result } = renderHook(() => useNATRuleBuilder());

    const sourceRule: Partial<NATRuleInput> = {
      id: 'original-id',
      chain: 'dstnat',
      action: 'dst-nat',
      toAddresses: '192.168.1.100',
      position: 5,
    };

    act(() => {
      result.current.duplicate(sourceRule);
    });

    expect(result.current.rule.chain).toBe('dstnat');
    expect(result.current.rule.action).toBe('dst-nat');
    expect(result.current.rule.toAddresses).toBe('192.168.1.100');
    expect(result.current.rule.id).toBeUndefined();
    expect(result.current.rule.position).toBeUndefined();
  });

  it('should track validation errors', async () => {
    const { result } = renderHook(() => useNATRuleBuilder());

    // Set dst-nat without required toAddresses
    act(() => {
      result.current.form.setValue('chain', 'dstnat');
      result.current.form.setValue('action', 'dst-nat');
      result.current.form.setValue('toAddresses', '');
    });

    // Trigger validation
    await act(async () => {
      await result.current.form.trigger();
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
    });
  });
});

// ============================================================================
// Component Tests
// ============================================================================

describe('NATRuleBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render in create mode', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        mode="create"
      />
    );

    expect(screen.getByText('Create NAT Rule')).toBeInTheDocument();
  });

  it('should render in edit mode', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        mode="edit"
        initialRule={{ id: 'rule-1', chain: 'srcnat', action: 'masquerade' }}
      />
    );

    expect(screen.getByText('Edit NAT Rule')).toBeInTheDocument();
  });

  it('should show delete button in edit mode', () => {
    const onDelete = vi.fn();

    render(
      <NATRuleBuilder
        {...defaultProps}
        mode="edit"
        onDelete={onDelete}
        initialRule={{ id: 'rule-1', chain: 'srcnat', action: 'masquerade' }}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should not show delete button in create mode', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        mode="create"
      />
    );

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <NATRuleBuilder
        {...defaultProps}
        onClose={onClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should disable save button when form is invalid', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        initialRule={{
          chain: 'dstnat',
          action: 'dst-nat',
          toAddresses: '', // Invalid - required for dst-nat
        }}
      />
    );

    const saveButton = screen.getByRole('button', { name: /create rule/i });
    expect(saveButton).toBeDisabled();
  });

  it('should show loading state when saving', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        isSaving={true}
      />
    );

    expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeInTheDocument();
  });

  it('should render masquerade action badge', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        initialRule={{ chain: 'srcnat', action: 'masquerade' }}
      />
    );

    expect(screen.getByText('MASQUERADE')).toBeInTheDocument();
  });

  it('should show CLI preview', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        initialRule={{
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
        }}
      />
    );

    const preview = screen.getByText(/\/ip\/firewall\/nat\/add/);
    expect(preview).toBeInTheDocument();
    expect(preview.textContent).toContain('chain=srcnat');
    expect(preview.textContent).toContain('action=masquerade');
  });

  it('should show human-readable description', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        initialRule={{
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
        }}
      />
    );

    expect(screen.getByText(/Masquerade outgoing traffic/)).toBeInTheDocument();
  });

  it('should populate interface selectors with provided interfaces', () => {
    render(
      <NATRuleBuilder
        {...defaultProps}
        initialRule={{ chain: 'srcnat', action: 'masquerade' }}
      />
    );

    // Click to open select dropdown
    const outInterfaceSelect = screen.getByRole('combobox', {
      name: /output interface/i,
    });

    expect(outInterfaceSelect).toBeInTheDocument();
  });

  it('should show confirmation dialog before delete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <NATRuleBuilder
        {...defaultProps}
        mode="edit"
        onDelete={onDelete}
        initialRule={{ id: 'rule-1', chain: 'srcnat', action: 'masquerade' }}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/delete nat rule/i)).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete this nat rule/i)
      ).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete rule/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('NAT Rule Validation', () => {
  it('should require toAddresses for dst-nat action', async () => {
    const { result } = renderHook(() =>
      useNATRuleBuilder({
        initialRule: {
          chain: 'dstnat',
          action: 'dst-nat',
          toAddresses: '', // Invalid
        },
      })
    );

    await act(async () => {
      await result.current.form.trigger();
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.toAddresses).toBeDefined();
    });
  });

  it('should require outInterface for masquerade action', async () => {
    const { result } = renderHook(() =>
      useNATRuleBuilder({
        initialRule: {
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: '', // Invalid
          outInterfaceList: '', // Also invalid
        },
      })
    );

    await act(async () => {
      await result.current.form.trigger();
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
    });
  });

  it('should accept valid masquerade rule', async () => {
    const { result } = renderHook(() =>
      useNATRuleBuilder({
        initialRule: {
          chain: 'srcnat',
          action: 'masquerade',
          outInterface: 'ether1',
        },
      })
    );

    await act(async () => {
      await result.current.form.trigger();
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });
  });

  it('should accept valid dst-nat rule', async () => {
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

    await act(async () => {
      await result.current.form.trigger();
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });
  });
});
