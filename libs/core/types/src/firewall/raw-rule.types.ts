import { z } from 'zod';

/**
 * RAW Rule Types and Schemas
 *
 * RAW firewall rules operate BEFORE connection tracking (pre-conntrack).
 * They are primarily used for:
 * - Disabling connection tracking (notrack) for performance
 * - Early packet dropping (DDoS mitigation, bogon filtering)
 * - Pre-routing decisions
 *
 * Chains:
 * - prerouting: Before routing decision (only chain with inInterface)
 * - output: Packets originating from router (only chain with outInterface)
 *
 * Key Differences from Filter Rules:
 * - Only 2 chains (prerouting, output) vs 5 in mangle or 3 in filter
 * - No connection state matching (executes before conntrack)
 * - Actions: drop, accept, notrack, jump, log
 * - Rate limiting still available
 *
 * @see https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter#RAW
 */

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * RAW Chain - 2 chain points (pre-conntrack)
 */
export const RawChainSchema = z.enum([
  'prerouting', // Before routing decision
  'output', // Packets originating from router
]);

export type RawChain = z.infer<typeof RawChainSchema>;

/**
 * RAW Action - What to do with matched packets
 */
export const RawActionSchema = z.enum([
  'drop', // Silently discard packet
  'accept', // Allow packet (continue to filter rules)
  'notrack', // Disable connection tracking for performance
  'jump', // Jump to custom chain
  'log', // Log packet and continue
]);

export type RawAction = z.infer<typeof RawActionSchema>;

/**
 * Protocol types for RAW filtering
 */
export const RawProtocolSchema = z.enum(['tcp', 'udp', 'icmp', 'ipv6-icmp', 'all']);

export type RawProtocol = z.infer<typeof RawProtocolSchema>;

/**
 * Rate Limit configuration for RAW rules
 * Used for DDoS protection and connection rate limiting
 */
export const RateLimitSchema = z.object({
  rate: z.string(), // Format: "N/second|minute|hour|day" (e.g., "10/minute")
  burst: z.number().int().positive().optional(), // Burst allowance
});

export type RateLimit = z.infer<typeof RateLimitSchema>;

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
  const ports = parts.map((p) => parseInt(p, 10));

  // Validate port range (1-65535)
  if (!ports.every((port) => port >= 1 && port <= 65535)) return false;

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

// ============================================================================
// Main RAW Rule Schema
// ============================================================================

/**
 * RAW Rule Schema
 *
 * Complete schema for RAW rule configuration with all matchers and actions.
 */
export const RawRuleSchema = z
  .object({
    // ========================================
    // Identity
    // ========================================
    id: z.string().optional(),

    // ========================================
    // Chain and Action (REQUIRED)
    // ========================================
    chain: RawChainSchema,
    action: RawActionSchema,

    // Position for ordering (read-only from API)
    order: z.number().int().optional(),

    // ========================================
    // Matchers - Basic
    // ========================================
    protocol: RawProtocolSchema.optional(),
    srcAddress: IPAddressSchema,
    dstAddress: IPAddressSchema,
    srcPort: PortSchema,
    dstPort: PortSchema,

    // ========================================
    // Matchers - Interfaces
    // ========================================
    inInterface: InterfaceNameSchema,
    outInterface: InterfaceNameSchema,

    // ========================================
    // Rate Limiting (for DDoS protection)
    // ========================================
    limit: RateLimitSchema.optional(),

    // ========================================
    // Action-specific fields
    // ========================================
    jumpTarget: z.string().max(63).optional(), // For jump action
    logPrefix: z
      .string()
      .max(50, 'Log prefix must be 50 characters or less')
      .regex(/^[a-zA-Z0-9-]+$/, 'Log prefix must contain only alphanumeric characters and hyphens')
      .optional(),

    // ========================================
    // Meta
    // ========================================
    comment: z.string().max(255).optional(),
    disabled: z.boolean().default(false),

    // ========================================
    // Counters (read-only from API)
    // ========================================
    packets: z.number().int().optional(),
    bytes: z.number().int().optional(),
  })
  .refine(
    (data) => {
      // Chain-specific validation: outInterface only on output chain
      if (data.chain === 'prerouting' && data.outInterface) {
        return false;
      }
      return true;
    },
    {
      message:
        'Output interface can only be specified for output chain (routing decision not made yet)',
      path: ['outInterface'],
    }
  )
  .refine(
    (data) => {
      // Chain-specific validation: inInterface only on prerouting chain
      if (data.chain === 'output' && data.inInterface) {
        return false;
      }
      return true;
    },
    {
      message:
        'Input interface can only be specified for prerouting chain (packets originate from router)',
      path: ['inInterface'],
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
      message: 'Jump target is required for jump action',
      path: ['jumpTarget'],
    }
  )
  .refine(
    (data) => {
      // Require logPrefix if action is log
      if (data.action === 'log' && !data.logPrefix) {
        return false;
      }
      return true;
    },
    {
      message: 'Log prefix is required for log action',
      path: ['logPrefix'],
    }
  );

