/**
 * DNS Static Entry Schema Unit Tests
 *
 * Tests for DNS static entry validation schema with RFC 1123 hostname validation.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { describe, it, expect } from 'vitest';
import {
  dnsStaticEntrySchema,
  type DNSStaticEntryFormValues,
} from './dns-static-entry.schema';

describe('dnsStaticEntrySchema', () => {
  describe('hostname validation (RFC 1123)', () => {
    it('should accept valid RFC 1123 hostnames', () => {
      const validHostnames = [
        'nas.local',
        'my-server.lan',
        'printer.office.local',
        'webserver',
        'host-123',
        'a.b.c.d.e',
        'test123.example.com',
        '123host.local', // Can start with digit
        'a', // Single character
        '1', // Single digit
        'example-123.test-456.local', // Multiple hyphens
      ];

      validHostnames.forEach((hostname) => {
        const entry: DNSStaticEntryFormValues = {
          name: hostname,
          address: '192.168.1.1',
          ttl: 86400,
        };

        const result = dnsStaticEntrySchema.safeParse(entry);
        expect(result.success).toBe(true);
      });
    });

    it('should reject hostnames starting with hyphen', () => {
      const entry = {
        name: '-invalid.local',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid hostname');
      }
    });

    it('should reject hostnames ending with hyphen', () => {
      const entry = {
        name: 'invalid-.local',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid hostname');
      }
    });

    it('should reject hostnames starting with dot', () => {
      const entry = {
        name: '.starts-with-dot',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it('should reject hostnames ending with dot', () => {
      const entry = {
        name: 'ends-with-dot.',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it('should reject hostnames with consecutive dots', () => {
      const entry = {
        name: 'bad..double.local',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it('should reject hostnames with spaces', () => {
      const entry = {
        name: 'has space',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it('should reject hostnames with special characters', () => {
      const invalidHostnames = [
        'has@symbol',
        'bad_underscore',
        'no#hash',
        'no$dollar',
        'no%percent',
      ];

      invalidHostnames.forEach((hostname) => {
        const entry = {
          name: hostname,
          address: '192.168.1.1',
          ttl: 86400,
        };

        const result = dnsStaticEntrySchema.safeParse(entry);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty hostname', () => {
      const entry = {
        name: '',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject hostname exceeding 253 characters', () => {
      const entry = {
        name: 'a'.repeat(254), // Too long
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('too long');
      }
    });

    it('should accept hostname at max length (253 characters)', () => {
      const entry: DNSStaticEntryFormValues = {
        name: 'a'.repeat(253), // Max length
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  describe('IP address validation', () => {
    it('should accept valid IPv4 addresses', () => {
      const validAddresses = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '1.1.1.1',
        '8.8.8.8',
        '255.255.255.255',
        '0.0.0.0',
      ];

      validAddresses.forEach((address) => {
        const entry: DNSStaticEntryFormValues = {
          name: 'test.local',
          address,
          ttl: 86400,
        };

        const result = dnsStaticEntrySchema.safeParse(entry);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid IPv4 addresses', () => {
      const invalidAddresses = [
        '256.1.1.1', // Octet > 255
        '1.1.1', // Missing octet
        '1.1.1.1.1', // Too many octets
        'not-an-ip',
        '1.1.1.1a',
        '1.1.1.-1',
        '',
        '2001:db8::1', // IPv6 (we only support IPv4)
      ];

      invalidAddresses.forEach((address) => {
        const entry = {
          name: 'test.local',
          address,
          ttl: 86400,
        };

        const result = dnsStaticEntrySchema.safeParse(entry);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid IPv4');
        }
      });
    });
  });

  describe('TTL validation', () => {
    it('should accept valid TTL values', () => {
      const validTTLs = [
        0, // Minimum
        60, // 1 minute
        3600, // 1 hour
        86400, // 1 day (default)
        604800, // 7 days (maximum)
      ];

      validTTLs.forEach((ttl) => {
        const entry: DNSStaticEntryFormValues = {
          name: 'test.local',
          address: '192.168.1.1',
          ttl,
        };

        const result = dnsStaticEntrySchema.safeParse(entry);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative TTL', () => {
      const entry = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: -1,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject TTL exceeding 7 days (604800 seconds)', () => {
      const entry = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: 604801, // One second over max
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('7 days');
      }
    });

    it('should apply default TTL of 86400 seconds (1 day)', () => {
      const entryWithoutTTL = {
        name: 'test.local',
        address: '192.168.1.1',
      };

      const result = dnsStaticEntrySchema.safeParse(entryWithoutTTL);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ttl).toBe(86400);
      }
    });
  });

  describe('comment validation', () => {
    it('should accept valid comments', () => {
      const entry: DNSStaticEntryFormValues = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: 86400,
        comment: 'This is a test DNS entry',
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should accept empty comment', () => {
      const entry: DNSStaticEntryFormValues = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: 86400,
        comment: '',
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should accept undefined comment', () => {
      const entry: DNSStaticEntryFormValues = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: 86400,
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should reject comment exceeding 255 characters', () => {
      const entry = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: 86400,
        comment: 'a'.repeat(256), // Too long
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it('should accept comment at max length (255 characters)', () => {
      const entry: DNSStaticEntryFormValues = {
        name: 'test.local',
        address: '192.168.1.1',
        ttl: 86400,
        comment: 'a'.repeat(255),
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  describe('full validation', () => {
    it('should accept complete valid entry with all fields', () => {
      const entry: DNSStaticEntryFormValues = {
        name: 'nas.local',
        address: '192.168.1.50',
        ttl: 3600,
        comment: 'NAS server for local network',
      };

      const result = dnsStaticEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(entry);
      }
    });

    it('should require name and address fields', () => {
      const missingName = {
        address: '192.168.1.1',
        ttl: 86400,
      };

      const missingAddress = {
        name: 'test.local',
        ttl: 86400,
      };

      expect(dnsStaticEntrySchema.safeParse(missingName).success).toBe(false);
      expect(dnsStaticEntrySchema.safeParse(missingAddress).success).toBe(false);
    });

    it('should report all validation errors at once', () => {
      const invalidEntry = {
        name: '-invalid', // Invalid hostname
        address: '256.256.256.256', // Invalid IP
        ttl: -1, // Invalid TTL
        comment: 'a'.repeat(256), // Too long comment
      };

      const result = dnsStaticEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple errors
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });
});
