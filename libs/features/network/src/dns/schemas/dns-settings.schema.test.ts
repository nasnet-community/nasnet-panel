/**
 * DNS Settings Schema Unit Tests
 *
 * Tests for DNS settings validation schema.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { describe, it, expect } from 'vitest';
import {
  dnsServerSchema,
  dnsSettingsSchema,
  type DNSSettingsFormValues,
} from './dns-settings.schema';

describe('dnsServerSchema', () => {
  it('should accept valid IPv4 addresses', () => {
    const validAddresses = [
      '1.1.1.1',
      '8.8.8.8',
      '192.168.1.1',
      '10.0.0.1',
      '172.16.0.1',
      '255.255.255.255',
      '0.0.0.0',
    ];

    validAddresses.forEach((address) => {
      const result = dnsServerSchema.safeParse(address);
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
      '   ',
      '2001:db8::1', // IPv6 (we only support IPv4)
    ];

    invalidAddresses.forEach((address) => {
      const result = dnsServerSchema.safeParse(address);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid IPv4');
      }
    });
  });
});

describe('dnsSettingsSchema', () => {
  it('should accept valid DNS settings', () => {
    const validSettings: DNSSettingsFormValues = {
      servers: ['1.1.1.1', '8.8.8.8'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    };

    const result = dnsSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it('should accept empty servers array', () => {
    const settings: DNSSettingsFormValues = {
      servers: [],
      allowRemoteRequests: false,
      cacheSize: 2048,
    };

    const result = dnsSettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
  });

  it('should reject invalid IP addresses in servers array', () => {
    const invalidSettings = {
      servers: ['1.1.1.1', '256.256.256.256'], // Second IP is invalid
      allowRemoteRequests: false,
      cacheSize: 2048,
    };

    const result = dnsSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it('should reject cache size below minimum (512)', () => {
    const invalidSettings = {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 256, // Below minimum
    };

    const result = dnsSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('cacheSize');
    }
  });

  it('should reject cache size above maximum (10240)', () => {
    const invalidSettings = {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 20480, // Above maximum
    };

    const result = dnsSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('cacheSize');
    }
  });

  it('should accept cache size at boundaries', () => {
    const minSettings = {
      servers: [],
      allowRemoteRequests: false,
      cacheSize: 512, // Minimum
    };

    const maxSettings = {
      servers: [],
      allowRemoteRequests: false,
      cacheSize: 10240, // Maximum
    };

    expect(dnsSettingsSchema.safeParse(minSettings).success).toBe(true);
    expect(dnsSettingsSchema.safeParse(maxSettings).success).toBe(true);
  });

  it('should validate allowRemoteRequests as boolean', () => {
    const trueSettings = {
      servers: [],
      allowRemoteRequests: true,
      cacheSize: 2048,
    };

    const falseSettings = {
      servers: [],
      allowRemoteRequests: false,
      cacheSize: 2048,
    };

    expect(dnsSettingsSchema.safeParse(trueSettings).success).toBe(true);
    expect(dnsSettingsSchema.safeParse(falseSettings).success).toBe(true);

    // Non-boolean should fail
    const invalidSettings = {
      servers: [],
      allowRemoteRequests: 'yes', // Not a boolean
      cacheSize: 2048,
    };

    expect(dnsSettingsSchema.safeParse(invalidSettings).success).toBe(false);
  });

  it('should require all fields', () => {
    const missingServers = {
      allowRemoteRequests: false,
      cacheSize: 2048,
    };

    const missingAllowRemote = {
      servers: [],
      cacheSize: 2048,
    };

    const missingCacheSize = {
      servers: [],
      allowRemoteRequests: false,
    };

    expect(dnsSettingsSchema.safeParse(missingServers).success).toBe(false);
    expect(dnsSettingsSchema.safeParse(missingAllowRemote).success).toBe(false);
    expect(dnsSettingsSchema.safeParse(missingCacheSize).success).toBe(false);
  });
});
