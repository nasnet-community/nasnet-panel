/**
 * Rate Limiting Test Fixtures
 *
 * Mock data and helper utilities for testing rate limiting components and hooks.
 * Provides realistic test data for drop, tarpit, and add-to-list rules.
 *
 * @see libs/core/types/src/firewall/rate-limit.types.ts
 */

import type {
  RateLimitRule,
  SynFloodConfig,
  BlockedIP,
  RateLimitStats,
  TimeWindow,
  RateLimitAction,
} from '@nasnet/core/types';

// ============================================================================
// Rate Limit Rules
// ============================================================================

/**
 * Basic drop rule - drops excess connections immediately
 */
export const mockDropRule: RateLimitRule = {
  id: '*1',
  connectionLimit: 100,
  timeWindow: 'per-minute',
  action: 'drop',
  comment: 'Basic rate limit protection',
  disabled: false,
  packets: 1234,
  bytes: 567890,
};

/**
 * Tarpit rule - slows down attackers
 */
export const mockTarpitRule: RateLimitRule = {
  id: '*2',
  srcAddress: '192.168.1.0/24',
  connectionLimit: 50,
  timeWindow: 'per-second',
  action: 'tarpit',
  comment: 'Tarpit suspicious subnet',
  disabled: false,
  packets: 890,
  bytes: 123456,
};

/**
 * Add-to-list rule - adds offenders to blocklist
 */
export const mockAddToListRule: RateLimitRule = {
  id: '*3',
  connectionLimit: 200,
  timeWindow: 'per-hour',
  action: 'add-to-list',
  addressList: 'rate-limited',
  addressListTimeout: '1h',
  comment: 'Block rate limit violators',
  disabled: false,
  packets: 4567,
  bytes: 2345678,
};

/**
 * Disabled rule
 */
export const mockDisabledRule: RateLimitRule = {
  id: '*4',
  connectionLimit: 75,
  timeWindow: 'per-minute',
  action: 'drop',
  comment: 'Temporarily disabled',
  disabled: true,
  packets: 0,
  bytes: 0,
};

/**
 * Rule with whitelist exclusion
 */
export const mockWhitelistRule: RateLimitRule = {
  id: '*5',
  srcAddressList: '!rate-limit-whitelist',
  connectionLimit: 150,
  timeWindow: 'per-minute',
  action: 'add-to-list',
  addressList: 'ddos-attackers',
  addressListTimeout: '1d',
  comment: 'DDoS protection with whitelist bypass',
  disabled: false,
  packets: 8901,
  bytes: 4567890,
};

/**
 * Very strict rule - per second limit
 */
export const mockStrictRule: RateLimitRule = {
  id: '*6',
  connectionLimit: 10,
  timeWindow: 'per-second',
  action: 'drop',
  comment: 'Very strict rate limit',
  disabled: false,
  packets: 12345,
  bytes: 6789012,
};

/**
 * Rule for specific IP
 */
export const mockSpecificIPRule: RateLimitRule = {
  id: '*7',
  srcAddress: '203.0.113.50',
  connectionLimit: 5,
  timeWindow: 'per-second',
  action: 'tarpit',
  comment: 'Rate limit known attacker',
  disabled: false,
  packets: 23456,
  bytes: 12345678,
};

/**
 * All mock rules combined
 */
export const mockRateLimitRules: RateLimitRule[] = [
  mockDropRule,
  mockTarpitRule,
  mockAddToListRule,
  mockDisabledRule,
  mockWhitelistRule,
  mockStrictRule,
  mockSpecificIPRule,
];

/**
 * Empty rule input for form testing
 */
export const emptyRuleInput = {
  connectionLimit: 100,
  timeWindow: 'per-minute' as TimeWindow,
  action: 'drop' as RateLimitAction,
};

// ============================================================================
// SYN Flood Configuration
// ============================================================================

/**
 * Enabled SYN flood protection (drop action)
 */
export const mockSynFloodDrop: SynFloodConfig = {
  enabled: true,
  synLimit: 100,
  burst: 5,
  action: 'drop',
};

