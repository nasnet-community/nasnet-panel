import { z } from 'zod';

import type { LogEntry } from '../router/logs';

/**
 * Firewall Log Types and Schemas
 *
 * Defines types for firewall log entries with parsed fields from RouterOS firewall logs.
 * Extends the base LogEntry interface with firewall-specific data.
 *
 * Firewall logs contain information about packets matched by firewall rules,
 * including source/destination IPs and ports, protocols, interfaces, and actions taken.
 *
 * @see libs/core/types/src/router/logs.ts - Base LogEntry interface
 */

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * Zod schema for firewall log chain validation
 * Validates that chain is one of: input, forward, or output
 *
 * @see FirewallLogChain - Type inferred from this schema
 *
 * @example
 * const result = FirewallLogChainSchema.parse('forward');
 * // result: 'forward'
 */
export const FirewallLogChainSchema = z.enum([
  'input', // Packets destined for the router itself
  'forward', // Packets passing through the router
  'output', // Packets originating from the router
]);

/**
 * Type for firewall log chain
 * @example
 * const chain: FirewallLogChain = 'forward';
 */
export type FirewallLogChain = z.infer<typeof FirewallLogChainSchema>;

/**
 * Zod schema for inferred firewall action validation
 * Validates that action is one of: accept, drop, reject, or unknown
 *
 * @see InferredAction - Type inferred from this schema
 *
 * @example
 * const result = InferredActionSchema.parse('drop');
 * // result: 'drop'
 */
export const InferredActionSchema = z.enum(['accept', 'drop', 'reject', 'unknown']);

/**
 * Type for inferred firewall action
 * @example
 * const action: InferredAction = 'drop';
 */
export type InferredAction = z.infer<typeof InferredActionSchema>;

/**
 * Zod schema for firewall log protocol validation
 * Validates that protocol is one of: TCP, UDP, ICMP, IPv6-ICMP, GRE, ESP, AH, IGMP, or unknown
 *
 * @see FirewallLogProtocol - Type inferred from this schema
 *
 * @example
 * const result = FirewallLogProtocolSchema.parse('TCP');
 * // result: 'TCP'
 */
export const FirewallLogProtocolSchema = z.enum([
  'TCP',
  'UDP',
  'ICMP',
  'IPv6-ICMP',
  'GRE',
  'ESP',
  'AH',
  'IGMP',
  'unknown',
]);

/**
 * Type for firewall log protocol
 * @example
 * const protocol: FirewallLogProtocol = 'TCP';
 */
export type FirewallLogProtocol = z.infer<typeof FirewallLogProtocolSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * IPv4 address validation (supports CIDR notation)
 * Regex pattern for IPv4 addresses with optional CIDR suffix
 * Examples: 192.168.1.1, 10.0.0.0/8, 172.16.0.0/12
 */
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

/**
 * Validates IPv4 address with optional CIDR notation
 * Checks both address format and value ranges
 *
 * @param value - IPv4 address (with optional CIDR) to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidIPv4('192.168.1.1') // Returns true
 * isValidIPv4('10.0.0.0/8') // Returns true
 * isValidIPv4('999.999.999.999') // Returns false
 */
const isValidIPv4 = (value: string): boolean => {
  if (!IPV4_REGEX.test(value)) return false;

  const [ip, cidr] = value.split('/');
  const octets = ip.split('.');

  // Validate octets (0-255)
  if (
    !octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    })
  )
    return false;

  // Validate CIDR (0-32)
  if (cidr) {
    const cidrNum = parseInt(cidr, 10);
    if (cidrNum < 0 || cidrNum > 32) return false;
  }

  return true;
};

/**
 * Port validation (1-65535)
 * Ensures port is within the valid range
 *
 * @param value - Port number to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidPort(443) // Returns true
 * isValidPort(65536) // Returns false
 */
const isValidPort = (value: number): boolean => {
  return value >= 1 && value <= 65535;
};

// ============================================================================
// Core Types
// ============================================================================

/**
 * Parsed firewall log data extracted from RouterOS log message
 */
export interface ParsedFirewallLog {
  /**
   * Chain where packet was logged (input/forward/output)
   */
  chain: FirewallLogChain;

  /**
   * Inferred action from log prefix or rule
   */
  action: InferredAction;

  /**
   * Source IP address
   */
  srcIp?: string;

  /**
   * Source port (for TCP/UDP)
   */
  srcPort?: number;

  /**
   * Destination IP address
   */
  dstIp?: string;

  /**
   * Destination port (for TCP/UDP)
   */
  dstPort?: number;

  /**
   * Network protocol
   */
  protocol: FirewallLogProtocol;

  /**
   * Input interface name
   */
  interfaceIn?: string;

