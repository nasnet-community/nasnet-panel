import { z } from 'zod';

/**
 * Rate Limit Types and Schemas
 *
 * Connection rate limiting protects against DDoS attacks and connection flooding.
 * Uses MikroTik firewall filter rules with connection-rate matcher and RAW table for SYN flood protection.
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-11-implement-connection-rate-limiting.md
 */

// ============================================================================
// Enums and Schemas
// ============================================================================

/**
 * Rate Limit Action - What to do when rate limit is exceeded
 * Defines the action taken against connections that exceed the configured limit
 */
export const RateLimitActionSchema = z.enum([
  'drop',          // Drop excess connections immediately
  'tarpit',        // Trap connections in tarpit (slow response)
  'add-to-list',   // Add source IP to address list for blocking
]);

/**
 * Type for rate limit action
 * @example
 * const action: RateLimitAction = 'drop';
 */
export type RateLimitAction = z.infer<typeof RateLimitActionSchema>;

/**
 * Time Window - Rate limit calculation period
 * Defines the time window for rate limit calculation
 */
export const TimeWindowSchema = z.enum([
  'per-second',  // Connections per second
  'per-minute',  // Connections per minute
  'per-hour',    // Connections per hour
]);

/**
 * Type for time window
 * @example
 * const window: TimeWindow = 'per-minute';
 */
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

// ============================================================================
// Main Rate Limit Rule Schema
// ============================================================================

/**
 * Rate Limit Rule Schema
 *
 * Defines connection rate limits per IP with configurable actions.
 * Maps to MikroTik /ip/firewall/filter rules with connection-rate matcher.
 */
export const RateLimitRuleSchema = z.object({
  // Identity
  id: z.string().optional(), // RouterOS .id, read-only after creation

  // Source matching
  srcAddress: z.string().optional(), // IP, CIDR, or undefined for "any"
  srcAddressList: z.string().optional(), // Exclude list (e.g., "!rate-limit-whitelist")

  // Rate limiting
  connectionLimit: z
    .number()
    .int()
    .min(1, 'Connection limit must be at least 1')
    .max(100000, 'Connection limit cannot exceed 100000'),
  timeWindow: TimeWindowSchema,

  // Action
  action: RateLimitActionSchema,

  // For add-to-list action
  addressList: z
    .string()
    .max(63, 'List name must be 63 characters or less')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'List name can only contain alphanumeric characters, underscores, and hyphens'
    )
    .optional(),
  addressListTimeout: z.string().optional(), // RouterOS duration: "1h", "1d", "1w", "" for permanent

  // Metadata
  comment: z.string().max(255, 'Comment must be 255 characters or less').optional(),
  isDisabled: z.boolean().default(false),

  // Counters (read-only from API)
  packets: z.number().optional(),
  bytes: z.number().optional(),
});

/**
 * Type for a complete rate limit rule
 * @example
 * const rule: RateLimitRule = { id: 'rule-1', connectionLimit: 100, ... };
 */
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;
/**
 * Type for rate limit rule input (excludes readonly fields)
 * @example
 * const input: RateLimitRuleInput = { connectionLimit: 100, ... };
 */
export type RateLimitRuleInput = z.input<typeof RateLimitRuleSchema>;

// ============================================================================
// SYN Flood Protection Schema
// ============================================================================

/**
 * SYN Flood Protection Configuration
 *
 * Uses MikroTik RAW firewall table for efficient SYN flood attack mitigation.
 * Processed before connection tracking for maximum performance.
 */
export const SynFloodConfigSchema = z.object({
  isEnabled: z.boolean(),
  synLimit: z
    .number()
    .int()
    .min(1, 'SYN limit must be at least 1')
    .max(10000, 'SYN limit cannot exceed 10000'), // packets per second
  burst: z
    .number()
    .int()
    .min(1, 'Burst must be at least 1')
    .max(1000, 'Burst cannot exceed 1000'),
  action: z.enum(['drop', 'tarpit']),
});

/**
 * Type for SYN flood protection configuration
 * @example
 * const config: SynFloodConfig = { enabled: true, synLimit: 100, ... };
 */
