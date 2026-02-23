/**
 * Traceroute Schema Validation Tests
 *
 * Tests for the Zod validation schema covering:
 * - Valid IPv4/IPv6/hostname inputs
 * - Invalid target formats
 * - Range validation for maxHops, timeout, probeCount
 * - Protocol enum validation
 * - Default values
 * - Error message specificity
 */

import { describe, it, expect } from 'vitest';
import { tracerouteFormSchema, TracerouteProtocolEnum } from './traceroute.schema';
import type { TracerouteFormValues } from './traceroute.schema';

describe('tracerouteFormSchema', () => {
  describe('Target Validation', () => {
    describe('IPv4 Addresses', () => {
      it('should accept valid IPv4 address', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '8.8.8.8',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid IPv4 with different octets', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '192.168.1.1',
        });
        expect(result.success).toBe(true);
      });

      it('should accept 0.0.0.0', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '0.0.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept 255.255.255.255', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '255.255.255.255',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('IPv6 Addresses', () => {
      it('should accept full IPv6 address', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '2001:4860:4860::8888',
        });
        expect(result.success).toBe(true);
      });

      it('should accept compressed IPv6', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '::1',
        });
        expect(result.success).toBe(true);
      });

      it('should accept IPv6 loopback', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '::ffff:127.0.0.1',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Hostnames', () => {
      it('should accept simple hostname', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'google.com',
        });
        expect(result.success).toBe(true);
      });

      it('should accept FQDN', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'dns.google.com',
        });
        expect(result.success).toBe(true);
      });

      it('should accept localhost', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'localhost',
        });
        expect(result.success).toBe(true);
      });

      it('should accept hostname with hyphens', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'my-router.local',
        });
        expect(result.success).toBe(true);
      });

      it('should accept single letter hostname', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'a',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid Targets', () => {
      it('should reject empty target', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid IPv4 (too large octet)', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '256.1.1.1',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid IPv4 (missing octet)', () => {
        const result = tracerouteFormSchema.safeParse({
          target: '192.168.1',
        });
        expect(result.success).toBe(false);
      });

      it('should reject target exceeding 255 characters', () => {
        const longTarget = 'a'.repeat(256);
        const result = tracerouteFormSchema.safeParse({
          target: longTarget,
        });
        expect(result.success).toBe(false);
      });

      it('should reject special characters in hostname', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'my@router.com',
        });
        expect(result.success).toBe(false);
      });

      it('should reject spaces in target', () => {
        const result = tracerouteFormSchema.safeParse({
          target: 'google .com',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Max Hops Validation', () => {
    it('should accept valid maxHops value', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 30,
      });
      expect(result.success).toBe(true);
    });

    it('should use default maxHops of 30', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxHops).toBe(30);
      }
    });

    it('should accept minimum maxHops (1)', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should accept maximum maxHops (64)', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 64,
      });
      expect(result.success).toBe(true);
    });

    it('should reject maxHops below 1', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject maxHops above 64', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 65,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer maxHops', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 30.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Timeout Validation', () => {
    it('should accept valid timeout value', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 3000,
      });
      expect(result.success).toBe(true);
    });

    it('should use default timeout of 3000ms', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeout).toBe(3000);
      }
    });

    it('should accept minimum timeout (100ms)', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should accept maximum timeout (30000ms)', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 30000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject timeout below 100ms', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 99,
      });
      expect(result.success).toBe(false);
    });

    it('should reject timeout above 30000ms', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 30001,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer timeout', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 3000.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Probe Count Validation', () => {
    it('should accept valid probeCount value', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        probeCount: 3,
      });
      expect(result.success).toBe(true);
    });

    it('should use default probeCount of 3', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.probeCount).toBe(3);
      }
    });

    it('should accept minimum probeCount (1)', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        probeCount: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should accept maximum probeCount (5)', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        probeCount: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject probeCount below 1', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        probeCount: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject probeCount above 5', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        probeCount: 6,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer probeCount', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        probeCount: 3.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Protocol Validation', () => {
    it('should accept ICMP protocol', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        protocol: 'ICMP',
      });
      expect(result.success).toBe(true);
    });

    it('should accept UDP protocol', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        protocol: 'UDP',
      });
      expect(result.success).toBe(true);
    });

    it('should accept TCP protocol', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        protocol: 'TCP',
      });
      expect(result.success).toBe(true);
    });

    it('should use default protocol ICMP', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.protocol).toBe('ICMP');
      }
    });

    it('should reject invalid protocol', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        protocol: 'INVALID' as any,
      });
      expect(result.success).toBe(false);
    });

    it('should reject lowercase protocol', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        protocol: 'icmp' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Complete Valid Input', () => {
    it('should accept complete valid traceroute form', () => {
      const input: TracerouteFormValues = {
        target: '8.8.8.8',
        maxHops: 30,
        timeout: 3000,
        probeCount: 3,
        protocol: 'ICMP',
      };
      const result = tracerouteFormSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept minimal valid traceroute form (target only)', () => {
      const input = {
        target: 'google.com',
      };
      const result = tracerouteFormSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxHops).toBe(30);
        expect(result.data.timeout).toBe(3000);
        expect(result.data.probeCount).toBe(3);
        expect(result.data.protocol).toBe('ICMP');
      }
    });
  });

  describe('TracerouteProtocolEnum', () => {
    it('should have enum with ICMP, UDP, TCP', () => {
      const result = TracerouteProtocolEnum.safeParse('ICMP');
      expect(result.success).toBe(true);

      const result2 = TracerouteProtocolEnum.safeParse('UDP');
      expect(result2.success).toBe(true);

      const result3 = TracerouteProtocolEnum.safeParse('TCP');
      expect(result3.success).toBe(true);
    });

    it('should reject invalid protocol values', () => {
      const result = TracerouteProtocolEnum.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide specific error for empty target', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
      }
    });

    it('should provide specific error for invalid target format', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '256.256.256.256',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid');
      }
    });

    it('should provide specific error for maxHops out of range', () => {
      const result = tracerouteFormSchema.safeParse({
        target: '8.8.8.8',
        maxHops: 100,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
      }
    });
  });
});