  /**
   * Output interface name
   */
  interfaceOut?: string;

  /**
   * Log prefix from firewall rule
   */
  prefix?: string;

  /**
   * Packet length in bytes
   */
  length?: number;
}

/**
 * Firewall log entry extending base LogEntry with parsed firewall data
 */
export interface FirewallLogEntry extends LogEntry {
  /**
   * Topic is always 'firewall' for firewall logs
   */
  topic: 'firewall';

  /**
   * Parsed firewall-specific data from log message
   */
  parsed: ParsedFirewallLog;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Zod schema for parsed firewall log data validation
 * Validates all fields with proper IPv4/port formats and ranges
 *
 * @see ParsedFirewallLog - Interface for parsed firewall log data
 *
 * @example
 * const parsed = {
 *   chain: 'forward',
 *   action: 'drop',
 *   srcIp: '192.168.1.100',
 *   srcPort: 54321,
 * };
 * const result = ParsedFirewallLogSchema.parse(parsed);
 */
export const ParsedFirewallLogSchema = z.object({
  chain: FirewallLogChainSchema,
  action: InferredActionSchema,
  srcIp: z
    .string()
    .refine(isValidIPv4, {
      message: 'Invalid IPv4 address format',
    })
    .optional(),
  srcPort: z
    .number()
    .int()
    .refine(isValidPort, {
      message: 'Port must be between 1 and 65535',
    })
    .optional(),
  dstIp: z
    .string()
    .refine(isValidIPv4, {
      message: 'Invalid IPv4 address format',
    })
    .optional(),
  dstPort: z
    .number()
    .int()
    .refine(isValidPort, {
      message: 'Port must be between 1 and 65535',
    })
    .optional(),
  protocol: FirewallLogProtocolSchema,
  interfaceIn: z.string().min(1).max(64).optional(),
  interfaceOut: z.string().min(1).max(64).optional(),
  prefix: z.string().max(256).optional(),
  length: z.number().int().min(0).max(65535).optional(),
});

/**
 * Zod schema for complete firewall log entry validation
 * Combines base log entry fields with parsed firewall-specific data
 *
 * @see FirewallLogEntry - Interface for complete firewall log entry
 *
 * @example
 * const entry = {
 *   id: '*0',
 *   timestamp: new Date(),
 *   topic: 'firewall',
 *   severity: 'info',
 *   message: 'input: in:ether1 out:(unknown 0), proto TCP',
 *   parsed: { chain: 'input', action: 'drop', protocol: 'TCP' },
 * };
 * const result = FirewallLogEntrySchema.parse(entry);
 */
export const FirewallLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  topic: z.literal('firewall'),
  severity: z.enum(['debug', 'info', 'warning', 'error', 'critical']),
  message: z.string(),
  parsed: ParsedFirewallLogSchema,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates an IP address (with optional CIDR) for firewall logs
 *
 * @param ip - IP address (with optional CIDR) to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidFirewallLogIP('192.168.1.1') // Returns true
 * isValidFirewallLogIP('10.0.0.0/8') // Returns true
 */
export function isValidFirewallLogIP(ip: string): boolean {
  return isValidIPv4(ip);
}

/**
 * Validates a port number for firewall logs
 *
 * @param port - Port number to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidFirewallLogPort(80) // Returns true
 * isValidFirewallLogPort(65536) // Returns false
 */
export function isValidFirewallLogPort(port: number): boolean {
  return isValidPort(port);
}

/**
 * Gets a human-readable description for a firewall log action
 *
 * @param action - Inferred action from firewall log
 * @returns Description of the action
 *
 * @example
 * getFirewallLogActionDescription('drop') // Returns "Packet was silently discarded"
 */
export function getFirewallLogActionDescription(action: InferredAction): string {
  switch (action) {
    case 'accept':
      return 'Packet was allowed through';
    case 'drop':
      return 'Packet was silently discarded';
    case 'reject':
      return 'Packet was rejected with ICMP error';
    case 'unknown':
      return 'Action could not be determined';
  }
}

/**
 * Gets a Tailwind color class for a firewall log action
 *
 * @param action - Inferred action from firewall log
 * @returns Tailwind CSS color classes
 *
 * @example
 * getFirewallLogActionColor('drop') // Returns "text-red-600 dark:text-red-400"
 */
export function getFirewallLogActionColor(action: InferredAction): string {
  switch (action) {
    case 'accept':
      return 'text-green-600 dark:text-green-400';
    case 'drop':
    case 'reject':
      return 'text-red-600 dark:text-red-400';
    case 'unknown':
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Gets a human-readable description for a firewall log chain
 *
 * @param chain - Firewall chain (input/forward/output)
 * @returns Description of the chain
 *
 * @example
 * getFirewallLogChainDescription('forward') // Returns "Traffic through router"
 */
export function getFirewallLogChainDescription(chain: FirewallLogChain): string {
  switch (chain) {
    case 'input':
      return 'Traffic to router';
    case 'forward':
      return 'Traffic through router';
    case 'output':
      return 'Traffic from router';
  }
}

/**
 * Formats a firewall log connection as "srcIp:srcPort → dstIp:dstPort"
 * Returns 'unknown' for missing addresses
 *
 * @param parsed - Parsed firewall log data
 * @returns Formatted connection string
 *
 * @example
 * formatFirewallLogConnection(parsed) // Returns "192.168.1.100:54321 → 10.0.0.1:443"
 */
export function formatFirewallLogConnection(parsed: ParsedFirewallLog): string {
  const src =
    parsed.srcIp ? `${parsed.srcIp}${parsed.srcPort ? `:${parsed.srcPort}` : ''}` : 'unknown';
  const dst =
    parsed.dstIp ? `${parsed.dstIp}${parsed.dstPort ? `:${parsed.dstPort}` : ''}` : 'unknown';
  return `${src} → ${dst}`;
}

/**
 * Default firewall log entry for testing and mocking purposes
 * Represents a typical inbound packet drop on ether1 interface
 * Immutable constant for use in tests and component previews
 *
 * @example
 * const entry = DEFAULT_FIREWALL_LOG_ENTRY;
 * console.log(entry.parsed.chain); // 'input'
 * console.log(entry.parsed.action); // 'drop'
 */
export const DEFAULT_FIREWALL_LOG_ENTRY: Readonly<FirewallLogEntry> = {
  id: '*0',
  timestamp: new Date(),
  topic: 'firewall',
  severity: 'info',
  message: 'input: in:ether1 out:(unknown 0), proto TCP, 192.168.1.100:54321->10.0.0.1:443',
  parsed: {
    chain: 'input',
    action: 'drop',
    srcIp: '192.168.1.100',
    srcPort: 54321,
    dstIp: '10.0.0.1',
    dstPort: 443,
    protocol: 'TCP',
    interfaceIn: 'ether1',
  },
};

// ============================================================================
// Firewall Log Filter Types
// ============================================================================

/**
 * Time range preset options for firewall log filtering
 * Provides predefined time ranges or custom option for user-specified ranges
 *
 * @example
 * const preset: TimeRangePreset = '1h'; // Last hour
 * const custom: TimeRangePreset = 'custom'; // User-specified range
 */
export type TimeRangePreset = '1h' | '6h' | '1d' | '1w' | 'custom';

/**
 * Time range value with start and end timestamps
 * Used for custom time range selection in firewall log filters
 */
export interface TimeRange {
  /** Start timestamp (inclusive) */
  readonly start: Date;
  /** End timestamp (inclusive) */
  readonly end: Date;
}

/**
 * Port range value (min-max inclusive)
 * Used for filtering by port range instead of specific port
 */
export interface PortRange {
  /** Minimum port number (inclusive) */
  readonly min: number;
  /** Maximum port number (inclusive) */
  readonly max: number;
}

/**
 * Complete filter state for firewall logs
 * Used by firewall log UI components and stores for filtering and querying log entries
 * All fields are optional for flexible filtering scenarios
 */
export interface FirewallLogFilterState {
  /**
   * Time range preset or custom selection
   */
  readonly timeRangePreset: TimeRangePreset;

  /**
   * Custom time range (only used when timeRangePreset is 'custom')
   */
  readonly timeRange?: TimeRange;

  /**
   * Selected actions to filter by (empty array means all actions)
   */
  readonly actions: readonly InferredAction[];

  /**
   * Source IP filter with wildcard support (e.g., 192.168.1.*)
   */
  readonly srcIp?: string;

  /**
   * Destination IP filter with wildcard support
   */
  readonly dstIp?: string;

  /**
   * Source port or port range filter
   */
  readonly srcPort?: number | PortRange;

  /**
   * Destination port or port range filter
   */
  readonly dstPort?: number | PortRange;

  /**
   * Log prefix filter (matches against prefix field in log entries)
   */
  readonly prefix?: string;
}

/**
 * Default filter state for firewall logs
 * Shows all logs from the last hour with no action filtering applied
 * Immutable constant for use as initial state in components and stores
 *
 * @example
 * const filter = DEFAULT_FIREWALL_LOG_FILTER_STATE;
 * console.log(filter.timeRangePreset); // '1h'
 * console.log(filter.actions.length); // 0
 */
export const DEFAULT_FIREWALL_LOG_FILTER_STATE: Readonly<FirewallLogFilterState> = {
  timeRangePreset: '1h',
  actions: [],
};
