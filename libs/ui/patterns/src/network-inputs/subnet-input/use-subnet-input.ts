/**
 * useSubnetInput Hook
 * Headless hook for subnet/CIDR input logic
 *
 * Implements all validation, parsing, and calculation logic
 * following the Headless + Platform Presenter pattern (ADR-018).
 *
 * @example
 * ```tsx
 * const state = useSubnetInput({
 *   value: '192.168.1.0/24',
 *   onChange: (cidr) => console.log(cidr),
 *   checkOverlap: (cidr) => checkSubnetConflicts(cidr),
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';

import { isValidIPv4, isValidSubnet, getSubnetInfo, getPrefixMask } from '@nasnet/core/utils';

import type {
  SubnetInputProps,
  UseSubnetInputReturn,
  SubnetInfo,
  OverlapResult,
  PrefixOption,
} from './subnet-input.types';

/**
 * Common CIDR prefix options for the selector
 * Ordered by most commonly used in networking
 */
export const COMMON_PREFIX_OPTIONS: PrefixOption[] = [
  { prefix: 8, mask: '255.0.0.0', hosts: 16777214, description: 'Class A network' },
  { prefix: 16, mask: '255.255.0.0', hosts: 65534, description: 'Class B network' },
  { prefix: 22, mask: '255.255.252.0', hosts: 1022, description: 'Medium office' },
  { prefix: 24, mask: '255.255.255.0', hosts: 254, description: 'Small network' },
  { prefix: 28, mask: '255.255.255.240', hosts: 14, description: 'Small segment' },
  { prefix: 30, mask: '255.255.255.252', hosts: 2, description: 'Point-to-point' },
  { prefix: 32, mask: '255.255.255.255', hosts: 1, description: 'Host route' },
];

/**
 * Default prefix for new subnets
 */
const DEFAULT_PREFIX = 24;

/**
 * Parse CIDR notation into IP and prefix parts
 */
function parseCIDRParts(cidr: string): { ip: string; prefix: number } | null {
  if (!cidr || !cidr.includes('/')) {
    return null;
  }

  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    return null;
  }

  return { ip: ip || '', prefix };
}

/**
 * Validate IP address input (allows partial input for better UX)
 */
function validateIPInput(ip: string): string | null {
  if (!ip) {
    return 'IP address is required';
  }

  // Allow partial input while typing
  const parts = ip.split('.');
  if (parts.length > 4) {
    return 'Invalid IP format';
  }

  for (const part of parts) {
    if (part === '') continue; // Allow empty parts while typing
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) {
      return 'Each octet must be 0-255';
    }
  }

  // Full validation only when all 4 octets present
  if (parts.length === 4 && parts.every((p) => p !== '')) {
    if (!isValidIPv4(ip)) {
      return 'Invalid IPv4 address';
    }
  }

  return null;
}

/**
 * Calculate subnet info with mask included
 */
function calculateSubnetInfo(cidr: string): SubnetInfo | null {
  const info = getSubnetInfo(cidr);
  if (!info) return null;

  return {
    ...info,
    mask: getPrefixMask(info.prefix),
  };
}

/**
 * Headless hook for subnet/CIDR input
 *
 * Handles:
 * - CIDR parsing and validation
 * - Subnet calculations (network, broadcast, host range)
 * - Overlap detection via callback
 * - Controlled/uncontrolled modes
 *
 * @param props - SubnetInput props
 * @returns Hook state and methods
 */
export function useSubnetInput(
  props: Pick<SubnetInputProps, 'value' | 'onChange' | 'checkOverlap' | 'error'>
): UseSubnetInputReturn {
  const { value: controlledValue, onChange, checkOverlap, error: externalError } = props;

  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');

  // Determine if controlled or uncontrolled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  // Parse current value into parts
  const parsedParts = useMemo(() => parseCIDRParts(value), [value]);
  const ipPart = parsedParts?.ip ?? '';
  const prefixPart = parsedParts?.prefix ?? DEFAULT_PREFIX;

  // Validate IP portion
  const ipError = useMemo(() => {
    if (!ipPart) return null;
    return validateIPInput(ipPart);
  }, [ipPart]);

  // Calculate subnet info if valid
  const networkInfo = useMemo(() => {
    if (!value || !isValidSubnet(value)) {
      return null;
    }
    return calculateSubnetInfo(value);
  }, [value]);

  // Check for overlaps
  const overlap = useMemo<OverlapResult | null>(() => {
    if (!checkOverlap || !networkInfo || !value) {
      return null;
    }
    return checkOverlap(value);
  }, [checkOverlap, networkInfo, value]);

  // Determine overall validity
  const isValid = useMemo(() => {
    return !!networkInfo && !ipError && !externalError;
  }, [networkInfo, ipError, externalError]);

  // Determine error message
  const error = useMemo(() => {
    if (externalError) return externalError;
    if (ipError && ipPart.split('.').length === 4) return ipError;
    if (value && !networkInfo && ipPart.split('.').length === 4) {
      return 'Invalid CIDR notation';
    }
    return null;
  }, [externalError, ipError, ipPart, value, networkInfo]);

  // Update value helper
  const updateValue = useCallback(
    (newValue: string) => {
      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
        onChange?.(newValue);
      }
    },
    [isControlled, onChange]
  );

  // Set IP address portion
  const setIP = useCallback(
    (ip: string) => {
      // Sanitize input - only allow digits and dots
      const sanitized = ip.replace(/[^0-9.]/g, '');
      const newValue = `${sanitized}/${prefixPart}`;
      updateValue(newValue);
    },
    [prefixPart, updateValue]
  );

  // Set prefix length
  const setPrefix = useCallback(
    (prefix: number) => {
      const clampedPrefix = Math.max(0, Math.min(32, prefix));
      const newValue = `${ipPart}/${clampedPrefix}`;
      updateValue(newValue);
    },
    [ipPart, updateValue]
  );

  // Set full CIDR value
  const setValue = useCallback(
    (cidr: string) => {
      updateValue(cidr);
    },
    [updateValue]
  );

  // Clear input
  const clear = useCallback(() => {
    updateValue('');
  }, [updateValue]);

  return {
    value,
    ipPart,
    prefixPart,
    isValid,
    error,
    networkInfo,
    overlap,
    setIP,
    setPrefix,
    setValue,
    clear,
    prefixOptions: COMMON_PREFIX_OPTIONS,
  };
}
