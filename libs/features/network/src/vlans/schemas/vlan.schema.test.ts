/**
 * Unit Tests for VLAN Schema Validation
 */

import { vlanSchema, getVlanWarnings } from './vlan.schema';

describe('vlanSchema', () => {
  describe('name validation', () => {
    it('should accept valid VLAN names', () => {
      const validNames = [
        'vlan-10',
        'guest_network',
        'VLAN100',
        'iot-devices',
        'management_vlan',
      ];

      validNames.forEach((name) => {
        const result = vlanSchema.safeParse({
          name,
          vlanId: 10,
          interface: 'bridge1',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid VLAN names', () => {
      const invalidNames = [
        'vlan 10', // space
        'vlan@10', // special char
        'vlan.10', // dot not allowed
        '', // empty
      ];

      invalidNames.forEach((name) => {
        const result = vlanSchema.safeParse({
          name,
          vlanId: 10,
          interface: 'bridge1',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject names longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = vlanSchema.safeParse({
        name: longName,
        vlanId: 10,
        interface: 'bridge1',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('100');
    });
  });

  describe('vlanId validation', () => {
    it('should accept valid VLAN IDs (1-4094)', () => {
      const validIds = [1, 10, 100, 1000, 4094];

      validIds.forEach((vlanId) => {
        const result = vlanSchema.safeParse({
          name: 'vlan-test',
          vlanId,
          interface: 'bridge1',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject VLAN ID 0', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 0,
        interface: 'bridge1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject VLAN ID above 4094', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 4095,
        interface: 'bridge1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative VLAN IDs', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: -1,
        interface: 'bridge1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer VLAN IDs', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10.5,
        interface: 'bridge1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('interface validation', () => {
    it('should require parent interface', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid interface names', () => {
      const validInterfaces = ['bridge1', 'ether1', 'ether2'];

      validInterfaces.forEach((interface_) => {
        const result = vlanSchema.safeParse({
          name: 'vlan-test',
          vlanId: 10,
          interface: interface_,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('mtu validation', () => {
    it('should accept valid MTU values (68-65535)', () => {
      const validMtus = [68, 1500, 9000, 65535];

      validMtus.forEach((mtu) => {
        const result = vlanSchema.safeParse({
          name: 'vlan-test',
          vlanId: 10,
          interface: 'bridge1',
          mtu,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject MTU below 68', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        mtu: 67,
      });
      expect(result.success).toBe(false);
    });

    it('should reject MTU above 65535', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        mtu: 65536,
      });
      expect(result.success).toBe(false);
    });

    it('should accept null/undefined MTU', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        mtu: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('comment validation', () => {
    it('should accept valid comments', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        comment: 'Guest network VLAN',
      });
      expect(result.success).toBe(true);
    });

    it('should reject comments longer than 255 characters', () => {
      const longComment = 'a'.repeat(256);
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        comment: longComment,
      });
      expect(result.success).toBe(false);
    });

    it('should accept null/undefined comment', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        comment: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('disabled flag', () => {
    it('should default to false', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
      });
      expect(result.success).toBe(true);
      expect(result.data?.disabled).toBe(false);
    });

    it('should accept true', () => {
      const result = vlanSchema.safeParse({
        name: 'vlan-test',
        vlanId: 10,
        interface: 'bridge1',
        disabled: true,
      });
      expect(result.success).toBe(true);
      expect(result.data?.disabled).toBe(true);
    });
  });
});

describe('getVlanWarnings', () => {
  it('should warn for VLAN ID 1 (default VLAN)', () => {
    const warnings = getVlanWarnings({
      name: 'vlan-test',
      vlanId: 1,
      interface: 'bridge1',
      disabled: false,
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('VLAN 1');
    expect(warnings[0]).toContain('default');
  });

  it('should warn for VLAN ID 4095 (reserved)', () => {
    const warnings = getVlanWarnings({
      name: 'vlan-test',
      vlanId: 4095,
      interface: 'bridge1',
      disabled: false,
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('4095');
    expect(warnings[0]).toContain('reserved');
  });

  it('should warn for MTU > 9000', () => {
    const warnings = getVlanWarnings({
      name: 'vlan-test',
      vlanId: 10,
      interface: 'bridge1',
      mtu: 10000,
      disabled: false,
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('9000');
  });

  it('should return no warnings for normal VLAN', () => {
    const warnings = getVlanWarnings({
      name: 'vlan-test',
      vlanId: 10,
      interface: 'bridge1',
      mtu: 1500,
      disabled: false,
    });

    expect(warnings).toHaveLength(0);
  });

  it('should return multiple warnings when applicable', () => {
    const warnings = getVlanWarnings({
      name: 'vlan-test',
      vlanId: 1,
      interface: 'bridge1',
      mtu: 10000,
      disabled: false,
    });

    expect(warnings).toHaveLength(2);
  });
});
