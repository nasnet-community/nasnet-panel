import { z } from 'zod';
import { ConnectionStateSchema, type ConnectionState } from './mangle-rule.types';

/**
 * Filter Rule Types and Schemas
 *
 * Filter rules control which traffic is allowed or blocked through the router.
 * They are processed in order by chain (input, forward, output).
 *
 * Chains:
 * - input: Packets destined for the router itself
 * - forward: Packets passing through the router
 * - output: Packets originating from the router
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-1-implement-firewall-filter-rules.md
 */

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * Filter Chain - 3 chain points for packet filtering
 */
export const FilterChainSchema = z.enum([
  'input',   // Packets destined for the router
  'forward', // Packets passing through the router
  'output',  // Packets originating from the router
]);

export type FilterChain = z.infer<typeof FilterChainSchema>;

/**
 * Filter Action - What to do with matched packets
 */
export const FilterActionSchema = z.enum([
  'accept',      // Allow packet through
  'drop',        // Silently discard packet
  'reject',      // Discard and send ICMP error
  'log',         // Log packet and continue
  'jump',        // Jump to custom chain
  'tarpit',      // Capture and hold connection
  'passthrough', // Continue to next rule
]);

export type FilterAction = z.infer<typeof FilterActionSchema>;

/**
 * Protocol types for filtering
 */
export const FilterProtocolSchema = z.enum([
  'tcp',
  'udp',
  'icmp',
  'ipv6-icmp',
  'all',
]);

export type FilterProtocol = z.infer<typeof FilterProtocolSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * IPv4 address validation (supports CIDR notation)
 * Examples: 192.168.1.1, 10.0.0.0/8, 172.16.0.0/12
 */
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

/**
 * Validate IPv4 address with optional CIDR notation
 * @param value - IP address string to validate
 * @returns true if valid, false otherwise
 * @internal
 */
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
 * Port validation (supports ranges)
 * Examples: 80, 443, 8000-9000
 */
const portRegex = /^(\d{1,5})(-\d{1,5})?$/;

/**
 * Validate port number or port range
 * @param value - Port string to validate (single port or range)
 * @returns true if valid, false otherwise
 * @internal
 */
const isValidPort = (value: string): boolean => {
  if (!portRegex.test(value)) return false;

  const parts = value.split('-');
  const ports = parts.map(p => parseInt(p, 10));

  // Validate port range (1-65535)
  if (!ports.every(port => port >= 1 && port <= 65535)) return false;

  // Validate range order (start < end)
  if (ports.length === 2 && ports[0] >= ports[1]) return false;

  return true;
};

/**
 * IP address schema with validation
 */
const IPAddressSchema = z
  .string()
  .refine(isValidIPv4, {
    message: 'Invalid IP address or CIDR notation (e.g., 192.168.1.1 or 10.0.0.0/8)',
  })
  .optional();

/**
 * Port schema with validation
 */
const PortSchema = z
  .string()
  .refine(isValidPort, {
    message: 'Invalid port or port range (1-65535, e.g., 80 or 8000-9000)',
  })
  .optional();

/**
 * Interface name schema
 */
const InterfaceNameSchema = z
  .string()
  .max(63, 'Interface name must be 63 characters or less')
  .optional();

/**
 * Address list name schema
 */
const AddressListNameSchema = z
  .string()
  .max(63, 'Address list name must be 63 characters or less')
  .optional();

// ============================================================================
// Main Filter Rule Schema
// ============================================================================

/**
 * Filter Rule Schema
 *
 * Complete schema for filter rule configuration with all matchers and actions.
 */
export const FilterRuleSchema = z.object({
  // ========================================
  // Identity
  // ========================================
  id: z.string().optional(),

  // ========================================
  // Chain and Action (REQUIRED)
  // ========================================
  chain: FilterChainSchema,
  action: FilterActionSchema,

  // Position for ordering (read-only from API)
  order: z.number().int().optional(),

  // ========================================
  // Matchers - Basic
  // ========================================
  protocol: FilterProtocolSchema.optional(),
  srcAddress: IPAddressSchema,
  dstAddress: IPAddressSchema,
  srcPort: PortSchema,
  dstPort: PortSchema,

  // ========================================
  // Matchers - Address Lists
  // ========================================
  srcAddressList: AddressListNameSchema,
  dstAddressList: AddressListNameSchema,

  // ========================================
  // Matchers - Interfaces
  // ========================================
  inInterface: InterfaceNameSchema,
  outInterface: InterfaceNameSchema,
  inInterfaceList: InterfaceNameSchema,
  outInterfaceList: InterfaceNameSchema,

  // ========================================
  // Matchers - Connection State
  // ========================================
  connectionState: z.array(ConnectionStateSchema).optional(),

  // ========================================
  // Meta
  // ========================================
  comment: z.string().max(255).optional(),
  disabled: z.boolean().default(false),

  // ========================================
  // Logging
  // ========================================
  log: z.boolean().default(false),
  logPrefix: z.string()
    .max(50, 'Log prefix must be 50 characters or less')
    .regex(/^[a-zA-Z0-9-]+$/, 'Log prefix must contain only alphanumeric characters and hyphens')
    .optional(),

  // ========================================
  // Jump Action
  // ========================================
  jumpTarget: z.string()
    .max(63, 'Jump target (chain name) must be 63 characters or less')
    .optional(),

  // ========================================
  // Counters (read-only from API)
  // ========================================
  packets: z.number().int().optional(),
  bytes: z.number().int().optional(),
})
.refine(
  (data) => {
    // Chain-specific validation: outInterface not allowed on input chain
    if (data.chain === 'input' && (data.outInterface || data.outInterfaceList)) {
      return false;
    }
    return true;
  },
  {
    message: 'Output interface cannot be specified for input chain (no routing decision yet)',
    path: ['outInterface'],
  }
)
.refine(
  (data) => {
    // Chain-specific validation: inInterface not allowed on output chain
    if (data.chain === 'output' && (data.inInterface || data.inInterfaceList)) {
      return false;
    }
    return true;
  },
  {
    message: 'Input interface cannot be specified for output chain (packets originate from router)',
    path: ['inInterface'],
  }
)
.refine(
  (data) => {
    // Require logPrefix if log is enabled
    if (data.log && !data.logPrefix) {
      return false;
    }
    return true;
  },
  {
    message: 'Log prefix is required when logging is enabled',
    path: ['logPrefix'],
  }
)
.refine(
  (data) => {
    // Require jumpTarget if action is jump
    if (data.action === 'jump' && !data.jumpTarget) {
      return false;
    }
    return true;
  },
  {
    message: 'Jump target (destination chain) is required for jump action',
    path: ['jumpTarget'],
  }
);

