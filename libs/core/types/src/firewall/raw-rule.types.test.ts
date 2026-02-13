/**
 * RAW Rule Types and Schemas - Tests
 *
 * Test coverage for RAW firewall rule types and Zod schemas.
 * RAW rules operate before connection tracking (pre-conntrack).
 */

import { describe, it, expect } from 'vitest';
import {
  RawRuleSchema,
  RawChainSchema,
  RawActionSchema,
  isValidIPAddress,
  isValidPortRange,
  getRequiredFieldsForRawAction,
  getVisibleFieldsForRawAction,
  chainAllowsOutInterface,
  chainAllowsInInterface,
  getActionColor,
  getActionDescription,
  generateRulePreview,
  DEFAULT_RAW_RULE,
} from './raw-rule.types';
import type { RawRule, RawChain, RawAction } from './raw-rule.types';

// ============================================================================
// Enum Schema Tests
// ============================================================================

describe('RawChainSchema', () => {
  it('should accept valid RAW chains', () => {
    expect(RawChainSchema.parse('prerouting')).toBe('prerouting');
    expect(RawChainSchema.parse('output')).toBe('output');
  });

  it('should reject invalid chains', () => {
    expect(() => RawChainSchema.parse('input')).toThrow();
    expect(() => RawChainSchema.parse('forward')).toThrow();
    expect(() => RawChainSchema.parse('postrouting')).toThrow();
    expect(() => RawChainSchema.parse('invalid')).toThrow();
  });
});

describe('RawActionSchema', () => {
  it('should accept valid RAW actions', () => {
    expect(RawActionSchema.parse('drop')).toBe('drop');
    expect(RawActionSchema.parse('accept')).toBe('accept');
    expect(RawActionSchema.parse('notrack')).toBe('notrack');
    expect(RawActionSchema.parse('jump')).toBe('jump');
    expect(RawActionSchema.parse('log')).toBe('log');
  });

  it('should reject invalid actions', () => {
    expect(() => RawActionSchema.parse('reject')).toThrow();
    expect(() => RawActionSchema.parse('tarpit')).toThrow();
    expect(() => RawActionSchema.parse('invalid')).toThrow();
  });
});

// ============================================================================
// RawRule Schema Tests
// ============================================================================

