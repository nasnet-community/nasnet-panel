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
 */
export const RateLimitActionSchema = z.enum([
  'drop',          // Drop excess connections immediately
  'tarpit',        // Trap connections in tarpit (slow response)
  'add-to-list',   // Add source IP to address list for blocking
]);

export type RateLimitAction = z.infer<typeof RateLimitActionSchema>;

/**
 * Time Window - Rate limit calculation period
 */
export const TimeWindowSchema = z.enum([
  'per-second',  // Connections per second
  'per-minute',  // Connections per minute
  'per-hour',    // Connections per hour
]);

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
  disabled: z.boolean().default(false),

  // Counters (read-only from API)
  packets: z.number().optional(),
  bytes: z.number().optional(),
});

export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;
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
  enabled: z.boolean(),
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
  dynamic: z.boolean(),
});

export type BlockedIP = z.infer<typeof BlockedIPSchema>;

/**
 * Rate Limit Statistics
 *
 * Aggregated statistics from all rate limiting rules.
 */
export const RateLimitStatsSchema = z.object({
  totalBlocked: z.number(),
  topBlockedIPs: z.array(BlockedIPSchema),
  triggerEvents: z.array(
    z.object({
      hour: z.string(),
      count: z.number(),
    })
  ),
  lastUpdated: z.date(),
});

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
 */
export interface RateLimitTriggeredEvent {
  type: 'rate-limit-triggered';
  timestamp: Date;
  routerId: string;
  ruleId: string;
  blockedIP: string;
  connectionLimit: number;
  timeWindow: TimeWindow;
  action: RateLimitAction;
  addressList?: string;
  severity: 'warning' | 'critical';
}

// ============================================================================
// Constants and Defaults
// ============================================================================

/**
 * Default rate limit rule template
 */
export const DEFAULT_RATE_LIMIT_RULE: Partial<RateLimitRule> = {
  connectionLimit: 100,
  timeWindow: 'per-minute',
  action: 'drop',
  disabled: false,
  comment: '',
};

/**
 * Default SYN flood protection configuration
 */
export const DEFAULT_SYN_FLOOD_CONFIG: SynFloodConfig = {
  enabled: false,
  synLimit: 100,
  burst: 5,
  action: 'drop',
};

/**
 * Preset timeout values for address list entries
 */
export const TIMEOUT_PRESETS = [
  { label: '1 hour', value: '1h' },
  { label: '6 hours', value: '6h' },
  { label: '1 day', value: '1d' },
  { label: '1 week', value: '1w' },
  { label: 'Permanent', value: '' },
] as const;

/**
 * Connection limit presets for common use cases
 */
export const CONNECTION_LIMIT_PRESETS = [
  { label: 'Very Strict (10/min)', limit: 10, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Strict (50/min)', limit: 50, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Moderate (100/min)', limit: 100, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Relaxed (500/min)', limit: 500, timeWindow: 'per-minute' as TimeWindow },
  { label: 'Very Relaxed (1000/min)', limit: 1000, timeWindow: 'per-minute' as TimeWindow },
] as const;

/**
 * SYN limit presets for SYN flood protection
 */
export const SYN_LIMIT_PRESETS = [
  { label: 'Very Strict', synLimit: 50, burst: 5 },
  { label: 'Strict', synLimit: 100, burst: 5 },
  { label: 'Moderate', synLimit: 200, burst: 10 },
  { label: 'Relaxed', synLimit: 500, burst: 20 },
] as const;
