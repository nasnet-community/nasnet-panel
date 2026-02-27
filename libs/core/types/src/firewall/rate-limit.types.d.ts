import { z } from 'zod';
/**
 * Rate Limit Types and Schemas
 *
 * Connection rate limiting protects against DDoS attacks and connection flooding.
 * Uses MikroTik firewall filter rules with connection-rate matcher and RAW table for SYN flood protection.
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-11-implement-connection-rate-limiting.md
 */
/**
 * Rate Limit Action - What to do when rate limit is exceeded
 * Defines the action taken against connections that exceed the configured limit
 */
export declare const RateLimitActionSchema: z.ZodEnum<['drop', 'tarpit', 'add-to-list']>;
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
export declare const TimeWindowSchema: z.ZodEnum<['per-second', 'per-minute', 'per-hour']>;
/**
 * Type for time window
 * @example
 * const window: TimeWindow = 'per-minute';
 */
export type TimeWindow = z.infer<typeof TimeWindowSchema>;
/**
 * Rate Limit Rule Schema
 *
 * Defines connection rate limits per IP with configurable actions.
 * Maps to MikroTik /ip/firewall/filter rules with connection-rate matcher.
 */
export declare const RateLimitRuleSchema: z.ZodObject<
  {
    id: z.ZodOptional<z.ZodString>;
    srcAddress: z.ZodOptional<z.ZodString>;
    srcAddressList: z.ZodOptional<z.ZodString>;
    connectionLimit: z.ZodNumber;
    timeWindow: z.ZodEnum<['per-second', 'per-minute', 'per-hour']>;
    action: z.ZodEnum<['drop', 'tarpit', 'add-to-list']>;
    addressList: z.ZodOptional<z.ZodString>;
    addressListTimeout: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
    isDisabled: z.ZodDefault<z.ZodBoolean>;
    packets: z.ZodOptional<z.ZodNumber>;
    bytes: z.ZodOptional<z.ZodNumber>;
  },
  'strip',
  z.ZodTypeAny,
  {
    action: 'drop' | 'tarpit' | 'add-to-list';
    connectionLimit: number;
    timeWindow: 'per-second' | 'per-minute' | 'per-hour';
    isDisabled: boolean;
    id?: string | undefined;
    bytes?: number | undefined;
    srcAddress?: string | undefined;
    srcAddressList?: string | undefined;
    comment?: string | undefined;
    packets?: number | undefined;
    addressList?: string | undefined;
    addressListTimeout?: string | undefined;
  },
  {
    action: 'drop' | 'tarpit' | 'add-to-list';
    connectionLimit: number;
    timeWindow: 'per-second' | 'per-minute' | 'per-hour';
    id?: string | undefined;
    bytes?: number | undefined;
    srcAddress?: string | undefined;
    srcAddressList?: string | undefined;
    comment?: string | undefined;
    packets?: number | undefined;
    addressList?: string | undefined;
    addressListTimeout?: string | undefined;
    isDisabled?: boolean | undefined;
  }
>;
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
/**
 * SYN Flood Protection Configuration
 *
 * Uses MikroTik RAW firewall table for efficient SYN flood attack mitigation.
 * Processed before connection tracking for maximum performance.
 */
export declare const SynFloodConfigSchema: z.ZodObject<
  {
    isEnabled: z.ZodBoolean;
    synLimit: z.ZodNumber;
    burst: z.ZodNumber;
    action: z.ZodEnum<['drop', 'tarpit']>;
  },
  'strip',
  z.ZodTypeAny,
  {
    action: 'drop' | 'tarpit';
    burst: number;
    isEnabled: boolean;
    synLimit: number;
  },
  {
    action: 'drop' | 'tarpit';
    burst: number;
    isEnabled: boolean;
    synLimit: number;
  }
>;
/**
 * Type for SYN flood protection configuration
 * @example
 * const config: SynFloodConfig = { enabled: true, synLimit: 100, ... };
 */
export type SynFloodConfig = z.infer<typeof SynFloodConfigSchema>;
/**
 * Blocked IP Entry
 *
 * Represents an IP address that has been blocked by rate limiting rules.
 */
export declare const BlockedIPSchema: z.ZodObject<
  {
    address: z.ZodString;
    list: z.ZodString;
    blockCount: z.ZodNumber;
    firstBlocked: z.ZodOptional<z.ZodDate>;
    lastBlocked: z.ZodOptional<z.ZodDate>;
    timeout: z.ZodOptional<z.ZodString>;
    isDynamic: z.ZodBoolean;
  },
  'strip',
  z.ZodTypeAny,
  {
    list: string;
    address: string;
    blockCount: number;
    isDynamic: boolean;
    timeout?: string | undefined;
    firstBlocked?: Date | undefined;
    lastBlocked?: Date | undefined;
  },
  {
    list: string;
    address: string;
    blockCount: number;
    isDynamic: boolean;
    timeout?: string | undefined;
    firstBlocked?: Date | undefined;
    lastBlocked?: Date | undefined;
  }