export type SynFloodConfig = z.infer<typeof SynFloodConfigSchema>;

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Blocked IP Entry
 *
 * Represents an IP address that has been blocked by rate limiting rules.
 */
export const BlockedIPSchema = z.object({
  address: z.string(),
  list: z.string(),
  blockCount: z.number(),
  firstBlocked: z.date().optional(),
  lastBlocked: z.date().optional(),
  timeout: z.string().optional(), // Remaining timeout or "permanent"
  isDynamic: z.boolean(),
});

/**
 * Type for a blocked IP entry
 * @example
 * const blocked: BlockedIP = { address: '192.168.1.100', list: 'rate-limit-list', ... };
 */
export type BlockedIP = z.infer<typeof BlockedIPSchema>;

/**
 * Rate Limit Statistics
 *
 * Aggregated statistics from all rate limiting rules.
 */
export const RateLimitStatsSchema = z.object({
  totalBlocked: z.number(),
  topBlockedIPs: z.array(BlockedIPSchema).readonly(),
  triggerEvents: z.array(
    z.object({
      hour: z.string(),
      count: z.number(),
    })
  ).readonly(),
  lastUpdated: z.date(),
});

/**
 * Type for rate limit statistics
 * @example
 * const stats: RateLimitStats = { totalBlocked: 1000, topBlockedIPs: [...], ... };
 */
export type RateLimitStats = z.infer<typeof RateLimitStatsSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert connection rate to RouterOS format
 *
 * @param limit - Number of connections allowed
 * @param timeWindow - Time window for rate calculation
 * @returns RouterOS rate string (e.g., "100/1m")
 *
 * @example
 * connectionRateToRouterOS(100, 'per-minute') // Returns "100/1m"
 * connectionRateToRouterOS(50, 'per-second')  // Returns "50/1s"
 * connectionRateToRouterOS(500, 'per-hour')   // Returns "500/1h"
 */
export function connectionRateToRouterOS(limit: number, timeWindow: TimeWindow): string {
  const suffix = {
    'per-second': '1s',
    'per-minute': '1m',
    'per-hour': '1h',
  }[timeWindow];
  return `${limit}/${suffix}`;
}

/**
 * Parse RouterOS rate string to connection rate components
 *
 * @param rateString - RouterOS rate string (e.g., "100/1m")
 * @returns Object with limit and timeWindow, or null if invalid
 *
 * @example
 * routerOSToConnectionRate("100/1m")  // Returns { limit: 100, timeWindow: 'per-minute' }
 * routerOSToConnectionRate("50/1s")   // Returns { limit: 50, timeWindow: 'per-second' }
 * routerOSToConnectionRate("invalid") // Returns null
 */
export function routerOSToConnectionRate(
  rateString: string
): { limit: number; timeWindow: TimeWindow } | null {
  const match = rateString.match(/^(\d+)\/(1s|1m|1h)$/);
  if (!match) return null;

  const limit = parseInt(match[1], 10);
  const timeWindow = {
    '1s': 'per-second',
    '1m': 'per-minute',
    '1h': 'per-hour',
  }[match[2]] as TimeWindow;

  return { limit, timeWindow };
}

// ============================================================================
// Alert Event Types (for Epic 18 integration)
// ============================================================================

/**
 * Rate Limit Triggered Event
 *
 * Event emitted when a rate limit rule is triggered.
 * Used for alert notifications (Epic 18 integration).
 *
 * @example
 * const event: RateLimitTriggeredEvent = {
 *   type: 'rate-limit-triggered',
 *   timestamp: new Date(),
 *   routerId: 'router-1',
 *   ruleId: 'rule-1',
 *   blockedIP: '192.168.1.100',
 *   connectionLimit: 100,
 *   timeWindow: 'per-minute',
 *   action: 'drop',
 *   severity: 'critical'
 * };
 */
