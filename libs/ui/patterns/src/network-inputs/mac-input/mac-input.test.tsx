/**
 * MAC Address Input Component Tests
 *
 * Comprehensive tests for the MAC input component:
 * - Hook unit tests (normalization, validation, vendor lookup)
 * - Component interaction tests
 * - Accessibility tests
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */

import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { MACInputDesktop } from './mac-input-desktop';
import { MACInputMobile } from './mac-input-mobile';
import {
  useMACInput,
  isValidMAC,
  normalizeMAC,
  extractOUI,
  lookupVendor,
} from './use-mac-input';

// Note: vitest-axe matchers are extended in setup.ts

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('isValidMAC', () => {
  it('validates correct MAC addresses in colon format', () => {
    expect(isValidMAC('AA:BB:CC:DD:EE:FF')).toBe(true);
    expect(isValidMAC('00:11:22:33:44:55')).toBe(true);
    expect(isValidMAC('aa:bb:cc:dd:ee:ff')).toBe(true);
  });

  it('validates correct MAC addresses in dash format', () => {
    expect(isValidMAC('AA-BB-CC-DD-EE-FF')).toBe(true);
    expect(isValidMAC('00-11-22-33-44-55')).toBe(true);
  });

  it('validates correct MAC addresses in dot format', () => {
    expect(isValidMAC('AABB.CCDD.EEFF')).toBe(true);
    expect(isValidMAC('0011.2233.4455')).toBe(true);
  });

  it('validates correct MAC addresses without separators', () => {
    expect(isValidMAC('AABBCCDDEEFF')).toBe(true);
    expect(isValidMAC('001122334455')).toBe(true);
  });

  it('rejects invalid MAC addresses', () => {
    expect(isValidMAC('')).toBe(false);
    expect(isValidMAC('AA:BB:CC:DD:EE')).toBe(false); // Too short
    expect(isValidMAC('AA:BB:CC:DD:EE:FF:GG')).toBe(false); // Too long
    expect(isValidMAC('GG:HH:II:JJ:KK:LL')).toBe(false); // Invalid hex
    expect(isValidMAC('not a mac')).toBe(false);
  });
});

