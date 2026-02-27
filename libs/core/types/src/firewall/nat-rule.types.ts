import { z } from 'zod';

/**
 * NAT Rule Types and Schemas
 *
 * NAT (Network Address Translation) rules control how traffic is translated
 * between internal and external networks in MikroTik RouterOS.
 *
 * NAT Types:
 * - srcnat: Source NAT (outgoing traffic) - includes masquerade
 * - dstnat: Destination NAT (incoming traffic) - includes port forwarding
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-2-implement-nat-configuration.md
 */

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * NAT Chain - srcnat or dstnat
 */
export const NatChainSchema = z.enum([
  'srcnat', // Source NAT - translate outgoing traffic (e.g., masquerade)
  'dstnat', // Destination NAT - translate incoming traffic (e.g., port forwarding)
]);

export type NatChain = z.infer<typeof NatChainSchema>;

/**
 * NAT Action - What transformation to apply
 */
export const NatActionSchema = z.enum([
  'masquerade', // Hide internal IPs behind router IP (auto-updates with IP changes)
  'dst-nat', // Destination NAT - forward to internal target
  'src-nat', // Source NAT - translate source address
  'redirect', // Redirect to router itself
  'netmap', // 1:1 address mapping
  'same', // Use same address as source
  'accept', // Accept without translation (terminal)
  'drop', // Drop packet (terminal)
  'jump', // Jump to another chain
  'return', // Return to calling chain
  'log', // Log packet
  'passthrough', // Continue processing
]);

export type NatAction = z.infer<typeof NatActionSchema>;

/**
 * Protocol type for NAT rules
 */
export const ProtocolSchema = z.enum([
  'tcp',
  'udp',
  'icmp',
  'gre',
  'esp',
  'ah',
  'ipip',
  'sctp',
  'all',
]);

export type Protocol = z.infer<typeof ProtocolSchema>;

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Port validation - single port or range (e.g., "80" or "8000-9000")
 * @internal
 */
const portRegex = /^\d+(-\d+)?$/;

/**
 * Zod schema for single port or port range validation
 * @internal
 */
const PortSchema = z
  .string()
  .regex(portRegex, 'Port must be a number or range (e.g., "80" or "8000-9000")')
  .optional();

/**
 * Zod schema for comma-separated ports and port ranges
 * @internal
 */
const PortListSchema = z
  .string()
  .regex(/^(\d+(-\d+)?)(,\d+(-\d+)?)*$/, 'Ports must be comma-separated numbers or ranges')
  .optional();

/**
 * Zod schema for IPv4 address validation
 * @internal
 */
const IPv4Schema = z
  .string()
  .ip({ version: 'v4', message: 'Must be a valid IPv4 address' })
  .optional();

/**
 * Zod schema for CIDR notation validation (IP with optional subnet mask)
 * @internal
 */
const CIDRSchema = z
  .string()
  .regex(
    /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
    'Must be a valid IP address or CIDR notation (e.g., "192.168.1.0/24")'
  )
  .optional();

// ============================================================================
// Main NAT Rule Schema
// ============================================================================

/**
 * NAT Rule Input Schema
 *
 * Complete schema for NAT rule configuration.
 * Includes all matchers and action parameters.
 */
export const NATRuleInputSchema = z
  .object({
    // ========================================
    // Identity
    // ========================================
    id: z.string().optional(),

    // ========================================
    // Chain and Action (REQUIRED)
    // ========================================
    chain: NatChainSchema,
    action: NatActionSchema,

    // Position for ordering (read-only from API)
    position: z.number().int().optional(),

    // ========================================
    // Matchers - Basic
    // ========================================
    protocol: ProtocolSchema.optional(),
    srcAddress: CIDRSchema,
    dstAddress: CIDRSchema,
    srcPort: PortSchema,
    dstPort: PortSchema,

    // ========================================
    // Matchers - Interface
    // ========================================
    inInterface: z.string().optional(), // Input interface name
    outInterface: z.string().optional(), // Output interface name
    inInterfaceList: z.string().optional(), // Input interface list name
    outInterfaceList: z.string().optional(), // Output interface list name

    // ========================================
    // Action Parameters - Address/Port Translation
    // ========================================
    toAddresses: IPv4Schema, // Target IP for dst-nat/src-nat
    toPorts: PortListSchema, // Target port(s) for dst-nat

    // ========================================
    // Meta
    // ========================================
    comment: z.string().max(255).optional(),
    disabled: z.boolean().default(false),
    log: z.boolean().default(false),
    logPrefix: z.string().max(50).optional(),

    // ========================================
    // Counters (read-only from API)
    // ========================================
    packets: z.number().int().optional(),
    bytes: z.number().int().optional(),
  })
  .refine(
    (data) => {
      // For dst-nat and src-nat, toAddresses is required
      if ((data.action === 'dst-nat' || data.action === 'src-nat') && !data.toAddresses) {
        return false;
      }
      return true;
    },
    {
      message: 'toAddresses is required for dst-nat and src-nat actions',
      path: ['toAddresses'],
    }
  )
  .refine(
    (data) => {
      // For masquerade, outInterface is typically required
      if (data.action === 'masquerade' && !data.outInterface && !data.outInterfaceList) {
        return false;
      }
      return true;
    },
    {
      message: 'outInterface or outInterfaceList is required for masquerade action',
      path: ['outInterface'],
    }
  );

