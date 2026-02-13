/**
 * Route Lookup Tool - Validation Schema Tests
 *
 * Unit tests for route lookup form validation schema
 *
 * @see Story NAS-6.10 - Implement Route Lookup Diagnostic - Task 8
 */

import { describe, it, expect } from 'vitest';
import { routeLookupFormSchema } from './routeLookup.schema';

describe('routeLookupFormSchema', () => {
  describe('destination field', () => {
    it('should accept valid IPv4 addresses', () => {
      const validIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '8.8.8.8',
        '255.255.255.255',
        '0.0.0.0',
        '172.16.0.1',
      ];

      validIPs.forEach((ip) => {
        const result = routeLookupFormSchema.safeParse({ destination: ip });
        expect(result.success, `Expected ${ip} to be valid`).toBe(true);
      });
    });

    it('should reject invalid IPv4 addresses', () => {
      const invalidIPs = [
        '256.1.1.1', // Octet > 255
        '192.168.1', // Missing octet
        '192.168.1.1.1', // Too many octets
        '192.168.01.1', // Leading zero
        '192.168.-1.1', // Negative number
        'not-an-ip', // Not an IP
        '192.168.1.1/24', // CIDR notation
        '2001:db8::1', // IPv6
      ];

      invalidIPs.forEach((ip) => {
        const result = routeLookupFormSchema.safeParse({ destination: ip });
        expect(result.success, `Expected ${ip} to be invalid`).toBe(false);
      });
    });

    it('should require destination field', () => {
      const result = routeLookupFormSchema.safeParse({ destination: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });
  });

  describe('source field', () => {
    it('should accept valid IPv4 addresses', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: '8.8.8.8',
        source: '192.168.1.100',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty source (optional)', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: '8.8.8.8',
        source: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined source', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: '8.8.8.8',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: '8.8.8.8',
        source: '256.1.1.1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid IPv4');
      }
    });
  });

  describe('complete form validation', () => {
    it('should validate complete form with source', () => {
      const validForm = {
        destination: '8.8.8.8',
        source: '192.168.1.100',
      };
      const result = routeLookupFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination).toBe('8.8.8.8');
        expect(result.data.source).toBe('192.168.1.100');
      }
    });

    it('should validate complete form without source', () => {
      const validForm = {
        destination: '8.8.8.8',
      };
      const result = routeLookupFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination).toBe('8.8.8.8');
        expect(result.data.source).toBeUndefined();
      }
    });

    it('should provide clear error messages', () => {
      const invalidForm = {
        destination: '999.999.999.999',
        source: 'not-an-ip',
      };
      const result = routeLookupFormSchema.safeParse(invalidForm);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0].message).toMatch(/valid IPv4/i);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in IP addresses', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: ' 192.168.1.1 ',
      });
      // Should fail because whitespace makes it invalid
      expect(result.success).toBe(false);
    });

    it('should reject CIDR notation', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: '192.168.1.0/24',
      });
      expect(result.success).toBe(false);
    });

    it('should reject IPv6 addresses', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: '2001:db8::1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject hostnames', () => {
      const result = routeLookupFormSchema.safeParse({
        destination: 'google.com',
      });
      expect(result.success).toBe(false);
    });
  });
});
