/**
 * IPInput Component Tests
 *
 * Comprehensive test suite for the IP address input component:
 * - Hook unit tests (state management, validation, navigation)
 * - Component interaction tests (typing, paste, keyboard)
 * - Platform presenter switching tests
 * - Accessibility tests with axe-core
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

import { render, screen, fireEvent, waitFor , renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';

import { IPInput } from './ip-input';
import { IPInputDesktop } from './ip-input-desktop';
import { IPInputMobile } from './ip-input-mobile';
import {
  useIPInput,
  classifyIP,
  isValidOctet,
  isValidIPv4,
} from './use-ip-input';

// Note: vitest-axe matchers are extended in setup.ts

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('isValidOctet', () => {
  it('should accept empty string', () => {
    expect(isValidOctet('')).toBe(true);
  });

  it('should accept valid octets 0-255', () => {
    expect(isValidOctet('0')).toBe(true);
    expect(isValidOctet('1')).toBe(true);
    expect(isValidOctet('127')).toBe(true);
    expect(isValidOctet('255')).toBe(true);
  });

  it('should reject octets > 255', () => {
    expect(isValidOctet('256')).toBe(false);
    expect(isValidOctet('300')).toBe(false);
    expect(isValidOctet('999')).toBe(false);
  });

  it('should reject leading zeros', () => {
    expect(isValidOctet('00')).toBe(false);
    expect(isValidOctet('01')).toBe(false);
    expect(isValidOctet('001')).toBe(false);
  });

  it('should reject non-numeric input', () => {
    expect(isValidOctet('abc')).toBe(false);
    expect(isValidOctet('12a')).toBe(false);
    expect(isValidOctet('-1')).toBe(false);
  });
});

describe('isValidIPv4', () => {
  it('should accept valid IPv4 addresses', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('10.0.0.1')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('127.0.0.1')).toBe(true);
  });

  it('should reject invalid IPv4 addresses', () => {
    expect(isValidIPv4('')).toBe(false);
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('192.168.1')).toBe(false);
    expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
  });

  it('should reject addresses with leading zeros', () => {
    expect(isValidIPv4('192.168.01.1')).toBe(false);
    expect(isValidIPv4('01.02.03.04')).toBe(false);
  });
});

describe('classifyIP', () => {
  it('should classify private IPs (10.x.x.x)', () => {
    expect(classifyIP('10.0.0.1')).toBe('private');
    expect(classifyIP('10.255.255.255')).toBe('private');
  });

  it('should classify private IPs (172.16-31.x.x)', () => {
    expect(classifyIP('172.16.0.1')).toBe('private');
    expect(classifyIP('172.31.255.255')).toBe('private');
    // 172.15 and 172.32 are NOT private
    expect(classifyIP('172.15.0.1')).toBe('public');
    expect(classifyIP('172.32.0.1')).toBe('public');
  });

  it('should classify private IPs (192.168.x.x)', () => {
    expect(classifyIP('192.168.1.1')).toBe('private');
    expect(classifyIP('192.168.0.1')).toBe('private');
    expect(classifyIP('192.168.255.255')).toBe('private');
  });

  it('should classify public IPs', () => {
    expect(classifyIP('8.8.8.8')).toBe('public');
    expect(classifyIP('1.1.1.1')).toBe('public');
    expect(classifyIP('208.67.222.222')).toBe('public');
  });

  it('should classify loopback IPs (127.x.x.x)', () => {
    expect(classifyIP('127.0.0.1')).toBe('loopback');
    expect(classifyIP('127.255.255.255')).toBe('loopback');
  });

  it('should classify link-local IPs (169.254.x.x)', () => {
    expect(classifyIP('169.254.1.1')).toBe('link-local');
    expect(classifyIP('169.254.255.255')).toBe('link-local');
  });

  it('should classify multicast IPs (224-239.x.x.x)', () => {
    expect(classifyIP('224.0.0.1')).toBe('multicast');
    expect(classifyIP('239.255.255.255')).toBe('multicast');
    // 223 and 240 are NOT multicast
    expect(classifyIP('223.0.0.1')).toBe('public');
  });

  it('should classify special addresses', () => {
    expect(classifyIP('0.0.0.0')).toBe('unspecified');
    expect(classifyIP('255.255.255.255')).toBe('broadcast');
  });

  it('should return null for invalid IPs', () => {
    expect(classifyIP('')).toBe(null);
    expect(classifyIP('invalid')).toBe(null);
    expect(classifyIP('256.1.1.1')).toBe(null);
  });
});

// ============================================================================
// useIPInput Hook Tests
// ============================================================================

describe('useIPInput hook', () => {
  describe('initialization', () => {
    it('should initialize with empty segments', () => {
      const { result } = renderHook(() => useIPInput());

      expect(result.current.segments).toEqual(['', '', '', '']);
      expect(result.current.value).toBe('...');
      expect(result.current.isValid).toBe(false);
    });

    it('should parse initial value into segments', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168.1.1' })
      );

      expect(result.current.segments).toEqual(['192', '168', '1', '1']);
      expect(result.current.isValid).toBe(true);
    });

    it('should handle partial initial value', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168' })
      );

      expect(result.current.segments).toEqual(['192', '168', '', '']);
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate complete valid IPv4', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168.1.1' })
      );

      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should reject invalid octets (>255)', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '256.1.1.1' })
      );

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toContain('Octet 1');
    });

    it('should reject incomplete IPs', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168.1' })
      );

      expect(result.current.isValid).toBe(false);
    });
  });

  describe('IP type classification', () => {
    it('should classify valid IP types', () => {
      const { result: private1 } = renderHook(() =>
        useIPInput({ value: '10.0.0.1' })
      );
      expect(private1.current.ipType).toBe('private');

      const { result: public1 } = renderHook(() =>
        useIPInput({ value: '8.8.8.8' })
      );
      expect(public1.current.ipType).toBe('public');

      const { result: loopback } = renderHook(() =>
        useIPInput({ value: '127.0.0.1' })
      );
      expect(loopback.current.ipType).toBe('loopback');
    });

    it('should return null for invalid IPs', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '256.1.1.1' })
      );
      expect(result.current.ipType).toBe(null);
    });
  });

  describe('setSegment', () => {
    it('should update a specific segment', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168.1.1', onChange })
      );

      act(() => {
        result.current.setSegment(2, '100');
      });

      expect(result.current.segments[2]).toBe('100');
      expect(onChange).toHaveBeenCalledWith('192.168.100.1');
    });
  });

  describe('setValue', () => {
    it('should parse and set full IP', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useIPInput({ onChange })
      );

      act(() => {
        result.current.setValue('10.0.0.1');
      });

      expect(result.current.segments).toEqual(['10', '0', '0', '1']);
      expect(onChange).toHaveBeenCalledWith('10.0.0.1');
    });
  });

  describe('CIDR handling', () => {
    it('should parse CIDR prefix from value', () => {
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168.1.0/24', allowCIDR: true })
      );

      expect(result.current.cidrPrefix).toBe('24');
      expect(result.current.value).toBe('192.168.1.0/24');
    });

    it('should update CIDR prefix', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useIPInput({ value: '192.168.1.0', allowCIDR: true, onChange })
      );

      act(() => {
        result.current.setCidrPrefix('16');
      });

      expect(result.current.cidrPrefix).toBe('16');
      expect(onChange).toHaveBeenCalledWith('192.168.1.0/16');
    });
  });
});

// ============================================================================
// Desktop Presenter Tests
// ============================================================================

describe('IPInputDesktop', () => {
  it('should render 4 segment inputs for IPv4', () => {
    render(<IPInputDesktop />);

    const inputs = screen.getAllByRole('textbox');
    // 4 segment inputs (hidden input for form doesn't have role textbox)
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });

  it('should display dot separators between segments', () => {
    render(<IPInputDesktop />);

    // Check for 3 dot separators (between 4 segments)
    const separators = screen.getAllByText('.');
    expect(separators.length).toBe(3);
  });

  it('should show validation checkmark for valid IP', () => {
    render(<IPInputDesktop value="192.168.1.1" />);

    // Should show success indicator
    const checkmark = document.querySelector('.text-success');
    expect(checkmark).toBeInTheDocument();
  });

  it('should show IP type badge when showType is enabled', () => {
    render(<IPInputDesktop value="192.168.1.1" showType />);

    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should show error styling for invalid input', () => {
    render(<IPInputDesktop value="256.1.1.1" />);

    // Error indicator should be present
    const errorIcon = document.querySelector('.text-destructive');
    expect(errorIcon).toBeInTheDocument();
  });

  it('should handle disabled state', () => {
    render(<IPInputDesktop disabled />);

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('should have correct ARIA labels', () => {
    render(<IPInputDesktop />);

    expect(screen.getByLabelText(/IP address octet 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IP address octet 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IP address octet 3 of 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IP address octet 4 of 4/i)).toBeInTheDocument();
  });

  it('should render CIDR input when allowCIDR is enabled', () => {
    render(<IPInputDesktop allowCIDR />);

    expect(screen.getByLabelText(/CIDR prefix length/i)).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });
});

// ============================================================================
// Mobile Presenter Tests
// ============================================================================

describe('IPInputMobile', () => {
  it('should render a single input', () => {
    render(<IPInputMobile />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(1);
  });

  it('should have 44px minimum height for touch targets', () => {
    render(<IPInputMobile />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('min-h-[44px]');
  });

  it('should use decimal inputMode', () => {
    render(<IPInputMobile />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('inputMode', 'decimal');
  });

  it('should show IP type badge when showType is enabled', () => {
    render(<IPInputMobile value="192.168.1.1" showType />);

    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should show validation checkmark for valid IP', () => {
    render(<IPInputMobile value="8.8.8.8" />);

    const checkmark = document.querySelector('.text-success');
    expect(checkmark).toBeInTheDocument();
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('IPInput interactions', () => {
  it('should call onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<IPInputDesktop onChange={onChange} />);

    const firstInput = screen.getByLabelText(/IP address octet 1 of 4/i);
    await user.type(firstInput, '192');

    expect(onChange).toHaveBeenCalled();
  });

  it('should handle paste of full IP', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<IPInputDesktop onChange={onChange} />);

    const firstInput = screen.getByLabelText(/IP address octet 1 of 4/i);

    // Simulate paste
    await user.click(firstInput);
    fireEvent.paste(firstInput, {
      clipboardData: { getData: () => '10.20.30.40' },
    });

    // Wait for state update
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('10.20.30.40');
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('IPInput accessibility', () => {
  it('should have no axe violations for desktop presenter', async () => {
    const { container } = render(
      <IPInputDesktop value="192.168.1.1" showType />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no axe violations for mobile presenter', async () => {
    const { container } = render(
      <IPInputMobile value="192.168.1.1" showType />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have aria-invalid when there is an error', () => {
    render(<IPInputDesktop error="Invalid IP" />);

    const input = screen.getByLabelText(/IP address octet 1 of 4/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have role="alert" for error messages', () => {
    render(<IPInputDesktop error="Invalid IP address" />);

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid IP address');
  });
});

// ============================================================================
// Platform Switching Tests
// ============================================================================

describe('IPInput platform switching', () => {
  // Mock usePlatform hook
  vi.mock('@nasnet/ui/layouts', () => ({
    usePlatform: vi.fn().mockReturnValue('desktop'),
  }));

  it('should render desktop presenter on desktop', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('desktop');

    render(<IPInput value="192.168.1.1" />);

    // Desktop has 4 segment inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });

  it('should render mobile presenter on mobile', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('mobile');

    render(<IPInput value="192.168.1.1" />);

    // Mobile has single input
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(1);
  });
});