export type NATRuleInput = z.infer<typeof NATRuleInputSchema>;

// ============================================================================
// Port Forward Schema (Simplified)
// ============================================================================

/**
 * Port Forward Input Schema
 *
 * Simplified schema for the Port Forward Wizard.
 * Creates both a dst-nat rule and a filter accept rule.
 */
export const PortForwardSchema = z.object({
  // ========================================
  // Basic Configuration
  // ========================================
  protocol: ProtocolSchema.default('tcp'),

  // ========================================
  // External Configuration (Step 1)
  // ========================================
  externalPort: z
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535'),

  // ========================================
  // Internal Configuration (Step 2)
  // ========================================
  internalIP: z.string().ip({ version: 'v4', message: 'Must be a valid IPv4 address' }),

  internalPort: z
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535')
    .optional(),

  // ========================================
  // Optional Configuration
  // ========================================
  name: z
    .string()
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name must be 100 characters or less')
    .optional(),

  wanInterface: z.string().optional(), // WAN interface to accept traffic on

  comment: z.string().max(255).optional(),
});

export type PortForward = z.infer<typeof PortForwardSchema>;

/**
 * Port Forward Result - Represents created port forward configuration
 *
 * Contains the IDs and configuration of both the NAT rule (dst-nat)
 * and optional filter rule (accept) that were created for a port forward.
 *
 * @example
 * ```ts
 * const result: PortForwardResult = {
 *   id: 'pf-1',
 *   name: 'Web Server',
 *   protocol: 'tcp',
 *   externalPort: 80,
 *   internalIP: '192.168.1.100',
 *   internalPort: 8080,
 *   status: 'active',
 *   natRuleId: 'nat-rule-123',
 *   filterRuleId: 'filter-rule-456',
 *   createdAt: new Date(),
 * };
 * ```
 */
