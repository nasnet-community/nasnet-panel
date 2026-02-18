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
 * Firewall log chain where the log entry was generated
 */
export const FirewallLogChainSchema = z.enum([
  'input',   // Packets destined for the router itself
  'forward', // Packets passing through the router
  'output',  // Packets originating from the router
]);

export type FirewallLogChain = z.infer<typeof FirewallLogChainSchema>;

/**
 * Inferred action from firewall rule
 * 'unknown' when action cannot be determined from log prefix
 */
export const InferredActionSchema = z.enum([
  'accept',
  'drop',
  'reject',
  'unknown',
]);

export type InferredAction = z.infer<typeof InferredActionSchema>;

/**
 * Network protocol for firewall logs
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

export type FirewallLogProtocol = z.infer<typeof FirewallLogProtocolSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * IPv4 address validation (supports CIDR notation)
 * Examples: 192.168.1.1, 10.0.0.0/8, 172.16.0.0/12
 */
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const isValidIPv4 = (value: string): boolean => {
  if (!ipv4Regex.test(value)) return false;

  const [ip, cidr] = value.split('/');
  const octets = ip.split('.');

  // Validate octets (0-255)
  if (!octets.every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  })) return false;

  // Validate CIDR (0-32)
  if (cidr) {
    const cidrNum = parseInt(cidr, 10);
    if (cidrNum < 0 || cidrNum > 32) return false;
  }

  return true;
};

/**
 * Port validation (1-65535)
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
 * Schema for parsed firewall log data
 */
export const ParsedFirewallLogSchema = z.object({
  chain: FirewallLogChainSchema,
  action: InferredActionSchema,
  srcIp: z.string().refine(isValidIPv4, {
    message: 'Invalid IPv4 address format',
  }).optional(),
  srcPort: z.number().int().refine(isValidPort, {
    message: 'Port must be between 1 and 65535',
  }).optional(),
  dstIp: z.string().refine(isValidIPv4, {
    message: 'Invalid IPv4 address format',
  }).optional(),
  dstPort: z.number().int().refine(isValidPort, {
    message: 'Port must be between 1 and 65535',
  }).optional(),
  protocol: FirewallLogProtocolSchema,
  interfaceIn: z.string().min(1).max(64).optional(),
  interfaceOut: z.string().min(1).max(64).optional(),
  prefix: z.string().max(256).optional(),
  length: z.number().int().min(0).max(65535).optional(),
});

/**
 * Schema for complete firewall log entry
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
 */
export function isValidFirewallLogIP(ip: string): boolean {
  return isValidIPv4(ip);
}

/**
 * Validates a port number for firewall logs
 */
export function isValidFirewallLogPort(port: number): boolean {
  return isValidPort(port);
}

/**
 * Gets a human-readable description for a firewall log action
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
 * Gets a color class for a firewall log action (Tailwind)
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
 */
export function formatFirewallLogConnection(parsed: ParsedFirewallLog): string {
  const src = parsed.srcIp
    ? `${parsed.srcIp}${parsed.srcPort ? `:${parsed.srcPort}` : ''}`
    : 'unknown';
  const dst = parsed.dstIp
    ? `${parsed.dstIp}${parsed.dstPort ? `:${parsed.dstPort}` : ''}`
    : 'unknown';
  return `${src} → ${dst}`;
}

/**
 * Default firewall log entry for testing/mocking
 */
export const DEFAULT_FIREWALL_LOG_ENTRY: FirewallLogEntry = {
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
 */
export type TimeRangePreset = '1h' | '6h' | '1d' | '1w' | 'custom';

/**
 * Time range value with start and end timestamps
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Port range value (min-max inclusive)
 */
export interface PortRange {
  min: number;
  max: number;
}

/**
 * Complete filter state for firewall logs
 * Used by firewall log UI components and stores for filtering log entries
 */
export interface FirewallLogFilterState {
  /**
   * Time range preset or custom
   */
  timeRangePreset: TimeRangePreset;

  /**
   * Custom time range (only when preset is 'custom')
   */
  timeRange?: TimeRange;

  /**
   * Selected actions to filter by
   */
  actions: InferredAction[];

  /**
   * Source IP filter with wildcard support (e.g., 192.168.1.*)
   */
  srcIp?: string;

  /**
   * Destination IP filter with wildcard support
   */
  dstIp?: string;

  /**
   * Source port or port range
   */
  srcPort?: number | PortRange;

  /**
   * Destination port or port range
   */
  dstPort?: number | PortRange;

  /**
   * Log prefix filter
   */
  prefix?: string;
}

/**
 * Default filter state for firewall logs
 */
export const DEFAULT_FIREWALL_LOG_FILTER_STATE: FirewallLogFilterState = {
  timeRangePreset: '1h',
  actions: [],
};