describe('normalizeMAC', () => {
  it('normalizes to colon format', () => {
    expect(normalizeMAC('AABBCCDDEEFF', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizeMAC('aa:bb:cc:dd:ee:ff', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizeMAC('AA-BB-CC-DD-EE-FF', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizeMAC('aabb.ccdd.eeff', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('normalizes to dash format', () => {
    expect(normalizeMAC('AABBCCDDEEFF', 'dash')).toBe('AA-BB-CC-DD-EE-FF');
    expect(normalizeMAC('aa:bb:cc:dd:ee:ff', 'dash')).toBe('AA-BB-CC-DD-EE-FF');
  });

  it('normalizes to dot format', () => {
    expect(normalizeMAC('AABBCCDDEEFF', 'dot')).toBe('AABB.CCDD.EEFF');
    expect(normalizeMAC('aa:bb:cc:dd:ee:ff', 'dot')).toBe('AABB.CCDD.EEFF');
  });

  it('converts lowercase to uppercase', () => {
    expect(normalizeMAC('aabbccddeeff', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('strips invalid characters', () => {
    expect(normalizeMAC('AA:BB:CC:DD:EE:FF!!!', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizeMAC('AA BB CC DD EE FF', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('limits to 12 hex characters', () => {
    expect(normalizeMAC('AABBCCDDEEFFGGHHII', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('handles partial input', () => {
    expect(normalizeMAC('AA', 'colon')).toBe('AA');
    expect(normalizeMAC('AABB', 'colon')).toBe('AA:BB');
    expect(normalizeMAC('AABBCC', 'colon')).toBe('AA:BB:CC');
  });

  it('handles empty input', () => {
    expect(normalizeMAC('', 'colon')).toBe('');
  });
});

describe('extractOUI', () => {
  it('extracts OUI from valid MAC addresses', () => {
    expect(extractOUI('AA:BB:CC:DD:EE:FF')).toBe('AA:BB:CC');
    expect(extractOUI('00:50:56:XX:XX:XX')).toBe('00:50:56');
    expect(extractOUI('AABBCCDDEEFF')).toBe('AA:BB:CC');
  });

  it('returns null for short input', () => {
    expect(extractOUI('AA:BB')).toBe(null);
    expect(extractOUI('AABB')).toBe(null);
    expect(extractOUI('')).toBe(null);
  });
});

describe('lookupVendor', () => {
  it('looks up known vendors', () => {
    expect(lookupVendor('00:50:56:AA:BB:CC')).toBe('VMware');
    expect(lookupVendor('00:0C:29:DD:EE:FF')).toBe('VMware');
    expect(lookupVendor('B8:27:EB:11:22:33')).toBe('Raspberry Pi');
    expect(lookupVendor('00:0C:42:AA:BB:CC')).toBe('MikroTik');
  });

  it('returns Unknown vendor for unrecognized OUI', () => {
    expect(lookupVendor('11:22:33:44:55:66')).toBe('Unknown vendor');
  });

  it('returns null for invalid input', () => {
    expect(lookupVendor('')).toBe(null);
    expect(lookupVendor('AA:BB')).toBe(null);
  });
});

// ============================================================================
// Hook Tests
// ============================================================================

describe('useMACInput', () => {
  it('initializes with empty value', () => {
    const { result } = renderHook(() => useMACInput());
    expect(result.current.value).toBe('');
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('initializes with controlled value', () => {
    const { result } = renderHook(() =>
      useMACInput({ value: 'AABBCCDDEEFF' })
    );
    expect(result.current.value).toBe('AA:BB:CC:DD:EE:FF');
    expect(result.current.isValid).toBe(true);
  });

  it('normalizes input to configured format', () => {
    const { result } = renderHook(() =>
      useMACInput({ value: 'aabbccddeeff', format: 'dash' })
    );
    expect(result.current.value).toBe('AA-BB-CC-DD-EE-FF');
  });

  it('handles change events', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useMACInput({ onChange }));

    act(() => {
      result.current.handleChange('aa:bb:cc:dd:ee:ff');
    });

    expect(onChange).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
  });

  it('provides vendor lookup when enabled', () => {
    const { result } = renderHook(() =>
      useMACInput({ value: '00:50:56:AA:BB:CC', showVendor: true })
    );
    expect(result.current.vendor).toBe('VMware');
  });

  it('returns null vendor when disabled', () => {
    const { result } = renderHook(() =>
      useMACInput({ value: '00:50:56:AA:BB:CC', showVendor: false })
    );
    expect(result.current.vendor).toBe(null);
  });

  it('validates MAC address', () => {
    const { result } = renderHook(() =>
      useMACInput({ value: 'AA:BB:CC:DD:EE:FF' })
    );
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('does not show error for partial input', () => {
    const { result } = renderHook(() =>
      useMACInput({ value: 'AA:BB' })
    );
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe(null); // No error for partial
  });
});

// ============================================================================
// Desktop Component Tests
// ============================================================================

describe('MACInputDesktop', () => {
  it('renders with default props', () => {
    render(<MACInputDesktop />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'AA:BB:CC:DD:EE:FF');
  });

  it('renders with label', () => {
    render(<MACInputDesktop label="MAC Address" />);
    expect(screen.getByText('MAC Address')).toBeInTheDocument();
  });

  it('displays vendor when showVendor is true', () => {
    render(
      <MACInputDesktop value="00:50:56:AA:BB:CC" showVendor />
    );
    expect(screen.getByText('VMware')).toBeInTheDocument();
  });

  it('calls onChange when input changes', async () => {
    const onChange = vi.fn();
    render(<MACInputDesktop onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'AABBCCDDEEFF');

    expect(onChange).toHaveBeenCalled();
  });

  it('handles paste events', async () => {
    const onChange = vi.fn();
    render(<MACInputDesktop onChange={onChange} />);

    const input = screen.getByRole('textbox');

    await act(async () => {
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'AA-BB-CC-DD-EE-FF',
        },
      });
    });

    expect(onChange).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
  });

  it('shows validation indicator when valid', () => {
    render(<MACInputDesktop value="AA:BB:CC:DD:EE:FF" />);
    // Check for check icon (valid indicator)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', undefined);
  });

  it('shows error state when invalid and complete', () => {
    render(<MACInputDesktop value="AA:BB:CC:DD:EE:FF" error="Invalid MAC" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid MAC');
  });

  it('uses correct placeholder for dash format', () => {
    render(<MACInputDesktop format="dash" />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'AA-BB-CC-DD-EE-FF'
    );
  });

  it('uses correct placeholder for dot format', () => {
    render(<MACInputDesktop format="dot" />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'AABB.CCDD.EEFF'
    );
  });

  it('is disabled when disabled prop is true', () => {
    render(<MACInputDesktop disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('passes accessibility audit', async () => {
    const { container } = render(
      <MACInputDesktop label="MAC Address" aria-describedby="help" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ============================================================================
// Mobile Component Tests
// ============================================================================

describe('MACInputMobile', () => {
  it('renders with 44px minimum height', () => {
    render(<MACInputMobile />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('min-h-[44px]');
  });

  it('renders full width', () => {
    render(<MACInputMobile />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('w-full');
  });

  it('displays vendor as badge below input', () => {
    render(
      <MACInputMobile value="00:50:56:AA:BB:CC" showVendor />
    );
    expect(screen.getByText('VMware')).toBeInTheDocument();
  });

  it('calls onChange when input changes', async () => {
    const onChange = vi.fn();
    render(<MACInputMobile onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'AABB');

    expect(onChange).toHaveBeenCalled();
  });

  it('passes accessibility audit', async () => {
    const { container } = render(
      <MACInputMobile label="MAC Address" aria-describedby="help" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ============================================================================
// Format Conversion Tests
// ============================================================================

describe('Format conversions', () => {
  const testMAC = 'aabbccddeeff';

  it('converts all formats to colon', () => {
    const formats = [
      'AA:BB:CC:DD:EE:FF',
      'AA-BB-CC-DD-EE-FF',
      'AABB.CCDD.EEFF',
      'AABBCCDDEEFF',
    ];

    formats.forEach((input) => {
      expect(normalizeMAC(input, 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    });
  });

  it('handles mixed case input', () => {
    expect(normalizeMAC('aAbBcCdDeEfF', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('handles input with extra whitespace', () => {
    expect(normalizeMAC(' AA BB CC DD EE FF ', 'colon')).toBe('AA:BB:CC:DD:EE:FF');
  });
});
