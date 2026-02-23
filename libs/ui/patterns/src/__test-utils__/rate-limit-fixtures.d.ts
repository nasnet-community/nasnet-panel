/**
 * Rate Limiting Test Fixtures
 *
 * Mock data and helper utilities for testing rate limiting components and hooks.
 * Provides realistic test data for drop, tarpit, and add-to-list rules, SYN flood configs,
 * blocked IPs, and statistics.
 *
 * Fixture Categories:
 * - Rate Limit Rules (7 predefined rules covering all action types)
 * - SYN Flood Configurations (4 config presets)
 * - Blocked IPs (5 examples with varying block counts and timeouts)
 * - Statistics (activity patterns, trend data)
 * - Helper functions (generate custom fixtures with defaults)
 *
 * Usage in Tests:
 * ```tsx
 * import { mockRateLimitRules, generateMockRules, mockStatsWithActivity } from './rate-limit-fixtures';
 *
 * test('sorts rules by connection limit', () => {
 *   const rules = mockRateLimitRules;
 *   // Test sorting logic
 * });
 *
 * test('renders 100 rules without lag', () => {
 *   const manyRules = generateMockRules(100);
 *   render(<RateLimitTable rules={manyRules} />);
 * });
 * ```
 *
 * @see libs/core/types/src/firewall/rate-limit.types.ts for type definitions
 * @see libs/features/firewall/src/components/RateLimitingPage.tsx for component usage
 */
import type { RateLimitRule, SynFloodConfig, BlockedIP, RateLimitStats, TimeWindow, RateLimitAction } from '@nasnet/core/types';
export type { RateLimitRule, SynFloodConfig, BlockedIP, RateLimitStats, TimeWindow, RateLimitAction, } from '@nasnet/core/types';
/**
 * Basic drop rule - drops excess connections immediately
 */
export declare const mockDropRule: RateLimitRule;
/**
 * Tarpit rule - slows down attackers
 */
export declare const mockTarpitRule: RateLimitRule;
/**
 * Add-to-list rule - adds offenders to blocklist
 */
export declare const mockAddToListRule: RateLimitRule;
/**
 * Disabled rule
 */
export declare const mockDisabledRule: RateLimitRule;
/**
 * Rule with whitelist exclusion
 */
export declare const mockWhitelistRule: RateLimitRule;
/**
 * Very strict rule - per second limit
 */
export declare const mockStrictRule: RateLimitRule;
/**
 * Rule for specific IP
 */
export declare const mockSpecificIPRule: RateLimitRule;
/**
 * All mock rules combined
 */
export declare const mockRateLimitRules: RateLimitRule[];
/**
 * Empty rule input for form testing
 */
export declare const emptyRuleInput: {
    connectionLimit: number;
    timeWindow: TimeWindow;
    action: RateLimitAction;
};
/**
 * Enabled SYN flood protection (drop action)
 */
export declare const mockSynFloodDrop: SynFloodConfig;
/**
 * Enabled SYN flood protection (tarpit action)
 */
export declare const mockSynFloodTarpit: SynFloodConfig;
/**
 * Disabled SYN flood protection
 */
export declare const mockSynFloodDisabled: SynFloodConfig;
/**
 * Strict SYN flood protection
 */
export declare const mockSynFloodStrict: SynFloodConfig;
/**
 * Dynamic blocked IP (recently added by rule)
 */
export declare const mockBlockedIP1: BlockedIP;
/**
 * Permanent blocked IP
 */
export declare const mockBlockedIP2: BlockedIP;
/**
 * Recently blocked IP with high count
 */
export declare const mockBlockedIP3: BlockedIP;
/**
 * Long-term blocked IP
 */
export declare const mockBlockedIP4: BlockedIP;
/**
 * IPv6 blocked IP
 */
export declare const mockBlockedIP5: BlockedIP;
/**
 * All mock blocked IPs
 */
export declare const mockBlockedIPs: BlockedIP[];
/**
 * Top 10 blocked IPs (sorted by block count descending)
 */
export declare const mockTopBlockedIPs: {
    list: string;
    address: string;
    blockCount: number;
    isDynamic: boolean;
    timeout?: string | undefined;
    firstBlocked?: Date | undefined;
    lastBlocked?: Date | undefined;
}[];
/**
 * Statistics with activity
 */
export declare const mockStatsWithActivity: RateLimitStats;
/**
 * Empty statistics (no blocked IPs)
 */
export declare const mockStatsEmpty: RateLimitStats;
/**
 * Statistics with only recent activity
 */
export declare const mockStatsRecent: RateLimitStats;
/**
 * Create a mock rule with custom values
 */
export declare function createMockRule(overrides?: Partial<RateLimitRule>): RateLimitRule;
/**
 * Create a mock blocked IP with custom values
 */
export declare function createMockBlockedIP(overrides?: Partial<BlockedIP>): BlockedIP;
/**
 * Create a mock SYN flood config with custom values
 */
export declare function createMockSynFloodConfig(overrides?: Partial<SynFloodConfig>): SynFloodConfig;
/**
 * Generate multiple mock rules
 */
export declare function generateMockRules(count: number, generator?: (index: number) => Partial<RateLimitRule>): RateLimitRule[];
/**
 * Generate multiple mock blocked IPs
 */
export declare function generateMockBlockedIPs(count: number, generator?: (index: number) => Partial<BlockedIP>): BlockedIP[];
/**
 * Simulate trigger events for last N hours
 */
export declare function generateTriggerEvents(hours: number, pattern?: 'increasing' | 'decreasing' | 'random' | 'peak'): Array<{
    hour: string;
    count: number;
}>;
//# sourceMappingURL=rate-limit-fixtures.d.ts.map