describe('RawRuleSchema', () => {
  it('should accept valid minimal RAW rule', () => {
    const rule: Partial<RawRule> = {
      chain: 'prerouting',
      action: 'drop',
    };

    const parsed = RawRuleSchema.parse(rule);
    expect(parsed.chain).toBe('prerouting');
    expect(parsed.action).toBe('drop');
    expect(parsed.disabled).toBe(false); // Default
  });

  it('should accept RAW rule with all matchers', () => {
    const rule: Partial<RawRule> = {
      chain: 'prerouting',
      action: 'drop',
      protocol: 'tcp',
      srcAddress: '192.168.1.0/24',
      dstAddress: '10.0.0.1',
      srcPort: '1024-65535',
      dstPort: '80',
      inInterface: 'ether1',
      comment: 'Block malicious traffic',
    };

    const parsed = RawRuleSchema.parse(rule);
    expect(parsed.protocol).toBe('tcp');
    expect(parsed.srcAddress).toBe('192.168.1.0/24');
    expect(parsed.dstAddress).toBe('10.0.0.1');
    expect(parsed.srcPort).toBe('1024-65535');
    expect(parsed.dstPort).toBe('80');
    expect(parsed.inInterface).toBe('ether1');
  });

  it('should accept RAW rule with rate limiting', () => {
    const rule: Partial<RawRule> = {
      chain: 'prerouting',
      action: 'drop',
      protocol: 'tcp',
      dstPort: '22',
      limit: {
        rate: '10/minute',
        burst: 5,
      },
    };

    const parsed = RawRuleSchema.parse(rule);
    expect(parsed.limit).toBeDefined();
    expect(parsed.limit?.rate).toBe('10/minute');
    expect(parsed.limit?.burst).toBe(5);
  });

  it('should accept jump action with target', () => {
    const rule: Partial<RawRule> = {
      chain: 'prerouting',
      action: 'jump',
      jumpTarget: 'custom-chain',
    };

    const parsed = RawRuleSchema.parse(rule);
    expect(parsed.action).toBe('jump');
    expect(parsed.jumpTarget).toBe('custom-chain');
  });

  it('should accept log action with prefix', () => {
    const rule: Partial<RawRule> = {
      chain: 'prerouting',
      action: 'log',
      logPrefix: 'RAW-DROP',
    };

    const parsed = RawRuleSchema.parse(rule);
    expect(parsed.action).toBe('log');
    expect(parsed.logPrefix).toBe('RAW-DROP');
  });

  it('should reject invalid IP address', () => {
    const rule = {
      chain: 'prerouting',
      action: 'drop',
      srcAddress: '999.999.999.999',
    };

    expect(() => RawRuleSchema.parse(rule)).toThrow();
  });

  it('should reject invalid port range', () => {
    const rule = {
      chain: 'prerouting',
      action: 'drop',
      srcPort: '99999',
    };

    expect(() => RawRuleSchema.parse(rule)).toThrow();
  });

  it('should enforce logPrefix validation', () => {
    // Log prefix with invalid characters
    const rule1 = {
      chain: 'prerouting',
      action: 'log',
      logPrefix: 'RAW DROP!', // spaces/special chars not allowed
    };
    expect(() => RawRuleSchema.parse(rule1)).toThrow();

    // Log prefix too long
    const rule2 = {
      chain: 'prerouting',
      action: 'log',
      logPrefix: 'A'.repeat(51), // Max 50 chars
    };
    expect(() => RawRuleSchema.parse(rule2)).toThrow();
  });

  it('should validate chain-specific interface restrictions', () => {
    // prerouting allows inInterface, not outInterface
    const rule1 = {
      chain: 'prerouting',
      action: 'drop',
      outInterface: 'ether1',
    };
    expect(() => RawRuleSchema.parse(rule1)).toThrow();

    // output allows outInterface, not inInterface
    const rule2 = {
      chain: 'output',
      action: 'drop',
      inInterface: 'ether1',
    };
    expect(() => RawRuleSchema.parse(rule2)).toThrow();
  });
});

// ============================================================================
// Validation Helper Tests
// ============================================================================

describe('isValidIPAddress', () => {
  it('should validate IPv4 addresses', () => {
    expect(isValidIPAddress('192.168.1.1')).toBe(true);
    expect(isValidIPAddress('10.0.0.0')).toBe(true);
    expect(isValidIPAddress('255.255.255.255')).toBe(true);
  });

  it('should validate CIDR notation', () => {
    expect(isValidIPAddress('192.168.1.0/24')).toBe(true);
    expect(isValidIPAddress('10.0.0.0/8')).toBe(true);
    expect(isValidIPAddress('172.16.0.0/12')).toBe(true);
  });

  it('should reject invalid IP addresses', () => {
    expect(isValidIPAddress('999.999.999.999')).toBe(false);
    expect(isValidIPAddress('192.168.1')).toBe(false);
    expect(isValidIPAddress('192.168.1.1/33')).toBe(false);
    expect(isValidIPAddress('not-an-ip')).toBe(false);
  });
});

describe('isValidPortRange', () => {
  it('should validate single ports', () => {
    expect(isValidPortRange('80')).toBe(true);
    expect(isValidPortRange('443')).toBe(true);
    expect(isValidPortRange('65535')).toBe(true);
  });

  it('should validate port ranges', () => {
    expect(isValidPortRange('80-443')).toBe(true);
    expect(isValidPortRange('1024-65535')).toBe(true);
  });

  it('should reject invalid ports', () => {
    expect(isValidPortRange('0')).toBe(false);
    expect(isValidPortRange('99999')).toBe(false);
    expect(isValidPortRange('443-80')).toBe(false); // Reversed range
    expect(isValidPortRange('not-a-port')).toBe(false);
  });
});

// ============================================================================
// Action Helper Tests
// ============================================================================