export interface RateLimitTriggeredEvent {
  /** Event type identifier */
  readonly type: 'rate-limit-triggered';
  /** Timestamp when the event occurred */
  readonly timestamp: Date;
  /** Router ID that triggered the event */
  readonly routerId: string;
  /** Rate limit rule ID that was triggered */
  readonly ruleId: string;
  /** IP address that exceeded the limit */
  readonly blockedIP: string;
  /** Connection limit configured in the rule */
  readonly connectionLimit: number;
  /** Time window of the rate limit */
  readonly timeWindow: TimeWindow;
  /** Action taken against the connection */
  readonly action: RateLimitAction;
  /** Optional address list if action is 'add-to-list' */
  readonly addressList?: string;
  /** Event severity level */
  readonly severity: 'warning' | 'critical';
}

// ============================================================================
// Constants and Defaults
// ============================================================================

/**
 * Default rate limit rule template
 *
 * Used for form initialization when creating new rate limit rules.
 * All properties are read-only and provide sensible defaults for a new rate limit rule.
 *
 * @example
 * const newRule = { ...DEFAULT_RATE_LIMIT_RULE, srcAddress: '192.168.1.0/24' };
 */
export const DEFAULT_RATE_LIMIT_RULE: Readonly<Partial<RateLimitRule>> = {
  connectionLimit: 100,
  timeWindow: 'per-minute',
  action: 'drop',
  isDisabled: false,
  comment: '',
};

/**
 * Default SYN flood protection configuration
 *
 * Used when initializing SYN flood protection settings.
 * SYN flood protection is disabled by default with moderate protection settings.
 *
 * @example
 * const config = { ...DEFAULT_SYN_FLOOD_CONFIG, isEnabled: true };
 */
export const DEFAULT_SYN_FLOOD_CONFIG: Readonly<SynFloodConfig> = {
  isEnabled: false,
  synLimit: 100,
  burst: 5,
  action: 'drop',
};

/**
 * Preset timeout values for address list entries
 *
 * Common timeout durations used in address list configuration.
 * Provides quick-select options for temporary or permanent address list blocking.
 *
 * @example
 * const options = TIMEOUT_PRESETS.map(p => ({ label: p.label, value: p.value }));
 */
export const TIMEOUT_PRESETS = [
  { label: '1 hour', value: '1h' },
  { label: '6 hours', value: '6h' },
  { label: '1 day', value: '1d' },
  { label: '1 week', value: '1w' },
  { label: 'Permanent', value: '' },
] as const satisfies readonly { readonly label: string; readonly value: string }[];

/**
 * Connection limit presets for common use cases
 *
 * Quick templates for different rate limiting scenarios.
 * Ranges from very strict (10/min) to very relaxed (1000/min) protection levels.
 *
 * @example
 * const selected = CONNECTION_LIMIT_PRESETS[2]; // Moderate preset
 * const rule = { connectionLimit: selected.limit, timeWindow: selected.timeWindow };
 */
export const CONNECTION_LIMIT_PRESETS = [
  { label: 'Very Strict (10/min)', limit: 10, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Strict (50/min)', limit: 50, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Moderate (100/min)', limit: 100, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Relaxed (500/min)', limit: 500, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Very Relaxed (1000/min)', limit: 1000, timeWindow: 'per-minute' as TimeWindow },
] as const satisfies readonly { readonly label: string; readonly limit: number; readonly timeWindow: TimeWindow }[];

/**
 * SYN limit presets for SYN flood protection
 *
 * Pre-configured templates for different SYN flood mitigation levels.
 * Ranges from very strict (50 SYN/sec) to relaxed (500 SYN/sec) protection.
 *
 * @example
 * const selected = SYN_LIMIT_PRESETS[2]; // Moderate preset
 * const config = { synLimit: selected.synLimit, burst: selected.burst, isEnabled: true };
 */
export const SYN_LIMIT_PRESETS = [
  { label: 'Very Strict', synLimit: 50, burst: 5 },
  { label: 'Strict', synLimit: 100, burst: 5 },
  { label: 'Moderate', synLimit: 200, burst: 10 },
  { label: 'Relaxed', synLimit: 500, burst: 20 },
] as const satisfies readonly { readonly label: string; readonly synLimit: number; readonly burst: number }[];
