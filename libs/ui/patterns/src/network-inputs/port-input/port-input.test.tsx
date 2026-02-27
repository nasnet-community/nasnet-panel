/**
 * Port Input Component Tests
 *
 * Comprehensive tests for the PortInput component including:
 * - Validation utilities
 * - Headless hook logic
 * - Component interaction
 * - Accessibility
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */

import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { PortInput } from './port-input';
import { PortInputDesktop } from './port-input-desktop';
import { PortInputMobile } from './port-input-mobile';
import {
  isValidPort,
  parseSinglePort,
  parsePortRange,
  parseMultiPorts,
  getPortValidationError,
  formatPortDisplay,
  usePortInput,
} from './use-port-input';

// Note: vitest-axe matchers are extended in setup.ts

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// ============================================================================
// Validation Utility Tests
// ============================================================================

describe('Port Validation Utilities', () => {
  describe('isValidPort', () => {
    it('should return true for valid ports', () => {
      expect(isValidPort(1)).toBe(true);
      expect(isValidPort(80)).toBe(true);
      expect(isValidPort(443)).toBe(true);
      expect(isValidPort(8080)).toBe(true);
      expect(isValidPort(65535)).toBe(true);
    });

    it('should return false for invalid ports', () => {
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort(100000)).toBe(false);
    });

    it('should return false for non-integer values', () => {
      expect(isValidPort(80.5)).toBe(false);
      expect(isValidPort(NaN)).toBe(false);
    });

    it('should respect custom min/max bounds', () => {
      expect(isValidPort(100, 100, 200)).toBe(true);
      expect(isValidPort(99, 100, 200)).toBe(false);
      expect(isValidPort(201, 100, 200)).toBe(false);
    });
  });

  describe('parseSinglePort', () => {
    it('should parse valid port strings', () => {
      expect(parseSinglePort('80')).toBe(80);
      expect(parseSinglePort('443')).toBe(443);
      expect(parseSinglePort('8080')).toBe(8080);
      expect(parseSinglePort('1')).toBe(1);
      expect(parseSinglePort('65535')).toBe(65535);
    });

    it('should return null for invalid inputs', () => {
      expect(parseSinglePort('')).toBeNull();
      expect(parseSinglePort('0')).toBeNull();
      expect(parseSinglePort('-1')).toBeNull();
      expect(parseSinglePort('65536')).toBeNull();
      expect(parseSinglePort('abc')).toBeNull();
      expect(parseSinglePort('80.5')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(parseSinglePort('  80  ')).toBe(80);
      expect(parseSinglePort(' 443 ')).toBe(443);
    });

    it('should reject leading zeros as invalid', () => {
      expect(parseSinglePort('0080')).toBeNull();
      expect(parseSinglePort('00443')).toBeNull();
    });
  });

  describe('parsePortRange', () => {
    it('should parse valid port ranges', () => {
      expect(parsePortRange('8080-8090')).toEqual({ start: 8080, end: 8090 });
      expect(parsePortRange('1-65535')).toEqual({ start: 1, end: 65535 });
      expect(parsePortRange('80-80')).toEqual({ start: 80, end: 80 });
    });

    it('should parse single port as range', () => {
      expect(parsePortRange('80')).toEqual({ start: 80, end: 80 });
      expect(parsePortRange('443')).toEqual({ start: 443, end: 443 });
    });

    it('should return null for invalid ranges', () => {
      expect(parsePortRange('9000-8000')).toBeNull(); // start > end
      expect(parsePortRange('abc-def')).toBeNull();
      expect(parsePortRange('0-100')).toBeNull(); // start invalid
      expect(parsePortRange('80-70000')).toBeNull(); // end invalid
      expect(parsePortRange('80-90-100')).toBeNull(); // too many parts
    });

    it('should handle whitespace', () => {
      expect(parsePortRange(' 80 - 90 ')).toEqual({ start: 80, end: 90 });
    });
  });

  describe('parseMultiPorts', () => {
    it('should parse valid comma-separated ports', () => {
      expect(parseMultiPorts('80,443,8080')).toEqual([80, 443, 8080]);
      expect(parseMultiPorts('22')).toEqual([22]);
    });

    it('should deduplicate ports', () => {
      expect(parseMultiPorts('80,80,443,443')).toEqual([80, 443]);
    });

    it('should sort ports', () => {
      expect(parseMultiPorts('8080,443,80')).toEqual([80, 443, 8080]);
    });

    it('should skip invalid ports', () => {
      expect(parseMultiPorts('80,invalid,443')).toEqual([80, 443]);
      expect(parseMultiPorts('80,0,443')).toEqual([80, 443]);
    });

    it('should handle whitespace', () => {
      expect(parseMultiPorts(' 80 , 443 , 8080 ')).toEqual([80, 443, 8080]);
    });

    it('should return empty array for empty input', () => {
      expect(parseMultiPorts('')).toEqual([]);
      expect(parseMultiPorts('   ')).toEqual([]);
    });
  });

  describe('getPortValidationError', () => {
    it('should return null for valid single ports', () => {
      expect(getPortValidationError('80', 'single')).toBeNull();
      expect(getPortValidationError('443', 'single')).toBeNull();
      expect(getPortValidationError('', 'single')).toBeNull(); // empty is valid
    });

    it('should return error for invalid single ports', () => {
      expect(getPortValidationError('0', 'single')).toBe('Port must be >= 1');
      expect(getPortValidationError('65536', 'single')).toBe('Port must be <= 65535');
      expect(getPortValidationError('abc', 'single')).toBe('Port must be a number');
    });

    it('should return null for valid ranges', () => {
      expect(getPortValidationError('80-90', 'range')).toBeNull();
      expect(getPortValidationError('8080-8090', 'range')).toBeNull();
    });

    it('should return error for invalid ranges', () => {
      expect(getPortValidationError('9000-8000', 'range')).toBe('Start port must be <= end port');
    });

    it('should return null for valid multi-port lists', () => {
      expect(getPortValidationError('80,443', 'multi')).toBeNull();
    });

    it('should return error for invalid ports in multi mode', () => {
      expect(getPortValidationError('0,443', 'multi')).toContain('Port 1');
    });
  });

  describe('formatPortDisplay', () => {
    it('should format single port without service', () => {
      expect(formatPortDisplay(80, 'single')).toBe('80');
      expect(formatPortDisplay(12345, 'single')).toBe('12345');
    });

    it('should format single port with service', () => {
      expect(formatPortDisplay(443, 'single', 'HTTPS')).toBe('443 (HTTPS)');
      expect(formatPortDisplay(22, 'single', 'SSH')).toBe('22 (SSH)');
    });

    it('should format port range', () => {
      expect(formatPortDisplay({ start: 8080, end: 8090 }, 'range')).toBe('8080-8090 (11 ports)');
      expect(formatPortDisplay({ start: 80, end: 80 }, 'range')).toBe('80-80 (1 port)');
    });

    it('should format multi-port list', () => {
      expect(formatPortDisplay([80, 443, 8080], 'multi')).toBe('80, 443, 8080 (3 ports)');
      expect(formatPortDisplay([22], 'multi')).toBe('22 (1 port)');
    });

    it('should return empty string for null values', () => {
      expect(formatPortDisplay(null, 'single')).toBe('');
      expect(formatPortDisplay(null, 'range')).toBe('');
      expect(formatPortDisplay([], 'multi')).toBe('');
    });
  });
});

