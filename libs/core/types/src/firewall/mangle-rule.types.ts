import { z } from 'zod';

/**
 * Mangle Rule Types and Schemas
 *
 * Mangle rules are used for traffic marking and manipulation in MikroTik RouterOS.
 * They enable QoS, policy routing, and advanced traffic control.
 *
 * Packet Flow:
 * PACKET IN → prerouting → [Routing Decision] → input/forward → output → postrouting → PACKET OUT
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-5-implement-mangle-rules.md
 */

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * Mangle Chain - 5 chain points in packet processing
 */
export const MangleChainSchema = z.enum([
  'prerouting', // Before routing decision
  'input', // Packets destined for the router itself
  'forward', // Packets passing through the router
  'output', // Packets originating from the router
  'postrouting', // After routing decision, before packet out
]);

export type MangleChain = z.infer<typeof MangleChainSchema>;

/**
 * Mangle Action - What to do with matched packets
 */
export const MangleActionSchema = z.enum([
  // Mark actions (for QoS and routing)
  'mark-connection', // Mark all packets in connection
  'mark-packet', // Mark individual packets
  'mark-routing', // Mark for routing decisions

  // QoS/TTL manipulation
  'change-ttl', // Modify Time To Live
  'change-dscp', // Modify Differentiated Services Code Point
  'change-mss', // Modify Maximum Segment Size

  // Flow control
  'passthrough', // Continue processing (no terminal action)
  'accept', // Accept packet (terminal)
  'drop', // Drop packet (terminal)
  'jump', // Jump to another chain
  'log', // Log packet
]);

export type MangleAction = z.infer<typeof MangleActionSchema>;

/**
 * Connection State for matching
 */
export const ConnectionStateSchema = z.enum([
  'established', // Active connection
  'new', // New connection
  'related', // Related to existing connection
  'invalid', // Invalid connection
  'untracked', // Not tracked
]);

export type ConnectionState = z.infer<typeof ConnectionStateSchema>;

/**
 * NAT State for matching
 */
export const ConnectionNatStateSchema = z.enum([
  'srcnat', // Source NAT
  'dstnat', // Destination NAT
]);

export type ConnectionNatState = z.infer<typeof ConnectionNatStateSchema>;

/**
 * Mark name validation regex - alphanumeric, underscore, hyphen
 * @internal
 */
const markNameRegex = /^[a-zA-Z0-9_-]+$/;

/**
 * Zod schema for mark name validation (alphanumeric, underscore, hyphen; max 63 chars)
 * @internal
 */
const MarkNameSchema = z
  .string()
  .max(63, 'Mark name must be 63 characters or less')
  .regex(markNameRegex, 'Mark name must contain only letters, numbers, underscores, and hyphens')
  .optional();

/**
 * Zod schema for DSCP value (Differentiated Services Code Point, 0-63)
 * @internal
 */
const DscpSchema = z
  .number()
  .int()
  .min(0, 'DSCP value must be between 0 and 63')
  .max(63, 'DSCP value must be between 0 and 63')
  .optional();

// ============================================================================
// Main Mangle Rule Schema
// ============================================================================

/**
 * Mangle Rule Schema
 *
 * Complete schema for mangle rule configuration with all matchers and actions.
 */
export const MangleRuleSchema = z.object({
  // ========================================
  // Identity
  // ========================================
  id: z.string().optional(),

  // ========================================
  // Chain and Action (REQUIRED)
  // ========================================
  chain: MangleChainSchema,
  action: MangleActionSchema,

  // Position for drag-drop ordering (read-only from API)
  position: z.number().int().optional(),

  // ========================================
  // Matchers - Basic
  // ========================================
  protocol: z.string().optional(), // tcp, udp, icmp, etc.
  srcAddress: z.string().optional(), // IPv4/IPv6/CIDR
  dstAddress: z.string().optional(), // IPv4/IPv6/CIDR
  srcPort: z.string().optional(), // port or range (e.g., "80" or "80-443")
  dstPort: z.string().optional(), // port or range
  srcAddressList: z.string().optional(), // Reference to address list
  dstAddressList: z.string().optional(), // Reference to address list
  inInterface: z.string().optional(), // Input interface name
  outInterface: z.string().optional(), // Output interface name
  inInterfaceList: z.string().optional(), // Input interface list name
  outInterfaceList: z.string().optional(), // Output interface list name

  // ========================================
  // Matchers - Connection State
  // ========================================
  connectionState: z.array(ConnectionStateSchema).optional(),
  connectionNatState: z.array(ConnectionNatStateSchema).optional(),

  // ========================================
  // Matchers - Marks (match existing marks)
  // ========================================
  connectionMark: z.string().optional(), // Match existing connection mark
  packetMark: z.string().optional(), // Match existing packet mark
  routingMark: z.string().optional(), // Match existing routing mark

  // ========================================
  // Matchers - Advanced
  // ========================================
  packetSize: z.string().optional(), // e.g., "64-1500"
  layer7Protocol: z.string().optional(), // Layer 7 protocol name
  content: z.string().optional(), // Content matching pattern
  tcpFlags: z.string().optional(), // TCP flags (e.g., "syn,!fin,!rst,!ack")

  // ========================================
  // Actions - Marks (set new marks)
  // ========================================
  newConnectionMark: MarkNameSchema,
  newPacketMark: MarkNameSchema,
  newRoutingMark: MarkNameSchema,

  // Passthrough - continue to next rule after marking (default: true)
  passthrough: z.boolean().default(true),

  // ========================================
  // Actions - DSCP/QoS
  // ========================================
  newDscp: DscpSchema,

  // ========================================
  // Actions - TTL/MSS
  // ========================================
  newTtl: z.string().optional(), // "set:X", "increment:X", "decrement:X"
  newMss: z.number().int().optional(), // Clamp MSS value

  // ========================================
  // Actions - Jump
  // ========================================
  jumpTarget: z.string().optional(), // Chain name to jump to

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
});

