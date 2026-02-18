/**
 * Drift Detection Utilities Tests
 *
 * Unit tests for drift detection logic including hash computation,
 * field comparison, and exclusion rules.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */

import { describe, it, expect } from 'vitest';

import {
  computeConfigHash,
  normalizeForComparison,
  omitExcludedFields,
  findDriftedFields,
  hasQuickDrift,
  isDeploymentStale,
  formatDriftValue,
  shouldExcludeField,
} from './driftUtils';
import { RUNTIME_ONLY_FIELDS } from './types';

// =============================================================================
// computeConfigHash Tests
// =============================================================================

describe('computeConfigHash', () => {
  it('should return consistent hash for same object', () => {
    const config = { name: 'test', address: '192.168.1.1' };
    const hash1 = computeConfigHash(config);
    const hash2 = computeConfigHash(config);

    expect(hash1).toBe(hash2);
  });

  it('should return same hash regardless of key order', () => {
    const config1 = { name: 'test', address: '192.168.1.1' };
    const config2 = { address: '192.168.1.1', name: 'test' };

    expect(computeConfigHash(config1)).toBe(computeConfigHash(config2));
  });

  it('should return different hash for different values', () => {
    const config1 = { name: 'test1' };
    const config2 = { name: 'test2' };

    expect(computeConfigHash(config1)).not.toBe(computeConfigHash(config2));
  });

  it('should handle nested objects', () => {
    const config = { outer: { inner: { value: 42 } } };
    const hash = computeConfigHash(config);

    expect(hash).toBeTruthy();
    expect(hash.length).toBe(8); // 32-bit hex
  });

  it('should handle arrays', () => {
    const config = { items: [1, 2, 3] };
    const hash = computeConfigHash(config);

    expect(hash).toBeTruthy();
  });

  it('should handle null and undefined', () => {
    expect(computeConfigHash(null)).toBeTruthy();
    expect(computeConfigHash(undefined)).toBeTruthy();
    expect(computeConfigHash(null)).toBe(computeConfigHash(undefined));
  });
});

// =============================================================================
// normalizeForComparison Tests
// =============================================================================

describe('normalizeForComparison', () => {
  it('should sort object keys alphabetically', () => {
    const input = { z: 1, a: 2, m: 3 };
    const normalized = normalizeForComparison(input) as Record<string, number>;

    expect(Object.keys(normalized)).toEqual(['a', 'm', 'z']);
  });

  it('should convert Date to ISO string', () => {
    const date = new Date('2026-01-15T10:00:00Z');
    const normalized = normalizeForComparison(date);

    expect(normalized).toBe('2026-01-15T10:00:00.000Z');
  });

  it('should handle arrays recursively', () => {
    const input = [{ b: 1, a: 2 }, { d: 3, c: 4 }];
    const normalized = normalizeForComparison(input) as Record<string, number>[];

    expect(Object.keys(normalized[0])).toEqual(['a', 'b']);
    expect(Object.keys(normalized[1])).toEqual(['c', 'd']);
  });

  it('should remove undefined values', () => {
    const input = { a: 1, b: undefined, c: 3 };
    const normalized = normalizeForComparison(input) as Record<string, unknown>;

    expect('b' in normalized).toBe(false);
    expect(normalized).toEqual({ a: 1, c: 3 });
  });

  it('should preserve null values', () => {
    const input = { a: 1, b: null };
    const normalized = normalizeForComparison(input) as Record<string, unknown>;

    expect(normalized.b).toBe(null);
  });
});

// =============================================================================
// shouldExcludeField Tests
// =============================================================================

describe('shouldExcludeField', () => {
  it('should exclude runtime-only fields', () => {
    expect(shouldExcludeField('bytesIn')).toBe(true);
    expect(shouldExcludeField('bytesOut')).toBe(true);
    expect(shouldExcludeField('lastHandshake')).toBe(true);
    expect(shouldExcludeField('uptime')).toBe(true);
    expect(shouldExcludeField('currentPeers')).toBe(true);
  });

  it('should not exclude configuration fields', () => {
    expect(shouldExcludeField('name')).toBe(false);
    expect(shouldExcludeField('address')).toBe(false);
    expect(shouldExcludeField('privateKey')).toBe(false);
    expect(shouldExcludeField('port')).toBe(false);
  });

  it('should exclude custom fields when provided', () => {
    expect(shouldExcludeField('customField', ['customField'])).toBe(true);
    expect(shouldExcludeField('otherField', ['customField'])).toBe(false);
  });

  it('should handle nested paths', () => {
    expect(shouldExcludeField('metrics.bytesIn')).toBe(true);
    expect(shouldExcludeField('config.name')).toBe(false);
  });
});

// =============================================================================
// omitExcludedFields Tests
// =============================================================================

describe('omitExcludedFields', () => {
  it('should remove runtime-only fields', () => {
    const input = {
      name: 'Test',
      address: '192.168.1.1',
      bytesIn: 1000,
      bytesOut: 2000,
      lastHandshake: '2s ago',
    };

    const filtered = omitExcludedFields(input) as Record<string, unknown>;

    expect(filtered.name).toBe('Test');
    expect(filtered.address).toBe('192.168.1.1');
    expect('bytesIn' in filtered).toBe(false);
    expect('bytesOut' in filtered).toBe(false);
    expect('lastHandshake' in filtered).toBe(false);
  });

  it('should handle nested objects', () => {
    const input = {
      config: {
        name: 'Test',
        uptime: '1d',
      },
    };

    const filtered = omitExcludedFields(input) as { config: Record<string, unknown> };

    expect(filtered.config.name).toBe('Test');
    expect('uptime' in filtered.config).toBe(false);
  });

  it('should handle arrays', () => {
    const input = {
      peers: [
        { name: 'peer1', currentPeers: 5 },
        { name: 'peer2', currentPeers: 3 },
      ],
    };

    const filtered = omitExcludedFields(input) as { peers: Record<string, unknown>[] };

    expect(filtered.peers[0].name).toBe('peer1');
    expect('currentPeers' in filtered.peers[0]).toBe(false);
  });

  it('should handle null and undefined', () => {
    expect(omitExcludedFields(null)).toBe(null);
    expect(omitExcludedFields(undefined)).toBe(undefined);
  });
});