/**
 * Enabled SYN flood protection (tarpit action)
 */
export const mockSynFloodTarpit: SynFloodConfig = {
  enabled: true,
  synLimit: 200,
  burst: 10,
  action: 'tarpit',
};

/**
 * Disabled SYN flood protection
 */
export const mockSynFloodDisabled: SynFloodConfig = {
  enabled: false,
  synLimit: 100,
  burst: 5,
  action: 'drop',
};

/**
 * Strict SYN flood protection
 */
export const mockSynFloodStrict: SynFloodConfig = {
  enabled: true,
  synLimit: 50,
  burst: 5,
  action: 'drop',
};

// ============================================================================
// Blocked IPs
// ============================================================================

/**
 * Dynamic blocked IP (recently added by rule)
 */
export const mockBlockedIP1: BlockedIP = {
  address: '192.168.1.100',
  list: 'rate-limited',
  blockCount: 15,
  firstBlocked: new Date('2025-01-10T10:00:00Z'),
  lastBlocked: new Date('2025-01-10T12:30:00Z'),
  timeout: '1h',
  dynamic: true,
};

/**
 * Permanent blocked IP
 */
export const mockBlockedIP2: BlockedIP = {
  address: '203.0.113.25',
  list: 'ddos-attackers',
  blockCount: 150,
  firstBlocked: new Date('2025-01-05T08:00:00Z'),
  lastBlocked: new Date('2025-01-10T15:45:00Z'),
  timeout: '',
  dynamic: false,
};

/**
 * Recently blocked IP with high count
 */
export const mockBlockedIP3: BlockedIP = {
  address: '10.0.0.50',
  list: 'rate-limited',
  blockCount: 75,
  firstBlocked: new Date('2025-01-10T14:00:00Z'),
  lastBlocked: new Date('2025-01-10T14:30:00Z'),
  timeout: '6h',
  dynamic: true,
};

/**
 * Long-term blocked IP
 */
export const mockBlockedIP4: BlockedIP = {
  address: '172.16.0.10',
  list: 'ddos-attackers',
  blockCount: 300,
  firstBlocked: new Date('2025-01-01T00:00:00Z'),
  lastBlocked: new Date('2025-01-10T16:00:00Z'),
  timeout: '1w',
  dynamic: true,
};

/**
 * IPv6 blocked IP
 */
export const mockBlockedIP5: BlockedIP = {
  address: '2001:db8::1',
  list: 'rate-limited',
  blockCount: 25,
  firstBlocked: new Date('2025-01-10T11:00:00Z'),
  lastBlocked: new Date('2025-01-10T13:00:00Z'),
  timeout: '1d',
  dynamic: true,
};

/**
 * All mock blocked IPs
 */
export const mockBlockedIPs: BlockedIP[] = [
  mockBlockedIP1,
  mockBlockedIP2,
  mockBlockedIP3,
  mockBlockedIP4,
  mockBlockedIP5,
];

/**
 * Top 10 blocked IPs (sorted by block count descending)
 */
export const mockTopBlockedIPs = [
  mockBlockedIP4, // 300 blocks
  mockBlockedIP2, // 150 blocks
  mockBlockedIP3, // 75 blocks
  mockBlockedIP5, // 25 blocks
  mockBlockedIP1, // 15 blocks
];

// ============================================================================
// Statistics
// ============================================================================

/**
 * Statistics with activity
 */
