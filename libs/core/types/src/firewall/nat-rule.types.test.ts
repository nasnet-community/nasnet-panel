import { describe, it, expect } from 'vitest';
import {
  NATRuleInputSchema,
  PortForwardSchema,
  getVisibleFieldsForNATAction,
  generateNATRulePreview,
  generatePortForwardSummary,
  hasPortForwardConflict,
  DEFAULT_MASQUERADE_RULE,
  DEFAULT_PORT_FORWARD,
  type NATRuleInput,
  type PortForward,
  type PortForwardResult,
} from './nat-rule.types';

describe('NAT Rule Types - Schemas', () => {
  describe('NATRuleInputSchema', () => {
    it('should validate a valid masquerade rule', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'masquerade',
        outInterface: 'ether1',
        comment: 'WAN masquerade',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should validate a valid dst-nat rule', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        protocol: 'tcp',
        dstPort: '80',
        toAddresses: '192.168.1.100',
        toPorts: '8080',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should require toAddresses for dst-nat action', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        protocol: 'tcp',
        dstPort: '80',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('toAddresses');
      }
    });

    it('should require toAddresses for src-nat action', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'src-nat',
        srcAddress: '192.168.1.0/24',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('toAddresses');
      }
    });

    it('should require outInterface for masquerade action', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'masquerade',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('outInterface');
      }
    });

    it('should validate port ranges', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        dstPort: '8000-9000',
        toAddresses: '192.168.1.100',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should reject invalid port format', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        dstPort: 'invalid',
        toAddresses: '192.168.1.100',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });

    it('should validate CIDR notation for addresses', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'masquerade',
        srcAddress: '192.168.1.0/24',
        outInterface: 'ether1',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it('should validate single IP addresses', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        dstAddress: '10.0.0.1',
        toAddresses: '192.168.1.100',
      };

      const result = NATRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });
  });

  describe('PortForwardSchema', () => {
    it('should validate a valid port forward', () => {
      const portForward: PortForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
        internalPort: 8080,
        name: 'Web Server',
      };

      const result = PortForwardSchema.safeParse(portForward);
      expect(result.success).toBe(true);
    });

    it('should default to TCP protocol', () => {
      const portForward = {
        externalPort: 80,
        internalIP: '192.168.1.100',
      };

      const result = PortForwardSchema.parse(portForward);
      expect(result.protocol).toBe('tcp');
    });

    it('should reject invalid external port (too low)', () => {
      const portForward = {
        protocol: 'tcp',
        externalPort: 0,
        internalIP: '192.168.1.100',
      };

      const result = PortForwardSchema.safeParse(portForward);
      expect(result.success).toBe(false);
    });

    it('should reject invalid external port (too high)', () => {
      const portForward = {
        protocol: 'tcp',
        externalPort: 65536,
        internalIP: '192.168.1.100',
      };

      const result = PortForwardSchema.safeParse(portForward);
      expect(result.success).toBe(false);
    });

    it('should reject invalid IP address', () => {
      const portForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '999.999.999.999',
      };

      const result = PortForwardSchema.safeParse(portForward);
      expect(result.success).toBe(false);
    });

    it('should allow optional internal port', () => {
      const portForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
        // No internalPort specified
      };

      const result = PortForwardSchema.safeParse(portForward);
      expect(result.success).toBe(true);
    });

    it('should validate name length constraints', () => {
      const tooLongName = 'a'.repeat(101);
      const portForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
        name: tooLongName,
      };

      const result = PortForwardSchema.safeParse(portForward);
      expect(result.success).toBe(false);
    });
  });
});

