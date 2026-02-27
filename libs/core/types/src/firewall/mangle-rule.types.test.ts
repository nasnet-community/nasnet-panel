/**
 * Mangle Rule Types and Schemas Tests
 *
 * Tests for mangle rule type definitions, validation schemas, and helper functions.
 * Ensures robust validation of mangle rule configuration.
 *
 * @see mangle-rule.types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  MangleChainSchema,
  MangleActionSchema,
  MangleRuleSchema,
  ConnectionStateSchema,
  ConnectionNatStateSchema,
  DEFAULT_MANGLE_RULE,
  isValidMarkName,
  isValidDscp,
  getRequiredFieldsForAction,
  getVisibleFieldsForAction,
  getDscpClass,
  getDscpClassName,
  getDscpDescription,
  DSCP_CLASSES,
  type MangleRule,
} from './mangle-rule.types';

describe('MangleChainSchema', () => {
  it('accepts valid chain values', () => {
    expect(MangleChainSchema.parse('prerouting')).toBe('prerouting');
    expect(MangleChainSchema.parse('input')).toBe('input');
    expect(MangleChainSchema.parse('forward')).toBe('forward');
    expect(MangleChainSchema.parse('output')).toBe('output');
    expect(MangleChainSchema.parse('postrouting')).toBe('postrouting');
  });

  it('rejects invalid chain values', () => {
    expect(() => MangleChainSchema.parse('invalid')).toThrow();
    expect(() => MangleChainSchema.parse('PREROUTING')).toThrow();
    expect(() => MangleChainSchema.parse('')).toThrow();
  });
});

describe('MangleActionSchema', () => {
  it('accepts valid mark actions', () => {
    expect(MangleActionSchema.parse('mark-connection')).toBe('mark-connection');
    expect(MangleActionSchema.parse('mark-packet')).toBe('mark-packet');
    expect(MangleActionSchema.parse('mark-routing')).toBe('mark-routing');
  });

  it('accepts valid QoS/TTL actions', () => {
    expect(MangleActionSchema.parse('change-ttl')).toBe('change-ttl');
    expect(MangleActionSchema.parse('change-dscp')).toBe('change-dscp');
    expect(MangleActionSchema.parse('change-mss')).toBe('change-mss');
  });

  it('accepts valid flow control actions', () => {
    expect(MangleActionSchema.parse('passthrough')).toBe('passthrough');
    expect(MangleActionSchema.parse('accept')).toBe('accept');
    expect(MangleActionSchema.parse('drop')).toBe('drop');
    expect(MangleActionSchema.parse('jump')).toBe('jump');
    expect(MangleActionSchema.parse('log')).toBe('log');
  });

  it('rejects invalid action values', () => {
    expect(() => MangleActionSchema.parse('invalid')).toThrow();
    expect(() => MangleActionSchema.parse('ACCEPT')).toThrow();
    expect(() => MangleActionSchema.parse('')).toThrow();
  });
});

describe('ConnectionStateSchema', () => {
  it('accepts valid connection states', () => {
    expect(ConnectionStateSchema.parse('established')).toBe('established');
    expect(ConnectionStateSchema.parse('new')).toBe('new');
    expect(ConnectionStateSchema.parse('related')).toBe('related');
    expect(ConnectionStateSchema.parse('invalid')).toBe('invalid');
    expect(ConnectionStateSchema.parse('untracked')).toBe('untracked');
  });

  it('rejects invalid connection states', () => {
    expect(() => ConnectionStateSchema.parse('unknown')).toThrow();
    expect(() => ConnectionStateSchema.parse('ESTABLISHED')).toThrow();
  });
});

describe('ConnectionNatStateSchema', () => {
  it('accepts valid NAT states', () => {
    expect(ConnectionNatStateSchema.parse('srcnat')).toBe('srcnat');
    expect(ConnectionNatStateSchema.parse('dstnat')).toBe('dstnat');
  });

  it('rejects invalid NAT states', () => {
    expect(() => ConnectionNatStateSchema.parse('nat')).toThrow();
    expect(() => ConnectionNatStateSchema.parse('SRCNAT')).toThrow();
  });
});

describe('MangleRuleSchema', () => {
  it('validates minimal valid rule', () => {
    const rule = {
      chain: 'prerouting',
      action: 'mark-connection',
    };
    expect(() => MangleRuleSchema.parse(rule)).not.toThrow();
  });

  it('validates complete mark-connection rule', () => {
    const rule: Partial<MangleRule> = {
      chain: 'prerouting',
      action: 'mark-connection',
      protocol: 'tcp',
      srcAddress: '192.168.1.0/24',
      dstPort: '80',
      connectionState: ['new'],
      newConnectionMark: 'web_traffic',
      passthrough: true,
      comment: 'Mark web traffic',
      disabled: false,
    };
    const parsed = MangleRuleSchema.parse(rule);
    expect(parsed.chain).toBe('prerouting');
    expect(parsed.newConnectionMark).toBe('web_traffic');
    expect(parsed.passthrough).toBe(true);
  });

  it('validates mark-packet rule', () => {
    const rule: Partial<MangleRule> = {
      chain: 'forward',
      action: 'mark-packet',
      connectionMark: 'web_traffic',
      newPacketMark: 'high_priority',
      passthrough: false,
    };
    const parsed = MangleRuleSchema.parse(rule);
    expect(parsed.newPacketMark).toBe('high_priority');
  });

  it('validates change-dscp rule', () => {
    const rule: Partial<MangleRule> = {
      chain: 'prerouting',
      action: 'change-dscp',
      newDscp: 46, // EF class
      protocol: 'udp',
      dstPort: '5060-5061',
    };
    const parsed = MangleRuleSchema.parse(rule);
    expect(parsed.newDscp).toBe(46);
  });

  it('validates mark name format (alphanumeric, underscore, hyphen)', () => {
    // Valid mark names
    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'mark-connection',
        newConnectionMark: 'valid_mark-123',
      })
    ).not.toThrow();

    // Invalid characters
    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'mark-connection',
        newConnectionMark: 'invalid mark!',
      })
    ).toThrow();

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'mark-connection',
        newConnectionMark: 'invalid@mark',
      })
    ).toThrow();
  });

  it('validates mark name max length (63 characters)', () => {
    const validName = 'a'.repeat(63);
    const tooLongName = 'a'.repeat(64);

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'mark-connection',
        newConnectionMark: validName,
      })
    ).not.toThrow();

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'mark-connection',
        newConnectionMark: tooLongName,
      })
    ).toThrow();
  });

  it('validates DSCP range (0-63)', () => {
    // Valid DSCP values
    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'change-dscp',
        newDscp: 0,
      })
    ).not.toThrow();

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'change-dscp',
        newDscp: 63,
      })
    ).not.toThrow();

    // Out of range
    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'change-dscp',
        newDscp: -1,
      })
    ).toThrow();

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'change-dscp',
        newDscp: 64,
      })
    ).toThrow();

    // Non-integer
    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'change-dscp',
        newDscp: 46.5,
      })
    ).toThrow();
  });

  it('defaults passthrough to true', () => {
    const rule = MangleRuleSchema.parse({
      chain: 'prerouting',
      action: 'mark-connection',
      newConnectionMark: 'test',
    });
    expect(rule.passthrough).toBe(true);
  });

  it('defaults disabled to false', () => {
    const rule = MangleRuleSchema.parse({
      chain: 'prerouting',
      action: 'accept',
    });
    expect(rule.disabled).toBe(false);
  });

  it('defaults log to false', () => {
    const rule = MangleRuleSchema.parse({
      chain: 'prerouting',
      action: 'accept',
    });
    expect(rule.log).toBe(false);
  });

  it('validates connection state array', () => {
    const rule = MangleRuleSchema.parse({
      chain: 'prerouting',
      action: 'accept',
      connectionState: ['established', 'related'],
    });
    expect(rule.connectionState).toEqual(['established', 'related']);
  });

  it('validates connection NAT state array', () => {
    const rule = MangleRuleSchema.parse({
      chain: 'prerouting',
      action: 'accept',
      connectionNatState: ['srcnat', 'dstnat'],
    });
    expect(rule.connectionNatState).toEqual(['srcnat', 'dstnat']);
  });

  it('validates comment max length (255 characters)', () => {
    const validComment = 'a'.repeat(255);
    const tooLongComment = 'a'.repeat(256);

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'accept',
        comment: validComment,
      })
    ).not.toThrow();

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'accept',
        comment: tooLongComment,
      })
    ).toThrow();
  });

  it('validates log prefix max length (50 characters)', () => {
    const validPrefix = 'a'.repeat(50);
    const tooLongPrefix = 'a'.repeat(51);

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'log',
        logPrefix: validPrefix,
      })
    ).not.toThrow();

    expect(() =>
      MangleRuleSchema.parse({
        chain: 'prerouting',
        action: 'log',
        logPrefix: tooLongPrefix,
      })
    ).toThrow();
  });
});

describe('DEFAULT_MANGLE_RULE', () => {
  it('has correct default values', () => {
    expect(DEFAULT_MANGLE_RULE.chain).toBe('prerouting');
    expect(DEFAULT_MANGLE_RULE.action).toBe('mark-connection');
    expect(DEFAULT_MANGLE_RULE.passthrough).toBe(true);
    expect(DEFAULT_MANGLE_RULE.disabled).toBe(false);
    expect(DEFAULT_MANGLE_RULE.log).toBe(false);
  });
});

describe('isValidMarkName', () => {
  it('accepts valid mark names', () => {
    expect(isValidMarkName('valid_mark')).toBe(true);
    expect(isValidMarkName('valid-mark')).toBe(true);
    expect(isValidMarkName('ValidMark123')).toBe(true);
    expect(isValidMarkName('_underscore')).toBe(true);
    expect(isValidMarkName('hyphen-mark')).toBe(true);
    expect(isValidMarkName('a'.repeat(63))).toBe(true);
  });

  it('rejects invalid mark names', () => {
    expect(isValidMarkName('invalid mark')).toBe(false); // Space
    expect(isValidMarkName('invalid!mark')).toBe(false); // Special char
    expect(isValidMarkName('invalid@mark')).toBe(false); // Special char
    expect(isValidMarkName('a'.repeat(64))).toBe(false); // Too long
    expect(isValidMarkName('')).toBe(false); // Empty
  });
});

describe('isValidDscp', () => {
  it('accepts valid DSCP values', () => {
    expect(isValidDscp(0)).toBe(true);
    expect(isValidDscp(46)).toBe(true);
    expect(isValidDscp(63)).toBe(true);
  });

  it('rejects invalid DSCP values', () => {
    expect(isValidDscp(-1)).toBe(false);
    expect(isValidDscp(64)).toBe(false);
    expect(isValidDscp(46.5)).toBe(false);
    expect(isValidDscp(NaN)).toBe(false);
  });
});

describe('getRequiredFieldsForAction', () => {
  it('returns newConnectionMark for mark-connection', () => {
    expect(getRequiredFieldsForAction('mark-connection')).toEqual(['newConnectionMark']);
  });

  it('returns newPacketMark for mark-packet', () => {
    expect(getRequiredFieldsForAction('mark-packet')).toEqual(['newPacketMark']);
  });

  it('returns newRoutingMark for mark-routing', () => {
    expect(getRequiredFieldsForAction('mark-routing')).toEqual(['newRoutingMark']);
  });

  it('returns newDscp for change-dscp', () => {
    expect(getRequiredFieldsForAction('change-dscp')).toEqual(['newDscp']);
  });

  it('returns newTtl for change-ttl', () => {
    expect(getRequiredFieldsForAction('change-ttl')).toEqual(['newTtl']);
  });

  it('returns newMss for change-mss', () => {
    expect(getRequiredFieldsForAction('change-mss')).toEqual(['newMss']);
  });

  it('returns jumpTarget for jump', () => {
    expect(getRequiredFieldsForAction('jump')).toEqual(['jumpTarget']);
  });

  it('returns empty array for actions without required fields', () => {
    expect(getRequiredFieldsForAction('accept')).toEqual([]);
    expect(getRequiredFieldsForAction('drop')).toEqual([]);
    expect(getRequiredFieldsForAction('passthrough')).toEqual([]);
  });
});

describe('getVisibleFieldsForAction', () => {
  it('returns correct fields for mark-connection', () => {
    const fields = getVisibleFieldsForAction('mark-connection');
    expect(fields).toContain('newConnectionMark');
    expect(fields).toContain('passthrough');
  });

  it('returns correct fields for mark-packet', () => {
    const fields = getVisibleFieldsForAction('mark-packet');
    expect(fields).toContain('newPacketMark');
    expect(fields).toContain('passthrough');
  });

  it('returns correct fields for mark-routing', () => {
    const fields = getVisibleFieldsForAction('mark-routing');
    expect(fields).toContain('newRoutingMark');
    expect(fields).toContain('passthrough');
  });

  it('returns newDscp for change-dscp', () => {
    expect(getVisibleFieldsForAction('change-dscp')).toEqual(['newDscp']);
  });

  it('returns newTtl for change-ttl', () => {
    expect(getVisibleFieldsForAction('change-ttl')).toEqual(['newTtl']);
  });

  it('returns newMss for change-mss', () => {
    expect(getVisibleFieldsForAction('change-mss')).toEqual(['newMss']);
  });

  it('returns jumpTarget for jump', () => {
    expect(getVisibleFieldsForAction('jump')).toEqual(['jumpTarget']);
  });

  it('returns logPrefix for log', () => {
    expect(getVisibleFieldsForAction('log')).toEqual(['logPrefix']);
  });

  it('returns empty array for actions without visible fields', () => {
    expect(getVisibleFieldsForAction('accept')).toEqual([]);
    expect(getVisibleFieldsForAction('drop')).toEqual([]);
  });
});

describe('DSCP_CLASSES', () => {
  it('contains standard DSCP classes', () => {
    expect(DSCP_CLASSES.length).toBeGreaterThan(0);
  });

  it('includes Best Effort (0)', () => {
    const be = DSCP_CLASSES.find((c) => c.value === 0);
    expect(be).toBeDefined();
    expect(be?.name).toBe('BE / CS0');
  });

  it('includes Expedited Forwarding (46)', () => {
    const ef = DSCP_CLASSES.find((c) => c.value === 46);
    expect(ef).toBeDefined();
    expect(ef?.name).toBe('EF');
    expect(ef?.description).toContain('Expedited Forwarding');
  });

  it('includes Class Selector values', () => {
    const cs1 = DSCP_CLASSES.find((c) => c.value === 8);
    const cs2 = DSCP_CLASSES.find((c) => c.value === 16);
    const cs3 = DSCP_CLASSES.find((c) => c.value === 24);

    expect(cs1).toBeDefined();
    expect(cs2).toBeDefined();
    expect(cs3).toBeDefined();
  });

  it('includes Assured Forwarding values', () => {
    const af11 = DSCP_CLASSES.find((c) => c.value === 10);
    const af21 = DSCP_CLASSES.find((c) => c.value === 18);
    const af31 = DSCP_CLASSES.find((c) => c.value === 26);

    expect(af11).toBeDefined();
    expect(af21).toBeDefined();
    expect(af31).toBeDefined();
  });

  it('all entries have required fields', () => {
    DSCP_CLASSES.forEach((dscpClass) => {
      expect(dscpClass.value).toBeGreaterThanOrEqual(0);
      expect(dscpClass.value).toBeLessThanOrEqual(63);
      expect(dscpClass.name).toBeTruthy();
      expect(dscpClass.description).toBeTruthy();
      expect(dscpClass.useCase).toBeTruthy();
    });
  });
});

describe('getDscpClass', () => {
  it('returns DSCP class for valid value', () => {
    const ef = getDscpClass(46);
    expect(ef).toBeDefined();
    expect(ef?.name).toBe('EF');
  });

  it('returns undefined for unknown value', () => {
    expect(getDscpClass(99)).toBeUndefined();
    expect(getDscpClass(1)).toBeUndefined(); // Not a standard class
  });
});

describe('getDscpClassName', () => {
  it('returns formatted name for known DSCP value', () => {
    expect(getDscpClassName(46)).toBe('46 - EF');
    expect(getDscpClassName(0)).toBe('0 - BE / CS0');
  });

  it('returns numeric value for unknown DSCP value', () => {
    expect(getDscpClassName(99)).toBe('99');
    expect(getDscpClassName(1)).toBe('1');
  });
});

describe('getDscpDescription', () => {
  it('returns full description for known DSCP value', () => {
    const desc = getDscpDescription(46);
    expect(desc).toContain('46');
    expect(desc).toContain('EF');
    expect(desc).toContain('Expedited Forwarding');
    expect(desc).toContain('VoIP');
  });

  it('returns numeric value for unknown DSCP value', () => {
    expect(getDscpDescription(99)).toBe('99');
  });
});
