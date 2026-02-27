/**
 * IP Address Input Component Types
 *
 * TypeScript interfaces for the IP address input component following
 * the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

import type { RefObject } from 'react';

/**
 * IP type classification based on RFC 1918 and other standards.
 */
export type IPType =
  | 'private'
  | 'public'
  | 'loopback'
  | 'link-local'
  | 'multicast'
  | 'broadcast'
  | 'unspecified';

/**
 * IP version for input mode.
 */
export type IPVersion = 'v4' | 'v6' | 'both';

/**
 * Props for the main IPInput component (auto-detecting wrapper).
 */
export interface IPInputProps {
  /** Current IP address value */
  value?: string;
  /** Called when the IP address value changes */
  onChange?: (value: string) => void;
  /** IP version to accept: 'v4' (default), 'v6', or 'both' for auto-detection */
  version?: IPVersion;
  /** Show IP type classification badge (Private, Public, Loopback, etc.) */
  showType?: boolean;
  /** Allow CIDR notation (e.g., 192.168.1.0/24) */
  allowCIDR?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** External error message to display */
  error?: string;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Form field name */
  name?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Called when the input loses focus */
  onBlur?: () => void;
  /** Called when the input gains focus */
  onFocus?: () => void;
  /** ID for the input element (accessibility) */
  id?: string;
  /** Aria-describedby for linking to help text */
  'aria-describedby'?: string;
}

/**
 * Configuration options for the useIPInput hook.
 */
export interface UseIPInputConfig {
  /** Initial or controlled IP address value */
  value?: string;
  /** Called when the IP address value changes */
  onChange?: (value: string) => void;
  /** IP version: 'v4' (default), 'v6', or 'both' for auto-detection */
  version?: IPVersion;
  /** Allow CIDR notation */
  allowCIDR?: boolean;
}

/**
 * Return value from the useIPInput hook.
 * Contains all state and handlers needed by presenters.
 */
export interface UseIPInputReturn {
  /** The complete IP address string */
  value: string;
  /** Individual segment values (4 for IPv4, 8 for IPv6) */
  segments: string[];
  /** Whether the current value is a valid IP */
  isValid: boolean;
  /** Validation error message, if any */
  error: string | null;
  /** IP type classification, if valid */
  ipType: IPType | null;
  /** CIDR prefix length, if allowCIDR and present */
  cidrPrefix: string;
  /** Detected IP version based on input */
  detectedVersion: 'v4' | 'v6' | null;
  /** Refs for each segment input (for focus management) */
  segmentRefs: RefObject<HTMLInputElement | null>[];
  /** Ref for the CIDR prefix input */
  cidrRef: RefObject<HTMLInputElement | null>;
  /** Update a specific segment's value */
  setSegment: (index: number, value: string) => void;
  /** Update the CIDR prefix value */
  setCidrPrefix: (value: string) => void;
  /** Set the complete IP value (parses into segments) */
  setValue: (value: string) => void;
  /** Handle paste event (parses IP from clipboard) */
  handlePaste: (text: string, segmentIndex?: number) => void;
  /** Handle keydown events for navigation */
  handleKeyDown: (index: number, event: React.KeyboardEvent) => void;
  /** Handle keydown for CIDR input */
  handleCidrKeyDown: (event: React.KeyboardEvent) => void;
  /** Focus a specific segment */
  focusSegment: (index: number) => void;
  /** Focus the CIDR input */
  focusCidr: () => void;
  /** Handle input change with auto-advance logic */
  handleSegmentChange: (index: number, value: string, cursorPosition?: number) => void;
  /** Get the number of segments based on version */
  segmentCount: number;
  /** The separator character ('.' for v4, ':' for v6) */
  separator: string;
  /** Max chars per segment (3 for v4, 4 for v6) */
  maxSegmentLength: number;
}

/**
 * Props for desktop presenter (extends IPInputProps).
 */
export interface IPInputDesktopProps extends IPInputProps {
  /** Optional override for hook config */
  hookConfig?: UseIPInputConfig;
}

/**
 * Props for mobile presenter (extends IPInputProps).
 */
export interface IPInputMobileProps extends IPInputProps {
  /** Optional override for hook config */
  hookConfig?: UseIPInputConfig;
}