describe('NAT Rule Types - Helper Functions', () => {
  describe('getVisibleFieldsForNATAction', () => {
    it('should return correct fields for masquerade action', () => {
      const fields = getVisibleFieldsForNATAction('masquerade');

      expect(fields).toContain('chain');
      expect(fields).toContain('action');
      expect(fields).toContain('outInterface');
      expect(fields).toContain('srcAddress');
      expect(fields).not.toContain('toAddresses');
    });

    it('should return correct fields for dst-nat action', () => {
      const fields = getVisibleFieldsForNATAction('dst-nat');

      expect(fields).toContain('chain');
      expect(fields).toContain('action');
      expect(fields).toContain('toAddresses');
      expect(fields).toContain('toPorts');
      expect(fields).toContain('dstPort');
    });

    it('should return correct fields for src-nat action', () => {
      const fields = getVisibleFieldsForNATAction('src-nat');

      expect(fields).toContain('chain');
      expect(fields).toContain('action');
      expect(fields).toContain('toAddresses');
      expect(fields).toContain('outInterface');
      expect(fields).not.toContain('toPorts');
    });

    it('should return base fields for accept action', () => {
      const fields = getVisibleFieldsForNATAction('accept');

      expect(fields).toContain('chain');
      expect(fields).toContain('action');
      expect(fields).toContain('comment');
      expect(fields).not.toContain('toAddresses');
    });
  });

  describe('generateNATRulePreview', () => {
    it('should generate preview for masquerade rule', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'masquerade',
        outInterface: 'ether1',
        comment: 'WAN masquerade',
      };

      const preview = generateNATRulePreview(rule);

      expect(preview).toContain('/ip/firewall/nat/add');
      expect(preview).toContain('chain=srcnat');
      expect(preview).toContain('action=masquerade');
      expect(preview).toContain('out-interface=ether1');
      expect(preview).toContain('comment="WAN masquerade"');
    });

    it('should generate preview for dst-nat rule', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'dstnat',
        action: 'dst-nat',
        protocol: 'tcp',
        dstPort: '80',
        toAddresses: '192.168.1.100',
        toPorts: '8080',
      };

      const preview = generateNATRulePreview(rule);

      expect(preview).toContain('chain=dstnat');
      expect(preview).toContain('action=dst-nat');
      expect(preview).toContain('protocol=tcp');
      expect(preview).toContain('dst-port=80');
      expect(preview).toContain('to-addresses=192.168.1.100');
      expect(preview).toContain('to-ports=8080');
    });

    it('should handle optional fields gracefully', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'masquerade',
        outInterface: 'ether1',
      };

      const preview = generateNATRulePreview(rule);

      expect(preview).toContain('chain=srcnat');
      expect(preview).not.toContain('comment=');
      expect(preview).not.toContain('disabled=yes');
    });

    it('should include disabled flag when set', () => {
      const rule: Partial<NATRuleInput> = {
        chain: 'srcnat',
        action: 'masquerade',
        outInterface: 'ether1',
        disabled: true,
      };

      const preview = generateNATRulePreview(rule);

      expect(preview).toContain('disabled=yes');
    });
  });

  describe('generatePortForwardSummary', () => {
    it('should generate summary for port forward with different internal port', () => {
      const portForward: PortForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
        internalPort: 8080,
      };

      const summary = generatePortForwardSummary(portForward);

      expect(summary).toBe('Forward TCP port 80 to 192.168.1.100:8080');
    });

    it('should generate summary for port forward with same internal port', () => {
      const portForward: PortForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
      };

      const summary = generatePortForwardSummary(portForward);

      expect(summary).toBe('Forward TCP port 80 to 192.168.1.100:80');
    });

    it('should handle UDP protocol', () => {
      const portForward: PortForward = {
        protocol: 'udp',
        externalPort: 53,
        internalIP: '192.168.1.53',
      };

      const summary = generatePortForwardSummary(portForward);

      expect(summary).toContain('UDP');
      expect(summary).toContain('53');
    });
  });

  describe('hasPortForwardConflict', () => {
    const existingForwards: PortForwardResult[] = [
      {
        id: '1',
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
        internalPort: 8080,
        status: 'active',
        natRuleId: 'nat1',
      },
      {
        id: '2',
        protocol: 'udp',
        externalPort: 53,
        internalIP: '192.168.1.53',
        internalPort: 53,
        status: 'active',
        natRuleId: 'nat2',
      },
      {
        id: '3',
        protocol: 'tcp',
        externalPort: 443,
        internalIP: '192.168.1.101',
        internalPort: 443,
        status: 'disabled',
        natRuleId: 'nat3',
      },
    ];

    it('should detect conflict with existing active port forward', () => {
      const newForward: PortForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.200',
      };

      const hasConflict = hasPortForwardConflict(newForward, existingForwards);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict with different protocol', () => {
      const newForward: PortForward = {
        protocol: 'udp',
        externalPort: 80,
        internalIP: '192.168.1.200',
      };

      const hasConflict = hasPortForwardConflict(newForward, existingForwards);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict with different port', () => {
      const newForward: PortForward = {
        protocol: 'tcp',
        externalPort: 8080,
        internalIP: '192.168.1.200',
      };

      const hasConflict = hasPortForwardConflict(newForward, existingForwards);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict with disabled port forward', () => {
      const newForward: PortForward = {
        protocol: 'tcp',
        externalPort: 443,
        internalIP: '192.168.1.200',
      };

      const hasConflict = hasPortForwardConflict(newForward, existingForwards);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict when no existing forwards', () => {
      const newForward: PortForward = {
        protocol: 'tcp',
        externalPort: 80,
        internalIP: '192.168.1.100',
      };

      const hasConflict = hasPortForwardConflict(newForward, []);
      expect(hasConflict).toBe(false);
    });
  });
});

describe('NAT Rule Types - Default Values', () => {
  it('should have correct default masquerade rule', () => {
    expect(DEFAULT_MASQUERADE_RULE.chain).toBe('srcnat');
    expect(DEFAULT_MASQUERADE_RULE.action).toBe('masquerade');
    expect(DEFAULT_MASQUERADE_RULE.disabled).toBe(false);
  });

  it('should have correct default port forward', () => {
    expect(DEFAULT_PORT_FORWARD.protocol).toBe('tcp');
  });
});