// ============================================================================
// usePortInput Hook Tests
// ============================================================================

describe('usePortInput Hook', () => {
  describe('Single Mode', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'single' }));

      expect(result.current.port).toBeNull();
      expect(result.current.inputValue).toBe('');
      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should parse valid port input', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'single', value: 443 }));

      expect(result.current.port).toBe(443);
      expect(result.current.isValid).toBe(true);
      expect(result.current.portCount).toBe(1);
    });

    it('should lookup service name for well-known ports', () => {
      const { result } = renderHook(() =>
        usePortInput({ mode: 'single', value: 80, showService: true })
      );

      expect(result.current.serviceName).toBe('HTTP');
    });

    it('should return null for unknown ports', () => {
      const { result } = renderHook(() =>
        usePortInput({ mode: 'single', value: 12345, showService: true })
      );

      expect(result.current.serviceName).toBeNull();
    });

    it('should call onChange when value changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => usePortInput({ mode: 'single', onChange }));

      act(() => {
        result.current.handleChange({
          target: { value: '443' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(onChange).toHaveBeenCalledWith(443);
    });

    it('should clear value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => usePortInput({ mode: 'single', value: 80, onChange }));

      act(() => {
        result.current.clear();
      });

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Range Mode', () => {
    it('should parse valid port range', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'range', value: '8080-8090' }));

      expect(result.current.portRange).toEqual({ start: 8080, end: 8090 });
      expect(result.current.portCount).toBe(11);
      expect(result.current.isValid).toBe(true);
    });

    it('should handle range start/end changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => usePortInput({ mode: 'range', onChange }));

      act(() => {
        result.current.handleRangeStartChange('8080');
      });

      expect(onChange).toHaveBeenCalledWith('8080');

      act(() => {
        result.current.handleRangeEndChange('8090');
      });

      expect(onChange).toHaveBeenCalledWith('8080-8090');
    });

    it('should detect invalid range (start > end)', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'range' }));

      act(() => {
        result.current.handleRangeStartChange('9000');
        result.current.handleRangeEndChange('8000');
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe('Start port must be <= end port');
    });
  });

  describe('Multi Mode', () => {
    it('should parse multi-port string', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'multi', value: '80,443,8080' }));

      expect(result.current.ports).toEqual([80, 443, 8080]);
      expect(result.current.portCount).toBe(3);
    });

    it('should add port in multi mode', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => usePortInput({ mode: 'multi', onChange }));

      act(() => {
        result.current.handleAddPort(80);
      });

      expect(onChange).toHaveBeenCalledWith('80');

      act(() => {
        result.current.handleAddPort(443);
      });

      expect(onChange).toHaveBeenCalledWith('80,443');
    });

    it('should not add duplicate ports', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => usePortInput({ mode: 'multi', value: '80', onChange }));

      act(() => {
        result.current.handleAddPort(80);
      });

      // Should not be called since 80 already exists
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should remove port in multi mode', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        usePortInput({ mode: 'multi', value: '80,443', onChange })
      );

      act(() => {
        result.current.handleRemovePort(80);
      });

      expect(onChange).toHaveBeenCalledWith('443');
    });
  });

  describe('Suggestions', () => {
    it('should show suggestions when enabled', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'single', showSuggestions: true }));

      expect(result.current.suggestions.length).toBeGreaterThan(0);
    });

    it('should navigate suggestions with arrow keys', () => {
      const { result } = renderHook(() => usePortInput({ mode: 'single', showSuggestions: true }));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.navigateSuggestion('down');
      });

      expect(result.current.selectedSuggestionIndex).toBe(0);

      act(() => {
        result.current.navigateSuggestion('down');
      });

      expect(result.current.selectedSuggestionIndex).toBe(1);

      act(() => {
        result.current.navigateSuggestion('up');
      });

      expect(result.current.selectedSuggestionIndex).toBe(0);
    });
  });
});

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('PortInput Component', () => {
  describe('Single Mode', () => {
    it('should render with label', () => {
      render(<PortInput label="Port" />);

      expect(screen.getByLabelText('Port')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<PortInput placeholder="Enter port" />);

      expect(screen.getByPlaceholderText('Enter port')).toBeInTheDocument();
    });

    it('should display protocol badge', () => {
      render(<PortInput protocol="tcp" />);

      expect(screen.getByText('tcp')).toBeInTheDocument();
    });

    it('should display service name for well-known ports', () => {
      render(
        <PortInput
          value={443}
          showService
        />
      );

      expect(screen.getByText('HTTPS')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<PortInput error="Invalid port" />);

      expect(screen.getByText('Invalid port')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display help text', () => {
      render(<PortInput helpText="Enter a valid port number" />);

      expect(screen.getByText('Enter a valid port number')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <PortInput
          label="Port"
          disabled
        />
      );

      expect(screen.getByLabelText('Port')).toBeDisabled();
    });
  });

  describe('Range Mode', () => {
    it('should render two inputs for range mode', () => {
      render(
        <PortInput
          mode="range"
          label="Port Range"
        />
      );

      expect(screen.getByLabelText('Start port')).toBeInTheDocument();
      expect(screen.getByLabelText('End port')).toBeInTheDocument();
    });

    it('should display port count for valid range', () => {
      render(
        <PortInput
          mode="range"
          value="8080-8090"
        />
      );

      expect(screen.getByText('11 ports')).toBeInTheDocument();
    });
  });

  describe('Multi Mode', () => {
    it('should render port chips', () => {
      render(
        <PortInput
          mode="multi"
          value="80,443,8080"
        />
      );

      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('443')).toBeInTheDocument();
      expect(screen.getByText('8080')).toBeInTheDocument();
    });

    it('should display port count', () => {
      render(
        <PortInput
          mode="multi"
          value="80,443,8080"
        />
      );

      expect(screen.getByText('3 ports selected')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when typing', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <PortInput
          label="Port"
          onChange={onChange}
        />
      );

      const input = screen.getByLabelText('Port');
      await user.type(input, '443');

      expect(onChange).toHaveBeenCalled();
    });

    it('should only allow numeric input', async () => {
      const user = userEvent.setup();

      render(<PortInput label="Port" />);

      const input = screen.getByLabelText('Port');
      await user.type(input, 'abc');

      expect(input).toHaveValue('');
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('PortInput Accessibility', () => {
  it('should have no accessibility violations (single mode)', async () => {
    const { container } = render(
      <PortInput
        label="Port"
        value={443}
        showService
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations (range mode)', async () => {
    const { container } = render(
      <PortInput
        mode="range"
        label="Port Range"
        value="8080-8090"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations (multi mode)', async () => {
    const { container } = render(
      <PortInput
        mode="multi"
        label="Ports"
        value="80,443"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with error', async () => {
    const { container } = render(
      <PortInput
        label="Port"
        error="Invalid port"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels', () => {
    render(<PortInput label="Port" />);

    expect(screen.getByLabelText('Port')).toBeInTheDocument();
  });

  it('should announce errors via role="alert"', () => {
    render(<PortInput error="Port is required" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Port is required');
  });

  it('should have aria-invalid when there is an error', () => {
    render(
      <PortInput
        label="Port"
        error="Invalid"
      />
    );

    expect(screen.getByLabelText('Port')).toHaveAttribute('aria-invalid', 'true');
  });
});

// ============================================================================
// Platform Presenter Tests
// ============================================================================

describe('Platform Presenters', () => {
  describe('PortInputDesktop', () => {
    it('should render desktop layout', () => {
      render(
        <PortInputDesktop
          label="Port"
          value={443}
          showService
        />
      );

      expect(screen.getByLabelText('Port')).toBeInTheDocument();
      expect(screen.getByText('HTTPS')).toBeInTheDocument();
    });

    it('should render range mode side-by-side', () => {
      render(
        <PortInputDesktop
          mode="range"
          value="8080-8090"
        />
      );

      expect(screen.getByLabelText('Start port')).toBeInTheDocument();
      expect(screen.getByLabelText('End port')).toBeInTheDocument();
    });
  });

  describe('PortInputMobile', () => {
    it('should render mobile layout', () => {
      render(
        <PortInputMobile
          label="Port"
          value={443}
          showService
        />
      );

      expect(screen.getByLabelText('Port')).toBeInTheDocument();
      // Service shown below input on mobile
      expect(screen.getByText(/Service:/)).toBeInTheDocument();
    });

    it('should render add button in multi mode', () => {
      render(<PortInputMobile mode="multi" />);

      expect(screen.getByRole('button', { name: 'Add port' })).toBeInTheDocument();
    });

    it('should have 44px touch targets', () => {
      render(<PortInputMobile label="Port" />);

      const input = screen.getByLabelText('Port');
      expect(input).toHaveClass('h-11'); // 44px = h-11 in Tailwind
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty string value', () => {
    render(<PortInput value="" />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('should handle undefined value', () => {
    render(<PortInput value={undefined} />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('should handle minimum port (1)', () => {
    const { result } = renderHook(() => usePortInput({ mode: 'single', value: 1 }));

    expect(result.current.port).toBe(1);
    expect(result.current.isValid).toBe(true);
  });

  it('should handle maximum port (65535)', () => {
    const { result } = renderHook(() => usePortInput({ mode: 'single', value: 65535 }));

    expect(result.current.port).toBe(65535);
    expect(result.current.isValid).toBe(true);
  });

  it('should handle single-port range (8080-8080)', () => {
    const { result } = renderHook(() => usePortInput({ mode: 'range', value: '8080-8080' }));

    expect(result.current.portRange).toEqual({ start: 8080, end: 8080 });
    expect(result.current.portCount).toBe(1);
  });

  it('should handle leading zeros gracefully', () => {
    const { result } = renderHook(() => usePortInput({ mode: 'single' }));

    act(() => {
      result.current.handleChange({
        target: { value: '0080' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should reject leading zeros
    expect(result.current.port).toBeNull();
  });

  it('should deduplicate ports in multi mode', () => {
    const { result } = renderHook(() => usePortInput({ mode: 'multi', value: '80,80,443,443' }));

    expect(result.current.ports).toEqual([80, 443]);
    expect(result.current.portCount).toBe(2);
  });
});

// ============================================================================
// Service Group Support Tests
// ============================================================================

describe('Service Group Support', () => {
  const mockServiceGroups = [
    {
      id: '1',
      name: 'web',
      description: 'Web services',
      ports: [80, 443, 8080],
      protocol: 'tcp' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'dns',
      description: 'DNS services',
      ports: [53],
      protocol: 'both' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('should include service groups in suggestions', () => {
    const { result } = renderHook(() =>
      usePortInput({
        mode: 'multi',
        protocol: 'tcp',
        showSuggestions: true,
        serviceGroups: mockServiceGroups,
      })
    );

    const groupSuggestions = result.current.suggestions.filter((s) => s.isGroup);
    expect(groupSuggestions.length).toBeGreaterThan(0);
    expect(groupSuggestions[0].service).toContain('web');
    expect(groupSuggestions[0].port).toBe(0); // Special marker
  });

  it('should filter groups by protocol', () => {
    const { result } = renderHook(() =>
      usePortInput({
        mode: 'multi',
        protocol: 'udp',
        showSuggestions: true,
        serviceGroups: mockServiceGroups,
      })
    );

    const groupSuggestions = result.current.suggestions.filter((s) => s.isGroup);
    // Only 'dns' group should appear (protocol: 'both')
    expect(groupSuggestions.length).toBe(1);
    expect(groupSuggestions[0].service).toContain('dns');
  });

  it('should expand service group to port string in multi mode', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePortInput({
        mode: 'multi',
        protocol: 'tcp',
        showSuggestions: true,
        serviceGroups: mockServiceGroups,
        onChange,
      })
    );

    act(() => {
      result.current.handleSelectServiceGroup(mockServiceGroups[0]);
    });

    expect(onChange).toHaveBeenCalledWith('80, 443, 8080');
  });

  it('should warn when selecting group in single mode', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() =>
      usePortInput({
        mode: 'single',
        protocol: 'tcp',
        showSuggestions: true,
        serviceGroups: mockServiceGroups,
      })
    );

    act(() => {
      result.current.handleSelectServiceGroup(mockServiceGroups[0]);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Service groups only supported in multi-mode');
    consoleWarnSpy.mockRestore();
  });

  it('should work without serviceGroups prop (backward compatible)', () => {
    const { result } = renderHook(() =>
      usePortInput({
        mode: 'multi',
        protocol: 'tcp',
        showSuggestions: true,
      })
    );

    const groupSuggestions = result.current.suggestions.filter((s) => s.isGroup);
    expect(groupSuggestions.length).toBe(0);
  });
});