export const mockStatsWithActivity: RateLimitStats = {
  totalBlocked: 565, // Sum of all blocked IPs
  topBlockedIPs: mockTopBlockedIPs.slice(0, 10),
  triggerEvents: [
    { hour: '00:00', count: 10 },
    { hour: '01:00', count: 15 },
    { hour: '02:00', count: 20 },
    { hour: '03:00', count: 5 },
    { hour: '04:00', count: 8 },
    { hour: '05:00', count: 12 },
    { hour: '06:00', count: 25 },
    { hour: '07:00', count: 30 },
    { hour: '08:00', count: 45 },
    { hour: '09:00', count: 60 },
    { hour: '10:00', count: 80 },
    { hour: '11:00', count: 100 },
    { hour: '12:00', count: 120 },
    { hour: '13:00', count: 90 },
    { hour: '14:00', count: 75 },
    { hour: '15:00', count: 60 },
    { hour: '16:00', count: 50 },
    { hour: '17:00', count: 40 },
    { hour: '18:00', count: 35 },
    { hour: '19:00', count: 30 },
    { hour: '20:00', count: 25 },
    { hour: '21:00', count: 20 },
    { hour: '22:00', count: 15 },
    { hour: '23:00', count: 10 },
  ],
  lastUpdated: new Date('2025-01-10T16:00:00Z'),
};

/**
 * Empty statistics (no blocked IPs)
 */
export const mockStatsEmpty: RateLimitStats = {
  totalBlocked: 0,
  topBlockedIPs: [],
  triggerEvents: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: 0,
  })),
  lastUpdated: new Date(),
};

/**
 * Statistics with only recent activity
 */
export const mockStatsRecent: RateLimitStats = {
  totalBlocked: 50,
  topBlockedIPs: [mockBlockedIP1, mockBlockedIP3],
  triggerEvents: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: i > 20 ? 25 : 0, // Activity in last 3 hours
  })),
  lastUpdated: new Date(),
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock rule with custom values
 */
export function createMockRule(
  overrides: Partial<RateLimitRule> = {}
): RateLimitRule {
  return {
    id: `*${Math.floor(Math.random() * 1000)}`,
    connectionLimit: 100,
    timeWindow: 'per-minute',
    action: 'drop',
    disabled: false,
    packets: 0,
    bytes: 0,
    ...overrides,
  };
}

/**
 * Create a mock blocked IP with custom values
 */
export function createMockBlockedIP(
  overrides: Partial<BlockedIP> = {}
): BlockedIP {
  return {
    address: `192.168.1.${Math.floor(Math.random() * 255)}`,
    list: 'rate-limited',
    blockCount: Math.floor(Math.random() * 100),
    dynamic: true,
    ...overrides,
  };
}

/**
 * Create a mock SYN flood config with custom values
 */
export function createMockSynFloodConfig(
  overrides: Partial<SynFloodConfig> = {}
): SynFloodConfig {
  return {
    enabled: true,
    synLimit: 100,
    burst: 5,
    action: 'drop',
    ...overrides,
  };
}

/**
 * Generate multiple mock rules
 */
export function generateMockRules(
  count: number,
  generator: (index: number) => Partial<RateLimitRule> = () => ({})
): RateLimitRule[] {
  return Array.from({ length: count }, (_, i) =>
    createMockRule({
      id: `*${i + 1}`,
      ...generator(i),
    })
  );
}

/**
 * Generate multiple mock blocked IPs
 */
export function generateMockBlockedIPs(
  count: number,
  generator: (index: number) => Partial<BlockedIP> = () => ({})
): BlockedIP[] {
  return Array.from({ length: count }, (_, i) =>
    createMockBlockedIP({
      address: `192.168.1.${i + 1}`,
      ...generator(i),
    })
  );
}

/**
 * Simulate trigger events for last N hours
 */
export function generateTriggerEvents(
  hours: number,
  pattern: 'increasing' | 'decreasing' | 'random' | 'peak' = 'random'
): Array<{ hour: string; count: number }> {
  return Array.from({ length: hours }, (_, i) => {
    let count = 0;
    switch (pattern) {
      case 'increasing':
        count = i * 5;
        break;
      case 'decreasing':
        count = (hours - i) * 5;
        break;
      case 'peak':
        count = Math.abs(Math.sin((i / hours) * Math.PI)) * 100;
        break;
      case 'random':
      default:
        count = Math.floor(Math.random() * 100);
    }

    return {
      hour: `${String(i).padStart(2, '0')}:00`,
      count: Math.floor(count),
    };
  });
}
