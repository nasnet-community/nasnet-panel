// =============================================================================
// MAC Vendor Lookup Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import { lookupVendor, isValidMac, formatMac } from './macVendorLookup';

describe('lookupVendor', () => {
  it('should lookup Apple vendor from colon-separated MAC', () => {
    expect(lookupVendor('AC:DE:48:12:34:56')).toBe('Apple Inc.');
    expect(lookupVendor('F0:18:98:AA:BB:CC')).toBe('Apple Inc.');
  });

  it('should lookup MikroTik vendor from various prefixes', () => {
    expect(lookupVendor('00:0F:E2:12:34:56')).toBe('MikroTik');
    expect(lookupVendor('48:8F:5A:AA:BB:CC')).toBe('MikroTik');
    expect(lookupVendor('6C:3B:6B:11:22:33')).toBe('MikroTik');
    expect(lookupVendor('CC:2D:E0:44:55:66')).toBe('MikroTik');
  });

  it('should lookup Samsung vendor', () => {
    expect(lookupVendor('00:1A:8A:12:34:56')).toBe('Samsung Electronics');
  });

  it('should lookup Intel vendor', () => {
    expect(lookupVendor('00:03:47:12:34:56')).toBe('Intel Corporation');
  });

  it('should handle dash-separated MAC addresses', () => {
    expect(lookupVendor('AC-DE-48-12-34-56')).toBe('Apple Inc.');
    expect(lookupVendor('00-0F-E2-12-34-56')).toBe('MikroTik');
  });

  it('should handle MAC addresses without separators', () => {
    expect(lookupVendor('ACDE48123456')).toBe('Apple Inc.');
    expect(lookupVendor('000FE2123456')).toBe('MikroTik');
  });

  it('should be case insensitive', () => {
    expect(lookupVendor('ac:de:48:12:34:56')).toBe('Apple Inc.');
    expect(lookupVendor('AC:de:48:12:34:56')).toBe('Apple Inc.');
    expect(lookupVendor('acde48123456')).toBe('Apple Inc.');
  });

  it('should return null for unknown vendors', () => {
    expect(lookupVendor('AA:BB:CC:DD:EE:FF')).toBeNull();
    expect(lookupVendor('FF:FF:FF:FF:FF:FF')).toBeNull();
  });

  it('should return null for invalid MAC addresses', () => {
    expect(lookupVendor('')).toBeNull();
    expect(lookupVendor('invalid')).toBeNull();
    expect(lookupVendor('12:34')).toBeNull();
  });

  it('should handle VMware vendor', () => {
    expect(lookupVendor('00:0C:29:12:34:56')).toBe('VMware Inc.');
    expect(lookupVendor('00:50:56:AA:BB:CC')).toBe('VMware Inc.');
  });

  it('should handle Raspberry Pi vendor', () => {
    expect(lookupVendor('B8:27:EB:12:34:56')).toBe('Raspberry Pi Foundation');
    expect(lookupVendor('DC:A6:32:AA:BB:CC')).toBe('Raspberry Pi Foundation');
  });

  it('should handle Oracle VirtualBox vendor', () => {
    expect(lookupVendor('08:00:27:12:34:56')).toBe('Oracle VirtualBox');
  });
});

describe('isValidMac', () => {
  it('should validate colon-separated MAC addresses', () => {
    expect(isValidMac('00:0F:E2:12:34:56')).toBe(true);
    expect(isValidMac('AC:DE:48:AB:CD:EF')).toBe(true);
  });

  it('should validate dash-separated MAC addresses', () => {
    expect(isValidMac('00-0F-E2-12-34-56')).toBe(true);
    expect(isValidMac('AC-DE-48-AB-CD-EF')).toBe(true);
  });

  it('should validate MAC addresses without separators', () => {
    expect(isValidMac('000FE2123456')).toBe(true);
    expect(isValidMac('ACDE48ABCDEF')).toBe(true);
  });

  it('should accept both uppercase and lowercase', () => {
    expect(isValidMac('00:0f:e2:12:34:56')).toBe(true);
    expect(isValidMac('ac:de:48:ab:cd:ef')).toBe(true);
    expect(isValidMac('000fe2123456')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidMac('')).toBe(false);
    expect(isValidMac('invalid')).toBe(false);
    expect(isValidMac('12:34:56')).toBe(false);
    expect(isValidMac('ZZ:ZZ:ZZ:ZZ:ZZ:ZZ')).toBe(false);
    expect(isValidMac('00:0F:E2:12:34')).toBe(false); // Too short
    expect(isValidMac('00:0F:E2:12:34:56:78')).toBe(false); // Too long
  });
});

describe('formatMac', () => {
  it('should format colon-separated MAC to uppercase', () => {
    expect(formatMac('00:0f:e2:12:34:56')).toBe('00:0F:E2:12:34:56');
    expect(formatMac('ac:de:48:ab:cd:ef')).toBe('AC:DE:48:AB:CD:EF');
  });

  it('should format dash-separated MAC to colon-separated uppercase', () => {
    expect(formatMac('00-0F-E2-12-34-56')).toBe('00:0F:E2:12:34:56');
    expect(formatMac('ac-de-48-ab-cd-ef')).toBe('AC:DE:48:AB:CD:EF');
  });

  it('should format MAC without separators to colon-separated uppercase', () => {
    expect(formatMac('000FE2123456')).toBe('00:0F:E2:12:34:56');
    expect(formatMac('acde48abcdef')).toBe('AC:DE:48:AB:CD:EF');
  });

  it('should return null for invalid MAC addresses', () => {
    expect(formatMac('')).toBeNull();
    expect(formatMac('invalid')).toBeNull();
    expect(formatMac('12:34:56')).toBeNull();
    expect(formatMac('ZZ:ZZ:ZZ:ZZ:ZZ:ZZ')).toBeNull();
  });

  it('should handle mixed case and formats', () => {
    expect(formatMac('Ac:De:48:Ab:Cd:Ef')).toBe('AC:DE:48:AB:CD:EF');
    expect(formatMac('ac-DE-48-ab-CD-ef')).toBe('AC:DE:48:AB:CD:EF');
    expect(formatMac('AcDe48AbCdEf')).toBe('AC:DE:48:AB:CD:EF');
  });
});