export interface PortForwardResult {
  /** Unique identifier for the port forward */
  readonly id: string;
  /** Optional friendly name for the port forward */
  readonly name?: string;
  /** Protocol type (tcp, udp, etc.) */
  readonly protocol: Protocol;
  /** External port number (1-65535) */
  readonly externalPort: number;
  /** Internal IP address to forward to */
  readonly internalIP: string;
  /** Internal port number (1-65535), defaults to externalPort */
  readonly internalPort: number;
  /** Status of the port forward (active, disabled, or error) */
  readonly status: 'active' | 'disabled' | 'error';
  /** ID of the dst-nat rule that performs the translation */
  readonly natRuleId: string;
  /** ID of the filter accept rule (optional) */
  readonly filterRuleId?: string;
  /** Creation timestamp */
  readonly createdAt?: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get visible fields for a specific NAT action
 *
 * Different NAT actions require different fields. This helper returns
 * the list of field names that should be visible in the UI for a given action.
 *
 * @param action - The NAT action type
 * @returns Array of field names to show in the UI
 *
 * @example
 * ```ts
 * const fields = getVisibleFieldsForNATAction('masquerade');
 * // ['chain', 'srcAddress', 'outInterface', 'disabled', 'comment']
 * ```
 */
export function getVisibleFieldsForNATAction(action: NatAction): string[] {
  const baseFields = ['chain', 'action', 'disabled', 'comment'];

  switch (action) {
    case 'masquerade':
      return [
        ...baseFields,
        'srcAddress',
        'dstAddress',
        'protocol',
        'srcPort',
        'dstPort',
        'outInterface',
        'outInterfaceList',
        'log',
        'logPrefix',
      ];

    case 'dst-nat':
      return [
        ...baseFields,
        'srcAddress',
        'dstAddress',
        'protocol',
        'srcPort',
        'dstPort',
        'inInterface',
        'inInterfaceList',
        'toAddresses',
        'toPorts',
        'log',
        'logPrefix',
      ];

    case 'src-nat':
      return [
        ...baseFields,
        'srcAddress',
        'dstAddress',
        'protocol',
        'srcPort',
        'dstPort',
        'outInterface',
        'outInterfaceList',
        'toAddresses',
        'log',
        'logPrefix',
      ];

    case 'redirect':
      return [
        ...baseFields,
        'srcAddress',
        'dstAddress',
        'protocol',
        'dstPort',
        'toPorts',
        'inInterface',
        'inInterfaceList',
        'log',
        'logPrefix',
      ];

    case 'netmap':
      return [
        ...baseFields,
        'srcAddress',
        'dstAddress',
        'toAddresses',
        'inInterface',
        'outInterface',
        'log',
        'logPrefix',
      ];

    case 'accept':
    case 'drop':
    case 'passthrough':
      return [...baseFields, 'srcAddress', 'dstAddress', 'protocol', 'log', 'logPrefix'];

    case 'jump':
    case 'return':
      return [...baseFields, 'srcAddress', 'dstAddress', 'protocol'];

    case 'log':
      return [...baseFields, 'srcAddress', 'dstAddress', 'protocol', 'logPrefix'];

    case 'same':
      return [...baseFields, 'srcAddress', 'dstAddress', 'protocol', 'outInterface'];

    default:
      return baseFields;
  }
}

/**
 * Generate a human-readable preview of a NAT rule
 *
 * Creates a CLI-style command preview for a NAT rule configuration.
 * Useful for displaying in the wizard review step.
 *
 * @param rule - The NAT rule input to preview
 * @returns Human-readable command string
 *
 * @example
 * ```ts
 * const preview = generateNATRulePreview({
 *   chain: 'dstnat',
 *   action: 'dst-nat',
 *   protocol: 'tcp',
 *   dstPort: '80',
 *   toAddresses: '192.168.1.100',
 *   toPorts: '8080',
 * });
 * // "/ip firewall nat add chain=dstnat action=dst-nat protocol=tcp dst-port=80 to-addresses=192.168.1.100 to-ports=8080"
 * ```
 */
export function generateNATRulePreview(rule: Partial<NATRuleInput>): string {
  const parts: string[] = ['/ip/firewall/nat/add'];

  // Required fields
  if (rule.chain) parts.push(`chain=${rule.chain}`);
  if (rule.action) parts.push(`action=${rule.action}`);

  // Matchers
  if (rule.protocol) parts.push(`protocol=${rule.protocol}`);
  if (rule.srcAddress) parts.push(`src-address=${rule.srcAddress}`);
  if (rule.dstAddress) parts.push(`dst-address=${rule.dstAddress}`);
  if (rule.srcPort) parts.push(`src-port=${rule.srcPort}`);
  if (rule.dstPort) parts.push(`dst-port=${rule.dstPort}`);

  // Interfaces
  if (rule.inInterface) parts.push(`in-interface=${rule.inInterface}`);
  if (rule.outInterface) parts.push(`out-interface=${rule.outInterface}`);
  if (rule.inInterfaceList) parts.push(`in-interface-list=${rule.inInterfaceList}`);
  if (rule.outInterfaceList) parts.push(`out-interface-list=${rule.outInterfaceList}`);

  // Action parameters
  if (rule.toAddresses) parts.push(`to-addresses=${rule.toAddresses}`);
  if (rule.toPorts) parts.push(`to-ports=${rule.toPorts}`);

  // Meta
  if (rule.comment) parts.push(`comment="${rule.comment}"`);
  if (rule.disabled) parts.push('disabled=yes');
  if (rule.log) parts.push('log=yes');
  if (rule.logPrefix) parts.push(`log-prefix="${rule.logPrefix}"`);

  return parts.join(' ');
}

/**
 * Generate a human-readable summary for a port forward
 *
 * Creates a simplified description of what a port forward does.
 *
 * @param portForward - The port forward configuration
 * @returns Human-readable summary
 *
 * @example
 * ```ts
 * const summary = generatePortForwardSummary({
 *   protocol: 'tcp',
 *   externalPort: 80,
 *   internalIP: '192.168.1.100',
 *   internalPort: 8080,
 * });
 * // "Forward TCP port 80 to 192.168.1.100:8080"
 * ```
 */
export function generatePortForwardSummary(portForward: PortForward): string {
  const proto = portForward.protocol.toUpperCase();
  const internalPort = portForward.internalPort || portForward.externalPort;

  return `Forward ${proto} port ${portForward.externalPort} to ${portForward.internalIP}:${internalPort}`;
}

/**
 * Validate port conflict
 *
 * Checks if a port forward conflicts with existing forwards.
 *
 * @param newForward - The new port forward to validate
 * @param existingForwards - List of existing port forwards
 * @returns true if conflict exists, false otherwise
 */
export function hasPortForwardConflict(
  newForward: PortForward,
  existingForwards: PortForwardResult[]
): boolean {
  return existingForwards.some(
    (existing) =>
      existing.protocol === newForward.protocol &&
      existing.externalPort === newForward.externalPort &&
      existing.status !== 'disabled'
  );
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default NAT rule for masquerade (most common use case)
 */
export const DEFAULT_MASQUERADE_RULE: Partial<NATRuleInput> = {
  chain: 'srcnat',
  action: 'masquerade',
  disabled: false,
  log: false,
  comment: 'Default masquerade rule',
};

/**
 * Default port forward configuration
 */
export const DEFAULT_PORT_FORWARD: Partial<PortForward> = {
  protocol: 'tcp',
};

// ============================================================================
// Common Port Mappings
// ============================================================================

/**
 * Common service ports for port forwarding
 */
export const COMMON_SERVICE_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  SSH: 22,
  FTP: 21,
  SMTP: 25,
  DNS: 53,
  RDP: 3389,
  'Minecraft (Java)': 25565,
  'Minecraft (Bedrock)': 19132,
  'Plex Media Server': 32400,
  'Game Server (Various)': 27015,
} as const;