export type FilterRule = z.infer<typeof FilterRuleSchema>;
export type FilterRuleInput = z.input<typeof FilterRuleSchema>;

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default filter rule for form initialization
 */
export const DEFAULT_FILTER_RULE: Partial<FilterRule> = {
  chain: 'input',
  action: 'accept',
  disabled: false,
  log: false,
  protocol: 'tcp',
};

/**
 * Suggested log prefix patterns for common use cases
 */
export const SUGGESTED_LOG_PREFIXES = [
  { value: 'DROPPED-', label: 'DROPPED- (packets dropped by firewall)' },
  { value: 'ACCEPTED-', label: 'ACCEPTED- (packets accepted)' },
  { value: 'REJECTED-', label: 'REJECTED- (packets rejected with ICMP)' },
  { value: 'FIREWALL-', label: 'FIREWALL- (general firewall log)' },
] as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate IP address or CIDR
 */
export function isValidIPAddress(address: string): boolean {
  return isValidIPv4(address);
}

/**
 * Validate port or port range
 */
export function isValidPortRange(port: string): boolean {
  return isValidPort(port);
}

/**
 * Get required fields for action
 */
export function getRequiredFieldsForFilterAction(action: FilterAction): string[] {
  switch (action) {
    case 'jump':
      return ['jumpTarget'];
    case 'log':
      return ['logPrefix'];
    default:
      return [];
  }
}

/**
 * Get visible fields for action (for conditional form rendering)
 */
export function getVisibleFieldsForFilterAction(action: FilterAction): string[] {
  switch (action) {
    case 'jump':
      return ['jumpTarget'];
    case 'log':
      return ['logPrefix'];
    default:
      return [];
  }
}

/**
 * Check if chain allows outInterface
 */
export function chainAllowsOutInterface(chain: FilterChain): boolean {
  return chain !== 'input';
}

/**
 * Check if chain allows inInterface
 */
export function chainAllowsInInterface(chain: FilterChain): boolean {
  return chain !== 'output';
}

// ============================================================================
// Action Display Helpers
// ============================================================================

/**
 * Get semantic color for action (for badges and status indicators)
 */
export function getActionColor(action: FilterAction): string {
  switch (action) {
    case 'accept':
      return 'success'; // green
    case 'drop':
    case 'reject':
      return 'error'; // red
    case 'log':
      return 'info'; // blue
    case 'jump':
    case 'passthrough':
      return 'warning'; // amber
    case 'tarpit':
      return 'error'; // red
    default:
      return 'default';
  }
}

/**
 * Get action description for tooltips
 */
export function getActionDescription(action: FilterAction): string {
  switch (action) {
    case 'accept':
      return 'Allow packet through';
    case 'drop':
      return 'Silently discard packet without notification';
    case 'reject':
      return 'Discard packet and send ICMP error response';
    case 'log':
      return 'Log packet details and continue processing';
    case 'jump':
      return 'Jump to custom chain for further processing';
    case 'tarpit':
      return 'Capture and hold connection (anti-DDoS)';
    case 'passthrough':
      return 'Continue to next rule without terminal action';
    default:
      return '';
  }
}

/**
 * Generate human-readable rule preview
 */
export function generateRulePreview(rule: Partial<FilterRule>): string {
  const parts: string[] = [];

  // Action
  if (rule.action) {
    parts.push(rule.action.toUpperCase());
  }

  // Protocol
  if (rule.protocol && rule.protocol !== 'all') {
    parts.push(rule.protocol.toUpperCase());
  }

  // Source
  if (rule.srcAddress) {
    parts.push(`from ${rule.srcAddress}`);
  } else if (rule.srcAddressList) {
    parts.push(`from list:${rule.srcAddressList}`);
  }

  // Source port
  if (rule.srcPort) {
    parts.push(`sport ${rule.srcPort}`);
  }

  // Destination
  if (rule.dstAddress) {
    parts.push(`to ${rule.dstAddress}`);
  } else if (rule.dstAddressList) {
    parts.push(`to list:${rule.dstAddressList}`);
  }

  // Destination port
  if (rule.dstPort) {
    parts.push(`dport ${rule.dstPort}`);
  }

  // Interface
  if (rule.inInterface) {
    parts.push(`via ${rule.inInterface}`);
  }

  // Connection state
  if (rule.connectionState && rule.connectionState.length > 0) {
    parts.push(`state:${rule.connectionState.join(',')}`);
  }

  // Fallback
  if (parts.length === 0) {
    return 'New filter rule';
  }

  return parts.join(' ');
}