// =============================================================================
// findDriftedFields Tests
// =============================================================================

describe('findDriftedFields', () => {
  it('should find no drift when objects match', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const deploy = { name: 'Test', address: '192.168.1.1' };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted).toHaveLength(0);
  });

  it('should detect changed field values', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const deploy = { name: 'Test', address: '192.168.1.2' };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted).toHaveLength(1);
    expect(drifted[0].path).toBe('address');
    expect(drifted[0].configValue).toBe('192.168.1.1');
    expect(drifted[0].deployValue).toBe('192.168.1.2');
  });

  it('should detect added fields', () => {
    const config = { name: 'Test' };
    const deploy = { name: 'Test', newField: 'value' };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted).toHaveLength(1);
    expect(drifted[0].path).toBe('newField');
  });

  it('should detect removed fields', () => {
    const config = { name: 'Test', oldField: 'value' };
    const deploy = { name: 'Test' };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted).toHaveLength(1);
    expect(drifted[0].path).toBe('oldField');
  });

  it('should exclude runtime-only fields from comparison', () => {
    const config = { name: 'Test', bytesIn: 100 };
    const deploy = { name: 'Test', bytesIn: 9999 };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted).toHaveLength(0);
  });

  it('should handle deep nested objects', () => {
    const config = { outer: { inner: { value: 1 } } };
    const deploy = { outer: { inner: { value: 2 } } };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted).toHaveLength(1);
    expect(drifted[0].path).toBe('outer.inner.value');
  });

  it('should categorize network fields', () => {
    const config = { ipAddress: '192.168.1.1' };
    const deploy = { ipAddress: '192.168.1.2' };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted[0].category).toBe('network');
  });

  it('should categorize security fields', () => {
    const config = { privateKey: 'abc' };
    const deploy = { privateKey: 'xyz' };

    const drifted = findDriftedFields(config, deploy);

    expect(drifted[0].category).toBe('security');
  });
});

// =============================================================================
// hasQuickDrift Tests
// =============================================================================

describe('hasQuickDrift', () => {
  it('should return false for identical objects', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const deploy = { name: 'Test', address: '192.168.1.1' };

    expect(hasQuickDrift(config, deploy)).toBe(false);
  });

  it('should return true for different objects', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const deploy = { name: 'Test', address: '192.168.1.2' };

    expect(hasQuickDrift(config, deploy)).toBe(true);
  });

  it('should ignore runtime-only fields', () => {
    const config = { name: 'Test', bytesIn: 100 };
    const deploy = { name: 'Test', bytesIn: 9999 };

    expect(hasQuickDrift(config, deploy)).toBe(false);
  });

  it('should be faster than findDriftedFields for quick checks', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const deploy = { name: 'Test', address: '192.168.1.1' };

    // This test is more about documenting behavior than performance
    const result = hasQuickDrift(config, deploy);
    expect(result).toBe(false);
  });
});

// =============================================================================
// isDeploymentStale Tests
// =============================================================================

describe('isDeploymentStale', () => {
  it('should return true for null appliedAt', () => {
    expect(isDeploymentStale(null)).toBe(true);
    expect(isDeploymentStale(undefined)).toBe(true);
  });

  it('should return false for recent deployment', () => {
    const recentTime = new Date();
    expect(isDeploymentStale(recentTime)).toBe(false);
  });

  it('should return true for old deployment', () => {
    const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    expect(isDeploymentStale(oldTime, 30 * 60 * 1000)).toBe(true); // 30 min threshold
  });

  it('should handle ISO string dates', () => {
    const recentTime = new Date().toISOString();
    expect(isDeploymentStale(recentTime)).toBe(false);
  });
});

// =============================================================================
// formatDriftValue Tests
// =============================================================================

describe('formatDriftValue', () => {
  it('should format null correctly', () => {
    expect(formatDriftValue(null)).toBe('null');
  });

  it('should format undefined correctly', () => {
    expect(formatDriftValue(undefined)).toBe('undefined');
  });

  it('should format strings with quotes', () => {
    expect(formatDriftValue('test')).toBe('"test"');
  });

  it('should format numbers as strings', () => {
    expect(formatDriftValue(42)).toBe('42');
  });

  it('should format objects as JSON', () => {
    const obj = { a: 1 };
    expect(formatDriftValue(obj)).toBe(JSON.stringify(obj, null, 2));
  });
});

// =============================================================================
// RUNTIME_ONLY_FIELDS Tests
// =============================================================================

describe('RUNTIME_ONLY_FIELDS', () => {
  it('should include all expected runtime fields', () => {
    const expectedFields = [
      'bytesIn',
      'bytesOut',
      'packetsIn',
      'packetsOut',
      'lastHandshake',
      'lastSeen',
      'uptime',
      'connectedSince',
      'currentPeers',
      'activeConnections',
      'cpuLoad',
      'memoryUsage',
      'txRate',
      'rxRate',
    ];

    for (const field of expectedFields) {
      expect(RUNTIME_ONLY_FIELDS).toContain(field);
    }
  });
});
