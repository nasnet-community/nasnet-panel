import { describe, it, expect } from 'vitest';
import {
  FilterRuleSchema,
  FilterChainSchema,
  FilterActionSchema,
  FilterProtocolSchema,
  isValidIPAddress,
  isValidPortRange,
  chainAllowsOutInterface,
  chainAllowsInInterface,
  getActionColor,
  generateRulePreview,
  DEFAULT_FILTER_RULE,
} from './filter-rule.types';

describe('FilterRuleSchema', () => {
  describe('Basic validation', () => {
    it('should validate a minimal filter rule', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should validate a complete filter rule', () => {
      const rule = {
        id: 'rule-1',
        chain: 'forward' as const,
        action: 'drop' as const,
        protocol: 'tcp' as const,
        srcAddress: '192.168.1.0/24',
        dstAddress: '10.0.0.1',
        srcPort: '1024-65535',
        dstPort: '22',
        inInterface: 'ether1',
        outInterface: 'ether2',
        connectionState: ['new', 'established'] as ('established' | 'new' | 'related' | 'invalid' | 'untracked')[],
        comment: 'Block SSH from internal network',
        disabled: false,
        log: true,
        logPrefix: 'SSH-BLOCK',
        packets: 100,
        bytes: 50000,
        order: 1,
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
      };

      const result = FilterRuleSchema.parse(rule);
      expect(result.disabled).toBe(false);
      expect(result.log).toBe(false);
    });
  });

  describe('IP address validation', () => {
    it('should accept valid IPv4 addresses', () => {
      const validIPs = ['192.168.1.1', '10.0.0.0', '172.16.0.1', '255.255.255.255'];

      validIPs.forEach(ip => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          srcAddress: ip,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid CIDR notation', () => {
      const validCIDRs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '192.168.1.0/24'];

      validCIDRs.forEach(cidr => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          srcAddress: cidr,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid IP addresses', () => {
      const invalidIPs = ['256.1.1.1', '192.168.1', '192.168.1.1.1', 'invalid'];

      invalidIPs.forEach(ip => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          srcAddress: ip,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid CIDR notation', () => {
      const invalidCIDRs = ['192.168.1.0/33', '192.168.1.0/-1', '192.168.1.0/abc'];

      invalidCIDRs.forEach(cidr => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          srcAddress: cidr,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Port validation', () => {
    it('should accept valid single ports', () => {
      const validPorts = ['1', '80', '443', '8080', '65535'];

      validPorts.forEach(port => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          dstPort: port,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid port ranges', () => {
      const validRanges = ['1-65535', '80-443', '8000-9000', '1024-32768'];

      validRanges.forEach(range => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          dstPort: range,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid ports', () => {
      const invalidPorts = ['0', '65536', '99999', 'abc', '80-'];

      invalidPorts.forEach(port => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          dstPort: port,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid port ranges', () => {
      const invalidRanges = ['443-80', '100-100', '65535-65536'];

      invalidRanges.forEach(range => {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          dstPort: range,
        };
        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Chain-specific validation', () => {
    it('should reject outInterface on input chain', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        outInterface: 'ether1',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('outInterface');
    });

    it('should reject outInterfaceList on input chain', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        outInterfaceList: 'WAN',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });

    it('should accept outInterface on forward chain', () => {
      const rule = {
        chain: 'forward' as const,
        action: 'accept' as const,
        outInterface: 'ether1',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should reject inInterface on output chain', () => {
      const rule = {
        chain: 'output' as const,
        action: 'accept' as const,
        inInterface: 'ether1',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('inInterface');
    });

    it('should reject inInterfaceList on output chain', () => {
      const rule = {
        chain: 'output' as const,
        action: 'accept' as const,
        inInterfaceList: 'LAN',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });
  });

  describe('Logging validation', () => {
    it('should require logPrefix when log is enabled', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: true,
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('logPrefix');
    });

    it('should accept logPrefix when log is enabled', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: true,
        logPrefix: 'TEST',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should accept rule without logPrefix when log is disabled', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: false,
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });
  });

  describe('String length validation', () => {
    it('should reject comment longer than 255 characters', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        comment: 'a'.repeat(256),
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });

    it('should reject logPrefix longer than 50 characters', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: true,
        logPrefix: 'a'.repeat(51),
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });

    it('should reject logPrefix with invalid characters (spaces)', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: true,
        logPrefix: 'FIREWALL DROP',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('alphanumeric');
      }
    });

    it('should reject logPrefix with invalid characters (colons)', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: true,
        logPrefix: 'FIREWALL:DROP',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });

    it('should accept valid logPrefix with hyphens', () => {
      const rule = {
        chain: 'input' as const,
        action: 'accept' as const,
        log: true,
        logPrefix: 'FIREWALL-DROP-123',
      };

      const result = FilterRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should accept suggested log prefix patterns', () => {
      const prefixes = ['DROPPED-', 'ACCEPTED-', 'REJECTED-', 'FIREWALL-'];

      for (const prefix of prefixes) {
        const rule = {
          chain: 'input' as const,
          action: 'accept' as const,
          log: true,
          logPrefix: prefix,
        };

        const result = FilterRuleSchema.safeParse(rule);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('Enum schemas', () => {
  it('should validate FilterChainSchema', () => {
    expect(FilterChainSchema.safeParse('input').success).toBe(true);
    expect(FilterChainSchema.safeParse('forward').success).toBe(true);
    expect(FilterChainSchema.safeParse('output').success).toBe(true);
    expect(FilterChainSchema.safeParse('invalid').success).toBe(false);
  });

  it('should validate FilterActionSchema', () => {
    expect(FilterActionSchema.safeParse('accept').success).toBe(true);
    expect(FilterActionSchema.safeParse('drop').success).toBe(true);
    expect(FilterActionSchema.safeParse('reject').success).toBe(true);
    expect(FilterActionSchema.safeParse('log').success).toBe(true);
    expect(FilterActionSchema.safeParse('invalid').success).toBe(false);
  });

  it('should validate FilterProtocolSchema', () => {
    expect(FilterProtocolSchema.safeParse('tcp').success).toBe(true);
    expect(FilterProtocolSchema.safeParse('udp').success).toBe(true);
    expect(FilterProtocolSchema.safeParse('icmp').success).toBe(true);
    expect(FilterProtocolSchema.safeParse('all').success).toBe(true);
    expect(FilterProtocolSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('Validation helper functions', () => {
  describe('isValidIPAddress', () => {
    it('should validate IPv4 addresses', () => {
      expect(isValidIPAddress('192.168.1.1')).toBe(true);
      expect(isValidIPAddress('10.0.0.0')).toBe(true);
      expect(isValidIPAddress('256.1.1.1')).toBe(false);
      expect(isValidIPAddress('invalid')).toBe(false);
    });

    it('should validate CIDR notation', () => {
      expect(isValidIPAddress('192.168.1.0/24')).toBe(true);
      expect(isValidIPAddress('10.0.0.0/8')).toBe(true);
      expect(isValidIPAddress('192.168.1.0/33')).toBe(false);
    });
  });

  describe('isValidPortRange', () => {
    it('should validate single ports', () => {
      expect(isValidPortRange('80')).toBe(true);
      expect(isValidPortRange('443')).toBe(true);
      expect(isValidPortRange('0')).toBe(false);
      expect(isValidPortRange('65536')).toBe(false);
    });

    it('should validate port ranges', () => {
      expect(isValidPortRange('80-443')).toBe(true);
      expect(isValidPortRange('1024-65535')).toBe(true);
      expect(isValidPortRange('443-80')).toBe(false);
      expect(isValidPortRange('100-100')).toBe(false);
    });
  });

  describe('chainAllowsOutInterface', () => {
    it('should return false for input chain', () => {
      expect(chainAllowsOutInterface('input')).toBe(false);
    });

    it('should return true for forward chain', () => {
      expect(chainAllowsOutInterface('forward')).toBe(true);
    });

    it('should return true for output chain', () => {
      expect(chainAllowsOutInterface('output')).toBe(true);
    });
  });

  describe('chainAllowsInInterface', () => {
    it('should return true for input chain', () => {
      expect(chainAllowsInInterface('input')).toBe(true);
    });

    it('should return true for forward chain', () => {
      expect(chainAllowsInInterface('forward')).toBe(true);
    });

    it('should return false for output chain', () => {
      expect(chainAllowsInInterface('output')).toBe(false);
    });
  });
});

describe('Display helper functions', () => {
  describe('getActionColor', () => {
    it('should return correct colors for actions', () => {
      expect(getActionColor('accept')).toBe('success');
      expect(getActionColor('drop')).toBe('error');
      expect(getActionColor('reject')).toBe('error');
      expect(getActionColor('log')).toBe('info');
      expect(getActionColor('jump')).toBe('warning');
      expect(getActionColor('passthrough')).toBe('warning');
    });
  });

  describe('generateRulePreview', () => {
    it('should generate preview for simple rule', () => {
      const rule = {
        action: 'accept' as const,
        protocol: 'tcp' as const,
        dstPort: '22',
      };

      const preview = generateRulePreview(rule);
      expect(preview).toContain('ACCEPT');
      expect(preview).toContain('TCP');
      expect(preview).toContain('22');
    });

    it('should generate preview with source and destination', () => {
      const rule = {
        action: 'drop' as const,
        protocol: 'tcp' as const,
        srcAddress: '192.168.1.0/24',
        dstAddress: '10.0.0.1',
        dstPort: '22',
      };

      const preview = generateRulePreview(rule);
      expect(preview).toContain('DROP');
      expect(preview).toContain('from 192.168.1.0/24');
      expect(preview).toContain('to 10.0.0.1');
      expect(preview).toContain('dport 22');
    });

    it('should generate preview with address lists', () => {
      const rule = {
        action: 'accept' as const,
        srcAddressList: 'TRUSTED',
        dstAddressList: 'SERVERS',
      };

      const preview = generateRulePreview(rule);
      expect(preview).toContain('list:TRUSTED');
      expect(preview).toContain('list:SERVERS');
    });

    it('should generate preview with connection state', () => {
      const rule = {
        action: 'accept' as const,
        connectionState: ['established', 'related'] as ('established' | 'new' | 'related' | 'invalid' | 'untracked')[],
      };

      const preview = generateRulePreview(rule);
      expect(preview).toContain('state:established,related');
    });

    it('should return fallback for empty rule', () => {
      const preview = generateRulePreview({});
      expect(preview).toBe('New filter rule');
    });
  });
});

describe('Default values', () => {
  it('should have correct DEFAULT_FILTER_RULE', () => {
    expect(DEFAULT_FILTER_RULE.chain).toBe('input');
    expect(DEFAULT_FILTER_RULE.action).toBe('accept');
    expect(DEFAULT_FILTER_RULE.disabled).toBe(false);
    expect(DEFAULT_FILTER_RULE.log).toBe(false);
    expect(DEFAULT_FILTER_RULE.protocol).toBe('tcp');
  });
});
