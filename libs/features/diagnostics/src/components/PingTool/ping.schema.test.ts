/**
 * Tests for ping form validation schema
 */
import { describe, it, expect } from 'vitest';
import { pingFormSchema, type PingFormValues } from './ping.schema';

describe('pingFormSchema', () => {
  describe('target validation', () => {
    it('should accept valid IPv4 addresses', () => {
      const valid = ['8.8.8.8', '192.168.1.1', '10.0.0.1', '172.16.0.1'];
      valid.forEach((target) => {
        const result = pingFormSchema.safeParse({ target });
        expect(result.success, `${target} should be valid`).toBe(true);
      });
    });

    it('should accept valid IPv6 addresses', () => {
      const valid = ['2001:4860:4860::8888', '::1', '::', 'fe80::1', '2001:db8::1'];
      valid.forEach((target) => {
        const result = pingFormSchema.safeParse({ target });
        expect(result.success, `${target} should be valid`).toBe(true);
      });
    });

    it('should accept valid hostnames', () => {
      const valid = [
        'google.com',
        'www.example.com',
        'localhost',
        'router',
        'dns.google',
        'my-server.local',
      ];
      valid.forEach((target) => {
        const result = pingFormSchema.safeParse({ target });
        expect(result.success, `${target} should be valid`).toBe(true);
      });
    });

    it('should reject invalid targets', () => {
      const invalid = [
        'not valid',
        'example..com',
        '-invalid.com',
        'invalid-.com',
        'gggg::1', // Invalid IPv6
        'example_underscore.com', // Underscore not allowed
      ];
      invalid.forEach((target) => {
        const result = pingFormSchema.safeParse({ target });
        expect(result.success, `${target} should be invalid`).toBe(false);
      });
    });

    it('should provide meaningful error message for invalid target', () => {
      const result = pingFormSchema.safeParse({ target: 'not valid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('IPv4, IPv6');
      }
    });

    it('should require target field', () => {
      const result = pingFormSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Required');
      }
    });
  });

  describe('count validation', () => {
    it('should accept valid count values', () => {
      const valid = [1, 5, 10, 50, 100];
      valid.forEach((count) => {
        const result = pingFormSchema.safeParse({ target: '8.8.8.8', count });
        expect(result.success, `count ${count} should be valid`).toBe(true);
      });
    });

    it('should use default count of 10 when not provided', () => {
      const result = pingFormSchema.parse({ target: '8.8.8.8' });
      expect(result.count).toBe(10);
    });

    it('should reject count < 1', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        count: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject count > 100', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        count: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should coerce string count to number', () => {
      const result = pingFormSchema.parse({
        target: '8.8.8.8',
        count: '25' as any,
      });
      expect(result.count).toBe(25);
      expect(typeof result.count).toBe('number');
    });

    it('should reject non-integer count', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        count: 10.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('size validation', () => {
    it('should accept valid size values', () => {
      const valid = [56, 100, 1000, 65500];
      valid.forEach((size) => {
        const result = pingFormSchema.safeParse({ target: '8.8.8.8', size });
        expect(result.success, `size ${size} should be valid`).toBe(true);
      });
    });

    it('should use default size of 56 when not provided', () => {
      const result = pingFormSchema.parse({ target: '8.8.8.8' });
      expect(result.size).toBe(56);
    });

    it('should reject size < 56', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        size: 55,
      });
      expect(result.success).toBe(false);
    });

    it('should reject size > 65500', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        size: 65501,
      });
      expect(result.success).toBe(false);
    });

    it('should coerce string size to number', () => {
      const result = pingFormSchema.parse({
        target: '8.8.8.8',
        size: '128' as any,
      });
      expect(result.size).toBe(128);
    });
  });

  describe('timeout validation', () => {
    it('should accept valid timeout values', () => {
      const valid = [100, 1000, 5000, 30000];
      valid.forEach((timeout) => {
        const result = pingFormSchema.safeParse({
          target: '8.8.8.8',
          timeout,
        });
        expect(result.success, `timeout ${timeout} should be valid`).toBe(true);
      });
    });

    it('should use default timeout of 1000 when not provided', () => {
      const result = pingFormSchema.parse({ target: '8.8.8.8' });
      expect(result.timeout).toBe(1000);
    });

    it('should reject timeout < 100', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 99,
      });
      expect(result.success).toBe(false);
    });

    it('should reject timeout > 30000', () => {
      const result = pingFormSchema.safeParse({
        target: '8.8.8.8',
        timeout: 30001,
      });
      expect(result.success).toBe(false);
    });

    it('should coerce string timeout to number', () => {
      const result = pingFormSchema.parse({
        target: '8.8.8.8',
        timeout: '2000' as any,
      });
      expect(result.timeout).toBe(2000);
    });
  });

  describe('sourceInterface validation', () => {
    it('should accept optional sourceInterface', () => {
      const result = pingFormSchema.parse({
        target: '8.8.8.8',
        sourceInterface: 'eth0',
      });
      expect(result.sourceInterface).toBe('eth0');
    });

    it('should allow undefined sourceInterface', () => {
      const result = pingFormSchema.parse({ target: '8.8.8.8' });
      expect(result.sourceInterface).toBeUndefined();
    });

    it('should accept empty string for sourceInterface', () => {
      const result = pingFormSchema.parse({
        target: '8.8.8.8',
        sourceInterface: '',
      });
      expect(result.sourceInterface).toBe('');
    });
  });

  describe('complete form validation', () => {
    it('should accept complete valid form', () => {
      const formData: PingFormValues = {
        target: '8.8.8.8',
        count: 20,
        size: 64,
        timeout: 2000,
        sourceInterface: 'eth0',
      };
      const result = pingFormSchema.parse(formData);
      expect(result).toEqual(formData);
    });

    it('should accept minimal valid form with defaults', () => {
      const result = pingFormSchema.parse({ target: 'google.com' });
      expect(result).toEqual({
        target: 'google.com',
        count: 10,
        size: 56,
        timeout: 1000,
        sourceInterface: undefined,
      });
    });

    it('should validate IPv6 with full form', () => {
      const result = pingFormSchema.parse({
        target: '2001:4860:4860::8888',
        count: 5,
        size: 128,
        timeout: 3000,
      });
      expect(result.target).toBe('2001:4860:4860::8888');
      expect(result.count).toBe(5);
    });
  });
});
