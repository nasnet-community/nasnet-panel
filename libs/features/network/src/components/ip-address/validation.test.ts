/**
 * IP Address Form Validation Tests
 * NAS-6.2: IP Address Management
 */

import { describe, it, expect } from 'vitest';
import { ipAddressFormSchema, type IpAddressFormData } from './validation';

describe('ipAddressFormSchema', () => {
  describe('address field validation', () => {
    it('should accept valid CIDR notation', () => {
      const validData: IpAddressFormData = {
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        disabled: false,
      };

      const result = ipAddressFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept different prefix lengths', () => {
      const testCases = ['10.0.0.1/8', '172.16.0.1/16', '192.168.1.1/24', '192.168.1.1/32'];

      testCases.forEach((address) => {
        const result = ipAddressFormSchema.safeParse({
          address,
          interfaceId: 'ether1',
          disabled: false,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid IP address formats', () => {
      const invalidCases = [
        '256.1.1.1/24', // Invalid octet
        '192.168.1/24', // Missing octet
        '192.168.1.1.1/24', // Too many octets
        'not-an-ip/24', // Invalid format
        '192.168.1.1', // Missing prefix
      ];

      invalidCases.forEach((address) => {
        const result = ipAddressFormSchema.safeParse({
          address,
          interfaceId: 'ether1',
          disabled: false,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid prefix lengths', () => {
      const invalidCases = [
        '192.168.1.1/33', // Too high
        '192.168.1.1/-1', // Negative
        '192.168.1.1/abc', // Not a number
      ];

      invalidCases.forEach((address) => {
        const result = ipAddressFormSchema.safeParse({
          address,
          interfaceId: 'ether1',
          disabled: false,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('interfaceId field validation', () => {
    it('should require interfaceId', () => {
      const result = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        disabled: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['interfaceId']);
      }
    });

    it('should reject empty interfaceId', () => {
      const result = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: '',
        disabled: false,
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid interfaceId', () => {
      const validInterfaces = ['ether1', 'ether2', 'bridge1', 'vlan10', 'wlan1'];

      validInterfaces.forEach((interfaceId) => {
        const result = ipAddressFormSchema.safeParse({
          address: '192.168.1.1/24',
          interfaceId,
          disabled: false,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('comment field validation', () => {
    it('should accept optional comment', () => {
      const result = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        comment: 'Management IP',
        disabled: false,
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty comment', () => {
      const result = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        comment: '',
        disabled: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject comments longer than 255 characters', () => {
      const longComment = 'a'.repeat(256);

      const result = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        comment: longComment,
        disabled: false,
      });

      expect(result.success).toBe(false);
    });

    it('should reject comments with control characters', () => {
      const result = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        comment: 'Test\x00comment', // Null byte
        disabled: false,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('disabled field validation', () => {
    it('should default to false', () => {
      const result = ipAddressFormSchema.parse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
      });

      expect(result.disabled).toBe(false);
    });

    it('should accept boolean values', () => {
      const trueResult = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        disabled: true,
      });

      const falseResult = ipAddressFormSchema.safeParse({
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        disabled: false,
      });

      expect(trueResult.success).toBe(true);
      expect(falseResult.success).toBe(true);
    });
  });

  describe('complete form validation', () => {
    it('should validate a complete valid form', () => {
      const completeData: IpAddressFormData = {
        address: '192.168.1.1/24',
        interfaceId: 'ether1',
        comment: 'Management network IP',
        disabled: false,
      };

      const result = ipAddressFormSchema.safeParse(completeData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toEqual(completeData);
      }
    });

    it('should handle missing optional fields', () => {
      const minimalData: IpAddressFormData = {
        address: '10.0.0.1/8',
        interfaceId: 'ether2',
        disabled: false,
      };

      const result = ipAddressFormSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });
});