describe('getRequiredFieldsForRawAction', () => {
  it('should return required fields for jump action', () => {
    expect(getRequiredFieldsForRawAction('jump')).toEqual(['jumpTarget']);
  });

  it('should return required fields for log action', () => {
    expect(getRequiredFieldsForRawAction('log')).toEqual(['logPrefix']);
  });

  it('should return empty array for actions without required fields', () => {
    expect(getRequiredFieldsForRawAction('drop')).toEqual([]);
    expect(getRequiredFieldsForRawAction('accept')).toEqual([]);
    expect(getRequiredFieldsForRawAction('notrack')).toEqual([]);
  });
});

describe('getVisibleFieldsForRawAction', () => {
  it('should return visible fields for jump action', () => {
    expect(getVisibleFieldsForRawAction('jump')).toEqual(['jumpTarget']);
  });

  it('should return visible fields for log action', () => {
    expect(getVisibleFieldsForRawAction('log')).toEqual(['logPrefix']);
  });

  it('should return empty array for terminal actions', () => {
    expect(getVisibleFieldsForRawAction('drop')).toEqual([]);
    expect(getVisibleFieldsForRawAction('accept')).toEqual([]);
    expect(getVisibleFieldsForRawAction('notrack')).toEqual([]);
  });
});

// ============================================================================
// Chain Helper Tests
// ============================================================================

describe('chainAllowsOutInterface', () => {
  it('should allow outInterface for output chain', () => {
    expect(chainAllowsOutInterface('output')).toBe(true);
  });

  it('should not allow outInterface for prerouting chain', () => {
    expect(chainAllowsOutInterface('prerouting')).toBe(false);
  });
});

describe('chainAllowsInInterface', () => {
  it('should allow inInterface for prerouting chain', () => {
    expect(chainAllowsInInterface('prerouting')).toBe(true);
  });

  it('should not allow inInterface for output chain', () => {
    expect(chainAllowsInInterface('output')).toBe(false);
  });
});

// ============================================================================
// Display Helper Tests
// ============================================================================

describe('getActionColor', () => {
  it('should return correct semantic colors', () => {
    expect(getActionColor('accept')).toBe('success');
    expect(getActionColor('drop')).toBe('error');
    expect(getActionColor('notrack')).toBe('warning');
    expect(getActionColor('log')).toBe('info');
    expect(getActionColor('jump')).toBe('warning');
  });
});

describe('getActionDescription', () => {
  it('should return descriptions for all actions', () => {
    expect(getActionDescription('accept')).toContain('Allow');
    expect(getActionDescription('drop')).toContain('discard');
    expect(getActionDescription('notrack')).toContain('connection tracking');
    expect(getActionDescription('log')).toContain('Log');
    expect(getActionDescription('jump')).toContain('Jump');
  });
});

describe('generateRulePreview', () => {
  it('should generate preview for basic rule', () => {
    const rule: Partial<RawRule> = {
      action: 'drop',
      protocol: 'tcp',
      dstPort: '22',
    };

    const preview = generateRulePreview(rule);
    expect(preview).toContain('DROP');
    expect(preview).toContain('TCP');
    expect(preview).toContain('22');
  });

  it('should generate preview with source and destination', () => {
    const rule: Partial<RawRule> = {
      action: 'drop',
      srcAddress: '192.168.1.0/24',
      dstAddress: '10.0.0.1',
    };

    const preview = generateRulePreview(rule);
    expect(preview).toContain('192.168.1.0/24');
    expect(preview).toContain('10.0.0.1');
  });

  it('should generate preview with interface', () => {
    const rule: Partial<RawRule> = {
      action: 'notrack',
      inInterface: 'ether1',
    };

    const preview = generateRulePreview(rule);
    expect(preview).toContain('NOTRACK');
    expect(preview).toContain('ether1');
  });

  it('should return fallback for empty rule', () => {
    const preview = generateRulePreview({});
    expect(preview).toBe('New RAW rule');
  });
});

// ============================================================================
// Default Values Tests
// ============================================================================

describe('DEFAULT_RAW_RULE', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_RAW_RULE.chain).toBe('prerouting');
    expect(DEFAULT_RAW_RULE.action).toBe('notrack');
    expect(DEFAULT_RAW_RULE.disabled).toBe(false);
  });

  it('should be valid according to schema', () => {
    expect(() => RawRuleSchema.parse(DEFAULT_RAW_RULE)).not.toThrow();
  });
});