export type RawRule = z.infer<typeof RawRuleSchema>;
export type RawRuleInput = z.input<typeof RawRuleSchema>;

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default RAW rule for form initialization
 */
export const DEFAULT_RAW_RULE: Partial<RawRule> = {
  chain: 'prerouting',
  action: 'notrack',
  disabled: false,
  protocol: 'tcp',
};

/**
 * Suggested log prefix patterns for RAW rules
 */
export const SUGGESTED_LOG_PREFIXES = [
  { value: 'RAW-DROP-', label: 'RAW-DROP- (packets dropped before conntrack)' },
  { value: 'RAW-BOGON-', label: 'RAW-BOGON- (bogon address filtered)' },
  { value: 'RAW-DDOS-', label: 'RAW-DDOS- (DDoS protection triggered)' },
  { value: 'RAW-', label: 'RAW- (general RAW rule log)' },
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
export function getRequiredFieldsForRawAction(action: RawAction): string[] {
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
export function getVisibleFieldsForRawAction(action: RawAction): string[] {
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
export function chainAllowsOutInterface(chain: RawChain): boolean {
  return chain === 'output';
}

/**
 * Check if chain allows inInterface
 */
export function chainAllowsInInterface(chain: RawChain): boolean {
  return chain === 'prerouting';
}

// ============================================================================
// Action Display Helpers
// ============================================================================

/**
 * Get semantic color for action (for badges and status indicators)
 */
export function getActionColor(action: RawAction): string {
  switch (action) {
    case 'accept':
      return 'success'; // green
    case 'drop':
      return 'error'; // red
    case 'notrack':
      return 'warning'; // amber
    case 'log':
      return 'info'; // blue
    case 'jump':
      return 'warning'; // amber
    default:
      return 'default';
  }
}

/**
 * Get action description for tooltips
 */
export function getActionDescription(action: RawAction): string {
  switch (action) {
    case 'accept':
      return 'Allow packet (continue to filter rules)';
    case 'drop':
      return 'Silently discard packet without notification';
    case 'notrack':
      return 'Disable connection tracking for performance optimization';
    case 'log':
      return 'Log packet details and continue processing';
    case 'jump':
      return 'Jump to custom chain for further processing';
    default:
      return '';
  }
}

/**
 * Generate human-readable rule preview
 */
export function generateRulePreview(rule: Partial<RawRule>): string {
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
  }

  // Source port
  if (rule.srcPort) {
    parts.push(`sport ${rule.srcPort}`);
  }

  // Destination
  if (rule.dstAddress) {
    parts.push(`to ${rule.dstAddress}`);
  }

  // Destination port
  if (rule.dstPort) {
    parts.push(`dport ${rule.dstPort}`);
  }

  // Interface
  if (rule.inInterface) {
    parts.push(`via ${rule.inInterface}`);
  }

  // Rate limit
  if (rule.limit) {
    parts.push(`limit ${rule.limit.rate}`);
  }

  // Fallback
  if (parts.length === 0) {
    return 'New RAW rule';
  }

  return parts.join(' ');
}

/**
 * Check if rule is for DDoS protection
 * (has rate limiting and drops packets)
 */
export function isDDoSProtectionRule(rule: Partial<RawRule>): boolean {
  return !!(rule.action === 'drop' && rule.limit);
}

/**
 * Check if rule is for performance optimization
 * (notrack action to bypass connection tracking)
 */
export function isPerformanceRule(rule: Partial<RawRule>): boolean {
  return rule.action === 'notrack';
}
