/**
 * SubnetInput Tests
 * Unit and component tests for the Subnet/CIDR Input component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as React from 'react';

import { useSubnetInput, COMMON_PREFIX_OPTIONS } from './use-subnet-input';
import { SubnetCalculations } from './subnet-calculations';
import { PrefixSelector } from './prefix-selector';
import { OverlapWarning } from './overlap-warning';
import type { SubnetInfo, OverlapResult } from './subnet-input.types';

// ============================================================================
// HOOK TESTS: useSubnetInput
// ============================================================================

describe('useSubnetInput', () => {
  // Helper component to test the hook
  function HookTester({
    value,
    onChange,
    checkOverlap,
    error,
  }: {
    value?: string;
    onChange?: (v: string) => void;
    checkOverlap?: (cidr: string) => OverlapResult | null;
    error?: string;
  }) {
    const state = useSubnetInput({ value, onChange, checkOverlap, error });
    return (
      <div>
        <span data-testid="value">{state.value}</span>
        <span data-testid="ipPart">{state.ipPart}</span>
        <span data-testid="prefixPart">{state.prefixPart}</span>
        <span data-testid="isValid">{String(state.isValid)}</span>
        <span data-testid="error">{state.error || ''}</span>
        <span data-testid="networkInfo">
          {state.networkInfo ? JSON.stringify(state.networkInfo) : ''}
        </span>
        <span data-testid="overlap">
          {state.overlap ? JSON.stringify(state.overlap) : ''}
        </span>
        <button onClick={() => state.setIP('10.0.0.0')}>Set IP</button>
        <button onClick={() => state.setPrefix(16)}>Set Prefix</button>
        <button onClick={() => state.setValue('172.16.0.0/12')}>Set Value</button>
        <button onClick={() => state.clear()}>Clear</button>
      </div>
    );
  }

  describe('parsing and validation', () => {
    it('parses valid CIDR notation correctly', () => {
      render(<HookTester value="192.168.1.0/24" />);

      expect(screen.getByTestId('value')).toHaveTextContent('192.168.1.0/24');
      expect(screen.getByTestId('ipPart')).toHaveTextContent('192.168.1.0');
      expect(screen.getByTestId('prefixPart')).toHaveTextContent('24');
      expect(screen.getByTestId('isValid')).toHaveTextContent('true');
    });

    it('validates 192.168.1.0/24 correctly', () => {
      render(<HookTester value="192.168.1.0/24" />);

      const networkInfo = JSON.parse(
        screen.getByTestId('networkInfo').textContent || '{}'
      );

      expect(networkInfo.network).toBe('192.168.1.0');
      expect(networkInfo.broadcast).toBe('192.168.1.255');
      expect(networkInfo.firstHost).toBe('192.168.1.1');
      expect(networkInfo.lastHost).toBe('192.168.1.254');
      expect(networkInfo.hostCount).toBe(254);
      expect(networkInfo.prefix).toBe(24);
    });

    it('handles invalid prefix /33', () => {
      render(<HookTester value="192.168.1.0/33" />);

      expect(screen.getByTestId('isValid')).toHaveTextContent('false');
    });

    it('handles invalid IP 999.999.999.999/24', () => {
      render(<HookTester value="999.999.999.999/24" />);

      expect(screen.getByTestId('isValid')).toHaveTextContent('false');
    });

    it('handles edge case /0', () => {
      render(<HookTester value="0.0.0.0/0" />);

      expect(screen.getByTestId('isValid')).toHaveTextContent('true');
      const networkInfo = JSON.parse(
        screen.getByTestId('networkInfo').textContent || '{}'
      );
      expect(networkInfo.prefix).toBe(0);
    });

    it('handles /32 host route', () => {
      render(<HookTester value="192.168.1.1/32" />);

      expect(screen.getByTestId('isValid')).toHaveTextContent('true');
      const networkInfo = JSON.parse(
        screen.getByTestId('networkInfo').textContent || '{}'
      );
      expect(networkInfo.hostCount).toBe(1);
    });

    it('handles /31 point-to-point', () => {
      render(<HookTester value="192.168.1.0/31" />);

      expect(screen.getByTestId('isValid')).toHaveTextContent('true');
      const networkInfo = JSON.parse(
        screen.getByTestId('networkInfo').textContent || '{}'
      );
      expect(networkInfo.hostCount).toBe(2);
    });
  });

  describe('controlled mode', () => {
    it('calls onChange when value is modified', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<HookTester value="192.168.1.0/24" onChange={onChange} />);

      await user.click(screen.getByText('Set IP'));
      expect(onChange).toHaveBeenCalledWith('10.0.0.0/24');
    });

    it('updates prefix via setPrefix', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<HookTester value="192.168.1.0/24" onChange={onChange} />);

      await user.click(screen.getByText('Set Prefix'));
      expect(onChange).toHaveBeenCalledWith('192.168.1.0/16');
    });

    it('updates full value via setValue', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<HookTester value="192.168.1.0/24" onChange={onChange} />);

      await user.click(screen.getByText('Set Value'));
      expect(onChange).toHaveBeenCalledWith('172.16.0.0/12');
    });

    it('clears value via clear()', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<HookTester value="192.168.1.0/24" onChange={onChange} />);

      await user.click(screen.getByText('Clear'));
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('overlap detection', () => {
    it('calls checkOverlap callback with CIDR', () => {
      const checkOverlap = vi.fn().mockReturnValue({
        overlappingCidr: '192.168.0.0/16',
        resourceName: 'LAN Pool',
        resourceType: 'DHCP Pool',
      });

      render(<HookTester value="192.168.1.0/24" checkOverlap={checkOverlap} />);

      expect(checkOverlap).toHaveBeenCalledWith('192.168.1.0/24');
      const overlap = JSON.parse(
        screen.getByTestId('overlap').textContent || '{}'
      );
      expect(overlap.overlappingCidr).toBe('192.168.0.0/16');
    });

    it('returns null overlap when no conflict', () => {
      const checkOverlap = vi.fn().mockReturnValue(null);

      render(<HookTester value="10.0.0.0/8" checkOverlap={checkOverlap} />);

      expect(screen.getByTestId('overlap')).toHaveTextContent('');
    });
  });

  describe('external error', () => {
    it('shows external error message', () => {
      render(<HookTester value="192.168.1.0/24" error="Custom error message" />);

      expect(screen.getByTestId('error')).toHaveTextContent('Custom error message');
      expect(screen.getByTestId('isValid')).toHaveTextContent('false');
    });
  });

  describe('prefix options', () => {
    it('provides common prefix options', () => {
      expect(COMMON_PREFIX_OPTIONS).toHaveLength(7);
      expect(COMMON_PREFIX_OPTIONS.map((o) => o.prefix)).toEqual([
        8, 16, 22, 24, 28, 30, 32,
      ]);
    });

    it('includes correct host counts', () => {
      const prefix24 = COMMON_PREFIX_OPTIONS.find((o) => o.prefix === 24);
      expect(prefix24?.hosts).toBe(254);

      const prefix8 = COMMON_PREFIX_OPTIONS.find((o) => o.prefix === 8);
      expect(prefix8?.hosts).toBe(16777214);
    });
  });
});

// ============================================================================
// COMPONENT TESTS: SubnetCalculations
// ============================================================================

describe('SubnetCalculations', () => {
  const mockInfo: SubnetInfo = {
    network: '192.168.1.0',
    broadcast: '192.168.1.255',
    firstHost: '192.168.1.1',
    lastHost: '192.168.1.254',
    hostCount: 254,
    prefix: 24,
    mask: '255.255.255.0',
  };

  it('displays all subnet information', () => {
    render(<SubnetCalculations info={mockInfo} />);

    expect(screen.getByText('192.168.1.0')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.255')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1 - 192.168.1.254')).toBeInTheDocument();
    expect(screen.getByText('254')).toBeInTheDocument();
    expect(screen.getByText('255.255.255.0')).toBeInTheDocument();
  });

  it('formats large host counts with separators', () => {
    const largeInfo: SubnetInfo = {
      ...mockInfo,
      hostCount: 16777214,
    };

    render(<SubnetCalculations info={largeInfo} />);

    expect(screen.getByText('16,777,214')).toBeInTheDocument();
  });

  it('supports collapsible mode', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <SubnetCalculations
        info={mockInfo}
        collapsed={true}
        onToggleCollapse={onToggle}
      />
    );

    const button = screen.getByRole('button', { expanded: false });
    await user.click(button);

    expect(onToggle).toHaveBeenCalled();
  });
});

// ============================================================================
// COMPONENT TESTS: PrefixSelector
// ============================================================================

describe('PrefixSelector', () => {
  it('displays current prefix value', () => {
    render(
      <PrefixSelector
        value={24}
        onChange={vi.fn()}
        options={COMMON_PREFIX_OPTIONS}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('24');
  });

  it('calls onChange when input changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PrefixSelector
        value={24}
        onChange={onChange}
        options={COMMON_PREFIX_OPTIONS}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '16');

    expect(onChange).toHaveBeenLastCalledWith(16);
  });

  it('clamps prefix to valid range', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PrefixSelector
        value={24}
        onChange={onChange}
        options={COMMON_PREFIX_OPTIONS}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '99');

    // Should not call onChange with invalid value
    expect(onChange).not.toHaveBeenCalledWith(99);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <PrefixSelector
        value={24}
        onChange={vi.fn()}
        options={COMMON_PREFIX_OPTIONS}
        disabled
      />
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

// ============================================================================
// COMPONENT TESTS: OverlapWarning
// ============================================================================

describe('OverlapWarning', () => {
  const mockOverlap: OverlapResult = {
    overlappingCidr: '192.168.0.0/16',
    resourceName: 'LAN Pool',
    resourceType: 'DHCP Pool',
  };

  it('displays overlap warning badge', () => {
    render(<OverlapWarning overlap={mockOverlap} />);

    expect(screen.getByText('Overlap Detected')).toBeInTheDocument();
  });

  it('opens dialog with details on click', async () => {
    const user = userEvent.setup();

    render(<OverlapWarning overlap={mockOverlap} />);

    await user.click(screen.getByText('Overlap Detected'));

    await waitFor(() => {
      expect(screen.getByText('Subnet Overlap Detected')).toBeInTheDocument();
      expect(screen.getByText('LAN Pool')).toBeInTheDocument();
      expect(screen.getByText('DHCP Pool')).toBeInTheDocument();
      expect(screen.getByText('192.168.0.0/16')).toBeInTheDocument();
    });
  });

  it('calls onShowDetails callback when dialog opens', async () => {
    const onShowDetails = vi.fn();
    const user = userEvent.setup();

    render(<OverlapWarning overlap={mockOverlap} onShowDetails={onShowDetails} />);

    await user.click(screen.getByText('Overlap Detected'));

    expect(onShowDetails).toHaveBeenCalled();
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Accessibility', () => {
  it('SubnetCalculations has no accessibility violations', async () => {
    const mockInfo: SubnetInfo = {
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      hostCount: 254,
      prefix: 24,
      mask: '255.255.255.0',
    };

    const { container } = render(<SubnetCalculations info={mockInfo} />);
    const results = await axe(container);

    // @ts-expect-error - vitest-axe extends expect in setup.ts
    expect(results).toHaveNoViolations();
  });

  it('PrefixSelector has no accessibility violations', async () => {
    const { container } = render(
      <PrefixSelector
        value={24}
        onChange={vi.fn()}
        options={COMMON_PREFIX_OPTIONS}
        ariaLabel="CIDR prefix"
      />
    );
    const results = await axe(container);

    // @ts-expect-error - vitest-axe extends expect in setup.ts
    expect(results).toHaveNoViolations();
  });

  it('OverlapWarning has no accessibility violations', async () => {
    const mockOverlap: OverlapResult = {
      overlappingCidr: '192.168.0.0/16',
      resourceName: 'LAN Pool',
      resourceType: 'DHCP Pool',
    };

    const { container } = render(<OverlapWarning overlap={mockOverlap} />);
    const results = await axe(container);

    // @ts-expect-error - vitest-axe extends expect in setup.ts
    expect(results).toHaveNoViolations();
  });
});