export type MangleRule = z.infer<typeof MangleRuleSchema>;
export type MangleRuleInput = z.input<typeof MangleRuleSchema>;

// ============================================================================
// DSCP Class Definitions
// ============================================================================

/**
 * DSCP Class Metadata - Information about a Differentiated Services Code Point
 *
 * Used for QoS configuration, stores both the numeric DSCP value and
 * human-friendly names for different traffic classes (0-63).
 *
 * @example
 * ```ts
 * const ef: DscpClass = {
 *   value: 46,
 *   name: 'EF',
 *   description: 'Expedited Forwarding',
 *   useCase: 'VoIP audio (priority)',
 * };
 * ```
 */
export interface DscpClass {
  /** Numeric DSCP value (0-63) */
  readonly value: number;
  /** DSCP class name (e.g., 'EF', 'AF11', 'CS5') */
  readonly name: string;
  /** Human-readable description of the DSCP class */
  readonly description: string;
  /** Common use cases for this DSCP value */
  readonly useCase: string;
}

/**
 * Standard DSCP Classes
 *
 * Used in DSCP selector dropdown for user-friendly QoS configuration.
 */
export const DSCP_CLASSES: DscpClass[] = [
  // Best Effort
  { value: 0, name: 'BE / CS0', description: 'Best Effort (default)', useCase: 'Normal traffic' },

  // Class Selector (CS) - Legacy IP Precedence
  { value: 8, name: 'CS1', description: 'Scavenger', useCase: 'Background downloads' },
  { value: 16, name: 'CS2', description: 'OAM', useCase: 'Network management' },
  { value: 24, name: 'CS3', description: 'Broadcast Video', useCase: 'Streaming' },
  { value: 32, name: 'CS4', description: 'Real-time Interactive', useCase: 'Video conferencing' },
  { value: 40, name: 'CS5', description: 'Signaling', useCase: 'SIP/H.323 call setup' },
  { value: 48, name: 'CS6', description: 'Network Control', useCase: 'Routing protocols' },
  { value: 56, name: 'CS7', description: 'Reserved', useCase: 'Reserved' },

  // Assured Forwarding (AF) - 4 classes, 3 drop precedences each
  { value: 10, name: 'AF11', description: 'Assured Forwarding 1-1', useCase: 'Bulk data' },
  { value: 12, name: 'AF12', description: 'Assured Forwarding 1-2', useCase: 'Bulk data' },
  { value: 14, name: 'AF13', description: 'Assured Forwarding 1-3', useCase: 'Bulk data' },

  { value: 18, name: 'AF21', description: 'Assured Forwarding 2-1', useCase: 'Transactional data' },
  { value: 20, name: 'AF22', description: 'Assured Forwarding 2-2', useCase: 'Transactional data' },
  { value: 22, name: 'AF23', description: 'Assured Forwarding 2-3', useCase: 'Transactional data' },

  {
    value: 26,
    name: 'AF31',
    description: 'Assured Forwarding 3-1',
    useCase: 'Multimedia streaming',
  },
  {
    value: 28,
    name: 'AF32',
    description: 'Assured Forwarding 3-2',
    useCase: 'Multimedia streaming',
  },
  {
    value: 30,
    name: 'AF33',
    description: 'Assured Forwarding 3-3',
    useCase: 'Multimedia streaming',
  },

  { value: 34, name: 'AF41', description: 'Assured Forwarding 4-1', useCase: 'Interactive video' },
  { value: 36, name: 'AF42', description: 'Assured Forwarding 4-2', useCase: 'Interactive video' },
  { value: 38, name: 'AF43', description: 'Assured Forwarding 4-3', useCase: 'Interactive video' },

  // Expedited Forwarding (EF) - Highest priority
  { value: 46, name: 'EF', description: 'Expedited Forwarding', useCase: 'VoIP audio (priority)' },
];

