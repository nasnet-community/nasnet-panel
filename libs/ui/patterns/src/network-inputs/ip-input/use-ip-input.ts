/**
 * useIPInput Hook - Headless IP Address Input Logic
 *
 * Contains all business logic for the IP address input component:
 * - Segment state management (4 for IPv4, 8 for IPv6)
 * - Validation using Zod schemas
 * - Auto-advance on '.' or 3 digits
 * - Paste handling with IP extraction
 * - Keyboard navigation (Tab, Arrow, Backspace, Home, End)
 * - IP type classification
 * - CIDR suffix handling
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import type { UseIPInputConfig, UseIPInputReturn, IPType } from './ip-input.types';

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates if a string is a valid IPv4 octet (0-255, no leading zeros).
 */
export function isValidOctet(value: string): boolean {
  if (value === '') return true; // Empty is valid (incomplete)
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || num > 255) return false;
  // No leading zeros (except "0" itself)
  return value === String(num);
}

/**
 * Validates if a string is a valid IPv4 address.
 */
export function isValidIPv4(ip: string): boolean {
  if (!ip || ip.trim() === '') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
  });
}

/**
 * Validates if a string is a valid IPv6 address.
 * Simplified validation - accepts standard format.
 */
export function isValidIPv6(ip: string): boolean {
  if (!ip || ip.trim() === '') return false;
  // Basic IPv6 pattern - 8 groups of 1-4 hex chars separated by colons
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  // Also accept compressed form with ::
  const ipv6CompressedPattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Pattern.test(ip) || ipv6CompressedPattern.test(ip);
}

/**
 * Validates if a CIDR prefix is valid for the given IP version.
 */
export function isValidCIDRPrefix(prefix: string, version: 'v4' | 'v6'): boolean {
  if (prefix === '') return true;
  const num = parseInt(prefix, 10);
  if (isNaN(num)) return false;
  const maxPrefix = version === 'v4' ? 32 : 128;
  return num >= 0 && num <= maxPrefix && prefix === String(num);
}

// ============================================================================
// IP Type Classification
// ============================================================================

/**
 * Classifies an IPv4 address into its type.
 *
 * @param ip - The IPv4 address to classify
 * @returns The IP type or null if invalid
 */
export function classifyIP(ip: string): IPType | null {
  if (!isValidIPv4(ip)) return null;

  const octets = ip.split('.').map(Number);
  const [first, second] = octets;

  // Special addresses
  if (ip === '0.0.0.0') return 'unspecified';
  if (ip === '255.255.255.255') return 'broadcast';

  // Loopback: 127.0.0.0/8
  if (first === 127) return 'loopback';

  // Private ranges (RFC 1918)
  if (first === 10) return 'private';
  if (first === 172 && second >= 16 && second <= 31) return 'private';
  if (first === 192 && second === 168) return 'private';

  // Link-local: 169.254.0.0/16
  if (first === 169 && second === 254) return 'link-local';

  // Multicast: 224.0.0.0/4 (224-239)
  if (first >= 224 && first <= 239) return 'multicast';

  return 'public';
}

/**
 * Gets a human-readable label for an IP type.
 */
export function getIPTypeLabel(type: IPType): string {
  const labels: Record<IPType, string> = {
    private: 'Private',
    public: 'Public',
    loopback: 'Loopback',
    'link-local': 'Link-local',
    multicast: 'Multicast',
    broadcast: 'Broadcast',
    unspecified: 'Unspecified',
  };
  return labels[type];
}

// ============================================================================
// IP Parsing Utilities
// ============================================================================

/**
 * Extracts an IPv4 address from a string (handles pasted text).
 */
function extractIPv4FromText(text: string): string | null {
  // Match IPv4 pattern, optionally with CIDR
  const match = text.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\/(\d{1,3}))?/);
  return match ? match[0] : null;
}

/**
 * Parses an IPv4 address string into segments.
 */
function parseIPv4ToSegments(ip: string): string[] {
  if (!ip) return ['', '', '', ''];
  const parts = ip.split('/')[0].split('.');
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    segments.push(parts[i] || '');
  }
  return segments;
}

/**
 * Parses an IPv6 address string into segments.
 */