>;
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
export declare const RateLimitStatsSchema: z.ZodObject<
  {
    totalBlocked: z.ZodNumber;
    topBlockedIPs: z.ZodReadonly<
      z.ZodArray<
        z.ZodObject<
          {
            address: z.ZodString;
            list: z.ZodString;
            blockCount: z.ZodNumber;
            firstBlocked: z.ZodOptional<z.ZodDate>;
            lastBlocked: z.ZodOptional<z.ZodDate>;
            timeout: z.ZodOptional<z.ZodString>;
            isDynamic: z.ZodBoolean;
          },
          'strip',
          z.ZodTypeAny,
          {
            list: string;
            address: string;
            blockCount: number;
            isDynamic: boolean;
            timeout?: string | undefined;
            firstBlocked?: Date | undefined;
            lastBlocked?: Date | undefined;
          },
          {
            list: string;
            address: string;
            blockCount: number;
            isDynamic: boolean;
            timeout?: string | undefined;
            firstBlocked?: Date | undefined;
            lastBlocked?: Date | undefined;
          }
        >,
        'many'
      >
    >;
    triggerEvents: z.ZodReadonly<
      z.ZodArray<
        z.ZodObject<
          {
            hour: z.ZodString;
            count: z.ZodNumber;
          },
          'strip',
          z.ZodTypeAny,
          {
            count: number;
            hour: string;
          },
          {
            count: number;
            hour: string;
          }
        >,
        'many'
      >
    >;
    lastUpdated: z.ZodDate;
  },
  'strip',
  z.ZodTypeAny,
  {
    lastUpdated: Date;
    totalBlocked: number;
    topBlockedIPs: readonly {
      list: string;
      address: string;
      blockCount: number;
      isDynamic: boolean;
      timeout?: string | undefined;
      firstBlocked?: Date | undefined;
      lastBlocked?: Date | undefined;
    }[];
    triggerEvents: readonly {
      count: number;
      hour: string;
    }[];
  },
  {
    lastUpdated: Date;
    totalBlocked: number;
    topBlockedIPs: readonly {
      list: string;
      address: string;
      blockCount: number;
      isDynamic: boolean;
      timeout?: string | undefined;
      firstBlocked?: Date | undefined;
      lastBlocked?: Date | undefined;
    }[];
    triggerEvents: readonly {
      count: number;
      hour: string;
    }[];
  }
>;
/**
 * Type for rate limit statistics
 * @example
 * const stats: RateLimitStats = { totalBlocked: 1000, topBlockedIPs: [...], ... };
 */
export type RateLimitStats = z.infer<typeof RateLimitStatsSchema>;
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
export declare function connectionRateToRouterOS(limit: number, timeWindow: TimeWindow): string;
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
export declare function routerOSToConnectionRate(rateString: string): {
  limit: number;
  timeWindow: TimeWindow;
} | null;
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
/**
 * Default rate limit rule template
 *
 * Used for form initialization when creating new rate limit rules.
 * All properties are read-only and provide sensible defaults for a new rate limit rule.
 *
 * @example
 * const newRule = { ...DEFAULT_RATE_LIMIT_RULE, srcAddress: '192.168.1.0/24' };
 */
export declare const DEFAULT_RATE_LIMIT_RULE: Readonly<Partial<RateLimitRule>>;
/**
 * Default SYN flood protection configuration
 *
 * Used when initializing SYN flood protection settings.
 * SYN flood protection is disabled by default with moderate protection settings.
 *
 * @example
 * const config = { ...DEFAULT_SYN_FLOOD_CONFIG, isEnabled: true };
 */
export declare const DEFAULT_SYN_FLOOD_CONFIG: Readonly<SynFloodConfig>;
/**
 * Preset timeout values for address list entries
 *
 * Common timeout durations used in address list configuration.
 * Provides quick-select options for temporary or permanent address list blocking.
 *
 * @example
 * const options = TIMEOUT_PRESETS.map(p => ({ label: p.label, value: p.value }));
 */
export declare const TIMEOUT_PRESETS: readonly [
  {
    readonly label: '1 hour';
    readonly value: '1h';
  },
  {
    readonly label: '6 hours';
    readonly value: '6h';
  },
  {
    readonly label: '1 day';
    readonly value: '1d';
  },
  {
    readonly label: '1 week';
    readonly value: '1w';
  },
  {
    readonly label: 'Permanent';
    readonly value: '';
  },
];
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
export declare const CONNECTION_LIMIT_PRESETS: readonly [
  {
    readonly label: 'Very Strict (10/min)';
    readonly limit: 10;
    readonly timeWindow: TimeWindow;
  },
  {
    readonly label: 'Strict (50/min)';
    readonly limit: 50;
    readonly timeWindow: TimeWindow;
  },
  {
    readonly label: 'Moderate (100/min)';
    readonly limit: 100;
    readonly timeWindow: TimeWindow;
  },
  {
    readonly label: 'Relaxed (500/min)';
    readonly limit: 500;
    readonly timeWindow: TimeWindow;
  },
  {
    readonly label: 'Very Relaxed (1000/min)';
    readonly limit: 1000;
    readonly timeWindow: TimeWindow;
  },
];
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
export declare const SYN_LIMIT_PRESETS: readonly [
  {
    readonly label: 'Very Strict';
    readonly synLimit: 50;
    readonly burst: 5;
  },
  {
    readonly label: 'Strict';
    readonly synLimit: 100;
    readonly burst: 5;
  },
  {
    readonly label: 'Moderate';
    readonly synLimit: 200;
    readonly burst: 10;
  },
  {
    readonly label: 'Relaxed';
    readonly synLimit: 500;
    readonly burst: 20;
  },
];
//# sourceMappingURL=rate-limit.types.d.ts.map
