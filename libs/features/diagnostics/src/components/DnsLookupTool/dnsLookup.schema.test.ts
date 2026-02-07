/**
 * DNS Lookup Tool - Schema Validation Tests
 *
 * Unit tests for Zod validation schema covering hostname validation,
 * IPv4/IPv6 validation, record types, and timeout constraints.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.2
 */

import { describe, it, expect } from 'vitest';
import { dnsLookupFormSchema } from './dnsLookup.schema';

describe('dnsLookupFormSchema', () => {
  describe('hostname validation', () => {
    it('should accept valid domain names', () => {
      const validDomains = [
        'google.com',
        'www.example.com',
        'sub.domain.example.co.uk',
        'api-v2.service.example.com',
        '123.example.com',
        'example-123.com',
      ];

      validDomains.forEach((hostname) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname,
          recordType: 'A',
        });
        expect(result.success, `${hostname} should be valid`).toBe(true);
      });
    });

    it('should accept valid IPv4 addresses', () => {
      const validIPs = ['192.168.1.1', '8.8.8.8', '1.1.1.1', '255.255.255.255', '0.0.0.0'];

      validIPs.forEach((hostname) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname,
          recordType: 'PTR',
        });
        expect(result.success, `${hostname} should be valid`).toBe(true);
      });
    });

    it('should accept valid IPv6 addresses', () => {
      const validIPs = [
        '2001:4860:4860::8888',
        'fe80::1',
        '::1',
        '2606:2800:220:1:248:1893:25c8:1946',
        'ff02::1',
      ];

      validIPs.forEach((hostname) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname,
          recordType: 'PTR',
        });
        expect(result.success, `${hostname} should be valid`).toBe(true);
      });
    });

    it('should reject empty hostname', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: '',
        recordType: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Hostname is required');
      }
    });

    it('should reject hostname exceeding 253 characters', () => {
      const longHostname = 'a'.repeat(254) + '.com';
      const result = dnsLookupFormSchema.safeParse({
        hostname: longHostname,
        recordType: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Hostname too long (max 253 characters)');
      }
    });

    it('should reject invalid domain names', () => {
      const invalidDomains = [
        '-example.com', // starts with hyphen
        'example-.com', // ends with hyphen
        'exam ple.com', // contains space
        'example..com', // double dot
        '.example.com', // starts with dot
        'example.com.', // ends with dot
        'exam@ple.com', // invalid character
      ];

      invalidDomains.forEach((hostname) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname,
          recordType: 'A',
        });
        expect(result.success, `${hostname} should be invalid`).toBe(false);
      });
    });

    it('should reject invalid IPv4 addresses', () => {
      const invalidIPs = [
        '256.1.1.1', // octet > 255
        '192.168.1.1.1', // too many octets
        '192.168.-1.1', // negative octet
        '192.168.01.1', // leading zero
      ];

      invalidIPs.forEach((hostname) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname,
          recordType: 'PTR',
        });
        expect(result.success, `${hostname} should be invalid`).toBe(false);
      });
    });

    it('should reject incomplete IP-like hostnames', () => {
      // Note: "192.168.1" looks like an IP (all digits) but has only 3 octets.
      // Since it looks like an IP attempt, we validate it strictly as IPv4 and reject it.
      const result = dnsLookupFormSchema.safeParse({
        hostname: '192.168.1',
        recordType: 'A',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid IPv6 addresses', () => {
      const invalidIPs = [
        '2001:4860:4860::8888::1', // double ::
        '2001:4860:4860:8888:1', // incomplete
        'gggg::1', // invalid hex
        '2001:4860:4860:8888:1:2:3:4:5', // too many segments
      ];

      invalidIPs.forEach((hostname) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname,
          recordType: 'PTR',
        });
        expect(result.success, `${hostname} should be invalid`).toBe(false);
      });
    });
  });

  describe('recordType validation', () => {
    it('should accept all valid record types', () => {
      const validTypes = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'PTR', 'SOA', 'SRV'];

      validTypes.forEach((recordType) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname: 'example.com',
          recordType,
        });
        expect(result.success, `${recordType} should be valid`).toBe(true);
      });
    });

    it('should default to A record type', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recordType).toBe('A');
      }
    });

    it('should reject invalid record types', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('server validation', () => {
    it('should accept valid IPv4 server addresses', () => {
      const validServers = ['8.8.8.8', '1.1.1.1', '192.168.1.1'];

      validServers.forEach((server) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname: 'example.com',
          recordType: 'A',
          server,
        });
        expect(result.success, `${server} should be valid`).toBe(true);
      });
    });

    it('should accept valid IPv6 server addresses', () => {
      const validServers = ['2001:4860:4860::8888', 'fe80::1', '::1'];

      validServers.forEach((server) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname: 'example.com',
          recordType: 'A',
          server,
        });
        expect(result.success, `${server} should be valid`).toBe(true);
      });
    });

    it('should accept "all" as server value', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
        server: 'all',
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined server (optional)', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.server).toBeUndefined();
      }
    });

    it('should reject invalid server addresses', () => {
      const invalidServers = ['invalid', '256.1.1.1', 'example.com'];

      invalidServers.forEach((server) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname: 'example.com',
          recordType: 'A',
          server,
        });
        expect(result.success, `${server} should be invalid`).toBe(false);
      });
    });
  });

  describe('timeout validation', () => {
    it('should accept valid timeout values', () => {
      const validTimeouts = [100, 1000, 2000, 5000, 10000, 30000];

      validTimeouts.forEach((timeout) => {
        const result = dnsLookupFormSchema.safeParse({
          hostname: 'example.com',
          recordType: 'A',
          timeout,
        });
        expect(result.success, `${timeout}ms should be valid`).toBe(true);
      });
    });

    it('should default to 2000ms timeout', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeout).toBe(2000);
      }
    });

    it('should coerce string timeout to number', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
        timeout: '5000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeout).toBe(5000);
        expect(typeof result.data.timeout).toBe('number');
      }
    });

    it('should reject timeout < 100ms', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
        timeout: 50,
      });
      expect(result.success).toBe(false);
    });

    it('should reject timeout > 30000ms', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
        timeout: 31000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer timeout', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
        recordType: 'A',
        timeout: 1500.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('complete form validation', () => {
    it('should accept complete valid form', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'google.com',
        recordType: 'A',
        server: '8.8.8.8',
        timeout: 2000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          hostname: 'google.com',
          recordType: 'A',
          server: '8.8.8.8',
          timeout: 2000,
        });
      }
    });

    it('should accept minimal valid form with defaults', () => {
      const result = dnsLookupFormSchema.safeParse({
        hostname: 'example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hostname).toBe('example.com');
        expect(result.data.recordType).toBe('A');
        expect(result.data.timeout).toBe(2000);
        expect(result.data.server).toBeUndefined();
      }
    });
  });
});