function parseIPv6ToSegments(ip: string): string[] {
  if (!ip) return Array(8).fill('');
  const parts = ip.split('/')[0].split(':');
  const segments: string[] = [];
  for (let i = 0; i < 8; i++) {
    segments.push(parts[i] || '');
  }
  return segments;
}

/**
 * Extracts CIDR prefix from an IP string.
 */
function extractCIDRPrefix(ip: string): string {
  const match = ip.match(/\/(\d+)$/);
  return match ? match[1] : '';
}

// ============================================================================
// useIPInput Hook
// ============================================================================

/**
 * Headless hook for IP address input logic.
 *
 * @param config - Configuration options
 * @returns State and handlers for IP input component
 */
export function useIPInput(config: UseIPInputConfig = {}): UseIPInputReturn {
  const { value: controlledValue, onChange, version = 'v4', allowCIDR = false } = config;

  // Determine segment count based on version
  const isIPv6 = version === 'v6';
  const segmentCount = isIPv6 ? 8 : 4;
  const separator = isIPv6 ? ':' : '.';
  const maxSegmentLength = isIPv6 ? 4 : 3;

  // Create refs for segment inputs (max 8 for IPv6)
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const ref5 = useRef<HTMLInputElement>(null);
  const ref6 = useRef<HTMLInputElement>(null);
  const ref7 = useRef<HTMLInputElement>(null);
  const cidrRef = useRef<HTMLInputElement>(null);

  const segmentRefs = useMemo(
    () => [ref0, ref1, ref2, ref3, ref4, ref5, ref6, ref7].slice(0, segmentCount),
    [segmentCount]
  );

  // Parse initial value into segments
  const initialSegments = useMemo(() => {
    if (!controlledValue) {
      return isIPv6 ? Array(8).fill('') : ['', '', '', ''];
    }
    return isIPv6 ? parseIPv6ToSegments(controlledValue) : parseIPv4ToSegments(controlledValue);
  }, [controlledValue, isIPv6]);

  const initialCIDR = useMemo(() => {
    if (!controlledValue || !allowCIDR) return '';
    return extractCIDRPrefix(controlledValue);
  }, [controlledValue, allowCIDR]);

  // State
  const [segments, setSegments] = useState<string[]>(initialSegments);
  const [cidrPrefix, setCidrPrefixState] = useState<string>(initialCIDR);

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      const newSegments =
        isIPv6 ? parseIPv6ToSegments(controlledValue) : parseIPv4ToSegments(controlledValue);
      setSegments(newSegments);
      if (allowCIDR) {
        setCidrPrefixState(extractCIDRPrefix(controlledValue));
      }
    }
  }, [controlledValue, isIPv6, allowCIDR]);

  // Computed values
  const value = useMemo(() => {
    const ipPart = segments.join(separator);
    if (allowCIDR && cidrPrefix) {
      return `${ipPart}/${cidrPrefix}`;
    }
    return ipPart;
  }, [segments, separator, allowCIDR, cidrPrefix]);

  const isValid = useMemo(() => {
    // Check if all segments are filled and valid
    const allFilled = segments.every((s) => s !== '');
    if (!allFilled) return false;

    const ipPart = segments.join(separator);
    const ipValid = isIPv6 ? isValidIPv6(ipPart) : isValidIPv4(ipPart);

    if (!ipValid) return false;

    // Check CIDR if present
    if (allowCIDR && cidrPrefix) {
      return isValidCIDRPrefix(cidrPrefix, isIPv6 ? 'v6' : 'v4');
    }

    return true;
  }, [segments, separator, isIPv6, allowCIDR, cidrPrefix]);

  const error = useMemo(() => {
    // Only show error if user has entered something
    const hasInput = segments.some((s) => s !== '');
    if (!hasInput) return null;

    // Check for invalid octets
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg !== '') {
        if (isIPv6) {
          // IPv6: hex validation
          if (!/^[0-9a-fA-F]{0,4}$/.test(seg)) {
            return `Segment ${i + 1} must be a valid hex value (0-FFFF)`;
          }
        } else {
          // IPv4: octet validation
          if (!isValidOctet(seg)) {
            const num = parseInt(seg, 10);
            if (num > 255) {
              return `Octet ${i + 1} must be between 0 and 255`;
            }
            return `Octet ${i + 1} is invalid`;
          }
        }
      }
    }

    // Check CIDR
    if (allowCIDR && cidrPrefix) {
      const maxPrefix = isIPv6 ? 128 : 32;
      const num = parseInt(cidrPrefix, 10);
      if (isNaN(num) || num < 0 || num > maxPrefix) {
        return `CIDR prefix must be between 0 and ${maxPrefix}`;
      }
    }

    return null;
  }, [segments, isIPv6, allowCIDR, cidrPrefix]);

  const ipType = useMemo(() => {
    if (!isValid || isIPv6) return null;
    const ipPart = segments.join('.');
    return classifyIP(ipPart);
  }, [isValid, isIPv6, segments]);

  const detectedVersion = useMemo((): 'v4' | 'v6' | null => {
    if (version !== 'both') return version === 'v6' ? 'v6' : 'v4';
    // Auto-detect based on content
    const hasColons = segments.some((s) => s.includes(':'));
    if (hasColons) return 'v6';
    return 'v4';
  }, [version, segments]);

  // Handlers
  const notifyChange = useCallback(
    (newSegments: string[], newCidr?: string) => {
      if (!onChange) return;
      const ipPart = newSegments.join(separator);
      const prefix = newCidr ?? cidrPrefix;
      if (allowCIDR && prefix) {
        onChange(`${ipPart}/${prefix}`);
      } else {
        onChange(ipPart);
      }
    },
    [onChange, separator, allowCIDR, cidrPrefix]
  );

  const setSegment = useCallback(
    (index: number, value: string) => {
      setSegments((prev) => {
        const newSegments = [...prev];
        newSegments[index] = value;
        notifyChange(newSegments);
        return newSegments;
      });
    },
    [notifyChange]
  );

  const setCidrPrefix = useCallback(
    (value: string) => {
      // Only allow digits
      const cleaned = value.replace(/[^0-9]/g, '');
      setCidrPrefixState(cleaned);
      notifyChange(segments, cleaned);
    },
    [segments, notifyChange]
  );

  const setValue = useCallback(
    (newValue: string) => {
      const newSegments = isIPv6 ? parseIPv6ToSegments(newValue) : parseIPv4ToSegments(newValue);
      setSegments(newSegments);
      if (allowCIDR) {
        const newCidr = extractCIDRPrefix(newValue);
        setCidrPrefixState(newCidr);
        notifyChange(newSegments, newCidr);
      } else {
        notifyChange(newSegments);
      }
    },
    [isIPv6, allowCIDR, notifyChange]
  );

  const focusSegment = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, segmentCount - 1));
      segmentRefs[clampedIndex]?.current?.focus();
    },
    [segmentRefs, segmentCount]
  );

  const focusCidr = useCallback(() => {
    cidrRef.current?.focus();
  }, []);

  const handlePaste = useCallback(
    (text: string, segmentIndex?: number) => {
      // Try to extract IP from pasted text
      const extracted = extractIPv4FromText(text);
      if (extracted) {
        setValue(extracted);
        // Focus last segment or CIDR if present
        if (allowCIDR && extracted.includes('/')) {
          focusCidr();
        } else {
          focusSegment(segmentCount - 1);
        }
      } else if (segmentIndex !== undefined) {
        // If not a full IP, just set the current segment
        const cleaned = text.replace(/[^0-9]/g, '').slice(0, maxSegmentLength);
        setSegment(segmentIndex, cleaned);
      }
    },
    [setValue, setSegment, focusSegment, focusCidr, allowCIDR, segmentCount, maxSegmentLength]
  );

  const handleSegmentChange = useCallback(
    (index: number, newValue: string, _cursorPosition?: number) => {
      // Clean input - only allow digits for IPv4, hex for IPv6
      const cleaned =
        isIPv6 ?
          newValue.replace(/[^0-9a-fA-F]/g, '').slice(0, maxSegmentLength)
        : newValue.replace(/[^0-9]/g, '').slice(0, maxSegmentLength);

      // Check for separator input (auto-advance)
      if (newValue.includes(separator) || newValue.includes('.')) {
        // User typed a separator - advance to next segment
        const beforeSeparator = newValue.split(/[.:]/)[0];
        const cleanedBefore =
          isIPv6 ?
            beforeSeparator.replace(/[^0-9a-fA-F]/g, '').slice(0, maxSegmentLength)
          : beforeSeparator.replace(/[^0-9]/g, '').slice(0, maxSegmentLength);

        setSegment(index, cleanedBefore);
        if (index < segmentCount - 1) {
          focusSegment(index + 1);
        } else if (allowCIDR) {
          focusCidr();
        }
        return;
      }

      // Set the segment value
      setSegment(index, cleaned);

      // Auto-advance when segment is full
      if (cleaned.length === maxSegmentLength && index < segmentCount - 1) {
        // For IPv4, also check if value is valid (>= 26 means next char would make > 255)
        if (!isIPv6) {
          const num = parseInt(cleaned, 10);
          // Advance if it's at max length
          if (cleaned.length === 3 || num > 25) {
            focusSegment(index + 1);
          }
        } else {
          focusSegment(index + 1);
        }
      }
    },
    [
      isIPv6,
      maxSegmentLength,
      separator,
      setSegment,
      segmentCount,
      focusSegment,
      allowCIDR,
      focusCidr,
    ]
  );

  const handleKeyDown = useCallback(
    (index: number, event: React.KeyboardEvent) => {
      const input = event.currentTarget as HTMLInputElement;
      const { selectionStart, value: inputValue } = input;

      switch (event.key) {
        case 'ArrowLeft':
          // Move to previous segment if at start
          if (selectionStart === 0 && index > 0) {
            event.preventDefault();
            focusSegment(index - 1);
            // Move cursor to end of previous segment
            setTimeout(() => {
              const prevInput = segmentRefs[index - 1]?.current;
              if (prevInput) {
                prevInput.selectionStart = prevInput.value.length;
                prevInput.selectionEnd = prevInput.value.length;
              }
            }, 0);
          }
          break;

        case 'ArrowRight':
          // Move to next segment if at end
          if (selectionStart === inputValue.length) {
            if (index < segmentCount - 1) {
              event.preventDefault();
              focusSegment(index + 1);
              // Move cursor to start of next segment
              setTimeout(() => {
                const nextInput = segmentRefs[index + 1]?.current;
                if (nextInput) {
                  nextInput.selectionStart = 0;
                  nextInput.selectionEnd = 0;
                }
              }, 0);
            } else if (allowCIDR) {
              event.preventDefault();
              focusCidr();
            }
          }
          break;

        case 'Backspace':
          // Move to previous segment if at start and empty
          if (selectionStart === 0 && inputValue.length === 0 && index > 0) {
            event.preventDefault();
            focusSegment(index - 1);
          }
          break;

        case 'Home':
          // Move to first segment
          event.preventDefault();
          focusSegment(0);
          break;

        case 'End':
          // Move to last segment or CIDR
          event.preventDefault();
          if (allowCIDR) {
            focusCidr();
          } else {
            focusSegment(segmentCount - 1);
          }
          break;

        case '.':
        case ':':
          // Handled in handleSegmentChange via value
          break;

        case '/':
          // Move to CIDR if allowed
          if (allowCIDR) {
            event.preventDefault();
            focusCidr();
          }
          break;

        case 'Tab':
          // Let default tab behavior work, but if shift+tab from first segment, let it go
          break;

        default:
          break;
      }
    },
    [focusSegment, segmentRefs, segmentCount, allowCIDR, focusCidr]
  );

  const handleCidrKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const input = event.currentTarget as HTMLInputElement;
      const { selectionStart, value: inputValue } = input;

      switch (event.key) {
        case 'ArrowLeft':
        case 'Backspace':
          // Move to last segment if at start
          if (selectionStart === 0 && inputValue.length === 0) {
            event.preventDefault();
            focusSegment(segmentCount - 1);
          }
          break;

        case 'Home':
          event.preventDefault();
          focusSegment(0);
          break;

        default:
          break;
      }
    },
    [focusSegment, segmentCount]
  );

  return {
    value,
    segments,
    isValid,
    error,
    ipType,
    cidrPrefix,
    detectedVersion,
    segmentRefs,
    cidrRef,
    setSegment,
    setCidrPrefix,
    setValue,
    handlePaste,
    handleKeyDown,
    handleCidrKeyDown,
    focusSegment,
    focusCidr,
    handleSegmentChange,
    segmentCount,
    separator,
    maxSegmentLength,
  };
}