/**
 * Get DSCP class by value
 */
export function getDscpClass(value: number): DscpClass | undefined {
  return DSCP_CLASSES.find((c) => c.value === value);
}

/**
 * Get DSCP class name by value (for display)
 */
export function getDscpClassName(value: number): string {
  const dscpClass = getDscpClass(value);
  return dscpClass ? `${value} - ${dscpClass.name}` : `${value}`;
}

/**
 * Get full DSCP description (for dropdown)
 */
export function getDscpDescription(value: number): string {
  const dscpClass = getDscpClass(value);
  if (!dscpClass) return `${value}`;
  return `${value} - ${dscpClass.name} (${dscpClass.description}) - ${dscpClass.useCase}`;
}

// ============================================================================
// Mark Types
// ============================================================================

/**
 * Mark Type Metadata - Information about packet marking strategies
 *
 * Defines different ways to mark packets and connections for routing,
 * QoS, and traffic shaping operations.
 *
 * @example
 * ```ts
 * const connMark: MarkType = {
 *   name: 'Connection Mark',
 *   action: 'mark-connection',
 *   field: 'newConnectionMark',
 *   persistence: 'All packets in connection',
 *   useCase: 'QoS queue trees, routing policies',
 * };
 * ```
 */
export interface MarkType {
  /** Human-readable name of the mark type */
  readonly name: string;
  /** Action used to create this type of mark */
  readonly action: MangleAction;
  /** Field name in MangleRule where this mark is stored */
  readonly field: 'newConnectionMark' | 'newPacketMark' | 'newRoutingMark';
  /** How long the mark persists (connection, packet, or routing decision) */
  readonly persistence: string;
  /** Common use cases for this mark type */
  readonly useCase: string;
}

/**
 * Mark Types for different traffic marking purposes
 */
export const MARK_TYPES: MarkType[] = [
  {
    name: 'Connection Mark',
    action: 'mark-connection',
    field: 'newConnectionMark',
    persistence: 'All packets in connection',
    useCase: 'QoS queue trees, routing policies',
  },
  {
    name: 'Packet Mark',
    action: 'mark-packet',
    field: 'newPacketMark',
    persistence: 'Individual packets only',
    useCase: 'Per-packet queue assignment, traffic shaping',
  },
  {
    name: 'Routing Mark',
    action: 'mark-routing',
    field: 'newRoutingMark',
    persistence: 'Routing decision',
    useCase: 'Policy-based routing, multi-WAN, VRF',
  },
];

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default mangle rule for form initialization
 */
export const DEFAULT_MANGLE_RULE: Partial<MangleRule> = {
  chain: 'prerouting',
  action: 'mark-connection',
  passthrough: true,
  disabled: false,
  log: false,
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate mark name
 */
export function isValidMarkName(name: string): boolean {
  return markNameRegex.test(name) && name.length <= 63;
}

/**
 * Validate DSCP value
 */
export function isValidDscp(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 63;
}

/**
 * Check if action requires specific fields
 */
export function getRequiredFieldsForAction(action: MangleAction): string[] {
  switch (action) {
    case 'mark-connection':
      return ['newConnectionMark'];
    case 'mark-packet':
      return ['newPacketMark'];
    case 'mark-routing':
      return ['newRoutingMark'];
    case 'change-dscp':
      return ['newDscp'];
    case 'change-ttl':
      return ['newTtl'];
    case 'change-mss':
      return ['newMss'];
    case 'jump':
      return ['jumpTarget'];
    default:
      return [];
  }
}

/**
 * Get visible fields for action (for conditional form rendering)
 */
export function getVisibleFieldsForAction(action: MangleAction): string[] {
  switch (action) {
    case 'mark-connection':
      return ['newConnectionMark', 'passthrough'];
    case 'mark-packet':
      return ['newPacketMark', 'passthrough'];
    case 'mark-routing':
      return ['newRoutingMark', 'passthrough'];
    case 'change-dscp':
      return ['newDscp'];
    case 'change-ttl':
      return ['newTtl'];
    case 'change-mss':
      return ['newMss'];
    case 'jump':
      return ['jumpTarget'];
    case 'log':
      return ['logPrefix'];
    default:
      return [];
  }
}
